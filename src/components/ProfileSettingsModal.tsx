import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Wallet, Settings, Globe, Moon, Sun, Monitor, Check, ChevronRight, CreditCard, Plus, Download, Upload, FileText, Shield } from 'lucide-react';
import { UserProfile, Transaction, TransactionType } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import Papa from 'papaparse';
import LegalModal from './LegalModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
  section: 'info' | 'payment' | 'settings' | null;
  transactions: Transaction[];
  onImportTransactions: (transactions: Partial<Transaction>[]) => Promise<void>;
}

const ProfileSettingsModal = ({ isOpen, onClose, profile, onUpdateProfile, section, transactions, onImportTransactions }: Props) => {
  const [activeSection, setActiveSection] = useState<'info' | 'payment' | 'settings' | 'legal'>('info');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [language, setLanguage] = useState<'id' | 'en'>('id');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
    isOpen: false,
    type: 'privacy'
  });

  useEffect(() => {
    if (section) setActiveSection(section);
  }, [section, isOpen]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhotoURL(profile.photoURL || null);
      setPhoneNumber(profile.phoneNumber || '');
      setLanguage(profile.language || 'id');
      setTheme(profile.theme || 'system');
    }
  }, [profile, isOpen]);

  const handleSaveInfo = async () => {
    try {
      await onUpdateProfile({ displayName, photoURL, phoneNumber });
      toast.success('Informasi profil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui profil');
    }
  };

  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Harap pilih file gambar');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setPhotoURL(dataUrl);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    try {
      await onUpdateProfile({ language, theme });
      toast.success('Pengaturan diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui pengaturan');
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error('Tidak ada transaksi untuk diekspor');
      return;
    }

    const data = transactions.map(({ id, userId, ...rest }) => rest);
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `FinSmart_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transaksi berhasil diekspor');
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const importedData = results.data as any[];
          const validTransactions: Partial<Transaction>[] = importedData
            .filter(row => row.amount && row.category && row.date && row.type)
            .map(row => ({
              amount: parseFloat(row.amount),
              category: row.category,
              description: row.description || '',
              date: row.date,
              type: row.type as TransactionType,
              isImpulsive: row.isImpulsive === 'true' || row.isImpulsive === true
            }));

          if (validTransactions.length === 0) {
            toast.error('Format CSV tidak valid atau tidak ada data');
            return;
          }

          await onImportTransactions(validTransactions);
          toast.success(`${validTransactions.length} transaksi berhasil diimpor`);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
          console.error('Import error:', error);
          toast.error('Gagal mengimpor transaksi');
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        toast.error('Gagal membaca file CSV');
        setIsImporting(false);
      }
    });
  };

  const renderInfo = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => profilePicInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-xs text-gray-400 font-medium">Format: JPG, PNG (Maks. 2MB)</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nama Lengkap</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
        <div className="relative">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            value={profile?.email || ''}
            disabled
            className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nomor Telepon</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+62</span>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="81234567890"
            className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-14 pr-4 font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>
      <button
        onClick={handleSaveInfo}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
      >
        Simpan Perubahan
      </button>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {[
          { type: 'Visa', last4: '4242', expiry: '12/24', isDefault: true },
          { type: 'Mastercard', last4: '8888', expiry: '06/25', isDefault: false },
        ].map((card, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{card.type} •••• {card.last4}</h4>
                <p className="text-xs text-gray-400 font-medium">Berlaku hingga {card.expiry}</p>
              </div>
            </div>
            {card.isDefault && (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase">Utama</span>
            )}
          </div>
        ))}
      </div>
      <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-sm flex items-center justify-center gap-2 hover:border-blue-200 hover:text-blue-400 transition-all">
        <Plus className="w-5 h-5" /> Tambah Metode Pembayaran
      </button>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Bahasa</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'id', label: 'Indonesia' },
            { id: 'en', label: 'English' },
          ].map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id as 'id' | 'en')}
              className={cn(
                "py-3 px-4 rounded-xl text-sm font-bold transition-all border-2",
                language === lang.id 
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
              )}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Tema</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Terang', icon: Sun },
            { id: 'dark', label: 'Gelap', icon: Moon },
            { id: 'system', label: 'Sistem', icon: Monitor },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as 'light' | 'dark' | 'system')}
              className={cn(
                "flex flex-col items-center gap-2 py-3 px-2 rounded-xl text-[10px] font-bold transition-all border-2",
                theme === t.id 
                  ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Data Transaksi</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 py-4 px-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-600 font-bold text-sm hover:bg-gray-100 transition-all"
          >
            <Download className="w-5 h-5" />
            Ekspor CSV
          </button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center justify-center gap-2 py-4 px-4 bg-gray-50 border-2 border-transparent rounded-2xl text-gray-600 font-bold text-sm hover:bg-gray-100 transition-all disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            {isImporting ? 'Mengimpor...' : 'Impor CSV'}
          </motion.button>
        </div>
      </div>

      <button
        onClick={handleSaveSettings}
        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
      >
        Simpan Pengaturan
      </button>
    </div>
  );

  const renderLegal = () => (
    <div className="space-y-4">
      <button
        onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
        className="w-full p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-gray-900">Kebijakan Privasi</h4>
            <p className="text-xs text-gray-400 font-medium">Bagaimana kami menjaga data Anda</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
      </button>

      <button
        onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
        className="w-full p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="text-left">
            <h4 className="font-bold text-gray-900">Syarat & Ketentuan</h4>
            <p className="text-xs text-gray-400 font-medium">Aturan penggunaan layanan kami</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] p-8 z-50 shadow-2xl max-w-2xl mx-auto h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Pengaturan</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'info', label: 'Profil', icon: User },
                { id: 'payment', label: 'Pembayaran', icon: Wallet },
                { id: 'settings', label: 'Sistem', icon: Settings },
                { id: 'legal', label: 'Legal', icon: Shield },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap",
                    activeSection === s.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  )}
                >
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </button>
              ))}
            </div>

            <div className="pb-8">
              {activeSection === 'info' && renderInfo()}
              {activeSection === 'payment' && renderPayment()}
              {activeSection === 'settings' && renderSettings()}
              {activeSection === 'legal' && renderLegal()}
            </div>

            {/* Hidden Inputs for File Selection */}
            <input
              type="file"
              ref={profilePicInputRef}
              onChange={handleProfilePicChange}
              accept="image/*"
              className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
              aria-hidden="true"
              tabIndex={-1}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportCSV}
              accept=".csv,text/csv,application/vnd.ms-excel,application/csv,text/x-csv,application/x-csv,text/comma-separated-values,text/x-comma-separated-values"
              className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
              aria-hidden="true"
              tabIndex={-1}
            />

            <LegalModal 
              isOpen={legalModal.isOpen}
              onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
              type={legalModal.type}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileSettingsModal;
