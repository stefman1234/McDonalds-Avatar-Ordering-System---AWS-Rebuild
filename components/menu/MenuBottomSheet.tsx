"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import CategoryTabs from "./CategoryTabs";
import MenuCard from "./MenuCard";
import CustomizationModal from "./CustomizationModal";
import { useUIStore } from "@/stores/uiStore";
import { useCartStore } from "@/stores/cartStore";
import type { CategoryDTO, MenuItemDTO } from "@/lib/types";

const AUTO_COLLAPSE_DELAY = 15000; // 15 seconds

export default function MenuBottomSheet() {
  const menuOpen = useUIStore((s) => s.menuOpen);
  const setMenuOpen = useUIStore((s) => s.setMenuOpen);
  const addItem = useCartStore((s) => s.addItem);

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | "your_order" | null>(null);
  const [customizeItem, setCustomizeItem] = useState<MenuItemDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-collapse after 15s of no interaction
  const resetCollapseTimer = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => {
      setMenuOpen(false);
    }, AUTO_COLLAPSE_DELAY);
  }, [setMenuOpen]);

  useEffect(() => {
    if (menuOpen) {
      resetCollapseTimer();
    } else if (collapseTimer.current) {
      clearTimeout(collapseTimer.current);
    }
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, [menuOpen, resetCollapseTimer]);

  const fetchMenu = useCallback(async () => {
    if (categories.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/menu");
      const data: CategoryDTO[] = await res.json();
      setCategories(data);
      if (data.length > 0) setActiveCategory(data[0].id);
    } catch (err) {
      console.error("Failed to fetch menu:", err);
    } finally {
      setLoading(false);
    }
  }, [categories.length]);

  useEffect(() => {
    if (menuOpen) fetchMenu();
  }, [menuOpen, fetchMenu]);

  function handleAdd(item: MenuItemDTO) {
    resetCollapseTimer();
    addItem({
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice: item.price,
      customizations: [],
      imageUrl: item.imageUrl,
    });
  }

  function handleCustomizeConfirm(item: MenuItemDTO, customizations: string[]) {
    resetCollapseTimer();
    const extraCost = item.customizations
      .filter((c) => customizations.includes(c.name))
      .reduce((sum, c) => sum + c.priceExtra, 0);

    addItem({
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice: item.price + extraCost,
      customizations,
      imageUrl: item.imageUrl,
    });
  }

  function handleCategorySelect(id: number | "your_order") {
    resetCollapseTimer();
    setActiveCategory(id);
  }

  const activeItems =
    categories.find((c) => c.id === activeCategory)?.items ?? [];

  return (
    <>
      <BottomSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
        height="65vh"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-mcdonalds-yellow border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <CategoryTabs
              categories={categories}
              activeId={activeCategory}
              onSelect={handleCategorySelect}
            />

            {/* Horizontal scroll of cards */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {activeItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  onAdd={handleAdd}
                  onCustomize={
                    item.customizations.length > 0
                      ? (i) => {
                          resetCollapseTimer();
                          setCustomizeItem(i);
                        }
                      : undefined
                  }
                />
              ))}
              {activeItems.length === 0 && (
                <p className="text-white/40 text-sm py-8">
                  No items in this category
                </p>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      <CustomizationModal
        item={customizeItem}
        open={customizeItem !== null}
        onClose={() => setCustomizeItem(null)}
        onConfirm={handleCustomizeConfirm}
      />
    </>
  );
}
