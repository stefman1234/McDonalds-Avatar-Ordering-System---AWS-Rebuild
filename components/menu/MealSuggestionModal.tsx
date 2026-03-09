"use client";

import Modal from "@/components/ui/Modal";
import type { MealDealSuggestion } from "@/lib/types";
import type { CartItem } from "@/lib/types";

interface MealSuggestionModalProps {
  open: boolean;
  onClose: () => void;
  suggestion: MealDealSuggestion | null;
  cartItems: CartItem[];
  onConvert: () => void;
  onKeepSeparate: () => void;
}

export default function MealSuggestionModal({
  open,
  onClose,
  suggestion,
  cartItems,
  onConvert,
  onKeepSeparate,
}: MealSuggestionModalProps) {
  if (!suggestion) return null;

  const cartSubtotal = cartItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <Modal open={open} onClose={onClose} title="Before You Checkout..." size="sm">
      <div className="py-2">
        {/* Order Summary */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Order</p>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">
                  {item.quantity > 1 && (
                    <span className="text-gray-500 mr-1">{item.quantity}×</span>
                  )}
                  {item.name}
                </span>
                <span className="text-gray-600 ml-2 shrink-0">
                  RM {(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 mt-2 pt-2">
            <span>Subtotal</span>
            <span>RM {cartSubtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Deal Offer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">💰</span>
            <div>
              <p className="font-bold text-gray-900 text-sm">{suggestion.combo.name}</p>
              <p className="text-xs text-gray-500">Group your items into a meal deal!</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Items separately</span>
              <span className="line-through">RM {suggestion.currentTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-900">Meal deal price</span>
              <span className="text-mcdonalds-red">RM {suggestion.comboPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-green-600 border-t border-yellow-200 pt-1 mt-1">
              <span>You save</span>
              <span>RM {suggestion.savings.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Touch-only buttons */}
        <div className="space-y-2">
          <button onClick={onConvert} className="w-full btn-primary py-3 text-base">
            Yes — Save RM {suggestion.savings.toFixed(2)}
          </button>
          <button onClick={onKeepSeparate} className="w-full btn-outline py-3">
            No, keep items separate
          </button>
        </div>
      </div>
    </Modal>
  );
}
