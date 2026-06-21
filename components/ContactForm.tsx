'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function ContactForm() {
  const { lang, t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Kolaborasi Proyek');
  const [message, setMessage] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissionError, setSubmissionError] = useState('');
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState('');
  const [countdown, setCountdown] = useState(15);

  // Auto-revert countdown when message is successfully sent
  useEffect(() => {
    if (status !== 'success') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStatus('idle');
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Client-side sanitization check to prevent any script or code block injections
  const sanitizeClientValue = (val: string): string => {
    return val.replace(/<[^>]*>/g, "").trim();
  };

  const validateEmailFormat = (inputEmail: string): boolean => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(inputEmail)) return false;
    
    const parts = inputEmail.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError('');

    const cleanName = sanitizeClientValue(name);
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = sanitizeClientValue(message);

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setSubmissionError(t(
        'Harap lengkapi semua kolom formulir (Nama, Email, dan Pesan).',
        'Please complete all form fields (Name, Email, and Message).'
      ));
      setStatus('error');
      return;
    }

    if (!validateEmailFormat(cleanEmail)) {
      setSubmissionError(t(
        'Silakan masukkan format email yang benar (misal: nama@domain.com).',
        'Please enter a valid email address structure (e.g., name@domain.com).'
      ));
      setStatus('error');
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      setSubmissionError(t(
        'Nama harus memiliki panjang antara 2 hingga 100 karakter.',
        'Name length must be between 2 and 100 characters.'
      ));
      setStatus('error');
      return;
    }

    if (cleanMessage.length < 5 || cleanMessage.length > 1500) {
      setSubmissionError(t(
        'Isi pesan harus memiliki panjang antara 5 hingga 1500 karakter.',
        'Message length must be between 5 and 1500 characters.'
      ));
      setStatus('error');
      return;
    }

    setStatus('submitting');
    
    const generatedId = `FR-${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: "5ef9c60b-807b-4b32-acdb-959c433b4196",
          name: "Form Kontak FanraTech",
          email: cleanEmail,
          subject: `[Kemitraan Baru] ${subject} - ${cleanName} (#${generatedId})`,
          from_name: "FanraTech Hub",
          message: `Halo Fanra & Tim FanraTech,

Seseorang yang luar biasa ingin terhubung dengan Anda melalui situs resmi FanraTech! Berikut adalah rincian pesan kolaborasi yang baru saja masuk:

==================================================
  PROFIL PENULIS PESAN
==================================================
• Nama Lengkap : ${cleanName}
• Alamat Email : ${cleanEmail}
• Topik Utama  : ${subject}
• Kode Lacak   : #${generatedId}

==================================================
  ISI GAGASAN / PESAN KOLABORASI
==================================================
"${cleanMessage}"

==================================================

Pesan ini dirangkum secara otomatis oleh sistem integrasi kontak FanraTech. Silakan tekan 'Balas' (Reply) langsung pada email ini untuk menjalin komunikasi interaktif lebih lanjut bersama ${cleanName}.

Salam hangat penuh kreativitas,
Sistem Notifikasi Kemitraan FanraTech`,
          replyto: cleanEmail
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setTrackingId(generatedId);
        setCountdown(15);
        setStatus('success');
        setSentMessage(t(
          `Terima kasih! Pesan Anda telah berhasil terkirim. Gagasan Anda akan segera ditinjau dan dikoordinasikan secara profesional dengan tanggapan terbaik secepatnya.`,
          `Thank you! Your message has been sent successfully. Your proposal will be reviewed immediately and we will coordinate professional feedback as soon as possible.`
        ));
        
        // Clear all states on successful transmission
        setName('');
        setEmail('');
        setSubject('Kolaborasi Proyek');
        setMessage('');
      } else {
        setSubmissionError(resData.message || t(
          'Terjadi gangguan pengiriman dari Web3Forms. Silakan hubungi langsung ke alamat korespondensi kami.',
          'An transmission error occurred with Web3Forms. Please write to us via correspondence directly instead.'
        ));
        setStatus('error');
      }
    } catch (err) {
      console.error("Direct transmission error:", err);
      setSubmissionError(t(
        'Gagal menghubungi jalur email. Periksa koneksi internet Anda atau coba lagi.',
        'Failed to establish connection. Please check your network or try again.'
      ));
      setStatus('error');
    }
  };

  return (
    <section id="kontak" className="py-20 bg-slate-50 relative overflow-hidden">
      {/* Container Gambar Latar Belakang yang disesuaikan */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        {/* Gambar background: Diturunkan sedikit (translate-y-8), opacity 60% */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60 transform translate-y-8"
          style={{ 
            backgroundImage: `url('https://res.cloudinary.com/dew39kqhy/image/upload/f_auto,q_auto/v1779566286/ChatGPT_Image_24_Mei_2026_02.57.52_qx8p56.png')`,
          }}
        />
        {/* Gradasi Atas (menyatu secara sempurna dengan halaman atas - gradasi tebal) */}
        <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-slate-50 via-slate-50/95 via-slate-50/40 to-transparent" />
        {/* Gradasi Bawah (menyatu dengan halaman bawah / footer - gradasi tebal) */}
        <div className="absolute bottom-0 inset-x-0 h-80 bg-gradient-to-t from-slate-50 via-slate-50/95 via-slate-50/40 to-transparent" />
      </div>

      {/* Decorative Blur Ambient Blobs */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-slate-200/20 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-72 h-72 bg-slate-200/10 rounded-full filter blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 select-none">
        
        {/* Simplified Header - transformed strictly to "Kirim Pesan" representation */}
        <div className="text-center space-y-3 mb-12 max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display font-medium text-slate-900 tracking-tight leading-tight">
            {lang === 'id' ? 'Kirim' : 'Send'}{' '}
            <span className="font-extrabold text-[#111827]">{lang === 'id' ? 'Pesan' : 'Message'}</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-sans">
            {t(
              'Apakah Anda memerlukan perancangan identitas visual brand, UI profesional untuk aplikasi Anda, atau poster promosi kreatif? Isi formulir aman di bawah ini untuk mendiskusikan gagasan terbaik Anda bersama kami.',
              'Do you need a compelling brand identity, professional app user interface design, or creative advertising posters? Fill out the secure form below to co-create with us.'
            )}
          </p>
        </div>

        {/* Centered Single Panel Form Block - Fully Responsive layout */}
        <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/30">
          
          {/* Centered Brand Title of FanraTech within Form Block */}
          <div className="flex justify-center border-b border-slate-100 pb-3.5 mb-6">
            <span className="font-lobster text-lg tracking-wide select-none">
              <span className="text-[#111827]">Fanra</span>
              <span className="text-[#94A3B8]">Tech</span>
            </span>
          </div>

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 px-4 rounded-xl flex flex-col items-center text-center space-y-5"
              >
                <div className="w-16 h-16 shrink-0 flex items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 shadow-xs">
                  <Image 
                    src="https://cdn-icons-png.flaticon.com/128/12503/12503776.png" 
                    alt="Success" 
                    width={40}
                    height={40}
                    className="object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-4 max-w-md flex flex-col items-center">
                  <h4 className="font-display font-extrabold text-[#111827] text-lg">
                    {t('Pesan Berhasil Terkirim!', 'Message Sent Successfully!')}
                  </h4>
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full font-mono text-[10px] sm:text-xs text-[#111827] font-bold">
                    <span className="text-slate-500 font-semibold">{t('ID Pelacakan:', 'Tracking ID:')}</span>
                    <span className="text-[#111827]">#{trackingId}</span>
                  </div>
                  <p className="text-slate-500 text-xs sm:text-[13px] font-sans leading-relaxed">
                    {sentMessage}
                  </p>
                </div>
                
                <div className="pt-2 flex flex-col items-center gap-1">
                  <button
                    id="btn-kirim-lagi"
                    onClick={() => {
                      setStatus('idle');
                      setCountdown(15);
                    }}
                    className="text-xs font-bold text-slate-800 hover:text-black hover:underline cursor-pointer transition py-1 bg-transparent border-0 focus:outline-none"
                  >
                    {t('Kirim Pesan Lainnya', 'Send Another Message')}
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {lang === 'id' 
                      ? `Formulir otomatis kembali dalam ${countdown} detik` 
                      : `Form resets automatically in ${countdown} seconds`
                    }
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.form
                layout
                onSubmit={handleSubmit}
                className="space-y-4.5"
              >
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{submissionError || t('Harap isi semua kolom formulir dengan benar.', 'Please complete all form fields correctly.')}</span>
                  </motion.div>
                )}

                {/* Name & Email Grid - max-length enforced, strict domain & lowercasing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t('Nama Lengkap', 'Full Name')}
                    </label>
                    <input
                      type="text"
                      id="contact-name"
                      maxLength={100}
                      value={name}
                      onChange={(e) => {
                        const filteredValue = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        setName(filteredValue);
                      }}
                      suppressHydrationWarning
                      placeholder={t('Misal: Fanra Aditri', 'e.g. Fanra Aditri')}
                      className="w-full px-4 h-11 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-[#111827] focus:bg-white rounded-xl text-sm outline-none transition duration-200 text-slate-800"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t('Alamat Email', 'Email Address')}
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      maxLength={120}
                      value={email}
                      onChange={(e) => setEmail(e.target.value.toLowerCase())}
                      suppressHydrationWarning
                      placeholder={t("nama@perusahaan.com", "name@company.com")}
                      className="w-full px-4 h-11 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-[#111827] focus:bg-white rounded-xl text-sm outline-none transition duration-200 text-slate-800 lowercase"
                      required
                    />
                  </div>
                </div>

                {/* Subject dropdown - touch target >= 44px */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-subject" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {t('Topik Kolaborasi', 'Collaboration Subject')}
                  </label>
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    suppressHydrationWarning
                    className="w-full px-4 h-11 bg-slate-50 border border-slate-200 focus:border-[#111827] focus:bg-white rounded-xl text-sm outline-none transition duration-200 text-slate-700 cursor-pointer"
                  >
                    <option value="Kolaborasi Proyek">{t("Kolaborasi Proyek (Desain Baru)", "Project Collaboration (New Design)")}</option>
                    <option value="Desain Website / App UI">{t("Desain Website / Antarmuka Aplikasi", "Website / App UI Design")}</option>
                    <option value="Branding & Logo identity">{t("Branding & Logo Identitas", "Branding & Logo Identity")}</option>
                    <option value="Pekerjaan Lepas / Freelance">{t("Pekerjaan Lepas / Freelance", "Freelance Assignment")}</option>
                    <option value="Tanya Sesuatu">{t("Hanya Ingin Bertanya", "Just Inquiring")}</option>
                  </select>
                </div>

                {/* Message body - enforced length limits */}
                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {t('Detail Pesan Anda', 'Your Message Details')}
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    maxLength={1500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    suppressHydrationWarning
                    placeholder={t(
                      "Jelaskan gagasan atau pertanyaan proyek Anda secara mendalam di sini...",
                      "Explain your design blueprints or project requirements thoroughly here..."
                    )}
                    className="w-full p-4 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-[#111827] focus:bg-white rounded-xl text-sm outline-none transition duration-200 resize-none min-h-[100px] text-slate-800"
                    required
                  />
                  <div className="flex justify-end text-[10px] text-slate-400 font-mono">
                    {message.length} / 1500 {lang === 'id' ? 'karakter' : 'characters'}
                  </div>
                </div>

                {/* Button trigger with transparent background, dark text, and dark icon as requested (No box design) */}
                <button
                  type="submit"
                  id="submit-contact-form"
                  disabled={status === 'submitting'}
                  suppressHydrationWarning
                  className={`w-full h-12 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2.5 transition duration-200 cursor-pointer ${
                    status === 'submitting'
                      ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-0'
                      : 'bg-transparent text-[#111827] hover:bg-slate-50 border-0'
                  }`}
                >
                  {status === 'submitting' ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{t('Mengirimkan...', 'Sending...')}</span>
                    </>
                  ) : (
                    <>
                      <Image 
                        src="https://cdn-icons-png.flaticon.com/128/9290/9290348.png" 
                        alt="Kirim" 
                        width={18}
                        height={18}
                        className="object-contain brightness-0"
                        referrerPolicy="no-referrer"
                      />
                      <span>{t('KIRIM PESAN', 'SEND MESSAGE')}</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
