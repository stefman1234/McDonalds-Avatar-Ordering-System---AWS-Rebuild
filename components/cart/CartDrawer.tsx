"use client";

import { useEffect } from "react";
import CartItemComponent from "./CartItem";
import { useUIStore } from "@/stores/uiStore";
import { useCartStore } from "@/stores/cartStore";

export default function CartDrawer() {
  const cartOpen = useUIStore((s) => s.cartOpen);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const setCheckoutOpen = useUIStore((s) => s.setCheckoutOpen);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const tax = useCartStore((s) => s.tax);
  const total = useCartStore((s) => s.total);
  const clearCart = useCartStore((s) => s.clearCart);
  const itemCount = useCartStore((s) => s.itemCount);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [cartOpen]);

  function handleCheckout() {
    setCheckoutOpen(true);
  }

  function handleClearCart() {
    if (confirm("Are you sure you want to clear your cart?")) {
      clearCart();
    }
  }

  const count = itemCount();

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Drawer - slide from right */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${cartOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Order</h2>
              <p className="text-sm text-gray-600 mt-1">
                {count} {count === 1 ? "item" : "items"}
              </p>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close cart"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-5xl">🛒</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-600 mb-6">
                  Add some delicious items to get started!
                </p>
                <button
                  onClick={() => setCartOpen(false)}
                  className="btn-primary"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                {items.map((item) => (
                  <CartItemComponent key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {items.length > 0 && (
            <div className="bg-white border-t border-gray-200 p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Subtotal ({count} item{count !== 1 ? "s" : ""})
                  </span>
                  <span>RM {subtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8.25%)</span>
                  <span>RM {tax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-mcdonalds-red">
                    RM {total().toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full btn-primary"
                  disabled={count === 0}
                >
                  Proceed to Checkout
                </button>
                {count > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="w-full text-sm text-red-600 hover:text-red-700 transition-colors py-2"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center">
                Prices may vary by location
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
