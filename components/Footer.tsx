'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/hooks/useLanguage';

export default function Footer() {
  const [currentYear, setCurrentYear] = React.useState<number | string>('2026');
  const { lang, t } = useLanguage();

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative min-h-[320px] bg-[#111827] rounded-t-3xl overflow-hidden flex flex-col justify-between py-14 select-none">
      {/* 1. Technical Hexagonal & Guideline Blueprint (Semakin ke atas di-mask 0% transparan / fade out) */}
      <div 
        id="footer-tech-hex-pattern"
        className="absolute inset-0 z-0 pointer-events-none select-none opacity-[0.12]"
        style={{
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 85%)',
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 85%)',
        }}
      >
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="hex-grid" width="56" height="97" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
              <path 
                d="M28 0 L56 16.16 L56 48.5 L28 64.66 L0 48.5 L0 16.16 Z M28 97 L56 80.84 L56 48.5 L28 32.34 L0 48.5 L0 80.84 Z" 
                fill="none" 
                stroke="#F9FAFB" 
                strokeWidth="0.5" 
                strokeOpacity="0.35"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-grid)" />

          {/* Guidelines / blueprints for extra design details */}
          <line x1="8%" y1="15%" x2="28%" y2="65%" stroke="#F9FAFB" strokeWidth="0.5" strokeDasharray="3 6" strokeOpacity="0.4" />
          <line x1="92%" y1="10%" x2="72%" y2="85%" stroke="#F9FAFB" strokeWidth="0.5" strokeDasharray="3 6" strokeOpacity="0.4" />
          <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#F9FAFB" strokeWidth="0.5" strokeOpacity="0.12" />
          <circle cx="15%" cy="35%" r="70" stroke="#F9FAFB" strokeWidth="0.5" fill="none" strokeOpacity="0.18" strokeDasharray="2 4" />
          <circle cx="82%" cy="65%" r="110" stroke="#F9FAFB" strokeWidth="0.5" fill="none" strokeOpacity="0.15" />
        </svg>
      </div>

      {/* 2. Global cursor trail will cover the interaction canvas area */}

      {/* 3. Soft background glowing nodes (agak buram, tidak mencolok) */}
      <div 
        id="footer-glow-left"
        className="absolute -top-[10%] -left-[10%] w-[350px] h-[350px] rounded-full bg-[#F9FAFB]/5 blur-[80px] pointer-events-none select-none z-0" 
      />
      <div 
        id="footer-glow-right"
        className="absolute -bottom-[20%] -right-[15%] w-[400px] h-[400px] rounded-full bg-[#F9FAFB]/4 blur-[100px] pointer-events-none select-none z-0" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full flex-1 flex flex-col items-center justify-center text-center gap-6">
        
        {/* Centered Brand & Logo representation */}
        <div className="space-y-2 max-w-sm">
          <p className="font-lobster text-3xl text-[#F9FAFB]">
            Fanra<span className="text-slate-400 font-normal">Tech</span>
          </p>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {t(
              "Rancangan geometri kreatif dengan presisi estetika modern, merajut harmoni visual dalam setiap dimensi rasio asimetris.",
              "Creative geometric designs with modern aesthetic precision, weaving visual harmony in every asymmetrical ratio dimension."
            )}
          </p>
        </div>

        {/* Divider with high contrast limits */}
        <div className="w-16 h-0.5 bg-[#F9FAFB]/15" />

        {/* Centered Privacy, Permissions & Terms bottom bar */}
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-bold text-slate-400 font-sans tracking-wide">
            <Link 
              href="/kebijakan-privasi" 
              className="hover:text-[#F9FAFB] transition-all"
            >
              {t("Kebijakan Privasi", "Privacy Policy")}
            </Link>
            <Link 
              href="/ketentuan" 
              className="hover:text-[#F9FAFB] transition-all"
            >
              {t("Ketentuan Layanan", "Terms of Service")}
            </Link>
            <Link 
              href="/hak-cipta" 
              className="hover:text-[#F9FAFB] transition-all"
            >
              {t("Hak Cipta & Lisensi", "Copyright & License")}
            </Link>
          </div>

          <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-1" suppressHydrationWarning>
            &copy; {currentYear} FanraTech
          </p>
        </div>

      </div>
    </footer>
  );
}
