"use client";

import type { CartItem } from "@/lib/types";
import { useCartStore } from "@/stores/cartStore";

interface OrderItemCardProps {
  item: CartItem;
  onRemove: (id: string) => void;
  onCustomize?: (item: CartItem) => void;
}

export default function OrderItemCard({ item, onRemove, onCustomize }: OrderItemCardProps) {
  const getItemTotal = useCartStore((s) => s.getItemTotal);
  const total = getItemTotal(item);
  const perUnit = total / item.quantity;

  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
      {/* Image area */}
      <div className="relative h-20 flex-shrink-0 bg-gradient-to-br from-green-400 to-green-300 flex items-center justify-center">
        <span className="text-4xl">{"\u{1F354}"}</span>

        {/* Qty badge */}
        {item.quantity > 1 && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Qty: {item.quantity}
          </span>
        )}

        {/* Combo badge */}
        {item.isCombo && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
            COMBO
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col">
        {/* Name */}
        <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>

        {/* Size chips */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {item.selectedSize && (
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {item.selectedSize.name}
            </span>
          )}
          {item.isCombo && item.mealSize && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              {item.mealSize === "large" ? "Large" : "Medium"} Meal
            </span>
          )}
        </div>

        {/* Meal breakdown */}
        {item.isCombo && (
          <div className="mt-1.5 space-y-0.5">
            {item.mealSide && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">Side:</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {item.mealSide.name}
                </span>
              </div>
            )}
            {item.mealDrink && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">Drink:</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {item.mealDrink.name}
                </span>
                {item.mealDrink.iceLevel && item.mealDrink.iceLevel !== "full" && (
                  <span className="text-[10px] text-gray-400 italic">
                    ({item.mealDrink.iceLevel === "less" ? "less ice" : "no ice"})
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Customizations */}
        {item.customizations.length > 0 && (
          <div className="mt-1.5">
            {item.customizations.slice(0, 3).map((c, i) => (
              <span key={i} className="text-[10px] text-gray-500 block truncate">{c}</span>
            ))}
            {item.customizations.length > 3 && (
              <span className="text-[10px] text-gray-400">+{item.customizations.length - 3} more...</span>
            )}
          </div>
        )}

        {/* Special instructions */}
        {item.specialInstructions && (
          <p className="text-[10px] text-gray-400 italic mt-1 line-clamp-2">
            {item.specialInstructions}
          </p>
        )}

        {/* Price + Buttons pinned to bottom */}
        <div className="mt-2">
          <div>
            <span className="text-base font-bold text-green-600">${total.toFixed(2)}</span>
            {item.quantity > 1 && (
              <span className="text-[10px] text-gray-400 ml-1">(${perUnit.toFixed(2)} each)</span>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            {onCustomize && (
              <button
                onClick={() => onCustomize(item)}
                className="flex-1 border border-gray-300 text-gray-600 text-xs font-medium py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Customize
              </button>
            )}
            <button
              onClick={() => onRemove(item.id)}
              className="flex-1 border border-red-300 text-red-500 text-xs font-medium py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
