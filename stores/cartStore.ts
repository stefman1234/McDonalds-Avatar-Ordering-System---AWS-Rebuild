import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

const TAX_RATE = 0.0825;

function getItemTotal(item: CartItem): number {
  let price = item.unitPrice;
  if (item.isCombo) price += 2.5;
  if (item.isCombo && item.mealSize === "large") price += 1.0;
  if (item.selectedSize?.priceModifier) price += item.selectedSize.priceModifier;
  if (item.mealSide?.priceModifier) price += item.mealSide.priceModifier;
  if (item.mealDrink?.priceModifier) price += item.mealDrink.priceModifier;
  if (item.richCustomizations) {
    price += item.richCustomizations.reduce((s, c) => s + c.priceModifier, 0);
  }
  return price * item.quantity;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateCustomizations: (id: string, customizations: string[]) => void;
  clearCart: () => void;
  getItemTotal: (item: CartItem) => number;
  subtotal: () => number;
  tax: () => number;
  total: () => number;
  itemCount: () => number;
  cartSummary: () => string;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const id = `${item.menuItemId}-${item.customizations.sort().join(",")}`;
        set((state) => {
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, id }] };
        });
      },

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id ? { ...i, quantity } : i
                ),
        })),

      updateCustomizations: (id, customizations) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, customizations } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      getItemTotal: (item: CartItem) => getItemTotal(item),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + getItemTotal(item), 0),

      tax: () => {
        const sub = get().subtotal();
        return Math.round(sub * TAX_RATE * 100) / 100;
      },

      total: () => {
        const sub = get().subtotal();
        const t = Math.round(sub * TAX_RATE * 100) / 100;
        return Math.round((sub + t) * 100) / 100;
      },

      itemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      cartSummary: () => {
        const items = get().items;
        if (items.length === 0) return "Empty";
        return items
          .map((i) => {
            let desc = `${i.quantity}x ${i.name}`;
            if (i.isCombo) {
              const parts: string[] = [];
              if (i.mealSize) parts.push(`${i.mealSize} meal`);
              if (i.mealSide) parts.push(i.mealSide.name);
              if (i.mealDrink) {
                let drink = i.mealDrink.name;
                if (i.mealDrink.iceLevel && i.mealDrink.iceLevel !== "full") {
                  drink += i.mealDrink.iceLevel === "none" ? " no ice" : " less ice";
                }
                parts.push(drink);
              }
              desc += ` MEAL (${parts.join(", ")})`;
            } else if (i.customizations.length) {
              desc += ` (${i.customizations.join(", ")})`;
            }
            return desc;
          })
          .join(", ");
      },
    }),
    { name: "mcdonalds-cart" }
  )
);
