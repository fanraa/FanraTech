'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/hooks/useLanguage';

export default function CookieBanner() {
  const { lang, t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted or declined cookies
    const choice = localStorage.getItem('fanratech-cookie-consent');
    if (!choice) {
      // Delay slightly for premium entering animation feel
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (accepted: boolean) => {
    localStorage.setItem('fanratech-cookie-consent', accepted ? 'accepted' : 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#F9FAFB]/98 backdrop-blur-md text-[#111827] shadow-[0_-10px_35px_-5px_rgba(0,0,0,0.06)] border-t border-slate-200/80 rounded-t-2xl rounded-b-none select-none px-5 py-4 sm:py-3.5"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
            
            {/* Standard full compliance message text (Slim and elegant) */}
            <div className="flex flex-col gap-2 text-center md:text-left w-full">
              {/* Brand and Subtitle */}
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3">
                <span className="font-lobster text-lg tracking-wide text-[#111827]">
                  <span>Fanra</span>
                  <span className="text-[#94A3B8]">Tech</span>
                </span>
                <span className="hidden md:inline text-slate-300">|</span>
                <span className="hidden md:inline text-xs font-semibold text-[#111827] tracking-wider uppercase">
                  {t("Ketentuan & Kebijakan Cookies", "Cookie Terms & Policy")}
                </span>
              </div>

              {/* Ketentuan Title on Mobile below Brand */}
              <div className="block md:hidden text-[10px] font-semibold text-[#111827] tracking-wider uppercase -mt-1">
                {t("Ketentuan & Kebijakan Cookies", "Cookie Terms & Policy")}
              </div>

              {/* Teks Penjelasan Ukuran Sedang */}
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-sans max-w-4xl mt-0.5">
                {t(
                  "Kami menggunakan cookie untuk mengoptimalkan kinerja sistem, menganalisis lalu lintas interaksi secara anonim, serta memastikan seluruh fitur visual kami berjalan mulus di perangkat laptop maupun handphone Anda.",
                  "We use cookies to optimize system performance, analyze interaction traffic anonymously, and ensure all our visual features run seamlessly on both your desktop and mobile devices."
                )}
              </p>
            </div>

            {/* Accept / Decline buttons row */}
            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-center mt-1 md:mt-0">
              <button
                onClick={() => handleChoice(false)}
                className="flex-1 md:flex-initial px-5 h-8.5 text-[11px] font-bold text-slate-600 hover:text-[#111827] hover:bg-slate-100 rounded-full transition-all duration-200 cursor-pointer text-center select-none"
              >
                {t("Tolak", "Decline")}
              </button>
              <button
                onClick={() => handleChoice(true)}
                className="flex-1 md:flex-initial px-6 h-8.5 text-[11px] font-bold bg-[#111827] text-white hover:bg-slate-800 rounded-full transition-all duration-200 cursor-pointer text-center select-none shadow-xs"
              >
                {t("Terima", "Accept")}
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
