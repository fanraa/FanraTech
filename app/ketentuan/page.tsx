'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function KetentuanLayanan() {
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
            {t("Dokumen Ketentuan Penggunaan", "Usage Terms Document")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-slate-900 tracking-tight leading-tight">
            {t("Ketentuan Layanan", "Terms of Service")}
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
                Selamat datang di <strong>FanraTech</strong>. Harap baca seluruh aturan dan ketentuan penggunaan platform portofolio visual kami di bawah ini. Dengan terus mengakses dan menggunakan situs ini, Anda setuju untuk terikat secara sah serta patuh terhadap ketentuan operasional yang berlaku tanpa pengecualian.
              </p>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">1.</span> Tujuan Penggunaan Portofolio
                </h2>
                <p>
                  Platform ini beroperasi sebagai pusat katalog portofolio kreatif yang menayangkan hasil karya desain visual, ilustrasi, rancangan antarmuka (UI/UX), dan eksperimen berekstensi vektor (SVG) murni yang dibuat oleh tim FanraTech. Akses terhadap platform diberikan gratis kepada publik sebagai sarana inspirasi dan berbagi pengetahuan.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">2.</span> Lisensi Penggabungan & Pengunduhan Aset
                </h2>
                <p className="mb-2">
                  Sebagian besar karya dalam portofolio kami dilengkapi dengan tautan pengunduhan langsung (terutama berkas SVG murni) agar para desainer, pengembang web, serta kawan-kawan sealiran dapat belajar dan memanfaatkannya. Aturan penggunaannya adalah:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>Bebas Hak Cipta (Copyleft):</strong> Semua aset yang Anda temukan dan unduh bebas digunakan sebagai bahan referensi desain pribadi, latihan pengodingan, pembuatan situs portofolio non-komersial, proyek edukasi, atau riset pribadi.</li>
                  <li><strong>Larangan Diperjualbelikan:</strong> Anda dilarang keras menjual kembali, mengomersialkan, atau mendistribusikan aset-aset visual tersebut secara mentahan untuk mendapatkan keuntungan materi murni tanpa perubahan substansial atau izin tertulis langsung dari FanraTech.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">3.</span> Hak Atribusi Karya
                </h2>
                <p>
                  Meskipun berkas desain ini bebas diambil, kami sangat mengapresiasi dan menyarankan tindakan tulus pemberian atribusi (mention credit) berupa pencatatan nama &ldquo;FanraTech&rdquo; jika Anda membagikan ulang aset desain kami di proyek publik Anda sendiri untuk menghargai usaha kreasi murni desain tersebut.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">4.</span> Batasan Tanggung Jawab
                </h2>
                <p>
                  Materi ilustrasi dan sketsa visual di platform ini disediakan &ldquo;sebagaimana adanya&rdquo;. Kami tidak bertanggung jawab secara hukum atas ketidakcocokan visual, kesalahan rendering peramban Anda, atau segala bentuk kerugian tidak langsung yang ditimbulkan oleh penerapan aset desain visual kami di luar lingkup FanraTech.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">5.</span> Perubahan Ketentuan Layanan
                </h2>
                <p>
                  FanraTech berhak mengubah isi syarat penggunaan ini kapan pun dirasa perlu. Pihak kami tidak berkewajiban memberikan notifikasi khusus sebelumnya selain memperbarui tanggal rilis dokumen di atas layar.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/50">
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5">
                  Pertanyaan Lebih Lanjut
                </h2>
                <p className="mb-3">
                  Apabila kawan-kawan memiliki pertanyaan lebih dalam terkait kebijakan penggunaan aset, ingin mengajukan kolaborasi khusus, atau kerja sama desain kelas korporat, silakan sampaikan keluhan Anda:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5 text-slate-500 font-mono text-[11px]">
                  <div><strong className="text-slate-700">Email:</strong> irfanrizkiaditri@gmail.com</div>
                  <div><strong className="text-slate-700">Subjek:</strong> [KETENTUAN] Pertanyaan Ketentuan Layanan FanraTech</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p>
                Welcome to <strong>FanraTech</strong>. Please review all terms and conditions of using our visual portfolio platform below. By continuing to access and browse this site, you agree to be legally bound by and comply with the following operational rules without exception.
              </p>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">1.</span> Purpose of the Portfolio
                </h2>
                <p>
                  This platform operates as a creative catalog center to document and broadcast achievements in visual design, custom illustrations, UI/UX conceptual flow layouts, and raw vector assets (SVG) crafted by the FanraTech team. Access is public and free of charge as a way to inspire fellow developers and designers.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">2.</span> Free Asset Downloads & License Boundaries
                </h2>
                <p className="mb-2">
                  Most design entries inside our portfolio provide direct functional download integrations (mainly high-quality SVG codes) so fellow developers, designers, and friends can learn from and build upon them. The usage rules are:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li><strong>Free of Strict Copyright:</strong> All downloadable visual assets you find are free to utilize as personal references, code styling practice benchmarks, educational mockups, or non-commercial private portfolio sites.</li>
                  <li><strong>Strictly Non-Saleable:</strong> You are strictly forbidden from reselling, publishing commercial stock bundles, or capitalizing directly on these raw files to extract unilateral financial profits without our clear prior consent.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">3.</span> Attribution Recommendation
                </h2>
                <p>
                  While these files are free of license locks, we highly appreciate and suggest a voluntary, gentlemanly credit attribution mentioning &ldquo;FanraTech&rdquo; when embedding or showing our visual work in your active public repositories or drafts. This values the genuine hard work invested in these pixels.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">4.</span> Disclaimer of Liability
                </h2>
                <p>
                  All illustrations, assets, and design mockups are provided on an &ldquo;as is&rdquo; basis. We hold no liability for visual mismatches, rendering glitches in outdated browsers, or any logical losses originating from the integration of these materials outside our secure system.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">5.</span> Term Modifications
                </h2>
                <p>
                  FanraTech retains full discretion to update these terms at any moment. There is no duty to distribute global prior warnings other than modifying the revision timestamp shown above.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/50">
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5">
                  Further Inquiries
                </h2>
                <p className="mb-3">
                  If you have inquiries regarding terms of use, specific commercial license contracts, or wish to commission custom design sprints, feel free to pitch us:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5 text-slate-500 font-mono text-[11px]">
                  <div><strong className="text-slate-700">Email:</strong> irfanrizkiaditri@gmail.com</div>
                  <div><strong className="text-slate-700">Subject Line:</strong> [TERMS] FanraTech Terms of Service Inquiry</div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Short Legal Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            © 2026 FanraTech. {t("Seluruh Hak Cipta Dilindungi.", "All Rights Reserved.")}
          </p>
        </div>

      </div>
    </main>
  );
}
