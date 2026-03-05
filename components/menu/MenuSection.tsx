"use client";

import { useState, useEffect, useCallback } from "react";
import CategoryTabs from "./CategoryTabs";
import MenuCard from "./MenuCard";
import CustomizationModal from "./CustomizationModal";
import { useCartStore } from "@/stores/cartStore";
import type { CategoryDTO, MenuItemDTO } from "@/lib/types";

export default function MenuSection() {
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

  const fetchMenu = useCallback(async () => {
    if (categories.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/menu");
      const data: CategoryDTO[] = await res.json();
      setCategories(data);
      if (data.length > 0) setActiveTab(data[0].id);
    } catch (err) {
      console.error("Failed to fetch menu:", err);
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

  function handleCustomizeConfirm(
    item: MenuItemDTO,
    customizations: string[]
  ) {
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

  const activeItems =
    typeof activeTab === "number"
      ? categories.find((c) => c.id === activeTab)?.items ?? []
      : [];

  return (
    <>
      <div
        className="flex-shrink-0 bg-white border-t-4 border-mcdonalds-yellow overflow-hidden"
        style={{ height: "35vh", minHeight: "300px" }}
      >
        {/* Category Tabs */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-mcdonalds-red border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <CategoryTabs
            categories={categories}
            activeId={activeTab}
            onSelect={setActiveTab}
            orderCount={itemCount()}
          />
        )}

        {/* Content area */}
        <div className="h-full overflow-hidden">
          {activeTab === "your_order" ? (
            // Your Order view
            cartItems.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto px-4 py-3 no-scrollbar">
                {cartItems.map((ci) => (
                  <div
                    key={ci.id}
                    className="flex-shrink-0 w-48 bg-white rounded-xl shadow-lg border border-gray-100 p-3"
                  >
                    <h4 className="text-sm font-bold text-gray-900 truncate">
                      {ci.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Qty: {ci.quantity}
                    </p>
                    {ci.customizations.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {ci.customizations.join(", ")}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-mcdonalds-red">
                        ${(ci.unitPrice * ci.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(ci.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                <span className="text-4xl mb-2">🛒</span>
                <p className="text-gray-900 font-semibold">
                  Your order is empty
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Add items from the menu or speak to Casey
                </p>
                <button
                  onClick={() => {
                    if (categories.length > 0) setActiveTab(categories[0].id);
                  }}
                  className="mt-3 px-4 py-1.5 bg-mcdonalds-red text-white text-sm font-semibold rounded-lg hover:bg-[#C41E3A] active:scale-95 transition-all"
                >
                  Browse Menu
                </button>
              </div>
            )
          ) : (
            // Menu carousel
            <div className="flex gap-4 overflow-x-auto px-4 py-3 no-scrollbar">
              {activeItems.map((item) => (
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
              {!loading && activeItems.length === 0 && (
                <div className="flex items-center justify-center w-full py-8">
                  <p className="text-gray-400 text-sm">
                    No items in this category
                  </p>
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
