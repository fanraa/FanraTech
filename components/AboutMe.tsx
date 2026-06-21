'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { portfolioItems, DesignItem, allExtendedAssets, getSavedAssets } from '../lib/data';
import { persistBookmarkToggle, syncBookmarksWithCloud, getLoggedUserEmail } from '../lib/bookmarkSync';
import { useLanguage } from '@/hooks/useLanguage';

const getPaginationRange = (current: number, total: number) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const range: (number | string)[] = [];
  
  // Page 1 is always premium and persistent
  range.push(1);

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) {
    range.push("...");
  }

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  if (end < total - 1) {
    range.push("...");
  }

  // Last page is always persistent
  range.push(total);

  return range;
};

const pexelsImages = [
  "https://images.pexels.com/photos/5968231/pexels-photo-5968231.jpeg",
  "https://images.pexels.com/photos/18488763/pexels-photo-18488763.jpeg",
  "https://images.pexels.com/photos/30094991/pexels-photo-30094991.jpeg"
];

const dribbbleImages = [
  "https://cdn.dribbble.com/userupload/12931817/file/original-ce4e8b855d9891d78de027c56d9a9f28.png?resize=640x480&vertical=center",
  "https://cdn.dribbble.com/userupload/14961338/file/original-3468b89f60184a728c2a4483384706ab.png?resize=640x480&vertical=center",
  "https://cdn.dribbble.com/userupload/14125238/file/original-88b385d4cb8632a242f1ec688b78d78b.jpg?resize=640x480&vertical=center"
];

const publicVectorsImages = [
  "https://res.cloudinary.com/dew39kqhy/image/upload/v1782037435/Cuplikan_layar_2026-06-21_172223_lnbc64.png",
  "https://res.cloudinary.com/dew39kqhy/image/upload/v1782037502/Cuplikan_layar_2026-06-21_172413_co1ykd.png",
  "https://res.cloudinary.com/dew39kqhy/image/upload/v1782037599/Cuplikan_layar_2026-06-21_172621_xpwot7.png"
];

