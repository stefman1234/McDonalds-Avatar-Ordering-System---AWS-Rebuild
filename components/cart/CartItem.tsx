"use client";

import { useCartStore } from "@/stores/cartStore";
import type { CartItem as CartItemType } from "@/lib/types";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const itemTotal = item.unitPrice * item.quantity;

  return (
    <div className="flex gap-4 py-4 border-b border-gray-200">
      {/* Item Details */}
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{item.name}</h4>

        {/* Customizations */}
        {item.customizations.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {item.customizations.map((custom, index) => (
              <p key={index} className="text-sm text-gray-600">
                • {custom}
              </p>
            ))}
          </div>
        )}

        {/* Price */}
        <p className="text-lg font-bold text-mcdonalds-red mt-2">
          ${itemTotal.toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
          <button
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-l-lg transition-colors"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold text-gray-900">
            {item.quantity}
          </span>
          <button
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded-r-lg transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          onClick={() => removeItem(item.id)}
          className="text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
