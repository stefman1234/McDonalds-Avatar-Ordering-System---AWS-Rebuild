import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/types";

const TAX_RATE = 0.0825;

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
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

      clearCart: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        ),

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
          .map(
            (i) =>
              `${i.quantity}x ${i.name}${
                i.customizations.length
                  ? ` (${i.customizations.join(", ")})`
                  : ""
              }`
          )
          .join(", ");
      },
    }),
    { name: "mcdonalds-cart" }
  )
);
