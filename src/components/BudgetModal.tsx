import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id?: string; category: string; limit: number; spent: number }) => void;
  initialData?: { id: string; category: string; limit: number; spent: number } | null;
}

const CATEGORIES = [
  'Tagihan',
  'Makanan',
  'Lainnya',
  'Belanja',
  'Lain',
  'Keluarga',
  'Liburan',
  'Kesehatan',
  'Transportasi',
  'Rumah',
  'Investasi'
];

const BudgetModal: React.FC<BudgetModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState('');

  React.useEffect(() => {
    if (initialData) {
      setCategory(initialData.category);
      setLimit(initialData.limit.toString());
    } else {
      setCategory(CATEGORIES[0]);
      setLimit('');
    }
  }, [initialData, isOpen]);

  const handleSave = () => {
    if (!limit) return;
    onSave({
      id: initialData?.id,
      category,
      limit: parseFloat(limit),
      spent: initialData?.spent || 0,
    });
    onClose();
    setLimit('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-card-bg rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-foreground">{initialData ? 'Edit Anggaran' : 'Atur Anggaran'}</h2>
              <button onClick={onClose} className="p-2 bg-muted rounded-full text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Kategori</label>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "py-3 px-4 rounded-xl text-sm font-bold transition-all border-2",
                        category === cat 
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none" 
                          : "bg-muted/50 border-transparent text-muted hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Limit Bulanan (Rp)</label>
                <div className="relative">
                  <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="Contoh: 1.000.000"
                    className="w-full bg-muted/50 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-gray-700 rounded-2xl py-4 pl-12 pr-4 font-bold text-foreground outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!limit}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
              >
                Simpan Anggaran <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BudgetModal;
