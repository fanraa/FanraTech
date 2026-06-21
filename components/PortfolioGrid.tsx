'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ArrowRight, Eye, Sparkles, SlidersHorizontal, ChevronDown, X, Ban, Bookmark } from 'lucide-react';
import { portfolioItems, designCategories, DesignItem, getSavedDesigns, translateDesignItem } from '@/lib/data';
import { syncDesignsFromCloud } from '@/lib/firebaseSync';
import { persistBookmarkToggle, syncBookmarksWithCloud } from '@/lib/bookmarkSync';
import Image from 'next/image';
import { useLanguage } from '@/hooks/useLanguage';

// Standard Euclidean color matching helpers for tone similarity search
interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RgbColor {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return { r, g, b };
}

function getColorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const rd = rgb1.r - rgb2.r;
  const gd = rgb1.g - rgb2.g;
  const bd = rgb1.b - rgb2.b;
  return Math.sqrt(rd * rd + gd * gd + bd * bd);
}

// Preset Aspect Ratio dimensions grouping matching standard outputs
const inlineRatioOptions = [
  { id: "all", label: "Semua Rasio", ratios: [] },
  { id: "1:1", label: "Square (1:1)", ratios: ["1:1"] },
  { id: "4:5", label: "Portrait (4:5)", ratios: ["4:5"] },
  { id: "1.91:1", label: "Landscape (1.91:1)", ratios: ["1.91:1"] },
  { id: "9:16", label: "Story/Reels (9:16)", ratios: ["9:16"] },
  { id: "1:1.41", label: "Poster (1:1.41)", ratios: ["1:1.41"] },
  { id: "16:9", label: "Banner/Thumb (16:9)", ratios: ["16:9"] },
  { id: "19.2:6", label: "Web Header (19.2:6)", ratios: ["19.2:6"] },
  { id: "9:19.5", label: "Mobile UI (9:19.5)", ratios: ["9:19.5"] },
  { id: "16:11.3", label: "Desktop UI (16:11.3)", ratios: ["16:11.3"] }
];

const curatedColorSwatches = [
  { label: "Terang / Krem", hex: "#FDFBF7", description: "Cream & Alabaster White" },
  { label: "Sage Green", hex: "#A8C3B4", description: "Sage & Earth Green" },
  { label: "Peach", hex: "#E6C5B3", description: "Warm Soft Peach" },
  { label: "Coral", hex: "#FF8A65", description: "Semburat Soft Coral" },
  { label: "Mint Breeze", hex: "#F4FAF7", description: "Organic Mint & Clover" },
  { label: "Ocean Blue", hex: "#3B82F6", description: "Soft Ocean Blue" },
  { label: "Charcoal / Espresso", hex: "#2D1E12", description: "Midnight Espresso & Charcoal" }
];

interface PortfolioGridProps {
  onSelectItem: (item: DesignItem) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showLimit?: boolean;
  isFullPage?: boolean;
}

