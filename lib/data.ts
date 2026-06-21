export interface DesignDimension {
  type: string;
  pixels: string;
  ratio: string;
  physical?: string;
  docs: string;
}

export interface DesignItem {
  id: string;
  title: string;
  category: string;
  description: string;
  longDescription: string;
  image: string;
  colors: { hex: string; name: string }[];
  fonts: { name: string; usage: string; previewText?: string }[];
  software: string[];
  elements: string[];
  sourceFile: string;
  svgContent: string; // Dynamic vector asset that can be downloaded physically
  aspectRatioClass: string; // Tailwind aspect class (aspect-square, aspect-[4/5], aspect-[3/4], etc.)
  dimensions: DesignDimension;
  order?: number; // Optional order ranking for custom reordering
}

export const designCategories = ["Semua", "UI/UX", "Branding", "Desain Grafis", "Tipografi"];

export interface DimensionPreset {
  category: string;
  type: string;
  pixels: string;
  ratio: string;
  physical?: string;
  useCase: string;
}

export const standardDimensions: DimensionPreset[] = [
  { category: "Feed Instagram", type: "Feed Square / Carousel", pixels: "1080 × 1080 px", ratio: "1:1", physical: "9.14 × 9.14 cm", useCase: "Profil utama, katalog produk, standar visual grid" },
  { category: "Feed Instagram", type: "Feed Portrait", pixels: "1080 × 1350 px", ratio: "4:5", physical: "9.14 × 11.43 cm", useCase: "Feed vertikal, promosi produk dengan perhatian visual maksmial" },
  { category: "Feed Instagram", type: "Feed Landscape", pixels: "1080 × 566 px", ratio: "1.91:1", physical: "9.14 × 4.79 cm", useCase: "Foto pemandangan, dokumentasi landscape lebar" },
  { category: "Story & Reels", type: "Story / Reels / TikTok", pixels: "1080 × 1920 px", ratio: "9:16", physical: "9.14 × 16.26 cm", useCase: "Konten vertikal interaktif seluler penuh" },
  { category: "Poster Cetak (300 DPI)", type: "Poster A4 Standard", pixels: "2480 × 3508 px", ratio: "1:1.41", physical: "21.0 × 29.7 cm", useCase: "Flyer promosi, menu restoran, poster info dinding" },
  { category: "Poster Cetak (300 DPI)", type: "Poster A3 Executive", pixels: "3508 × 4961 px", ratio: "1:1.41", physical: "29.7 × 42.0 cm", useCase: "Poster acara, infografis komersial skala medium" },
  { category: "Poster Cetak (300 DPI)", type: "Poster A2 Premium", pixels: "4961 × 7016 px", ratio: "1:1.41", physical: "42.0 × 59.4 cm", useCase: "Poster pameran seni mewah, papan reklame dalam ruangan" },
  { category: "Identitas Brand", type: "Logo Square Master", pixels: "2000 × 2000 px", ratio: "1:1", physical: "16.9 × 16.9 cm", useCase: "Identitas bisnis utama, favicon, watermark aset digital" },
  { category: "Thumbnail & Video", type: "YouTube Thumbnail HD", pixels: "1280 × 720 px", ratio: "16:9", physical: "10.8 × 6.1 cm", useCase: "Sampul video, materi presentasi 16:9" },
  { category: "Banner Website", type: "Hero Banner Landing", pixels: "1920 × 1080 px", ratio: "16:9", physical: "16.2 × 9.1 cm", useCase: "Tampilan beranda web penuh, desktop desktop wallpaper" },
  { category: "Banner Website", type: "Website Header Slim", pixels: "1920 × 600 px", ratio: "19.2:6", physical: "16.2 × 5.1 cm", useCase: "Sampul blog, header halaman dalam situs" },
  { category: "UI / App Design", type: "Mobile App Wireframe", pixels: "390 × 844 px", ratio: "9:19.5", physical: "3.25 × 7.03 inci", useCase: "Mockup antarmuka ponsel pintar modern (iOS / Android)" },
  { category: "UI / App Design", type: "Desktop UI System", pixels: "1440 × 1024 px", ratio: "16:11.3", physical: "12.0 × 8.53 inci", useCase: "Sistem aplikasi web, dashboard panel profesional" }
];

