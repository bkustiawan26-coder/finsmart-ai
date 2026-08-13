import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden p-8"
          >
            <div className="flex flex-col items-center text-center">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-6",
                variant === 'danger' ? "bg-red-50 text-red-600" : 
                variant === 'warning' ? "bg-amber-50 text-amber-600" : 
                "bg-blue-50 text-blue-600"
              )}>
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {message}
              </p>
              
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-white transition-all active:scale-95 shadow-lg",
                    variant === 'danger' ? "bg-red-600 hover:bg-red-700 shadow-red-200" :
                    variant === 'warning' ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200" :
                    "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                  )}
                >
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all active:scale-95"
                >
                  {cancelText}
                </button>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationDialog;
