import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Chrome, 
  Loader2, 
  Sun,
  Moon,
  Activity
} from 'lucide-react';
import Logo from './Logo';
import LegalModal from './LegalModal';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
} from 'firebase/auth';
import { auth } from '../firebase';
import { toast } from 'sonner';

interface Props {
  onLoginSuccess: () => void;
  theme: 'light' | 'dark' | 'system';
  toggleTheme: () => void;
}

const LoginScreen = ({ onLoginSuccess, theme, toggleTheme }: Props) => {
  const [loading, setLoading] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
    isOpen: false,
    type: 'privacy'
  });
  
  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onLoginSuccess();
    } catch (error: any) {
      console.error("Google login failed", error);
      toast.error("Gagal masuk dengan Google: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openLegalModal = (type: 'privacy' | 'terms') => {
    setLegalModal({ isOpen: true, type });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-6 transition-colors duration-300">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
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
      </div>

      {/* Atmospheric Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 rounded-full blur-[120px]" />
      
      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <Logo size="lg" variant="gradient" iconOnly={true} className="mb-6 transform -rotate-6 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground mb-2">FinSmart AI</h1>
          <p className="text-muted font-medium text-lg">
            Cerdas Kelola Keuangan
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-[32px] p-10 shadow-2xl shadow-blue-900/5 text-center"
        >
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Selamat Datang Kembali
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              Masuk dengan akun Google Anda untuk mulai mengelola keuangan dengan kecerdasan buatan.
            </p>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-card border-2 border-border text-foreground font-bold py-5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            ) : (
              <div className="bg-white p-1 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <Chrome className="w-6 h-6 text-[#4285F4]" />
              </div>
            )}
            <span className="text-lg">Masuk dengan Google</span>
          </button>

          <p className="mt-8 text-xs text-gray-400 leading-relaxed">
            Dengan masuk, Anda menyetujui {' '}
            <button 
              onClick={() => openLegalModal('terms')}
              className="text-blue-600 font-bold hover:underline"
            >
              Syarat & Ketentuan
            </button>
            {' '} serta {' '}
            <button 
              onClick={() => openLegalModal('privacy')}
              className="text-blue-600 font-bold hover:underline"
            >
              Kebijakan Privasi
            </button>
            {' '} kami.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            © 2026 FinSmart AI • Keamanan Terjamin • Versi 2.0
          </p>
        </motion.div>
      </div>

      <LegalModal 
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
        type={legalModal.type}
      />
    </div>
  );
};

export default LoginScreen;