export const portfolioItems: DesignItem[] = [
  {
    id: "glowup-studio",
    title: "GlowUp Studio Branding",
    category: "Branding",
    description: "Identitas visual minimalis dan organik untuk studio kecantikan holistik bersertifikat.",
    longDescription: "Project branding ini dirancang untuk merefleksikan keanggunan alami, kebersihan kesehatan, dan rasa kedamaian. Warna pastel hangat dan sage mendukung filosofi ramah lingkungan dan harmoni organik, menciptakan citra merek premium namun tetap inklusif bagi pelanggan baru.",
    image: "https://picsum.photos/seed/glowup/800/600",
    colors: [
      { hex: "#FDFBF7", name: "Alabaster White" },
      { hex: "#E6C5B3", name: "Warm Soft Peach" },
      { hex: "#A8C3B4", name: "Sage Earth Green" },
      { hex: "#4B534E", name: "Deep Charcoal Forest" }
    ],
    fonts: [
      { name: "Playfair Display", usage: "Display Wordmark & Headings utama", previewText: "GlowUp Studio" },
      { name: "Plus Jakarta Sans", usage: "Teks Tubuh & Informasi Detail", previewText: "Kecantikan alami yang berawal dari kepedulian tulus." }
    ],
    software: ["Adobe Illustrator", "Figma", "Photoshop"],
    elements: [
      "Ikon floral botani organik",
      "Sistem grid 12-kolom seimbang",
      "Tekstur berbayang butiran organik (grain texture)",
      "Kartu nama letterpress dengan finishing foil emas rose gold"
    ],
    sourceFile: "glowup_branding_pack_v1.svg",
    aspectRatioClass: "aspect-square",
    dimensions: {
      type: "Logo Square Master",
      pixels: "2000 × 2000 px",
      ratio: "1:1",
      physical: "16.9 × 16.9 cm",
      docs: "Sempurna untuk profil media sosial & ikon aplikasi."
    },
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#FDFBF7" />
  <circle cx="200" cy="180" r="90" fill="none" stroke="#E6C5B3" stroke-width="2" stroke-dasharray="4 4" />
  <circle cx="200" cy="180" r="80" fill="none" stroke="#A8C3B4" stroke-width="3" />
  
  <!-- Estetika Botani / Daun Simpel -->
  <path d="M200,120 C180,150 160,170 200,230 C240,170 220,150 200,120" fill="#E6C5B3" opacity="0.8"/>
  <path d="M200,140 C190,165 180,180 200,220 C220,180 210,165 200,140" fill="#A8C3B4" />
  <circle cx="200" cy="245" r="5" fill="#4B534E" />
  
  <!-- Teks Grid -->
  <text x="200" y="310" font-family="'Playfair Display', serif" font-size="24" font-weight="bold" fill="#4B534E" text-anchor="middle" letter-spacing="4">GLOWUP</text>
  <text x="200" y="335" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="600" fill="#A8C3B4" text-anchor="middle" letter-spacing="6">ORGANIC STUDIO</text>
  <path d="M140,350 L260,350" stroke="#E6C5B3" stroke-width="1" />
</svg>`
  },
  {
    id: "kopi-santai",
    title: "Kopi Santai Mobile App",
    category: "UI/UX",
    description: "Antarmuka aplikasi ponsel modern pemesanan kopi segar lokal dengan alur memesan 2-klik saja.",
    longDescription: "Kopi Santai memecahkan masalah antrean panjang di gerai kopi modern melalui antarmuka visual lincah dan bersih. Dilengkapi palet hangat beraroma kopi, struktur navigasi ergonomis satu tangan, serta transisi kartu belanja apik untuk mengoptimalkan konversi transaksi.",
    image: "https://picsum.photos/seed/coffee/800/1200",
    colors: [
      { hex: "#FFFDF6", name: "Fresh Milk Cream" },
      { hex: "#EAD0B3", name: "Creamy Latte Light" },
      { hex: "#8C6239", name: "Warm Coffee Bean" },
      { hex: "#2D1E12", name: "Dark Roasted Espresso" }
    ],
    fonts: [
      { name: "Space Grotesk", usage: "Header, Title, Angka Harga", previewText: "Kopi Santai App" },
      { name: "Plus Jakarta Sans", usage: "Deskripsi Menu, Tombol, Tab Bar", previewText: "Espresso murni berpadu susu almond manis." }
    ],
    software: ["Figma", "Prototyping Interaction Tool", "Adobe Photoshop"],
    elements: [
      "Desain Tombol Memiliki Target Sentuh Lebar (48px)",
      "Kartu Produk dengan Sudut Halus (rounded-2xl)",
      "Bottom Sheet Navigasi Kasir Mengalir",
      "Lencana Status Pemesanan Beranimasi Nadi (pulse)"
    ],
    sourceFile: "kopi_santai_app_UI_assets.svg",
    aspectRatioClass: "aspect-[2/3]",
    dimensions: {
      type: "Mobile App Wireframe",
      pixels: "390 × 844 px",
      ratio: "9:19.5",
      physical: "3.25 × 7.03 inci",
      docs: "Layout super responsif dan ergonomis genggaman satu tangan luar ruangan."
    },
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <!-- Simulasi Mobile Frame -->
  <rect width="100%" height="100%" fill="#FFFDF6" />
  <rect x="50" y="30" width="300" height="340" rx="24" fill="#2D1E12" />
  
  <!-- Layar Dalam -->
  <rect x="60" y="40" width="280" height="320" rx="16" fill="#FFFDF6" />
  
  <!-- Header -->
  <text x="80" y="80" font-family="'Space Grotesk', sans-serif" font-size="18" font-weight="bold" fill="#2D1E12">Hai, Fanra! ☕</text>
  <text x="80" y="98" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" fill="#8C6239">Butuh asupan kopi pagi ini?</text>
  
  <!-- Espresso Card Mock -->
  <rect x="80" y="120" width="240" height="130" rx="14" fill="#EAD0B3" />
  <circle cx="260" cy="185" r="40" fill="#8C6239" opacity="0.3" />
  
  <!-- Secangkir Kopi Simpel -->
  <path d="M245,175 L275,175 C275,195 245,195 245,175" fill="#2D1E12" />
  <path d="M275,180 C285,180 285,190 275,190" fill="none" stroke="#2D1E12" stroke-width="3" />
  <line x1="250" y1="165" x2="250" y2="170" stroke="#2D1E12" stroke-width="2" stroke-linecap="round" />
  <line x1="260" y1="163" x2="260" y2="168" stroke="#2D1E12" stroke-width="2" stroke-linecap="round" />
  <line x1="270" y1="165" x2="270" y2="170" stroke="#2D1E12" stroke-width="2" stroke-linecap="round" />
  
  <text x="100" y="160" font-family="'Space Grotesk', sans-serif" font-size="14" font-weight="bold" fill="#2D1E12">Es Kopi Aren</text>
  <text x="100" y="178" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" fill="#2D1E12">★ 4.9 (120+ Ulasan)</text>
  
  <!-- Button "Pesan" -->
  <rect x="100" y="200" width="80" height="28" rx="8" fill="#2D1E12" />
  <text x="140" y="217" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="bold" fill="#FFFDF6" text-anchor="middle">Beli - Rp22k</text>
  
  <!-- Tab navigation bar -->
  <rect x="75" y="310" width="250" height="40" rx="12" fill="#2D1E12" />
  <circle cx="115" cy="330" r="6" fill="#FFFDF6" />
  <circle cx="200" cy="330" r="6" fill="#FFFDF6" opacity="0.4" />
  <circle cx="285" cy="330" r="6" fill="#FFFDF6" opacity="0.4" />
</svg>`
  },
  {
    id: "nusantara-festival",
    title: "Nusantara Food Festival",
    category: "Desain Grafis",
    description: "Poster promosi budaya yang memadukan ilustrasi tropis cerah-soft dan tipografi ekspresif warisan luhur.",
    longDescription: "Desain poster ini dibuat khusus untuk memeriahkan kuliner nusantara dengan sentuhan warna tropis bersahabat (soft orange, coral, warm mustard). Mengesampingkan distorsi warna tajam, poster ini mengedepankan keakraban visual yang ramah keluarga, dipadukan tekstur vintage lembut.",
    image: "https://picsum.photos/seed/festival/800/1100",
    colors: [
      { hex: "#FFF4E0", name: "Warm Rice Sand" },
      { hex: "#FF8A65", name: "Semburat Soft Coral" },
      { hex: "#FFB74D", name: "Pastel Sweet Mustard" },
      { hex: "#3E2723", name: "Charcoal Coffee Wood" }
    ],
    fonts: [
      { name: "Space Grotesk", usage: "Display Judul, Tanggal, & Tempat Event", previewText: "NUSANTARA FESTIVAL 2026" },
      { name: "Plus Jakarta Sans", usage: "Teks Pengumuman & Jadwal Acara", previewText: "Nikmati lebih dari 100 sate warisan leluhur secara autentik." }
    ],
    software: ["Adobe Photoshop", "Illustrator", "Procreate"],
    elements: [
      "Ilustrasi piring rotan & tumpeng minimalis",
      "Aksen ukuran gradasi motif megamendung lembut",
      "Spasing tipografi asimetris modern",
      "Efek butiran kertas daur ulang (paper tooth noise)"
    ],
    sourceFile: "nusantara_food_poster_source.svg",
    aspectRatioClass: "aspect-[3/4]",
    dimensions: {
      type: "Poster A4 Standard",
      pixels: "2480 × 3508 px",
      ratio: "1:1.41",
      physical: "21.0 × 29.7 cm",
      docs: "Diproduksi khusus dengan 300 DPI siap cetak cetak laser."
    },
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#FFF4E0" />
  <!-- Aksen Radiance Matahari Terbit -->
  <circle cx="200" cy="380" r="160" fill="#FFB74D" opacity="0.2" />
  <circle cx="200" cy="380" r="110" fill="#FF8A65" opacity="0.3" />
  
  <!-- Gunung Silhouette khas Indonesia -->
  <path d="M100,380 L180,240 L260,380 Z" fill="#3E2723" opacity="0.1" />
  <path d="M190,380 L270,220 L350,380 Z" fill="#3E2723" opacity="0.15" />
  
  <!-- Piring Tumpeng Sederhana di Tengah-bawah -->
  <ellipse cx="200" cy="340" rx="90" ry="25" fill="#3E2723" opacity="0.3" />
  <ellipse cx="200" cy="336" rx="85" ry="20" fill="#FFB74D" />
  <!-- Tumpeng Nasi Kuning -->
  <path d="M150,340 L200,260 L250,340 Z" fill="#FFB74D" stroke="#FFF4E0" stroke-width="2" />
  <path d="M185,340 L200,260 L215,340 Z" fill="#FF8A65" opacity="0.5" />
  
  <!-- Aksen Mega Mendung Simpel kiri kanan -->
  <path d="M60,120 C80,110 90,130 110,120 C120,130 140,110 150,130" stroke="#FF8A65" stroke-width="3" fill="none" stroke-linecap="round"/>
  
  <!-- Judul Poster -->
  <text x="200" y="80" font-family="'Space Grotesk', sans-serif" font-size="28" font-weight="950" fill="#3E2723" text-anchor="middle" letter-spacing="1">RASA NUSANTARA</text>
  <text x="200" y="110" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="bold" fill="#FF8A65" text-anchor="middle" letter-spacing="5">FOOD FESTIVAL 2026</text>
  
  <!-- Info Sekitar -->
  <text x="200" y="150" font-family="'Plus Jakarta Sans', sans-serif" font-size="8" font-weight="bold" fill="#3E2723" text-anchor="middle">JAKARTA • BALI • SURABAYA • JOGJA</text>
  <rect x="140" y="165" width="120" height="20" rx="4" fill="#3E2723" />
  <text x="200" y="178" font-family="'Space Grotesk', sans-serif" font-size="8" font-weight="bold" fill="#FFF4E0" text-anchor="middle">TIKET MASUK GRATIS</text>
</svg>`
  },
  {
    id: "ecolife-dashboard",
    title: "EcoLife Web Dashboard",
    category: "UI/UX",
    description: "Sistem visualisasi data karbon netral, bersih melingkar dengan panel interaktif berdasar prinsip hijau.",
    longDescription: "EcoLife dikonseptualisasikan untuk memberdayakan konsumen melacak jejak ekologi rumah tangga mereka. Desain web menyatukan warna mint lembut, grafik berdesain gelombang fluida, serta elemen UI ergonomis berjarak lega demi meminimalisasi kelelahan kognitif saat membaca data numerik yang padat.",
    image: "https://picsum.photos/seed/ecology/800/550",
    colors: [
      { hex: "#F4FAF7", name: "Organic Mint Breeze" },
      { hex: "#A7F3D0", name: "Soft Clover Emerald" },
      { hex: "#10B981", name: "Forest Leaf Green" },
      { hex: "#065F46", name: "Deep Spruce Teal" }
    ],
    fonts: [
      { name: "Plus Jakarta Sans", usage: "Seluruh Teks UI Dashboard", previewText: "EcoLife Carbon Portal" }
    ],
    software: ["Figma", "Adobe Illustrator", "After Effects (Motion Prototype)"],
    elements: [
      "Grafik Donat visualisasi emisi real-time",
      "Kartu mini metrics dengan bayangan elevasi datar",
      "Ikon-ikon navigasi adaptif kustom",
      "Desain filter tanggal berstruktur tab geser"
    ],
    sourceFile: "ecolife_dashboard_UI_master.svg",
    aspectRatioClass: "aspect-[4/3]",
    dimensions: {
      type: "Desktop UI System",
      pixels: "1440 × 1024 px",
      ratio: "16:11.3",
      physical: "12.0 × 8.53 inci",
      docs: "Grid asimetris ideal untuk presentasi desktop dan platform SaaS."
    },
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#F4FAF7" />
  <rect x="20" y="20" width="360" height="360" rx="14" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="1.5" />
  
  <!-- Sidebar Mini Dashboard -->
  <rect x="20" y="20" width="70" height="360" fill="#F4FAF7" rx="14" />
  <circle cx="55" cy="55" r="16" fill="#10B981" />
  <!-- Simbol Daun Sidebar -->
  <path d="M55,47 C50,52 50,57 55,61 C60,57 60,52 55,47" fill="#FFFFFF" />
  
  <!-- Menu Items di Sidebar -->
  <rect x="35" y="100" width="40" height="8" rx="2" fill="#10B981" />
  <rect x="35" y="125" width="40" height="8" rx="2" fill="#065F46" opacity="0.3" />
  <rect x="35" y="150" width="40" height="8" rx="2" fill="#065F46" opacity="0.3" />
  <rect x="35" y="175" width="40" height="8" rx="2" fill="#065F46" opacity="0.3" />
  
  <!-- Konten Utama Panel -->
  <text x="110" y="60" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="bold" fill="#065F46">EcoLife Dashboard</text>
  <text x="110" y="76" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" fill="#10B981">Jejak Karbon Anda turun 14% minggu ini!</text>
  
  <!-- Grafik Lingkaran di kanan -->
  <circle cx="280" cy="180" r="60" fill="none" stroke="#F4FAF7" stroke-width="16" />
  <circle cx="280" cy="180" r="60" fill="none" stroke="#10B981" stroke-width="16" stroke-dasharray="280 100" stroke-linecap="round" />
  <circle cx="280" cy="180" r="60" fill="none" stroke="#A7F3D0" stroke-width="16" stroke-dasharray="100 280" stroke-dashoffset="-150" stroke-linecap="round" />
  <text x="280" y="185" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="900" fill="#065F46" text-anchor="middle">86%</text>
  <text x="280" y="198" font-family="'Plus Jakarta Sans', sans-serif" font-size="8" font-weight="bold" fill="#10B981" text-anchor="middle">BERSIH</text>
  
  <!-- Grid data kiri -->
  <rect x="110" y="110" width="100" height="60" rx="10" fill="#F4FAF7" />
  <text x="125" y="132" font-family="'Plus Jakarta Sans', sans-serif" font-size="8" fill="#065F46">Suhu Rata-rata</text>
  <text x="125" y="154" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="bold" fill="#065F46">24.5 °C</text>
  
  <rect x="110" y="185" width="100" height="60" rx="10" fill="#F4FAF7" />
  <text x="125" y="207" font-family="'Plus Jakarta Sans', sans-serif" font-size="8" fill="#065F46">Emisi CO₂</text>
  <text x="125" y="229" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="bold" fill="#10B981">1.2 Kg</text>
  
  <!-- Bar chart bawah -->
  <rect x="110" y="270" width="250" height="80" rx="10" fill="#F4FAF7" />
  <text x="125" y="292" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="bold" fill="#065F46">Statistik Mingguan</text>
  <rect x="140" y="310" width="12" height="30" rx="2" fill="#065F46" opacity="0.3" />
  <rect x="165" y="302" width="12" height="38" rx="2" fill="#065F46" opacity="0.3" />
  <rect x="190" y="295" width="12" height="45" rx="2" fill="#10B981" />
  <rect x="215" y="315" width="12" height="25" rx="2" fill="#10B981" />
  <rect x="240" y="308" width="12" height="32" rx="2" fill="#A7F3D0" />
  <rect x="265" y="300" width="12" height="40" rx="2" fill="#A7F3D0" />
  <rect x="290" y="295" width="12" height="45" rx="2" fill="#10B981" />
</svg>`
  },
  {
    id: "lentera-malam",
    title: "Lentera Malam Poster",
    category: "Tipografi",
    description: "Karya tipografis puitis berstruktur grid Swiss modern yang mengeksplorasi spasi huruf dan sastra nusantara.",
    longDescription: "Project eksploratif ini mempertemukan teks sastra luhur dengan tata letak geometris modular ala Swiss. Berfokus pada dinamika kontras antara putih bersih, bayangan abu halus, dan teks hitam arang, poster ini mendemonstrasikan kekuatan hierarki visual yang ketat namun ekspresif.",
    image: "https://picsum.photos/seed/night/800/1150",
    colors: [
      { hex: "#FAFAF9", name: "Warm Soft White" },
      { hex: "#E7E5E4", name: "Pebble Stone Gray" },
      { hex: "#D6D3D1", name: "Soft Powder Sand" },
      { hex: "#292524", name: "Deep Charcoal Coal" }
    ],
    fonts: [
      { name: "Playfair Display", usage: "Kata Kunci Utama & Karakter Utama", previewText: "L E N T E R A" },
      { name: "JetBrains Mono", usage: "Teks Koordinat, Deskripsi Swiss, Meta Data", previewText: "GRID-REFERENCE#2026_LM" }
    ],
    software: ["Adobe Illustrator", "InDesign"],
    elements: [
      "Struktur Kisi Swiss Klasik (Swiss Grid System)",
      "Tracking Kerning longgar yang disesuaikan presisi",
      "Semburan tekstur batu halus",
      "Tanda baca yang digantung keluar margin (hung punctuation)"
    ],
    sourceFile: "lentera_malam_swiss_grid.svg",
    aspectRatioClass: "aspect-[3/4]",
    dimensions: {
      type: "Poster A3 Executive",
      pixels: "3508 × 4961 px",
      ratio: "1:1.41",
      physical: "29.7 × 42.0 cm",
      docs: "Tipografi murni dengan grid modular Swiss modern yang ketat."
    },
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#FAFAF9" />
  
  <!-- Garis Kisi Grid Swiss Tipis -->
  <line x1="40" y1="20" x2="40" y2="380" stroke="#E7E5E4" stroke-width="0.5" />
  <line x1="200" y1="20" x2="200" y2="380" stroke="#E7E5E4" stroke-width="0.5" />
  <line x1="360" y1="20" x2="360" y2="380" stroke="#E7E5E4" stroke-width="0.5" />
  <line x1="20" y1="100" x2="380" y2="100" stroke="#E7E5E4" stroke-width="0.5" />
  <line x1="20" y1="280" x2="380" y2="280" stroke="#E7E5E4" stroke-width="0.5" />
  
  <!-- Lingkaran Bulan Abstrak -->
  <circle cx="200" cy="190" r="70" fill="#E7E5E4" opacity="0.4" />
  <circle cx="205" cy="185" r="70" fill="#FAFAF9" />
  
  <!-- Teks Monospace Sudut Atas -->
  <text x="45" y="50" font-family="'JetBrains Mono', monospace" font-size="8" fill="#292524" letter-spacing="1">TYPE-SPECIMEN: 09</text>
  <text x="45" y="62" font-family="'JetBrains Mono', monospace" font-size="8" fill="#D6D3D1" letter-spacing="1">GEO REF: 2026.05</text>
  
  <text x="355" y="50" font-family="'JetBrains Mono', monospace" font-size="8" fill="#292524" text-anchor="end" letter-spacing="1">[IDN_EST]</text>
  
  <!-- Judul Serif Besar -->
  <text x="45" y="150" font-family="'Playfair Display', serif" font-size="44" font-weight="bold" fill="#292524" letter-spacing="6">LENTERA</text>
  <text x="45" y="210" font-family="'Playfair Display', serif" font-size="44" font-weight="bold" fill="#292524" letter-spacing="6">MALAM</text>
  
  <!-- Blok Puisi Kecil -->
  <text x="45" y="250" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="normal" fill="#292524" opacity="0.8">
    <tspan x="45" dy="0">Sunyi menyingkap tirai mimpi,</tspan>
    <tspan x="45" dy="14">lentera redup menuntun jemari.</tspan>
    <tspan x="45" dy="14">Membakar sepi, merajut karya,</tspan>
    <tspan x="45" dy="14">mengukir makna di atas semesta.</tspan>
  </text>
  
  <!-- Banner Code Bawah -->
  <rect x="40" y="330" width="320" height="25" fill="#292524" rx="2" />
  <text x="200" y="346" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="bold" fill="#FAFAF9" text-anchor="middle" letter-spacing="3">SWISS LAYOUT SYSTEM DESIGNER</text>
</svg>`
  },
  {
    id: "sanasini-travel",
    title: "SanaSini Travel Platform",
    category: "UI/UX",
    description: "Desain landing page petualangan mewah dengan transisi kartu yang cair, bernuansa langit cerah bergradasi.",
    longDescription: "SanaSini menyajikan visualisasi imersif pariwisata nusantara untuk turis domestik dan global. Landing page ini dikembangkan dengan nuansa biru langit cerah-soft, menggunakan grid gambar asimetris yang melahirkan antusiasme rekreasi, dikemas dengan detail tombol sentuh ergonomis yang super nyaman diakses via seluler.",
    image: "https://picsum.photos/seed/travel/800/450",
    colors: [
      { hex: "#F0F7FF", name: "Morning Sky Mist" },
      { hex: "#BFDBFE", name: "Ice Glacier Blue" },
      { hex: "#3B82F6", name: "Soft Ocean Blue" },
      { hex: "#1E3A8A", name: "Deep Maritime Navy" }
    ],
    fonts: [
      { name: "Space Grotesk", usage: "Judul Eksplorasi & Heading Menu", previewText: "Eksplorasi SanaSini" },
      { name: "Plus Jakarta Sans", usage: "Navigasi, Pencarian, & Feedback", previewText: "Temukan surga tropis tersembunyi dengan pemandu tepercaya." }
    ],
    software: ["Figma", "Adobe Illustrator", "Lightroom (Color grading)"],
    elements: [
      "Floating search bar panel di laptop & HP",
      "Koleksi kartu destinasi berbayang melayang (float cards)",
      "Header adaptif otomatis dengan blur kaca (backdrop blur)",
      "Elemen petunjuk peta rute melengkung ramah"
    ],
    sourceFile: "sanasini_travel_landing_master.svg",
    aspectRatioClass: "aspect-[16/9]",
    dimensions: {
      type: "Hero Banner Landing",
      pixels: "1920 × 1080 px",
      ratio: "16:9",
      physical: "16.2 × 9.1 cm",
      docs: "Grid banner horizontal fluid berdesain modern memanjakan mata."
    },
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <!-- Latar Belakang Gradasi Biru Langit Lembut -->
  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F0F7FF" />
      <stop offset="100%" stop-color="#BFDBFE" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#skyGrad)" />
  
  <!-- Aksen Awan Halus -->
  <path d="M40,120 C50,105 80,105 90,120 C100,115 120,120 120,130 C120,140 40,140 40,120 Z" fill="#FFFFFF" opacity="0.7" />
  <path d="M260,80 C270,68 290,68 300,80 C310,75 325,80 325,90 C325,100 260,100 260,80 Z" fill="#FFFFFF" opacity="0.6" />
  
  <!-- Peta Pulau Melayang Tropis Simpel -->
  <path d="M 120 280 Q 150 250 180 270 T 260 260 T 320 300 L 320 340 L 100 340 Z" fill="#3B82F6" opacity="0.2" fill-rule="evenodd" />
  
  <!-- Perahu Kecil Simpel -->
  <path d="M120,290 L150,290 L155,283 L125,283 Z" fill="#1E3A8A" />
  <path d="M135,283 L135,265 L145,275 Z" fill="#FFFFFF" />
  
  <!-- Panel Pencarian Melayang -->
  <rect x="40" y="160" width="320" height="80" rx="12" fill="#FFFFFF" opacity="0.9" />
  <rect x="55" y="190" width="130" height="34" rx="8" fill="#F0F7FF" />
  <text x="65" y="211" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600" fill="#1E3A8A">Destinasi: Labuan Bajo</text>
  
  <rect x="195" y="190" width="150" height="34" rx="8" fill="#3B82F6" />
  <text x="270" y="211" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="bold" fill="#F0F7FF" text-anchor="middle">Cari Tempat ➔</text>
  
  <!-- Teks Judul Layar Utama -->
  <text x="40" y="70" font-family="'Space Grotesk', sans-serif" font-size="28" font-weight="bold" fill="#1E3A8A">SANA SINI</text>
  <text x="40" y="94" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="bold" stroke-width="1" fill="#3B82F6" letter-spacing="3">LIBURAN NUSANTARA</text>
  <text x="40" y="125" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" fill="#1E3A8A" opacity="0.8">Rencana eksplorasi indah yang terorganisir sempurna.</text>
  
  <!-- Burung Camar Melayang Terbang -->
  <path d="M100,50 Q110,40 120,48 Q130,40 140,50" fill="none" stroke="#1E3A8A" stroke-width="1.5" stroke-linecap="round" />
  <path d="M280,40 Q287,32 294,38 Q301,32 308,40" fill="none" stroke="#1E3A8A" stroke-width="1" stroke-linecap="round" />
</svg>`
  }
];

