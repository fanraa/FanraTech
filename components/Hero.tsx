'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useLanguage } from '@/hooks/useLanguage';

interface StackedCard {
  id: string;
  image: string;
}

export default function Hero() {
  const { lang, t } = useLanguage();
  // 3 Creative stacked cards representing pure aesthetic portfolio visuals
  const stackedCards: StackedCard[] = [
    {
      id: "kopi-santai",
      image: "https://images.pexels.com/photos/3747266/pexels-photo-3747266.jpeg"
    },
    {
      id: "nusantara-festival",
      image: "https://images.pexels.com/photos/31995265/pexels-photo-31995265.jpeg"
    },
    {
      id: "lentera-malam",
      image: "https://images.pexels.com/photos/10292825/pexels-photo-10292825.jpeg"
    }
  ];

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Automatic slow, smooth sliding cycle every 8.5 seconds for premium relaxation feel
  useEffect(() => {
    if (isLoading) return;
    const timer = setInterval(() => {
      setActiveCardIndex((prevIndex) => (prevIndex + 1) % stackedCards.length);
    }, 8550);
    return () => clearInterval(timer);
  }, [stackedCards.length, isLoading]);

  return (
    <section
      id="home"
      className="relative min-h-[75vh] pt-32 pb-16 flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with elegant fade-out bottom gradient */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {/* Mobile Background Image (specifically for screens below 'sm') */}
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
        {/* Desktop Background Image (specifically for screens 'sm' and up) */}
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
        {/* Seamless bottom and overall white gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F9FAFB]/40 via-[#F9FAFB]/80 to-[#F9FAFB] z-10" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#F9FAFB] to-transparent z-10" />
      </div>

      {/* Background Ambience Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">
        <motion.div
          animate={{
            x: [0, 20, -10, 0],
            y: [0, -20, 15, 0],
            scale: [1, 1.03, 0.97, 1]
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-12 left-10 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl bg-zinc-200/50"
        />
        <motion.div
          animate={{
            x: [0, -15, 20, 0],
            y: [0, 20, -20, 0],
            scale: [1, 0.97, 1.03, 1]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute right-12 top-1/4 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl bg-slate-200/30"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {isLoading ? (
            <>
              {/* Sisi Kiri Skeleton */}
              <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 animate-pulse">
                <div className="space-y-3 w-full max-w-lg">
                  <div className="h-10 sm:h-14 bg-slate-200/80 rounded-xl w-3/4 mx-auto lg:mx-0" />
                  <div className="h-10 sm:h-14 bg-slate-200/80 rounded-xl w-11/12 mx-auto lg:mx-0" />
                </div>
                <div className="space-y-2.5 w-full max-w-md pt-2">
                  <div className="h-4 bg-slate-200/85 rounded-md w-full" />
                  <div className="h-4 bg-slate-200/85 rounded-md w-[92%] mx-auto lg:mx-0" />
                  <div className="h-4 bg-slate-200/85 rounded-md w-4/5 mx-auto lg:mx-0" />
                </div>
              </div>

              {/* Sisi Kanan Skeleton */}
              <div className="hidden lg:col-span-5 lg:flex justify-center items-center py-8 relative min-h-[460px]">
                <div className="relative w-[300px] h-[400px] select-none animate-pulse">
                  <div className="absolute inset-0 bg-slate-200/50 rounded-2xl border border-slate-200/20 rotate-[-1.5deg] scale-100 z-30" />
                  <div className="absolute inset-0 bg-slate-200/40 rounded-2xl border border-slate-200/20 rotate-[3.5deg] translate-x-5 translate-y-2 scale-[0.95] z-20" />
                  <div className="absolute inset-0 bg-slate-200/30 rounded-2xl border border-slate-200/20 rotate-[7deg] translate-x-10 translate-y-4 scale-[0.90] z-10" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Sisi Kiri: Teks Singkat Desainer (Sangat Bersih & Elegan - Rata tengah di HP, Rata kiri di laptop) */}
              <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
                <motion.h2
                  initial={{ opacity: 0, y: 35 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-display font-medium tracking-tight leading-[1.1] text-[#111827]"
                >
                  {lang === 'id' ? (
                    <>
                      Mewujudkan Ide <br className="hidden sm:inline" />
                      <span className="relative inline-block mt-1">
                        <span className="relative z-10 font-extrabold text-[#111827]">Visual Menjadi</span>
                        <span className="absolute left-0 right-0 bottom-1 h-3 -z-0 rounded-sm bg-slate-200/60" />
                      </span>{' '}
                      <span className="font-extrabold text-[#111827]">Bernyawa.</span>
                    </>
                  ) : (
                    <>
                      Bringing Visual <br className="hidden sm:inline" />
                      <span className="relative inline-block mt-1">
                        <span className="relative z-10 font-extrabold text-[#111827]">Ideas to Fully</span>
                        <span className="absolute left-0 right-0 bottom-1 h-3 -z-0 rounded-sm bg-slate-200/60" />
                      </span>{' '}
                      <span className="font-extrabold text-[#111827]">Come Alive.</span>
                    </>
                  )}
                </motion.h2>
     
                <motion.p
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.3, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[#111827]/85 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans"
                >
                  {lang === 'id' ? (
                    <>
                      Halo, Saya <strong className="font-bold text-[#111827]">Fanra</strong>. Seorang desainer yang percaya bahwa seni visual bukan sekadar keindahan permukaan, melainkan jembatan komunikasi yang intuitif, fungsional, dan membekas di hati pengguna.
                    </>
                  ) : (
                    <>
                      Hello, I am <strong className="font-bold text-[#111827]">Fanra</strong>. A designer who believes that visual art is not merely about surface beauty, but an intuitive, functional communication bridge that leaves a lasting impression on users.
                    </>
                  )}
                </motion.p>
              </div>

              {/* Sisi Kanan: Kartu Bertumpuk (Hanya Di Desktop / Sembunyi Di Ponsel) */}
              <div className="hidden lg:col-span-5 lg:flex justify-center items-center py-8 relative min-h-[460px]">
                <div className="relative w-[300px] h-[400px] select-none">
                  
                  <AnimatePresence mode="popLayout">
                    {stackedCards.map((card, idx) => {
                      // Calculate stacked visual order relative to active index
                      const position = (idx - activeCardIndex + stackedCards.length) % stackedCards.length;
                      const isFront = position === 0;

                      // Define slant degrees & shifts for luxury artistic overlap (border-none, elegant shadow)
                      let rotDeg = 0;
                      let xShift = 0;
                      let yShift = 0;
                      let cardScale = 1;
                      let cardOpacity = 1;

                      if (position === 0) {
                        rotDeg = -1.5; // Very soft, fluid tilts
                        xShift = 0;
                        yShift = 0;
                        cardScale = 1;
                        cardOpacity = 1;
                      } else if (position === 1) {
                        rotDeg = 3.5;
                        xShift = 20; 
                        yShift = 8;
                        cardScale = 0.95;
                        cardOpacity = 0.88;
                      } else if (position === 2) {
                        rotDeg = 7;
                        xShift = 40;
                        yShift = 16;
                        cardScale = 0.90;
                        cardOpacity = 0.65;
                      }

                      return (
                        <motion.div
                          key={card.id}
                          style={{
                            zIndex: 30 - position,
                            originX: 0.5,
                            originY: 0.5,
                          }}
                          animate={{
                            x: xShift,
                            y: yShift,
                            rotate: rotDeg,
                            scale: cardScale,
                            opacity: cardOpacity,
                          }}
                          exit={{
                            x: -320, // Slide left smooth transition
                            rotate: -12,
                            opacity: 0,
                            scale: 0.93,
                            transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] }
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 45,
                            damping: 22,
                            mass: 0.95
                          }}
                          className="absolute inset-0 w-full h-full bg-[#F9FAFB] rounded-2xl shadow-lg border border-slate-200/50 p-0 flex flex-col justify-between cursor-pointer outline-none select-none"
                          onClick={() => {
                            // Cycle slide manually on click
                            if (isFront) {
                              setActiveCardIndex((prev) => (prev + 1) % stackedCards.length);
                            }
                          }}
                        >
                          {/* Image container holds pure picture with smooth curved edge and thin borders */}
                          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#F9FAFB]">
                            <Image
                              src={card.image}
                              alt="Inspirasi Visual FanraTech"
                              fill
                              sizes="300px"
                              priority={isFront}
                              className="object-cover pointer-events-none"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </section>
  );
}
