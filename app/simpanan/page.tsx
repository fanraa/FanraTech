'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Trash2, ExternalLink, Bookmark, Grid, Eye, ShieldCheck, Heart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { portfolioItems, allExtendedAssets, DesignItem, getSavedDesigns, getSavedAssets, translateDesignItem } from '@/lib/data';
import { syncBookmarksWithCloud } from '@/lib/bookmarkSync';
import { useLanguage } from '@/hooks/useLanguage';

export default function SimpananPage() {
  const { lang, t } = useLanguage();
  const [savedDesigns, setSavedDesigns] = useState<DesignItem[]>([]);
  const [savedAssets, setSavedAssets] = useState<DesignItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'designs' | 'assets'>('all');

  const loadSavedData = () => {
    if (typeof window !== 'undefined') {
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
    }
  };

  useEffect(() => {
    window.dispatchEvent(new Event('fanratech_start_loading'));
    
    // Sinkronisasi data simpanan dari Firestore jika sedang masuk akun
    syncBookmarksWithCloud();

    setTimeout(() => {
      loadSavedData();
      setIsLoaded(true);
      window.dispatchEvent(new Event('fanratech_stop_loading'));
    }, 80);

    // Listen to changes from outside
    window.addEventListener('fanratech_data_updated', loadSavedData);
    window.addEventListener('storage', loadSavedData);

    return () => {
      window.removeEventListener('fanratech_data_updated', loadSavedData);
      window.removeEventListener('storage', loadSavedData);
    };
  }, []);

  const isAllEmpty = savedDesigns.length === 0 && savedAssets.length === 0;
  const isDesignsEmpty = savedDesigns.length === 0;
  const isAssetsEmpty = savedAssets.length === 0;

  const translatedDesigns = React.useMemo(() => {
    return savedDesigns.map(item => translateDesignItem(item, lang));
  }, [savedDesigns, lang]);

  const translatedAssets = React.useMemo(() => {
    return savedAssets.map(item => translateDesignItem(item, lang));
  }, [savedAssets, lang]);

  const showEmptyState = 
    (activeTab === 'all' && isAllEmpty) ||
    (activeTab === 'designs' && isDesignsEmpty) ||
    (activeTab === 'assets' && isAssetsEmpty);

  return (
    <div id="simpanan-page-wrapper" className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col font-sans selection:bg-[#111827] selection:text-white">
      {/* Header */}
      <Header searchQuery="" setSearchQuery={() => {}} />

      {/* Main Content Area */}
      <main className="flex-grow pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb / Back button */}
        <div className="mb-8">
          <Link
            href="/desain"
            id="back-to-catalog-btn"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#111827] transition-colors leading-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("Kembali ke Galeri Desain", "Back to Design Gallery")}
          </Link>
        </div>

        {/* Hero Banner Section */}
        <div className="bg-[#111827] text-[#F9FAFB] rounded-2xl p-6 md:p-10 mb-10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#111827]/10 shadow-sm">
          {/* Noise effect background */}
          <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay bg-[radial-gradient(#F9FAFB_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 max-w-xl text-left">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3 block">
              <Bookmark className="w-3 h-3" />
              {t("Ruang Kurasi Pribadi", "Personal Curation Space")}
            </span>
            <h1 className="text-3xl font-black tracking-tight mb-2 sm:text-4xl text-left">
              {t("Simpanan Saya", "My Saved Items")}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md text-left font-sans">
              {lang === 'id' ? (
                <>Daftar seluruh mahakarya desain dan ekosistem aset vektor karya <span className="font-bold text-white">FanraTech</span> yang telah Anda bookmark untuk inspirasi instan dalam berbagai perangkat Anda.</>
              ) : (
                <>A curated collection of all design masterpieces and vector asset ecosystems by <span className="font-bold text-white">FanraTech</span> that you have bookmarked for instant inspiration across all your devices.</>
              )}
            </p>
          </div>

          <div className="relative z-10 flex gap-6 shrink-0 sm:w-auto w-full justify-start items-center">
            <div className="text-left py-1 pr-6 border-r border-white/10">
              <span className="text-2xl font-bold text-[#F9FAFB] block">
                {savedDesigns.length}
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mt-1">
                {t("Desain", "Designs")}
              </span>
            </div>
            <div className="text-left py-1">
              <span className="text-2xl font-bold text-[#F9FAFB] block">
                {savedAssets.length}
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mt-1">
                {t("Aset", "Assets")}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="mb-8 border-b border-slate-200/60 pb-1 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none select-none">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#111827] text-white border border-[#111827]'
                  : 'text-slate-500 hover:text-[#111827] hover:bg-slate-100'
              }`}
            >
              {t("Semua", "All")} ({savedDesigns.length + savedAssets.length})
            </button>
            <button
              onClick={() => setActiveTab('designs')}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'designs'
                  ? 'bg-[#111827] text-white border border-[#111827]'
                  : 'text-slate-500 hover:text-[#111827] hover:bg-slate-100'
              }`}
            >
              {t("Desain", "Designs")} ({savedDesigns.length})
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                activeTab === 'assets'
                  ? 'bg-[#111827] text-white border border-[#111827]'
                  : 'text-slate-500 hover:text-[#111827] hover:bg-slate-100'
              }`}
            >
              {t("Aset", "Assets")} ({savedAssets.length})
            </button>
          </div>
        </div>

        {/* Dynamic Display Grid */}
        {!isLoaded ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-[#111827] border-t-transparent animate-spin" />
            <span className="text-xs font-bold text-slate-500">{t("Memuat data simpanan...", "Loading saved items...")}</span>
          </div>
        ) : showEmptyState ? (
          /* Empty State */
          <motion.div
            id="empty-saved-state"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto my-16 flex flex-col items-center gap-4 select-none animate-fade-in"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100/80 flex items-center justify-center text-slate-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#111827] mb-2 font-sans">
                {activeTab === 'designs' 
                  ? t("Eits, kurasi simpanan desainmu masih kosong nih!", "Ouch, your saved designs list is still empty!")
                  : activeTab === 'assets'
                    ? t("Uwow, folder simpanan asetmu ternyata masih kosong!", "Wow, your saved assets folder is still empty!")
                    : t("Wah, kurasi simpananmu masih kosong nih!", "Ah, your personal curation is still empty!")}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans font-normal">
                {activeTab === 'designs'
                  ? t("Kamu belum mengoleksi portofolio desain estetik satu pun. Yuk, kembali ke galeri dan amankan desain-desain favoritmu!", "You haven't saved any aesthetic design portfolios yet. Let's head back to the gallery and save your favorites!")
                  : activeTab === 'assets'
                    ? t("Belum ada berkas vektor orisinal piksel-presisi yang terbookmark. Ayo cari aset terbaik karya FanraTech untuk mempercantik karyamu!", "No pixel-perfect original vector files bookmarked yet. Let's find outstanding assets by FanraTech to beautify your work!")
                    : t("Kamu belum mengoleksi portofolio desain atau aset menarik apa pun. Tenang aja, yuk mulai jelajahi seluruh mahakarya di galeri kami dan klik tombol simpan untuk mengumpulkannya di halaman kurasi pribadi ini!", "You haven't collected any design portfolios or stunning assets yet. Don't worry, start exploring the masterpieces in our gallery and hit the bookmark button to collect them right here!")}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {/* Designs Section */}
              {(activeTab === 'all' || activeTab === 'designs') &&
                translatedDesigns.map((item) => (
                  <motion.div
                    key={`design-${item.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs hover:border-slate-200 transition-all duration-200 cursor-pointer ${item.aspectRatioClass || 'aspect-[4/3]'}`}
                  >
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Clicking anywhere on the design triggers the design detail modal on /desain */}
                    <Link 
                      href={`/desain?openDesign=${item.id}`}
                      className="absolute inset-0 bg-transparent z-10"
                      title={t(`Buka detail ${item.title}`, `View details for ${item.title}`)}
                    />
                  </motion.div>
                ))
              }

              {/* Assets Section */}
              {(activeTab === 'all' || activeTab === 'assets') &&
                translatedAssets.map((item) => (
                  <motion.div
                    key={`asset-${item.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="group relative bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xs hover:shadow-xs hover:border-slate-200 transition-all duration-200 aspect-square flex items-center justify-center p-3 select-none cursor-pointer"
                  >
                    <div 
                      className="w-full h-full max-w-[110px] max-h-[110px] select-none pointer-events-none filter drop-shadow-[0_2px_6px_rgba(17,24,39,0.06)] flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: item.svgContent }}
                    />
                    {/* Clicking anywhere on the asset triggers the asset detail modal on /desain */}
                    <Link 
                      href={`/desain?openAsset=${item.id}`}
                      className="absolute inset-0 bg-transparent z-10"
                      title={t(`Buka detail ${item.title}`, `View details for ${item.title}`)}
                    />
                  </motion.div>
                ))
              }
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