const TITLES = [
  "Buah Jeruk Keprok", "Buah Apel Malang", "Buah Pisang Ambon",
  "Buah Naga Merah", "Buah Semangka Tropis", "Buah Alpukat Mentega",
  "Mangga Arumanis Sketch", "Amerta Botanical Gold", "Sastra Nusantara Tipografi",
  "Kopi Sedang Mobile UI", "Finansal Apex Dashboard", "Lembayung Sunset Poster",
  "Rasi Bintang Space Card", "Rona Pastel Cosmetics", "Lentera Swiss Grid #04",
  "SanaSini Map Wireframe", "Clover Mint Eco Tracker", "Selasih Tea Packaging",
  "Nataraja Dance Display", "Bumi Lestari Logo Pack", "Saka Coffee Brewer UI",
  "Aliran Gelombang Curve", "Wayang Kulit Line Art", "Batik Parang Geometry", 
  "Merapi Minimalist Land"
];

const SVG_TEMPLATES = [
  (title: string, p: string, s: string, bg: string, w: number, h: number) => `
    <svg xmlns="http://www.w3.org/2500/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
      <rect width="100%" height="100%" fill="${bg}" />
      <g transform="translate(${(w - 100)/2}, ${(h - 100)/2})">
        <circle cx="50" cy="45" r="28" fill="none" stroke="${s}" stroke-width="0.5" stroke-dasharray="2 2" />
        <circle cx="50" cy="45" r="24" fill="none" stroke="${p}" stroke-width="0.75" />
        <path d="M50,25 C43,35 37,42 50,60 C63,42 57,35 50,25" fill="${s}" opacity="0.6"/>
        <path d="M50,30 C47,38 43,45 50,56 C57,45 53,38 50,30" fill="${p}" />
        <text x="50" y="82" font-family="sans-serif" font-size="5" font-weight="950" fill="${p}" text-anchor="middle" letter-spacing="1.5">${title.toUpperCase().split(' ').slice(0, 2).join(' ')}</text>
      </g>
    </svg>
  `,
  (title: string, p: string, s: string, bg: string, w: number, h: number) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
      <rect width="100%" height="100%" fill="${bg}" />
      <g transform="translate(${(w - 100)/2}, ${(h - 130)/2})">
        <rect x="20" y="12" width="60" height="96" rx="6" fill="${p}" />
        <rect x="23" y="15" width="54" height="90" rx="4" fill="${bg}" />
        <rect x="27" y="24" width="46" height="34" rx="3" fill="${s}" opacity="0.25" />
        <circle cx="37" cy="41" r="6" fill="${p}" />
        <rect x="47" y="37" width="20" height="3" rx="1" fill="${p}" />
        <rect x="27" y="68" width="46" height="28" rx="2" fill="${s}" opacity="0.1" />
        <text x="50" y="21" font-family="sans-serif" font-size="4" font-weight="bold" fill="${p}" text-anchor="middle">${title.split(' ').slice(0, 2).join(' ')}</text>
      </g>
    </svg>
  `,
  (title: string, p: string, s: string, bg: string, w: number, h: number) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
      <rect width="100%" height="100%" fill="${bg}" />
      <g transform="translate(${(w - 100)/2}, ${(h - 100)/2})">
        <line x1="12" y1="12" x2="88" y2="12" stroke="${s}" stroke-width="0.25" opacity="0.4" />
        <line x1="12" y1="42" x2="88" y2="42" stroke="${s}" stroke-width="0.25" opacity="0.4" />
        <line x1="12" y1="72" x2="88" y2="72" stroke="${s}" stroke-width="0.25" opacity="0.4" />
        <circle cx="65" cy="55" r="18" fill="${s}" opacity="0.15" />
        <text x="15" y="28" font-family="serif" font-size="9" font-weight="900" fill="${p}">${title.split(' ')[0]}</text>
        <text x="15" y="37" font-family="serif" font-size="9" font-weight="900" fill="${p}">${title.split(' ')[1] || 'SWISS'}</text>
        <text x="15" y="52" font-family="monospace" font-size="3" fill="${p}" opacity="0.8">SWISS #0${title.length}</text>
      </g>
    </svg>
  `,
  (title: string, p: string, s: string, bg: string, w: number, h: number) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
      <rect width="100%" height="100%" fill="${bg}" />
      <g transform="translate(${(w - 100)/2}, ${(h - 100)/2})">
        <circle cx="50" cy="50" r="26" fill="none" stroke="${s}" stroke-width="4" opacity="0.15" />
        <circle cx="50" cy="50" r="26" fill="none" stroke="${p}" stroke-width="4" stroke-dasharray="110 100" stroke-linecap="round" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="${s}" stroke-width="2" stroke-dasharray="30 45" stroke-linecap="round" />
        <text x="50" y="53" font-family="sans-serif" font-size="8" font-weight="bold" fill="${p}" text-anchor="middle">82%</text>
        <text x="50" y="16" font-family="sans-serif" font-size="4" font-weight="900" fill="${p}" text-anchor="middle" letter-spacing="0.5">${title.toUpperCase().split(' ').slice(0, 2).join(' ')}</text>
      </g>
    </svg>
  `,
  (title: string, p: string, s: string, bg: string, w: number, h: number) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
      <rect width="100%" height="100%" fill="${bg}" />
      <g transform="translate(${(w - 100)/2}, ${(h - 100)/2})">
        <circle cx="50" cy="50" r="32" fill="none" stroke="${s}" stroke-width="0.5" />
        <circle cx="68" cy="38" r="10" fill="${s}" opacity="0.25" />
        <path d="M25,65 L45,40 L65,65 Z" fill="${p}" opacity="0.15" />
        <path d="M40,65 L58,45 L75,65 Z" fill="${p}" opacity="0.3" stroke="${bg}" stroke-width="1.5" />
        <line x1="20" y1="65" x2="80" y2="65" stroke="${p}" stroke-width="1" stroke-linecap="round" />
        <text x="50" y="24" font-family="sans-serif" font-size="4" font-weight="950" fill="${p}" text-anchor="middle" letter-spacing="1.5">${title}</text>
      </g>
    </svg>
  `,
  (title: string, p: string, s: string, bg: string, w: number, h: number) => `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%">
      <rect width="100%" height="100%" fill="${bg}" />
      <g transform="translate(${(w - 100)/2}, ${(h - 100)/2})">
        <circle cx="0" cy="0" r="28" fill="none" stroke="${p}" stroke-width="0.5" />
        <circle cx="0" cy="0" r="24" fill="none" stroke="${s}" stroke-width="0.5" stroke-dasharray="3 1" />
        <rect x="-18" y="-18" width="36" height="36" rx="2" fill="none" stroke="${p}" stroke-width="0.5" stroke-dasharray="1 1" />
        <rect x="-18" y="-18" width="36" height="36" rx="2" fill="none" stroke="${s}" stroke-width="0.5" transform="rotate(45)" opacity="0.5" />
        <circle cx="0" cy="0" r="4" fill="${p}" />
      </g>
      <text x="50" y="86" font-family="monospace" font-size="3" font-weight="bold" fill="${p}" text-anchor="middle" letter-spacing="1">${title.toUpperCase()}</text>
    </svg>
  `
];

