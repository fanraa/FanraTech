'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function HakCipta() {
  const { lang, t } = useLanguage();

  return (
    <main className="relative min-h-screen bg-[#F9FAFB] text-[#111827] overflow-x-hidden font-sans select-none pb-24">
      
      {/* 1. TOP BACKGROUND DECORATION */}
      <div className="absolute top-0 left-0 right-0 h-[65vh] z-0 pointer-events-none select-none">
        <div className="block sm:hidden absolute inset-0">
          <Image
            src="https://res.cloudinary.com/dew39kqhy/image/upload/f_auto,q_auto/v1779471631/ChatGPT_Image_23_Mei_2026_00.39.40_mw7xwo.png"
            alt="Top background pattern mobile"
            fill
            sizes="(max-width: 640px) 100vw, 1px"
            className="object-cover object-top"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
        <div className="hidden sm:block absolute inset-0">
          <Image
            src="https://res.cloudinary.com/dew39kqhy/image/upload/f_auto,q_auto/v1779470340/ChatGPT_Image_23_Mei_2026_00.18.48_lpgxk6.png"
            alt="Top background pattern desktop"
            fill
            sizes="(min-width: 640px) 100vw, 1px"
            className="object-cover object-top"
            referrerPolicy="no-referrer"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F9FAFB]/80 to-[#F9FAFB] z-10" />
      </div>

      {/* 2. BOTTOM BACKGROUND DECORATION */}
      <div className="absolute bottom-0 left-0 right-0 h-[400px] z-0 pointer-events-none select-none">
        <div className="block sm:hidden absolute inset-0">
          <Image
            src="https://res.cloudinary.com/dew39kqhy/image/upload/f_auto,q_auto/v1779471684/ChatGPT_Image_23_Mei_2026_00.41.11_flm4s7.png"
            alt="Footer background decoration mobile"
            fill
            sizes="(max-width: 640px) 100vw, 1px"
            className="object-cover object-bottom"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="hidden sm:block absolute inset-0">
          <Image
            src="https://res.cloudinary.com/dew39kqhy/image/upload/f_auto,q_auto/v1779467230/ChatGPT_Image_22_Mei_2026_23.26.12_erhifx.png"
            alt="Footer background decoration desktop"
            fill
            sizes="(min-width: 640px) 100vw, 1px"
            className="object-cover object-bottom"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#F9FAFB]/90 via-[#F9FAFB]/75 to-[#F9FAFB] z-10" />
      </div>

      {/* 3. CORE LEGAL CONTENT PANEL */}
      <div className="max-w-3xl mx-auto px-6 pt-12 relative z-20">
        
        {/* Elegant Top Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-200/50 pb-6 mb-12">
          <Link 
            href="/"
            className="flex items-center gap-2 group text-xs font-bold text-slate-500 hover:text-[#111827] transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>
              {t("Kembali ke Beranda", "Back to Home")}
            </span>
          </Link>

          <span className="font-lobster text-lg text-[#111827]">
            Fanra<span className="text-slate-400 font-normal">Tech</span>
          </span>
        </div>

        {/* Display Typography Header */}
        <div className="mb-10 text-left">
          <p className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-extrabold mb-1.5">
            {t("Dokumen Hak Cipta & Lisensi", "Copyright & License Document")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-slate-900 tracking-tight leading-tight">
            {t("Hak Cipta & Lisensi Karya", "Copyright & Creative License")}
          </h1>
          <p className="text-[11px] text-slate-400 font-mono mt-2">
            {t("Terakhir diperbarui: 21 Juni 2026", "Last updated: June 21, 2026")}
          </p>
        </div>

        {/* Legal Text body */}
        <div className="text-xs sm:text-[13px] text-slate-600 leading-relaxed space-y-7 text-justify select-text">
          
          {lang === 'id' ? (
            <>
              <p>
                Platform <strong>FanraTech</strong> dibangun sebagai wadah apresiasi murni terhadap keindahan komunikasi visual. Komitmen utama kami adalah mendukung pertumbuhan ekosistem desain dengan membagikan karya visual yang independen, orisinal, serta terbuka bagi siapa pun untuk berkreasi.
              </p>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">1.</span> Filosofi Copyleft Bebas Lisensi
                </h2>
                <p>
                  Seluruh aset visual, kombinasi bentuk geometris, serta berkas vektor (SVG) yang dipublikasikan di dalam portofolio FanraTech ini bersifat bebas royalti dan <strong>bebas hak cipta konvensional</strong>. Kawan-kawan sekalian diperbolehkan langsung mengunduh, mengambil, menyalin, memodifikasi bentuknya, dan memanfaatkannya sebagai bahan inspirasi desain maupun referensi pembuatan visual web Anda tanpa memerlukan lisensi berbayar.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">2.</span> Ketentuan Wajib: Larangan Komersialisasi
                </h2>
                <p className="mb-2">
                  Format kebebasan lisensi di situs ini diatur di bawah syarat mutlak perlindungan karya, yaitu:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>TIDAK UNTUK DIPERJUALBELIKAN:</strong> Anda dilarang keras mengompilasi ulang aset-aset visual, berkas gambar, atau kode SVG mentah dari situs ini untuk dijual kembali, ditaruh di dalam produk kit template desain visual komersial berbayar (UI Kit, Bundel Vektor, Stock Assets), atau didistribusikan ulang demi mengekstrak keuntungan material pribadi/kelompok.</li>
                  <li><strong>Penggunaan Sebagai Referensi & Edukasi:</strong> Aset-aset visual ditujukan murni untuk meningkatkan kapabilitas estetika belajar bersama, merancang purwarupa non-profit, proyek sekolah/kampus, atau sebagai basis referensi inspirasional dalam berkarya.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">3.</span> Etika Penghargaan Atribusi
                </h2>
                <p>
                  Meskipun kami tidak mengunci karya kami dengan sistem hak cipta yang kaku, kami sangat menghargai etika kepenulisan yang tulus. Kami menyarankan Anda untuk berkenan mencantumkan tulisan atribusi sederhana berupa kredit penulisan &ldquo;Aset oleh FanraTech&rdquo; jika Anda memperlihatkan karya desain kami di hadapan khalayak umum.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">4.</span> Laporan Pelanggaran Hak Cipta (Take-Down)
                </h2>
                <p>
                  FanraTech berkomitmen melahirkan karya visual orisinal bersumber daya murni. Jika Anda mendeteksi adanya bagian minor dari pola ilustrasi kami yang secara tidak sengaja menyerupai atau memiiki konflik kepentingan dengan lisensi terdaftar hak cipta pihak ketiga milik Anda, silakan berdiskusi baik-baik dengan kami untuk mendapatkan penanganan bersahabat (verifikasi orisinalitas/take-down) secara instan.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/50">
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5">
                  Korespondensi Lisensi Aset
                </h2>
                <p className="mb-3">
                  Silakan layangkan pesan jika kawan-kawan memerlukan izin kerja sama tertulis khusus untuk integrasi komersial berlisensi penuh, silakan hubungi kreator:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5 text-slate-500 font-mono text-[11px]">
                  <div><strong className="text-slate-700">Email:</strong> irfanrizkiaditri@gmail.com</div>
                  <div><strong className="text-slate-700">Subjek:</strong> [LISENSI] Atribusi Khusus Karya Desain FanraTech</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p>
                The <strong>FanraTech</strong> platform is built as a home of genuine appreciation for the beauty of visual communication. Our main commitment is to support the growth of the creative ecosystem by sharing visual works that are independent, original, and open for anyone to explore.
              </p>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">1.</span> Free Copyleft Licensing Philosophy
                </h2>
                <p>
                  All visual assets, geometry pairings, and raw vector files (SVG) published in the FanraTech portfolio are royalty-free and <strong>free of conventional copyright locks</strong>. You are completely welcome to download, grab, modify, and integrate these files as your visual guidelines, programming mockups, or web design references without paying any licensing fees.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">2.</span> Mandatory Requirement: Non-Commercial Clause
                </h2>
                <p className="mb-2">
                  This free-to-use licensing flexibility operates under a strict, non-negotiable clause protecting the visual craft:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>NOT FOR RESALE OR COMMERCIALIZATION:</strong> You are strictly forbidden from repackaging these visual assets, image layouts, or raw SVG files to resell them on stock markets, integrate them into commercial design template web kits, or distribute them specifically to extract individual/group monetary profit.</li>
                  <li><strong>Reference & Educational Scope:</strong> These visual assets are distributed solely to enhance educational design practices, non-profit design prototyping, student coursework, or as inspiration benchmarks for your creative workflows.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">3.</span> Gentlemanly Attribution Practice
                </h2>
                <p>
                  While we don't lock our creations with rigid copyright blockades, we deeply appreciate visual manners. We recommend placing a basic attribution tag saying &ldquo;Assets by FanraTech&rdquo; if you decide to showcase or use our original art in a public repository or client mockup presentation.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">4.</span> Copyright Infringement & Takedown Protocol
                </h2>
                <p>
                  FanraTech aims to craft visually genuine pieces. If you pinpoint a minor portion of our design patterns that accidentally mimics or conflicts with a registered trademark or third-party license owned by you, please open a constructive dialogue with us so that we can verify and offer a rapid, friendly takedown solution.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/50">
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5">
                  Asset License Correspondence
                </h2>
                <p className="mb-3">
                  If you require dedicated written permissions or specialized commercial clearance letters, please write to our lead creator:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5 text-slate-500 font-mono text-[11px]">
                  <div><strong className="text-slate-700">Main Email:</strong> irfanrizkiaditri@gmail.com</div>
                  <div><strong className="text-slate-700">Subject:</strong> [LICENSE] Custom Licensing Clarification - FanraTech</div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Short Legal Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            © 2026 FanraTech. {t("Seluruh Hak Cipta Dilindungi Undang-Undang.", "All Creative Rights Protected Under Copyleft Terms.")}
          </p>
        </div>

      </div>
    </main>
  );
}
