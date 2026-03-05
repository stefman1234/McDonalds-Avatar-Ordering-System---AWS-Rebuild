"use client";

import { useUIStore } from "@/stores/uiStore";
import { useCartStore } from "@/stores/cartStore";

export default function CartButton() {
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const itemCount = useCartStore((s) => s.itemCount);
  const count = itemCount();

  return (
    <button
      onClick={() => setCartOpen(true)}
      className="relative btn-primary flex items-center gap-2"
      aria-label={`View cart with ${count} items`}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      <span className="hidden sm:inline">Cart</span>

      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-mcdonalds-yellow text-gray-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-md">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
