"use client";

import type { CategoryDTO } from "@/lib/types";

interface CategoryTab {
  id: number | "your_order";
  label: string;
  icon: string;
}

interface CategoryTabsProps {
  categories: CategoryDTO[];
  activeId: number | "your_order" | null;
  onSelect: (id: number | "your_order") => void;
  orderCount?: number;
}

export default function CategoryTabs({
  categories,
  activeId,
  onSelect,
  orderCount = 0,
}: CategoryTabsProps) {
  const tabs: CategoryTab[] = [
    ...categories.map((cat) => ({
      id: cat.id as number | "your_order",
      label: cat.name,
      icon: getCategoryIcon(cat.name),
    })),
    { id: "your_order", label: "Your Order", icon: "🛒" },
  ];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => {
            const isActive = activeId === tab.id;
            const isYourOrder = tab.id === "your_order";

            return (
              <button
                key={String(tab.id)}
                onClick={() => onSelect(tab.id)}
                className={`
                  flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200
                  ${
                    isYourOrder
                      ? isActive
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                      : isActive
                        ? "bg-mcdonalds-red text-white shadow-md"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                <span className="whitespace-nowrap">{tab.label}</span>
                {isYourOrder && orderCount > 0 && (
                  <span className="bg-green-800 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {orderCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getCategoryIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("burger")) return "🍔";
  if (lower.includes("chicken") || lower.includes("fish")) return "🍗";
  if (lower.includes("side")) return "🍟";
  if (lower.includes("drink") || lower.includes("beverage")) return "🥤";
  if (lower.includes("dessert")) return "🍦";
  if (lower.includes("breakfast")) return "🥞";
  if (lower.includes("happy")) return "🎁";
  return "🍔";
}
