import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  query, 
  where, 
  onSnapshot,
  FirestoreError,
  DocumentData,
  QueryConstraint,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firebaseService = {
  async getDocument<T = DocumentData>(path: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, path, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as T) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${path}/${id}`);
      return null;
    }
  },

  async setDocument<T extends DocumentData>(path: string, id: string, data: T): Promise<void> {
    try {
      const docRef = doc(db, path, id);
      await setDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${id}`);
    }
  },

  async updateDocument<T extends DocumentData>(path: string, id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, path, id);
      await updateDoc(docRef, data as DocumentData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
    }
  },

  async deleteDocument(path: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, path, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
    }
  },

  async addDocument<T extends DocumentData>(path: string, data: T): Promise<string> {
    try {
      const colRef = collection(db, path);
      const docRef = await addDoc(colRef, data);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return '';
    }
  },

  async batchAddDocuments<T extends DocumentData>(path: string, items: T[]): Promise<void> {
    try {
      const colRef = collection(db, path);
      // Firestore batch size limit is 500
      const BATCH_SIZE = 400;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = items.slice(i, i + BATCH_SIZE);
        chunk.forEach(item => {
          const docRef = doc(colRef);
          batch.set(docRef, { ...item, id: docRef.id });
        });
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateMultipleDocuments<T extends DocumentData>(path: string, updates: { id: string, data: Partial<T> }[]): Promise<void> {
    try {
      const BATCH_SIZE = 400;
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = updates.slice(i, i + BATCH_SIZE);
        chunk.forEach(update => {
          const docRef = doc(db, path, update.id);
          batch.update(docRef, update.data as DocumentData);
        });
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getCollection<T = DocumentData>(path: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const colRef = collection(db, path);
      const q = query(colRef, ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  subscribeToCollection<T = DocumentData>(
    path: string, 
    constraints: QueryConstraint[], 
    onNext: (data: T[]) => void
  ) {
    const colRef = collection(db, path);
    const q = query(colRef, ...constraints);
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      onNext(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};
