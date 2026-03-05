import { create } from 'zustand';
import type { MenuItem } from '@/lib/utils/fuzzyMatcher';

export interface ClarificationRequest {
  type: 'size' | 'meal_format' | 'variant' | 'drink' | 'item_not_found';
  itemId?: string;
  itemName?: string;
  options?: string[];
  question: string;
  context?: any;
}

interface ClarificationState {
  // Clarification queue
  pendingClarifications: ClarificationRequest[];
  currentClarification: ClarificationRequest | null;
  currentClarificationIndex: number;

  // Original user request
  originalOrder: string;

  // Clarified data collected so far
  clarifiedItems: Map<string, any>;

  // Item not found state
  itemNotFound: boolean;
  searchQuery: string;
  filteredItems: MenuItem[];
  awaitingManualSelection: boolean;
  filterMessage: string;
}

interface ClarificationActions {
  // Start a new clarification session
  startClarification: (order: string, clarifications: ClarificationRequest[]) => void;

  // Answer the current clarification
  answerClarification: (answer: string, itemData?: any) => void;

  // Move to next clarification
  nextClarification: () => void;

  // Complete all clarifications
  completeClarification: () => void;

  // Cancel clarification session
  cancelClarification: () => void;

  // Item not found actions
  setItemNotFound: (query: string, matches: MenuItem[], message: string) => void;
  selectFromFiltered: (item: MenuItem) => void;
  clearFilter: () => void;

  // Get clarification progress
  getProgress: () => { current: number; total: number; percentage: number };
}

export const useClarificationStore = create<ClarificationState & ClarificationActions>((set, get) => ({
  // Initial state
  pendingClarifications: [],
  currentClarification: null,
  currentClarificationIndex: 0,
  originalOrder: '',
  clarifiedItems: new Map(),
  itemNotFound: false,
  searchQuery: '',
  filteredItems: [],
  awaitingManualSelection: false,
  filterMessage: '',

  // Start clarification session
  startClarification: (order, clarifications) => {
    console.log('[Clarification Store] Starting clarification for:', order);
    console.log('[Clarification Store] Clarifications needed:', clarifications);

    set({
      originalOrder: order,
      pendingClarifications: clarifications,
      currentClarification: clarifications[0] || null,
      currentClarificationIndex: 0,
      clarifiedItems: new Map(),
      itemNotFound: false,
      awaitingManualSelection: false,
    });
  },

  // Answer current clarification and store the result
  answerClarification: (answer, itemData) => {
    const { currentClarification, clarifiedItems, currentClarificationIndex } = get();

    if (!currentClarification) {
      console.warn('[Clarification Store] No current clarification to answer');
      return;
    }

    console.log('[Clarification Store] Answering clarification:', answer);

    // Store the clarified data
    const newClarifiedItems = new Map(clarifiedItems);
    const key = currentClarification.itemId || `clarification_${currentClarificationIndex}`;

    newClarifiedItems.set(key, {
      type: currentClarification.type,
      answer,
      itemData,
      timestamp: Date.now(),
    });

    set({ clarifiedItems: newClarifiedItems });

    // Move to next clarification
    get().nextClarification();
  },

  // Move to the next clarification in the queue
  nextClarification: () => {
    const { pendingClarifications, currentClarificationIndex } = get();
    const nextIndex = currentClarificationIndex + 1;

    if (nextIndex < pendingClarifications.length) {
      console.log(`[Clarification Store] Moving to clarification ${nextIndex + 1}/${pendingClarifications.length}`);
      set({
        currentClarification: pendingClarifications[nextIndex],
        currentClarificationIndex: nextIndex,
      });
    } else {
      console.log('[Clarification Store] All clarifications completed');
      get().completeClarification();
    }
  },

  // Complete the clarification session
  completeClarification: () => {
    console.log('[Clarification Store] Completing clarification session');

    set({
      currentClarification: null,
      pendingClarifications: [],
      currentClarificationIndex: 0,
      // Keep clarifiedItems for the order processing
    });
  },

  // Cancel the clarification session
  cancelClarification: () => {
    console.log('[Clarification Store] Cancelling clarification session');

    set({
      pendingClarifications: [],
      currentClarification: null,
      currentClarificationIndex: 0,
      originalOrder: '',
      clarifiedItems: new Map(),
      itemNotFound: false,
      searchQuery: '',
      filteredItems: [],
      awaitingManualSelection: false,
      filterMessage: '',
    });
  },

  // Set item not found state with filtered suggestions
  setItemNotFound: (query, matches, message) => {
    console.log(`[Clarification Store] Item not found: "${query}"`);
    console.log(`[Clarification Store] Showing ${matches.length} filtered matches`);

    set({
      itemNotFound: true,
      searchQuery: query,
      filteredItems: matches,
      awaitingManualSelection: true,
      filterMessage: message,
    });
  },

  // User selected an item from filtered results
  selectFromFiltered: (item) => {
    console.log(`[Clarification Store] User selected from filter: ${item.name}`);

    // Check if the selected item needs clarification (size, meal format, etc.)
    const needsClarification = checkItemClarification(item);

    if (needsClarification.length > 0) {
      console.log('[Clarification Store] Selected item needs clarification');
      set((state) => ({
        itemNotFound: false,
        awaitingManualSelection: false,
        pendingClarifications: [...state.pendingClarifications, ...needsClarification],
        currentClarification: needsClarification[0],
      }));
    } else {
      // Item is fully specified, clear filter state
      set({
        itemNotFound: false,
        searchQuery: '',
        filteredItems: [],
        awaitingManualSelection: false,
        filterMessage: '',
      });
    }
  },

  // Clear filter and return to normal state
  clearFilter: () => {
    console.log('[Clarification Store] Clearing filter');

    set({
      itemNotFound: false,
      searchQuery: '',
      filteredItems: [],
      awaitingManualSelection: false,
      filterMessage: '',
    });
  },

  // Get progress through clarifications
  getProgress: () => {
    const { pendingClarifications, currentClarificationIndex } = get();
    const total = pendingClarifications.length;
    const current = total > 0 ? currentClarificationIndex + 1 : 0;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 100;

    return { current, total, percentage };
  },
}));

/**
 * Helper function to check if an item needs clarification
 * Returns array of clarification requests needed
 */
function checkItemClarification(item: MenuItem): ClarificationRequest[] {
  const clarifications: ClarificationRequest[] = [];

  // Check if item has multiple sizes
  // (This would require menu_item_sizes data - simplified for now)
  // if (item.menu_item_sizes && item.menu_item_sizes.length > 1) {
  //   clarifications.push({
  //     type: 'size',
  //     itemId: item.id,
  //     itemName: item.name,
  //     options: item.menu_item_sizes.map(s => s.size_name),
  //     question: `What size ${item.name} would you like?`,
  //   });
  // }

  // Check if item should be a meal
  if (item.category === 'burger' || item.category === 'chicken') {
    clarifications.push({
      type: 'meal_format',
      itemId: item.id,
      itemName: item.name,
      options: ['à la carte', 'medium meal', 'large meal'],
      question: `Would you like the ${item.name} as à la carte, or as a medium or large meal?`,
    });
  }

  return clarifications;
}
