"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import CartItemEditModal from "./CartItemEditModal";
import type { CartItem as CartItemType } from "@/lib/types";

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const [editOpen, setEditOpen] = useState(false);

  const itemTotal = item.unitPrice * item.quantity;

  return (
    <>
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
          <div className="flex items-center gap-3 mt-2">
            <p className="text-lg font-bold text-mcdonalds-red">
              ${itemTotal.toFixed(2)}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-gray-500">
                ${item.unitPrice.toFixed(2)} each
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-end gap-2">
          {/* Quantity Controls */}
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

          {/* Edit & Remove buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => removeItem(item.id)}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <CartItemEditModal
        item={item}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
