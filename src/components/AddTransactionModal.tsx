import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Calendar, Tag, FileText, Check } from 'lucide-react';
import { TransactionType } from '../types';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id?: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    type: TransactionType;
    isImpulsive?: boolean;
  } | null;
  onSave: (data: {
    id?: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    type: TransactionType;
    isImpulsive: boolean;
  }) => void;
}

const AddTransactionModal = ({ isOpen, onClose, onSave, initialData }: Props) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isImpulsive, setIsImpulsive] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setDescription(initialData.description || '');
      setDate(new Date(initialData.date).toISOString().split('T')[0]);
      setIsImpulsive(initialData.isImpulsive || false);
    } else {
      setType(TransactionType.EXPENSE);
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsImpulsive(false);
    }
  }, [initialData, isOpen]);

  const handleTypeChange = (newType: TransactionType) => {
    if (newType === type) return;
    setType(newType);
    setCategory(''); // Reset category when type changes to ensure consistency
  };

  const categories = type === TransactionType.EXPENSE 
    ? ['Tagihan', 'Makanan', 'Lainnya', 'Belanja', 'Lain', 'Keluarga', 'Liburan', 'Kesehatan', 'Transportasi', 'Rumah', 'Investasi']
    : ['Gaji', 'Bonus', 'Investasi', 'Hadiah', 'Lainnya'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || !category) {
      if (!category) toast.error('Silakan pilih kategori');
      if (isNaN(numAmount) || numAmount <= 0) toast.error('Jumlah harus lebih dari 0');
      return;
    }
    
    onSave({
      id: initialData?.id,
      amount: numAmount,
      category,
      description,
      date: new Date(date).toISOString(),
      type,
      isImpulsive: type === TransactionType.EXPENSE ? isImpulsive : false,
    });
    
    onClose();
  };

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
            className="fixed bottom-0 left-0 right-0 bg-card-bg rounded-t-[40px] p-8 z-50 shadow-2xl max-w-2xl mx-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">{initialData ? 'Edit Transaksi' : 'Tambah Transaksi'}</h2>
              <button onClick={onClose} className="p-2 bg-muted rounded-full text-muted">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Toggle */}
              <div className="flex p-1 bg-muted rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleTypeChange(TransactionType.EXPENSE)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                    type === TransactionType.EXPENSE 
                      ? "bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-none" 
                      : "text-red-600/70 hover:bg-red-50 dark:hover:bg-red-900/20"
                  )}
                >
                  <Minus className="w-4 h-4" /> Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange(TransactionType.INCOME)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                    type === TransactionType.INCOME 
                      ? "bg-green-600 text-white shadow-lg shadow-green-200 dark:shadow-none" 
                      : "text-green-600/70 hover:bg-green-50 dark:hover:bg-green-900/20"
                  )}
                >
                  <Plus className="w-4 h-4" /> Pemasukan
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Jumlah</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted">Rp</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || parseFloat(val) >= 0) {
                        setAmount(val);
                      }
                    }}
                    placeholder="0"
                    className="w-full bg-muted/50 border-none rounded-2xl py-5 pl-14 pr-6 text-3xl font-bold text-foreground focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Kategori</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                        category === cat 
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none" 
                          : "bg-card-bg border-card-border text-muted hover:border-gray-200 dark:hover:border-gray-600"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Description */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Tanggal</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-muted/50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-foreground focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider ml-1">Keterangan</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Opsional"
                      className="w-full bg-muted/50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold text-foreground focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Impulsive Toggle (Only for Expense) */}
              {type === TransactionType.EXPENSE && (
                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white">
                      <Plus className="w-5 h-5 rotate-45" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Pembelian Impulsif?</h4>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-tight">Mempengaruhi Health Score</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsImpulsive(!isImpulsive)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      isImpulsive ? "bg-amber-500" : "bg-muted"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      isImpulsive ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Check className="w-6 h-6" /> Simpan Transaksi
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddTransactionModal;
