"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface DragScrollOptions {
  sensitivity?: number;
  momentumMultiplier?: number;
  friction?: number;
}

export function useDragScroll(options?: DragScrollOptions) {
  const sensitivity = options?.sensitivity ?? 1.5;
  const momentumMultiplier = options?.momentumMultiplier ?? 20;
  const friction = options?.friction ?? 0.95;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const momentumIdRef = useRef<number | null>(null);
  const hasMovedRef = useRef(false);

  const cancelMomentum = useCallback(() => {
    if (momentumIdRef.current !== null) {
      cancelAnimationFrame(momentumIdRef.current);
      momentumIdRef.current = null;
    }
  }, []);

  const startMomentum = useCallback(() => {
    cancelMomentum();
    const step = () => {
      const el = containerRef.current;
      if (!el || Math.abs(velocityRef.current) <= 0.3) {
        cancelMomentum();
        return;
      }
      velocityRef.current *= friction;
      el.scrollLeft -= velocityRef.current;
      momentumIdRef.current = requestAnimationFrame(step);
    };
    momentumIdRef.current = requestAnimationFrame(step);
  }, [cancelMomentum, friction]);

  const handleStart = useCallback(
    (pageX: number) => {
      cancelMomentum();
      const el = containerRef.current;
      if (!el) return;
      setIsDragging(true);
      hasMovedRef.current = false;
      startXRef.current = pageX - el.offsetLeft;
      scrollLeftRef.current = el.scrollLeft;
      lastXRef.current = pageX;
      lastTimeRef.current = Date.now();
      velocityRef.current = 0;
    },
    [cancelMomentum]
  );

  const handleMove = useCallback(
    (pageX: number) => {
      if (!isDragging) return;
      const el = containerRef.current;
      if (!el) return;

      const x = pageX - el.offsetLeft;
      const walk = (x - startXRef.current) * sensitivity;
      el.scrollLeft = scrollLeftRef.current - walk;

      const now = Date.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        const dist = pageX - lastXRef.current;
        velocityRef.current = (dist / dt) * momentumMultiplier;
        if (Math.abs(dist) > 3) hasMovedRef.current = true;
      }
      lastXRef.current = pageX;
      lastTimeRef.current = now;
    },
    [isDragging, sensitivity, momentumMultiplier]
  );

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(velocityRef.current) > 0.5) {
      startMomentum();
    }
  }, [isDragging, startMomentum]);

  useEffect(() => {
    return cancelMomentum;
  }, [cancelMomentum]);

  const handlers = {
    onMouseDown: (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.pageX);
    },
    onMouseMove: (e: React.MouseEvent) => handleMove(e.pageX),
    onMouseUp: () => handleEnd(),
    onMouseLeave: () => handleEnd(),
    onTouchStart: (e: React.TouchEvent) => handleStart(e.touches[0].pageX),
    onTouchMove: (e: React.TouchEvent) => handleMove(e.touches[0].pageX),
    onTouchEnd: () => handleEnd(),
  };

  return { containerRef, isDragging, hasMoved: hasMovedRef, handlers };
}
