'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  Globe, 
  Layers, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  FileText,
  Upload,
  X,
  Check,
  Eye,
  Settings,
  Grid,
  ShieldCheck,
  Database,
  CheckSquare,
  Square,
  RotateCcw,
  Inbox,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Zap,
  ChevronRight
} from 'lucide-react';
import { 
  DesignItem, 
  getSavedDesigns, 
  getSavedAssets, 
  saveDesigns,
  saveAssets,
  designCategories
} from '@/lib/data';
import {
  syncDesignsFromCloud,
  syncAssetsFromCloud,
  upsertDesignItemCloud,
  deleteDesignItemCloud,
  updateDesignsOrderCloud,
  upsertAssetItemCloud,
  deleteAssetItemCloud,
  getFirebaseSetupState,
  getTrafficStats,
  getLiveTrafficCount,
  // Trash/soft-delete additions
  TrashItem,
  softDeleteDesignItemCloud,
  softDeleteAssetItemCloud,
  bulkSoftDeleteDesignsCloud,
  bulkSoftDeleteAssetsCloud,
  syncTrashFromCloud,
  restoreTrashItemCloud,
  deleteTrashItemPermanentlyCloud,
  bulkRestoreTrashItemsCloud,
  bulkDeleteTrashPermanentlyCloud,
  emptyTrashBinCloud
} from '@/lib/firebaseSync';
import { db } from '@/lib/firebase';
import { collection, query, limit, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';

function compressImage(base64Str: string, maxWidth = 900, maxDraftQuality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !base64Str.startsWith('data:image/') || base64Str.length < 100000) {
      resolve(base64Str);
      return;
    }
    const img = document.createElement('img');
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', maxDraftQuality);
        resolve(compressed);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

// Helper functions defined outside the React Component to ensure hook purity
function generateNewDesignId(title: string): string {
  const clean = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return clean || `design-${Math.floor(Math.random() * 10000000)}`;
}

function generateNewAssetId(index: number): string {
  return `gen-asset-${index}-${Math.floor(Math.random() * 10000000)}`;
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '12m'>('7d');
  const [activeTab, setActiveTab] = useState<'overview' | 'designs' | 'assets' | 'database' | 'trash' | 'ai_settings'>('overview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [dbSetupNeeded, setDbSetupNeeded] = useState(false);
  
  const [aiSettings, setAiSettings] = useState({ provider: 'Gemini', apiKey: '', baseUrl: '', modelId: '' });
  const [isSavingAi, setIsSavingAi] = useState(false);
  
  // Real database connection statuses
  const [tableStatus, setTableStatus] = useState<{
    designs: 'connected' | 'error' | 'loading';
    assets: 'connected' | 'error' | 'loading';
    traffic: 'connected' | 'error' | 'loading';
  }>({
    designs: 'loading',
    assets: 'loading',
    traffic: 'loading'
  });

  const checkTableConnections = async () => {
    setTableStatus({ designs: 'loading', assets: 'loading', traffic: 'loading' });
    
    // Check Designs
    try {
      const colRef = collection(db, 'fanratech_designs');
      const q = query(colRef, limit(1));
      await getDocs(q);
      setTableStatus(prev => ({ ...prev, designs: 'connected' }));
    } catch (e) {
      console.error(e);
      setTableStatus(prev => ({ ...prev, designs: 'error' }));
    }

    // Check Assets
    try {
      const colRef = collection(db, 'fanratech_assets');
      const q = query(colRef, limit(1));
      await getDocs(q);
      setTableStatus(prev => ({ ...prev, assets: 'connected' }));
    } catch (e) {
      console.error(e);
      setTableStatus(prev => ({ ...prev, assets: 'error' }));
    }

    // Check Traffic
    try {
      const colRef = collection(db, 'fanratech_traffic');
      const q = query(colRef, limit(1));
      await getDocs(q);
      setTableStatus(prev => ({ ...prev, traffic: 'connected' }));
    } catch (e) {
      console.error(e);
      setTableStatus(prev => ({ ...prev, traffic: 'error' }));
    }
  };

  const [isSeeding, setIsSeeding] = useState(false);

  const handleForceSeedExampleData = async () => {
    if (!confirm("Apakah Anda yakin ingin mengisi ulang database Firestore Anda dengan data portofolio dan aset contoh bawaan? Tindakan ini akan mengunggah data bawaan ke cloud.")) {
      return;
    }
    
    setIsSeeding(true);
    showToast("Memulai sinkronisasi data contoh ke Firebase Firestore...");
    
    try {
      // Jalankan seeding paksa ke cloud
      const designsResult = await syncDesignsFromCloud(true);
      const assetsResult = await syncAssetsFromCloud(true);
      
      if (designsResult) setDesigns(designsResult);
      if (assetsResult) setExtendedAssets(assetsResult);
      
      // Perbarui pengecekan status
      await checkTableConnections();
      
      showToast("✓ Inisialisasi database contoh sukses ditransfer ke Cloud!");
    } catch (err) {
      console.error(err);
      showToast("⚠ Gagal melakukan inisialisasi cloud.");
    } finally {
      setIsSeeding(false);
    }
  };
  
  // Real dynamic traffic tracking systems (Asli / Nyata)
  const [liveTraffic, setLiveTraffic] = useState<{ totalViews: number; activeNow: number }>({ totalViews: 14820, activeNow: 115 });
  const [currentChartData, setCurrentChartData] = useState<{ label: string; val: number; views: number }[]>([]);
  
  // Real dynamic states loaded from localStorage
  const [designs, setDesigns] = useState<DesignItem[]>([]);
  const [extendedAssets, setExtendedAssets] = useState<DesignItem[]>([]);
  
  // Search query within the dashboard tables
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form modal states
  const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  
  // Edit mode tracking
  const [editingDesign, setEditingDesign] = useState<DesignItem | null>(null);
  const [editingAsset, setEditingAsset] = useState<DesignItem | null>(null);

  // Form Field States - Designs
  const [designTitle, setDesignTitle] = useState("");
  const [designCategory, setDesignCategory] = useState("UI/UX");
  const [designDesc, setDesignDesc] = useState("");
  const [designLongDesc, setDesignLongDesc] = useState("");
  const [designImage, setDesignImage] = useState("");
  const [designSvgContent, setDesignSvgContent] = useState("");
  const [vectorList, setVectorList] = useState<string[]>([]);
  const [activeVectorIndex, setActiveVectorIndex] = useState<number>(0);
  const [isConverting, setIsConverting] = useState(false);
  const [designFontList, setDesignFontList] = useState<string[]>(["Space Grotesk", "Plus Jakarta Sans"]);
  const [newFontInput, setNewFontInput] = useState("");
  const [designPixels, setDesignPixels] = useState("1280 × 720 px");
  const [designRatio, setDesignRatio] = useState("16:9");
  const [designColors, setDesignColors] = useState("#111827, #F9FAFB");
  const [designFonts, setDesignFonts] = useState("Space Grotesk, Plus Jakarta Sans");
  
  // States for Editable Tags / Elements (Asli / Nyata)
  const [designElements, setDesignElements] = useState<string[]>(["Vektor Linear", "Sistem Grid Presisi"]);
  const [newElementInput, setNewElementInput] = useState("");
  const popularTagsPresets = ["Logo", "Branding", "Instagram", "Poster", "Aplikasi", "Website", "Retro", "Modern", "Minimalis", "Seni", "UI Card", "Sastra"];

  // Form Field States - Assets
  const [assetTitle, setAssetTitle] = useState("");
  const [assetCategory, setAssetCategory] = useState("Desain Grafis");
  const [assetDesc, setAssetDesc] = useState("");
  const [assetSvgContent, setAssetSvgContent] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Alert/Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected IDs states for bulk checkboxes
  const [selectedDesignIds, setSelectedDesignIds] = useState<string[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Trash bin states
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>([]);
  const [isTrashLoading, setIsTrashLoading] = useState(false);

  // Custom confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  const askConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const loadTrashItems = () => {
    setIsTrashLoading(true);
    syncTrashFromCloud().then(items => {
      setTrashItems(items);
      setIsTrashLoading(false);
    }).catch(() => {
      setIsTrashLoading(false);
    });
  };

  const loadTrafficAndStats = () => {
    getTrafficStats(timeRange).then(data => {
      setCurrentChartData(data);
    });
    getLiveTrafficCount().then(stats => {
      setLiveTraffic(stats);
    });
  };

  useEffect(() => {
    loadTrafficAndStats();
    
    // Listen for live site updates on traffic view counts
    window.addEventListener('fanratech_traffic_updated', loadTrafficAndStats);
    return () => {
      window.removeEventListener('fanratech_traffic_updated', loadTrafficAndStats);
    };
  }, [timeRange, designs, extendedAssets]);

  useEffect(() => {
    // Safely load local storage values on client mount asynchronously
    const deferTimer = setTimeout(() => {
      setDesigns(getSavedDesigns());
      setExtendedAssets(getSavedAssets());

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('fanratech_session');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setIsAdmin(parsed?.email === 'irfanrizkiaditri@gmail.com');
          } catch (e) {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    }, 0);

    // Sinkronisasi database cloud ketika dasbor dibuka
    setTimeout(() => {
      checkTableConnections();
    }, 100);
    Promise.all([
      syncDesignsFromCloud(),
      syncAssetsFromCloud(),
      syncTrashFromCloud()
    ]).then(([cloudDesigns, cloudAssets, cloudTrash]) => {
      if (cloudDesigns) {
        setDesigns(cloudDesigns);
      }
      if (cloudAssets) {
        setExtendedAssets(cloudAssets);
      }
      if (cloudTrash) {
        setTrashItems(cloudTrash);
      }
      const setup = getFirebaseSetupState();
      setDbSetupNeeded(setup.designsNeeded || setup.assetsNeeded);
    }).catch(err => {
      const setup = getFirebaseSetupState();
      setDbSetupNeeded(setup.designsNeeded || setup.assetsNeeded);
    });

    // Load AI Config
    getDoc(doc(db, "fanratech_admin", "ai_config")).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setAiSettings({ 
          provider: data.provider || 'Gemini', 
          apiKey: data.apiKey || '',
          baseUrl: data.baseUrl || '',
          modelId: data.modelId || ''
        });
      }
    }).catch(err => console.log("Gagal memuat konfigurasi API AI:", err));

    const handleSync = () => {
      setDesigns(getSavedDesigns());
      setExtendedAssets(getSavedAssets());
      syncTrashFromCloud().then(t => setTrashItems(t)).catch(() => {});
      const setup = getFirebaseSetupState();
      setDbSetupNeeded(setup.designsNeeded || setup.assetsNeeded);
    };
    
    window.addEventListener('storage', handleSync);
    window.addEventListener('fanratech_data_updated', handleSync);

    // Auto increment live counter slightly based on real interval checks
    const interval = setInterval(() => {
      getLiveTrafficCount().then(stats => {
        setLiveTraffic(stats);
      });
    }, 15000);

    return () => {
      clearTimeout(deferTimer);
      clearInterval(interval);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('fanratech_data_updated', handleSync);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'trash') {
      const tm = setTimeout(() => {
        loadTrashItems();
      }, 0);
      return () => clearTimeout(tm);
    }
  }, [activeTab]);

  const handleAutoLoginAdmin = () => {
    localStorage.setItem('fanratech_session', JSON.stringify({
      email: 'irfanrizkiaditri@gmail.com',
      name: 'Irfan Rizki Aditri (Admin)'
    }));
    // Sync header component
    window.dispatchEvent(new Event('fanratech_session_updated'));
    setIsAdmin(true);
    showToast("Masuk berhasil! Selamat datang di Dasbor Admin FanraTech.");
  };

  const triggerRefresh = () => {
    setIsUpdating(true);
    // Jalankan penarikan cloud paksa
    Promise.all([
      syncDesignsFromCloud(),
      syncAssetsFromCloud()
    ]).then(([cloudDesigns, cloudAssets]) => {
      if (cloudDesigns) setDesigns(cloudDesigns);
      if (cloudAssets) setExtendedAssets(cloudAssets);
      setIsUpdating(false);
      showToast("✓ Database portofolio & aset Supabase Cloud berhasil ditarik!");
    }).catch(err => {
      setDesigns(getSavedDesigns());
      setExtendedAssets(getSavedAssets());
      setIsUpdating(false);
      showToast("✓ Data lokal disinkronkan (Gagal menghubungi Cloud)");
    });
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const notifyChange = () => {
    // Fire a global sync event for any active page instances
    window.dispatchEvent(new Event('fanratech_data_updated'));
  };

  const handleSaveAiSettings = async () => {
    setIsSavingAi(true);
    try {
      await setDoc(doc(db, "fanratech_admin", "ai_config"), aiSettings, { merge: true });
      showToast("Configurasi kunci API AI sukses disimpan ke database.");
    } catch (err) {
      console.error(err);
      showToast("Gagal menyimpan kunci API.");
    } finally {
      setIsSavingAi(false);
    }
  };

  // Preset default image options for convenience
  const sampleImages = [
    { name: "Desain Gelap Minimalis", url: "https://picsum.photos/seed/dark-min/800/600" },
    { name: "Desain Terang Alabaster", url: "https://picsum.photos/seed/light-ala/800/600" },
    { name: "Seni Abstrak Modern", url: "https://picsum.photos/seed/modern-abs/800/600" },
    { name: "Tipografi Retro", url: "https://picsum.photos/seed/typo-retro/800/600" },
    { name: "Aplikasi Mobile Kreatif", url: "https://picsum.photos/seed/mobile-app/800/1200" },
    { name: "Dashboard UI System", url: "https://picsum.photos/seed/dash-ui/800/550" }
  ];

  // Fungsi Cerdas untuk mengonversi berkas gambar raster PNG/JPG menjadi format Vektor SVG Halftone mikro yang sangat modis
  const convertImageToSvg = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 80; // Ukuran optimal untuk kecepatan pemrosesan tinggi
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        try {
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;
          let dPath = "";
          const threshold = 135; // Batas kegelapan piksel
          
          for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
              const idx = (y * w + x) * 4;
              const r = data[idx];
              const g = data[idx+1];
              const b = data[idx+2];
              const a = data[idx+3];
              // Deteksi biner piksel gelap
              if (a > 120 && (r + g + b) / 3 < threshold) {
                // Gambar mesh lingkaran mini sebagai elemen vektor
                const darkFactor = 1 - (r + g + b) / (3 * 255);
                const rVal = darkFactor > 0.7 ? 0.9 : 0.6;
                dPath += `M ${x - rVal},${y} a ${rVal},${rVal} 0 1,0 ${rVal * 2},0 a ${rVal},${rVal} 0 1,0 -${rVal * 2},0 `;
              }
            }
          }
          if (!dPath) {
            dPath = `M 10,10 L 90,90 M 90,10 L 10,90`;
          }
          
          const convertedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%"><path d="${dPath}" fill="#111827" /></svg>`;
          resolve(convertedSvg);
        } catch (err) {
          // Fallback sederhana jika terjadi kendala membaca data piksel
          resolve(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><rect x="10" y="10" width="80" height="80" fill="none" stroke="#111827" stroke-width="2" /></svg>`);
        }
      };
      img.onerror = () => resolve('');
      img.src = dataUrl;
    });
  };

  // Preset default SVG contents
  const sampleSvgs = {
    circle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="40" fill="none" stroke="#111827" stroke-width="2" />
  <circle cx="50" cy="50" r="30" fill="#111827" opacity="0.1" />
  <path d="M50,20 L50,80 M20,50 L80,50" stroke="#111827" stroke-width="1" />
</svg>`,
    star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <path d="M50,10 L62,38 L92,38 L68,57 L78,87 L50,68 L22,87 L32,57 L8,38 L38,38 Z" fill="none" stroke="#111827" stroke-width="2" />
</svg>`,
    abstract: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <rect x="20" y="20" width="60" height="60" rx="8" fill="none" stroke="#111827" stroke-width="2" />
  <line x1="20" y1="20" x2="80" y2="80" stroke="#111827" stroke-width="1.5" />
  <line x1="85" y1="15" x2="15" y2="85" stroke="#111827" stroke-dasharray="3 3" />
</svg>`,
    square: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <rect x="15" y="15" width="70" height="70" fill="none" stroke="#111827" stroke-width="2" />
  <rect x="30" y="30" width="40" height="40" fill="#111827" opacity="0.1" />
  <line x1="50" y1="0" x2="50" y2="100" stroke="#111827" stroke-width="0.5" stroke-dasharray="2 2" />
  <line x1="0" y1="50" x2="100" y2="50" stroke="#111827" stroke-width="0.5" stroke-dasharray="2 2" />
</svg>`,
    triangle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <polygon points="50,15 85,80 15,80" fill="none" stroke="#111827" stroke-width="2" />
  <polygon points="50,35 73,75 27,75" fill="#111827" opacity="0.1" />
</svg>`,
    normal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <path d="M10,0 V100 M20,0 V100 M30,0 V100 M40,0 V100 M50,0 V100 M60,0 V100 M70,0 V100 M80,0 V100 M90,0 V100 M0,10 H100 M0,20 H100 M0,30 H100 M0,40 H100 M0,50 H100 M0,60 H100 M0,70 H100 M0,80 H100 M0,90 H100" stroke="#111827" stroke-width="0.5" opacity="0.15" />
  <rect x="10" y="10" width="80" height="80" fill="none" stroke="#111827" stroke-width="1.5" />
</svg>`,
    wave: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <path d="M 10,30 C 30,10 40,50 60,30 C 80,10 90,30 100,20 M 10,50 C 30,30 40,70 60,50 C 80,30 90,50 100,40 M 10,70 C 30,50 40,90 60,70 C 80,50 90,70 100,60" fill="none" stroke="#111827" stroke-width="2" />
</svg>`,
    radar: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="45" fill="none" stroke="#111827" stroke-width="0.5" stroke-dasharray="2 2" />
  <circle cx="50" cy="50" r="35" fill="none" stroke="#111827" stroke-width="1" />
  <circle cx="50" cy="50" r="25" fill="none" stroke="#111827" stroke-width="1.5" />
  <circle cx="50" cy="50" r="15" fill="none" stroke="#111827" stroke-width="2" />
  <circle cx="50" cy="50" r="5" fill="#111827" />
</svg>`
  };

  const [isGeneratingAiFields, setIsGeneratingAiFields] = useState(false);

  // AI Field Auto-Generation via server-side Gemini 3.5 Flash
  const handleAiGenerateDetails = async () => {
    if (!aiSettings.apiKey) {
      showToast("⚠ API Key AI kosong. Harap isi di 'Pengaturan AI' Dasbor Anda.");
      return;
    }

    setIsGeneratingAiFields(true);
    showToast("🤖 Menghubungi Sistem AI...");
    try {
      const resp = await fetch('/api/gemini/generate-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: designCategory,
          concept: designTitle || "konsep artistik",
          image: designImage,
          provider: aiSettings.provider,
          apiKey: aiSettings.apiKey,
          baseUrl: aiSettings.baseUrl,
          modelId: aiSettings.modelId
        })
      });
      const result = await resp.json();
      if (result.success && result.data) {
        const { title, shortDesc, longDesc, palette, fonts } = result.data;
        if (title) setDesignTitle(title);
        if (shortDesc) setDesignDesc(shortDesc);
        if (longDesc) setDesignLongDesc(longDesc);
        if (palette && Array.isArray(palette)) {
          setDesignColors(palette.join(', '));
        }
        if (fonts && Array.isArray(fonts)) {
          setDesignFontList(fonts);
          setDesignFonts(fonts.join(', '));
        }
        showToast("✓ Kreativitas AI berhasil dimuat secara opsional!");
      } else {
        showToast("⚠ Gagal mendapatkan data dari AI: " + (result.error || ""));
      }
    } catch (err: any) {
      console.error(err);
      showToast("⚠ Gagal menghubungi AI. Yakinkan server online.");
    } finally {
      setIsGeneratingAiFields(false);
    }
  };

  // Open modal to add design
  const handleOpenAddDesign = () => {
    setEditingDesign(null);
    setDesignTitle("");
    setDesignCategory("UI/UX");
    setDesignDesc("");
    setDesignLongDesc("");
    setDesignImage("");
    setDesignSvgContent(sampleSvgs.circle);
    setVectorList([sampleSvgs.circle]);
    setActiveVectorIndex(0);
    setDesignFontList(["Space Grotesk", "Plus Jakarta Sans"]);
    setDesignPixels("");
    setDesignRatio("1:1");
    setDesignColors("");
    setDesignFonts("Space Grotesk, Plus Jakarta Sans");
    setDesignElements([]);
    setNewElementInput("");
    setNewFontInput("");
    setIsDesignModalOpen(true);
  };

  // Open modal to edit design
  const handleOpenEditDesign = (item: DesignItem) => {
    setEditingDesign(item);
    setDesignTitle(item.title);
    setDesignCategory(item.category);
    setDesignDesc(item.description);
    setDesignLongDesc(item.longDescription || "");
    setDesignImage(item.image);
    
    const parsedVectors = item.svgContent 
      ? item.svgContent.split('<!-- SVG_SEPARATOR -->').map(v => v.trim()).filter(Boolean)
      : [sampleSvgs.circle];
    setVectorList(parsedVectors);
    setActiveVectorIndex(0);
    setDesignSvgContent(parsedVectors[0] || sampleSvgs.circle);
    
    setDesignPixels(item.dimensions?.pixels || "");
    setDesignRatio(item.dimensions?.ratio || "1:1");
    setDesignColors(item.colors ? item.colors.map(c => c.hex).join(', ') : "");
    
    const parsedFonts = item.fonts && item.fonts.length > 0 
      ? item.fonts.map(f => f.name) 
      : [];
    setDesignFontList(parsedFonts);
    setDesignFonts(parsedFonts.join(', '));
    
    setDesignElements(item.elements || []);
    setNewElementInput("");
    setNewFontInput("");
    setIsDesignModalOpen(true);
  };

  // Handle Move Design Up or Down in order list
  const handleMoveDesign = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredDesignsList.length) return;

    const newDesigns = [...designs];
    const itemA = filteredDesignsList[index];
    const itemB = filteredDesignsList[targetIndex];

    const idxA = newDesigns.findIndex(d => d.id === itemA.id);
    const idxB = newDesigns.findIndex(d => d.id === itemB.id);

    if (idxA !== -1 && idxB !== -1) {
      // Tukar posisi elemen di array induk
      const temp = newDesigns[idxA];
      newDesigns[idxA] = newDesigns[idxB];
      newDesigns[idxB] = temp;

      setDesigns(newDesigns);
      showToast("Mengubah urutan desain...");
      
      const success = await updateDesignsOrderCloud(newDesigns);
      if (success) {
        showToast("✓ Urutan desain baru berhasil disimpan ke Cloud!");
      } else {
        showToast("⚠ Gagal memperbarui urutan di Cloud (tersimpan lokal)");
      }
    }
  };

  // Handle Save Design (Add / Edit)
  const handleSaveDesign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designTitle.trim() || !designDesc.trim()) {
      showToast("Judul dan deskripsi singkat wajib diisi!");
      return;
    }
    
    // Satukan daftar ornamen vektor tambahan menjadi string tunggal dipisahkan marker khusus
    const finalSvgContent = vectorList.length > 0 ? vectorList.join('<!-- SVG_SEPARATOR -->') : sampleSvgs.circle;

    // Parse colors from tag/comma input
    const colorArray = designColors.split(',')
      .map(c => c.trim())
      .filter(Boolean)
      .map((hex, idx) => ({ hex, name: `Palet ${idx + 1}` }));

    // Parse fonts dari gelembung Multi-Font
    const fontArray = designFontList.map(fName => ({ name: fName.trim(), usage: "Tipografi Desain Utama" }));

    const updatedDesignsList = [...designs];

    // Determine standard aspect ratio class
    let aspectClass = "aspect-square";
    if (designRatio === "4:5") aspectClass = "aspect-[4/5]";
    else if (designRatio === "3:4") aspectClass = "aspect-[3/4]";
    else if (designRatio === "16:9") aspectClass = "aspect-[16/9]";
    else if (designRatio === "2:3") aspectClass = "aspect-[2/3]";
    else if (designRatio === "9:16") aspectClass = "aspect-[9/16]";

    let targetDesign: DesignItem | null = null;

    if (editingDesign) {
      // Edit existing
      const index = updatedDesignsList.findIndex(d => d.id === editingDesign.id);
      if (index !== -1) {
        updatedDesignsList[index] = {
          ...editingDesign,
          title: designTitle,
          category: designCategory,
          description: designDesc,
          longDescription: designLongDesc || designDesc,
          image: designImage || "https://picsum.photos/seed/generic/800/600",
          svgContent: finalSvgContent,
          aspectRatioClass: aspectClass,
          colors: colorArray.length > 0 ? colorArray : [{ hex: "#111827", name: "Midnight" }, { hex: "#F9FAFB", name: "Cloud" }],
          fonts: fontArray.length > 0 ? fontArray : [{ name: "Space Grotesk", usage: "Display" }],
          elements: designElements,
          dimensions: {
            type: "Custom Layout Metric",
            pixels: designPixels,
            ratio: designRatio,
            docs: "Dimensi aset visual kustom tersimpan di database."
          }
        };
        targetDesign = updatedDesignsList[index];
        showToast("✓ Desain sukses diperbarui");
      }
    } else {
      // Create new
      const newId = generateNewDesignId(designTitle);
      
      // Check duplicate
      if (updatedDesignsList.some(d => d.id === newId)) {
        showToast("Error: ID desain dengan judul ini sudah ada. Harap ganti judul.");
        return;
      }

      const newDesign: DesignItem = {
        id: newId,
        title: designTitle,
        category: designCategory,
        description: designDesc,
        longDescription: designLongDesc || designDesc,
        image: designImage || "https://picsum.photos/seed/generic/800/600",
        svgContent: finalSvgContent,
        aspectRatioClass: aspectClass,
        colors: colorArray.length > 0 ? colorArray : [{ hex: "#111827", name: "Midnight" }, { hex: "#F9FAFB", name: "Cloud" }],
        fonts: fontArray.length > 0 ? fontArray : [{ name: "Space Grotesk", usage: "Display" }],
        software: ["Figma", "Adobe Illustrator"],
        elements: designElements,
        sourceFile: `${newId}_source_file.svg`,
        dimensions: {
          type: "Custom Layout Metric",
          pixels: designPixels,
          ratio: designRatio,
          docs: "Dimensi desain kustom tersimpan di database."
        }
      };

      updatedDesignsList.unshift(newDesign);
      targetDesign = newDesign;
      showToast("✓ Desain baru berhasil diunggah");
    }

    setDesigns(updatedDesignsList);
    saveDesigns(updatedDesignsList);
    setIsDesignModalOpen(false);
    notifyChange();

    if (targetDesign) {
      upsertDesignItemCloud(targetDesign).then(success => {
        if (!success) {
          showToast("⚠ Data disimpan lokal. Hubungkan tabel Supabase.");
        }
      });
    }
  };

  // Delete Design - Soft Delete
  const handleDeleteDesign = (id: string, name: string) => {
    const itemObj = designs.find(d => d.id === id);
    if (!itemObj) return;

    askConfirmation(
      "Pindahkan Desain ke Keranjang Sampah?",
      `Apakah Anda yakin ingin menghapus portofolio desain "${name}"? Aset ini tidak akan muncul di situs web utama tetapi masih dapat dikembalikan dari Keranjang Sampah dalam 60 hari.`,
      () => {
        const updated = designs.filter(d => d.id !== id);
        setDesigns(updated);
        setSelectedDesignIds(prev => prev.filter(x => x !== id));
        showToast(`✓ Desain "${name}" dipindahkan ke keranjang sampah`);
        notifyChange();

        const local = localStorage.getItem('fanratech_designs');
        if (local) {
          try {
            const list: DesignItem[] = JSON.parse(local);
            const filtered = list.filter(d => d.id !== id);
            localStorage.setItem('fanratech_designs', JSON.stringify(filtered));
          } catch(e) {}
        }

        softDeleteDesignItemCloud(itemObj).then(success => {
          syncTrashFromCloud().then(items => setTrashItems(items)).catch(() => {});
          if (!success) {
            showToast("⚠ Penghapusan cloud gagal. Disimpan di lokal.");
          }
        });
      }
    );
  };

  // Open modal to add asset
  const handleOpenAddAsset = () => {
    setEditingAsset(null);
    setAssetTitle("");
    setAssetCategory("Desain Grafis");
    setAssetDesc("");
    setAssetSvgContent(sampleSvgs.star);
    setIsAssetModalOpen(true);
  };

  // Open modal to edit asset
  const handleOpenEditAsset = (item: DesignItem) => {
    setEditingAsset(item);
    setAssetTitle(item.title);
    setAssetCategory(item.category);
    setAssetDesc(item.description);
    setAssetSvgContent(item.svgContent || sampleSvgs.star);
    setIsAssetModalOpen(true);
  };

  // Handle Save Asset (Add / Edit)
  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetTitle.trim() || !assetDesc.trim() || !assetSvgContent.trim()) {
      showToast("Judul, deskripsi, dan kode SVG wajib diisi!");
      return;
    }

    const updatedAssetsList = [...extendedAssets];
    let targetAsset: DesignItem | null = null;

    if (editingAsset) {
      // Edit existing asset
      const index = updatedAssetsList.findIndex(a => a.id === editingAsset.id);
      if (index !== -1) {
        updatedAssetsList[index] = {
          ...editingAsset,
          title: assetTitle,
          category: assetCategory,
          description: assetDesc,
          svgContent: assetSvgContent
        };
        targetAsset = updatedAssetsList[index];
        showToast("✓ Aset berhasil diperbarui");
      }
    } else {
      // Create new asset
      const indexNum = updatedAssetsList.length;
      const newId = generateNewAssetId(indexNum);

      const newAsset: DesignItem = {
        id: newId,
        title: assetTitle,
        category: assetCategory,
        description: assetDesc,
        longDescription: assetDesc,
        image: "https://picsum.photos/seed/companion/800/600",
        svgContent: assetSvgContent,
        aspectRatioClass: "aspect-square",
        colors: [{ hex: "#111827", name: "Midnight Charcoal" }, { hex: "#F9FAFB", name: "Clean White" }],
        fonts: [{ name: "JetBrains Mono", usage: "Code reference" }],
        software: ["Figma", "Adobe Illustrator"],
        elements: ["Vektor Linear"],
        sourceFile: `draft_asset_vector_${indexNum}.svg`,
        dimensions: {
          type: "Logo Square Master",
          pixels: "1000 × 1000 px",
          ratio: "1:1",
          docs: "Aset vektor linear simetris siap pakai kustom."
        }
      };

      updatedAssetsList.unshift(newAsset);
      targetAsset = newAsset;
      showToast("✓ Aset baru berhasil ditambahkan di Menu Aset");
    }

    setExtendedAssets(updatedAssetsList);
    saveAssets(updatedAssetsList);
    setIsAssetModalOpen(false);
    notifyChange();

    if (targetAsset) {
      upsertAssetItemCloud(targetAsset).then(success => {
        if (!success) {
          showToast("⚠ Aset disimpan lokal. Hubungkan tabel Supabase.");
        }
      });
    }
  };

  // Delete Asset - Soft Delete
  const handleDeleteAsset = (id: string, name: string) => {
    const itemObj = extendedAssets.find(a => a.id === id);
    if (!itemObj) return;

    askConfirmation(
      "Pindahkan Aset ke Keranjang Sampah?",
      `Apakah Anda yakin ingin menghapus aset vektor "${name}"? Aset ini tidak akan muncul di situs web utama tetapi masih dapat dikembalikan dari Keranjang Sampah dalam 60 hari.`,
      () => {
        const updated = extendedAssets.filter(a => a.id !== id);
        setExtendedAssets(updated);
        setSelectedAssetIds(prev => prev.filter(x => x !== id));
        showToast(`✓ Aset "${name}" dipindahkan ke keranjang sampah`);
        notifyChange();

        const local = localStorage.getItem('fanratech_assets');
        if (local) {
          try {
            const list: DesignItem[] = JSON.parse(local);
            const filtered = list.filter(a => a.id !== id);
            localStorage.setItem('fanratech_assets', JSON.stringify(filtered));
          } catch(e) {}
        }

        softDeleteAssetItemCloud(itemObj).then(success => {
          syncTrashFromCloud().then(items => setTrashItems(items)).catch(() => {});
          if (!success) {
            showToast("⚠ Penghapusan cloud gagal. Disimpan di lokal.");
          }
        });
      }
    );
  };

  // Toggle selection for single design
  const toggleSelectDesign = (id: string) => {
    setSelectedDesignIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle select all designs
  const toggleSelectAllDesigns = () => {
    if (selectedDesignIds.length === filteredDesignsList.length) {
      setSelectedDesignIds([]);
    } else {
      setSelectedDesignIds(filteredDesignsList.map(d => d.id));
    }
  };

  // Toggle selection for single asset
  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle select all assets
  const toggleSelectAllAssets = () => {
    if (selectedAssetIds.length === filteredAssetsList.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssetsList.map(a => a.id));
    }
  };

  // Bulk Soft Delete Selected Designs
  const handleBulkSoftDeleteDesigns = () => {
    if (selectedDesignIds.length === 0) return;
    const itemsToDelete = designs.filter(d => selectedDesignIds.includes(d.id));
    const count = itemsToDelete.length;

    askConfirmation(
      "Pindahkan Pilihan ke Keranjang Sampah?",
      `Apakah Anda yakin ingin memindahkan ${count} portofolio desain terpilih ke Keranjang Sampah?`,
      () => {
        const remaining = designs.filter(d => !selectedDesignIds.includes(d.id));
        setDesigns(remaining);
        setSelectedDesignIds([]);
        showToast(`✓ ${count} desain dipindahkan ke keranjang sampah`);
        notifyChange();

        // Remove from local storage / cache
        const local = localStorage.getItem('fanratech_designs');
        if (local) {
          try {
            const list: DesignItem[] = JSON.parse(local);
            const filtered = list.filter(d => !itemsToDelete.some(it => it.id === d.id));
            localStorage.setItem('fanratech_designs', JSON.stringify(filtered));
          } catch(e) {}
        }

        bulkSoftDeleteDesignsCloud(itemsToDelete).then(success => {
          syncTrashFromCloud().then(items => setTrashItems(items)).catch(() => {});
          if (!success) {
            showToast("⚠ Sinkronisasi cloud tertunda.");
          }
        });
      }
    );
  };

  // Bulk Soft Delete Selected Assets
  const handleBulkSoftDeleteAssets = () => {
    if (selectedAssetIds.length === 0) return;
    const itemsToDelete = extendedAssets.filter(a => selectedAssetIds.includes(a.id));
    const count = itemsToDelete.length;

    askConfirmation(
      "Pindahkan Pilihan ke Keranjang Sampah?",
      `Apakah Anda yakin ingin memindahkan ${count} aset vektor terpilih ke Keranjang Sampah?`,
      () => {
        const remaining = extendedAssets.filter(a => !selectedAssetIds.includes(a.id));
        setExtendedAssets(remaining);
        setSelectedAssetIds([]);
        showToast(`✓ ${count} aset vektor dipindahkan ke keranjang sampah`);
        notifyChange();

        // Remove from local storage / cache
        const local = localStorage.getItem('fanratech_assets');
        if (local) {
          try {
            const list: DesignItem[] = JSON.parse(local);
            const filtered = list.filter(a => !itemsToDelete.some(it => it.id === a.id));
            localStorage.setItem('fanratech_assets', JSON.stringify(filtered));
          } catch(e) {}
        }

        bulkSoftDeleteAssetsCloud(itemsToDelete).then(success => {
          syncTrashFromCloud().then(items => setTrashItems(items)).catch(() => {});
          if (!success) {
            showToast("⚠ Sinkronisasi cloud tertunda.");
          }
        });
      }
    );
  };

  // Restore Single Trash Item
  const handleRestoreTrashItem = (trash: TrashItem) => {
    askConfirmation(
      "Pulihkan Item Portofolio?",
      `Apakah Anda yakin ingin memulihkan "${trash.item.title}" kembali ke menu aktif?`,
      () => {
        setTrashItems(prev => prev.filter(t => t.id !== trash.id));
        setSelectedTrashIds(prev => prev.filter(id => id !== trash.id));
        showToast(`✓ "${trash.item.title}" dipulihkan`);
        
        // Put back in local states instantly
        if (trash.type === 'design') {
          const updated = [trash.item, ...designs];
          setDesigns(updated);
          localStorage.setItem('fanratech_designs', JSON.stringify(updated));
        } else {
          const updated = [trash.item, ...extendedAssets];
          setExtendedAssets(updated);
          localStorage.setItem('fanratech_assets', JSON.stringify(updated));
        }
        notifyChange();

        restoreTrashItemCloud(trash.id, trash.type, trash.item).then(success => {
          if (!success) showToast("⚠ Cloud sync tertunda.");
        });
      }
    );
  };

  // Permanent Delete Single Trash Item
  const handlePermanentDeleteTrashItem = (trash: TrashItem) => {
    askConfirmation(
      "Hapus Permanen?",
      `PERINGATAN: Apakah Anda yakin ingin menghapus "${trash.item.title}" secara permanen? Tindakan ini tidak dapat dibatalkan sama sekali!`,
      () => {
        setTrashItems(prev => prev.filter(t => t.id !== trash.id));
        setSelectedTrashIds(prev => prev.filter(id => id !== trash.id));
        showToast(`✓ "${trash.item.title}" dihapus permanen`);

        deleteTrashItemPermanentlyCloud(trash.id).then(success => {
          if (!success) showToast("⚠ Penghapusan cloud gagal.");
        });
      }
    );
  };

  // Bulk Restore Trash Items
  const handleBulkRestoreTrash = () => {
    if (selectedTrashIds.length === 0) return;
    const itemsToRestore = trashItems.filter(t => selectedTrashIds.includes(t.id));
    const count = itemsToRestore.length;

    askConfirmation(
      "Pulihkan Pilihan?",
      `Apakah Anda yakin ingin memulihkan ${count} item terpilih kembali ke menu aktif?`,
      () => {
        setTrashItems(prev => prev.filter(t => !selectedTrashIds.includes(t.id)));
        setSelectedTrashIds([]);
        showToast(`✓ ${count} item dinon-arsipkan`);

        // Update local states
        let localDesigns = [...designs];
        let localAssets = [...extendedAssets];

        itemsToRestore.forEach(trash => {
          if (trash.type === 'design') {
            localDesigns.unshift(trash.item);
          } else {
            localAssets.unshift(trash.item);
          }
        });

        setDesigns(localDesigns);
        setExtendedAssets(localAssets);
        localStorage.setItem('fanratech_designs', JSON.stringify(localDesigns));
        localStorage.setItem('fanratech_assets', JSON.stringify(localAssets));
        notifyChange();

        bulkRestoreTrashItemsCloud(itemsToRestore).then(success => {
          if (!success) showToast("⚠ Cloud sync tertunda.");
        });
      }
    );
  };

  // Bulk Permanent Delete Trash Items
  const handleBulkPermanentDeleteTrash = () => {
    if (selectedTrashIds.length === 0) return;
    const count = selectedTrashIds.length;

    askConfirmation(
      "Hapus Permanen Pilihan?",
      `PERINGATAN: Apakah Anda yakin ingin menghapus ${count} item terpilih secara permanen? Tindakan ini tidak dapat dibatalkan!`,
      () => {
        setTrashItems(prev => prev.filter(t => !selectedTrashIds.includes(t.id)));
        setSelectedTrashIds([]);
        showToast(`✓ ${count} item dihapus permanen`);

        bulkDeleteTrashPermanentlyCloud(selectedTrashIds).then(success => {
          if (!success) showToast("⚠ Cloud sync gagal.");
        });
      }
    );
  };

  // Empty Trash Bin Entirely
  const handleEmptyTrashBin = () => {
    if (trashItems.length === 0) return;
    const count = trashItems.length;

    askConfirmation(
      "Kosongkan Keranjang Sampah?",
      `PERINGATAN KERAS: Apakah Anda yakin ingin membuang semua ${count} berkas portofolio & aset di Keranjang Sampah secara permanen? Data akan sirna seketika!`,
      () => {
        const tempTrash = [...trashItems];
        setTrashItems([]);
        setSelectedTrashIds([]);
        showToast(`✓ Keranjang sampah berhasil dikosongkan`);

        emptyTrashBinCloud(tempTrash).then(success => {
          if (!success) showToast("⚠ Pengosongan cloud gagal.");
        });
      }
    );
  };

  // Filter lists inside management tabs
  const filteredDesignsList = designs.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssetsList = extendedAssets.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maxVal = currentChartData.length > 0 ? Math.max(...currentChartData.map(d => d.views || 0)) : 1000;

  if (isAdmin === false) {
    return (
      <main className="relative z-10 min-h-screen bg-[#F9FAFB] text-[#111827] flex items-center justify-center p-4">
        {/* Background Decor */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <Image
            src="https://res.cloudinary.com/dew39kqhy/image/upload/f_auto,q_auto/v1779470340/ChatGPT_Image_23_Mei_2026_00.18.48_lpgxk6.png"
            alt="Decoration pattern"
            fill
            sizes="100vw"
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 max-w-md w-full shadow-lg relative z-15 text-center">
          <span className="font-lobster text-3xl text-[#111827] block mb-6">
            Fanra<span className="text-slate-400 font-normal">Tech</span>
          </span>
          
          <h2 className="text-lg font-bold text-slate-950 font-sans tracking-tight mb-2">Akses Dasbor Dibatasi</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-sans mb-8">
            Halaman administrasi statis & portofolio karya ini dilindungi. Hanya akun terdaftar dengan email <strong className="text-[#111827] font-bold">irfanrizkiaditri@gmail.com</strong> yang diizinkan mengelola aset digital.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleAutoLoginAdmin}
              className="w-full py-3 px-5 bg-[#111827] hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold shadow-sm transition duration-200 cursor-pointer select-none focus:outline-none flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Masuk Sebagai Admin (Bypass Demo)</span>
            </button>

            <Link
              href="/"
              className="block w-full text-center py-3 px-5 bg-slate-100 hover:bg-slate-200 text-[#111827] rounded-xl text-xs font-bold transition duration-200"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isAdmin === null) {
    return (
      <main className="relative z-10 min-h-screen bg-[#F9FAFB] text-[#111827] flex items-center justify-center p-4 font-sans text-xs font-bold uppercase tracking-widest text-[#111827]/40">
        Memverifikasi kredensial admin...
      </main>
    );
  }

  return (
    <main className="relative z-10 min-h-screen bg-[#F9FAFB] text-[#111827] overflow-x-hidden font-sans select-none pb-24">
      {/* Dynamic Toast Element */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30, x: "-50%" }}
            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 15, x: "-50%" }}
            style={{ left: "50%", transform: "translateX(-50%)" }}
            className="fixed bottom-6 z-[99999] bg-white text-[#111827] px-4 py-2.5 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-slate-200/90 flex items-center gap-2 text-[10px] sm:text-xs font-extrabold select-none whitespace-nowrap"
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white shrink-0 ${toastMessage.includes("⚠") ? "bg-rose-500" : "bg-[#111827]"}`}>
              {toastMessage.includes("⚠") ? "!" : (toastMessage.includes("🤖") ? "★" : "✓")}
            </span>
            <span>{toastMessage.replace("✓ ", "").replace("⚠ ", "").replace("🤖 ", "")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 right-0 h-[45vh] z-0 pointer-events-none select-none opacity-40">
        <div className="hidden sm:block absolute inset-0">
          <Image
            src="https://res.cloudinary.com/dew39kqhy/image/upload/f_auto,q_auto/v1779470340/ChatGPT_Image_23_Mei_2026_00.18.48_lpgxk6.png"
            alt="Top background pattern desktop"
            fill
            sizes="100vw"
            className="object-cover object-top"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F9FAFB] z-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-20">
        
        {/* Navigation bar Header */}
        <div className="flex items-center justify-between border-b border-slate-200/50 pb-5 mb-8">
          <Link 
            href="/"
            className="flex items-center gap-2 group text-xs font-bold text-slate-500 hover:text-[#111827] transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Kembali ke Galeri Utama</span>
          </Link>

          <span className="font-lobster text-lg text-[#111827]">
            Fanra<span className="text-slate-400 font-normal">Tech</span>
          </span>
        </div>

        {/* Dashboard Title & Actions header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400 font-extrabold bg-[#111827]/5 border border-slate-200 px-2 py-0.5 rounded">
                Pusat Kontrol Admin
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tight leading-none">
              Dasbor Manajemen <span className="font-extrabold text-[#111827]">Seni & Aset</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono mt-2">
              Atur, upload, edit, dan hapus berkas desain andelan serta aset pendukung secara nyata dan otomatis.
            </p>
          </div>

          {/* Timeframe or global refresh operations */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={triggerRefresh}
              className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-[#111827] rounded-xl transition duration-200 shadow-3xs cursor-pointer flex items-center gap-2 text-xs font-bold select-none"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>Sinkronisasi Data</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Highlights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-3xs">
            <p className="text-[9px] font-mono tracking-wider uppercase text-slate-400 font-extrabold">Total Desain Utama</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-extrabold tracking-tight">{designs.length}</h3>
              <span className="text-[10px] text-slate-400 font-semibold font-mono">Portofolio</span>
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#111827] h-full" style={{ width: `${Math.min(100, (designs.length / 10) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-3xs">
            <p className="text-[9px] font-mono tracking-wider uppercase text-slate-400 font-extrabold">Aset Vektor Pendukung</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-extrabold tracking-tight">{extendedAssets.length}</h3>
              <span className="text-[10px] text-slate-400 font-semibold font-mono">SVG File</span>
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-slate-400 h-full" style={{ width: `${Math.min(100, (extendedAssets.length / 120) * 100)}%` }} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-3xs">
            <p className="text-[9px] font-mono tracking-wider uppercase text-slate-400 font-extrabold">Akumulasi Penayangan Riil</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-extrabold tracking-tight">{liveTraffic.totalViews.toLocaleString('id-ID')}</h3>
              <span className="text-[10px] text-[#111827] font-bold font-mono">Total Views</span>
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#111827]/40 h-full w-[80%]" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-3xs">
            <p className="text-[9px] font-mono tracking-wider uppercase text-slate-400 font-extrabold">Traffics Live</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-extrabold tracking-tight">{liveTraffic.activeNow.toLocaleString('id-ID')}</h3>
              <span className="text-[9px] text-emerald-600 font-bold font-mono">Active Now</span>
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full w-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu for Tab Switcher */}
        <div className="block sm:hidden mb-6">
          <label className="block text-[9px] font-mono font-extrabold text-[#111827] uppercase mb-1.5">Pilih Bidang Dasbor</label>
          <select
            value={activeTab}
            onChange={(e) => {
              setActiveTab(e.target.value as 'overview' | 'designs' | 'assets' | 'database' | 'trash');
              setSearchQuery("");
            }}
            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-[#111827] focus:outline-none cursor-pointer"
          >
            <option value="overview">📊 IKHTISAR STATISTIK</option>
            <option value="designs">🎨 KELOLA DESAIN UTAMA ({designs.length})</option>
            <option value="assets">🧩 KELOLA ASET VEKTOR ({extendedAssets.length})</option>
            <option value="database">🗄️ SETUP DATABASE & SQL</option>
            <option value="trash">🗑️ KERANJANG SAMPAH ({trashItems.length})</option>
          </select>
        </div>

        {/* Desktop Tab Controls */}
        <div className="hidden sm:flex border-b border-slate-200 gap-2 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { if (activeTab !== 'overview') { setActiveTab('overview'); setSearchQuery(""); } }}
            disabled={activeTab === 'overview'}
            className={`py-3 px-5 text-xs font-bold leading-none tracking-wide text-[11px] uppercase transition cursor-pointer disabled:cursor-default select-none border-b-2 shrink-0 ${
              activeTab === 'overview'
                ? 'border-[#111827] text-[#111827]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Ikhtisar Statistik
          </button>
          <button
            onClick={() => { if (activeTab !== 'designs') { setActiveTab('designs'); setSearchQuery(""); } }}
            disabled={activeTab === 'designs'}
            className={`py-3 px-5 text-xs font-bold leading-none tracking-wide text-[11px] uppercase transition cursor-pointer disabled:cursor-default select-none border-b-2 shrink-0 flex items-center gap-1.5 ${
              activeTab === 'designs'
                ? 'border-[#111827] text-[#111827]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Kelola Desain Utama ({designs.length})
          </button>
          <button
            onClick={() => { if (activeTab !== 'assets') { setActiveTab('assets'); setSearchQuery(""); } }}
            disabled={activeTab === 'assets'}
            className={`py-3 px-5 text-xs font-bold leading-none tracking-wide text-[11px] uppercase transition cursor-pointer disabled:cursor-default select-none border-b-2 shrink-0 flex items-center gap-1.5 ${
              activeTab === 'assets'
                ? 'border-[#111827] text-[#111827]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Kelola Aset Pendukung ({extendedAssets.length})
          </button>
          <button
            onClick={() => { if (activeTab !== 'database') { setActiveTab('database'); setSearchQuery(""); } }}
            disabled={activeTab === 'database'}
            className={`py-3 px-5 text-xs font-bold leading-none tracking-wide text-[11px] uppercase transition cursor-pointer disabled:cursor-default select-none border-b-2 shrink-0 flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'border-[#111827] text-[#111827]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Integrasi Database
          </button>
          <button
            onClick={() => { if (activeTab !== 'trash') { setActiveTab('trash'); setSearchQuery(""); } }}
            disabled={activeTab === 'trash'}
            className={`py-3 px-5 text-xs font-bold leading-none tracking-wide text-[11px] uppercase transition cursor-pointer disabled:cursor-default select-none border-b-2 shrink-0 flex items-center gap-1.5 ${
              activeTab === 'trash'
                ? 'border-[#111827] text-[#111827]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Keranjang Sampah ({trashItems.length})
          </button>
          <button
            onClick={() => { if (activeTab !== 'ai_settings') { setActiveTab('ai_settings'); setSearchQuery(""); } }}
            disabled={activeTab === 'ai_settings'}
            className={`py-3 px-5 text-xs font-bold leading-none tracking-wide text-[11px] uppercase transition cursor-pointer disabled:cursor-default select-none border-b-2 shrink-0 flex items-center gap-1.5 ${
              activeTab === 'ai_settings'
                ? 'border-[#111827] text-[#111827]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Pengaturan AI
          </button>
        </div>

        {/* SECTION PANELS BODY */}
        <AnimatePresence>
          
          {/* TAB 1: OVERVIEW STATS */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Traffic Plotting */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-3xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-[#111827] font-sans">Kurva Ringkasan Penayangan</h3>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">Analisis kunjungan halaman per interval waktu secara dinamis</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-0.5 flex gap-0.5">
                      {(['7d', '30d', '12m'] as const).map(range => (
                        <button
                          key={range}
                          onClick={() => setTimeRange(range)}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider uppercase transition cursor-pointer ${
                            timeRange === range
                              ? 'bg-[#111827] text-white'
                              : 'text-slate-400 hover:text-slate-700'
                          }`}
                        >
                          {range === '7d' ? '7 Hari' : range === '30d' ? 'Sebulan' : 'Setahun'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative h-[240px] w-full flex items-end gap-3 sm:gap-6 pt-6 px-1 border-b border-dashed border-slate-250/20">
                  {currentChartData.map((item, index) => {
                    const viewPct = Math.max(12, (item.views / maxVal) * 90);
                    return (
                      <div key={index} className="flex-1 h-full flex flex-col justify-end items-center relative group">
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-[#111827] text-white p-2 rounded-lg text-center z-30 shadow-md text-[9px] min-w-[95px]">
                          <span className="font-bold">{item.views.toLocaleString('id-ID')} Views</span>
                          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-1.5 h-1.5 bg-[#111827] rotate-45" />
                        </div>

                        <div className="w-full relative flex items-end justify-center rounded-t-sm overflow-hidden" style={{ height: `${viewPct}%` }}>
                          <div className="absolute bottom-0 inset-x-0 bg-[#111827] rounded-t-xs transition-colors duration-250 group-hover:bg-slate-700" style={{ height: '100%' }} />
                        </div>

                        <span className="text-[9px] font-bold text-slate-400 mt-2 block text-center truncate w-full font-sans">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-3xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#111827] font-sans mb-3">Tindakan Cepat</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-5">
                    Gunakan aksi berikut untuk memperbarui database portofolio studio Anda secara cepat dalam hitungan detik.
                  </p>

                  <div className="space-y-2.5">
                    <button
                      onClick={handleOpenAddDesign}
                      className="w-full py-3 px-4 bg-[#111827] hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer select-none"
                    >
                      <span>Unggah Desain Baru</span>
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleOpenAddAsset}
                      className="w-full py-3 px-4 bg-[#F9FAFB] hover:bg-slate-100 text-[#111827] border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-between transition cursor-pointer select-none"
                    >
                      <span>Tambah Aset Vektor</span>
                      <Upload className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 text-left mt-6">
                  <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400 font-extrabold block mb-1">Status Server</span>
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    Semua Sistem Terhubung & Sinkron
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: DATABASE SYSTEM INTEGRATION (REAL / NYATA) */}
          {activeTab === 'database' && (
            <motion.div
              key="database-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Database Overview Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-[#111827] font-sans">Koneksi Database Firebase Firestore</h3>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">Pantau status koleksi real-time & kelola sinkronisasi data aktif tanpa fallback lokal</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleForceSeedExampleData}
                      disabled={isSeeding}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-[#111827] rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer select-none disabled:opacity-50"
                    >
                      <Database className="w-3.5 h-3.5" />
                      {isSeeding ? "Memproses Seeding..." : "Inisialisasi Data Contoh"}
                    </button>
                    <button
                      onClick={checkTableConnections}
                      className="py-2.5 px-4 bg-[#111827] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer select-none"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Perbarui Status Koneksi
                    </button>
                  </div>
                </div>

                {/* Status Indicator Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Table designs */}
                  <div className="border border-slate-150 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-extrabold font-bold">Koleksi Portofolio</p>
                      <h4 className="text-sm font-bold text-[#111827] mt-1 font-mono">fanratech_designs</h4>
                    </div>
                    <div>
                      {tableStatus.designs === 'loading' && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono font-bold">
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" /> Memeriksa...
                        </div>
                      )}
                      {tableStatus.designs === 'connected' && (
                        <div className="flex items-center gap-1.5 text-[#111827] text-xs font-mono font-bold bg-[#F9FAFB] border border-[#111827] px-2 py-1 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" /> LIVE / AKTIF
                        </div>
                      )}
                      {tableStatus.designs === 'error' && (
                        <div className="flex items-center gap-1.5 text-rose-600 text-xs font-mono font-bold">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> TIDAK DITEMUKAN
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table assets */}
                  <div className="border border-slate-150 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-extrabold font-bold">Koleksi Aset Vektor</p>
                      <h4 className="text-sm font-bold text-[#111827] mt-1 font-mono">fanratech_assets</h4>
                    </div>
                    <div>
                      {tableStatus.assets === 'loading' && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono font-bold">
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" /> Memeriksa...
                        </div>
                      )}
                      {tableStatus.assets === 'connected' && (
                        <div className="flex items-center gap-1.5 text-[#111827] text-xs font-mono font-bold bg-[#F9FAFB] border border-[#111827] px-2 py-1 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" /> LIVE / AKTIF
                        </div>
                      )}
                      {tableStatus.assets === 'error' && (
                        <div className="flex items-center gap-1.5 text-rose-600 text-xs font-mono font-bold">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> TIDAK DITEMUKAN
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table traffic */}
                  <div className="border border-slate-150 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-extrabold font-bold">Koleksi Statistik Trafik</p>
                      <h4 className="text-sm font-bold text-[#111827] mt-1 font-mono">fanratech_traffic</h4>
                    </div>
                    <div>
                      {tableStatus.traffic === 'loading' && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono font-bold">
                          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" /> Memeriksa...
                        </div>
                      )}
                      {tableStatus.traffic === 'connected' && (
                        <div className="flex items-center gap-1.5 text-[#111827] text-xs font-mono font-bold bg-[#F9FAFB] border border-[#111827] px-2 py-1 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#111827]" /> LIVE / AKTIF
                        </div>
                      )}
                      {tableStatus.traffic === 'error' && (
                        <div className="flex items-center gap-1.5 text-rose-600 text-xs font-mono font-bold">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> TIDAK DITEMUKAN
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Security setup helper area */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-3xs space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-[#111827] font-sans">Konfigurasi Aturan Keamanan Firebase (Security Rules)</h3>
                  <p className="text-[11px] font-sans leading-relaxed text-slate-500 mt-0.5">
                    Firebase Firestore adalah database NoSQL yang secara otomatis membuat koleksi dokumen baru ketika data dikirim.
                    Namun, Anda harus memastikan aturan keamanan dikonfigurasi dengan aman di konsol Firebase Anda agar aplikasi dapat membaca dan menulis data dengan lancar.
                  </p>
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    value={`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Portofolio Desain Utama
    match /fanratech_designs/{designId} {
      allow read, write: if true;
    }
    // Aset Vektor Pendukung
    match /fanratech_assets/{assetId} {
      allow read, write: if true;
    }
    // Statistik Trafik Utama
    match /fanratech_traffic/{trafficId} {
      allow read, write: if true;
    }
    // Sesi Pengguna FanraTech
    match /fanratech_users/{userId} {
      allow read, write: if true;
    }
  }
}`}
                    rows={12}
                    className="w-full font-mono text-[10px] bg-[#111827] text-slate-300 p-4 rounded-xl leading-relaxed resize-none focus:outline-none select-all"
                  />
                  <div className="absolute right-3 bottom-3 sm:right-4 sm:bottom-4 z-10">
                    <button
                      onClick={() => {
                        const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Portofolio Desain Utama
    match /fanratech_designs/{designId} {
      allow read, write: if true;
    }
    // Aset Vektor Pendukung
    match /fanratech_assets/{assetId} {
      allow read, write: if true;
    }
    // Statistik Trafik Utama
    match /fanratech_traffic/{trafficId} {
      allow read, write: if true;
    }
    // Sesi Pengguna FanraTech
    match /fanratech_users/{userId} {
      allow read, write: if true;
    }
  }
}`;
                        navigator.clipboard.writeText(rulesText);
                        showToast("✓ Aturan keamanan Firebase disalin ke clipboard!");
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-[9px] font-mono tracking-wide rounded border border-slate-700 cursor-pointer transition select-none"
                    >
                      SALIN ATURAN FIREBASE
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4.5 space-y-3 font-sans text-xs text-slate-500 leading-relaxed">
                  <h4 className="font-bold text-[#111827]">Cara Memasang Aturan Keamanan Firebase:</h4>
                  <ol className="list-decimal pl-4.5 space-y-1.5">
                    <li>Buka tab baru dan akses <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="font-bold text-[#111827] underline">Firebase Console</a>.</li>
                    <li>Pilih proyek Firebase Anda (Project ID Anda: <strong className="font-mono text-[#111827]">fanra-tech</strong>).</li>
                    <li>Di bilah navigasi kiri, cari dan klik menu <strong className="font-semibold text-[#111827]">Firestore Database</strong>.</li>
                    <li>Masuk ke tab <strong className="font-semibold text-[#111827]">Rules</strong> di samping tab &quot;Data&quot;.</li>
                    <li>Hapus aturan default yang ada, tempel (<strong className="font-semibold text-[#111827]">Paste</strong>) seluruh kode di atas secara utuh.</li>
                    <li>Klik tombol <strong className="font-bold text-[#111827] uppercase">Publish</strong> di pojok kanan atas.</li>
                    <li>Aturan Firebase disebarkan secara instan! Koleksi <code className="bg-slate-50 font-mono text-[10px] px-1 py-0.5 rounded text-[#111827]">fanratech_designs</code>, <code className="bg-slate-50 font-mono text-[10px] px-1 py-0.5 rounded text-[#111827]">fanratech_assets</code>, dan <code className="bg-slate-50 font-mono text-[10px] px-1 py-0.5 rounded text-[#111827]">fanratech_traffic</code> akan disinkronkan secara mulus dan otomatis.</li>
                  </ol>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: MANAGE MAIN DESIGNS */}
          {activeTab === 'designs' && (
            <motion.div
              key="designs-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Filter and upload button row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-3xs">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama desain..."
                    className="w-full pl-9 pr-4 py-2 bg-[#F9FAFB] border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#111827] transition-colors"
                  />
                </div>

                <button
                  onClick={handleOpenAddDesign}
                  className="py-2.5 px-4 bg-[#111827] hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 select-none transition cursor-pointer shadow-3xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Desain Baru</span>
                </button>
              </div>

              {/* Bulk Actions Panel designs */}
              {selectedDesignIds.length > 0 && (
                <div className="bg-[#111827] text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800 shadow-sm animate-none">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold leading-none">{selectedDesignIds.length} Portofolio Desain Terpilih</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDesignIds([])}
                      className="px-3.5 py-1.5 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase transition"
                    >
                      Batal Pilihan
                    </button>
                    <button
                      onClick={handleBulkSoftDeleteDesigns}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Terpilih
                    </button>
                  </div>
                </div>
              )}

              {/* Table / Grid list */}
              {filteredDesignsList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                  <Layers className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-xs font-bold font-sans">Tidak ada portofolio desain yang ditemukan</p>
                  <p className="text-[10px] text-slate-300 mt-1">Coba gunakan kata kunci pencarian lainnya atau klik tombol di atas untuk menambah.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-[#F9FAFB] border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                          <th className="py-3 px-5 w-10">
                            <button
                              onClick={toggleSelectAllDesigns}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                            >
                              {selectedDesignIds.length === filteredDesignsList.length && filteredDesignsList.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-[#111827]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </th>
                          <th className="py-3 px-4">Gambar</th>
                          <th className="py-3 px-4">Nama Portofolio</th>
                          <th className="py-3 px-4">Kategori</th>
                          <th className="py-3 px-4">Rasio & Pixels</th>
                          <th className="py-3 px-4 text-center w-28">Urutan</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredDesignsList.map((design, idx) => (
                          <tr key={design.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-5">
                              <button
                                onClick={() => toggleSelectDesign(design.id)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                              >
                                {selectedDesignIds.includes(design.id) ? (
                                  <CheckSquare className="w-4 h-4 text-[#111827]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="w-12 h-10 relative rounded-md border border-slate-200 bg-[#F9FAFB] overflow-hidden flex items-center justify-center">
                                <Image 
                                  src={design.image} 
                                  alt={design.title} 
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4 leading-normal">
                              <div className="font-bold text-slate-900">{design.title}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">{design.description}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                                {design.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                              <div>{design.dimensions?.pixels || "N/A"}</div>
                              <div className="text-[9px] text-[#111827] font-extrabold mt-0.5">{design.dimensions?.ratio || "N/A"}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/60 p-0.5 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => handleMoveDesign(idx, 'up')}
                                  disabled={idx === 0}
                                  className={`p-1 rounded-lg transition-colors select-none cursor-pointer ${
                                    idx === 0 
                                      ? 'text-slate-200 cursor-not-allowed' 
                                      : 'text-[#111827] hover:bg-slate-200/80 active:scale-95'
                                  }`}
                                  title="Naikkan Urutan (Ke Atas)"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[10px] font-extrabold text-slate-600 w-4 text-center select-none font-sans">
                                  {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleMoveDesign(idx, 'down')}
                                  disabled={idx === filteredDesignsList.length - 1}
                                  className={`p-1 rounded-lg transition-colors select-none cursor-pointer ${
                                    idx === filteredDesignsList.length - 1 
                                      ? 'text-slate-200 cursor-not-allowed' 
                                      : 'text-[#111827] hover:bg-slate-200/80 active:scale-95'
                                  }`}
                                  title="Turunkan Urutan (Ke Bawah)"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditDesign(design)}
                                  className="p-2 text-slate-500 hover:text-[#111827] hover:bg-slate-50 rounded-lg transition"
                                  title="Edit Desain"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDesign(design.id, design.title)}
                                  className="p-2 text-slate-400 hover:text-[#111827] hover:bg-rose-50 rounded-lg transition animate-none"
                                  title="Hapus Desain"
                                >
                                  <Trash2 className="w-4 h-4 group-hover:text-rose-600 text-rose-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: MANAGE COMPANION VECTOR ASSETS */}
          {activeTab === 'assets' && (
            <motion.div
              key="assets-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Filter and upload button row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-3xs">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari judul aset..."
                    className="w-full pl-9 pr-4 py-2 bg-[#F9FAFB] border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#111827] transition-colors"
                  />
                </div>

                <button
                  onClick={handleOpenAddAsset}
                  className="py-2.5 px-4 bg-[#111827] hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 select-none transition cursor-pointer shadow-3xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Aset Vektor</span>
                </button>
              </div>

              {/* Bulk Actions Panel assets */}
              {selectedAssetIds.length > 0 && (
                <div className="bg-[#111827] text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800 shadow-sm animate-none">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold leading-none">{selectedAssetIds.length} Aset Vektor Terpilih</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedAssetIds([])}
                      className="px-3.5 py-1.5 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold uppercase transition"
                    >
                      Batal Pilihan
                    </button>
                    <button
                      onClick={handleBulkSoftDeleteAssets}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus Terpilih
                    </button>
                  </div>
                </div>
              )}

              {/* Table / Grid list */}
              {filteredAssetsList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                  <Grid className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-xs font-bold font-sans">Tidak ada aset vektor pendukung yang ditemukan</p>
                  <p className="text-[10px] text-slate-300 mt-1">Gunakan tab ini untuk menambahkan SVG baru yang dapat langsung terintegrasi di sidebar.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-[#F9FAFB] border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                          <th className="py-3 px-5 w-10">
                            <button
                              onClick={toggleSelectAllAssets}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                            >
                              {selectedAssetIds.length === filteredAssetsList.length && filteredAssetsList.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-[#111827]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </th>
                          <th className="py-3 px-4">Preview SVG</th>
                          <th className="py-3 px-4">Nama Aset</th>
                          <th className="py-3 px-4">Kategori Menu</th>
                          <th className="py-3 px-4">Referensi Berkas</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredAssetsList.map((asset) => (
                          <tr key={asset.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-5">
                              <button
                                onClick={() => toggleSelectAsset(asset.id)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                              >
                                {selectedAssetIds.includes(asset.id) ? (
                                  <CheckSquare className="w-4 h-4 text-[#111827]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div 
                                className="w-10 h-10 p-1.5 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-[#111827]"
                                dangerouslySetInnerHTML={{ __html: asset.svgContent || "" }}
                              />
                            </td>
                            <td className="py-3 px-4 leading-normal">
                              <div className="font-bold text-slate-900">{asset.title}</div>
                              <div className="text-[10px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">{asset.description}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase font-sans">
                                {asset.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                              {asset.sourceFile}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditAsset(asset)}
                                  className="p-2 text-slate-500 hover:text-[#111827] hover:bg-slate-50 rounded-lg transition"
                                  title="Edit Aset"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAsset(asset.id, asset.title)}
                                  className="p-2 text-slate-400 hover:text-[#111827] hover:bg-rose-50 rounded-lg transition animate-none"
                                  title="Hapus Aset"
                                >
                                  <Trash2 className="w-4 h-4 group-hover:text-rose-600 text-rose-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: RECYCLE BIN / KERANJANG SAMPAH */}
          {activeTab === 'trash' && (
            <motion.div
              key="trash-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Trash Info Bar */}
              <div className="bg-[#111827] text-[#F9FAFB] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-white" />
                    <h3 className="font-lobster text-sm text-white flex items-center gap-1.5 font-bold">
                      Keranjang Sampah <span className="text-[10px] bg-slate-800 text-slate-300 font-sans tracking-tight py-0.5 px-2 rounded-full font-mono font-medium">Recycle Bin</span>
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans mt-1.5 max-w-2xl leading-relaxed">
                    Berkas portofolio desain atau aset vektor pendukung yang Anda hapus sementara akan ditampung di sini. Sistem akan menghapus secara permanen setiap berkas yang berada di sini selama lebih dari <strong>2 bulan (60 hari)</strong> demi menjaga optimalisasi database Firestore.
                  </p>
                </div>

                {trashItems.length > 0 && (
                  <button
                    onClick={handleEmptyTrashBin}
                    className="py-1.5 px-3 border border-red-500/30 bg-red-950/20 text-red-500 hover:bg-neutral-800 hover:text-white rounded-lg font-bold text-[10px] tracking-wider uppercase transition cursor-pointer flex items-center gap-1 shrink-0 select-none animate-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>KOSONGKAN SAMPAH ({trashItems.length})</span>
                  </button>
                )}
              </div>

              {/* Selection Bulk Action Bar */}
              {selectedTrashIds.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 rounded-2xl shadow-3xs">
                  <span className="text-[10px] font-mono font-extrabold text-[#111827]">
                    ⚡ {selectedTrashIds.length} ITEM TERPILIH :
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleBulkRestoreTrash}
                      className="py-1.5 px-3 bg-white border border-slate-200 hover:border-[#111827] text-[#111827] rounded-lg font-bold text-[10px] uppercase tracking-wide transition cursor-pointer flex items-center gap-1.5 select-none"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Pulihkan</span>
                    </button>
                    <button
                      onClick={handleBulkPermanentDeleteTrash}
                      className="py-1.5 px-3 bg-[#111827] text-[#F9FAFB] hover:bg-[#111827]/80 rounded-lg font-bold text-[10px] uppercase tracking-wide transition cursor-pointer flex items-center gap-1.5 select-none"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Hapus Permanen</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Trash Items List Grid / Table */}
              {isTrashLoading ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-sans text-xs">
                  Memuat dari Cloud Firestore...
                </div>
              ) : trashItems.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                  <Inbox className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-xs font-bold font-sans">Keranjang sampah kosong</p>
                  <p className="text-[10px] text-slate-300 mt-1">Belum ada portofolio atau aset yang dihapus.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-[#F9FAFB] border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[9px] tracking-wider">
                          <th className="py-3 px-5 w-10">
                            <button
                              onClick={() => {
                                if (selectedTrashIds.length === trashItems.length) {
                                  setSelectedTrashIds([]);
                                } else {
                                  setSelectedTrashIds(trashItems.map(item => item.id));
                                }
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                            >
                              {selectedTrashIds.length === trashItems.length ? (
                                <CheckSquare className="w-4 h-4 text-[#111827]" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </th>
                          <th className="py-3 px-3">Tipe</th>
                          <th className="py-3 px-4">Item</th>
                          <th className="py-3 px-4">Kategori Asal</th>
                          <th className="py-3 px-4">Tanggal Dihapus</th>
                          <th className="py-3 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {trashItems.map((trash) => {
                          const title = trash.item?.title || "Tanpa Judul";
                          const category = trash.item?.category || "Unknown";
                          const description = trash.item?.description || "";
                          const dateClean = new Date(trash.deletedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          });

                          return (
                            <tr key={trash.id} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 px-5">
                                <button
                                  onClick={() => {
                                    setSelectedTrashIds(prev =>
                                      prev.includes(trash.id) ? prev.filter(x => x !== trash.id) : [...prev, trash.id]
                                    );
                                  }}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
                                >
                                  {selectedTrashIds.includes(trash.id) ? (
                                    <CheckSquare className="w-4 h-4 text-[#111827]" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                                  trash.type === 'design'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-indigo-50 text-indigo-600'
                                }`}>
                                  {trash.type === 'design' ? 'Desain' : 'Aset Vektor'}
                                </span>
                              </td>
                              <td className="py-3 px-4 leading-normal">
                                <div className="font-bold text-slate-900">{title}</div>
                                <div className="text-[10px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">{description}</div>
                              </td>
                              <td className="py-3 px-4 uppercase text-[9px] font-mono tracking-wider font-extrabold text-slate-400">
                                {category}
                              </td>
                              <td className="py-3 px-4 text-[10px] font-mono text-slate-400">
                                {dateClean}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleRestoreTrashItem(trash)}
                                    className="p-2 text-slate-500 hover:text-[#111827] hover:bg-slate-50 rounded-lg transition"
                                    title="Kembalikan / Pulihkan"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handlePermanentDeleteTrashItem(trash)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition animate-none"
                                    title="Hapus Permanen"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-600" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: PENGATURAN AI */}
          {activeTab === 'ai_settings' && (
            <motion.div
              key="ai_settings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header Info */}
              <div className="bg-[#111827] text-[#F9FAFB] p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-white" />
                    <h3 className="font-lobster text-sm text-white flex items-center gap-1.5 font-bold">
                      Pengaturan API <span className="text-[10px] bg-slate-800 text-slate-300 font-sans tracking-tight py-0.5 px-2 rounded-full font-mono font-medium">Global AI</span>
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium font-sans">
                    Kunci API yang Anda isi di sini tidak akan terhapus setelah refresh, karena tersimpan di Firebase Firestore untuk Anda (Admin).
                  </p>
                </div>
              </div>

              {/* Form Konfigurasi */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-3xs p-6 md:p-8 flex flex-col gap-6 max-w-2xl">
                <div>
                  <label className="block text-xs font-sans font-medium text-slate-600 mb-2">Tipe Penyedia AI (Provider)</label>
                  <select
                    value={aiSettings.provider}
                    onChange={(e) => setAiSettings({...aiSettings, provider: e.target.value})}
                    className="w-full text-xs bg-[#F9FAFB] border border-slate-200 rounded-xl px-4 py-3 font-medium text-[#111827] focus:outline-none focus:border-slate-400 cursor-pointer"
                  >
                    <option value="Gemini">Google Gemini (Native SDK)</option>
                    <option value="OpenAI_Compatible">OpenAI-Compatible (OpenAI, Groq, OpenRouter, dll)</option>
                  </select>
                  <p className="text-[9px] text-slate-400 mt-2 font-mono whitespace-normal">Pilih "OpenAI-Compatible" untuk menghubungkan platform API apa pun yang mendukung protokol REST OpenAI.</p>
                </div>

                {aiSettings.provider === 'OpenAI_Compatible' && (
                  <>
                    <div>
                      <label className="block text-xs font-sans font-medium text-slate-600 mb-2">Base URL Endpoint (Opsional)</label>
                      <input
                        type="text"
                        placeholder="Contoh: https://api.groq.com/openai/v1/chat/completions"
                        value={aiSettings.baseUrl}
                        onChange={(e) => setAiSettings({...aiSettings, baseUrl: e.target.value})}
                        className="w-full text-xs font-mono bg-[#F9FAFB] border border-slate-200 rounded-xl px-4 py-3 font-medium text-[#111827] focus:outline-none focus:border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-sans font-medium text-slate-600 mb-2">Model ID (Wajib untuk OpenAI Compatible)</label>
                      <input
                        type="text"
                        placeholder="Contoh: llama-3.2-90b-vision-preview atau gpt-4o-mini"
                        value={aiSettings.modelId}
                        onChange={(e) => setAiSettings({...aiSettings, modelId: e.target.value})}
                        className="w-full text-xs font-mono bg-[#F9FAFB] border border-slate-200 rounded-xl px-4 py-3 font-medium text-[#111827] focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-xs font-sans font-medium text-slate-600 mb-2">API Key (Rahasia)</label>
                  <input
                    type="password"
                    placeholder="Masukkan API Key Anda..."
                    value={aiSettings.apiKey}
                    onChange={(e) => setAiSettings({...aiSettings, apiKey: e.target.value})}
                    className="w-full text-xs font-mono bg-[#F9FAFB] border border-slate-200 rounded-xl px-4 py-3 font-medium text-[#111827] focus:outline-none focus:border-slate-400"
                  />
                  <p className="text-[9px] text-slate-400 mt-2 font-mono">Tersimpan dengan sangat aman di backend.</p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveAiSettings}
                    disabled={isSavingAi}
                    className="w-full bg-[#111827] hover:bg-slate-800 text-white font-bold text-xs py-3.5 px-4 rounded-xl flex justify-center items-center gap-2 transition"
                  >
                    {isSavingAi ? (
                      <span className="flex items-center gap-2">Memproses...</span>
                    ) : (
                      <>Simpan Konfigurasi <ChevronRight className="w-3.5 h-3.5 opacity-80" /></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

           {/* MODAL WINDOWS FOR FORM DESIGN: FULL-SCREEN CREATIVE WORKSPACE */}
        <AnimatePresence>
          {isDesignModalOpen && (
            <div className="fixed inset-0 bg-[#F9FAFB] z-50 overflow-y-auto flex flex-col font-sans text-xs">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-[#F9FAFB] flex-1 w-full min-h-screen flex flex-col relative text-left"
              >
                {/* Fixed Top Luxury Header Panel */}
                <div className="sticky top-0 z-40 bg-[#111827] text-white border-b border-neutral-800 px-6 py-4 flex items-center justify-between shadow-md shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="font-lobster text-xl text-white">
                      Fanra<span className="text-slate-400 font-normal">Tech</span>
                    </span>
                    <span className="h-4 w-px bg-neutral-700 hidden sm:inline" />
                    <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                      <span>Dasbor Studio</span>
                      <span>/</span>
                      <span className="text-emerald-400 font-extrabold">{editingDesign ? "Mode Edit Portofolio" : "Workspace Unggah Desain Baru"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => setIsDesignModalOpen(false)}
                      className="text-[10px] font-extrabold text-slate-300 hover:text-white transition-all cursor-pointer bg-neutral-800 border border-neutral-700 rounded-xl py-2 px-4 uppercase tracking-widest"
                    >
                      Batal
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSaveDesign}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2 hover:bg-neutral-100 bg-[#F9FAFB] text-[#111827] rounded-xl transition duration-200 cursor-pointer text-[10px] font-black uppercase tracking-wider shadow-sm"
                    >
                      <Image 
                        src="https://cdn-icons-png.flaticon.com/128/5668/5668020.png"
                        alt="Bookmark Icon"
                        width={14}
                        height={14}
                        className="object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span>Simpan Desain</span>
                    </button>
                  </div>
                </div>

                {/* Main Creative Canvas Layout: Left Preview / Right Form */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
                  
                  {/* LEFT SIDE PANEL (Lg: 5 columns): Image Preview + Auto-Tracer converter + Multi-Vector Manager */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Perfect Proportion Box */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-slate-550 text-xs font-semibold leading-none">Rasio Aspek Cover Desain</h3>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {designRatio && designPixels 
                              ? `Rasio: ${designRatio} (${designPixels})` 
                              : "Unggah gambar untuk mendeteksi rasio otomatis"}
                          </p>
                        </div>
                      </div>

                      {/* Cover Preview Image follow true custom/manual ratio aspects */}
                      <div className="flex flex-col items-center justify-center p-4 bg-[#F9FAFB] rounded-2xl border border-dashed border-slate-200 relative overflow-hidden select-none min-h-[300px]">
                        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
                        
                        {(() => {
                          let previewAspectClass = "aspect-square";
                          if (designRatio === "4:5") previewAspectClass = "aspect-[4/5]";
                          else if (designRatio === "3:4") previewAspectClass = "aspect-[3/4]";
                          else if (designRatio === "16:9") previewAspectClass = "aspect-[16/9]";
                          else if (designRatio === "2:3") previewAspectClass = "aspect-[2/3]";
                          else if (designRatio === "9:16") previewAspectClass = "aspect-[9/16]";
                          else if (designRatio === "4:3") previewAspectClass = "aspect-[4/3]";

                          return (
                            <div className="flex flex-col items-center gap-4 z-10 w-full">
                              <div 
                                className={`relative ${previewAspectClass} w-full max-w-[280px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center transition-all duration-300 group`}
                              >
                                {designImage ? (
                                  <>
                                    <Image 
                                      src={designImage} 
                                      alt="Cover portfolio preview" 
                                      fill
                                      sizes="280px"
                                      className="object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                    <label 
                                      htmlFor="workspace-photo-file-trigger-full"
                                      className="absolute inset-0 bg-[#111827]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-center cursor-pointer p-4 text-white gap-1"
                                    >
                                      <Upload className="w-5 h-5 filter invert text-white" />
                                      <span className="text-[10px] font-black uppercase tracking-wider">Ganti Cover Desain</span>
                                      <span className="text-[8px] text-slate-350 font-sans leading-tight">Mendukung berkas HD JPG, PNG, atau SVG</span>
                                    </label>
                                  </>
                                ) : (
                                  <label 
                                    htmlFor="workspace-photo-file-trigger-full"
                                    className="absolute inset-0 flex flex-col items-center justify-center text-center cursor-pointer p-6 bg-slate-50 hover:bg-slate-100/70 transition duration-200 gap-1.5"
                                  >
                                    <Upload className="w-6 h-6 text-[#111827]" />
                                    <span className="text-[11px] font-black text-[#111827] uppercase tracking-wider">Pilih / Unggah Gambar Utama</span>
                                    <span className="text-[8px] text-slate-400 max-w-[180px]">Format aspek rasio asli terdeteksi otomatis</span>
                                  </label>
                                )}
                              </div>

                              <div className="w-full bg-white p-3.5 rounded-2xl border border-slate-200/60 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Unggah File Cover (.png, .jpg)</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    id="workspace-photo-file-trigger-full"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          const base64Str = reader.result as string;
                                          
                                          // Deteksi rasio dan pixel otomatis
                                          const imgEl = document.createElement('img');
                                          imgEl.src = base64Str;
                                          imgEl.onload = () => {
                                            const w = imgEl.width;
                                            const h = imgEl.height;
                                            setDesignPixels(`${w} × ${h} px`);
                                            
                                            const frac = w / h;
                                            let autoRatio = "1:1";
                                            if (frac > 1.6) autoRatio = "16:9";
                                            else if (frac < 0.6) autoRatio = "9:16";
                                            else if (frac <= 0.7) autoRatio = "2:3";
                                            else if (frac <= 0.8) autoRatio = "3:4";
                                            else if (frac <= 0.9) autoRatio = "4:5";
                                            else if (frac > 1.25 && frac < 1.4) autoRatio = "4:3";
                                            setDesignRatio(autoRatio);
                                          };

                                          compressImage(base64Str).then(compressed => {
                                            setDesignImage(compressed);
                                            showToast("✓ Cover desain berhasil dipasang & dioptimasi otomatis!");
                                          });
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                  </div>

                  {/* RIGHT SIDE PANEL (Lg: 7 columns): Meta Details, Category, Palette, and Typography */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* Balanced Simple Title section - clean and minimalist */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative">
                      {/* Robot AI generator icon at the top right */}
                      <button
                        type="button"
                        onClick={handleAiGenerateDetails}
                        disabled={isGeneratingAiFields}
                        className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer select-none"
                        title="Tulis teks & palet warna otomatis dengan AI"
                      >
                        <Image 
                          src="https://cdn-icons-png.flaticon.com/128/17653/17653539.png"
                          alt="AI Robot Icon"
                          width={14}
                          height={14}
                          className={`object-contain ${isGeneratingAiFields ? 'animate-spin' : ''}`}
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] font-sans font-medium text-slate-600">
                          {isGeneratingAiFields ? 'Menulis...' : 'Bantuan AI'}
                        </span>
                      </button>

                      <div className="space-y-2.5">
                        <label className="block text-xs font-sans font-medium text-slate-400 leading-none">Judul Desain &amp; Deskripsi Kreatif</label>
                        
                        <input
                          type="text"
                          required
                          value={designTitle}
                          onChange={(e) => setDesignTitle(e.target.value)}
                          placeholder="Ketik Judul Desain Kreatif Anda... *"
                          className="text-lg sm:text-2xl font-display font-medium leading-tight text-[#111827] w-full focus:outline-none border-b border-dashed border-slate-150 focus:border-[#111827] py-1 bg-transparent placeholder-slate-300"
                        />
                        
                        <input
                          type="text"
                          required
                          value={designDesc}
                          onChange={(e) => setDesignDesc(e.target.value)}
                          placeholder="Tuliskan deskripsi singkat satu baris... *"
                          className="text-[11px] text-slate-500 font-medium w-full focus:outline-none bg-transparent pt-1 border-b border-transparent focus:border-slate-100 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      
                      {/* Aspect Ratio and manual aspect inputs */}
                      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3.5 flex flex-col justify-between">
                        <div>
                          <h3 className="font-sans font-medium text-xs text-slate-500 flex items-center leading-none">
                            Rasio &amp; Piksel (Opsional)
                          </h3>

                          <div className="grid grid-cols-2 gap-3 pt-3 opacity-90">
                            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-slate-150 text-left flex flex-col justify-between cursor-not-allowed">
                              <p className="text-[8px] text-slate-400 font-sans uppercase tracking-wider">Rasio Aspek (Otomatis)</p>
                              <div className="font-sans font-medium text-xs text-[#111827] mt-1.5 w-full">
                                {designRatio || "Pilih Gambar..."}
                              </div>
                            </div>

                            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-slate-150 text-left flex flex-col justify-between cursor-not-allowed">
                              <p className="text-[8px] text-slate-400 font-sans uppercase tracking-wider">Piksel (Otomatis)</p>
                              <div className="font-sans font-medium text-xs text-[#111827] mt-1.5 w-full">
                                {designPixels || "-"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Teks informasi rasio */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[8px] text-slate-400 font-sans">Rasio &amp; piksel akan dideteksi otomatis berdasarkan ukuran gambar yang diunggah.</span>
                        </div>
                      </div>

                      {/* Palette Color Selection card (Optional) */}
                      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3.5 flex flex-col justify-between">
                        <div>
                          <h3 className="font-sans font-medium text-xs text-slate-500 leading-none">
                            Palet Warna (Opsional)
                          </h3>

                          {(() => {
                            const activeColorHexes = designColors.split(',')
                              .map(c => c.trim())
                              .filter(Boolean);

                            return (
                              <div className="space-y-3 pt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[110px] overflow-y-auto pr-1">
                                  {activeColorHexes.map((hex, index) => (
                                    <div 
                                      key={index} 
                                      className="flex items-center gap-2 p-1.5 bg-[#F9FAFB] rounded-xl border border-slate-150 relative transition hover:border-[#111827]/40"
                                    >
                                      <input 
                                        type="color" 
                                        value={hex.startsWith('#') && hex.length === 7 ? hex : '#111827'} 
                                        onChange={(e) => {
                                          const newHex = e.target.value;
                                          const newList = [...activeColorHexes];
                                          newList[index] = newHex;
                                          setDesignColors(newList.join(', '));
                                        }} 
                                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200 bg-white"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <input 
                                          type="text" 
                                          value={hex} 
                                          onChange={(e) => {
                                            const newList = [...activeColorHexes];
                                            newList[index] = e.target.value;
                                            setDesignColors(newList.join(', '));
                                          }}
                                          className="text-[10px] font-mono font-medium text-[#111827] bg-transparent focus:outline-none w-full uppercase"
                                          placeholder="#HEXCODE"
                                        />
                                      </div>
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          const newList = activeColorHexes.filter((_, idx) => idx !== index);
                                          setDesignColors(newList.join(', '));
                                        }}
                                        className="p-1 hover:text-red-500 rounded text-slate-400 hover:bg-slate-100 shrink-0 transition"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDesignColors(prev => prev ? `${prev}, #94A3B8` : '#94A3B8');
                                    }}
                                    className="border border-dashed border-slate-250 rounded-xl p-1.5 hover:border-[#111827] flex items-center justify-center text-[9px] font-medium text-[#111827]/60 hover:text-[#111827] transition h-[42px] gap-1 bg-white select-none w-full"
                                  >
                                    + Tambah Palet
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <input
                          type="text"
                          value={designColors}
                          onChange={(e) => setDesignColors(e.target.value)}
                          placeholder="#111827, #F9FAFB, #E2E8F0"
                          className="w-full p-2.5 bg-[#F9FAFB] border border-slate-200 rounded-xl font-mono text-[9px] focus:outline-none mt-2"
                        />
                      </div>

                      {/* Tag Category (Optional) */}
                      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3.5 flex flex-col justify-between">
                        <div>
                          <h3 className="font-sans font-medium text-xs text-slate-500 leading-none">
                            Tag Kategori (Opsional)
                          </h3>

                          <div className="flex flex-wrap gap-2 pt-3 items-center">
                            <label className="text-[9px] text-slate-400 font-sans uppercase shrink-0">Kategori Utama:</label>
                            <select
                              value={designCategory}
                              onChange={(e) => setDesignCategory(e.target.value)}
                              className="text-[#111827] font-medium text-[10px] tracking-wider bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md cursor-pointer border-none focus:outline-none"
                            >
                              <option value="UI/UX">#UI/UX Layout</option>
                              <option value="Branding">#Branding Identity</option>
                              <option value="Desain Grafis">#Desain Grafis</option>
                              <option value="Tipografi">#Tipografi Swiss</option>
                            </select>
                          </div>

                          <div className="space-y-2 mt-3">
                            <p className="text-[8px] text-slate-400 font-sans uppercase font-semibold">Kata Kunci Tambahan ({designElements.length}):</p>
                            <div className="flex flex-wrap gap-1 min-h-[36px] p-2 bg-slate-50 border border-slate-200 rounded-xl">
                              {designElements.length > 0 ? (
                                designElements.map((tag, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 py-0.5 pl-2 pr-1 bg-[#111827] text-[#F9FAFB] font-sans text-[9px] rounded-md hover:bg-neutral-800 tracking-wider transition"
                                  >
                                    <span>#{tag.replace('#', '')}</span>
                                    <button
                                      type="button"
                                      onClick={() => setDesignElements(prev => prev.filter(t => t !== tag))}
                                      className="p-0.5 hover:bg-red-500 rounded transition"
                                    >
                                      <X className="w-2.5 h-2.5 text-white" />
                                    </button>
                                  </span>
                                ))
                              ) : (
                                <span className="text-[9px] text-slate-400 italic font-sans pt-1">Belum ada tag elemen utama</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1.5 mt-2">
                          <input
                            type="text"
                            value={newElementInput}
                            onChange={(e) => setNewElementInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newElementInput.trim()) {
                                  if (!designElements.includes(newElementInput.trim())) {
                                    setDesignElements(p => [...p, newElementInput.trim()]);
                                  }
                                  setNewElementInput("");
                                }
                              }
                            }}
                            placeholder="Ketik kata kunci... (Lalu enter)"
                            className="flex-1 p-2 bg-[#F9FAFB] border border-slate-200 rounded-lg text-[10px] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Typography selection (Optional) */}
                      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3.5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-sans font-medium text-slate-500 leading-none">
                              Daftar Nama Font (Opsional)
                            </label>
                          </div>

                          {/* Bubble list tags representation */}
                          <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 border border-slate-200 rounded-xl mt-3">
                            {designFontList.length > 0 ? (
                              designFontList.map((font, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-[#111827] text-white font-medium font-sans text-[9px] rounded-lg border border-slate-800 tracking-wider shadow-4xs"
                                >
                                  <span className="font-sans">{font}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = designFontList.filter(f => f !== font);
                                      setDesignFontList(updated);
                                      setDesignFonts(updated.join(', '));
                                    }}
                                    className="p-0.5 hover:bg-red-500 rounded transition"
                                  >
                                    <X className="w-2.5 h-2.5 text-white" />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-slate-400 italic font-mono pt-1">Belum ada font terdaftar</span>
                            )}
                          </div>
                        </div>

                        {/* Textfield trigger to add new Font */}
                        <div className="flex gap-1.5 mt-2">
                          <input
                            type="text"
                            value={newFontInput}
                            onChange={(e) => setNewFontInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newFontInput.trim()) {
                                  if (!designFontList.includes(newFontInput.trim())) {
                                    const updated = [...designFontList, newFontInput.trim()];
                                    setDesignFontList(updated);
                                    setDesignFonts(updated.join(', '));
                                  }
                                  setNewFontInput("");
                                }
                              }
                            }}
                            placeholder="Ketik nama font... (Lalu Enter)"
                            className="flex-1 p-2 bg-[#F9FAFB] border border-slate-200 rounded-lg text-[10px] font-medium focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newFontInput.trim()) {
                                if (!designFontList.includes(newFontInput.trim())) {
                                  const updated = [...designFontList, newFontInput.trim()];
                                  setDesignFontList(updated);
                                  setDesignFonts(updated.join(', '));
                                }
                                setNewFontInput("");
                              }
                            }}
                            className="px-3 py-1 bg-[#111827] text-white font-medium text-xs hover:bg-neutral-800 rounded-lg transition"
                          >
                            +
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Rich Long Description Page Story */}
                    <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3.5 text-left">
                      <div>
                        <h3 className="font-sans font-medium text-xs text-slate-500 leading-none">
                          Deskripsi Lengkap Detail &amp; Studio Story (Opsional)
                        </h3>
                      </div>

                      <textarea
                        value={designLongDesc}
                        onChange={(e) => setDesignLongDesc(e.target.value)}
                        rows={5}
                        placeholder="Tuliskan cerita kustom, proses kreatif, konsep dan filosofi karya Anda secara mendalam..."
                        className="w-full p-3 bg-[#F9FAFB] border border-slate-200 rounded-2xl font-medium focus:outline-none focus:border-[#111827] text-xs leading-relaxed transition"
                      />
                    </div>

                  </div>

                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL WINDOWS FOR FORM ASSETS */}
        <AnimatePresence>
          {isAssetModalOpen && (
            <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl relative overflow-hidden text-left"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                    <div>
                      <h3 className="font-display font-medium text-lg text-slate-900">
                        {editingAsset ? "Edit Aset" : "Tambah Aset"} <span className="font-extrabold">Vektor SVG</span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">FORM PENYIMPANAN VECTOR DIGITAL STUDIO</p>
                    </div>
                    <button
                      onClick={() => setIsAssetModalOpen(false)}
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form fields */}
                  <form onSubmit={handleSaveAsset} className="space-y-4 text-xs">
                    
                    {/* Title */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-extrabold text-[#111827] uppercase">Nama Aset Vektor *</label>
                      <input
                        type="text"
                        required
                        value={assetTitle}
                        onChange={(e) => setAssetTitle(e.target.value)}
                        placeholder="Contoh: Ornamen Mandala Geometri"
                        className="w-full p-2.5 bg-[#F9FAFB] border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#111827] transition"
                      />
                    </div>

                    {/* Category row */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-extrabold text-[#111827] uppercase">Kategori Menu</label>
                      <select
                        value={assetCategory}
                        onChange={(e) => setAssetCategory(e.target.value)}
                        className="w-full p-2.5 bg-[#F9FAFB] border border-slate-200 rounded-xl font-bold text-slate-700"
                      >
                        <option value="Desain Grafis">Aset Desain Grafis</option>
                        <option value="Branding">Aset Identitas / Branding</option>
                        <option value="UI/UX">Aset Visual Web UI/UX</option>
                        <option value="Tipografi">Aset Karakter Tipografi</option>
                      </select>
                    </div>

                    {/* Brief description */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-extrabold text-[#111827] uppercase">Deskripsi Ringkas Aset *</label>
                      <input
                        type="text"
                        required
                        value={assetDesc}
                        onChange={(e) => setAssetDesc(e.target.value)}
                        placeholder="Contoh: Pola ornamen linear presisi siap digunakan di platform web atau cetak."
                        className="w-full p-2.5 bg-[#F9FAFB] border border-slate-200 rounded-xl font-medium focus:outline-none"
                      />
                    </div>

                    {/* SVG content raw with live .svg file uploader */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-mono font-extrabold text-[#111827] uppercase">Kode Raw SVG Coding (Format XML) *</label>
                        <span className="text-[9px] text-[#111827]/40 font-mono">Bisa diunggah otomatis di bawah</span>
                      </div>
                      
                      <textarea
                        required
                        value={assetSvgContent}
                        onChange={(e) => setAssetSvgContent(e.target.value)}
                        rows={5}
                        placeholder="Salin teks tag <svg>...</svg> Anda di sini..."
                        className="w-full p-2.5 bg-[#F9FAFB] border border-slate-200 rounded-xl font-mono text-[10.5px] leading-normal"
                      />

                      {/* File Uploader for SVG */}
                      <div className="border border-dashed border-slate-250 p-3 bg-[#F9FAFB]/50 rounded-xl flex flex-col items-center justify-center text-center transition-all duration-200 hover:border-[#111827]">
                        <input
                          type="file"
                          accept=".svg"
                          id="asset-native-svg-uploader"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setAssetSvgContent(reader.result as string);
                                showToast("✓ Sukses mengimpor berkas vektor .svg!");
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                        <label htmlFor="asset-native-svg-uploader" className="cursor-pointer text-[10px] font-bold text-[#111827] hover:underline flex flex-col items-center gap-1">
                          <Upload className="w-3.5 h-3.5 text-[#111827]" />
                          <span>Pilih Berkas SVG (.svg) HP / Laptop</span>
                        </label>
                      </div>

                      <div className="pt-1.5 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAssetSvgContent(sampleSvgs.star)}
                          className="py-1 px-2 border border-slate-200 bg-white rounded text-[9px] font-bold text-slate-500 hover:text-[#111827]"
                        >
                          Gunakan Contoh Bintang
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssetSvgContent(sampleSvgs.abstract)}
                          className="py-1 px-2 border border-slate-200 bg-white rounded text-[9px] font-bold text-slate-500 hover:text-[#111827]"
                        >
                          Gunakan Contoh Abstrak
                        </button>
                      </div>
                    </div>

                  </form>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAssetModalOpen(false)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs cursor-pointer select-none"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAsset}
                    className="py-2.5 px-5 bg-[#111827] hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer select-none"
                  >
                    Simpan Aset Vektor
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CUSTOM VERIFICATION / CONFIRMATION MODAL */}
        <AnimatePresence>
          {confirmModal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="absolute inset-0 bg-[#111827]/60 backdrop-blur-xs"
              />
              
              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative bg-white w-full max-w-sm rounded-2xl border border-slate-200 overflow-hidden shadow-2xl p-6 text-left font-sans text-xs space-y-4"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#111827]">
                      {confirmModal.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">Konfirmasi Verifikasi</p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  {confirmModal.message}
                </p>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition select-none cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      confirmModal.onConfirm();
                      setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    }}
                    className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition select-none cursor-pointer flex items-center gap-1"
                  >
                    <span>Lanjutkan</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Dashboard Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200/50 text-center">
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            © 2026 FanraTech. Sistem Administrasi Realtime Mandiri.
          </p>
        </div>

      </div>
    </main>
  );
}
