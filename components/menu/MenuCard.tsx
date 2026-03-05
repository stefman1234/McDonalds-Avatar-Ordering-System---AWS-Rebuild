"use client";

import type { MenuItemDTO } from "@/lib/types";

interface MenuCardProps {
  item: MenuItemDTO;
  onAdd: (item: MenuItemDTO) => void;
  onCustomize?: (item: MenuItemDTO) => void;
}

function getItemIcon(name: string, categoryName?: string): string {
  const n = name.toLowerCase();
  if (n.includes("big mac")) return "🍔";
  if (n.includes("filet") || n.includes("fish")) return "🐟";
  if (n.includes("chicken") || n.includes("mcchicken") || n.includes("nugget")) return "🍗";
  if (n.includes("fries") || n.includes("fry")) return "🍟";
  if (n.includes("happy meal")) return "🎉";
  if (n.includes("sundae") || n.includes("ice cream")) return "🍦";
  if (n.includes("mcflurry")) return "🥤";
  if (n.includes("apple") && n.includes("pie")) return "🥧";
  if (n.includes("shake")) return "🥤";
  if (n.includes("salad")) return "🥗";
  if (n.includes("wrap")) return "🌯";
  if (n.includes("milo")) return "☕";
  if (n.includes("coffee") || n.includes("latte") || n.includes("cappuccino")) return "☕";
  if (n.includes("juice")) return "🧃";
  if (n.includes("water")) return "💧";
  if (n.includes("corn")) return "🌽";

  const cat = (categoryName || "").toLowerCase();
  if (cat.includes("burger")) return "🍔";
  if (cat.includes("chicken")) return "🍗";
  if (cat.includes("side")) return "🍟";
  if (cat.includes("drink")) return "🥤";
  if (cat.includes("dessert")) return "🍨";
  if (cat.includes("happy")) return "🎉";
  return "🍔";
}

export default function MenuCard({ item, onAdd, onCustomize }: MenuCardProps) {
  return (
    <div className="flex-shrink-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
      {/* Image area */}
      <div className="relative h-32 bg-gradient-to-br from-mcdonalds-yellow/80 to-yellow-300 flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-5xl">{getItemIcon(item.name)}</span>
        )}
      </div>

      <div className="p-3">
        {/* Item Name */}
        <h3 className="text-sm font-bold text-gray-900 truncate">
          {item.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 mt-1 mb-3">
          <span className="text-lg font-bold text-mcdonalds-red">
            ${item.price.toFixed(2)}
          </span>
        </div>

        {/* Buttons */}
        <div className="space-y-1.5">
          {item.customizations.length > 0 && onCustomize && (
            <button
              onClick={() => onCustomize(item)}
              className="w-full border-2 border-mcdonalds-red text-mcdonalds-red text-xs font-semibold py-1.5 rounded-lg hover:bg-mcdonalds-red hover:text-white transition-all duration-200 active:scale-95"
            >
              Customize
            </button>
          )}
          <button
            onClick={() => onAdd(item)}
            className="w-full bg-mcdonalds-red text-white text-xs font-bold py-2 rounded-lg shadow-md hover:bg-[#C41E3A] active:scale-95 transition-all duration-200"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
