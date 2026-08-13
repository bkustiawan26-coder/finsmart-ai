import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  PieChart, 
  Plus, 
  MessageSquare, 
  User as UserIcon, 
  LogOut, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  ChevronRight,
  Bell,
  Search,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CreditCard,
  Activity,
  ArrowRight,
  Sparkles,
  X,
  Trash2,
  Edit2,
  Filter,
  ChevronDown,
  History,
  Users,
  Sun,
  Moon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';
import { Toaster, toast } from 'sonner';
import { Transaction, TransactionType, UserProfile, Budget, SavingGoal, HealthScoreBreakdown, Changelog } from './types';
import ErrorBoundary from './components/ErrorBoundary';
import AddTransactionModal from './components/AddTransactionModal';
import AIAdvisorChat from './components/AIAdvisorChat';
import BudgetModal from './components/BudgetModal';
import { AIBudgetModal } from './components/AIBudgetModal';
import GoalModal from './components/GoalModal';
import ConfirmationDialog from './components/ConfirmationDialog';
import ProfileSettingsModal from './components/ProfileSettingsModal';
import ChangelogModal from './components/ChangelogModal';
import LoginScreen from './components/LoginScreen';
import Logo from './components/Logo';
import { cn } from './lib/utils';
import { FinanceLogic } from './lib/financeLogic';
import { DummyDataGenerator } from './lib/dummyData';
import { firebaseService, OperationType, handleFirestoreError } from './services/firebaseService';

// --- Components ---

const GlassCard = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div 
    whileHover={onClick ? { scale: 1.01 } : {}}
    whileTap={onClick ? { scale: 0.99 } : {}}
    onClick={onClick}
    className={cn(
      "bg-card backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-[28px] shadow-sm",
      className
    )}
  >
    {children}
  </motion.div>
);

const GradientButton = ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all",
      className
    )}
  >
    {children}
  </button>
);

