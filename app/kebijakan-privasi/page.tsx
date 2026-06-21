'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function KebijakanPrivasi() {
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
            {t("Dokumen Resmi Kebijakan", "Official Policy Document")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-sans font-semibold text-slate-900 tracking-tight leading-tight">
            {t("Kebijakan Privasi", "Privacy Policy")}
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
                Selamat datang di <strong>FanraTech</strong>. Kami sangat menghargai kenyamanan dan kepercayaan Anda sebagai pengunjung portofolio kreatif kami. Kebijakan Privasi ini dirancang secara transparan untuk membantu Anda memahami bagaimana platform ini beroperasi demi melindungi privasi Anda selama menjelajahi karya visual kami.
              </p>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">1.</span> Latar Belakang Platform
                </h2>
                <p>
                  Situs ini berfungsi murni sebagai portofolio pribadi untuk mendokumentasikan serta memamerkan ragam kreativitas eksplorasi desain, ilustrasi vektor murni, dan arsitektur UI/UX yang telah kami buat. Kami tidak menjalankan operasi komersial transaksional langsung di situs ini, sehingga penanganan privasi dikondisikan seminim mungkin untuk kenyamanan bersama.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">2.</span> Penggunaan Aset Bebas Copyleft (Tanpa Copyright)
                </h2>
                <p>
                  Kami meyakini bahwa berbagi inspirasi visual dapar memicu pertumbuhan ekosistem kreatif. Oleh karena itu, aset desain visual dan karya yang kami tampilkan di situs ini bebas diambil, digunakan kembali, serta dijadikan referensi desain oleh Anda. Namun, demi melindungi orisinalitas karya, aset-aset ini diberikan dengan syarat mutlak: <strong>tidak diperbolehkan untuk diperjualbelikan kembali dalam bentuk apa pun</strong> tanpa izin kerja sama resmi kami.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">3.</span> Informasi yang Kami Simpan Secara Lokal
                </h2>
                <p className="mb-2">
                  Kami mengusung prinsip <em>offline-first</em> untuk mengurangi lalu lintas data yang tidak perlu di jaringan awan. Informasi yang disimpan di sistem lokal peramban Anda melalui <code>localStorage</code> meliputi:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>Preferensi pilihan bahasa operasional Anda (Indonesia / Inggris).</li>
                  <li>Daftar simpanan aset desain portofolio (fitur bookmark) agar Anda dapat membacanya kembali sewaktu-waktu di perangkat yang sama.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">4.</span> Kontak dan Formulir Pesan
                </h2>
                <p>
                  Ketika Anda secara sukarela mengisi formulir pesan kontak atau berpartisipasi dalam daftar antrean (waitlist) kolaborasi, kami menyimpan detail informasi seperti nama dan alamat email semata-mata untuk membalas korespondensi Anda secara langsung, bukan untuk didistribusikan kepada pihak pemasar pihak ketiga.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">5.</span> Perubahan Kebijakan
                </h2>
                <p>
                  Kami dapat memperbarui kebijakan privasi ini secara berkala demi menyesuaikan dengan fungsionalitas visual yang sedang berkembang di situs FanraTech. Setiap pembaruan akan langsung kami cantumkan pada halaman ini.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/50">
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5">
                  Hubungi Hubungan Privasi
                </h2>
                <p className="mb-3">
                  Apabila Anda ingin berkonsultasi mengenai pengelolaan privasi atau hak cipta aset di situs FanraTech, silakan hubungi kami:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5 text-slate-500 font-mono text-[11px]">
                  <div><strong className="text-slate-700">Email:</strong> irfanrizkiaditri@gmail.com</div>
                  <div><strong className="text-slate-700">Respons:</strong> Maksimal 3 x 24 jam hari kerja</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <p>
                Welcome to <strong>FanraTech</strong>. We deeply appreciate your comfort and trust as a visitor of our creative portfolio. This Privacy Policy is designed transparently to help you understand how this platform operates to protect your privacy while you explore our visual creations.
              </p>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">1.</span> Platform Background
                </h2>
                <p>
                  This site serves purely as a personal portfolio to document and showcase our range of design exploration, raw vector illustrations, and UI/UX layouts. We do not run automated commercial transaction operations directly on this site, keeping the data handling minimal for your ultimate smooth browsing experience.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">2.</span> Free-to-Use Asset License (No Restrictive Copyright)
                </h2>
                <p>
                  We believe that sharing visual inspiration can fuel the growth of the creative ecosystem. Therefore, the visual assets and designs we display on this site are free for you to take, modify, and use as inspiration references. However, to preserve creative integrity, these assets are granted on one strict condition: <strong>reselling or commercializing these raw assets in any form is strictly forbidden</strong> without our official written partnership.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">3.</span> Information We Store Locally
                </h2>
                <p className="mb-2">
                  We adopt an <em>offline-first</em> standard to reduce unnecessary cloud transfer payloads. The information stored inside your local browser via <code>localStorage</code> includes:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2">
                  <li>Your preferred operational language selection (Indonesian / English).</li>
                  <li>Your bookmarked design portfolio configurations so you can view them anytime on the same device.</li>
                </ul>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">4.</span> Contact and Message Forms
                </h2>
                <p>
                  When you voluntarily fill out the communication forms or participate in our collaboration queue (waitlist), we store your details such as name and email address. This is solely to respond directly to your correspondence and is never sold or distributed to third-party ad networks.
                </p>
              </div>

              <div>
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5 flex items-center gap-2">
                  <span className="text-[#111827]">5.</span> Policy Modifications
                </h2>
                <p>
                  We may adjust this policy dynamically as the user experience of FanraTech grows. Every single update will be made accessible instantly on this page.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200/50">
                <h2 className="font-sans font-bold text-slate-900 text-sm mb-2.5">
                  Privacy Correspondence
                </h2>
                <p className="mb-3">
                  If you have inquiries regarding privacy or asset usage protocols on the FanraTech platform, feel free to contact us:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5 text-slate-500 font-mono text-[11px]">
                  <div><strong className="text-slate-700">Email:</strong> irfanrizkiaditri@gmail.com</div>
                  <div><strong className="text-slate-700">Response Rate:</strong> Up to 3 business days</div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Short Legal Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            © 2026 FanraTech. {t("Dokumen Resmi Hukum & Kepatuhan Visual.", "Official Legal & Visual Compliance Document.")}
          </p>
        </div>

      </div>
    </main>
  );
}
