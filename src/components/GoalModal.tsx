import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Target, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string; targetAmount: number; currentAmount: number; deadline: string }) => void;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState('');

  const handleSave = () => {
    if (!title || !targetAmount || !deadline) return;
    onSave({
      title,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      deadline,
    });
    onClose();
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline('');
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
            className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl overflow-hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tujuan Menabung</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">Nama Tujuan</label>
                <div className="relative">
                  <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Liburan ke Bali"
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-gray-700 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-900 dark:text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">Target (Rp)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-gray-700 rounded-2xl py-4 px-4 font-bold text-gray-900 dark:text-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-gray-700 rounded-2xl py-4 px-4 font-bold text-gray-900 dark:text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 block">Tenggat Waktu</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-gray-700 rounded-2xl py-4 pl-12 pr-4 font-bold text-gray-900 dark:text-white outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!title || !targetAmount || !deadline}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-100 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center justify-center gap-2"
              >
                Simpan Tujuan <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GoalModal;
