'use client';

import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import AboutMe from '@/components/AboutMe';
import PortfolioGrid from '@/components/PortfolioGrid';
import ContactForm from '@/components/ContactForm';
import FilosofiTekat from '@/components/FilosofiTekat';
import Footer from '@/components/Footer';
import DesignDetail from '@/components/DesignDetail';
import CookieBanner from '@/components/CookieBanner';
import { DesignItem, getSavedDesigns } from '@/lib/data';
import { recordPageHit } from '@/lib/firebaseSync';
import { useEffect } from 'react';

export default function Home() {
  const [selectedDesignItem, setSelectedDesignItem] = useState<DesignItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    recordPageHit();

    // Check query params if any item wants to be opened directly
    if (typeof window !== 'undefined') {
      const queryParams = new URLSearchParams(window.location.search);
      const openDesignId = queryParams.get('openDesign');
      if (openDesignId) {
        const found = getSavedDesigns().find(d => d.id === openDesignId);
        if (found) {
          setTimeout(() => {
            setSelectedDesignItem(found);
          }, 0);
        }
      }
    }

    // Listen to custom events to open design detail dynamically from the header dropdown list
    const handleOpenDesign = (e: Event) => {
      const customEvent = e as CustomEvent<DesignItem>;
      if (customEvent.detail) {
        setSelectedDesignItem(customEvent.detail);
      }
    };

    window.addEventListener('fanratech_open_design', handleOpenDesign);
    return () => {
      window.removeEventListener('fanratech_open_design', handleOpenDesign);
    };
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Universal header navigation banner */}
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Main interactive page segments */}
      <div id="content-body" className="flex-1 w-full flex flex-col">
        {selectedDesignItem ? (
          <div className="w-full pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col flex-1 relative z-10">
            <DesignDetail
              item={selectedDesignItem}
              onClose={() => setSelectedDesignItem(null)}
              onSelect={setSelectedDesignItem}
            />
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <Hero />

            {/* Portfolio Gallery (with Filters, Cards and Interaction triggers) */}
            <PortfolioGrid 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectItem={setSelectedDesignItem}
              showLimit={true}
            />

            {/* About Me Section (Narrative, statistics, design philosophy) */}
            <AboutMe />

            {/* Contact form (Fast message submission, and alternative chat) */}
            <ContactForm />

            {/* Brand design philosophy visual typing divider */}
            <FilosofiTekat />
          </>
        )}
      </div>

      {/* Footer copyright */}
      <Footer />

      {/* Old inline modal overlays are deleted for a pure page-based view model */}

      {/* Ramping, minimalist and tumpul edge cookie consent bar */}
      <CookieBanner />
    </main>
  );
}
