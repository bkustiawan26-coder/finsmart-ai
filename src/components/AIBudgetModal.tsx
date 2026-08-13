import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { aiAdvisorService } from '../services/aiAdvisorService';

interface AIBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: any[];
  currentBudgets: any[];
  onApplyBudget: (data: { category: string; limit: number; spent: number }) => void;
}

export function AIBudgetModal({ isOpen, onClose, transactions, currentBudgets, onApplyBudget }: AIBudgetModalProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedCategories, setAppliedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    } else {
      setSuggestions([]);
      setAppliedCategories(new Set());
    }
  }, [isOpen]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await aiAdvisorService.suggestBudgets(transactions, currentBudgets);
      setSuggestions(result);
      if (result.length === 0) {
        toast.error("Gagal mendapatkan saran anggaran. Silakan coba lagi nanti.");
      }
    } catch (error) {
      console.error("Failed to load budget suggestions", error);
      toast.error("Terjadi kesalahan saat menghubungi AI. Mungkin batas penggunaan tercapai.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = (category: string, limit: number) => {
    onApplyBudget({ category, limit, spent: 0 });
    setAppliedCategories(prev => new Set(prev).add(category));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="relative w-full max-w-md bg-background rounded-3xl shadow-2xl overflow-hidden border border-border"
        >
          <div className="p-6 border-b border-border flex justify-between items-center bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Saran Anggaran AI</h2>
                <p className="text-xs text-muted">Berdasarkan pola pengeluaranmu</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted" />
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-muted animate-pulse">AI sedang menganalisis keuanganmu...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => {
                  const isApplied = appliedCategories.has(suggestion.category);
                  const currentBudget = currentBudgets.find(b => b.category === suggestion.category);
                  
                  return (
                    <div key={index} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-foreground">{suggestion.category}</h3>
                        <div className="text-right">
                          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            Rp {suggestion.suggestedLimit.toLocaleString()}
                          </p>
                          {currentBudget && (
                            <p className="text-xs text-muted line-through">
                              Rp {currentBudget.limit.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted mb-4">{suggestion.reasoning}</p>
                      
                      <button
                        onClick={() => handleApply(suggestion.category, suggestion.suggestedLimit)}
                        disabled={isApplied}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          isApplied 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-4 h-4" /> Diterapkan
                          </>
                        ) : (
                          <>
                            Terapkan Anggaran <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted">Tidak ada saran anggaran saat ini.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
