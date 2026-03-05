"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AvatarContainer from "@/components/avatar/AvatarContainer";
import ChatMessages from "@/components/avatar/ChatMessages";
import MicButton from "@/components/avatar/MicButton";
import MenuSection from "@/components/menu/MenuSection";
import CartDrawer from "@/components/cart/CartDrawer";
import CartButton from "@/components/cart/CartButton";
import DebugPanel from "@/components/debug/DebugPanel";
import { useUIStore } from "@/stores/uiStore";
import { useCartStore } from "@/stores/cartStore";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { onSTT, speak, onVideoReady, endStt, destroyAvatar } from "@/lib/klleon/avatar";
import type { NLPOrderIntent } from "@/lib/types";

export default function OrderPage() {
  const router = useRouter();
  const setProcessing = useUIStore((s) => s.setProcessing);
  const setListening = useUIStore((s) => s.setListening);
  const addChatMessage = useUIStore((s) => s.addChatMessage);
  const isProcessing = useUIStore((s) => s.isProcessing);
  const chatMessages = useUIStore((s) => s.chatMessages);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const cartSummary = useCartStore((s) => s.cartSummary);
  const items = useCartStore((s) => s.items);

  // 30-second idle timeout — return to idle screen
  useIdleTimeout(() => {
    clearCart();
    destroyAvatar();
    router.push("/");
  }, 30000);

  const handleNLPResponse = useCallback(
    (intent: NLPOrderIntent) => {
      switch (intent.action) {
        case "add":
          for (const item of intent.items) {
            if (item.matchedMenuItemId) {
              addItem({
                menuItemId: item.matchedMenuItemId,
                name: item.name,
                quantity: item.quantity,
                unitPrice: 0,
                customizations: item.customizations,
                imageUrl: null,
              });
            }
          }
          break;

        case "remove":
          for (const item of intent.items) {
            const cartItem = items.find(
              (ci) =>
                ci.name.toLowerCase() === item.name.toLowerCase() ||
                ci.menuItemId === item.matchedMenuItemId
            );
            if (cartItem) removeItem(cartItem.id);
          }
          break;

        case "clear":
          clearCart();
          break;

        case "checkout":
          break;
      }

      if (intent.response) {
        speak(intent.response);
        addChatMessage({ role: "assistant", text: intent.response });
      }
    },
    [addItem, removeItem, clearCart, items, addChatMessage]
  );

  const processTranscript = useCallback(
    async (transcript: string) => {
      if (isProcessing) return;

      endStt();
      setListening(false);
      addChatMessage({ role: "user", text: transcript });
      setProcessing(true);

      try {
        const recentMessages = chatMessages.slice(-5).map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const res = await fetch("/api/nlp/parse-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            cartSummary: cartSummary(),
            conversationHistory: recentMessages,
          }),
        });

        if (!res.ok) throw new Error("NLP request failed");

        const intent: NLPOrderIntent = await res.json();
        handleNLPResponse(intent);
      } catch (err) {
        console.error("Order processing error:", err);
        speak("Sorry, I had trouble understanding that. Could you try again?");
        addChatMessage({
          role: "assistant",
          text: "Sorry, I had trouble understanding that. Could you try again?",
        });
      } finally {
        setProcessing(false);
      }
    },
    [
      isProcessing,
      addChatMessage,
      setProcessing,
      setListening,
      cartSummary,
      chatMessages,
      handleNLPResponse,
    ]
  );

  // Register STT callback + video ready greeting (once on mount)
  useEffect(() => {
    let greeted = false;

    onSTT((transcript) => {
      console.log("[OrderPage] STT received:", transcript);
      processTranscript(transcript);
    });

    onVideoReady(() => {
      if (greeted) return;
      greeted = true;
      console.log("[OrderPage] VIDEO_CAN_PLAY fired — greeting with 1s delay");
      setTimeout(() => {
        const greeting = "Hi! Welcome to McDonald's. What can I get for you today?";
        speak(greeting);
        addChatMessage({ role: "assistant", text: greeting });
      }, 1000);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header - McDonald's branding + cart */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-50">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-mcdonalds-red rounded-full flex items-center justify-center shadow-md">
                <span className="text-xl font-bold text-mcdonalds-yellow">M</span>
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">McDonald&apos;s</h1>
                <p className="text-xs text-gray-500">Order with Casey</p>
              </div>
            </div>
            <CartButton />
          </div>
        </div>
      </header>

      {/* Avatar Zone - takes remaining top space (~65%) */}
      <div className="relative flex-1 bg-gradient-to-br from-mcdonalds-red to-[#C41E3A] py-1 overflow-hidden">
        <AvatarContainer />

        {/* Chat messages overlay */}
        <ChatMessages />

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-mcdonalds-yellow border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm">Processing...</span>
            </div>
          </div>
        )}

        {/* Mic button - large, centered at bottom of avatar zone */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
          <MicButton />
        </div>
      </div>

      {/* Menu Section - fixed bottom ~35% */}
      <MenuSection />

      {/* Cart Drawer (bottom sheet overlay) */}
      <CartDrawer />

      {/* Debug panel (F8) */}
      <DebugPanel />
    </div>
  );
}