const METADATA_COLORS = [
  { colors: [{ hex: "#FDFBF7", name: "Alabaster" }, { hex: "#E6C5B3", name: "Peach" }, { hex: "#A8C3B4", name: "Sage" }, { hex: "#4B534E", name: "Deep Charcoal" }], primary: "#4B534E", secondary: "#A8C3B4", bg: "#FDFBF7" },
  { colors: [{ hex: "#FFFDF6", name: "Fresh Milk" }, { hex: "#EAD0B3", name: "Susu Almond" }, { hex: "#8C6239", name: "Coffee" }, { hex: "#2D1E12", name: "Espresso" }], primary: "#2D1E12", secondary: "#8C6239", bg: "#FFFDF6" },
  { colors: [{ hex: "#FFF4E0", name: "Rice Sand" }, { hex: "#FF8A65", name: "Coral" }, { hex: "#FFB74D", name: "Mustard" }, { hex: "#3E2723", name: "Charcoal Wood" }], primary: "#3E2723", secondary: "#FF8A65", bg: "#FFF4E0" },
  { colors: [{ hex: "#F4FAF7", name: "Mint" }, { hex: "#A7F3D0", name: "Clover" }, { hex: "#10B981", name: "Forest Green" }, { hex: "#065F46", name: "Deep Spruce" }], primary: "#065F46", secondary: "#10B981", bg: "#F4FAF7" },
  { colors: [{ hex: "#FAFAF9", name: "Warm White" }, { hex: "#E7E5E4", name: "Pebble" }, { hex: "#D6D3D1", name: "Powder" }, { hex: "#292524", name: "Deep Charcoal" }], primary: "#292524", secondary: "#D6D3D1", bg: "#FAFAF9" },
  { colors: [{ hex: "#F0F7FF", name: "Sky" }, { hex: "#BFDBFE", name: "Glacier" }, { hex: "#3B82F6", name: "Ocean" }, { hex: "#1E3A8A", name: "Navy" }], primary: "#1E3A8A", secondary: "#3B82F6", bg: "#F0F7FF" }
];

