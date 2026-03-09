import { create } from "zustand";
import type { ChatMessage } from "@/lib/types";

interface UIState {
  menuOpen: boolean;
  cartOpen: boolean;
  checkoutOpen: boolean;
  checkoutGateOpen: boolean;
  checkoutGateTrigger: "touch" | "voice" | null;
  isListening: boolean;
  isProcessing: boolean;
  chatMessages: ChatMessage[];
  avatarReady: boolean;

  setMenuOpen: (open: boolean) => void;
  setCartOpen: (open: boolean) => void;
  setCheckoutOpen: (open: boolean) => void;
  openCheckoutGate: (trigger: "touch" | "voice") => void;
  setCheckoutGateOpen: (open: boolean) => void;
  setListening: (listening: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setAvatarReady: (ready: boolean) => void;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearMessages: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  menuOpen: false,
  cartOpen: false,
  checkoutOpen: false,
  checkoutGateOpen: false,
  checkoutGateTrigger: null,
  isListening: false,
  isProcessing: false,
  chatMessages: [],
  avatarReady: false,

  setMenuOpen: (open) => set({ menuOpen: open, cartOpen: false }),
  setCartOpen: (open) => set({ cartOpen: open, menuOpen: false }),
  setCheckoutOpen: (open) => set({ checkoutOpen: open, cartOpen: false }),
  openCheckoutGate: (trigger) => set({ checkoutGateOpen: true, checkoutGateTrigger: trigger }),
  setCheckoutGateOpen: (open) => set({ checkoutGateOpen: open, ...(open ? {} : { checkoutGateTrigger: null }) }),
  setListening: (listening) => set({ isListening: listening }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  setAvatarReady: (ready) => set({ avatarReady: ready }),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        { ...msg, id: crypto.randomUUID(), timestamp: Date.now() },
      ],
    })),

  clearMessages: () => set({ chatMessages: [] }),
}));
