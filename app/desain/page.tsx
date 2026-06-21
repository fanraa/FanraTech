'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import PortfolioGrid from '@/components/PortfolioGrid';
import Footer from '@/components/Footer';
import DesignDetail from '@/components/DesignDetail';
import CookieBanner from '@/components/CookieBanner';
import { DesignItem, portfolioItems, allExtendedAssets, getSavedDesigns, getSavedAssets, translateDesignItem } from '@/lib/data';
import { syncDesignsFromCloud, syncAssetsFromCloud, recordPageHit } from '@/lib/firebaseSync';
import { persistBookmarkToggle, syncBookmarksWithCloud, getLoggedUserEmail } from '@/lib/bookmarkSync';
import { useLanguage } from '@/hooks/useLanguage';

export default function DesainPage() {
  const { lang, t } = useLanguage();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [extendedAssets, setExtendedAssets] = useState<DesignItem[]>([]);
  const [selectedDesignItem, setSelectedDesignItem] = useState<DesignItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetItem, setSelectedAssetItem] = useState<DesignItem | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [savedAssetIds, setSavedAssetIds] = useState<string[]>([]);

  const translatedDesigns = React.useMemo(() => {
    return designs.map(item => translateDesignItem(item, lang));
  }, [designs, lang]);

  const translatedExtendedAssets = React.useMemo(() => {
    return extendedAssets.map(item => translateDesignItem(item, lang));
  }, [extendedAssets, lang]);

  const translatedSelectedDesignItem = React.useMemo(() => {
    if (!selectedDesignItem) return null;
    return translateDesignItem(selectedDesignItem, lang);
  }, [selectedDesignItem, lang]);

  const translatedSelectedAssetItem = React.useMemo(() => {
    if (!selectedAssetItem) return null;
    return translateDesignItem(selectedAssetItem, lang);
  }, [selectedAssetItem, lang]);

  useEffect(() => {
    // Catat kunjungan halaman riil
    recordPageHit();
    window.dispatchEvent(new Event('fanratech_start_loading'));

    // Jalankan sinkronisasi bookmark cloud sewaktu memuat halaman
    syncBookmarksWithCloud();

    // Safely load local storage values on client mount asynchronously
    const deferTimer = setTimeout(() => {
      setDesigns(getSavedDesigns());
      setExtendedAssets(getSavedAssets());
    }, 0);

    // Jalankan sinkronisasi cloud di latar belakang
    syncDesignsFromCloud().then(cloudDesigns => {
      if (cloudDesigns) {
        setDesigns(cloudDesigns);
      }
    });
    syncAssetsFromCloud().then(cloudAssets => {
      if (cloudAssets) {
        setExtendedAssets(cloudAssets);
      }
    });

    // Check query params if any item wants to be opened directly
    if (typeof window !== 'undefined') {
      const queryParams = new URLSearchParams(window.location.search);
      const openDesignId = queryParams.get('openDesign');
      if (openDesignId) {
        const found = getSavedDesigns().find(d => d.id === openDesignId);
        if (found) {
          setTimeout(() => {
            setSelectedDesignItem(found);
          }, 0);
        }
      }
      const openAssetId = queryParams.get('openAsset');
      if (openAssetId) {
        const found = getSavedAssets().find(a => a.id === openAssetId);
        if (found) {
          setTimeout(() => {
            setSelectedAssetItem(found);
          }, 0);
        }
      }
    }

    const handleSync = () => {
      setDesigns(getSavedDesigns());
      setExtendedAssets(getSavedAssets());
    };

    // Listen to custom events to open design detail dynamically from the header dropdown list
    const handleOpenDesign = (e: Event) => {
      const customEvent = e as CustomEvent<DesignItem>;
      if (customEvent.detail) {
        setSelectedDesignItem(customEvent.detail);
      }
    };

    const handleOpenAsset = (e: Event) => {
      const customEvent = e as CustomEvent<DesignItem>;
      if (customEvent.detail) {
        setSelectedAssetItem(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('fanratech_data_updated', handleSync);
    window.addEventListener('fanratech_open_design', handleOpenDesign);
    window.addEventListener('fanratech_open_asset', handleOpenAsset);

    const timer = setTimeout(() => {
      setIsPageLoading(false);
      window.dispatchEvent(new Event('fanratech_stop_loading'));
    }, 120);

    return () => {
      clearTimeout(timer);
      clearTimeout(deferTimer);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('fanratech_data_updated', handleSync);
      window.removeEventListener('fanratech_open_design', handleOpenDesign);
      window.removeEventListener('fanratech_open_asset', handleOpenAsset);
    };
  }, []);

  useEffect(() => {
    const deferSavedTimer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fanratech_saved_assets');
        if (saved) {
          try {
            setSavedAssetIds(JSON.parse(saved));
          } catch (e) {
            setSavedAssetIds([]);
          }
        }
      }
    }, 0);
    return () => clearTimeout(deferSavedTimer);
  }, []);

  // Dynamically set pixel grid count based on viewport sizing, to ensure exactly 1 row without horizontal scroll
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) { // Desktop Full
        setVisibleCount(10);
      } else if (width >= 768) { // Tablet
        setVisibleCount(8);
      } else if (width >= 640) { // Small screen
        setVisibleCount(6);
      } else { // XS/Mobile
        setVisibleCount(5);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger top progress bar beautifully on search changes
  useEffect(() => {
    if (searchQuery.trim() !== "") {
      window.dispatchEvent(new Event('fanratech_start_loading'));
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('fanratech_stop_loading'));
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const handleToggleSave = async (item: DesignItem) => {
    const email = getLoggedUserEmail();
    if (!email) {
      await persistBookmarkToggle(item.id, 'asset');
      return;
    }

    const isSaved = savedAssetIds.includes(item.id);
    const message = isSaved ? `Aset "${item.title}" dihapus.` : `Aset "${item.title}" disimpan.`;
    
    // update local state for real-time reactivity
    const updated = isSaved 
      ? savedAssetIds.filter(id => id !== item.id)
      : [...savedAssetIds, item.id];
    setSavedAssetIds(updated);

    await persistBookmarkToggle(item.id, 'asset');
  };

  const handleDownloadSVG = (item: DesignItem) => {
    setDownloadingId(item.id);

    setTimeout(() => {
      try {
        const svgContent = item.svgContent;
        if (!svgContent) return;
        const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.sourceFile || `fanratech_${item.id}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setToastMessage(t(`Unduhan "${item.title}" berhasil.`, `Download "${item.title}" successful.`));
      } catch (err) {
        setToastMessage(t("Gagal mengunduh berkas.", "Failed to download file."));
      } finally {
        setDownloadingId(null);
        setTimeout(() => setToastMessage(null), 2000);
      }
    }, 300);
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setToastMessage(t(`Warna ${hex} disalin.`, `Color ${hex} copied.`));
    setTimeout(() => {
      setCopiedColor(null);
      setToastMessage(null);
    }, 1500);
  };

  // Lock body scroll of parents when modal is active
  useEffect(() => {
    if (selectedAssetItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedAssetItem]);

  // Keep search query synchronized with URL param
  useEffect(() => {
    const readQueryParam = () => {
      if (typeof window !== 'undefined') {
        const q = new URLSearchParams(window.location.search).get('q') || "";
        setSearchQuery(q);
      }
    };

    readQueryParam();

    // Listen to history popstate (back/forward keys) to keep synced
    window.addEventListener('popstate', readQueryParam);
    return () => window.removeEventListener('popstate', readQueryParam);
  }, []);

  // Keyboard shortcut listener for toggle Fullscreen with 'f' key in Desain page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || (activeEl as HTMLElement).isContentEditable) {
          // Skip if user is typing
          return;
        }
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.error(`Gagal masuk ke mode fullscreen: ${err.message}`);
          });
        } else {
          document.exitFullscreen().catch((err) => {
            console.error(`Gagal keluar dari mode fullscreen: ${err.message}`);
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter designs based on search query
  const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
  
  const filteredDesigns = searchQuery.trim() === "" 
    ? translatedDesigns 
    : translatedDesigns.filter(item => {
        const searchableText = `${item.title} ${item.category} ${item.description} ${item.longDescription} ${item.dimensions?.pixels || ""} ${item.dimensions?.type || ""} ${(item.elements || []).join(' ')} ${(item.fonts || []).map(f => f.name).join(' ')}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });

  // Filter generated assets based on search query
  const generatedAssets = translatedExtendedAssets.filter(item => item.id.startsWith("gen-asset-"));
  const filteredAssets = searchQuery.trim() === ""
    ? [] // Only show on active search keywords
    : generatedAssets.filter(item => {
        const searchableText = `${item.title} ${item.category} ${item.description} ${item.longDescription} ${item.dimensions?.pixels || ""} ${item.dimensions?.type || ""} ${(item.elements || []).join(' ')} ${(item.fonts || []).map(f => f.name).join(' ')}`.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });

  const hasResults = searchQuery.trim() === "" || filteredDesigns.length > 0 || filteredAssets.length > 0;

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-x-hidden bg-[#F9FAFB]">
      {/* Universal header navigation */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main content with padding-top to account for fixed navbar */}
      <div className="flex-1 w-full pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col">
        {selectedDesignItem ? (
          <DesignDetail
            item={selectedDesignItem}
            onClose={() => setSelectedDesignItem(null)}
            onSelect={setSelectedDesignItem}
          />
        ) : (
          <>
            {/* Breadcrumb Section */}
            <div className="py-4 flex items-center gap-2 text-xs font-bold text-slate-400 select-none">
              <Link href="/" className="hover:text-[#111827] transition-colors">{t("Beranda", "Home")}</Link>
              <span>/</span>
              <span className="text-[#111827]">{t("Eksplorasi Desain", "Design Exploration")}</span>
            </div>

            {/* Hero title area */}
            <div className="py-8 text-left space-y-3">
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4.5xl font-display font-medium text-slate-950 tracking-tight"
              >
                {lang === 'id' ? (
                  <>Eksplorasi <span className="font-extrabold text-[#111827]">Desain Kreatif</span></>
                ) : (
                  <>Creative <span className="font-extrabold text-[#111827]">Design Exploration</span></>
                )}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-xs sm:text-sm text-slate-500 max-w-2xl font-sans leading-relaxed"
              >
                {t(
                  "Koleksi karya desain geometris premium, layout UI/UX fungsional, dan identitas visual eksklusif dengan aspek rasio presisi.",
                  "A curated collection of premium geometric designs, highly functional UI/UX wireframes, and exclusive brand identities with ultra-precise aspect ratios."
                )}
              </motion.p>
            </div>

            {/* Prominent, edge-to-edge search bar */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative w-full mb-8"
            >
              <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={t("Cari berbagai karya desain kreatif...", "Search creative designs & vector assets...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 text-xs sm:text-sm font-sans text-[#111827] bg-white border border-slate-200 focus:border-[#111827] focus:ring-1 focus:ring-[#111827]/10 rounded-2xl focus:outline-none transition-all font-medium placeholder-slate-400 shadow-3xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-[#111827] cursor-pointer focus:outline-none"
                  title={t("Bersihkan", "Clear")}
                >
                  <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </motion.div>

            {/* Gallery render logic */}
            {!hasResults ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-20 px-4 bg-white border border-slate-150 rounded-3xl shadow-3xs max-w-xl mx-auto my-8 select-none"
              >
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-5">
                  <svg className="w-8 h-8 stroke-[1.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900">{t("Pencarian Tidak Ditemukan", "Search Result Not Found")}</h3>
                <p className="font-sans text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                  {t(
                    `Maaf, kata kunci “` + searchQuery + `” tidak cocok dengan portofolio desain maupun aset seni kami. Coba kata kunci alternatif seperti Kopi, Buah, Jeruk, atau Swiss.`,
                    `Sorry, the keyword “` + searchQuery + `” did not match any of our portfolios or assets. Try alternative keywords such as Coffee, Fruit, Orange, or Swiss.`
                  )}
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-6 px-5 py-2 rounded-full bg-[#111827] text-white hover:bg-slate-800 transition-colors font-sans font-bold text-xs cursor-pointer"
                >
                  {t("Bersihkan Pencarian", "Clear Search")}
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-10 pb-16">
                {/* 1. Karya Desain Section */}
                {filteredDesigns.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {searchQuery.trim() !== "" && (
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" />
                        <h2 className="font-display font-extrabold text-[#111827] uppercase tracking-wider text-xs sm:text-sm">
                          {t("Karya Desain Kreatif", "Creative Design Work")} ({filteredDesigns.length})
                        </h2>
                      </div>
                    )}
                    <div className="-mx-4 sm:mx-0">
                      <PortfolioGrid 
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onSelectItem={setSelectedDesignItem}
                        showLimit={false}
                        isFullPage={true}
                      />
                    </div>
                  </div>
                )}

                {/* 2. Aset Vektor & Ornamen Section */}
                {filteredAssets.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-slate-105 pb-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" />
                      <h2 className="font-display font-extrabold text-[#111827] uppercase tracking-wider text-xs sm:text-sm">
                        {t("Aset Vektor & Ornamen Eksklusif", "Exclusive Vector Assets & Ornaments")} ({filteredAssets.length})
                      </h2>
                    </div>
                    {isPageLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
                        {Array.from({ length: Math.min(5, filteredAssets.length) }).map((_, i) => (
                          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-3 aspect-square w-full">
                            <div className="aspect-square w-full rounded-xl bg-slate-200/60" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredAssets.map((asset) => (
                          <motion.div
                            key={asset.id}
                            onClick={() => setSelectedAssetItem(asset)}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-3 hover:border-[#111827] hover:shadow-lg transition-all flex flex-col justify-between select-none"
                          >
                            <div className="aspect-square w-full rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-5 relative group-hover:bg-[#F9FAFB] transition-colors">
                              <div 
                                className="w-full h-full max-w-[125px] max-h-[125px] flex items-center justify-center text-[#111827] group-hover:scale-105 transition-transform duration-300" 
                                dangerouslySetInnerHTML={{ __html: asset.svgContent || "" }} 
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Bottom Row (Tinggi Satu) on Empty Search - Perfectly sized to keep 1 row without scrollbars */}
                {searchQuery.trim() === "" && (
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="border-b border-slate-100 pb-2">
                      <h2 className="font-sans text-xs sm:text-sm text-slate-500 font-medium">
                        {t("Aset digital pilihan", "Featured digital assets")}
                      </h2>
                    </div>
                    {isPageLoading ? (
                      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2 w-full animate-pulse">
                        {Array.from({ length: visibleCount }).map((_, i) => (
                          <div key={i} className="rounded-lg border border-slate-100 bg-white p-1 sm:p-1.5 w-full aspect-square flex items-center justify-center">
                            <div className="w-full h-full bg-slate-200/50 rounded" />
                          </div>
                        ))}
                      </div>
                    ) : translatedExtendedAssets.filter(item => item.id.startsWith("gen-asset-")).length === 0 ? (
                      <div className="py-3 text-left">
                        <p className="font-sans text-xs sm:text-sm text-slate-400 font-normal">
                          {t("Aset digital pilihan saat ini masih kosong.", "Featured digital assets are currently empty.")}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2 w-full">
                        {translatedExtendedAssets.filter(item => item.id.startsWith("gen-asset-")).slice(0, visibleCount).map((asset) => (
                          <motion.div
                            key={asset.id}
                            onClick={() => setSelectedAssetItem(asset)}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="group cursor-pointer rounded-lg border border-slate-100 bg-white p-1 sm:p-1.5 hover:border-[#111827]/30 hover:shadow-xs transition-all w-full aspect-square select-none flex items-center justify-center relative overflow-hidden"
                          >
                            <div 
                              className="w-full h-full flex items-center justify-center text-[#111827] group-hover:scale-[1.03] transition-transform duration-300" 
                              dangerouslySetInnerHTML={{ __html: asset.svgContent || "" }} 
                            />
                            <div className="absolute inset-0 bg-[#111827]/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Universal Footer */}
      <Footer />

      {/* Old overlay modal is completely skipped for a natural inline page view */}

      {/* Dynamic Center Asset Popup Modal - Match structure of AboutMe's Asset Popup */}
      <AnimatePresence>
        {selectedAssetItem && translatedSelectedAssetItem && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans focus:outline-none">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAssetItem(null)}
              className="absolute inset-0 bg-transparent cursor-default"
              id="modal-backdrop"
            />

            {/* Small centered modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-[280px] bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-4 sm:p-5 space-y-4.5 z-20"
              id="asset-detail-sheet"
            >
              {/* Save asset button */}
              <button
                onClick={() => handleToggleSave(selectedAssetItem)}
                className="absolute top-4 left-4 p-1 cursor-pointer focus:outline-none flex items-center justify-center transition-none"
                title={savedAssetIds.includes(selectedAssetItem.id) ? t("Sudah disimpan", "Already saved") : t("Simpan aset", "Save asset")}
              >
                <Image 
                  src={savedAssetIds.includes(selectedAssetItem.id) 
                    ? "https://cdn-icons-png.flaticon.com/128/5668/5668020.png" 
                    : "https://cdn-icons-png.flaticon.com/128/5186/5186087.png"
                  } 
                  alt="Save Asset Icon"
                  width={18}
                  height={18}
                  className="object-contain transition-none"
                  referrerPolicy="no-referrer"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(8%) sepia(16%) saturate(1914%) hue-rotate(185deg) brightness(97%) contrast(97%)',
                    opacity: savedAssetIds.includes(selectedAssetItem.id) ? 1 : 0.3
                  }}
                />
              </button>

              {/* Close asset button */}
              <button
                onClick={() => setSelectedAssetItem(null)}
                className="absolute top-4 right-4 p-1 cursor-pointer focus:outline-none flex items-center justify-center text-slate-400 hover:text-[#111827] transition-none"
                title={t("Tutup", "Close")}
              >
                <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Miniature Vector SVG Preview */}
              <div className="w-full aspect-square max-w-[110px] bg-[#F9FAFB] rounded-xl border border-slate-100 p-2 mx-auto flex items-center justify-center relative overflow-hidden shadow-xs">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
                <div 
                  className="w-full h-full flex items-center justify-center select-none z-10"
                  dangerouslySetInnerHTML={{ __html: translatedSelectedAssetItem.svgContent || "" }}
                />
              </div>

              {/* Details of asset */}
              <div className="space-y-3 pb-1">
                <h3 className="text-xs sm:text-sm font-extrabold font-sans text-slate-900 leading-tight text-center px-2">
                  {translatedSelectedAssetItem.title}
                </h3>

                {/* Clickable color HEX codes */}
                {translatedSelectedAssetItem.colors && translatedSelectedAssetItem.colors.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 pt-0.5">
                    {translatedSelectedAssetItem.colors.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => handleCopyColor(color.hex)}
                        className="flex items-center gap-1 p-0.5 px-1 rounded hover:border-slate-300 transition-none text-left bg-[#F9FAFB] text-[#111827] cursor-pointer focus:outline-none shrink-0 border border-slate-100"
                        title={t(`Salin warna ${color.name} (${color.hex})`, `Copy color ${color.name} (${color.hex})`)}
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-xs shrink-0 border border-slate-200/10" 
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[8px] font-bold font-mono text-slate-700 tracking-tight leading-none">{color.hex}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-100 pt-2.5" />

                {/* Download and cancel actions */}
                <div className="flex flex-col items-center justify-center gap-2 pt-0.5">
                  <button
                    onClick={() => handleDownloadSVG(selectedAssetItem)}
                    disabled={downloadingId !== null}
                    className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-lg border border-slate-200 bg-[#F9FAFB] text-slate-700 hover:text-[#111827] hover:border-slate-400 transition-none cursor-pointer focus:outline-none shrink-0"
                    title={t("Unduh Berkas Vektor", "Download Vector File")}
                  >
                    <Image 
                      src="https://cdn-icons-png.flaticon.com/128/2767/2767144.png" 
                      alt="Download"
                      width={14}
                      height={14}
                      className="object-contain transition-none"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[10px] font-black font-sans">
                      {downloadingId ? t("Memproses...", "Processing...") : t("Unduh Vektor (.svg)", "Download Vector (.svg)")}
                    </span>
                  </button>

                  <button
                    onClick={() => setSelectedAssetItem(null)}
                    className="text-[9px] text-slate-400 hover:text-[#111827] focus:outline-none transition-none cursor-pointer font-sans underline underline-offset-2 inline-block pt-1"
                    title={t("Kembali ke galeri", "Back to gallery")}
                  >
                    {t("kembali", "back")}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 15, x: "-50%" }}
            style={{ left: "50%", transform: "translateX(-50%)" }}
            className="fixed bottom-6 z-[99999] bg-white text-[#111827] px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-200/90 flex items-center gap-2 text-[10px] sm:text-xs font-extrabold select-none whitespace-nowrap"
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white shrink-0 bg-[#111827]">
              ✓
            </span>
            <span className="font-sans font-bold leading-none">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie banner */}
      <CookieBanner />
    </main>
  );
}
