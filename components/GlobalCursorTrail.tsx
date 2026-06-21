'use client';

import React, { useEffect, useRef } from 'react';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export default function GlobalCursorTrail() {
  const canvasBehindRef = useRef<HTMLCanvasElement>(null);
  const canvasAboveRef = useRef<HTMLCanvasElement>(null);
  const activeColorRef = useRef<string>("all");

  useEffect(() => {
    const handleColorChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ color: string }>;
      if (customEvent.detail && customEvent.detail.color) {
        activeColorRef.current = customEvent.detail.color;
      }
    };

    window.addEventListener('fanratech_trail_color', handleColorChange);
    return () => {
      window.removeEventListener('fanratech_trail_color', handleColorChange);
    };
  }, []);

  useEffect(() => {
    const canvasBehind = canvasBehindRef.current;
    const canvasAbove = canvasAboveRef.current;
    if (!canvasBehind || !canvasAbove) return;

    const ctxBehind = canvasBehind.getContext('2d');
    const ctxAbove = canvasAbove.getContext('2d');
    if (!ctxBehind || !ctxAbove) return;

    // High-DPI / Retina Screen Scaling Configuration for maximum vector crispness without dots
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      if (!canvasBehind || !canvasAbove || !ctxBehind || !ctxAbove) return;
      width = window.innerWidth;
      height = window.innerHeight;
      
      // Update behind canvas bounds
      canvasBehind.width = width * dpr;
      canvasBehind.height = height * dpr;
      canvasBehind.style.width = `${width}px`;
      canvasBehind.style.height = `${height}px`;
      ctxBehind.scale(dpr, dpr);

      // Update above canvas bounds
      canvasAbove.width = width * dpr;
      canvasAbove.height = height * dpr;
      canvasAbove.style.width = `${width}px`;
      canvasAbove.style.height = `${height}px`;
      ctxAbove.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });

    // Interactive pointer state
    let targetX = 0;
    let targetY = 0;
    let isPointerActive = false;
    let lastActiveTime = Date.now();
    let hasInitialized = false;

    // Node configuration: 16 nodes for an ultra-responsive, fast tail that follows instantly
    const NODE_COUNT = 16;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: 0,
      y: 0,
    }));

    // Opacity transitions
    let trailOpacity = 0;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!hasInitialized) {
        // Instant teleport all nodes to current pointer position on active touch/move
        nodes.forEach((node) => {
          node.x = targetX;
          node.y = targetY;
        });
        hasInitialized = true;
      }

      isPointerActive = true;
      lastActiveTime = Date.now();
    };

    // Implements complete instant residue-cleanup upon leaving screen (Anti-Glitch)
    const handlePointerLeave = () => {
      isPointerActive = false;
      hasInitialized = false; // Force complete re-init on next movement
      trailOpacity = 0; // Absolute reset to hide any trace
      if (ctxBehind) ctxBehind.clearRect(0, 0, width, height);
      if (ctxAbove) ctxAbove.clearRect(0, 0, width, height);
    };

    // Teleports all segments instantaneously on enter so no line spans from outdated coordinates
    const handlePointerEnter = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      isPointerActive = true;
      lastActiveTime = Date.now();
      hasInitialized = true;

      nodes.forEach((node) => {
        node.x = targetX;
        node.y = targetY;
      });
      trailOpacity = 0; // Seamless fade in
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    document.documentElement.addEventListener('pointerenter', handlePointerEnter, { passive: true });

    let animationId: number;

    const tick = () => {
      // Clear both contexts
      ctxBehind.clearRect(0, 0, width, height);
      ctxAbove.clearRect(0, 0, width, height);

      const color = activeColorRef.current;
      if (canvasBehind) {
        canvasBehind.style.mixBlendMode = color === "all" ? 'difference' : 'normal';
      }
      if (canvasAbove) {
        canvasAbove.style.mixBlendMode = color === "all" ? 'difference' : 'normal';
      }

      const idleTime = Date.now() - lastActiveTime;
      // Gently dissolve lines after 1.5s of complete motionlessness
      const targetOpacity = (isPointerActive && idleTime < 1500) ? 1.0 : 0;
      trailOpacity += (targetOpacity - trailOpacity) * 0.15;

      if (trailOpacity > 0.005 && hasInitialized) {
        // High-Speed, Butter-Smooth Easing Physics
        const headEase = 0.45;
        nodes[0].x += (targetX - nodes[0].x) * headEase;
        nodes[0].y += (targetY - nodes[0].y) * headEase;

        // Speedy alignment propagation
        for (let i = 1; i < NODE_COUNT; i++) {
          const prev = nodes[i - 1];
          const curr = nodes[i];
          const ease = 0.52;
          curr.x += (prev.x - curr.x) * ease;
          curr.y += (prev.y - curr.y) * ease;
        }

        // --- SINGLE-PATH VECTOR DRAWING (100% DOTLESS & GLASS-SMOOTH) ---
        // Drawing one single continuous path completely removes overlapping segment "beads"
        
        // 1. Draw Canvas Behind (Main subtle line over background, low z-index)
        ctxBehind.beginPath();
        ctxBehind.moveTo(nodes[0].x, nodes[0].y);
        for (let i = 1; i < NODE_COUNT - 1; i++) {
          const xc = (nodes[i].x + nodes[i + 1].x) / 2;
          const yc = (nodes[i].y + nodes[i + 1].y) / 2;
          ctxBehind.quadraticCurveTo(nodes[i].x, nodes[i].y, xc, yc);
        }
        ctxBehind.lineTo(nodes[NODE_COUNT - 1].x, nodes[NODE_COUNT - 1].y);

        if (color === "all") {
          ctxBehind.strokeStyle = `rgba(255, 255, 255, ${trailOpacity * 0.22})`; // Sangat samar & mewah
        } else {
          const rgb = hexToRgb(color);
          if (rgb) {
            ctxBehind.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${trailOpacity * 0.35})`;
          } else {
            ctxBehind.strokeStyle = `rgba(17, 24, 39, ${trailOpacity * 0.3})`;
          }
        }
        ctxBehind.lineWidth = 1.6;
        ctxBehind.lineCap = 'round';
        ctxBehind.lineJoin = 'round';
        ctxBehind.stroke();

        // 2. Draw Canvas Above (Extremely dimmed, high-contrast difference line overlay, high z-index)
        ctxAbove.beginPath();
        ctxAbove.moveTo(nodes[0].x, nodes[0].y);
        for (let i = 1; i < NODE_COUNT - 1; i++) {
          const xc = (nodes[i].x + nodes[i + 1].x) / 2;
          const yc = (nodes[i].y + nodes[i + 1].y) / 2;
          ctxAbove.quadraticCurveTo(nodes[i].x, nodes[i].y, xc, yc);
        }
        ctxAbove.lineTo(nodes[NODE_COUNT - 1].x, nodes[NODE_COUNT - 1].y);

        if (color === "all") {
          ctxAbove.strokeStyle = `rgba(255, 255, 255, ${trailOpacity * 0.07})`; // Super redup tapi kelihatan kontras lewat mix-blend-mode
        } else {
          const rgb = hexToRgb(color);
          if (rgb) {
            ctxAbove.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${trailOpacity * 0.15})`;
          } else {
            ctxAbove.strokeStyle = `rgba(17, 24, 39, ${trailOpacity * 0.12})`;
          }
        }
        ctxAbove.lineWidth = 1.4;
        ctxAbove.lineCap = 'round';
        ctxAbove.lineJoin = 'round';
        ctxAbove.stroke();
      }

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
      document.documentElement.removeEventListener('pointerenter', handlePointerEnter);
    };
  }, []);

  return (
    <>
      {/* 1. Underlying Canvas: Di bawah teks & elemen interaktif, tepat di atas background */}
      <canvas
        ref={canvasBehindRef}
        id="global-cursor-trail-behind"
        className="fixed inset-0 w-full h-full pointer-events-none z-[2] select-none"
        style={{
          mixBlendMode: 'difference',
          willChange: 'transform',
        }}
      />

      {/* 2. Overlying Canvas: Di atas segalanya, super redup tapi bereaksi kontras terhadap teks/tombol */}
      <canvas
        ref={canvasAboveRef}
        id="global-cursor-trail-above"
        className="fixed inset-0 w-full h-full pointer-events-none z-[9999] select-none"
        style={{
          mixBlendMode: 'difference',
          willChange: 'transform',
        }}
      />
    </>
  );
}
