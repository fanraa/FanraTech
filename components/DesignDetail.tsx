'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { DesignItem, allExtendedAssets, portfolioItems, getSavedDesigns, translateDesignItem } from '@/lib/data';
import Image from 'next/image';
import { syncDesignsFromCloud } from '@/lib/firebaseSync';
import { persistBookmarkToggle, getLoggedUserEmail } from '@/lib/bookmarkSync';
import { ZoomIn, Link2, Download, Copy, Bookmark, Focus } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface DesignDetailProps {
  item: DesignItem;
  onClose: () => void;
  onSelect?: (item: DesignItem) => void;
}

export default function DesignDetail({ item, onClose, onSelect }: DesignDetailProps) {
  const { lang, t } = useLanguage();
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<DesignItem | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(true);
  const [prevId, setPrevId] = useState(item.id);
  const [designs, setDesigns] = useState<DesignItem[]>(portfolioItems);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [savedAssetIds, setSavedAssetIds] = useState<string[]>([]);
  const [showSpecs, setShowSpecs] = useState(false);
  const [isShining, setIsShining] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean } | null>(null);

  const [fullscreenScale, setFullscreenScale] = useState(1);
  const [lastTouchTime, setLastTouchTime] = useState(0);

  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);

  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const translatedItem = useMemo(() => {
    return translateDesignItem(item, lang);
  }, [item, lang]);

  const recommendedItems = useMemo(() => {
    const candidates = (designs.length > 0 ? designs : portfolioItems).filter(p => p.id !== item.id);
    const sameCategory = candidates.filter(p => p.category === item.category);
    const otherCategories = candidates.filter(p => p.category !== item.category);

    const shuffledSame = [...sameCategory].sort(() => 0.5 - Math.random());
    const shuffledOthers = [...otherCategories].sort(() => 0.5 - Math.random());

    const result: typeof candidates = [];
    result.push(...shuffledSame.slice(0, 2));

    const needed = 3 - result.length;
    if (needed > 0) {
      result.push(...shuffledOthers.slice(0, needed));
    }

    const extraNeeded = 3 - result.length;
    if (extraNeeded > 0) {
      const remainingSame = shuffledSame.slice(2);
      result.push(...remainingSame.slice(0, extraNeeded));
    }

    return result.slice(0, 3);
  }, [item.id, designs]);

  const translatedRecommendedItems = useMemo(() => {
    return recommendedItems.map(rec => translateDesignItem(rec, lang));
  }, [recommendedItems, lang]);

  const translatedSelectedAsset = useMemo(() => {
    if (!selectedAsset) return null;
    return translateDesignItem(selectedAsset, lang);
  }, [selectedAsset, lang]);

  useEffect(() => {
    // Set initial client state values from localStorage safely
    const deferTimer = setTimeout(() => {
      setDesigns(getSavedDesigns());
      
      if (typeof window !== 'undefined') {
        const savedDesigns = localStorage.getItem('fanratech_saved_designs');
        if (savedDesigns) {
          try {
            const parsed = JSON.parse(savedDesigns);
            setIsSaved(parsed.includes(item.id));
          } catch {
            setIsSaved(false);
          }
        } else {
          setIsSaved(false);
        }
        
        const savedAssets = localStorage.getItem('fanratech_saved_assets');
        if (savedAssets) {
          try {
            setSavedAssetIds(JSON.parse(savedAssets));
          } catch {
            setSavedAssetIds([]);
          }
        } else {
          setSavedAssetIds([]);
        }
      }
    }, 0);

    // Jalankan sinkronisasi cloud di latar belakang
    syncDesignsFromCloud().then(cloudDesigns => {
      if (cloudDesigns) {
        setDesigns(cloudDesigns);
      }
    });

    const handleSync = () => {
      setDesigns(getSavedDesigns());
      
      if (typeof window !== 'undefined') {
        const savedDesigns = localStorage.getItem('fanratech_saved_designs');
        if (savedDesigns) {
          try {
            const parsed = JSON.parse(savedDesigns);
            setIsSaved(parsed.includes(item.id));
          } catch {
            setIsSaved(false);
          }
        } else {
          setIsSaved(false);
        }

        const savedAssets = localStorage.getItem('fanratech_saved_assets');
        if (savedAssets) {
          try {
            setSavedAssetIds(JSON.parse(savedAssets));
          } catch {
            setSavedAssetIds([]);
          }
        } else {
          setSavedAssetIds([]);
        }
      }
    };
    window.addEventListener('fanratech_data_updated', handleSync);
    return () => {
      clearTimeout(deferTimer);
      window.removeEventListener('fanratech_data_updated', handleSync);
    };
  }, [item.id]);

  if (item.id !== prevId) {
    setPrevId(item.id);
    setIsDetailLoading(true);
    setShowSpecs(false);
  }

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleToggleSaveDesign = async () => {
    if (typeof window !== 'undefined') {
      await persistBookmarkToggle(item.id, 'design');
    }
  };

  const handleToggleSaveAsset = async (assetItem: DesignItem) => {
    if (typeof window !== 'undefined') {
      await persistBookmarkToggle(assetItem.id, 'asset');
    }
  };

  const handleDownloadMockup = async () => {
    setIsDownloading(true);
    triggerToast(t("Memulai unduhan berkas desain utama...", "Starting download for master design file..."));

    // Deteksi tipe berkas asli secara dinamis (PNG, JPG, SVG, dll) (Asli & HD)
    let extension = 'jpg';
    if (item.image.startsWith('data:image/')) {
      const matched = item.image.match(/data:image\/([a-zA-Z+]+);base64/);
      if (matched && matched[1]) {
        extension = matched[1] === 'jpeg' ? 'jpg' : matched[1];
      }
    } else {
      const lastDot = item.image.lastIndexOf('.');
      if (lastDot !== -1) {
        const ext = item.image.substring(lastDot + 1).toLowerCase();
        if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) {
          extension = ext === 'jpeg' ? 'jpg' : ext;
        }
      }
    }

    // Jika base64, unduh langsung tanpa fetch
    if (item.image.startsWith('data:')) {
      try {
        const link = document.createElement('a');
        link.href = item.image;
        link.download = `${item.id}_design_mockup.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        triggerToast(t(`Unduhan mockup desain (.${extension}) berhasil.`, `Design mockup download (.${extension}) successful.`));
      } catch (err) {
        triggerToast(t("Gagal mengunduh berkas.", "Failed to download file."));
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    try {
      const response = await fetch(item.image);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.id}_original_design.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerToast(t(`Unduhan desain asli (.${extension}) berhasil.`, `Original design download (.${extension}) successful.`));
    } catch {
      // CORS fallback anchor download
      const link = document.createElement('a');
      link.href = item.image;
      link.target = "_blank";
      link.download = `${item.id}_original_design.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast(t("Berkas desain terbuka di tab baru untuk disimpan.", "Design file opened in a new tab for saving."));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadVector = () => {
    setIsDownloading(true);
    triggerToast(t("Memulai unduhan berkas vektor (.svg)...", "Starting download for vector file (.svg)..."));
    setTimeout(() => {
      try {
        const blob = new Blob([item.svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.sourceFile || `${item.id}_original_vector.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        triggerToast(t("Unduhan kode vektor (.svg) berhasil.", "Vector file download (.svg) successful."));
      } catch (err) {
        triggerToast(t("Gagal mengunduh berkas vektor kreatif.", "Failed to download creative vector file."));
      } finally {
        setIsDownloading(false);
      }
    }, 400);
  };

  const handleDownloadBoth = () => {
    handleDownloadMockup();
    setTimeout(() => {
      handleDownloadVector();
    }, 600);
  };

  const handleDownloadSingleAsset = (asset: DesignItem) => {
    try {
      const blob = new Blob([asset.svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = asset.sourceFile || `asset_${asset.id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerToast(t(`Unduhan aset "${asset.title}" berhasil.`, `Asset "${asset.title}" downloaded successfully.`));
    } catch {
      triggerToast(t("Gagal mengunduh berkas aset.", "Failed to download asset file."));
    }
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    triggerToast(t(`Warna disalin: ${hex}`, `Color copied: ${hex}`));
  };

  const handleCopyLink = () => {
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?id=${item.id}` : `https://fanratech.com/?id=${item.id}`;
    navigator.clipboard.writeText(shareUrl);
    triggerToast(t("Tautan share desain disalin ke papan klip!", "Design share link copied to clipboard!"));
  };

  const handleCopyImage = async () => {
    triggerToast(t("Menyalin gambar desain...", "Copying design image..."));
    try {
      // 1. First attempt: Copy as real image blob
      const response = await fetch(item.image, { mode: 'cors' }).catch(() => null);
      if (response && response.ok) {
        const blob = await response.blob();
        let imageBlob = blob;
        
        // Convert to PNG via canvas if browser requires image/png
        if (blob.type !== 'image/png') {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(blob);
          img.crossOrigin = 'anonymous';
          await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
          
          if (img.naturalWidth > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
              if (pngBlob) imageBlob = pngBlob;
            }
          }
        }
        
        const clipboardItem = new ClipboardItem({ [imageBlob.type]: imageBlob });
        await navigator.clipboard.write([clipboardItem]);
        triggerToast(t("Gambar berhasil disalin ke clipboard!", "Image successfully copied to clipboard!"));
        return;
      }
    } catch (err) {
      console.warn("Direct image blob copying not allowed, fallback to URL:", err);
    }

    // 2. Fallback attempt: Copy image URL beautifully
    try {
      await navigator.clipboard.writeText(item.image);
      triggerToast(t("Tautan gambar berhasil disalin ke papan klip!", "Image link successfully copied to clipboard!"));
    } catch (e) {
      console.error("Ultimate copy fallback failed:", e);
      triggerToast(t("Gagal menyalin gambar.", "Failed to copy image."));
    }
  };

  // Close context menu on external click/scroll
  useEffect(() => {
    const closeMenu = () => {
      if (contextMenu?.visible) {
        setContextMenu(prev => prev ? { ...prev, visible: false } : null);
      }
    };
    window.addEventListener('click', closeMenu);
    window.addEventListener('scroll', closeMenu);
    return () => {
      window.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu);
    };
  }, [contextMenu]);

  // Scroll smoothly to top and trigger skeleton load on component load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const timer = setTimeout(() => {
      setIsDetailLoading(false);
    }, 700); // smooth 700ms skeleton loading
    return () => clearTimeout(timer);
  }, [item.id]);

  // Disable scrolling of parent page content when modal or fullscreen is active
  useEffect(() => {
    if (selectedAsset || isFullscreen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [selectedAsset, isFullscreen]);

  // Filter corresponding assets inspired by or matching this category
  const relatedAssets = allExtendedAssets
    .filter(asset => asset.id.startsWith("gen-asset-") && asset.category === item.category)
    .slice(0, 12); // up to 12 relevant square assets

  // Beautiful Skeleton UI
  if (isDetailLoading) {
    return (
      <div className="w-full flex flex-col font-sans pb-16 pt-2 text-[#111827]">
        {/* Navigation skeleton */}
        <div className="flex items-center py-4 border-b border-slate-100 mb-6">
          <div className="h-4 bg-slate-200/60 rounded-md animate-pulse w-44" />
        </div>

        {/* Central box image skeleton */}
        <div className="flex flex-col items-center justify-center p-6 sm:p-10 bg-[#F9FAFB] rounded-2xl border border-slate-200/40 w-full mb-6">
          <div className="aspect-square w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px] bg-slate-200/80 rounded-2xl animate-pulse" />
        </div>

        {/* Support items slider skeleton */}
        <div className="mb-6 p-4 bg-[#F9FAFB] rounded-2xl border border-slate-200/50 h-28 animate-pulse" />

        {/* Action button skeleton */}
        <div className="h-16 w-full bg-slate-100/80 rounded-2xl border border-slate-200/30 animate-pulse mb-6" />

        {/* Multi-columns details skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-28 bg-slate-100/80 rounded-2xl animate-pulse" />
            <div className="h-24 bg-slate-100/80 rounded-2xl animate-pulse" />
          </div>
          <div className="h-44 bg-slate-100/80 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Dynamically constrain context menu positions within screen boundaries
  const menuWidth = 185;
  const menuHeight = 150;
  let posX = contextMenu ? contextMenu.x : 0;
  let posY = contextMenu ? contextMenu.y : 0;

  if (typeof window !== 'undefined') {
    if (posX + menuWidth > window.innerWidth) {
      posX = window.innerWidth - menuWidth - 12;
    }
    if (posY + menuHeight > window.innerHeight) {
      posY = window.innerHeight - menuHeight - 12;
    }
  }

  return (
    <div className="w-full flex flex-col font-sans pb-16 pt-2 animate-fade-in text-[#111827]">
      
      {/* 1. Sleek Navigation breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-b border-slate-100 mb-6 gap-2 w-full overflow-hidden">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 select-none overflow-x-auto whitespace-nowrap scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full sm:w-auto py-1">
          <Link href="/" className="hover:text-[#111827] transition-colors shrink-0">{t("Beranda", "Home")}</Link>
          <span className="shrink-0">/</span>
          <button 
            onClick={onClose} 
            className="hover:text-[#111827] transition-colors cursor-pointer focus:outline-none shrink-0"
          >
            {t("Eksplorasi Desain", "Design Exploration")}
          </button>
          <span className="shrink-0">/</span>
          <span className="text-[#111827] font-extrabold shrink-0 truncate max-w-[170px] xs:max-w-[240px] sm:max-w-none">{translatedItem.title}</span>
        </div>
 
        {/* Tombol kembali berupa teks murni rapi di bawah di mobile, di ujung kanan di desktop */}
        <button 
          onClick={onClose}
          className="text-xs font-bold text-slate-500 hover:text-[#111827] transition-colors cursor-pointer focus:outline-none tracking-wider shrink-0 uppercase text-[10px] mt-1 sm:mt-0 sm:pl-2 self-start sm:self-auto"
        >
          {t("kembali", "back")}
        </button>
      </div>

      {/* 2. Centered design photo perfectly matched to its real proportions/dimensions */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-[#F9FAFB] rounded-2xl border border-slate-100 w-full mb-6 relative select-none">
        
        {/* Strictly scale and size the design image rendering following true ratios */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          onClick={() => {
            setIsShining(true);
            setTimeout(() => {
              setIsShining(false);
            }, 600);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              visible: true
            });
          }}
          onTouchStart={(e) => {
            if (e.touches.length === 2) {
              e.preventDefault();
              const t1 = e.touches[0];
              const t2 = e.touches[1];
              const clientX = (t1.clientX + t2.clientX) / 2;
              const clientY = (t1.clientY + t2.clientY) / 2;
              setContextMenu({
                x: clientX,
                y: clientY,
                visible: true
              });
              if (touchTimerRef.current) {
                clearTimeout(touchTimerRef.current);
                touchTimerRef.current = null;
              }
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(35);
              }
              return;
            }

            // Single finger touch double tap detection
            const now = Date.now();
            if (now - lastTouchTime < 300) {
              e.preventDefault();
              setIsFullscreen(true);
              if (touchTimerRef.current) {
                clearTimeout(touchTimerRef.current);
                touchTimerRef.current = null;
              }
              return;
            }
            setLastTouchTime(now);

            const touch = e.touches[0];
            const clientX = touch.clientX;
            const clientY = touch.clientY;
            if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
            touchTimerRef.current = setTimeout(() => {
              setContextMenu({
                x: clientX,
                y: clientY,
                visible: true
              });
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(35);
              }
            }, 600);
          }}
          onTouchEnd={() => {
            if (touchTimerRef.current) {
              clearTimeout(touchTimerRef.current);
              touchTimerRef.current = null;
            }
          }}
          onTouchMove={() => {
            if (touchTimerRef.current) {
              clearTimeout(touchTimerRef.current);
              touchTimerRef.current = null;
            }
          }}
          onDoubleClick={() => setIsFullscreen(true)}
          className="group relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex items-center justify-center z-10 cursor-pointer active:scale-[0.98] transition-transform duration-150 animate-fade-in"
          id="active-design-box"
        >
          <img 
            src={translatedItem.image} 
            alt={translatedItem.title} 
            className="w-full h-auto select-none pointer-events-none block" 
            referrerPolicy="no-referrer"
          />

          {/* Elegant Subtle Focus Icon Button (top right, no box, white with shadow, interactive) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="absolute top-3 right-3 z-35 drop-shadow-[0_2px_6px_rgba(0,0,0,0.50)] hover:scale-110 active:scale-90 focus:outline-none cursor-pointer flex items-center justify-center p-2.5 transition-all duration-300 opacity-25 group-hover:opacity-100 select-none bg-transparent border-none"
            title={t("Perbesar Desain", "Zoom Design")}
          >
            <img 
              src="https://cdn-icons-png.flaticon.com/128/15313/15313764.png"
              alt={t("Perbesar", "Zoom")}
              className="w-5.5 h-5.5 object-contain"
              referrerPolicy="no-referrer"
              style={{
                filter: 'brightness(0) invert(1)',
              }}
            />
          </button>

          {/* Flash/Shine overlay effect */}
          <AnimatePresence>
            {isShining && (
              <motion.div
                initial={{ x: '-150%', skewX: -30 }}
                animate={{ x: '150%', skewX: -30 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent z-40 pointer-events-none"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 3. Action Strip containing Title, Save toggle, and Dropdown Download */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-slate-100 shadow-3xs mb-6 relative z-30">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-display font-black leading-tight text-[#111827]">
            {translatedItem.title}
          </h2>
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-normal tracking-wider uppercase select-none">
            <span>#{translatedItem.category}</span>
          </div>
        </div>

        {/* Tactical clean actions (bookmark toggle, download config) */}
        <div className="flex items-center justify-center sm:justify-end gap-3 shrink-0 w-full sm:w-auto">
          {/* Save Design Bookmark Option */}
          <button
            onClick={handleToggleSaveDesign}
            className="inline-flex items-center justify-center gap-2 px-3 py-1.5 hover:bg-slate-50 rounded-xl transition duration-200 cursor-pointer focus:outline-none font-bold text-xs min-h-[44px]"
            title={isSaved ? t("Desain disimpan", "Design saved") : t("Simpan Desain", "Save Design")}
          >
            <Image 
              src={isSaved 
                ? "https://cdn-icons-png.flaticon.com/128/5668/5668020.png" 
                : "https://cdn-icons-png.flaticon.com/128/5186/5186087.png"
              } 
              alt="Bookmark Icon"
              width={16}
              height={16}
              className="object-contain"
              referrerPolicy="no-referrer"
              style={{
                filter: 'brightness(0) saturate(100%) invert(8%) sepia(16%) saturate(1914%) hue-rotate(185deg) brightness(97%) contrast(97%)',
              }}
            />
            <span className="text-[#111827]">{isSaved ? t("Tersimpan", "Saved") : t("Simpan", "Save")}</span>
          </button>

          {/* Direct Download Option (No dropdown) */}
          <button
            onClick={handleDownloadMockup}
            disabled={isDownloading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#111827] hover:bg-slate-800 text-white rounded-xl transition duration-200 cursor-pointer focus:outline-none font-bold text-xs shadow-sm shadow-slate-200 min-h-[44px] select-none"
            title={t("Unduh Berkas Desain", "Download Design File")}
          >
            <Image 
              src="https://cdn-icons-png.flaticon.com/128/2767/2767144.png"
              alt="Download Icon"
              width={16}
              height={16}
              className="object-contain filter invert"
              referrerPolicy="no-referrer"
            />
            <span>{isDownloading ? t("Mengunduh...", "Downloading...") : t("Unduh", "Download")}</span>
          </button>
        </div>
      </div>

      {/* 3.5. Deskripsi & Eksplorasi Konseptual */}
      <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-100 shadow-3xs mb-6 text-left">
        {translatedItem.longDescription || translatedItem.description ? (
          <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans font-normal">
            {translatedItem.longDescription || translatedItem.description}
          </p>
        ) : (
          <p className="text-xs sm:text-[13px] text-slate-400 italic font-sans leading-relaxed">
            {t(
               "Karya minimalis eksklusif garapan FanraTech. Desain visual presisi tinggi ini mengusung estetika premium yang dirancang untuk kebutuhan branding modern dan portofolio digital berkualitas tinggi.",
               "An exclusive minimalist masterpiece by FanraTech. This high-precision visual design bears premium aesthetics designed for modern branding needs and high-quality digital portfolios."
            )}
          </p>
        )}
      </div>

      {/* 3.8. Tombol interaktif untuk melihat Spesifikasi & Palet Warna */}
      <div className="mb-6 flex justify-start">
        <button
          onClick={() => setShowSpecs(!showSpecs)}
          className="inline-flex items-center gap-1.5 py-1 text-slate-500 hover:text-[#111827] transition duration-200 cursor-pointer focus:outline-none font-sans font-semibold text-xs select-none"
        >
          <span>{showSpecs ? t("Sembunyikan Spesifikasi & Palet Warna", "Hide Specifications & Color Palette") : t("Lihat Spesifikasi & Palet Warna", "View Specifications & Color Palette")}</span>
          <svg
            className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showSpecs ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* 4. Specifications and details in a balanced 2-column grid on desktop */}
      <AnimatePresence initial={false}>
        {showSpecs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-2">
              {/* Left: Rasio & Pixel */}
              <div className="flex flex-col h-full">
                {translatedItem.dimensions ? (
                  <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-3xs space-y-3 flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-sans font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3">
                        {t("Rasio & Piksel", "Ratio & Pixels")}
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#F9FAFB] p-3 rounded-xl border border-slate-200/40 text-left">
                          <p className="text-[10px] text-slate-400 font-sans font-medium">{t("Rasio Aspek", "Aspect Ratio")}</p>
                          <p className="font-sans font-semibold text-xs text-[#111827] mt-1">{translatedItem.dimensions.ratio}</p>
                        </div>
                        <div className="bg-[#F9FAFB] p-3 rounded-xl border border-slate-200/40 text-left">
                          <p className="text-[10px] text-slate-400 font-sans font-medium">{t("Piksel (Px)", "Pixels (Px)")}</p>
                          <p className="font-sans font-semibold text-xs text-[#111827] mt-1 truncate">{translatedItem.dimensions.pixels}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-3xs h-full flex items-center justify-center text-xs text-slate-400">
                    {t("Rasio tidak ditentukan", "Ratio not specified")}
                  </div>
                )}
              </div>

              {/* Right: Palet Warna */}
              <div className="flex flex-col h-full">
                {translatedItem.colors && translatedItem.colors.length > 0 ? (
                  <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-3xs space-y-3 flex flex-col justify-between h-full">
                    <div>
                      <h3 className="font-sans font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3">
                        {t("Palet Warna", "Color Palette")}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {translatedItem.colors.map((color, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleCopyColor(color.hex)}
                            className="flex items-center justify-between gap-2 p-2 bg-[#F9FAFB] hover:bg-slate-100/50 rounded-full border border-slate-100 hover:border-slate-200 transition duration-200 cursor-pointer text-left focus:outline-none"
                            title={`Salin warna ${color.hex}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span 
                                className="w-6 h-6 rounded-full shrink-0 border border-slate-200 shadow-inner" 
                                style={{ backgroundColor: color.hex }}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-mono font-bold text-slate-700 leading-none">{color.hex}</p>
                              </div>
                            </div>
                            
                            {/* Minimalist Copy SVG Icon */}
                            <svg 
                              className="w-3.5 h-3.5 text-slate-400 hover:text-[#111827] stroke-[2] shrink-0 pointer-events-none mr-1" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-3xs h-full flex items-center justify-center text-xs text-slate-400">
                    {t("Belum ada Palet Warna", "No Color Palette yet")}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rekomendasi Desain Serupa */}
      {translatedRecommendedItems.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-100 text-left">
          <p className="text-[10px] font-sans font-bold tracking-wider uppercase text-slate-400 mb-1">
            {t("Inspirasi Kreatif Serupa", "Similar Creative Inspiration")}
          </p>
          <h3 className="text-lg font-sans font-semibold text-[#111827] tracking-tight mb-6">
            {t("Rekomendasi Desain Kreatif", "Recommended Creative Designs")}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {translatedRecommendedItems.map((recItem) => (
              <div
                key={recItem.id}
                onClick={() => {
                  if (onSelect) {
                    onSelect(recItem);
                  }
                }}
                className="group bg-white border border-slate-100/80 hover:border-slate-200 rounded-2xl p-4 shadow-3xs hover:shadow-2xs transition-all duration-200 flex flex-col justify-between cursor-pointer select-none"
                title={t(`Detail ${recItem.title}`, `View ${recItem.title} details`)}
              >
                {/* Photo frame maintaining original natural ratio with solid wrapper and white inner card frame */}
                <div className="w-full bg-[#F9FAFB] rounded-xl border border-slate-100 p-4 mb-4 flex items-center justify-center min-h-[160px] relative overflow-hidden">
                  <div className="relative w-full max-w-[125px] bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden flex items-center justify-center z-10">
                    <img
                      src={recItem.image}
                      alt={recItem.title}
                      className="w-full h-auto select-none pointer-events-none block"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <div className="text-left mt-1">
                  <span className="text-[8px] font-mono font-bold tracking-wider uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                    {recItem.category}
                  </span>
                  <h4 className="text-xs sm:text-[13px] font-extrabold text-slate-900 tracking-tight mt-2 line-clamp-1">
                    {recItem.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {recItem.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Centered Asset Popup Modal */}
      <AnimatePresence>
        {translatedSelectedAsset && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans focus:outline-none">
            {/* Backdrop overlay with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAsset(null)}
              className="fixed inset-0 bg-[#111827]/40 backdrop-blur-xs cursor-default"
            />

            {/* Centered modal box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-[300px] bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden p-5 space-y-4 z-50 text-[#111827]"
              id="detail-asset-popup"
            >
              {/* Bookmark Toggle */}
              <button
                onClick={() => handleToggleSaveAsset(translatedSelectedAsset)}
                className="absolute top-4 left-4 p-1 cursor-pointer focus:outline-none flex items-center justify-center transition-none"
                title={savedAssetIds.includes(translatedSelectedAsset.id) ? t("Tersimpan", "Saved") : t("Simpan Aset", "Save Asset")}
              >
                <Image 
                  src={savedAssetIds.includes(translatedSelectedAsset.id) 
                    ? "https://cdn-icons-png.flaticon.com/128/5668/5668020.png" 
                    : "https://cdn-icons-png.flaticon.com/128/5186/5186087.png"
                  } 
                  alt="Bookmark"
                  width={18}
                  height={18}
                  className="object-contain"
                  referrerPolicy="no-referrer"
                  style={{
                    filter: 'brightness(0) saturate(100%) invert(8%) sepia(16%) saturate(1914%) hue-rotate(185deg) brightness(97%) contrast(97%)',
                    opacity: savedAssetIds.includes(translatedSelectedAsset.id) ? 1 : 0.35,
                  }}
                />
              </button>

              {/* Close button */}
              <button
                onClick={() => setSelectedAsset(null)}
                className="absolute top-4 right-4 p-1 cursor-pointer focus:outline-none flex items-center justify-center text-slate-400 hover:text-[#111827] transition-none"
                title={t("Tutup", "Close")}
              >
                <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* SVG vector frame */}
              <div className="w-full aspect-square max-w-[120px] bg-[#F9FAFB] rounded-xl border border-slate-100 p-2 mx-auto flex items-center justify-center relative overflow-hidden shadow-xs mt-2">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
                <div 
                  className="w-full h-full flex items-center justify-center select-none"
                  dangerouslySetInnerHTML={{ __html: translatedSelectedAsset.svgContent }}
                />
              </div>

              {/* Asset content details */}
              <div className="space-y-3.5 pt-1">
                <div className="text-center">
                  <h4 className="text-xs sm:text-sm font-extrabold font-sans text-slate-900 leading-tight block px-2">
                    {translatedSelectedAsset.title}
                  </h4>
                  <span className="text-[8px] font-mono text-slate-400 mt-1 block">ID: #{translatedSelectedAsset.id}</span>
                </div>

                {/* Interactive Colors */}
                {translatedSelectedAsset.colors && translatedSelectedAsset.colors.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {translatedSelectedAsset.colors.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => handleCopyColor(color.hex)}
                        className="flex items-center gap-1 p-0.5 px-1 rounded hover:border-slate-350 transition-none bg-[#F9FAFB] text-[#111827] cursor-pointer focus:outline-none border border-slate-100 shrink-0"
                        title={`Salin warna ${color.name} (${color.hex})`}
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-xs shrink-0 border border-slate-200/50" 
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[8px] font-bold font-mono text-slate-600 tracking-tight leading-none">{color.hex}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3" />

                {/* Direct downloads */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <button
                    onClick={() => handleDownloadSingleAsset(translatedSelectedAsset)}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 bg-[#F9FAFB] text-slate-800 hover:text-black hover:border-slate-400 transition-none cursor-pointer focus:outline-none font-bold text-[10px] w-full"
                    title="Unduh Vektor"
                  >
                    <Image 
                      src="https://cdn-icons-png.flaticon.com/128/2767/2767144.png" 
                      alt="Download"
                      width={14}
                      height={14}
                      className="object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span>{t("Unduh Vektor (.svg)", "Download Vector (.svg)")}</span>
                  </button>

                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="text-[9px] text-slate-400 hover:text-[#111827] focus:outline-none transition-none cursor-pointer font-sans underline underline-offset-2 inline-block pt-1"
                  >
                    {t("kembali ke rincian", "back to details")}
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
      {/* 5. Fullscreen Design Image Lightbox Overlay (White blur background, dismiss on backdrop click) */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setIsFullscreen(false);
              setFullscreenScale(1);
            }}
            className="fixed inset-0 z-[99990] bg-[#F9FAFB]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 cursor-zoom-out animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: fullscreenScale }}
              exit={{ scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => {
                e.stopPropagation();
                // Double tap on computer/click: toggle zoom in/out
                setFullscreenScale(prev => prev === 1 ? 2 : 1);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                if (e.touches.length === 2) {
                  const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                  );
                  pinchStartDistRef.current = dist;
                  pinchStartScaleRef.current = fullscreenScale;
                } else {
                  // Single touch double tap logic inside fullscreen
                  const now = Date.now();
                  if (now - lastTouchTime < 300) {
                    e.preventDefault();
                    setFullscreenScale(prev => prev > 1 ? 1 : 2);
                  }
                  setLastTouchTime(now);
                }
              }}
              onTouchMove={(e) => {
                e.stopPropagation();
                if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
                  const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                  );
                  const factor = dist / pinchStartDistRef.current;
                  const newScale = Math.max(1, Math.min(4, pinchStartScaleRef.current * factor));
                  setFullscreenScale(newScale);
                }
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                if (e.touches.length < 2) {
                  pinchStartDistRef.current = null;
                }
              }}
              className="relative max-w-full max-h-[82vh] sm:max-h-[85vh] flex flex-col items-center justify-center pointer-events-auto transition-transform duration-75"
            >
              <img
                src={translatedItem.image}
                alt={translatedItem.title}
                className="max-w-full max-h-[76vh] sm:max-h-[80vh] object-contain rounded-2xl shadow-[0_20px_45px_rgba(17,24,39,0.06)] border border-slate-200/60 select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            
            {/* Elegant, clean & low-contrast helper instructions under the artwork layout */}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              className="mt-6 text-center text-[10px] sm:text-xs font-sans font-normal text-[#111827]/60 select-none pointer-events-none normal-case px-4"
            >
              {t("cubit untuk memperbesar, klik apa saja untuk keluar", "pinch to zoom, click anywhere to exit")}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Floating Custom Context Menu (Luxury White Theme, always styled beautifully) */}
      <AnimatePresence>
        {contextMenu && contextMenu.visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{ 
              position: 'fixed',
              top: posY,
              left: posX,
              zIndex: 999999
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-[200px] bg-white text-[#111827] rounded-xl shadow-[0_12px_44px_rgba(17,24,39,0.12)] border border-slate-200/80 p-1.5 flex flex-col gap-0.5 select-none"
          >
            {/* 1. Perbesar (Zoom) Option */}
            <button
              onClick={() => {
                setIsFullscreen(true);
                setContextMenu(prev => prev ? { ...prev, visible: false } : null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition duration-150 cursor-pointer text-[10px] sm:text-xs font-bold font-sans text-[#111827] focus:outline-none"
            >
              <img 
                src="https://cdn-icons-png.flaticon.com/128/15313/15313764.png"
                alt="Zoom Icon"
                className="w-3.5 h-3.5 object-contain opacity-60"
                referrerPolicy="no-referrer"
                style={{
                  filter: 'brightness(0) saturate(100%) invert(8%) sepia(16%) saturate(1914%) hue-rotate(185deg) brightness(97%) contrast(97%)',
                }}
              />
              <span>{t("Perbesar Desain", "Zoom Design")}</span>
            </button>

            {/* 2. Simpan Desain (Save) Option */}
            <button
              onClick={() => {
                handleToggleSaveDesign();
                setContextMenu(prev => prev ? { ...prev, visible: false } : null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition duration-150 cursor-pointer text-[10px] sm:text-xs font-bold font-sans text-[#111827] focus:outline-none"
            >
              <Bookmark className={`w-3.5 h-3.5 stroke-[2.2] text-[#111827] ${isSaved ? 'fill-[#111827]' : 'fill-none'}`} />
              <span>{isSaved ? t("Hapus Simpanan", "Remove Saved") : t("Simpan Gambar (Save)", "Save Image")}</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            {/* 3. Salin Gambar Option */}
            <button
              onClick={() => {
                handleCopyImage();
                setContextMenu(prev => prev ? { ...prev, visible: false } : null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition duration-150 cursor-pointer text-[10px] sm:text-xs font-bold font-sans text-[#111827] focus:outline-none"
            >
              <Copy className="w-3.5 h-3.5 stroke-[2.2] text-slate-500" />
              <span>{t("Salin Gambar", "Copy Image")}</span>
            </button>

            {/* 4. Salin URL Desain Option */}
            <button
              onClick={() => {
                handleCopyLink();
                setContextMenu(prev => prev ? { ...prev, visible: false } : null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition duration-150 cursor-pointer text-[10px] sm:text-xs font-bold font-sans text-[#111827] focus:outline-none"
            >
              <Link2 className="w-3.5 h-3.5 stroke-[2.2] text-slate-500" />
              <span>{t("Salin URL Desain", "Copy Design URL")}</span>
            </button>

            <div className="h-px bg-slate-100 my-1" />

            {/* 5. Unduh Option */}
            <button
              onClick={() => {
                handleDownloadMockup();
                setContextMenu(prev => prev ? { ...prev, visible: false } : null);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center gap-2.5 transition duration-150 cursor-pointer text-[10px] sm:text-xs font-bold font-sans text-[#111827] focus:outline-none"
            >
              <img 
                src="https://cdn-icons-png.flaticon.com/128/2767/2767144.png"
                alt="Download Icon"
                className="w-3.5 h-3.5 object-contain opacity-60"
                referrerPolicy="no-referrer"
                style={{
                  filter: 'brightness(0) saturate(100%) invert(8%) sepia(16%) saturate(1914%) hue-rotate(185deg) brightness(97%) contrast(97%)',
                }}
              />
              <span>{t("Unduh", "Download")}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toast notification bar */}
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
    </div>
  );
}
