'use client';

import { useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { CartItem } from '@/store/cart';
import { OrderItemCard } from './OrderItemCard';

interface OrderItemsCarouselProps {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  onCustomizeItem?: (item: CartItem) => void;
}

export function OrderItemsCarousel({
  items,
  onRemoveItem,
  onCustomizeItem,
}: OrderItemsCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false); // Track if user has moved during drag

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
    setHasMoved(false); // Reset movement flag
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
    if (Math.abs(velocityRef.current) > 0.5 && scrollContainerRef.current) {
      const applyMomentum = () => {
        if (!scrollContainerRef.current) return;

        velocityRef.current *= 0.95; // Friction

        if (Math.abs(velocityRef.current) > 0.1) {
          scrollContainerRef.current.scrollLeft -= velocityRef.current;
          momentumIdRef.current = requestAnimationFrame(applyMomentum);
        } else {
          momentumIdRef.current = null;
        }
      };

      momentumIdRef.current = requestAnimationFrame(applyMomentum);
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;

      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 1.5; // Sensitivity multiplier

      // Only consider it a drag if moved more than 5 pixels
      if (Math.abs(walk) > 5) {
        e.preventDefault();
        setHasMoved(true);
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
      }

      // Track velocity
      const now = Date.now();
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        const dx = e.pageX - lastXRef.current;
        velocityRef.current = dx / dt * 16; // Normalize to 60fps
      }
      lastXRef.current = e.pageX;
      lastTimeRef.current = now;
    },
    [isDragging, startX, scrollLeft]
  );

  // Calculate total
  const calculateGrandTotal = (): number => {
    return items.reduce((total, item) => {
      let itemTotal = item.basePrice;

      // Add meal upcharge if it's a combo
      if (item.isCombo) {
        itemTotal += 2.50; // Base meal upcharge
        if (item.mealSize === 'large') {
          itemTotal += 1.00; // Large meal upcharge
        }
      }

      if (item.selectedSize) {
        itemTotal += item.selectedSize.priceModifier;
      }

      item.customizations.forEach(customization => {
        itemTotal += customization.priceModifier;
      });

      // Add meal side price modifier
      if (item.mealSide) {
        itemTotal += item.mealSide.priceModifier;
      }

      // Add meal drink price modifier
      if (item.mealDrink) {
        itemTotal += item.mealDrink.priceModifier;
      }

      return total + (itemTotal * item.quantity);
    }, 0);
  };

  const grandTotal = calculateGrandTotal();

  return (
    <div className="relative h-full flex flex-col bg-gray-50">
      {/* Header with Order Summary */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
            <p className="text-sm text-gray-600">{items.length} item{items.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-green-600">${grandTotal.toFixed(2)}</p>
            </div>
            <Link href="/checkout">
              <button className="bg-mcd-red hover:bg-red-600 text-white font-bold px-6 py-3 rounded-lg shadow-lg transition-colors whitespace-nowrap">
                Checkout
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scrollable Cards Container */}
      <div className="relative flex-1 overflow-hidden">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition-all disabled:opacity-50"
          aria-label="Scroll left"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition-all disabled:opacity-50"
          aria-label="Scroll right"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Cards */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="h-full overflow-x-auto overflow-y-hidden scrollbar-hide cursor-grab active:cursor-grabbing px-4 py-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div className="flex gap-4 h-full">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-72"
                style={{ pointerEvents: (isDragging && hasMoved) ? 'none' : 'auto' }}
              >
                <OrderItemCard
                  item={item}
                  onRemove={onRemoveItem}
                  onCustomize={onCustomizeItem}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