export const generate100UniqueAssets = (): DesignItem[] => {
  const list: DesignItem[] = [];
  list.push(...portfolioItems);
  for (let i = portfolioItems.length; i < 100; i++) {
    const title = TITLES[i % TITLES.length] + ` #${Math.floor(i / TITLES.length) + 1}`;
    const colorPack = METADATA_COLORS[i % METADATA_COLORS.length];
    const category = ["UI/UX", "Branding", "Desain Grafis", "Tipografi", "Desain Grafis"][i % 5];
    const svgTempl = SVG_TEMPLATES[i % SVG_TEMPLATES.length];
    const svgContent = svgTempl(title, colorPack.primary, colorPack.secondary, colorPack.bg, 100, 100);
    list.push({
      id: `gen-asset-${i}`,
      title: title,
      category: category,
      description: `Rancangan draf kreatif aset presisi digital dari tim studio laboratorium seni visual kami.`,
      longDescription: `Berkas mockup digital presisi tinggi ini adalah draf orisinal ornamen linear, memadukan riset estetika Swiss modern dan sentuhan kustom istimewa untuk mendukung alur kerja Anda.`,
      image: `https://picsum.photos/seed/genassets-${i}/800/600`,
      colors: colorPack.colors,
      fonts: [
        { name: "Space Grotesk", usage: "Display Wordmark & Headings Utama", previewText: title },
        { name: "JetBrains Mono", usage: "Teks Monospace Detail", previewText: `ASSET-REFERENCE#gen-asset-${i}` }
      ],
      software: ["Adobe Illustrator", "Figma", "Photoshop"],
      elements: ["Vektor linear murni", "Sistem grid seimbang", "Siap diredesain"],
      sourceFile: `draft_asset_vector_${i}.svg`,
      aspectRatioClass: "aspect-square",
      dimensions: {
        type: "Logo Square Master",
        pixels: "2000 × 2000 px",
        ratio: "1:1",
        physical: "16.9 × 16.9 cm",
        docs: "Sempurna untuk profil media sosial & ikon aplikasi."
      },
      svgContent: svgContent
    });
  }
  return list;
};

