import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, ArrowUpRight, ArrowDownLeft, Target, Wallet, User, Settings, Clock } from 'lucide-react';
import { Changelog } from '../types';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: Changelog[];
}

const ChangelogModal = ({ isOpen, onClose, logs }: Props) => {
  const getIcon = (type: Changelog['type']) => {
    switch (type) {
      case 'transaction': return <History className="w-5 h-5 text-blue-500" />;
      case 'budget': return <Wallet className="w-5 h-5 text-purple-500" />;
      case 'goal': return <Target className="w-5 h-5 text-amber-500" />;
      case 'profile': return <User className="w-5 h-5 text-green-500" />;
      case 'system': return <Settings className="w-5 h-5 text-gray-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-[40px] p-8 z-[70] shadow-2xl max-w-2xl mx-auto h-[70vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Log Perubahan</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Riwayat aktivitas Anda</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-4"
                  >
                    <div className="mt-1">
                      {getIcon(log.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{log.action}</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{formatDate(log.timestamp)}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <History className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Belum ada riwayat</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aktivitas Anda akan muncul di sini</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChangelogModal;
