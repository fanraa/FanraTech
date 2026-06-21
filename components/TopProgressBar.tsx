'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';

export default function TopProgressBar() {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoveredAnchorRef = useRef<HTMLAnchorElement | null>(null);
  const isPreloadingRef = useRef<boolean>(false);

  const startLoader = (initialSpeed = 100) => {
    // Clear any previous running timers
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setVisible(true);
    setProgress(5);

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return 92; // Stay at 92% until stopLoader/transition completes
        }
        // Slow down progression as it approaches 90%
        const increment = prev < 35 
          ? 15 
          : prev < 60 
          ? 8 
          : prev < 80 
          ? 3 
          : prev < 90 
          ? 1 
          : 0.3;
        return prev + increment;
      });
    }, initialSpeed);
  };

  const stopLoader = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    setProgress(100);
    const fadeTimer = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 450);

    return () => clearTimeout(fadeTimer);
  };

  const visibleRef = useRef(visible);
  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const lastPathRef = useRef(pathname);
  const lastParamsRef = useRef(searchParams);

  // 1. Detect route transition end naturally from Next.js hooks
  useEffect(() => {
    if (visible) {
      const pathChanged = lastPathRef.current !== pathname;
      const paramsChanged = lastParamsRef.current !== searchParams;
      if (pathChanged || paramsChanged) {
        stopLoader();
        lastPathRef.current = pathname;
        lastParamsRef.current = searchParams;
      }
    } else {
      lastPathRef.current = pathname;
      lastParamsRef.current = searchParams;
    }
  }, [pathname, searchParams, visible]);

  // 2. Event listeners and general listeners initialization
  useEffect(() => {
    // Intercept internal anchor clicks
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      // Only show for valid internal links
      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        targetAttr !== '_blank' &&
        !e.defaultPrevented &&
        e.button === 0 && // Left clicks only
        !e.metaKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const currentUrl = window.location.pathname + window.location.search;
        if (href !== currentUrl) {
          if (isPreloadingRef.current) {
            isPreloadingRef.current = false;
            // Speed up the preloaded slow bar to fast loading speed
            startLoader(60);
          } else {
            startLoader(120);
          }
        }
      }
    };

    // Preloader on Hover (mouseover)
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        targetAttr !== '_blank'
      ) {
        const currentUrl = window.location.pathname + window.location.search;
        if (href === currentUrl) return;

        if (hoveredAnchorRef.current === anchor) return;

        // Reset previous hover state
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
        }

        hoveredAnchorRef.current = anchor;

        // If hovered for >300ms, start a very slow background loading bar
        hoverTimeoutRef.current = setTimeout(() => {
          if (!visibleRef.current) {
            isPreloadingRef.current = true;
            startLoader(180); // slow graceful background tick
          }
        }, 300);
      }
    };

    // Cancel preloader on mouse leave (mouseout)
    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      if (hoveredAnchorRef.current === anchor) {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        hoveredAnchorRef.current = null;

        // Cancel the preloading progress bar since the user did not click and left the link
        if (isPreloadingRef.current) {
          isPreloadingRef.current = false;
          stopLoader();
        }
      }
    };

    // Custom event dispatches for manual activities
    const handleStartEvent = () => {
      isPreloadingRef.current = false;
      startLoader(80); // Speed fast for buttons/search triggers
    };

    const handleStopEvent = () => {
      isPreloadingRef.current = false;
      stopLoader();
    };

    // Safe popstate back/forward navigation handler
    const handlePopState = () => {
      isPreloadingRef.current = false;
      startLoader(140);
      setTimeout(stopLoader, 550);
    };

    window.addEventListener('click', handleAnchorClick, { capture: true });
    window.addEventListener('mouseover', handleMouseOver, { capture: true });
    window.addEventListener('mouseout', handleMouseOut, { capture: true });
    window.addEventListener('fanratech_start_loading', handleStartEvent);
    window.addEventListener('fanratech_stop_loading', handleStopEvent);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('click', handleAnchorClick, { capture: true });
      window.removeEventListener('mouseover', handleMouseOver, { capture: true });
      window.removeEventListener('mouseout', handleMouseOut, { capture: true });
      window.removeEventListener('fanratech_start_loading', handleStartEvent);
      window.removeEventListener('fanratech_stop_loading', handleStopEvent);
      window.removeEventListener('popstate', handlePopState);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="global-top-loading-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.1 } }}
          className="fixed top-0 left-0 right-0 h-[2.5px] bg-slate-200/20 z-[99999] pointer-events-none select-none overflow-hidden"
        >
          <motion.div
            className="h-full bg-[#111827] shadow-[0_1.5px_10px_rgba(17,24,39,0.7)]"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 18,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