export default function PortfolioGrid({ 
  onSelectItem, 
  searchQuery, 
  setSearchQuery, 
  showLimit = false, 
  isFullPage = false 
}: PortfolioGridProps) {
  const { lang, t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedRatio, setSelectedRatio] = useState("all");
  const [selectedColorHex, setSelectedColorHex] = useState("all");

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fanratech_trail_color', {
        detail: { color: selectedColorHex }
      }));
    }
  }, [selectedColorHex]);
  const [activeInfoId, setActiveInfoId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const timeoutRefs = React.useRef<Record<string, NodeJS.Timeout>>({});
  const [isGridLoading, setIsGridLoading] = useState(true);
  const [designs, setDesigns] = useState<DesignItem[]>(portfolioItems);
  const [savedDesignIds, setSavedDesignIds] = useState<string[]>([]);

  React.useEffect(() => {
    const updateSavedIds = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fanratech_saved_designs');
        if (saved) {
          try {
            setSavedDesignIds(JSON.parse(saved));
          } catch {
            setSavedDesignIds([]);
          }
        } else {
          setSavedDesignIds([]);
        }
      }
    };
    updateSavedIds();
    window.addEventListener('storage', updateSavedIds);
    window.addEventListener('fanratech_data_updated', updateSavedIds);
    return () => {
      window.removeEventListener('storage', updateSavedIds);
      window.removeEventListener('fanratech_data_updated', updateSavedIds);
    };
  }, []);

  const handleToggleSave = (item: DesignItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    persistBookmarkToggle(item.id, 'design');
  };

  React.useEffect(() => {
    // Load local storage values first safely on client mount asynchronously
    const deferTimer = setTimeout(() => {
      setDesigns(getSavedDesigns());
    }, 0);

    // Jalankan sinkronisasi bookmark cloud juga sewaktu memuat halaman
    syncBookmarksWithCloud();

    // Sinkronisasi cloud di latar belakang
    syncDesignsFromCloud().then(cloudDesigns => {
      if (cloudDesigns) {
        setDesigns(cloudDesigns);
      }
    });

    const handleSync = () => {
      setDesigns(getSavedDesigns());
    };
    
    window.addEventListener('storage', handleSync);
    window.addEventListener('fanratech_data_updated', handleSync);
    
    const timer = setTimeout(() => {
      setIsGridLoading(false);
    }, 50);
    
    return () => {
      clearTimeout(deferTimer);
      clearTimeout(timer);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('fanratech_data_updated', handleSync);
    };
  }, []);

  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Infinite Scroll States
  const [visibleCount, setVisibleCount] = useState(isFullPage ? 4 : 100);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = React.useRef<HTMLDivElement | null>(null);

  const handleLihatLainnya = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isNavigating) return;
    setIsNavigating(true);
    window.dispatchEvent(new Event('fanratech_start_loading'));
    
    // Navigasikan langsung secara andal. Spinner akan berputar terus sampai halaman berikutnya dimuat total
    router.push('/desain');
  };

  const translatedDesigns = useMemo(() => {
    return designs.map(item => translateDesignItem(item, lang));
  }, [designs, lang]);

  const filteredItems = useMemo(() => {
    return translatedDesigns.filter((item) => {
      // 1. Tipe/Kategori
      let matchCategory = true;
      if (selectedCategory !== "Semua" && selectedCategory !== "All") {
        const catKey = selectedCategory.toLowerCase();
        const itemCatKey = item.category.toLowerCase();
        matchCategory = itemCatKey === catKey || 
                        (catKey === "graphic design" && itemCatKey === "desain grafis") ||
                        (catKey === "desain grafis" && itemCatKey === "graphic design") ||
                        (catKey === "typography" && itemCatKey === "tipografi") ||
                        (catKey === "tipografi" && itemCatKey === "typography");
      }
      
      // 2. Keyword Search
      const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());

      // 3. Aspect Ratio Match
      let matchRatio = true;
      if (selectedRatio !== "all") {
        const foundOption = inlineRatioOptions.find(o => o.id === selectedRatio);
        if (foundOption && foundOption.ratios) {
          matchRatio = foundOption.ratios.includes(item.dimensions?.ratio);
        }
      }

      // 4. Color Proximity Match
      let matchColor = true;
      if (selectedColorHex !== "all") {
        matchColor = item.colors.some(itemColor => {
          const distance = getColorDistance(selectedColorHex, itemColor.hex);
          return distance <= 170;
        });
      }

      return matchCategory && matchSearch && matchRatio && matchColor;
    });
  }, [translatedDesigns, searchQuery, selectedRatio, selectedColorHex, selectedCategory]);

  // Adjusting state during render (React official recommended pattern for prop-syncing without useEffect cascading)
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [prevRatio, setPrevRatio] = useState(selectedRatio);
  const [prevColor, setPrevColor] = useState(selectedColorHex);
  const [prevCategory, setPrevCategory] = useState(selectedCategory);

  if (isFullPage && (searchQuery !== prevSearchQuery || selectedRatio !== prevRatio || selectedColorHex !== prevColor || selectedCategory !== prevCategory)) {
    setPrevSearchQuery(searchQuery);
    setPrevRatio(selectedRatio);
    setPrevColor(selectedColorHex);
    setPrevCategory(selectedCategory);
    setVisibleCount(4);
  }

  React.useEffect(() => {
    const currentRefs = timeoutRefs.current;
    return () => {
      Object.values(currentRefs).forEach(clearTimeout);
    };
  }, []);

  // Intersection Observer for Infinite Scroll
  React.useEffect(() => {
    if (!isFullPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && visibleCount < filteredItems.length && !isLoadingMore) {
          setIsLoadingMore(true);
          // 800ms delay to let the beautiful solid gray pulse skeleton shine elegantly
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 4, filteredItems.length));
            setIsLoadingMore(false);
          }, 800);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentTarget = observerRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [isFullPage, visibleCount, filteredItems.length, isLoadingMore]);

  // Construct the items with ads inserted (Pinterest-style native placement)
  const itemsWithAds = useMemo(() => {
    type GridItem = 
      | { type: 'portfolio'; item: DesignItem }
      | {
          type: 'ad';
          id: string;
          title: string;
          sponsor: string;
          description: string;
          image: string;
          ctaText: string;
          ctaUrl: string;
          aspectRatioClass: string;
          colors: { hex: string; name: string }[];
        };

    const list: GridItem[] = [];
    const limitCount = showLimit ? (isMobile ? 6 : 5) : 100;
    const sourceItems = showLimit 
      ? filteredItems.slice(0, limitCount) 
      : (isFullPage ? filteredItems.slice(0, visibleCount) : filteredItems);

    sourceItems.forEach((item, idx) => {
      // Masukkan item portofolio asli
      list.push({ type: 'portfolio', item });

      if (!showLimit) {
        // Sisipkan Iklan Pertama setelah item portofolio ke-2 (indeks ke-1)
        if (idx === 1 && sourceItems.length >= 2) {
          list.push({
            type: 'ad',
            id: 'ad-figma',
            title: 'Figma: Collaborative Design Platform',
            sponsor: 'Figma, Inc.',
            description: t(
              'Rancang, buat prototipe, dan kolaborasikan ide kreatif desainer Anda secara langsung dalam satu kanvas bersama yang presisi.',
              'Design, prototype, and collaborate on your designer\'s creative ideas in real-time within a precise shared canvas.'
            ),
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80&fm=webp',
            ctaText: t('Hubungkan Figma', 'Connect Figma'),
            ctaUrl: 'https://www.figma.com',
            aspectRatioClass: 'aspect-[3/4.2]',
            colors: [
              { hex: '#111827', name: 'Midnight Charcoal' },
              { hex: '#F9FAFB', name: 'Alabaster White' }
            ]
          });
        }

        // Sisipkan Iklan Kedua setelah item portofolio ke-6 (indeks ke-5)
        if (idx === 5 && sourceItems.length >= 6) {
          list.push({
            type: 'ad',
            id: 'ad-tailwindui',
            title: 'Tailwind UI: Clean Code Components',
            sponsor: 'Tailwind Labs',
            description: t(
              'Ratusan komponen antarmuka siap pakai yang responsif, terstruktur, dan dioptimalkan sepenuhnya untuk performa web secepat kilat.',
              'Hundreds of production-ready, fully responsive, and highly optimized UI components for lightning-fast web performance.'
            ),
            image: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?auto=format&fit=crop&w=600&q=80&fm=webp',
            ctaText: t('Dapatkan Komponen asli', 'Get original components'),
            ctaUrl: 'https://tailwindui.com',
            aspectRatioClass: 'aspect-[3/4]',
            colors: [
              { hex: '#111827', name: 'Pitch Black' },
              { hex: '#E2E8F0', name: 'Muted Platinum' }
            ]
          });
        }
      }
    });

    return list;
  }, [filteredItems, showLimit, isFullPage, visibleCount, isMobile]);

  return (
    <section id="portfolio" className="py-20 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        {!isFullPage && (
          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-display font-medium text-slate-950 tracking-tight">
              {lang === 'id' ? "Eksplorasi" : "Design"}{" "}
              <span className="font-extrabold text-[#111827]">
                {lang === 'id' ? "Desain Kreatif" : "Exploration"}
              </span>
            </h2>
          </div>
        )}

        {/* Filters Panel with Left-aligned Colors directly visible */}
        <div className="mb-10 select-none relative z-30 flex flex-col gap-4 pb-6 border-b border-slate-100">
          
          {/* 1. Top Row: Palet Warna (No Box background, No Outer border, No text label, Left-aligned swatches with dynamic Custom Color Picker at the very left) */}
          <div className="flex items-center justify-start py-1 px-0 flex-wrap gap-2">
            
            {/* Direct Row of Color Circles starting with custom color picker, clear filter, separator line, then curated swatches */}
            <div className="flex items-center gap-1.5 justify-start flex-wrap">
              
              {/* Custom Color Picker Swatch - featuring requested paint palette / color wheel icon with absolutely no box border or wrapper background, placed at the very left */}
              <div className="relative w-7 h-7 transition-all duration-200 cursor-pointer hover:scale-115 shrink-0 flex items-center justify-center rounded-full overflow-hidden" title={t("Pilih Warna Kustom Sendiri", "Choose Custom Color")}>
                <input
                  type="color"
                  value={selectedColorHex !== "all" && !curatedColorSwatches.some(c => c.hex === selectedColorHex) ? selectedColorHex : "#111827"}
                  onChange={(e) => setSelectedColorHex(e.target.value)}
                  suppressHydrationWarning
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20"
                />
                <Image 
                  src="https://cdn-icons-png.flaticon.com/128/11460/11460827.png" 
                  alt="Custom Color Picker" 
                  width={28}
                  height={28}
                  className="object-contain pointer-events-none select-none z-10"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Clear/Reset Color Switch ("block untuk hapus foto itu") */}
              <button
                onClick={() => {
                  if (selectedColorHex !== "all") setSelectedColorHex("all");
                }}
                disabled={selectedColorHex === "all"}
                suppressHydrationWarning
                className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-default cursor-pointer shrink-0 ${
                  selectedColorHex === "all"
                    ? "border-[#111827] bg-[#111827] text-white"
                    : "border-slate-200 hover:border-slate-400 bg-white text-slate-400 hover:text-[#111827] hover:scale-105"
                }`}
                title={t("Hapus Filter Warna", "Clear Color Filter")}
              >
                <Ban className="w-3.5 h-3.5" />
              </button>

              {/* Subtle separator line not too striking */}
              <span className="h-5 w-px bg-slate-200 mx-1 shrink-0" />

              {/* Curated Color Palette Circles */}
              {curatedColorSwatches.map((color) => {
                const isActive = selectedColorHex === color.hex;
                return (
                  <button
                    key={color.hex}
                    onClick={() => {
                      if (!isActive) setSelectedColorHex(color.hex);
                    }}
                    disabled={isActive}
                    suppressHydrationWarning
                    className={`w-7 h-7 rounded-full border transition-all duration-200 disabled:cursor-default cursor-pointer relative hover:scale-[1.15] shrink-0 ${
                      isActive
                        ? "border-[#111827] ring-2 ring-[#111827] ring-offset-2 scale-105 z-10"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={lang === "id" ? `${color.label}: ${color.description}` : `${color.description}`}
                  >
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center text-white mix-blend-difference font-bold text-[9px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Dynamic rendering of Custom Color Chosen if it doesn't match standard swatches */}
              {selectedColorHex !== "all" && !curatedColorSwatches.some(c => c.hex === selectedColorHex) && (
                <button
                  onClick={() => {}}
                  disabled={true}
                  suppressHydrationWarning
                  className="w-7 h-7 rounded-full border transition-all duration-250 cursor-default relative shrink-0 border-[#111827] ring-2 ring-[#111827] ring-offset-2 scale-105 z-10 animate-fade-in"
                  style={{ backgroundColor: selectedColorHex }}
                  title={t(`Warna Pilihan: ${selectedColorHex}`, `Selected Color: ${selectedColorHex}`)}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white mix-blend-difference font-bold text-[9px]">
                    ✓
                  </span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Portfolio Cards Grid (Smooth simple fade animation with no layout shift and rounded edges) */}
        <div className="relative">
          <AnimatePresence mode="popLayout">
            {isGridLoading ? (
              <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => {
                  // Variety of aspect ratios for beautiful skeletal masonry
                  const heights = ["aspect-[4/5]", "aspect-[3/4.2]", "aspect-square", "aspect-[9/16]", "aspect-[3/4]"];
                  const hClass = heights[i % heights.length];
                  return (
                    <div 
                      key={i} 
                      className="break-inside-avoid w-full mb-4 group bg-slate-50/70 border border-slate-100 rounded-2xl p-3 flex flex-col gap-3 animate-pulse"
                      style={{ height: 'auto' }}
                    >
                      <div className={`relative ${hClass} w-full shimmer-bg rounded-xl`} />
                      <div className="space-y-2.5 mt-1 select-none">
                        <div className="h-3 bg-slate-200/70 rounded-md w-1/3" />
                        <div className="h-4 bg-slate-200/70 rounded-md w-3/4 animate-none" />
                        <div className="h-3.5 bg-slate-200/70 rounded-md w-1/2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : filteredItems.length > 0 ? (
              <div
                className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4"
              >
                {itemsWithAds.map((gridItem, idx) => {
                  if (gridItem.type === 'ad') {
                    const ad = gridItem;
                    return (
                      <motion.a
                        key={ad.id}
                        id={ad.id}
                        href={showLimit ? undefined : ad.ctaUrl}
                        target={showLimit ? undefined : "_blank"}
                        rel={showLimit ? undefined : "noopener noreferrer"}
                        onClick={(e) => {
                          if (showLimit) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`break-inside-avoid w-full mb-4 group border border-slate-100 rounded-xl overflow-hidden transition-all duration-300 flex flex-col relative p-4 ${
                          showLimit 
                            ? 'cursor-not-allowed opacity-90 bg-slate-50/30' 
                            : 'bg-slate-50/50 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        {/* Image Container with a Clean Flat Layout */}
                        <div className={`relative ${ad.aspectRatioClass || 'aspect-square'} w-full bg-slate-100/50 overflow-hidden rounded-lg mb-3`}>
                          <Image
                            src={ad.image}
                            alt={ad.title}
                            fill
                            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className="object-cover duration-500 ease-in-out transition-all group-hover:scale-101"
                            referrerPolicy="no-referrer"
                          />
                          {/* Soft overlay on hover */}
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1 select-none">
                          <h4 className="font-display font-bold text-[#111827] text-xs sm:text-[13px] leading-tight tracking-tight group-hover:text-slate-700 transition-colors duration-200">
                            {ad.title}
                          </h4>
                          <p className="text-slate-500 text-[10px] sm:text-[11px] font-sans leading-relaxed">
                            {ad.description}
                          </p>
                        </div>
                      </motion.a>
                    );
                  }

                  // Render normal portfolio item
                  const item = gridItem.item;
                  const isDetailActive = activeInfoId === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      id={`portfolio-card-${item.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      onMouseEnter={() => {
                        if (!showLimit) {
                          setActiveInfoId(item.id);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!showLimit) {
                          setActiveInfoId(null);
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (showLimit) return;
                        onSelectItem(item);
                      }}
                      className={`break-inside-avoid w-full mb-4 group bg-white rounded-xl overflow-hidden transition-all duration-300 flex flex-col relative ${
                        showLimit ? 'cursor-not-allowed opacity-90' : 'cursor-pointer shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      {/* Image Container with Dynamic Aspect Ratios and Soft Corners (No borders) */}
                      <div className={`relative ${item.aspectRatioClass || 'aspect-square'} w-full bg-slate-50/30 overflow-hidden rounded-xl`}>
                        {/* Elegant Shimmer Gradient Placeholder State */}
                        {!loadedImages[item.id] && (
                          <div className="absolute inset-0 shimmer-bg z-10 rounded-xl" />
                        )}
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className={`object-cover duration-500 ease-in-out transition-all ${
                            loadedImages[item.id] ? 'scale-100 blur-0 opacity-100' : 'scale-101 blur-xs opacity-0'
                          }`}
                          referrerPolicy="no-referrer"
                          onLoad={() => setLoadedImages(prev => ({ ...prev, [item.id]: true }))}
                        />

                        {/* Top and Bottom soft dark gradient overlays to make the text beautifully readable without text-shadows */}
                        <div 
                          className={`absolute inset-0 bg-gradient-to-b from-[#111827]/30 via-transparent to-[#111827]/40 transition-opacity duration-300 ${
                            isDetailActive ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'
                          }`}
                        />

                        {/* Top-Left Ratio Badge - Appears elegantly and completely transparent on Hover/Click, NO text-shadows */}
                        <span 
                          className={`absolute top-2.5 left-2.5 bg-transparent p-0 text-[8px] font-extrabold text-white tracking-wider uppercase transition-all duration-305 ${
                            isDetailActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:scale-100'
                          }`}
                        >
                          {item.dimensions?.ratio || t("Preset", "Preset")}
                        </span>

                        {/* Elegant Floating Bookmark Save Button - Pojok Kanan Atas, hanya muncul di halaman galeri penuh (isFullPage) */}
                        {isFullPage && (
                          <button
                            onClick={(e) => handleToggleSave(item, e)}
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                            }}
                            className="absolute top-[6px] right-2.5 z-20 w-6 h-6 flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none opacity-0 group-hover:opacity-100 active:scale-90 hover:scale-110 text-white"
                            title={savedDesignIds.includes(item.id) ? t("Hapus dari Simpanan", "Remove from Saved") : t("Simpan Desain", "Save Design")}
                          >
                            <Bookmark 
                              className="w-[15px] h-[15px] drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.6)] transition-all" 
                              fill={savedDesignIds.includes(item.id) ? "#FFFFFF" : "none"} 
                              stroke="#FFFFFF"
                              strokeWidth={2}
                            />
                          </button>
                        )}

                        {/* Bottom Info Overlay INSIDE the image container at the very bottom (Fully Transparent with NO text-shadows) */}
                        <div 
                          className={`absolute bottom-0 inset-x-0 bg-transparent px-2.5 py-2.5 flex items-center justify-between transition-all duration-300 ease-out transform ${
                            isDetailActive 
                              ? 'opacity-100 translate-y-0 pointer-events-auto' 
                              : 'opacity-0 translate-y-2 pointer-events-none lg:group-hover:opacity-100 lg:group-hover:translate-y-0 lg:group-hover:pointer-events-auto'
                          }`}
                        >
                          {/* Palette Bullet points */}
                          <div className="flex -space-x-1 overflow-hidden shrink-0">
                            {item.colors.slice(0, 3).map((color, cIdx) => (
                              <span
                                key={cIdx}
                                className="w-2.5 h-2.5 rounded-full border border-white/30 shadow-xs"
                                style={{ backgroundColor: color.hex }}
                                title={`${color.name}: ${color.hex}`}
                              />
                            ))}
                          </div>
                          
                          {/* Dimensions Text, NO text-shadows */}
                          <span className="text-[9px] font-bold font-mono text-white tracking-tight shrink-0">
                            {item.dimensions?.pixels}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-slate-50/50 rounded-none border border-dashed border-slate-200"
              >
                <div className="max-w-[340px] mx-auto space-y-3">
                  <p className="text-slate-400 font-bold text-sm">{t("Desain tidak ditemukan", "Design not found")}</p>
                  <p className="text-slate-400 text-xs text-slate-400 leading-relaxed">
                    {t(
                      "Maaf, tidak ada desain yang cocok dengan pencarian atau filter warna Anda. Cobalah setelan filter yang berbeda.",
                      "Sorry, we couldn't find any designs that match your active search path or selected tones. Try adjusting filters."
                    )}
                  </p>
                  <button
                    id="reset-search-filters"
                    onClick={() => {
                      setSelectedRatio("all");
                      setSelectedColorHex("all");
                      setSelectedCategory("Semua");
                      setSearchQuery("");
                    }}
                    suppressHydrationWarning
                    className="mt-2 text-xs font-bold text-[#111827] border-b border-zinc-300 hover:border-[#111827] pb-0.5 rounded-none cursor-pointer"
                  >
                    {t("Reset Semua Filter", "Reset All Filters")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skeleton loading cards simulation for Infinite Scroll */}
          {isLoadingMore && (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4 mt-4">
              <div className="break-inside-avoid w-full mb-4 bg-slate-200 animate-pulse rounded-xl aspect-square" />
              <div className="break-inside-avoid w-full mb-4 bg-slate-200 animate-pulse rounded-xl aspect-[9/16]" />
              <div className="break-inside-avoid w-full mb-4 bg-slate-200 animate-pulse rounded-xl aspect-[16/9]" />
              <div className="break-inside-avoid w-full mb-4 bg-slate-200 animate-pulse rounded-xl aspect-[4/5]" />
            </div>
          )}

          {/* Infinite Scroll trigger target element */}
          {isFullPage && visibleCount < filteredItems.length && (
            <div ref={observerRef} className="h-10 w-full flex items-center justify-center pointer-events-none" />
          )}

          {showLimit && (
            <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-white via-white via-40% via-white/90 to-transparent pointer-events-none z-10" />
          )}
        </div>

        {/* Button "Lihat Desain" to the dedicated subpage with dynamic spinner */}
        {showLimit && (
          <div className="flex justify-center -mt-8 relative z-20">
            <button 
              onClick={handleLihatLainnya}
              disabled={isNavigating}
              suppressHydrationWarning
              className="group inline-flex items-center justify-center py-2 px-7 rounded-full border border-slate-200/60 bg-white/60 backdrop-blur-md text-[#111827]/90 hover:bg-[#111827] hover:text-white hover:border-[#111827] hover:scale-[1.03] active:scale-95 transition-all font-sans font-bold text-[10px] tracking-wide shadow-xs hover:shadow-sm cursor-pointer focus:outline-none disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {isNavigating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t("Memuat...", "Loading...")}</span>
                </>
              ) : (
                <span>{t("Lihat Desain", "View Designs")}</span>
              )}
            </button>
          </div>
        )}

        {/* Tabel Standar Ukuran Desain Interaktif (Belajar & Referensi Desain) - Tersembunyi di /desain (isFullPage) */}
        {!isFullPage && (
          <InteractiveDimensionsTable 
            isGridLoading={isGridLoading}
            onSelectRatio={(ratio) => {
              setSelectedRatio(ratio);
              const portfolioEl = document.getElementById("portfolio");
              if (portfolioEl) {
                portfolioEl.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
          />
        )}
      </div>
    </section>
  );
}

// Komponen Tabel Panduan Ukuran & Dimensi Desain (Sesuai dengan apa yang Anda diskusikan)
import { standardDimensions, DimensionPreset } from '@/lib/data';

const translateDimensionText = (text: string, lang: string) => {
  if (lang === 'id' || !text) return text;
  const dict: Record<string, string> = {
    // Categories
    "Feed Instagram": "Instagram Feed",
    "Story & Reels": "Story & Reels",
    "Poster Cetak (300 DPI)": "Print Poster (300 DPI)",
    "Identitas Brand": "Brand Identity",
    "Thumbnail & Video": "Thumbnail & Video",
    "Banner Website": "Website Banner",
    "UI / App Design": "UI / App Design",

    // Types
    "Feed Square / Carousel": "Feed Square / Carousel",
    "Feed Portrait": "Feed Portrait",
    "Feed Landscape": "Feed Landscape",
    "Story / Reels / TikTok": "Story / Reels / TikTok",
    "Poster A4 Standard": "Standard A4 Poster",
    "Poster A3 Executive": "Executive A3 Poster",
    "Poster A2 Premium": "Premium A2 Poster",
    "Logo Square Master": "Logo Square Master",
    "YouTube Thumbnail HD": "YouTube HD Thumbnail",
    "Hero Banner Landing": "Hero Landing Banner",
    "Website Header Slim": "Slim Website Header",
    "Mobile App Wireframe": "Mobile App Wireframe",
    "Desktop UI System": "Desktop UI System",

    // Physical
    "Fleksibel": "Flexible",

    // Use Cases
    "Profil utama, katalog produk, standar visual grid": "Main profile, product catalog, visual grid reference",
    "Feed vertikal, promosi produk dengan perhatian visual maksmial": "Vertical feed, product show with maximal visual attention",
    "Foto pemandangan, dokumentasi landscape lebar": "Scenic photo, wide landscape documentation",
    "Konten vertikal interaktif seluler penuh": "Full interactive vertical mobile content",
    "Flyer promosi, menu restoran, poster info dinding": "Promotional flyer, dining menu, info board",
    "Poster acara, infografis komersial skala medium": "Event poster, medium scale commercial infographics",
    "Poster pameran seni mewah, papan reklame dalam ruangan": "Luxury art exhibition poster, indoor advertising board",
    "Identitas bisnis utama, favicon, watermark aset digital": "Core business identity, website favicon, artwork watermark",
    "Sampul video, materi presentasi 16:9": "Video cover, standard 16:9 slideshow assets",
    "Tampilan beranda web penuh, desktop desktop wallpaper": "Full web homepage hero, elegant desktop wallpaper background",
    "Sampul blog, header halaman dalam situs": "Blog cover, inner page website header",
    "Mockup antarmuka ponsel pintar modern (iOS / Android)": "Modern smartphone app mockup wireframe (iOS / Android)",
    "Sistem aplikasi web, dashboard panel profesional": "Web application layout, professional admin panel dashboard"
  };
  return dict[text] || text;
};

interface InteractiveDimensionsTableProps {
  isGridLoading: boolean;
  onSelectRatio: (ratio: string) => void;
}

function InteractiveDimensionsTable({ isGridLoading, onSelectRatio }: InteractiveDimensionsTableProps) {
  const { lang, t } = useLanguage();
  return (
    <div className="mt-24 pt-16 border-t border-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            {lang === 'id' ? "Panduan Standar" : "Standard Guide"}{" "}
            <span className="text-[#111827] font-extrabold">
              {lang === 'id' ? "Ukuran Desain" : "for Design Sizes"}
            </span>
          </h3>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            {t(
              "Gunakan panduan referensi dimensi di bawah ini untuk merencanakan aspek rasio desain kustom Anda. Sempurna untuk Instagram, cetakan komersial, UI, hingga website.",
              "Use the standard reference dimensions below to plan your custom design aspect ratio. Perfect for Instagram, commercial printing, UI, and web design."
            )}
          </p>
        </div>

        {/* Interactive Responsive Table (rounded-none and border-slate-100) */}
        <div className="bg-white border border-slate-100 rounded-none overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-display font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t("Jenis Desain", "Design Type")}</th>
                  <th className="py-3 px-4">{t("Pixel (Px)", "Pixel (Px)")}</th>
                  <th className="py-3 px-4 text-center">{t("Rasio", "Ratio")}</th>
                  <th className="py-3 px-4">{t("Fisik (CM/Inci)", "Physical (CM/Inch)")}</th>
                  <th className="py-3 px-4 hidden md:table-cell">{t("Rekomendasi Penggunaan", "Recommended Use Case")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isGridLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200/80 rounded-md w-3/4 animate-none" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200/80 rounded-md w-2/3 animate-none" />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="h-4 bg-slate-200/80 rounded-md w-10 mx-auto animate-none" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 bg-slate-200/80 rounded-md w-2/3 animate-none" />
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="h-4 bg-slate-200/80 rounded-md w-5/6 animate-none" />
                      </td>
                    </tr>
                  ))
                ) : standardDimensions.length > 0 ? (
                  standardDimensions.map((dim, idx) => (
                    <tr 
                      key={idx} 
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800">{translateDimensionText(dim.type || '', lang)}</span>
                          <button
                            onClick={() => onSelectRatio(dim.ratio)}
                            suppressHydrationWarning
                            className="inline-flex items-center justify-center opacity-40 hover:opacity-100 active:scale-95 transition-all duration-150 cursor-pointer"
                            title={t(`Filter galeri ke rasio ${dim.ratio}`, `Filter gallery to ratio ${dim.ratio}`)}
                          >
                            <Image 
                              src="https://cdn-icons-png.flaticon.com/128/12377/12377927.png" 
                              alt="Filter Rasio" 
                              width={14}
                              height={14}
                              className="object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-450 md:hidden font-medium text-slate-800 font-display">{translateDimensionText(dim.category || '', lang)}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">{dim.pixels}</td>
                      <td className="py-3.5 px-4 text-center text-slate-600 font-bold">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-none text-[10px] text-slate-600">{dim.ratio}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{translateDimensionText(dim.physical || '', lang) || (lang === 'id' ? 'Fleksibel' : 'Flexible')}</td>
                      <td className="py-3.5 px-4 text-slate-400 leading-relaxed max-w-xs hidden md:table-cell">{translateDimensionText(dim.useCase || '', lang)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold text-xs">
                      {t("Tidak ditemukan preset ukuran yang sesuai dengan filter Anda.", "No size presets found matching your filters.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
