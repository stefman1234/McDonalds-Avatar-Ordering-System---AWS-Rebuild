'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { CartItem } from './CartItem';
import { CartSummary } from './CartSummary';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotal,
    getItemCount,
    getItemTotal,
  } = useCartStore();

  const subtotal = getTotal();
  const itemCount = getItemCount();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCheckout = () => {
    onClose();
    router.push('/checkout');
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Order</h2>
              <p className="text-sm text-gray-600 mt-1">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
            <button
              onClick={onClose}
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
                  onClick={onClose}
                  className="btn-primary"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-0">
                {items.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    getItemTotal={getItemTotal}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Summary (only show when cart has items) */}
          {items.length > 0 && (
            <CartSummary
              subtotal={subtotal}
              total={0} // Will be calculated in component
              itemCount={itemCount}
              onCheckout={handleCheckout}
              onClearCart={handleClearCart}
            />
          )}
        </div>
      </div>
    </>
  );
}
