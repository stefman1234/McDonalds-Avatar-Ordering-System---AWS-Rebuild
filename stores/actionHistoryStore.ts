import { create } from "zustand";
import type { CartItem } from "@/lib/types";

export interface ActionRecord {
  type: "add" | "remove" | "modify";
  item: CartItem; // snapshot of the item before the action
  timestamp: number;
}

const MAX_HISTORY = 10;

interface ActionHistoryState {
  history: ActionRecord[];
  push: (record: ActionRecord) => void;
  pop: () => ActionRecord | undefined;
  clear: () => void;
}

export const useActionHistoryStore = create<ActionHistoryState>()((set, get) => ({
  history: [],

  push: (record) =>
    set((state) => ({
      history: [...state.history, record].slice(-MAX_HISTORY),
    })),

  pop: () => {
    const { history } = get();
    if (history.length === 0) return undefined;
    const last = history[history.length - 1];
    set({ history: history.slice(0, -1) });
    return last;
  },

  clear: () => set({ history: [] }),
}));
