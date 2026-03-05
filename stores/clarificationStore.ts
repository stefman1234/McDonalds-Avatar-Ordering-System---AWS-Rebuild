import { create } from "zustand";
import type { MenuItemDTO, ClarificationType } from "@/lib/types";

interface ClarificationState {
  active: boolean;
  type: ClarificationType | null;
  originalQuery: string;
  candidates: MenuItemDTO[];
  activate: (type: ClarificationType, query: string, candidates?: MenuItemDTO[]) => void;
  resolve: (item: MenuItemDTO) => void;
  dismiss: () => void;
}

export const useClarificationStore = create<ClarificationState>()((set) => ({
  active: false,
  type: null,
  originalQuery: "",
  candidates: [],

  activate: (type, query, candidates = []) =>
    set({ active: true, type, originalQuery: query, candidates }),

  resolve: () =>
    set({ active: false, type: null, originalQuery: "", candidates: [] }),

  dismiss: () =>
    set({ active: false, type: null, originalQuery: "", candidates: [] }),
}));
