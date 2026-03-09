"use client";

import { useState } from "react";
import type { MenuItemDTO } from "@/lib/types";
import { triggerFlyAnimation } from "@/lib/cartAnimation";

interface MenuCardProps {
  item: MenuItemDTO;
  onAdd: (item: MenuItemDTO) => void;
  onCustomize?: (item: MenuItemDTO) => void;
}

function getItemIcon(name: string, categoryName?: string): string {
  const n = name.toLowerCase();
  if (n.includes("big mac")) return "\u{1F354}";
  if (n.includes("filet") || n.includes("fish")) return "\u{1F41F}";
  if (n.includes("chicken") || n.includes("mcchicken") || n.includes("nugget")) return "\u{1F357}";
  if (n.includes("fries") || n.includes("fry")) return "\u{1F35F}";
  if (n.includes("happy meal")) return "\u{1F389}";
  if (n.includes("sundae") || n.includes("ice cream")) return "\u{1F366}";
  if (n.includes("mcflurry")) return "\u{1F964}";
  if (n.includes("apple") && n.includes("pie")) return "\u{1F967}";
  if (n.includes("shake")) return "\u{1F964}";
  if (n.includes("salad")) return "\u{1F957}";
  if (n.includes("wrap")) return "\u{1F32F}";
  if (n.includes("milo")) return "\u2615";
  if (n.includes("coffee") || n.includes("latte") || n.includes("cappuccino")) return "\u2615";
  if (n.includes("juice")) return "\u{1F9C3}";
  if (n.includes("water")) return "\u{1F4A7}";
  if (n.includes("corn")) return "\u{1F33D}";

  const cat = (categoryName || "").toLowerCase();
  if (cat.includes("burger")) return "\u{1F354}";
  if (cat.includes("chicken")) return "\u{1F357}";
  if (cat.includes("side")) return "\u{1F35F}";
  if (cat.includes("drink")) return "\u{1F964}";
  if (cat.includes("dessert")) return "\u{1F368}";
  if (cat.includes("happy")) return "\u{1F389}";
  return "\u{1F354}";
}

export default function MenuCard({ item, onAdd, onCustomize }: MenuCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex-shrink-0 w-60 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
      {/* Image area */}
      <div className="relative h-48 bg-gradient-to-br from-yellow-400 to-yellow-200 flex items-center justify-center overflow-hidden">
        {item.imageUrl && !imageError ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-6xl">{getItemIcon(item.name, item.categoryName)}</span>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {item.popular && (
            <span className="bg-mcdonalds-red text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
              POPULAR
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        {/* Item Name */}
        <h3 className="text-sm font-bold text-gray-900 truncate">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1 mt-1 mb-3">
          <span className="text-lg font-bold text-mcdonalds-red">
            RM {item.price.toFixed(2)}
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
            onClick={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              triggerFlyAnimation(rect, getItemIcon(item.name, item.categoryName));
              onAdd(item);
            }}
            className="w-full bg-mcdonalds-red text-white text-xs font-bold py-2 rounded-lg shadow-md hover:bg-[#C41E3A] active:scale-95 transition-all duration-200"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
