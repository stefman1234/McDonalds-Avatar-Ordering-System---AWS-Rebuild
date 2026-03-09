"use client";

import { useDragScroll } from "@/hooks/useDragScroll";
import { useCartStore } from "@/stores/cartStore";
import { useUIStore } from "@/stores/uiStore";
import OrderItemCard from "./OrderItemCard";
import EmptyOrderState from "./EmptyOrderState";
import type { CartItem } from "@/lib/types";

interface OrderItemsCarouselProps {
  onBrowseMenu: () => void;
  onCustomizeItem?: (item: CartItem) => void;
}

export default function OrderItemsCarousel({
  onBrowseMenu,
  onCustomizeItem,
}: OrderItemsCarouselProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal);
  const itemCount = useCartStore((s) => s.itemCount);
  const setCheckoutOpen = useUIStore((s) => s.setCheckoutOpen);

  const { containerRef, isDragging, hasMoved, handlers } = useDragScroll({
    momentumMultiplier: 16,
  });

  if (items.length === 0) {
    return <EmptyOrderState onBrowseMenu={onBrowseMenu} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-900">Your Order</h3>
          <span className="bg-mcdonalds-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {itemCount()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-green-600">
            ${subtotal().toFixed(2)}
          </span>
          <button
            onClick={() => setCheckoutOpen(true)}
            className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          {...handlers}
          className="flex gap-4 overflow-x-auto overflow-y-auto px-4 py-3 h-full select-none items-start"
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollSnapType: "none",
            scrollBehavior: "auto",
            WebkitOverflowScrolling: "touch",
            pointerEvents: isDragging && hasMoved.current ? "none" : "auto",
          }}
        >
          <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
          {items.map((item) => (
            <OrderItemCard
              key={item.id}
              item={item}
              onRemove={removeItem}
              onCustomize={onCustomizeItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