export const allExtendedAssets = generate100UniqueAssets();

export function getSavedDesigns(): DesignItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('fanratech_designs');
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

export function saveDesigns(designs: DesignItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fanratech_designs', JSON.stringify(designs));
}

export function getSavedAssets(): DesignItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('fanratech_assets');
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

export function saveAssets(assets: DesignItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fanratech_assets', JSON.stringify(assets));
}

export const DYNAMIC_TRANSLATIONS: Record<string, {
  title: string;
  category: string;
  description: string;
  longDescription: string;
  dimensions?: {
    type: string;
    docs: string;
  };
  fonts?: { name: string; usage: string }[];
  elements?: string[];
}> = {
  "GlowUp Studio Branding": {
    title: "GlowUp Studio Branding",
    category: "Branding",
    description: "Minimalist and organic visual identity for a certified holistic beauty studio.",
    longDescription: "This branding project is designed to reflect natural elegance, hygienic wellness, and a sense of serenity. Warm pastel tones and organic sage reinforce an eco-friendly and harmonious philosophy, creating a premium yet inclusive brand image.",
    dimensions: {
      type: "Logo Square Master",
      docs: "Perfect for social media profiles & mobile app launcher icons."
    },
    fonts: [
      { name: "Playfair Display", usage: "Primary Display Wordmark & Headings" },
      { name: "Plus Jakarta Sans", usage: "Body Copy & Detail Information" }
    ],
    elements: [
      "Organic botanical floral emblem",
      "Balanced 12-column coordinate grid layout",
      "Warm tactile paper grain overlay texture",
      "Letterpress business cards with gold-foil printing finishes"
    ]
  },
  "Kopi Santai Mobile App": {
    title: "Kopi Santai Mobile App",
    category: "UI/UX",
    description: "Modern mobile app interface for ordering fresh local coffee with a seamless 2-click purchase flow.",
    longDescription: "Kopi Santai resolves long queuing times at active specialty coffee shops through a clean, nimble interactive interface. Featuring warm coffee-colored hues, ergonomic single-hand navigation coordinates, and frictionless cart transitions, it fully optimizes transaction conversion.",
    dimensions: {
      type: "Mobile App Wireframe",
      docs: "Highly responsive layouts optimized for single-hand outdoor usage."
    },
    fonts: [
      { name: "Space Grotesk", usage: "Headers, Large Card Titles, and Numeric Prices" },
      { name: "Plus Jakarta Sans", usage: "Detail Descriptions, Action Buttons, Navigation Bars" }
    ],
    elements: [
      "Large interactive tap target sizes (44px+ minimum)",
      "Smooth rounded edge card styles (rounded-2xl)",
      "Fluid checkout bottom sheet drawer transition flow",
      "Dynamic pulsing notification status indicators"
    ]
  },
  "Nusantara Food Festival": {
    title: "Nusantara Food Festival Promo",
    category: "Desain Grafis",
    description: "A cultural promotion poster combining vibrant yet eye-safe tropical illustrations and expressive display typography.",
    longDescription: "This promotional artwork celebrates local culinary heritage utilizing warm, inviting tones like soft coral, peach, and organic mustard. It prioritizes a cozy, family-friendly graphic appeal with vintage paper touch overlays, avoiding stark or artificial color contrasts.",
    dimensions: {
      type: "Standard A4 Poster",
      docs: "Engineered in high-resolution, print-ready 300 DPI layout systems."
    },
    fonts: [
      { name: "Space Grotesk", usage: "Event Title, Location details, and Schedule display" },
      { name: "Plus Jakarta Sans", usage: "Supporting announcements and sub-heading agendas" }
    ],
    elements: [
      "Handcrafted wicker plate and tumpeng vectors",
      "Faded traditional pattern accents",
      "Contemporary asymmetric whitespace layouts",
      "Recycled tactile paper tooth texture"
    ]
  },
  "EcoLife Web Dashboard": {
    title: "EcoLife Web Dashboard",
    category: "UI/UX",
    description: "Clean carbon-neutral database tracker featuring a circular metrics visualizer and intuitive layout grids.",
    longDescription: "EcoLife is conceptualized to empower individuals in tracking their daily carbon footprints. The interface combines gentle organic mint colors, clean fluid wave graphs, and spacious padding parameters to drastically reduce cognitive fatigue when analyzing heavy data streams.",
    dimensions: {
      type: "Desktop UI System",
      docs: "Asymmetric widescreen grids tailored for presentations and SaaS dashboards."
    },
    fonts: [
      { name: "Space Grotesk", usage: "Data metrics, stats, and coordinates" },
      { name: "Plus Jakarta Sans", usage: "Universal labels, descriptions, and user actions" }
    ],
    elements: [
      "Real-time donut charts summarizing system performance",
      "Low-elevation flat mini cards with clear borders",
      "Clean monochromatic vector icons set",
      "Responsive navigation structures with toggle tabs"
    ]
  },
  "Lentera Malam Poster": {
    title: "Lentera Malam Poetic Poster",
    category: "Tipografi",
    description: "A poetic typographical poster structured on a Swiss grid, celebrating local literature under precise kerning rules.",
    longDescription: "This experimental layout maps refined prose to contemporary modular Swiss grid coordinates. Relying solely on stark, high-contrast black and pebble white values, it illustrates the sheer expressfulness of strict geometric typography.",
    dimensions: {
      type: "Executive A3 Poster",
      docs: "Pristine Swiss typography guidelines with modern grid divisions."
    },
    fonts: [
      { name: "Playfair Display", usage: "Main display headings and title accents" },
      { name: "JetBrains Mono", usage: "System telemetry codes, coordinates, and metadata alignments" }
    ],
    elements: [
      "Classical linear Swiss layout structures",
      "Highly tracked, customized letter spacing rules",
      "Finely seeded stone dust overlay noise",
      "Modern hanging punctuation along margins"
    ]
  },
  "SanaSini Travel Platform": {
    title: "SanaSini Travel Platform",
    category: "UI/UX",
    description: "Widescreen hero landing page for premium adventures with smooth card transitions and ambient sky gradients.",
    longDescription: "SanaSini showcases breathtaking heritage tourism spots for both global and local travelers. The landing layout utilizes gentle morning sky blurs, asymmetric image masonry slots to trigger adventure excitement, and responsive navigation drawers optimized for mobile screens.",
    dimensions: {
      type: "Hero Landing Banner",
      docs: "Fluid wide-layout banners showcasing breathtaking visual imagery."
    },
    fonts: [
      { name: "Space Grotesk", usage: "Large Hero Title and Category menus" },
      { name: "Plus Jakarta Sans", usage: "Search overlays, dynamic fields, and testimonials" }
    ],
    elements: [
      "Floating interactive parameters selector panel",
      "Gently elevated overlay cards casting soft shadows",
      "Intelligent glass-blur header with backdrop blur filters",
      "Custom vector route path connectors"
    ]
  },
  "PHYSIS: Digital Nexus Kolaborasi Sains": {
    title: "PHYSIS: Digital Nexus Science Collaboration",
    category: "UI/UX",
    description: "A high-precision visualization interface concept designed to synthesize astrophysics data and quantum mechanics research.",
    longDescription: "Digital Nexus is an exploration of science communication and astrophysics visual data interfaces. This concept translates complex celestial coordinate structures and atomic collisions into high-contrast interactive elements with clean Swiss monospace detailing.",
    dimensions: {
      type: "Premium A2 Poster",
      docs: "Engineered in 300 DPI resolution, perfect for physical lab posters or high-definition screens."
    },
    fonts: [
      { name: "Space Grotesk", usage: "Section headings and interactive titles" },
      { name: "JetBrains Mono", usage: "Data systems, telemetry coordinates, and variables" }
    ],
    elements: [
      "Astrophysics celestial coordinate overlays",
      "Clean linear data grids",
      "Dynamic interactive particle simulations",
      "Monochromatic technical styling guidelines"
    ]
  },
  "Monolith: Simfoni Antarmuka Brutalis Kontemporer": {
    title: "Monolith: Contemporary Brutalist Interface Symphony",
    category: "UI/UX",
    description: "Brutalist web design pattern exploration emphasizing raw layout structure, massive display typography, and high-contrast lines.",
    longDescription: "An interactive interface that celebrates structural brutality, omitting smooth visual curves in favor of high-impact layouts, industrial headers, and massive display typography tailored for avant-garde portfolios.",
    dimensions: {
      type: "Desktop UI System",
      docs: "Neo-brutalist structure optimized for dark themes and heavy display hierarchies."
    },
    fonts: [
      { name: "Space Grotesk", usage: "Massive display headings and titles" },
      { name: "JetBrains Mono", usage: "Code blocks, telemetry statuses, and line markers" }
    ],
    elements: [
      "Stark black solid line borders",
      "High-impact responsive visual components",
      "Modular grid columns with strict spacing rules",
      "Asymmetric hover state animations"
    ]
  },
  "GIO: Rekonstruksi Visual Identitas Fisika Kontemporer": {
    title: "GIO: Contemporary Physics Identity Visual Reconstruction",
    category: "Branding",
    description: "A premium identity re-branding concept for a physical intelligence platform using precise vector alignments.",
    longDescription: "GIO reconstructs modern physics visual brand tokens, focusing on clean vector paths, perfect circular alignments, and deep monochromatic palettes that convey authority in advanced research environments.",
    dimensions: {
      type: "Logo Square Master",
      docs: "Scalable vector identity master system suitable for favicons and physical brand banners."
    },
    fonts: [
      { name: "Playfair Display", usage: "High-contrast serif branding wordmarks" },
      { name: "Plus Jakarta Sans", usage: "Supporting coordinates and description blocks" }
    ],
    elements: [
      "Perfect golden-ratio circle overlaps",
      "Monochromatic dark themes with slate grey accents",
      "High-contrast isolated brand mark parameters",
      "Minimalist vector emblem scaling guides"
    ]
  },
  "Monolit: Simfoni Antarmuka Brutalisme Klasik": {
    title: "Monolith: Classical Brutalism Interface Symphony",
    category: "UI/UX",
    description: "Classic desktop dashboard prototype based on neo-brutalist layouts and tight-grid systems.",
    longDescription: "A desktop interface celebrating brutalist architecture and modular page layouts, using solid black borders, crisp grids, and highly informative telemetry details.",
    dimensions: {
      type: "Desktop UI System",
      docs: "Structured admin dashboard layout optimized for clear information density."
    },
    fonts: [
      { name: "Space Grotesk", usage: "Modular widget labels and system headers" },
      { name: "JetBrains Mono", usage: "Live analytics data feeds and serial indicators" }
    ],
    elements: [
      "Tight non-overlapping widget cards",
      "Pristine solid grid coordinates overlay",
      "High-contrast state feedback loops",
      "Heavy industrial font pairing"
    ]
  },
  "Kinetik Noir: Estetika Antarmuka Kontemporer": {
    title: "Kinetik Noir: Contemporary Interface Aesthetics",
    category: "UI/UX",
    description: "Fluid motion and responsive dark-mode layout focusing on kinetic scrolling behavior and high-contrast visuals.",
    longDescription: "Kinetik Noir explores high-contrast dark user interfaces with sleek motion, precise boundaries, and bold display text configured to produce deep focus and zero distraction.",
    dimensions: {
      type: "Mobile App Wireframe",
      docs: "High-contrast dynamic interface prototype tailored for smooth touch responsiveness."
    },
    fonts: [
      { name: "Space Grotesk", usage: "Bold layout headings and interactive coordinates" },
      { name: "JetBrains Mono", usage: "Compact telemetry indicators and metadata status lines" }
    ],
    elements: [
      "Pitch black primary backgrounds",
      "Fluid scroll motion transitions",
      "Precise light borders defining viewport splits",
      "Dynamic state triggers on scroll coordinates"
    ]
  },
  "Arsitektur Proteksi Informasi Ruang Siber": {
    title: "Cyberspace Information Protection Architecture",
    category: "Desain Grafis",
    description: "A highly detailed visual diagram illustrating digital security structures and encryption tunnels.",
    longDescription: "A high-precision system diagram representing modern cybersecurity, network protection envelopes, and automated threat mitigations, conceptualized using linear golden-ratio grids.",
    dimensions: {
      type: "Poster A4 Standard",
      docs: "Optimized for widescreen architectural documentation and server room layouts."
    },
    fonts: [
      { name: "Space Grotesk", usage: "Title banners and core structural markers" },
      { name: "JetBrains Mono", usage: "Encryption matrices, network addresses, and security logs" }
    ],
    elements: [
      "Golden-ratio golden grid visual lines",
      "High-contrast vector connection paths",
      "Clean technical network structures",
      "Encrypted data tunnel schematics"
    ]
  },
  "S.H.E.L.L. - Eksplorasi Digital Arsitektur Biomimikri": {
    title: "S.H.E.L.L. - Biomimicry Architecture Digital Exploration",
    category: "Desain Grafis",
    description: "A series of organic linear ornaments inspired by maritime geometry and biomimetic structures.",
    longDescription: "S.H.E.L.L. explores natural design patterns through biomimetic algorithms, mapping organic sea structures into mathematically balanced, clean vector graphics for professional assets.",
    dimensions: {
      type: "Standard A4 Poster",
      docs: "Scalable vector ornaments suitable for modern architectural books and publications."
    },
    fonts: [
      { name: "Space Grotesk", usage: "Main display heading and visual reference" },
      { name: "JetBrains Mono", usage: "Mathematical algorithm indexes and geometry logs" }
    ],
    elements: [
      "Biomimetic geometric curves",
      "Isolated high-contrast lines",
      "Faded mathematical matrix guides",
      "Pristine organic symmetry coordinates"
    ]
  }
};

