'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bookmark } from 'lucide-react';
import { portfolioItems, allExtendedAssets, DesignItem, getSavedDesigns, getSavedAssets } from '@/lib/data';
import { useLanguage } from '@/hooks/useLanguage';
import { handleLogoutClearBookmarks, syncBookmarksWithCloud } from '@/lib/bookmarkSync';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinedModal, setShowJoinedModal] = useState(false);
  const [isSearchOpenMobile, setIsSearchOpenMobile] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const [session, setSession] = useState<{ name: string; email: string } | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<DesignItem[]>([]);
  const [savedAssets, setSavedAssets] = useState<DesignItem[]>([]);
  const [globalToast, setGlobalToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToastRequest = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type: 'success' | 'error' }>;
      if (customEvent && customEvent.detail) {
        setGlobalToast(customEvent.detail);
      }
    };

    window.addEventListener('fanratech_toast' as any, handleToastRequest);
    return () => {
      window.removeEventListener('fanratech_toast' as any, handleToastRequest);
    };
  }, []);

  useEffect(() => {
    if (globalToast) {
      const timer = setTimeout(() => {
        setGlobalToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [globalToast]);

  useEffect(() => {
    if (!showProfileDropdown) {
      setConfirmLogout(false);
    }
  }, [showProfileDropdown]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadSaved = () => {
        const dSaved = localStorage.getItem('fanratech_saved_designs');
        const aSaved = localStorage.getItem('fanratech_saved_assets');
        
        try {
          const dIds = dSaved ? JSON.parse(dSaved) : [];
          setSavedDesigns(getSavedDesigns().filter(item => dIds.includes(item.id)));
        } catch {
          setSavedDesigns([]);
        }

        try {
          const aIds = aSaved ? JSON.parse(aSaved) : [];
          setSavedAssets(getSavedAssets().filter(item => aIds.includes(item.id)));
        } catch {
          setSavedAssets([]);
        }
      };

      loadSaved();
      
      window.addEventListener('fanratech_data_updated', loadSaved);
      window.addEventListener('storage', loadSaved);
      return () => {
        window.removeEventListener('fanratech_data_updated', loadSaved);
        window.removeEventListener('storage', loadSaved);
      };
    }
  }, [showProfileDropdown]);

  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalQuery(searchQuery || "");
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoadingSearch) return;
    setIsLoadingSearch(true);
    window.dispatchEvent(new Event('fanratech_start_loading'));
    setSearchQuery(localQuery);
    setIsOpen(false);
    setIsSearchOpenMobile(false);
    router.push(`/desain?q=${encodeURIComponent(localQuery)}`);
    // Safe reset of loader flag after transition starts
    setTimeout(() => {
      setIsLoadingSearch(false);
    }, 150);
  };

  // Load session from dynamic local storage on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('fanratech_session');
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        const timer = setTimeout(() => {
          setSession(parsed);
          // Jalankan sinkronisasi bookmark cloud sesegera mungkin
          syncBookmarksWithCloud();
        }, 0);
        return () => clearTimeout(timer);
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsSearchOpenMobile(false);
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToSection = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 70; // height of slim navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      router.push('/#' + id);
    }
  };

  // Sanitasi filter pencarian dari karakter aneh
  const handleSearchChange = (val: string) => {
    const cleanVal = val.replace(/[^a-zA-Z0-9\s.\-_]/g, '');
    setSearchQuery(cleanVal.substring(0, 30));
  };

  const triggerJoinAction = () => {
    setShowJoinedModal(true);
    setTimeout(() => {
      setShowJoinedModal(false);
    }, 4500);
  };

  return (
    <>
      <header
        id="navbar-header"
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-2xs py-2.5 transition-colors duration-350 ${
          isOpen ? 'rounded-br-none' : 'rounded-br-2xl'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => scrollToSection('home')}
              className="flex items-center cursor-pointer select-none shrink-0"
            >
              <h1 className="font-lobster text-2xl tracking-wide text-[#111827] leading-none select-none">
                Fanra<span className="text-slate-400 font-normal">Tech</span>
              </h1>
            </motion.div>

            {/* Middle/Right Controls */}
            <div className="flex items-center gap-5 flex-1 justify-end">
              
              {/* Seamless Expandable Search Box Desktop with transition animation on focus and authentic custom search icon */}
              <form onSubmit={handleFormSubmit} className="relative hidden md:block shrink-0">
                <button
                  type="submit"
                  disabled={isLoadingSearch}
                  suppressHydrationWarning
                  className="absolute inset-y-0 left-0 flex items-center pl-3.5 bg-transparent border-0 cursor-pointer p-0 select-none outline-none focus:outline-none"
                  style={{ opacity: isLoadingSearch ? 0.6 : 0.8 }}
                >
                  {isLoadingSearch ? (
                    <svg className="animate-spin h-3.5 w-3.5 text-[#111827]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <Image 
                      src="https://cdn-icons-png.flaticon.com/128/2120/2120967.png" 
                      alt={t("Cari", "Search")} 
                      width={16}
                      height={16}
                      className="object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  )}
                </button>
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value.substring(0, 30))}
                  maxLength={30}
                  placeholder={t("Cari desain...", "Search designs...")}
                  suppressHydrationWarning
                  className="pl-9 pr-4 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-100 focus:border-[#111827] focus:bg-white rounded-full transition-all duration-300 outline-none placeholder-slate-400 font-sans min-h-[35px] w-32 focus:w-60"
                />
              </form>

              {/* Mobile and Desktop Unified Gabung/Search Controllers */}
              <div className="flex items-center gap-3">
                
                {/* Mobile Search Toggle: Shows only icon initially with no box */}
                {!isSearchOpenMobile && (
                  <button
                    onClick={() => setIsSearchOpenMobile(true)}
                    suppressHydrationWarning
                    className="md:hidden p-2 text-slate-700 hover:text-[#111827] bg-transparent border-none transition-colors cursor-pointer min-w-[36px] min-h-[36px] inline-flex items-center justify-center animate-fade-in"
                  >
                    <Image 
                      src="https://cdn-icons-png.flaticon.com/128/2120/2120967.png" 
                      alt={t("Cari", "Search")} 
                      width={18}
                      height={18}
                      className="object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  </button>
                )}

                {/* Mobile Active Inline Search Bar that replaces Gabung and Menu Button */}
                {isSearchOpenMobile ? (
                  <form onSubmit={handleFormSubmit} className="flex items-center gap-1.5 flex-1 w-full max-w-[210px] sm:max-w-xs md:hidden relative animate-fade-in">
                    <button
                      type="submit"
                      disabled={isLoadingSearch}
                      suppressHydrationWarning
                      className="absolute inset-y-0 left-0 flex items-center pl-3 bg-transparent border-0 cursor-pointer p-0 select-none outline-none focus:outline-none"
                      style={{ opacity: isLoadingSearch ? 0.6 : 0.8 }}
                    >
                      {isLoadingSearch ? (
                        <svg className="animate-spin h-3 w-3 text-[#111827]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <Image 
                          src="https://cdn-icons-png.flaticon.com/128/2120/2120967.png" 
                          alt={t("Cari", "Search")} 
                          width={14}
                          height={14}
                          className="object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </button>
                    <input
                      type="text"
                      value={localQuery}
                      onChange={(e) => setLocalQuery(e.target.value.substring(0, 30))}
                      maxLength={30}
                      placeholder={t("Cari...", "Search...")}
                      autoFocus
                      suppressHydrationWarning
                      className="w-full pl-8.5 pr-8 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 focus:border-[#111827] focus:bg-white rounded-full transition-all duration-200 outline-none placeholder-slate-400 font-sans min-h-[34px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchOpenMobile(false);
                        setLocalQuery("");
                        setSearchQuery("");
                      }}
                      suppressHydrationWarning
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-[#111827] min-h-[34px] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    {session ? (
                      <div className="relative">
                        <button
                          id="btn-header-profile"
                          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                          suppressHydrationWarning
                          className="h-7.5 px-1 sm:px-2.5 rounded-full bg-transparent sm:bg-slate-50 border border-transparent sm:border-slate-200/85 text-[#111827] hover:border-slate-400 font-sans font-bold text-xs cursor-pointer select-none flex items-center gap-1.5 transition duration-200 shrink-0"
                        >
                          <div className="w-4.5 h-4.5 rounded-full bg-[#111827] text-white flex items-center justify-center font-bold text-[8px] shrink-0">
                            {session.name ? session.name.substring(0, 2).toUpperCase() : 'FT'}
                          </div>
                          <span className="hidden sm:inline heading-sans truncate max-w-[65px] font-medium text-[11px] text-slate-700">
                            {session.name.split(' ')[0]}
                          </span>
                        </button>
                        
                        {/* Dynamic Dropdown for User Credentials & Logout */}
                        <AnimatePresence>
                          {showProfileDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              className="absolute right-0 mt-2 w-64 bg-white border border-slate-100/80 rounded-xl shadow-lg p-3 text-left z-50 flex flex-col gap-2.5 font-sans"
                            >
                              <div className="border-b border-slate-100 pb-2">
                                <p className="text-[10px] font-semibold text-slate-400 leading-none mb-1.5 border-0">
                                  {t("Akun Saya", "My Account")}
                                </p>
                                <h4 className="font-bold text-slate-800 text-[13px] truncate max-w-full leading-relaxed block capitalize">
                                  {session.name ? session.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : ''}
                                </h4>
                                <p className="text-[10px] text-slate-400 font-mono truncate max-w-full">
                                  {session.email}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {/* Menu Kunjungan Simpanan */}
                                <Link
                                  href="/simpanan"
                                  onClick={() => setShowProfileDropdown(false)}
                                  className="py-1 px-0.5 hover:opacity-85 flex items-center justify-between gap-3 group transition-all duration-200 cursor-pointer text-decoration-none bg-transparent border-0"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-[#111827] text-white flex items-center justify-center shrink-0">
                                      <Bookmark className="w-4 h-4 text-[#F9FAFB]" />
                                    </div>
                                    <div className="text-left min-w-0">
                                      <span className="text-xs font-bold text-[#111827] block">
                                        {t("Simpanan Saya", "My Saved Items")}
                                      </span>
                                      <span className="text-[11px] text-slate-500 block font-normal leading-none mt-1">
                                        {savedDesigns.length + savedAssets.length} {t("Item Tersimpan", "Saved Items")}
                                      </span>
                                    </div>
                                  </div>
                                </Link>
                                {session.email === 'irfanrizkiaditri@gmail.com' && (
                                  <Link
                                    href="/dashboard"
                                    onClick={() => setShowProfileDropdown(false)}
                                    className="w-full text-center py-2 bg-[#111827] hover:bg-slate-800 rounded-lg font-bold text-[10px] text-white cursor-pointer transition duration-250 flex items-center justify-center gap-1.5 focus:outline-none"
                                  >
                                    {t("Dasbor Statistik Admin", "Admin Stats Dashboard")}
                                  </Link>
                                )}
                                <button
                                  onClick={() => {
                                    if (!confirmLogout) {
                                      setConfirmLogout(true);
                                      return;
                                    }
                                    window.dispatchEvent(new Event('fanratech_start_loading'));
                                    setTimeout(() => {
                                      handleLogoutClearBookmarks();
                                      localStorage.removeItem('fanratech_session');
                                      setSession(null);
                                      setShowProfileDropdown(false);
                                      setConfirmLogout(false);
                                      window.dispatchEvent(new Event('fanratech_stop_loading'));
                                      // Otomatis arahkan kembali ke beranda (homepage) setelah keluar
                                      router.push('/');
                                    }, 450);
                                  }}
                                  suppressHydrationWarning
                                  className={`w-full text-center py-2 bg-transparent border-0 font-bold text-[11px] ${
                                    confirmLogout 
                                      ? 'text-red-600 hover:text-red-700 font-extrabold' 
                                      : 'text-slate-500 hover:text-[#111827]'
                                  } cursor-pointer transition-colors duration-200 focus:outline-none select-none`}
                                >
                                  {confirmLogout ? t("Yakin untuk Keluar?", "Are you sure?") : t("Keluar Akun (Logout)", "Log Out")}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setIsJoining(true);
                          window.dispatchEvent(new Event('fanratech_start_loading'));
                          router.push('/gabung');
                        }}
                        disabled={isJoining}
                        id="btn-header-join"
                        suppressHydrationWarning
                        className="px-3.5 h-7.5 text-xs font-lobster bg-[#111827] hover:bg-slate-800 text-white rounded-full transition-all duration-200 cursor-pointer select-none flex items-center justify-center tracking-wide gap-1.5 disabled:opacity-80"
                      >
                        {isJoining ? (
                          <svg className="animate-spin h-3.5 w-3.5 text-[#F9FAFB]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          t("Gabung", "Join")
                        )}
                      </button>
                    )}

                    {/* HamMenu Button - styled completely borderless and boxless, always visible on both Mobile and Desktop */}
                    <button
                      id="mobile-menu-toggle"
                      onClick={() => setIsOpen(!isOpen)}
                      suppressHydrationWarning
                      className="p-2 text-[#111827] hover:text-slate-700 bg-transparent border-0 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center relative z-40 outline-none"
                      aria-label="Toggle Menu"
                    >
                      <div className="flex flex-col gap-1.5 w-6 justify-center items-end">
                        <span className={`h-0.5 bg-[#111827] transition-all duration-300 rounded-full ${isOpen ? 'w-5.5 rotate-45 translate-y-2' : 'w-5.5'}`}></span>
                        <span className={`h-0.5 bg-[#111827] transition-all duration-300 rounded-full ${isOpen ? 'w-0 opacity-0' : 'w-3.5'}`}></span>
                        <span className={`h-0.5 bg-[#111827] transition-all duration-300 rounded-full ${isOpen ? 'w-5.5 -rotate-45 -translate-y-2' : 'w-4.5'}`}></span>
                      </div>
                    </button>
                  </>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Structured Dropdown Menu Drawer falling cleanly from bottom edge of the header container (absolute top-full) with zero gap */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="menu-drawer-full"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 w-full z-35 bg-white border-b border-t border-slate-100/50 shadow-xl py-6 px-6 sm:px-12 flex flex-col items-center justify-center text-center select-none rounded-br-2xl"
            >
              <div className="max-w-xs w-full flex flex-col gap-3.5 py-1">
                
                {/* Admin Exclusive Dashboard access */}
                {session?.email === 'irfanrizkiaditri@gmail.com' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full pb-3.5 border-b border-slate-100"
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#111827] text-white rounded-xl font-bold text-xs select-none hover:bg-slate-800 transition duration-200"
                    >
                      {t("Pusat Dasbor Admin", "Admin Dashboard Center")}
                    </Link>
                  </motion.div>
                )}

                {/* 1. Language Swatch Row (No "Bahasa:" label) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 }}
                  className="flex items-center justify-center gap-2.5 w-full pb-3 border-b border-slate-100"
                >
                  {/* Indonesian Flag Button */}
                  <button
                    onClick={() => {
                      if (lang !== 'id') setLang('id');
                    }}
                    disabled={lang === 'id'}
                    suppressHydrationWarning
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer disabled:cursor-default text-[11px] font-sans font-bold select-none ${
                      lang === 'id'
                        ? 'border-[#111827] bg-[#111827] text-white shadow-xs'
                        : 'border-slate-200 text-slate-500 hover:text-[#111827] hover:border-slate-400 bg-white'
                    }`}
                    title="Ubah Bahasa ke Indonesia"
                  >
                    <Image 
                      src="https://cdn-icons-png.flaticon.com/128/6157/6157721.png" 
                      alt="Indonesia Flag" 
                      width={14}
                      height={14}
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span>ID</span>
                  </button>

                  {/* English Flag Button */}
                  <button
                    onClick={() => {
                      if (lang !== 'en') setLang('en');
                    }}
                    disabled={lang === 'en'}
                    suppressHydrationWarning
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 cursor-pointer disabled:cursor-default text-[11px] font-sans font-bold select-none ${
                      lang === 'en'
                        ? 'border-[#111827] bg-[#111827] text-white shadow-xs'
                        : 'border-slate-200 text-slate-500 hover:text-[#111827] hover:border-slate-400 bg-white'
                    }`}
                    title="Switch Language to English"
                  >
                    <Image 
                      src="https://cdn-icons-png.flaticon.com/128/197/197374.png" 
                      alt="English Flag" 
                      width={14}
                      height={14}
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span>EN</span>
                  </button>
                </motion.div>

                {/* 2. Contact Row Section */}
                <div className="flex flex-col gap-2">
                  {/* WhatsApp Contact Button - Monochromatic & boxless */}
                  <motion.a
                    href="https://wa.me/6288291298977"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-center gap-2.5 py-1.5 font-sans font-bold text-[#111827] hover:text-slate-500 transition-colors cursor-pointer text-sm"
                  >
                    <svg className="w-5 h-5 flex-shrink-0 text-[#111827] fill-current" viewBox="0 0 24 24">
                      <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.459 3.473 1.332 4.981L2 22l5.187-1.36c1.46.797 3.097 1.216 4.819 1.221H12.022c5.502 0 9.98-4.478 9.98-9.984C22 7.026 17.518 2 12.012 2zm6.273 14.183c-.256.719-1.285 1.314-1.776 1.385-.491.071-.979.135-3.15-.765-2.617-1.085-4.275-3.738-4.405-3.91-.13-.172-1.054-1.401-1.054-2.671a2.82 2.82 0 01.879-1.996c.27-.249.593-.314.79-.314.198 0 .393-.001.564.007.18.008.419-.068.653.491.241.576.818 1.996.888 2.14.07.144.116.312.02.502-.095.19-.143.308-.285.474-.143.167-.3.376-.429.5-.145.14-.298.293-.128.583.17.291.758 1.248 1.626 2.019.167.149.313.298.47.447.157.149.256.124.382-.022.126-.145.541-.628.685-.843.143-.215.286-.179.48-.108.194.072 1.233.581 1.444.689.211.108.351.162.404.252.053.09.053.52-.203 1.239z"/>
                    </svg>
                    <span>{t("Hubungi lewat WhatsApp", "Contact via WhatsApp")}</span>
                  </motion.a>
     
                  {/* Email Contact Button - Monochromatic & boxless */}
                  <motion.a
                    href="mailto:irfanrizkiaditri@gmail.com"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex items-center justify-center gap-2.5 py-1.5 font-sans font-bold text-[#111827] hover:text-slate-500 transition-colors cursor-pointer text-sm"
                  >
                    <svg className="w-5 h-5 flex-shrink-0 text-[#111827]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 6l-10 7L2 6" />
                    </svg>
                    <span>{t("Hubungi lewat Email", "Contact via Email")}</span>
                  </motion.a>
                </div>
  
                {/* 3. Branding Footer Info */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col items-center text-center">
                  <h3 className="font-lobster text-lg tracking-wide text-[#111827] mb-0.5">
                    Fanra<span className="text-slate-400 font-normal">Tech</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans max-w-xs">
                    {t(
                      "Seni visual kreatif dengan rancangan geometri modern penuh presisi dan fungsionalitas.",
                      "Creative visual art with modern geometric designs full of precision and functionality."
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Floating Alert Join Toast Success */}
      <AnimatePresence>
        {showJoinedModal && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-[90vw] bg-[#111827] text-white p-4 rounded-xl shadow-2xl border border-zinc-800 flex items-start gap-3"
          >
            <div className="p-1.5 bg-white text-[#111827] rounded-lg mt-0.5 font-bold text-xs">
              ✓
            </div>
            <div>
              <h4 className="font-display font-extrabold text-sm text-[#F9FAFB]">{t("Selamat Bergabung!", "Welcome Aboard!")}</h4>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                {t(
                  "Anda berhasil masuk dalam daftar tunggu kolaborasi premium FanraTech. Kami akan menghubungi Anda lewat email segera.",
                  "You have successfully joined the FanraTech premium collaboration waitlist. We will contact you via email shortly."
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Toast - Putih, Tengah Bawah, Ramping & Sangat Bagus di HP */}
      <AnimatePresence>
        {globalToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 15, x: "-50%" }}
            style={{ left: "50%", transform: "translateX(-50%)" }}
            className="fixed bottom-6 z-[999999] max-w-[90vw] bg-white text-[#111827] px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-200/90 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-extrabold tracking-tight select-none whitespace-nowrap"
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white shrink-0 ${
              globalToast.type === 'error' ? 'bg-red-500' : 'bg-[#111827]'
            }`}>
              {globalToast.type === 'error' ? '!' : '✓'}
            </span>
            <span className="font-sans font-bold leading-none">{globalToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