export default function AboutMe() {
  const { lang, t } = useLanguage();
  const [selectedAsset, setSelectedAsset] = useState<DesignItem | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cols, setCols] = useState(5);
  const [loadedAssets, setLoadedAssets] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isAboutLoading, setIsAboutLoading] = useState(true);
  const [savedAssetIds, setSavedAssetIds] = useState<string[]>([]);
  const [extendedAssets, setExtendedAssets] = useState<DesignItem[]>(allExtendedAssets);
  
  const [pexelsIdx, setPexelsIdx] = useState(0);
  const [dribbbleIdx, setDribbbleIdx] = useState(0);
  const [publicVectorsIdx, setPublicVectorsIdx] = useState(0);

  // Irregular independent intervals for slower, non-simultaneous changes
  useEffect(() => {
    const pexelsTimer = setInterval(() => {
      setPexelsIdx((prev) => (prev + 1) % pexelsImages.length);
    }, 8500); // changes every 8.5 seconds

    const dribbbleTimer = setInterval(() => {
      setDribbbleIdx((prev) => (prev + 1) % dribbbleImages.length);
    }, 11000); // changes every 11 seconds

    const publicVectorsTimer = setInterval(() => {
      setPublicVectorsIdx((prev) => (prev + 1) % publicVectorsImages.length);
    }, 13500); // changes every 13.5 seconds

    return () => {
      clearInterval(pexelsTimer);
      clearInterval(dribbbleTimer);
      clearInterval(publicVectorsTimer);
    };
  }, []);
  
  useEffect(() => {
    setExtendedAssets(getSavedAssets());
    const handleSync = () => {
      setExtendedAssets(getSavedAssets());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('fanratech_data_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('fanratech_data_updated', handleSync);
    };
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAboutLoading(false);
    }, 850);

    const deferTimer = setTimeout(() => {
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

    return () => {
      clearTimeout(timer);
      clearTimeout(deferTimer);
    };
  }, []);

  // Keep track of viewport column counts dynamically
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setCols(10);
      } else {
        setCols(5);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut listener for toggle Fullscreen with 'f' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || (activeEl as HTMLElement).isContentEditable) {
          // Skip if the user is typing in lookups, input boxes, or textareas
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter assets on type / name / tags / resolution / elements / descriptions
  const filteredAssets = extendedAssets.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.longDescription.toLowerCase().includes(q) ||
      (item.dimensions?.ratio && item.dimensions.ratio.includes(q)) ||
      (item.dimensions?.type && item.dimensions.type.toLowerCase().includes(q)) ||
      item.elements.some((el) => el.toLowerCase().includes(q)) ||
      item.fonts.some((f) => f.name.toLowerCase().includes(q)) ||
      (q === "buah" && (item.title.toLowerCase().includes("buah") || item.title.toLowerCase().includes("jeruk") || item.title.toLowerCase().includes("apel") || item.title.toLowerCase().includes("mangga") || item.title.toLowerCase().includes("pisang") || item.title.toLowerCase().includes("semangka") || item.title.toLowerCase().includes("alpukat")))
    );
  });

  // Set items shown
  const itemsPerPage = cols * 5; // 25 items on mobile, 50 on desktop
  const displayItems = showAllAssets 
    ? filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredAssets.slice(0, cols * 2); // exactly 2 rows initially (10 on mobile, 20 on desktop)

  // Simulate natural brief artistic loading skeleton for newly seen items
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    displayItems.forEach((item) => {
      if (!loadedAssets[item.id]) {
        const delay = 350 + (Math.random() * 250); 
        const timer = setTimeout(() => {
          setLoadedAssets((prev) => ({ ...prev, [item.id]: true }));
        }, delay);
        timers.push(timer);
      }
    });
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [displayItems, showAllAssets, currentPage, loadedAssets]);

  // Lock body scroll, active elements safety, and prevent layout jiggles when modal pops up
  useEffect(() => {
    const navbar = document.getElementById('navbar-header');
    if (selectedAsset) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      if (navbar) {
        navbar.style.pointerEvents = 'none';
        navbar.style.paddingRight = `${scrollBarWidth}px`;
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      if (navbar) {
        navbar.style.removeProperty('pointer-events');
        navbar.style.removeProperty('padding-right');
      }
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      if (navbar) {
        navbar.style.removeProperty('pointer-events');
        navbar.style.removeProperty('padding-right');
      }
    };
  }, [selectedAsset]);

  // Saves asset ID to localStorage with absolute silent state management
  const handleToggleSave = async (item: DesignItem) => {
    const email = getLoggedUserEmail();
    if (!email) {
      await persistBookmarkToggle(item.id, 'asset');
      return;
    }

    const isSaved = savedAssetIds.includes(item.id);
    const message = isSaved ? `Aset "${item.title}" dihapus.` : `Aset "${item.title}" disimpan.`;
    
    // update local state for fast reactivity
    const updated = isSaved 
      ? savedAssetIds.filter(id => id !== item.id)
      : [...savedAssetIds, item.id];
    setSavedAssetIds(updated);

    await persistBookmarkToggle(item.id, 'asset');
  };

  // Downloads SVG
  const handleDownloadSVG = (item: DesignItem) => {
    setDownloadingId(item.id);

    setTimeout(() => {
      try {
        const svgContent = item.svgContent;
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

  const designTools = [
    {
      name: "Figma",
      link: "https://www.figma.com",
      desc: t(
        "Digunakan untuk mematangkan konsep wireframe, visual mockup presisi digital, hingga pengembangan prototipe interaktif sirkuit sistemik berkecepatan tinggi.",
        "Used to refine wireframe concepts, pixel-precise digital visual mockups, and high-speed systemic interactive prototypes."
      ),
      icon: (
        <Image 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/1920px-Figma-logo.svg.png" 
          width={18}
          height={27}
          className="shrink-0 object-contain" 
          alt="Figma logo" 
          referrerPolicy="no-referrer"
        />
      )
    },
    {
      name: "Canva",
      link: "https://www.canva.com",
      desc: t(
        "Menyusun lembar kerja bisnis dengan cepat, presentasi kit penawaran klien, serta draf kolaborasi visual terpadu agar lincah direvisi.",
        "Quickly draft business papers, client pitch decks, and unified visual collaboration assets for fast layout refinement."
      ),
      icon: (
        <Image 
          src="https://freelogopng.com/images/all_img/1656733637logo-canva-png.png" 
          width={28}
          height={28}
          className="shrink-0 object-contain animate-pulse-slow" 
          alt="Canva logo" 
          referrerPolicy="no-referrer"
        />
      )
    },
    {
      name: "Adobe Illustrator",
      link: "https://www.adobe.com/products/illustrator.html",
      desc: t(
        "Aplikasi andalan untuk menggambar ilustrasi murni, kurva bezier presisi milimeter, ikon micro-pack dekoratif, hingga dokumen siap cetak offset.",
        "Go-to desktop tool for raw vector drawing, millimeter-level bezier controls, beautiful decorative micro-pack icons, and offset-print-ready work."
      ),
      icon: (
        <svg className="w-8 h-8 shrink-0 rounded-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#1e1505" stroke="#FFA200" strokeWidth="1.5"/>
          <text x="12" y="15.5" fill="#FFA200" fontFamily="sans-serif" fontSize="11" fontWeight="bold" textAnchor="middle">Ai</text>
        </svg>
      )
    },
    {
      name: "Adobe Photoshop",
      link: "https://www.adobe.com/products/photoshop.html",
      desc: t(
        "Diterapkan untuk memoles sentuhan butir artistik (grain texturizer), gradasi pencahayaan halus, poster mockup realistik, hingga pengolahan pasca-produksi warna.",
        "Employed for adding beautiful grain textures, complex soft light overlays, realistic mockup placements, and advanced layout post-processing."
      ),
      icon: (
        <svg className="w-8 h-8 shrink-0 rounded-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#001d26" stroke="#00C8FF" strokeWidth="1.5"/>
          <text x="12" y="15.5" fill="#00C8FF" fontFamily="sans-serif" fontSize="11" fontWeight="bold" textAnchor="middle">Ps</text>
        </svg>
      )
    }
  ];

  return (
    <section id="tentang" className="py-20 bg-transparent relative overflow-hidden text-[#111827]">
      {/* Toast Alert Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 15, x: "-50%" }}
            style={{ left: "50%", transform: "translateX(-50%)" }}
            className="fixed bottom-6 z-50 bg-white text-[#111827] px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-200/90 flex items-center gap-2 text-[10px] sm:text-xs font-extrabold select-none whitespace-nowrap"
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white shrink-0 bg-[#111827]">
              ✓
            </span>
            <span className="font-sans font-bold leading-none">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        
        {/* Gallery title header */}
        <div className="space-y-6">
          <div className="text-center lg:text-left pb-4 border-b border-slate-100">
            <h3 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-[#111827] text-center lg:text-left">
              {t("Galeri Aset Visual Mentahan & Vektor Eksklusif FanraTech", "FanraTech Exclusive Raw Visual & Vector Assets Gallery")}
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-2 max-w-4xl mx-auto lg:mx-0 leading-relaxed text-center lg:text-left">
              {t(
                "Eksplorasi mahakarya digital dari laboratorium kreatif kami. Koleksi lengkap sketsa visual autentik, rancangan ilustrasi mentahan berpresisi piksel, serta hasil berkas vektor orisinal pilihan yang dirancang eksklusif untuk mendukung kesempurnaan desain proyek digital Anda di semua skala kebutuhan visual.",
                "Explore digital masterpieces from our creative laboratory. A complete collection of authentic visual sketches, pixel-precise raw illustration blueprints, and selected original vector files designed exclusively to support your digital projects across all visual scales."
              )}
            </p>
          </div>

          {/* Search box row: styled in elegant monochrome, matching FanraTech style */}
          <div className="flex flex-col gap-2 pt-1 pb-1 w-full">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={t("Cari aset...", "Search assets...")}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                suppressHydrationWarning
                className="w-full pl-9 pr-8 py-2 text-[11px] font-sans text-[#111827] bg-[#F9FAFB] border border-slate-200 rounded-xl focus:outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827]/10 transition-all font-medium placeholder-slate-400"
                id="search-assets"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-[#111827] cursor-pointer focus:outline-none"
                  title={t("Bersihkan pencarian", "Clear search")}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {searchQuery && (
              <div className="text-[10px] font-sans font-medium text-slate-400 tracking-tight self-end">
                {lang === 'id' ? (
                  <>Ditemukan <span className="font-bold text-[#111827]">{filteredAssets.length}</span> hasil</>
                ) : (
                  <>Found <span className="font-bold text-[#111827]">{filteredAssets.length}</span> results</>
                )}
              </div>
            )}
          </div>

          {/* Empty search matches layout */}
          {filteredAssets.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-[#F9FAFB] p-6 animate-fade-in">
              <div className="text-slate-300 mb-2 flex justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-bold font-sans text-slate-700">{t("Aset tidak ditemukan", "Assets not found")}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-sans">
                {t(
                  "Cobalah mencari kata kunci lain seperti \"jeruk\", \"buah\", \"kopi\", atau \"wayang\".",
                  "Try searching other keywords like \"orange\", \"fruit\", \"coffee\", or \"traditional puppet\"."
                )}
              </p>
            </div>
          )}

          {/* Micro density responsive grid layout: exactly 5 columns on non-desktop, 10 columns on desktop */}
          {isAboutLoading ? (
            <div className="grid grid-cols-5 lg:grid-cols-10 gap-1 sm:gap-1.5 lg:gap-2 animate-pulse">
              {Array.from({ length: cols * 2 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-full aspect-square bg-slate-200/60 rounded-lg border border-slate-100/50 p-1 flex items-center justify-center select-none"
                />
              ))}
            </div>
          ) : filteredAssets.length > 0 ? (
            <motion.div 
              layout="position"
              transition={{ type: "spring", stiffness: 220, damping: 28 }}
              className="grid grid-cols-5 lg:grid-cols-10 gap-1 sm:gap-1.5 lg:gap-2"
            >
              {displayItems.map((item) => {
                const isLoaded = loadedAssets[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedAsset(item)}
                    className="group cursor-pointer flex flex-col focus:outline-none relative"
                    id={`asset-card-${item.id}`}
                  >
                    {/* Visual Asset Raw Frame Container: tight border and padding to avoid loose empty spaces, strictly aspect-square */}
                    <div className="w-full aspect-square bg-[#F9FAFB] rounded-lg border border-slate-100 p-1 sm:p-1.5 flex items-center justify-center overflow-hidden transition-all duration-200 group-hover:border-[#111827]/30 relative">
                      
                      {/* Artistic Skeleton Loading state: clean solid gray block with elegant pulse animation */}
                      {!isLoaded && (
                        <div className="absolute inset-0 bg-slate-200 animate-pulse z-10" />
                      )}

                      {/* Real Raw SVG render as desainer's mockup raw photo/image */}
                      <div 
                        className={`w-full h-full flex items-center justify-center select-none transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        dangerouslySetInnerHTML={{ __html: item.svgContent }}
                      />
                      
                      {/* Subtle hover shade */}
                      <div className="absolute inset-0 bg-[#111827]/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : null}

          {/* Simple minimalist pagination and "lihat semua" text button */}
          <div className="flex flex-col items-center gap-3 pt-4">
            {/* Pagination kotak 1 2 3... shown only when expanded */}
            {showAllAssets && filteredAssets.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-1.5 font-sans">
                {getPaginationRange(currentPage, Math.ceil(filteredAssets.length / itemsPerPage)).map((pageOrEllipsis, idx) => {
                  if (typeof pageOrEllipsis === 'string') {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-7 h-7 flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-slate-400 select-none pb-0.5"
                      >
                        {pageOrEllipsis}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={`page-${pageOrEllipsis}`}
                      onClick={() => setCurrentPage(pageOrEllipsis)}
                      className={`w-7 h-7 flex items-center justify-center text-[10px] sm:text-[11px] font-bold rounded border transition-none cursor-pointer focus:outline-none ${
                        currentPage === pageOrEllipsis
                          ? 'bg-[#111827] text-white border-[#111827]'
                          : 'bg-[#F9FAFB] text-slate-400 border-slate-100 hover:text-[#111827] hover:border-slate-300'
                      }`}
                      title={`Halaman ${pageOrEllipsis}`}
                      id={`page-btn-${pageOrEllipsis}`}
                    >
                      {pageOrEllipsis}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Toggle button: quiet text button with no box/icon and very small size */}
            <div className="text-center">
              <button
                onClick={() => {
                  setShowAllAssets(!showAllAssets);
                  setCurrentPage(1);
                }}
                suppressHydrationWarning
                className="text-[11px] text-slate-400 hover:text-[#111827] transition-none focus:outline-none cursor-pointer font-sans"
                id="toggle-all-assets"
              >
                {showAllAssets ? t("Lihat lebih sedikit", "View less") : t("Lihat semua", "View all")}
              </button>
            </div>
          </div>
        </div>

        {/* Subtle Rekomendasi Aset Gratis (Independen/Ad-styled) - Sangat rapi, berkelas, tidak kontras */}
        <div className="pt-2 pb-12 w-full animate-fade-in px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 font-sans font-normal normal-case">
                {t("Rekomendasi Pencarian Ruang Aset Gambar & Vektor Gratis", "Recommended Free Vector & Image Asset Platforms")}
              </p>
            </div>

            {/* 3-Column Grid representing Pexels, Dribbble, Public Domain Vectors side-by-side. 
                Symmetric with page content margins, balanced wider gaps on desktop, side-by-side on mobile. */}
            <div className="grid grid-cols-3 gap-3 xs:gap-4 sm:gap-10 md:gap-14 lg:gap-16 pt-3 justify-center items-stretch w-full max-w-6xl mx-auto">
              
              {/* Card 1: Pexels - Visible side-by-side on all screens */}
              <a 
                href="https://www.pexels.com/id-id/pencarian/free%20no%20copyright/"
                target="_blank"
                rel="noopener noreferrer"
                className="group block cursor-pointer transition-all duration-300 max-w-[125px] xs:max-w-[155px] sm:max-w-[230px] md:max-w-[250px] w-full mx-auto"
              >
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-200/50 bg-[#F9FAFB] shadow-xs">
                  
                  {/* Rotating Image Element */}
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={pexelsIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <Image 
                        src={pexelsImages[pexelsIdx]} 
                        alt="Pexels Free Assets" 
                        fill
                        sizes="(max-width: 640px) 33vw, 30vw"
                        className="object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Dark gradient mapping for subtle contrast */}
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent z-10 pointer-events-none" />

                  {/* Centered Visit Badge on Hover - Completely transparent, only text, no borders/box, not bold */}
                  <div className="absolute inset-0 bg-[#111827]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-25">
                    <span className="text-white text-[10px] sm:text-[12.5px] font-sans font-normal tracking-wide transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                      {t("Kunjungi ↗", "Visit ↗")}
                    </span>
                  </div>
                </div>

                {/* Humble Title below image without descriptions */}
                <div className="mt-2.5">
                  <h4 className="font-sans font-medium text-[10px] xs:text-[11.5px] sm:text-[12.5px] text-slate-800 tracking-tight group-hover:text-[#111827] transition-colors leading-tight">
                    Pexels
                  </h4>
                </div>
              </a>

              {/* Card 2: Dribbble - Visible side-by-side on all screens */}
              <a 
                href="https://dribbble.com/tags/free-assets"
                target="_blank"
                rel="noopener noreferrer"
                className="group block cursor-pointer transition-all duration-300 max-w-[125px] xs:max-w-[155px] sm:max-w-[230px] md:max-w-[250px] w-full mx-auto"
              >
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-200/50 bg-[#F9FAFB] shadow-xs">
                  
                  {/* Rotating Image Element */}
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={dribbbleIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <Image 
                        src={dribbbleImages[dribbbleIdx]} 
                        alt="Dribbble Free Assets" 
                        fill
                        sizes="(max-width: 640px) 33vw, 30vw"
                        className="object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Dark gradient mapping for subtle contrast */}
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent z-10 pointer-events-none" />

                  {/* Centered Visit Badge on Hover - Completely transparent, only text, no borders/box, not bold */}
                  <div className="absolute inset-0 bg-[#111827]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-25">
                    <span className="text-white text-[10px] sm:text-[12.5px] font-sans font-normal tracking-wide transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                      {t("Kunjungi ↗", "Visit ↗")}
                    </span>
                  </div>
                </div>

                {/* Humble Title below image without descriptions */}
                <div className="mt-2.5">
                  <h4 className="font-sans font-medium text-[10px] xs:text-[11.5px] sm:text-[12.5px] text-slate-800 tracking-tight group-hover:text-[#111827] transition-colors leading-tight">
                    Dribbble
                  </h4>
                </div>
              </a>

              {/* Card 3: Public Domain Vectors - Visible side-by-side on all screens */}
              <a 
                href="https://publicdomainvectors.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="group block cursor-pointer transition-all duration-300 max-w-[125px] xs:max-w-[155px] sm:max-w-[230px] md:max-w-[250px] w-full mx-auto"
              >
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-200/50 bg-[#F9FAFB] shadow-xs">
                  
                  {/* Rotating Image Element */}
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={publicVectorsIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className="absolute inset-0 w-full h-full"
                    >
                      <Image 
                        src={publicVectorsImages[publicVectorsIdx]} 
                        alt="Public Domain Vectors Assets" 
                        fill
                        sizes="(max-width: 640px) 33vw, 30vw"
                        className="object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Dark gradient mapping for subtle contrast */}
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent z-10 pointer-events-none" />

                  {/* Centered Visit Badge on Hover - Completely transparent, only text, no borders/box, not bold */}
                  <div className="absolute inset-0 bg-[#111827]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-25">
                    <span className="text-white text-[10px] sm:text-[12.5px] font-sans font-normal tracking-wide transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                      {t("Kunjungi ↗", "Visit ↗")}
                    </span>
                  </div>
                </div>

                {/* Humble Title below image without descriptions */}
                <div className="mt-2.5">
                  <h4 className="font-sans font-medium text-[10px] xs:text-[11.5px] sm:text-[12.5px] text-slate-800 tracking-tight group-hover:text-[#111827] transition-colors leading-tight">
                    Public Domain Vectors
                  </h4>
                </div>
              </a>

            </div>
          </div>
        </div>

        {/* Dynamic Center Popup Modal - NO BOTTOM SHEET DRAWER SLIDES */}
        <AnimatePresence>
          {selectedAsset && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
              
              {/* Pure transparent backdrop overlay. Latar belakang tetap normal biasa tanpa efek gelap ataupun blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-transparent cursor-default"
                id="modal-backdrop"
              />

              {/* Centered Modal box, small and fully responsive inside viewport */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative w-full max-w-[280px] bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-4 sm:p-5 space-y-4.5 z-20"
                id="modal-sheet"
              >
                {/* Save button in Top-Left and Close button in Top-Right */}
                <button
                  onClick={() => handleToggleSave(selectedAsset)}
                  className="absolute top-4 left-4 p-1 cursor-pointer focus:outline-none flex items-center justify-center transition-none"
                  title={savedAssetIds.includes(selectedAsset.id) ? t("Sudah disimpan", "Saved") : t("Simpan aset", "Save asset")}
                >
                  <Image 
                    src={savedAssetIds.includes(selectedAsset.id) 
                      ? "https://cdn-icons-png.flaticon.com/128/5668/5668020.png" 
                      : "https://cdn-icons-png.flaticon.com/128/5186/5186087.png"
                    } 
                    alt="Save Asset Icon"
                    width={18}
                    height={18}
                    className="object-contain transition-none"
                    referrerPolicy="no-referrer"
                    style={{
                      // Pure dark tint (#111827) filled solid color when saved, or subtle opacity when not saved
                      filter: 'brightness(0) saturate(100%) invert(8%) sepia(16%) saturate(1914%) hue-rotate(185deg) brightness(97%) contrast(97%)',
                      opacity: savedAssetIds.includes(selectedAsset.id) ? 1 : 0.3
                    }}
                  />
                </button>

                <button
                  onClick={() => setSelectedAsset(null)}
                  className="absolute top-4 right-4 p-1 cursor-pointer focus:outline-none flex items-center justify-center text-slate-400 hover:text-[#111827] transition-none"
                  title={t("Tutup", "Close")}
                >
                  <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Vector Canvas Preview Box - strictly aspect-square and made smaller */}
                <div className="w-full aspect-square max-w-[110px] bg-[#F9FAFB] rounded-xl border border-slate-100 p-2 mx-auto flex items-center justify-center relative overflow-hidden shadow-xs">
                  {/* Decorative blueprint grids */}
                  <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
                  
                  {/* Real-rendered miniature SVG */}
                  <div 
                    className="w-full h-full flex items-center justify-center select-none z-10"
                    dangerouslySetInnerHTML={{ __html: selectedAsset.svgContent }}
                  />
                </div>

                {/* Title and details - direct minimalist layout */}
                <div className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-extrabold font-sans text-slate-900 leading-tight text-center px-2">
                    {selectedAsset.title}
                  </h3>

                  {/* Clean Minimal list of colors with clickable HEX badges, no header text */}
                  {selectedAsset.colors && selectedAsset.colors.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 pt-0.5">
                      {selectedAsset.colors.map((color) => {
                        return (
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
                        );
                      })}
                    </div>
                  )}

                  {/* Divider line */}
                  <div className="border-t border-slate-100 pt-2.5" />

                  {/* Bottom center: download vector button with small icon aligned at center & calm small kembali link */}
                  <div className="flex flex-col items-center justify-center gap-2 pt-0.5">
                    <button
                      onClick={() => handleDownloadSVG(selectedAsset)}
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

                    {/* Small unobtrusive 'kembali' link that closes modal like the X button */}
                    <button
                      onClick={() => setSelectedAsset(null)}
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

        {/* Design Tools info layer section */}
        <div className="space-y-6 pt-8 border-t border-slate-100">
          <div className="text-left">
            <h3 className="text-lg font-bold font-sans tracking-tight text-slate-900">{t("Peralatan Desain & Perangkat Lunak", "Design Tools & Software")}</h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">{t("Platform standar industri yang menyokong ketelitian piksel di dapur FanraTech", "Industry standard platforms backing pixel-perfect crafts in the kitchen of FanraTech")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {designTools.map((tool) => (
              <div
                key={tool.name}
                className="bg-transparent py-2.5 flex flex-col gap-3 group transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Raw layout logo without bounding outline box */}
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      {tool.icon}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-extrabold text-[#111827]">{tool.name}</h4>
                      
                      <a
                        href={tool.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center justify-center cursor-pointer shrink-0 text-[#111827] hover:scale-110"
                        title={`Buka situs resmi ${tool.name}`}
                        suppressHydrationWarning
                      >
                        <svg className="w-3.5 h-3.5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 font-sans leading-relaxed text-left border-t border-slate-100 pt-2.5">
                  {tool.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