export function translateDesignItem(item: DesignItem, lang: 'id' | 'en'): DesignItem {
  if (lang === 'id' || !item) return item;
  
  const itemTitle = item.title || "";
  let key = Object.keys(DYNAMIC_TRANSLATIONS).find(k => 
    k.toLowerCase() === itemTitle.toLowerCase() || 
    itemTitle.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(itemTitle.toLowerCase())
  );
  
  if (!key && item.id && item.id.startsWith("gen-asset-")) {
    const isDesainGrafis = item.category === "Desain Grafis";
    const isTipografi = item.category === "Tipografi";
    
    return {
      ...item,
      category: isDesainGrafis ? "Graphic Design" : (isTipografi ? "Typography" : item.category),
      description: "A creative draft of dynamic, precise digital assets crafted by our visual arts laboratory studio team.",
      longDescription: "This high-precision digital mockup file is an original draft of linear ornaments, combining modern Swiss design research with pristine custom details to empower your production workflow.",
      dimensions: item.dimensions ? {
        ...item.dimensions,
        type: item.dimensions.type === "Logo Square Master" ? "Logo Square Master" : item.dimensions.type,
        docs: "Perfect for application launching icons, website watermarks, and social media branding profiles."
      } : item.dimensions
    };
  }

  if (key) {
    const trans = DYNAMIC_TRANSLATIONS[key];
    
    const transFonts = item.fonts ? item.fonts.map(font => {
      const matchFont = trans.fonts?.find(f => f.name.toLowerCase() === font.name.toLowerCase());
      return {
        ...font,
        usage: matchFont ? matchFont.usage : font.usage
      };
    }) : item.fonts;

    let transCat = trans.category;
    if (transCat === "Desain Grafis") transCat = "Graphic Design";
    if (transCat === "Tipografi") transCat = "Typography";

    return {
      ...item,
      title: trans.title,
      category: transCat,
      description: trans.description,
      longDescription: trans.longDescription,
      dimensions: item.dimensions ? {
        ...item.dimensions,
        type: trans.dimensions?.type || item.dimensions.type,
        docs: trans.dimensions?.docs || item.dimensions.docs
      } : item.dimensions,
      fonts: transFonts,
      elements: trans.elements || item.elements
    };
  }
  
  let finalCat = item.category;
  if (finalCat === "Desain Grafis") finalCat = "Graphic Design";
  if (finalCat === "Tipografi") finalCat = "Typography";

  return {
    ...item,
    category: finalCat
  };
}


