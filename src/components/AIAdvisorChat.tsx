import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, Sparkles, X, MessageSquare } from 'lucide-react';
import Markdown from 'react-markdown';
import Logo from './Logo';
import { aiAdvisorService } from '../services/aiAdvisorService';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: number;
}

const AIAdvisorChat = ({ isOpen, onClose, context }: { isOpen: boolean; onClose: () => void; context?: any }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Halo! Saya FinSmart AI. Ada yang bisa saya bantu dengan keuangan Anda hari ini?',
      sender: 'ai',
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiAdvisorService.getFinancialAdvice(input, context);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Maaf, saya sedang mengalami kendala teknis atau batas penggunaan tercapai. Silakan coba lagi dalam beberapa saat.',
        sender: 'ai',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col max-w-2xl mx-auto"
        >
          {/* Header */}
          <header className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Logo iconOnly size="md" variant="gradient" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">FinSmart AI</h2>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, x: msg.sender === 'ai' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-start gap-3",
                  msg.sender === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                  msg.sender === 'ai' ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                )}>
                  {msg.sender === 'ai' ? <Bot className="w-6 h-6" /> : <User className="w-6 h-6" />}
                </div>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                  msg.sender === 'ai' 
                    ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700" 
                    : "bg-blue-600 text-white rounded-tr-none shadow-blue-100 dark:shadow-none"
                )}>
                  {msg.sender === 'ai' ? (
                    <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan sesuatu..."
                className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-2xl py-4 pl-6 pr-14 font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50 disabled:shadow-none transition-all active:scale-90"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Powered by FinSmart AI</span>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAdvisorChat;
