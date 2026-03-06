"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CategoryTabs from "./CategoryTabs";
import MenuCard from "./MenuCard";
import CustomizationModal from "./CustomizationModal";
import FilterBanner from "./FilterBanner";
import ClarificationBanner from "./ClarificationBanner";
import { useCartStore } from "@/stores/cartStore";
import { useDragScroll } from "@/hooks/useDragScroll";
import OrderItemsCarousel from "@/components/order/OrderItemsCarousel";
import type { CategoryDTO, MenuItemDTO, MealSideOption, MealDrinkOption, CartItemCustomization } from "@/lib/types";

interface MenuSectionProps {
  filteredItemIds?: number[] | null;
  filterQuery?: string;
  onClearFilter?: () => void;
}

function ScrollArrows({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const check = () => {
      setShowLeft(el.scrollLeft > 10);
      setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [containerRef]);

  const scroll = (dir: number) => {
    containerRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <>
      {showLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {showRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </>
  );
}

export default function MenuSection({
  filteredItemIds,
  filterQuery,
  onClearFilter,
}: MenuSectionProps) {
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const cartItems = useCartStore((s) => s.items);
  const itemCount = useCartStore((s) => s.itemCount);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [activeTab, setActiveTab] = useState<number | "your_order" | null>(
    null
  );
  const [customizeItem, setCustomizeItem] = useState<MenuItemDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuError, setMenuError] = useState(false);

  const { containerRef, isDragging, handlers } = useDragScroll();

  const fetchMenu = useCallback(async () => {
    if (categories.length > 0) return;
    setLoading(true);
    setMenuError(false);
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.error("Menu API returned non-array:", data);
        setMenuError(true);
        return;
      }
      if (data.length === 0) {
        setMenuError(true);
        return;
      }
      setCategories(data);
      if (data.length > 0) setActiveTab(data[0].id);
    } catch (err) {
      console.error("Failed to fetch menu:", err);
      setMenuError(true);
    } finally {
      setLoading(false);
    }
  }, [categories.length]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  function handleAdd(item: MenuItemDTO) {
    addItem({
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice: item.price,
      customizations: [],
      imageUrl: item.imageUrl,
    });
  }

  function handleSelectClarification(itemId: number) {
    const allItems = categories.flatMap((c) => c.items);
    const item = allItems.find((i) => i.id === itemId);
    if (item) handleAdd(item);
  }

  function handleCustomizeConfirm(
    item: MenuItemDTO,
    customizations: string[],
    extra?: {
      quantity: number;
      isCombo: boolean;
      mealSize: "medium" | "large" | null;
      mealSide: MealSideOption | null;
      mealDrink: (MealDrinkOption & { iceLevel: "none" | "less" | "full" }) | null;
      specialInstructions: string;
      richCustomizations: CartItemCustomization[];
    }
  ) {
    const extraCost = extra
      ? extra.richCustomizations.reduce((s, c) => s + c.priceModifier, 0)
      : item.customizations
          .filter((c) => customizations.includes(c.name))
          .reduce((sum, c) => sum + c.priceExtra, 0);

    addItem({
      menuItemId: item.id,
      name: item.name,
      quantity: extra?.quantity ?? 1,
      unitPrice: item.price + extraCost,
      customizations,
      imageUrl: item.imageUrl,
      isCombo: extra?.isCombo,
      mealSize: extra?.mealSize,
      mealSide: extra?.mealSide,
      mealDrink: extra?.mealDrink,
      specialInstructions: extra?.specialInstructions,
      richCustomizations: extra?.richCustomizations,
    });
  }

  // When filter is active, show filtered items across all categories
  const isFiltered = filteredItemIds && filteredItemIds.length > 0;
  const allItems = categories.flatMap((c) => c.items);
  const filteredItems = isFiltered
    ? allItems.filter((item) => filteredItemIds.includes(item.id))
    : [];

  const activeItems =
    typeof activeTab === "number"
      ? categories.find((c) => c.id === activeTab)?.items ?? []
      : [];

  const displayItems = isFiltered ? filteredItems : activeItems;

  return (
    <>
      <div
        className="flex-shrink-0 flex flex-col bg-white border-t-4 border-mcdonalds-yellow overflow-hidden"
        style={{ height: "35vh", minHeight: "300px" }}
      >
        {/* Category Tabs */}
        {menuError && categories.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-4 px-4 bg-red-50">
            <p className="text-sm text-red-700">Menu unavailable</p>
            <button
              onClick={() => {
                setMenuError(false);
                fetchMenu();
              }}
              className="px-3 py-1 text-sm font-medium text-white bg-mcdonalds-red rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-mcdonalds-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <CategoryTabs
            categories={categories}
            activeId={isFiltered ? null : activeTab}
            onSelect={(id) => {
              setActiveTab(id);
              onClearFilter?.();
            }}
            orderCount={itemCount()}
          />
        )}

        {/* Content area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Filter banners */}
          <div className="px-4 pt-1">
            {isFiltered && filterQuery && (
              <FilterBanner
                query={filterQuery}
                resultCount={filteredItems.length}
                onClear={() => onClearFilter?.()}
              />
            )}
            <ClarificationBanner onSelectItem={handleSelectClarification} />
          </div>

          {activeTab === "your_order" ? (
            <OrderItemsCarousel
              onBrowseMenu={() => {
                if (categories.length > 0) setActiveTab(categories[0].id);
              }}
              onCustomizeItem={(cartItem) => {
                const allItems = categories.flatMap((c) => c.items);
                const menuItem = allItems.find((m) => m.id === cartItem.menuItemId);
                if (menuItem) setCustomizeItem(menuItem);
              }}
            />
          ) : (
            // Menu carousel with drag scroll
            <div className="relative">
              <div
                ref={isFiltered ? undefined : containerRef}
                {...(isFiltered ? {} : handlers)}
                className="flex gap-4 overflow-x-auto px-4 py-3 select-none"
                style={{
                  cursor: isFiltered ? "default" : isDragging ? "grabbing" : "grab",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  scrollSnapType: "none",
                  scrollBehavior: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                {displayItems.map((item) => (
                  <MenuCard
                    key={item.id}
                    item={item}
                    onAdd={handleAdd}
                    onCustomize={
                      item.customizations.length > 0
                        ? (i) => setCustomizeItem(i)
                        : undefined
                    }
                  />
                ))}
                {!loading && displayItems.length === 0 && (
                  <div className="flex items-center justify-center w-full py-8">
                    <p className="text-gray-400 text-sm">
                      No items in this category
                    </p>
                  </div>
                )}
              </div>
              {!isFiltered && <ScrollArrows containerRef={containerRef} />}
              {/* Item count pill */}
              {displayItems.length > 0 && (
                <div className="flex justify-center pb-1">
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {displayItems.length} item{displayItems.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CustomizationModal
        item={customizeItem}
        open={customizeItem !== null}
        onClose={() => setCustomizeItem(null)}
        onConfirm={handleCustomizeConfirm}
      />
    </>
  );
}
