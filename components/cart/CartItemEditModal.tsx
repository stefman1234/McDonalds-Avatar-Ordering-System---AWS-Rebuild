"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import type { CartItem } from "@/lib/types";

interface CustomizationOption {
  id: number;
  name: string;
  priceExtra: number;
}

interface CartItemEditModalProps {
  item: CartItem;
  open: boolean;
  onClose: () => void;
}

export default function CartItemEditModal({ item, open, onClose }: CartItemEditModalProps) {
  const updateCustomizations = useCartStore((s) => s.updateCustomizations);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [selectedCustomizations, setSelectedCustomizations] = useState<string[]>(item.customizations);
  const [quantity, setQuantity] = useState(item.quantity);
  const [availableCustomizations, setAvailableCustomizations] = useState<CustomizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Fetch available customizations for this menu item
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedCustomizations(item.customizations);
    setQuantity(item.quantity);

    fetch(`/api/menu/item/${item.menuItemId}/customizations`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAvailableCustomizations(data);
        }
      })
      .catch(() => {
        // Fallback: show current customizations as toggleable
        setAvailableCustomizations([]);
      })
      .finally(() => setLoading(false));
  }, [open, item.menuItemId, item.customizations, item.quantity]);

  function toggleCustomization(name: string) {
    setSelectedCustomizations((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  }

  function handleSave() {
    const allCustomizations = specialInstructions
      ? [...selectedCustomizations, specialInstructions]
      : selectedCustomizations;
    updateCustomizations(item.id, allCustomizations);
    if (quantity !== item.quantity) {
      updateQuantity(item.id, quantity);
    }
    onClose();
  }

  if (!open) return null;

  const extraCost = availableCustomizations
    .filter((c) => selectedCustomizations.includes(c.name) && !item.customizations.includes(c.name))
    .reduce((sum, c) => sum + c.priceExtra, 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-white rounded-2xl shadow-2xl z-[61] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit {item.name}</h3>
            <p className="text-sm text-gray-500">${item.unitPrice.toFixed(2)} each</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* Quantity */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-bold"
              >
                −
              </button>
              <span className="w-10 text-center text-lg font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Customizations */}
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Customizations
            </label>
            {loading ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-mcdonalds-red border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Loading options...</span>
              </div>
            ) : availableCustomizations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableCustomizations.map((c) => {
                  const isSelected = selectedCustomizations.includes(c.name);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCustomization(c.name)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        isSelected
                          ? "bg-mcdonalds-red text-white border-mcdonalds-red"
                          : "bg-white text-gray-700 border-gray-300 hover:border-mcdonalds-red hover:text-mcdonalds-red"
                      }`}
                    >
                      {c.name}
                      {c.priceExtra > 0 && (
                        <span className="ml-1 text-xs opacity-80">+${c.priceExtra.toFixed(2)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No customization options available for this item.</p>
            )}
          </div>

          {/* Special Instructions */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Special Instructions (optional)
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g., No pickles, extra sauce..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mcdonalds-red focus:border-transparent resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex-shrink-0">
          {extraCost > 0 && (
            <p className="text-sm text-gray-600 mb-3">
              Extra customizations: +${extraCost.toFixed(2)}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-mcdonalds-red rounded-lg hover:bg-red-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
