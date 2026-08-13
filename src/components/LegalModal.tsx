import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

const LegalModal = ({ isOpen, onClose, type }: Props) => {
  const content = {
    privacy: {
      title: 'Kebijakan Privasi',
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      text: `
        ### 1. Informasi yang Kami Kumpulkan
        Kami mengumpulkan informasi yang Anda berikan langsung kepada kami saat Anda mendaftar akun, menggunakan layanan kami, atau berkomunikasi dengan kami. Ini termasuk nama, alamat email, dan data transaksi keuangan yang Anda masukkan.

        ### 2. Penggunaan Informasi
        Kami menggunakan informasi yang kami kumpulkan untuk menyediakan, memelihara, dan meningkatkan layanan kami, termasuk untuk memproses transaksi, mengirimkan pemberitahuan, dan memberikan saran keuangan berbasis AI.

        ### 3. Berbagi Informasi
        Kami tidak akan membagikan informasi pribadi Anda dengan pihak ketiga kecuali sebagaimana dijelaskan dalam kebijakan ini atau dengan persetujuan Anda.

        ### 4. Keamanan Data
        Kami mengambil langkah-langkah yang wajar untuk melindungi informasi pribadi Anda dari kehilangan, pencurian, penyalahgunaan, dan akses yang tidak sah.

        ### 5. Hak Anda
        Anda memiliki hak untuk mengakses, memperbarui, atau menghapus informasi pribadi Anda kapan saja melalui pengaturan akun Anda.
      `
    },
    terms: {
      title: 'Syarat & Ketentuan',
      icon: <FileText className="w-6 h-6 text-indigo-500" />,
      text: `
        ### 1. Penerimaan Syarat
        Dengan mengakses atau menggunakan layanan FinSmart AI, Anda setuju untuk terikat oleh Syarat & Ketentuan ini.

        ### 2. Penggunaan Layanan
        Anda setuju untuk menggunakan layanan kami hanya untuk tujuan yang sah dan sesuai dengan syarat-syarat ini. Anda bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda.

        ### 3. Akun Pengguna
        Untuk menggunakan fitur tertentu, Anda mungkin perlu mendaftar akun. Anda harus menjaga kerahasiaan informasi akun Anda.

        ### 4. Kekayaan Intelektual
        Semua konten, fitur, dan fungsionalitas layanan kami adalah milik eksklusif FinSmart AI dan dilindungi oleh hukum hak cipta internasional.

        ### 5. Pembatasan Tanggung Jawab
        FinSmart AI tidak bertanggung jawab atas kerugian finansial yang mungkin timbul dari penggunaan saran atau analisis yang diberikan oleh AI kami. Keputusan keuangan sepenuhnya berada di tangan pengguna.

        ### 6. Perubahan Syarat
        Kami berhak untuk mengubah syarat-syarat ini kapan saja. Perubahan akan berlaku segera setelah diposting di layanan kami.
      `
    }
  };

  const current = content[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  {current.icon}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{current.title}</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600 shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto prose prose-sm max-w-none">
              <div className="space-y-6 text-gray-600 leading-relaxed">
                {current.text.split('\n').map((line, i) => {
                  if (line.trim().startsWith('###')) {
                    return <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-2">{line.replace('###', '').trim()}</h3>;
                  }
                  return <p key={i}>{line.trim()}</p>;
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98]"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LegalModal;
