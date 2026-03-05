'use client';

import { useRef, useState, useCallback } from 'react';
import { MenuCard, MenuItem } from './MenuCard';
import { FilterBanner } from './FilterBanner';

interface MenuCarouselProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  onCustomize?: (item: MenuItem) => void;
  isLoading?: boolean;
  // Filter mode props
  filterMode?: 'all' | 'filtered';
  filteredItems?: MenuItem[];
  filterQuery?: string;
  filterMessage?: string;
  onClearFilter?: () => void;
}

export function MenuCarousel({
  items,
  onAddToCart,
  onCustomize,
  isLoading = false,
  filterMode = 'all',
  filteredItems = [],
  filterQuery = '',
  filterMessage = '',
  onClearFilter,
}: MenuCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Determine which items to display
  const displayItems = filterMode === 'filtered' ? filteredItems : items;

  // Velocity tracking for momentum scrolling
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const momentumIdRef = useRef<number | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 300; // Scroll by ~1.5 cards
    const newPosition =
      scrollContainerRef.current.scrollLeft +
      (direction === 'left' ? -scrollAmount : scrollAmount);

    scrollContainerRef.current.scrollTo({
      left: newPosition,
      behavior: 'smooth',
    });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;

    // Cancel any ongoing momentum
    if (momentumIdRef.current !== null) {
      cancelAnimationFrame(momentumIdRef.current);
      momentumIdRef.current = null;
    }

    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);

    // Initialize velocity tracking
    lastXRef.current = e.pageX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);

    // Apply momentum if velocity is significant
    if (Math.abs(velocityRef.current) > 0.3 && scrollContainerRef.current) {
      const applyMomentum = () => {
        if (!scrollContainerRef.current) return;

        // Apply velocity with deceleration (friction)
        velocityRef.current *= 0.95; // Less friction for more coasting
        scrollContainerRef.current.scrollLeft -= velocityRef.current;

        // Continue animation if velocity is still significant
        if (Math.abs(velocityRef.current) > 0.3) {
          momentumIdRef.current = requestAnimationFrame(applyMomentum);
        } else {
          momentumIdRef.current = null;
        }
      };

      applyMomentum();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;
      e.preventDefault();

      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Increased for more responsive feel
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;

      // Calculate velocity for momentum
      const now = Date.now();
      const timeDelta = now - lastTimeRef.current;

      if (timeDelta > 0) {
        const distance = e.pageX - lastXRef.current;
        velocityRef.current = distance / timeDelta * 20; // Increased multiplier for stronger momentum
      }

      lastXRef.current = e.pageX;
      lastTimeRef.current = now;
    },
    [isDragging, startX, scrollLeft]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;

    // Cancel any ongoing momentum
    if (momentumIdRef.current !== null) {
      cancelAnimationFrame(momentumIdRef.current);
      momentumIdRef.current = null;
    }

    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);

    // Initialize velocity tracking
    lastXRef.current = e.touches[0].pageX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;

      const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Increased for more responsive feel
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;

      // Calculate velocity for momentum
      const now = Date.now();
      const timeDelta = now - lastTimeRef.current;

      if (timeDelta > 0) {
        const distance = e.touches[0].pageX - lastXRef.current;
        velocityRef.current = distance / timeDelta * 20; // Increased multiplier for stronger momentum
      }

      lastXRef.current = e.touches[0].pageX;
      lastTimeRef.current = now;
    },
    [isDragging, startX, scrollLeft]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);

    // Apply momentum if velocity is significant
    if (Math.abs(velocityRef.current) > 0.3 && scrollContainerRef.current) {
      const applyMomentum = () => {
        if (!scrollContainerRef.current) return;

        // Apply velocity with deceleration (friction)
        velocityRef.current *= 0.95; // Less friction for more coasting
        scrollContainerRef.current.scrollLeft -= velocityRef.current;

        // Continue animation if velocity is still significant
        if (Math.abs(velocityRef.current) > 0.3) {
          momentumIdRef.current = requestAnimationFrame(applyMomentum);
        } else {
          momentumIdRef.current = null;
        }
      };

      applyMomentum();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-mcd-yellow border-t-mcd-red rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Loading menu...</p>
        </div>
      </div>
    );
  }

  // Handle empty state
  if (displayItems.length === 0 && filterMode === 'filtered') {
    return (
      <div className="h-full flex flex-col">
        {onClearFilter && (
          <FilterBanner
            query={filterQuery}
            count={0}
            message={filterMessage || `No items found matching "${filterQuery}"`}
            onClear={onClearFilter}
          />
        )}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="text-5xl mb-3 block">🔍</span>
            <p className="text-gray-600 font-medium">No matches found</p>
            <p className="text-gray-500 text-sm mt-1">Try a different search or browse all items</p>
          </div>
        </div>
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <span className="text-5xl mb-3 block">🍔</span>
          <p className="text-gray-600 font-medium">No items found</p>
          <p className="text-gray-500 text-sm mt-1">Try a different category</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* Filter Banner - show when in filter mode */}
      {filterMode === 'filtered' && onClearFilter && (
        <FilterBanner
          query={filterQuery}
          count={displayItems.length}
          message={filterMessage}
          onClear={onClearFilter}
        />
      )}

      {/* Carousel Container */}
      <div className="relative flex-1 flex items-center">
      {/* Left Arrow */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Scroll left"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-x-auto px-14 py-4 hide-scrollbar ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          scrollSnapType: 'none', // Disabled for smoother free scrolling
          scrollBehavior: 'auto', // Changed to auto for more responsive feel
          userSelect: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex gap-4" style={{ minWidth: 'min-content' }}>
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0"
              style={{
                width: '240px',
                scrollSnapAlign: 'start',
              }}
            >
              <MenuCard item={item} onAddToCart={onAddToCart} onCustomize={onCustomize} />
            </div>
          ))}
        </div>
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        aria-label="Scroll right"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Item Count Indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
        {displayItems.length} item{displayItems.length !== 1 ? 's' : ''}
      </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
