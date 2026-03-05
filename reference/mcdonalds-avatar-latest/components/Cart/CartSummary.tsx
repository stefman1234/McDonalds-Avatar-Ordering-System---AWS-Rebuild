'use client';

import { Button } from '@/components/UI/Button';

interface CartSummaryProps {
  subtotal: number;
  tax?: number;
  total: number;
  itemCount: number;
  onCheckout: () => void;
  onClearCart: () => void;
}

export function CartSummary({
  subtotal,
  tax = 0,
  total,
  itemCount,
  onCheckout,
  onClearCart,
}: CartSummaryProps) {
  const calculatedTax = tax || subtotal * 0.0825; // Default 8.25% tax if not provided
  const calculatedTotal = total || subtotal + calculatedTax;

  return (
    <div className="bg-white border-t border-gray-200 p-6 space-y-4">
      {/* Summary Lines */}
      <div className="space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (8.25%)</span>
          <span>${calculatedTax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
          <span>Total</span>
          <span className="text-mcd-red">${calculatedTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          variant="primary"
          className="w-full"
          onClick={onCheckout}
          disabled={itemCount === 0}
        >
          Proceed to Checkout
        </Button>

        {itemCount > 0 && (
          <button
            onClick={onClearCart}
            className="w-full text-sm text-red-600 hover:text-red-700 transition-colors py-2"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        Prices may vary by location
      </p>
    </div>
  );
}