// --- Main App Component ---

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [logs, setLogs] = useState<Changelog[]>([]);
  
  // Derived Data
  const totals = useMemo(() => FinanceLogic.calculateTotals(transactions), [transactions]);
  const trend = useMemo(() => FinanceLogic.analyzeMonthlyTrend(transactions), [transactions]);
  
  const enrichedBudgets = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyExpenses = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return tx.type === TransactionType.EXPENSE && txDate >= startOfMonth;
    });

    return budgets.map(budget => ({
      ...budget,
      spent: monthlyExpenses
        .filter(tx => tx.category === budget.category)
        .reduce((acc, tx) => acc + tx.amount, 0)
    }));
  }, [transactions, budgets]);

  const healthBreakdown = useMemo(() => 
    FinanceLogic.calculateHealthScore(transactions, enrichedBudgets, profile?.financialHealthScore), 
    [transactions, enrichedBudgets, profile]
  );
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isAIBudgetModalOpen, setIsAIBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalSection, setProfileModalSection] = useState<'info' | 'payment' | 'settings' | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Filter States
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterDateRange, setFilterDateRange] = useState<'ALL' | '7D' | '30D' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });
  const [isDarkMode, setIsDarkMode] = useState(false);

  const addLog = async (action: string, details: string, type: Changelog['type']) => {
    if (!user) return;
    try {
      await firebaseService.addDocument(`users/${user.uid}/changelogs`, {
        userId: user.uid,
        action,
        details,
        type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to add log:", error);
    }
  };

  // --- Theme Management ---
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      let effectiveTheme = theme;
      if (theme === 'system') {
        effectiveTheme = mediaQuery.matches ? 'dark' : 'light';
      }

      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setIsDarkMode(false);
      }
    };

    applyTheme();
    localStorage.setItem('theme', theme);

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          setIsDarkMode(true);
        } else {
          document.documentElement.classList.remove('dark');
          setIsDarkMode(false);
        }
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'system') return 'dark';
      if (prev === 'dark') return 'light';
      return 'system';
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 19) return "Selamat Sore";
    return "Selamat Malam";
  };

  // Unique Categories for Filter
  const uniqueCategories = useMemo(() => {
    const categories = new Set(transactions.map(tx => tx.category));
    return ['ALL', ...Array.from(categories)];
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Type Filter
      if (filterType !== 'ALL' && tx.type !== filterType) return false;

      // Category Filter
      if (filterCategory !== 'ALL' && tx.category !== filterCategory) return false;

      // Date Filter
      const txDate = new Date(tx.date);
      const now = new Date();
      
      if (filterDateRange === '7D') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        if (txDate < sevenDaysAgo) return false;
      } else if (filterDateRange === '30D') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (txDate < thirtyDaysAgo) return false;
      } else if (filterDateRange === 'CUSTOM') {
        if (customStartDate && txDate < new Date(customStartDate)) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (txDate > end) return false;
        }
      }

      return true;
    });
  }, [transactions, filterType, filterCategory, filterDateRange, customStartDate, customEndDate]);

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // --- Sync Hardware Back Button ---
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If we have state, it means we navigated within the app
      if (event.state) {
        const state = event.state;
        if (state.showAllTransactions !== undefined) setShowAllTransactions(state.showAllTransactions);
        if (state.activeTab !== undefined) setActiveTab(state.activeTab);
        if (state.isAIChatOpen !== undefined) setIsAIChatOpen(state.isAIChatOpen);
        if (state.isAddModalOpen !== undefined) setIsAddModalOpen(state.isAddModalOpen);
        if (state.isBudgetModalOpen !== undefined) setIsBudgetModalOpen(state.isBudgetModalOpen);
        if (state.isAIBudgetModalOpen !== undefined) setIsAIBudgetModalOpen(state.isAIBudgetModalOpen);
        if (state.isGoalModalOpen !== undefined) setIsGoalModalOpen(state.isGoalModalOpen);
        if (state.isProfileModalOpen !== undefined) setIsProfileModalOpen(state.isProfileModalOpen);
      } else {
        // Default state
        setShowAllTransactions(false);
        setIsAIChatOpen(false);
        setIsAddModalOpen(false);
        setIsBudgetModalOpen(false);
        setIsGoalModalOpen(false);
        setIsProfileModalOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Helper to push state when navigation changes
  const pushNavigationState = (updates: any) => {
    const currentState = {
      showAllTransactions,
      activeTab,
      isAIChatOpen,
      isAddModalOpen,
      isBudgetModalOpen,
      isAIBudgetModalOpen,
      isGoalModalOpen,
      isProfileModalOpen,
      ...updates
    };
    window.history.pushState(currentState, '');
  };

  // Wrap state setters to push history
  const handleSetShowAllTransactions = (val: boolean) => {
    if (val !== showAllTransactions) {
      setShowAllTransactions(val);
      if (val) pushNavigationState({ showAllTransactions: true });
    }
  };

  const handleSetActiveTab = (val: string) => {
    if (val !== activeTab) {
      setActiveTab(val);
      pushNavigationState({ activeTab: val });
    }
  };

  const handleSetIsAIChatOpen = (val: boolean) => {
    if (val !== isAIChatOpen) {
      setIsAIChatOpen(val);
      if (val) pushNavigationState({ isAIChatOpen: true });
    }
  };

  const handleSetIsAddModalOpen = (val: boolean) => {
    if (val !== isAddModalOpen) {
      setIsAddModalOpen(val);
      if (val) pushNavigationState({ isAddModalOpen: true });
    }
  };

  const handleSetIsBudgetModalOpen = (val: boolean) => {
    if (val !== isBudgetModalOpen) {
      setIsBudgetModalOpen(val);
      if (val) pushNavigationState({ isBudgetModalOpen: true });
    }
  };

  const handleSetIsAIBudgetModalOpen = (val: boolean) => {
    if (val !== isAIBudgetModalOpen) {
      setIsAIBudgetModalOpen(val);
      if (val) pushNavigationState({ isAIBudgetModalOpen: true });
    }
  };

  const handleSetIsGoalModalOpen = (val: boolean) => {
    if (val !== isGoalModalOpen) {
      setIsGoalModalOpen(val);
      if (val) pushNavigationState({ isGoalModalOpen: true });
    }
  };

  const handleSetIsProfileModalOpen = (val: boolean) => {
    if (val !== isProfileModalOpen) {
      setIsProfileModalOpen(val);
      if (val) pushNavigationState({ isProfileModalOpen: true });
    }
  };

  const handleSetIsChangelogModalOpen = (val: boolean) => {
    if (val !== isChangelogModalOpen) {
      setIsChangelogModalOpen(val);
      if (val) pushNavigationState({ isChangelogModalOpen: true });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let unsubTrans: () => void;
    let unsubBudget: () => void;
    let unsubGoal: () => void;
    let unsubLogs: () => void;

    const initData = async () => {
      try {
        // Fetch or create profile
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          const existingProfile = data as UserProfile;
          
          // Ensure all required fields exist
          const completeProfile: UserProfile = {
            uid: existingProfile.uid || user.uid,
            displayName: existingProfile.displayName || user.displayName || 'User',
            email: existingProfile.email || user.email || '',
            photoURL: existingProfile.photoURL || user.photoURL || null,
            phoneNumber: existingProfile.phoneNumber || user.phoneNumber || null,
            language: existingProfile.language || 'id',
            theme: existingProfile.theme || 'system',
            financialHealthScore: existingProfile.financialHealthScore || 75,
            ...existingProfile
          };
          
          setProfile(completeProfile);

          // If any required field was missing, update it in Firestore to prevent future rule failures
          const requiredFields = ['uid', 'displayName', 'language', 'theme'];
          const isMissingFields = requiredFields.some(field => !(field in data));
          if (isMissingFields) {
            const cleanProfile = Object.fromEntries(
              Object.entries(completeProfile).filter(([_, v]) => v !== undefined)
            );
            try {
              await setDoc(profileRef, cleanProfile, { merge: true });
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, profileRef.path);
            }
          }
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || null,
            phoneNumber: user.phoneNumber || null,
            language: 'id',
            theme: 'system',
            financialHealthScore: 75,
          };
          
          // Clean profile to remove undefined values
          const cleanProfile = Object.fromEntries(
            Object.entries(newProfile).filter(([_, v]) => v !== undefined)
          );
          
          try {
            await setDoc(profileRef, cleanProfile);
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, profileRef.path);
          }
          setProfile(newProfile);
        }

        // Subscriptions
        unsubTrans = firebaseService.subscribeToCollection<Transaction>(
          `users/${user.uid}/transactions`,
          [orderBy('date', 'desc'), limit(1000)],
          (data) => setTransactions(data)
        );

        unsubBudget = firebaseService.subscribeToCollection<Budget>(
          `users/${user.uid}/budgets`,
          [],
          (data) => setBudgets(data)
        );

        unsubGoal = firebaseService.subscribeToCollection<SavingGoal>(
          `users/${user.uid}/savingGoals`,
          [],
          (data) => setGoals(data)
        );

        unsubLogs = firebaseService.subscribeToCollection<Changelog>(
          `users/${user.uid}/changelogs`,
          [orderBy('timestamp', 'desc'), limit(1000)],
          (data) => setLogs(data)
        );

      } catch (error) {
        console.error("Error initializing user data:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();

    return () => {
      if (unsubTrans) unsubTrans();
      if (unsubBudget) unsubBudget();
      if (unsubGoal) unsubGoal();
      if (unsubLogs) unsubLogs();
    };
  }, [user]);

  const handleLogout = () => signOut(auth);

  const handleSaveTransaction = async (data: any) => {
    if (!user) return;
    try {
      // Clean data to remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      
      if (cleanData.id) {
        const { id, ...rest } = cleanData;
        await firebaseService.updateDocument(`users/${user.uid}/transactions`, id as string, {
          ...rest,
          userId: user.uid,
        });
        await addLog("Update Transaksi", `${rest.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran'} ${rest.category}: Rp ${rest.amount.toLocaleString()}`, 'transaction');
        toast.success("Transaksi berhasil diperbarui");
      } else {
        const { id, ...rest } = cleanData;
        await firebaseService.addDocument(`users/${user.uid}/transactions`, {
          ...rest,
          userId: user.uid,
        });
        await addLog("Tambah Transaksi", `${rest.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran'} ${rest.category}: Rp ${rest.amount.toLocaleString()}`, 'transaction');
        toast.success("Transaksi berhasil ditambahkan");
      }
      setEditingTransaction(null);
    } catch (error) {
      console.error("Failed to save transaction", error);
      toast.error("Gagal menyimpan transaksi");
    }
  };

  const handleImportTransactions = async (importedTransactions: Partial<Transaction>[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const collectionRef = collection(db, `users/${user.uid}/transactions`);
      
      importedTransactions.forEach((tx) => {
        const docRef = doc(collectionRef);
        batch.set(docRef, {
          ...tx,
          userId: user.uid,
          id: docRef.id
        });
      });

      await batch.commit();
      await addLog("Impor Transaksi", `Berhasil mengimpor ${importedTransactions.length} transaksi via CSV`, 'transaction');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/transactions`);
      throw error;
    }
  };

  const handleUpdateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      // Clean data to remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );
      
      await firebaseService.updateDocument('users', user.uid, cleanData);
      await addLog("Update Profil", "Memperbarui informasi profil pengguna", 'profile');
      setProfile(prev => prev ? { ...prev, ...cleanData } : null);
    } catch (error) {
      console.error("Failed to update profile", error);
      throw error;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    setConfirmation({
      isOpen: true,
      title: "Hapus Transaksi?",
      message: "Apakah Anda yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan.",
      variant: 'danger',
      onConfirm: async () => {
        try {
          const txToDelete = transactions.find(t => t.id === id);
          await firebaseService.deleteDocument(`users/${user.uid}/transactions`, id);
          if (txToDelete) {
            await addLog("Hapus Transaksi", `${txToDelete.type === TransactionType.INCOME ? 'Pemasukan' : 'Pengeluaran'} ${txToDelete.category}: Rp ${txToDelete.amount.toLocaleString()}`, 'transaction');
          }
          toast.success("Transaksi berhasil dihapus");
        } catch (error) {
          console.error("Failed to delete transaction", error);
          toast.error("Gagal menghapus transaksi");
        }
      }
    });
  };

  const handleSaveBudget = async (data: any) => {
    if (!user) return;
    try {
      if (data.id) {
        await firebaseService.updateDocument(`users/${user.uid}/budgets`, data.id, {
          category: data.category,
          limit: data.limit,
        });
        await addLog("Update Anggaran", `Mengubah limit ${data.category} menjadi Rp ${data.limit.toLocaleString()}`, 'budget');
        toast.success("Anggaran berhasil diperbarui");
      } else {
        const existingBudget = budgets.find(b => b.category === data.category);
        if (existingBudget) {
          await firebaseService.updateDocument(`users/${user.uid}/budgets`, existingBudget.id, {
            limit: data.limit,
          });
          await addLog("Update Anggaran", `Mengubah limit ${data.category} menjadi Rp ${data.limit.toLocaleString()}`, 'budget');
          toast.success("Anggaran berhasil diperbarui");
        } else {
          await firebaseService.addDocument(`users/${user.uid}/budgets`, {
            ...data,
            userId: user.uid,
          });
          await addLog("Tambah Anggaran", `Membuat anggaran ${data.category} sebesar Rp ${data.limit.toLocaleString()}`, 'budget');
          toast.success("Anggaran berhasil disimpan");
        }
      }
      setEditingBudget(null);
    } catch (error) {
      console.error("Failed to save budget", error);
      toast.error("Gagal menyimpan anggaran");
    }
  };

  const handleSaveGoal = async (data: any) => {
    if (!user) return;
    try {
      await firebaseService.addDocument(`users/${user.uid}/savingGoals`, {
        ...data,
        userId: user.uid,
      });
      toast.success("Tujuan menabung berhasil disimpan");
    } catch (error) {
      console.error("Failed to save goal", error);
      toast.error("Gagal menyimpan tujuan menabung");
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!user) return;
    setConfirmation({
      isOpen: true,
      title: "Hapus Anggaran?",
      message: "Apakah Anda yakin ingin menghapus anggaran ini?",
      variant: 'danger',
      onConfirm: async () => {
        try {
          const budgetToDelete = budgets.find(b => b.id === id);
          await firebaseService.deleteDocument(`users/${user.uid}/budgets`, id);
          if (budgetToDelete) {
            await addLog("Hapus Anggaran", `Menghapus anggaran kategori ${budgetToDelete.category}`, 'budget');
          }
          toast.success("Anggaran berhasil dihapus");
        } catch (error) {
          console.error("Failed to delete budget", error);
          toast.error("Gagal menghapus anggaran");
        }
      }
    });
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user) return;
    setConfirmation({
      isOpen: true,
      title: "Hapus Tujuan Menabung?",
      message: "Apakah Anda yakin ingin menghapus tujuan menabung ini?",
      variant: 'danger',
      onConfirm: async () => {
        try {
          await firebaseService.deleteDocument(`users/${user.uid}/savingGoals`, id);
          toast.success("Tujuan menabung berhasil dihapus");
        } catch (error) {
          console.error("Failed to delete goal", error);
          toast.error("Gagal menghapus tujuan menabung");
        }
      }
    });
  };

  const handleUpdateGoalAmount = async (id: string, currentAmount: number, addAmount: number) => {
    if (!user) return;
    try {
      await firebaseService.updateDocument(`users/${user.uid}/savingGoals`, id, {
        currentAmount: currentAmount + addAmount
      });
      toast.success(`Berhasil menambah Rp ${addAmount.toLocaleString()} ke tabungan!`);
    } catch (error) {
      console.error("Failed to update goal amount", error);
      toast.error("Gagal memperbarui saldo tabungan");
    }
  };

  const handleGenerateDummyData = async () => {
    if (!user) return;
    try {
      const dummyTx = DummyDataGenerator.generateTransactions(user.uid);
      const dummyBudgets = DummyDataGenerator.generateBudgets(user.uid);
      const dummyGoals = DummyDataGenerator.generateGoals(user.uid);

      // Save to Firestore using batches
      const savePromise = (async () => {
        try {
          await firebaseService.batchAddDocuments(`users/${user.uid}/transactions`, dummyTx);
          await firebaseService.batchAddDocuments(`users/${user.uid}/budgets`, dummyBudgets);
          await firebaseService.batchAddDocuments(`users/${user.uid}/savingGoals`, dummyGoals);
          await addLog("Data Dummy", `Berhasil membuat ${dummyTx.length} transaksi, ${dummyBudgets.length} anggaran, dan ${dummyGoals.length} tujuan menabung`, 'system');
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
          throw error;
        }
      })();

      toast.promise(savePromise, {
        loading: 'Membuat data dummy...',
        success: 'Data dummy berhasil dibuat!',
        error: 'Gagal membuat data dummy'
      });
    } catch (error) {
      console.error("Failed to generate dummy data", error);
      toast.error("Gagal membuat data dummy");
    }
  };

  // --- Derived Data ---

  const balance = totals.balance;

  const reportTransactions = useMemo(() => {
    if (reportPeriod === 'all') {
      return transactions;
    }

    const now = new Date();
    const cutoff = new Date();
    
    if (reportPeriod === 'week') {
      // Start of current week (Monday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      cutoff.setDate(diff);
      cutoff.setHours(0, 0, 0, 0);
    } else {
      // Start of current month
      cutoff.setDate(1);
      cutoff.setHours(0, 0, 0, 0);
    }
    
    return transactions.filter(tx => new Date(tx.date) >= cutoff);
  }, [transactions, reportPeriod]);

  const filteredTotals = useMemo(() => FinanceLogic.calculateTotals(reportTransactions), [reportTransactions]);
  const mostExpensive = useMemo(() => FinanceLogic.getMostExpensiveCategory(reportTransactions), [reportTransactions]);

  // Update Financial Health Score when data changes - Debounced/Conditional
  useEffect(() => {
    if (!user || !profile) return;
    
    // Only update if the score has changed significantly (by more than 1 point)
    // or if the breakdown is missing.
    const hasChangedSignificantly = Math.abs(healthBreakdown.score - profile.financialHealthScore) >= 1;
    const isBreakdownMissing = !profile.healthBreakdown;

    if (hasChangedSignificantly || isBreakdownMissing) {
      const timer = setTimeout(() => {
        firebaseService.updateDocument('users', user.uid, { 
          financialHealthScore: healthBreakdown.score,
          healthBreakdown: healthBreakdown
        }).catch(err => console.error("Error updating health score:", err));
      }, 2000); // Debounce for 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [healthBreakdown.score, user, profile?.financialHealthScore]);

  // Sync Budget Spending to Firestore (Background) - Optimized
  useEffect(() => {
    if (!user || enrichedBudgets.length === 0) return;

    const updates = enrichedBudgets
      .map(budget => {
        const originalBudget = budgets.find(b => b.id === budget.id);
        // Only update if spent has changed significantly (e.g., more than 1000 IDR)
        // to avoid constant small writes
        if (originalBudget && Math.abs(budget.spent - originalBudget.spent) > 0) {
          return { id: budget.id, data: { spent: budget.spent } };
        }
        return null;
      })
      .filter((update): update is { id: string, data: { spent: number } } => update !== null);

    if (updates.length > 0) {
      const timer = setTimeout(() => {
        firebaseService.updateMultipleDocuments(`users/${user.uid}/budgets`, updates)
          .catch(err => console.error("Error syncing budgets to DB:", err));
      }, 5000); // Batch updates every 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [enrichedBudgets, user, budgets]);

  const chartData = useMemo(() => {
    const categories: Record<string, number> = {};
    reportTransactions.filter(tx => tx.type === TransactionType.EXPENSE).forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [reportTransactions]);

  const CATEGORY_COLORS: Record<string, string> = {
    'Tagihan': '#3B82F6',
    'Makanan': '#6366F1',
    'Lainnya': '#A855F7',
    'Belanja': '#EC4899',
    'Lain': '#EF4444',
    'Keluarga': '#F97316',
    'Liburan': '#EAB308',
    'Kesehatan': '#06B6D4',
    'Transportasi': '#1E40AF',
    'Rumah': '#8B5CF6',
    'Investasi': '#10B981',
    'Gaji': '#10B981',
    'Bonus': '#F59E0B',
    'Hadiah': '#EC4899'
  };

  const getCategoryColor = (category: string) => CATEGORY_COLORS[category] || '#94A3B8';

  // --- Renderers ---

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Total Balance Card */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 rounded-[32px] text-white shadow-2xl shadow-blue-200 dark:shadow-none"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-24 -mb-24 blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <span className="text-blue-100 text-sm font-medium tracking-wide uppercase">Total Saldo</span>
            <CreditCard className="w-6 h-6 text-blue-200 opacity-50" />
          </div>
          <h1 className="text-4xl font-bold mb-8 tracking-tight">Rp {balance.toLocaleString()}</h1>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownLeft className="w-4 h-4 text-green-300" />
                <span className="text-blue-100 text-xs font-medium">Pemasukan</span>
              </div>
              <p className="text-lg font-bold">Rp {totals.income.toLocaleString()}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="w-4 h-4 text-red-300" />
                <span className="text-blue-100 text-xs font-medium">Pengeluaran</span>
              </div>
              <p className="text-lg font-bold">Rp {totals.expense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Financial Health Score - Simplified for Dashboard */}
      <GlassCard 
        className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/20 dark:to-blue-950/20 border-teal-100 dark:border-teal-900/30 cursor-pointer"
        onClick={() => handleSetActiveTab('health')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200 dark:shadow-none">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Financial Health</h3>
              <div className="flex items-center gap-2">
                <p className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  healthBreakdown.status === 'Baik' ? "text-teal-600 dark:text-teal-400" : 
                  healthBreakdown.status === 'Cukup' ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                )}>
                  {healthBreakdown.status}
                </p>
                {healthBreakdown.trend !== 'stable' && (
                  <div className={cn(
                    "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    healthBreakdown.trend === 'up' ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300" : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                  )}>
                    {healthBreakdown.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {healthBreakdown.previousScore ? Math.abs(healthBreakdown.score - healthBreakdown.previousScore) : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            <div>
              <span className="text-3xl font-black text-teal-600 dark:text-teal-400">{healthBreakdown.score}</span>
              <span className="text-xs text-muted font-bold ml-1">/100</span>
            </div>
            <ChevronRight className="w-5 h-5 text-teal-600/50 dark:text-teal-400/50" />
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${healthBreakdown.score}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={cn(
              "h-full rounded-full",
              healthBreakdown.status === 'Baik' ? "bg-teal-500" : 
              healthBreakdown.status === 'Cukup' ? "bg-amber-500" : "bg-red-500"
            )}
          />
        </div>
      </GlassCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: Wallet, label: 'Transfer', color: 'bg-blue-500', action: () => handleSetIsAddModalOpen(true) },
          { icon: CreditCard, label: 'Tagihan', color: 'bg-indigo-500', action: () => handleSetIsAddModalOpen(true) },
          { icon: Target, label: 'Tujuan', color: 'bg-purple-500', action: () => handleSetIsGoalModalOpen(true) },
          { icon: Settings, label: 'Anggaran', color: 'bg-gray-500', action: () => handleSetIsBudgetModalOpen(true) },
        ].map((action, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <button 
              onClick={action.action}
              className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform active:scale-90", action.color)}
            >
              <action.icon className="w-6 h-6" />
            </button>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{action.label}</span>
          </div>
        ))}
      </div>

      {/* Saving Goals */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-foreground">Tujuan Menabung</h3>
          <button 
            onClick={() => handleSetIsGoalModalOpen(true)}
            className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-1"
          >
            Tambah <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
          {goals.length > 0 ? goals.map((goal) => (
            <GlassCard key={goal.id} className="p-5 min-w-[260px] border-transparent hover:border-blue-100 dark:hover:border-blue-900 transition-all group relative">
              <button 
                onClick={() => handleDeleteGoal(goal.id)}
                className="absolute top-2 right-2 p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-foreground truncate">{goal.title}</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted uppercase">Progres</span>
                  <span className="text-blue-600 dark:text-blue-400">{((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                  />
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-[10px] text-muted font-bold uppercase">Target: Rp {goal.targetAmount.toLocaleString()}</p>
                  <button 
                    onClick={() => handleUpdateGoalAmount(goal.id, goal.currentAmount, 50000)}
                    className="bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg shadow-blue-100 dark:shadow-none"
                  >
                    +50k
                  </button>
                </div>
              </div>
            </GlassCard>
          )) : (
            <div className="w-full text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-[28px] border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-muted font-medium text-sm">Belum ada tujuan menabung</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-foreground">Transaksi Terakhir</h3>
          <button 
            onClick={() => handleSetShowAllTransactions(true)}
            className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-1"
          >
            Lihat Semua <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          {transactions.length > 0 ? transactions.slice(0, 5).map((tx) => (
            <GlassCard key={tx.id} className="p-4 flex items-center justify-between hover:bg-white dark:hover:bg-gray-800 transition-colors border-transparent hover:border-gray-100 dark:hover:border-gray-800">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                  tx.type === TransactionType.INCOME ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                )}>
                  {tx.type === TransactionType.INCOME ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{tx.category}</h4>
                  <p className="text-xs text-muted font-medium">{tx.description || 'Tanpa deskripsi'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className={cn(
                    "font-bold",
                    tx.type === TransactionType.INCOME ? "text-green-600 dark:text-green-400" : "text-foreground"
                  )}>
                    {tx.type === TransactionType.INCOME ? '+' : '-'} Rp {tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted font-bold uppercase">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => {
                      setEditingTransaction(tx);
                      handleSetIsAddModalOpen(true);
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTransaction(tx.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          )) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-[28px] border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-muted font-medium">Belum ada transaksi</p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );

  const renderReports = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Analisa Keuangan</h2>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button 
            onClick={() => setReportPeriod('week')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              reportPeriod === 'week' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-muted"
            )}
          >
            Minggu
          </button>
          <button 
            onClick={() => setReportPeriod('month')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              reportPeriod === 'month' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-muted"
            )}
          >
            Bulan
          </button>
          <button 
            onClick={() => setReportPeriod('all')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              reportPeriod === 'all' ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-muted"
            )}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Period Summary */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-4 border-green-100 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownLeft className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Pemasukan</span>
          </div>
          <p className="text-lg font-bold text-foreground">Rp {filteredTotals.income.toLocaleString()}</p>
        </GlassCard>
        <GlassCard className="p-4 border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpRight className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">Pengeluaran</span>
          </div>
          <p className="text-lg font-bold text-foreground">Rp {filteredTotals.expense.toLocaleString()}</p>
        </GlassCard>
      </div>

      {/* Expense Breakdown Chart */}
      <GlassCard className="p-6">
        <h3 className="font-bold text-foreground mb-6">Alokasi Pengeluaran</h3>
        {chartData.length > 0 ? (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', 
                      borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                      color: isDarkMode ? '#F8FAFC' : '#0F172A',
                      borderRadius: '12px'
                    }} 
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {chartData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(item.name) }} />
                  <span className="text-xs font-bold text-foreground/80">{item.name}</span>
                  <span className="text-xs text-muted ml-auto">{filteredTotals.expense > 0 ? ((item.value / filteredTotals.expense) * 100).toFixed(0) : 0}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-700">
            <PieChart className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-muted font-medium text-sm">Belum ada data pengeluaran untuk periode ini</p>
          </div>
        )}
      </GlassCard>

      {/* Budget Status */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-foreground">Anggaran Kategori</h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSetIsAIBudgetModalOpen(true)}
              className="text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Saran AI
            </button>
            <button 
              onClick={() => handleSetIsBudgetModalOpen(true)}
              className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-1"
            >
              Tambah <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        {mostExpensive && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">
              Boros di <span className="underline">{mostExpensive.name}</span> (Rp {mostExpensive.amount.toLocaleString()})
            </p>
          </div>
        )}
        <div className="space-y-4">
          {enrichedBudgets.length > 0 ? enrichedBudgets.map((budget) => (
            <GlassCard key={budget.id} className="p-6 group relative">
              <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingBudget(budget);
                    handleSetIsBudgetModalOpen(true);
                  }}
                  className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  title="Edit Anggaran"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteBudget(budget.id)}
                  className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  title="Hapus Anggaran"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="font-bold text-foreground">{budget.category}</h4>
                  {budget.spent > budget.limit && (
                    <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Over Budget!</span>
                  )}
                  {budget.spent > budget.limit * 0.8 && budget.spent <= budget.limit && (
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Hampir Habis (80%+)</span>
                  )}
                </div>
                <p className="text-sm font-bold text-muted">
                  Rp {budget.spent.toLocaleString()} <span className="text-gray-300 dark:text-gray-700">/</span> Rp {budget.limit.toLocaleString()}
                </p>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    (budget.spent / budget.limit) > 1 ? "bg-red-500" : 
                    (budget.spent / budget.limit) > 0.8 ? "bg-amber-500" : "bg-blue-500"
                  )}
                  style={{ width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%` }}
                />
              </div>
            </GlassCard>
          )) : (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-[28px] border-2 border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-muted font-medium">Belum ada anggaran diatur</p>
              <button 
                onClick={() => handleSetIsBudgetModalOpen(true)}
                className="mt-4 text-blue-600 dark:text-blue-400 font-bold text-sm"
              >
                Atur Anggaran Sekarang
              </button>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );

  const renderHealth = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">Kesehatan Finansial</h2>
      </div>

      {/* Financial Health Score */}
      <GlassCard className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950/20 dark:to-blue-950/20 border-teal-100 dark:border-teal-900/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-200 dark:shadow-none">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Skor Kesehatan</h3>
              <div className="flex items-center gap-2">
                <p className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  healthBreakdown.status === 'Baik' ? "text-teal-600 dark:text-teal-400" : 
                  healthBreakdown.status === 'Cukup' ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                )}>
                  {healthBreakdown.status}
                </p>
                {healthBreakdown.trend !== 'stable' && (
                  <div className={cn(
                    "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    healthBreakdown.trend === 'up' ? "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300" : "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                  )}>
                    {healthBreakdown.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {healthBreakdown.previousScore ? Math.abs(healthBreakdown.score - healthBreakdown.previousScore) : ''}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-teal-600 dark:text-teal-400">{healthBreakdown.score}</span>
            <span className="text-xs text-muted font-bold ml-1">/100</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden mb-6">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${healthBreakdown.score}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={cn(
              "h-full rounded-full",
              healthBreakdown.status === 'Baik' ? "bg-teal-500" : 
              healthBreakdown.status === 'Cukup' ? "bg-amber-500" : "bg-red-500"
            )}
          />
        </div>

        {/* Component Breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {Object.entries(healthBreakdown.components).map(([key, val]) => (
            <div key={key} className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-teal-100/50 dark:border-teal-900/50">
              <div className="text-[7px] font-bold text-muted uppercase mb-0.5">{key}</div>
              <div className="text-xs font-black text-foreground/80">{val}</div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            {healthBreakdown.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] font-bold text-foreground/70">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1 shrink-0" />
                {insight}
              </div>
            ))}
          </div>
          
          {healthBreakdown.recommendations.length > 0 && (
            <div className="pt-3 border-t border-teal-100 dark:border-teal-900">
              <p className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-2">Rekomendasi:</p>
              <div className="space-y-1">
                {healthBreakdown.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50/50 dark:bg-teal-950/30 p-2 rounded-lg">
                    <Sparkles className="w-3 h-3 mt-0.5 shrink-0" />
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* AI Narrative Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard className="p-6 border-blue-100 dark:border-blue-900 bg-white/80 dark:bg-gray-900/80">
          <div className="flex items-center gap-2 mb-4">
            <Logo iconOnly size="sm" variant="blue" />
            <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">AI Narrative Summary</h3>
          </div>
          <div className="space-y-4">
            {FinanceLogic.generateNarrativeSummary(healthBreakdown, totals).split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                {para}
              </p>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">Berdasarkan data 30 hari terakhir</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse delay-75" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-pulse delay-150" />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );

  const renderProfile = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center">
        <div className="w-32 h-32 rounded-[40px] bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 mx-auto mb-6 shadow-2xl shadow-blue-200 dark:shadow-none">
          <div className="w-full h-full rounded-[38px] bg-white dark:bg-gray-800 overflow-hidden flex items-center justify-center">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            )}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">{profile?.displayName}</h2>
        <p className="text-muted font-medium">{profile?.email}</p>
      </div>

      <div className="space-y-4">
        {[
          { id: 'info', icon: UserIcon, label: 'Informasi Pribadi', value: 'Lengkap' },
          { id: 'payment', icon: Wallet, label: 'Metode Pembayaran', value: '3 Kartu' },
          { id: 'settings', icon: Bell, label: 'Notifikasi', value: 'Aktif' },
          { id: 'settings', icon: Settings, label: 'Pengaturan Akun', value: '' },
        ].map((item, i) => (
          <GlassCard 
            key={i} 
            className="p-4 flex items-center justify-between hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => {
              setProfileModalSection(item.id as any);
              handleSetIsProfileModalOpen(true);
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-muted">
                <item.icon className="w-6 h-6" />
              </div>
              <span className="font-bold text-foreground">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">{item.value}</span>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-700" />
            </div>
          </GlassCard>
        ))}
        
        <button 
          onClick={handleGenerateDummyData}
          className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <Sparkles className="w-5 h-5" /> Buat Data Dummy (Testing)
        </button>

        <button 
          onClick={() => handleSetIsChangelogModalOpen(true)}
          className="w-full p-4 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <History className="w-5 h-5" /> Lihat Log Perubahan
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={handleLogout}
          className="py-5 rounded-2xl border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" /> Keluar
        </button>
        <button 
          onClick={handleLogout}
          className="py-5 rounded-2xl border-2 border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
        >
          <Users className="w-5 h-5" /> Ganti Akun
        </button>
      </div>
    </motion.div>
  );

  const renderAllTransactions = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleSetShowAllTransactions(false)}
            className="p-2 bg-card-bg rounded-xl shadow-sm"
          >
            <ArrowRight className="w-6 h-6 rotate-180" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Riwayat Transaksi</h2>
            <p className="text-sm text-muted font-medium">
              {filteredTransactions.length} transaksi ditemukan
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-foreground uppercase tracking-wider">Filter</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Tipe</label>
            <div className="flex p-1 bg-muted/50 rounded-xl">
              <button
                onClick={() => setFilterType('ALL')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                  filterType === 'ALL' ? "bg-card-bg shadow-sm text-blue-600 dark:text-blue-400" : "text-muted"
                )}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType('INCOME')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                  filterType === 'INCOME' ? "bg-green-600 text-white shadow-sm" : "text-green-600/70"
                )}
              >
                Pemasukan
              </button>
              <button
                onClick={() => setFilterType('EXPENSE')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                  filterType === 'EXPENSE' ? "bg-red-600 text-white shadow-sm" : "text-red-600/70"
                )}
              >
                Pengeluaran
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Kategori</label>
            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-3 bg-muted/50 border-none rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat === 'ALL' ? 'Semua Kategori' : cat}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Rentang Waktu</label>
            <select 
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value as any)}
              className="w-full p-3 bg-muted/50 border-none rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="7D">7 Hari Terakhir</option>
              <option value="30D">30 Hari Terakhir</option>
              <option value="CUSTOM">Rentang Kustom</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {filterDateRange === 'CUSTOM' && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="grid grid-cols-2 gap-4 pt-2"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Mulai</label>
              <input 
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full p-3 bg-muted/50 border-none rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Selesai</label>
              <input 
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full p-3 bg-muted/50 border-none rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </motion.div>
        )}

        {/* Reset Filters */}
        {(filterType !== 'ALL' || filterCategory !== 'ALL' || filterDateRange !== 'ALL') && (
          <button 
            onClick={() => {
              setFilterType('ALL');
              setFilterCategory('ALL');
              setFilterDateRange('ALL');
              setCustomStartDate('');
              setCustomEndDate('');
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Reset Filter
          </button>
        )}
      </GlassCard>

      <div className="space-y-4">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <GlassCard key={tx.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  tx.type === TransactionType.INCOME ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400"
                )}>
                  {tx.type === TransactionType.INCOME ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{tx.category}</h4>
                  <p className="text-xs text-muted">{tx.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className={cn(
                    "font-bold",
                    tx.type === TransactionType.INCOME ? "text-green-600 dark:text-green-400" : "text-foreground"
                  )}>
                    {tx.type === TransactionType.INCOME ? '+' : '-'} Rp {tx.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted font-bold uppercase">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => {
                      setEditingTransaction(tx);
                      handleSetIsAddModalOpen(true);
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTransaction(tx.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted" />
            </div>
            <p className="text-muted font-medium">Tidak ada transaksi yang cocok dengan filter</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Logo size="xl" variant="gradient" iconOnly={true} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={() => setLoading(true)} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 transition-colors duration-300">
      {/* Header */}
      <header className="p-6 flex justify-between items-center sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border-2 border-card-border shadow-sm">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold">
                {profile?.displayName?.[0]}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted font-medium">{getGreeting()},</p>
            <h2 className="text-base font-bold text-foreground">{profile?.displayName}</h2>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={toggleTheme}
            className="p-3 bg-card rounded-2xl shadow-sm border border-border text-muted hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative"
            title={`Mode: ${theme === 'system' ? 'Sistem' : theme === 'dark' ? 'Gelap' : 'Terang'}`}
          >
            {theme === 'system' ? (
              <Activity className="w-5 h-5" />
            ) : theme === 'dark' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center border-2 border-background">
              <span className="text-[8px] font-bold text-white uppercase">
                {theme === 'system' ? 'S' : theme === 'dark' ? 'D' : 'L'}
              </span>
            </div>
          </button>
          <button className="p-3 bg-card rounded-2xl shadow-sm border border-border text-muted hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button onClick={() => handleSetIsAIChatOpen(true)} className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none text-white hover:bg-blue-700 transition-colors">
            <Logo iconOnly size="sm" variant="blue" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 max-w-2xl mx-auto">
        {showAllTransactions ? renderAllTransactions() : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'health' && renderHealth()}
            {activeTab === 'profile' && renderProfile()}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 p-6 bg-card backdrop-blur-xl border-t border-border flex justify-between items-center z-20">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Beranda' },
          { id: 'health', icon: Activity, label: 'Kesehatan' },
          { id: 'add', icon: Plus, label: 'Tambah', isCenter: true },
          { id: 'reports', icon: PieChart, label: 'Laporan' },
          { id: 'profile', icon: UserIcon, label: 'Profil' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'add') handleSetIsAddModalOpen(true);
              else if (item.id === 'ai') handleSetIsAIChatOpen(true);
              else handleSetActiveTab(item.id);
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              item.isCenter ? "relative -top-10" : "",
              activeTab === item.id ? "text-blue-600 dark:text-blue-400" : "text-muted"
            )}
          >
            {item.isCenter ? (
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-300 dark:shadow-none ring-8 ring-background active:scale-90 transition-transform">
                <Plus className="w-8 h-8" />
              </div>
            ) : (
              <>
                <item.icon className={cn("w-6 h-6", activeTab === item.id ? "fill-blue-50 dark:fill-blue-900/20" : "")} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Modals */}
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          if (isAddModalOpen) window.history.back();
          setEditingTransaction(null);
        }} 
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />
      <AIAdvisorChat 
        isOpen={isAIChatOpen} 
        onClose={() => { if (isAIChatOpen) window.history.back(); }} 
        context={{ transactions, budgets, goals, profile }}
      />
      <BudgetModal 
        isOpen={isBudgetModalOpen}
        onClose={() => { 
          if (isBudgetModalOpen) window.history.back(); 
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
        initialData={editingBudget}
      />
      <AIBudgetModal
        isOpen={isAIBudgetModalOpen}
        onClose={() => { if (isAIBudgetModalOpen) window.history.back(); }}
        transactions={transactions}
        currentBudgets={budgets}
        onApplyBudget={handleSaveBudget}
      />
      <GoalModal 
        isOpen={isGoalModalOpen}
        onClose={() => { if (isGoalModalOpen) window.history.back(); }}
        onSave={handleSaveGoal}
      />
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => { if (isProfileModalOpen) window.history.back(); }}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        section={profileModalSection}
        transactions={transactions}
        onImportTransactions={handleImportTransactions}
      />

      <ChangelogModal
        isOpen={isChangelogModalOpen}
        onClose={() => { if (isChangelogModalOpen) window.history.back(); }}
        logs={logs}
      />

      <Toaster position="top-center" richColors />
      
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant}
      />
    </div>
  );
}

export default function Root() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
