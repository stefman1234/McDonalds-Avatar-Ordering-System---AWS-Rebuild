import { create } from "zustand";
import type { PendingItem, MenuItemDTO, ComboMealDTO } from "@/lib/types";

interface PendingOrderState {
  pendingItems: PendingItem[];
  addPending: (item: MenuItemDTO, quantity: number, customizations?: string[]) => void;
  updateStatus: (id: string, status: PendingItem["status"]) => void;
  setComboOffer: (id: string, combo: ComboMealDTO) => void;
  confirmItem: (id: string) => PendingItem | null;
  removePending: (id: string) => void;
  clearPending: () => void;
  hasPending: () => boolean;
}

export const usePendingOrderStore = create<PendingOrderState>()((set, get) => ({
  pendingItems: [],

  addPending: (menuItem, quantity, customizations = []) => {
    const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      pendingItems: [
        ...state.pendingItems,
        { id, menuItem, quantity, customizations, status: "confirming" },
      ],
    }));
  },

  updateStatus: (id, status) =>
    set((state) => ({
      pendingItems: state.pendingItems.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    })),

  setComboOffer: (id, combo) =>
    set((state) => ({
      pendingItems: state.pendingItems.map((item) =>
        item.id === id ? { ...item, comboOffer: combo, status: "meal_offer" } : item
      ),
    })),

  confirmItem: (id) => {
    const item = get().pendingItems.find((i) => i.id === id);
    if (!item) return null;
    set((state) => ({
      pendingItems: state.pendingItems.filter((i) => i.id !== id),
    }));
    return item;
  },

  removePending: (id) =>
    set((state) => ({
      pendingItems: state.pendingItems.filter((i) => i.id !== id),
    })),

  clearPending: () => set({ pendingItems: [] }),

  hasPending: () => get().pendingItems.length > 0,
}));
