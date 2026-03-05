import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
export interface CartItemCustomization {
  id: string;
  name: string;
  category: string;
  priceModifier: number;
}

export interface CartItem {
  id: string; // Unique cart item ID (not menu item ID)
  menuItemId?: string; // Reference to menu item
  comboId?: string; // Reference to combo meal
  name: string;
  basePrice: number;
  quantity: number;
  selectedSize?: {
    id: string;
    name: string;
    priceModifier: number;
  };
  customizations: CartItemCustomization[];
  specialInstructions?: string;
  isCombo: boolean;
  mealSize?: 'medium' | 'large' | null;
  mealSide?: {
    id: string;
    name: string;
    priceModifier: number;
  } | null;
  mealDrink?: {
    id: string;
    name: string;
    priceModifier: number;
    iceLevel?: 'none' | 'less' | 'full';
  } | null;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateCustomizations: (id: string, customizations: CartItemCustomization[]) => void;
  updateSpecialInstructions: (id: string, instructions: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemTotal: (item: CartItem) => number;
}

// Helper function to generate unique cart item ID
const generateCartItemId = (): string => {
  return `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to calculate item total
const calculateItemTotal = (item: CartItem): number => {
  let total = item.basePrice;

  // Add meal upcharge if it's a combo
  if (item.isCombo) {
    total += 2.50; // Base meal upcharge
    if (item.mealSize === 'large') {
      total += 1.00; // Large meal upcharge
    }
  }

  // Add size price modifier
  if (item.selectedSize) {
    total += item.selectedSize.priceModifier;
  }

  // Add customization price modifiers
  if (item.customizations && Array.isArray(item.customizations)) {
    item.customizations.forEach(customization => {
      total += customization.priceModifier;
    });
  }

  // Add meal side price modifier
  if (item.mealSide) {
    total += item.mealSide.priceModifier;
  }

  // Add meal drink price modifier
  if (item.mealDrink) {
    total += item.mealDrink.priceModifier;
  }

  // Multiply by quantity
  return total * item.quantity;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const newItem: CartItem = {
          ...item,
          id: generateCartItemId(),
          customizations: item.customizations || [], // Ensure customizations is always an array
        };

        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      updateCustomizations: (id, customizations) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, customizations } : item
          ),
        }));
      },

      updateSpecialInstructions: (id, instructions) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, specialInstructions: instructions } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + calculateItemTotal(item), 0);
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      getItemTotal: (item) => {
        return calculateItemTotal(item);
      },
    }),
    {
      name: 'mcdonalds-cart-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
