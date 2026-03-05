import { create } from "zustand";

type Size = "small" | "medium" | "large";

const SUGGESTION_COOLDOWN = 30_000; // 30s between suggestions of same type

interface ConversationState {
  orderedCategories: string[];
  preferredSize: Size | null;
  suggestionsGiven: Map<string, number>; // type -> last timestamp
  lastSuggestionTime: number;

  addOrderedCategory: (category: string) => void;
  setPreferredSize: (size: Size) => void;
  canSuggest: (type: string) => boolean;
  markSuggested: (type: string) => void;
  reset: () => void;
}

export const useConversationStore = create<ConversationState>()((set, get) => ({
  orderedCategories: [],
  preferredSize: null,
  suggestionsGiven: new Map(),
  lastSuggestionTime: 0,

  addOrderedCategory: (category) =>
    set((state) => ({
      orderedCategories: state.orderedCategories.includes(category)
        ? state.orderedCategories
        : [...state.orderedCategories, category],
    })),

  setPreferredSize: (size) => set({ preferredSize: size }),

  canSuggest: (type) => {
    const last = get().suggestionsGiven.get(type);
    if (!last) return true;
    return Date.now() - last > SUGGESTION_COOLDOWN;
  },

  markSuggested: (type) =>
    set((state) => {
      const map = new Map(state.suggestionsGiven);
      map.set(type, Date.now());
      return { suggestionsGiven: map, lastSuggestionTime: Date.now() };
    }),

  reset: () =>
    set({
      orderedCategories: [],
      preferredSize: null,
      suggestionsGiven: new Map(),
      lastSuggestionTime: 0,
    }),
}));
