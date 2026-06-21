'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

const QUOTES_ID = [
  "Aset desain yang unggul selalu berbicara tanpa berteriak. Kesederhanaan, keterbacaan, dan proporsi simetris adalah pilar utama karya seni visual saya dalam melayani audiens.",
  "Estetika sejati lahir dari keberanian membuang yang tidak perlu. Desain minimalis memberikan ruang bagi pikiran untuk bernapas secara lega.",
  "Di balik setiap piksel yang presisi, ada struktur fungsional yang kokoh. Keindahan sejati tidak pernah mengorbankan kegunaan produk asli.",
  "Warna monokromatik bukan sekadar ketiadaan warna, melainkan keberanian mengeksplorasi kedalaman kontras, cahaya, dan bayangan murni.",
  "Tipografi bukan sekadar teks untuk dibaca, melainkan suara visual yang memiliki irama, karakter sejati, dan jiwa estetis mendalam.",
  "Proporsi geometris dan keseimbangan visual adalah bahasa universal yang menjembatani karya seni murni dengan kebutuhan fungsional harian.",
  "Karya desain terbaik adalah yang menginspirasi tindakan tulus tanpa paksaan, menyampaikan pesan secara sangat jernih dan jujur.",
  "Melalui ketelitian piksel demi piksel, FanraTech berkomitmen melahirkan karya digital yang abadi dan tulus melayani kenyamanan manusia."
];

const QUOTES_EN = [
  "Premium design assets always speak without screaming. Simplicity, readability, and symmetrical proportions are the main pillars of my visual work to serve the audience.",
  "True aesthetics are born from the courage to discard the unnecessary. Minimalist design gives space for the mind to breathe freely.",
  "Behind every precise pixel, there is a solid functional structure. True beauty never sacrifices the utility of the original product.",
  "Monochromatic scheme is not merely an absence of color, but the courage to explore the depth of contrast, light, and pure shadow.",
  "Typography is not just text to be read, but a visual voice that has rhythm, authentic character, and a deep aesthetic soul.",
  "Geometric proportion and visual balance is a universal language that bridges pure artwork with daily functional needs.",
  "The best design work is that which inspires sincere action without coercion, delivering messages clearly and honestly.",
  "Through meticulous attention pixel-by-pixel, FanraTech is committed to creating timeless digital works that sincerely serve human comfort."
];

export default function FilosofiTekat() {
  const { lang } = useLanguage();
  const quotes = lang === 'id' ? QUOTES_ID : QUOTES_EN;

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(50);

  // Restart typing if language changes
  useEffect(() => {
    setDisplayedText('');
    setIsDeleting(false);
    setCurrentQuoteIndex(0);
    setTypingSpeed(50);
  }, [lang]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const activeQuotes = quotes;
    const fullText = activeQuotes[currentQuoteIndex] || "";

    if (!fullText) return;

    const handleType = () => {
      if (!isDeleting) {
        // Typing phase
        const nextText = fullText.substring(0, displayedText.length + 1);
        setDisplayedText(nextText);
        setTypingSpeed(35); // Constant fast typing speed

        if (nextText === fullText) {
          // Finished typing: pause for 4.5 seconds before starting deletion
          timer = setTimeout(() => {
            setIsDeleting(true);
          }, 4500);
          return;
        }
      } else {
        // Deleting phase
        const nextText = fullText.substring(0, displayedText.length - 1);
        setDisplayedText(nextText);
        setTypingSpeed(15); // Faster deletion speed

        if (nextText === '') {
          // Finished deleting: change index, pause very briefly, start typing next quote
          setIsDeleting(false);
          setCurrentQuoteIndex((prev) => (prev + 1) % activeQuotes.length);
          setTypingSpeed(300); // Small recovery pause before next quote start
          return;
        }
      }
    };

    timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentQuoteIndex, typingSpeed, quotes]);

  return (
    <section className="py-14 bg-[#F9FAFB] relative overflow-hidden text-[#111827]">
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        {/* Fixed min-height container locks vertical height across devices to eliminate CLS (Cumulative Layout Shift) */}
        <div className="min-h-[130px] sm:min-h-[90px] md:min-h-[72px] flex items-center justify-center">
          <p className="text-xs sm:text-sm md:text-base text-slate-700 font-sans italic leading-relaxed tracking-wide font-medium">
            &ldquo;{displayedText}&rdquo;
            <span 
              className="inline-block text-[#111827] ml-1 font-bold font-mono text-xs sm:text-sm md:text-base animate-pulse"
              style={{
                animation: 'blink 1s step-end infinite',
              }}
            >
              |
            </span>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blink {
          from, to { color: transparent }
          50% { color: #111827 }
        }
      `}</style>
    </section>
  );
}
