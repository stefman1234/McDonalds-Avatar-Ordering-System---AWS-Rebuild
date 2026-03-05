"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AvatarContainer from "@/components/avatar/AvatarContainer";
import ChatMessages from "@/components/avatar/ChatMessages";
import MicButton from "@/components/avatar/MicButton";
import TextInput from "@/components/avatar/TextInput";
import MenuSection from "@/components/menu/MenuSection";
import CartDrawer from "@/components/cart/CartDrawer";
import CartButton from "@/components/cart/CartButton";
import DebugPanel from "@/components/debug/DebugPanel";
import MealConversionModal from "@/components/menu/MealConversionModal";
import MealSuggestionModal from "@/components/menu/MealSuggestionModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useUIStore } from "@/stores/uiStore";
import { useCartStore } from "@/stores/cartStore";
import { useClarificationStore } from "@/stores/clarificationStore";
import { useConversationStore } from "@/stores/conversationStore";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { onSTT, speak, onVideoReady, endStt, destroyAvatar } from "@/lib/klleon/avatar";
import { buildOrderReadback } from "@/lib/orderReadback";
import { detectMealDeals } from "@/lib/mealDealDetector";
import { getSuggestions, buildSuggestionPrompt } from "@/lib/pairingEngine";
import type {
  NLPOrderIntent,
  NLPOrderItem,
  ComboMealDTO,
  MealDealSuggestion,
  MenuItemDTO,
  VoiceCheckoutStep,
} from "@/lib/types";

export default function OrderPage() {
  const router = useRouter();

  // UI store
  const setProcessing = useUIStore((s) => s.setProcessing);
  const setListening = useUIStore((s) => s.setListening);
  const addChatMessage = useUIStore((s) => s.addChatMessage);
  const isProcessing = useUIStore((s) => s.isProcessing);
  const chatMessages = useUIStore((s) => s.chatMessages);
  const clearMessages = useUIStore((s) => s.clearMessages);

  // Cart store
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const cartSummary = useCartStore((s) => s.cartSummary);
  const items = useCartStore((s) => s.items);

  // Clarification store
  const activateClarification = useClarificationStore((s) => s.activate);

  // Conversation context store
  const addOrderedCategory = useConversationStore((s) => s.addOrderedCategory);
  const setPreferredSize = useConversationStore((s) => s.setPreferredSize);
  const canSuggest = useConversationStore((s) => s.canSuggest);
  const markSuggested = useConversationStore((s) => s.markSuggested);
  const resetConversation = useConversationStore((s) => s.reset);

  // NLP menu filtering
  const [filteredItemIds, setFilteredItemIds] = useState<number[] | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

  // Text input mode
  const [textInputMode, setTextInputMode] = useState(false);

  // Meal conversion modal
  const [mealConversionData, setMealConversionData] = useState<{
    combo: ComboMealDTO;
    itemName: string;
    itemPrice: number;
    pendingItem: NLPOrderItem;
  } | null>(null);

  // Meal deal suggestion
  const [mealDealSuggestion, setMealDealSuggestion] = useState<MealDealSuggestion | null>(null);
  const suggestedDeals = useRef(new Set<number>());

  // Voice checkout flow
  const [voiceCheckoutStep, setVoiceCheckoutStep] = useState<VoiceCheckoutStep>("idle");
  const voiceOrderTypeRef = useRef<string>("dine_in");

  // All menu items for suggestions
  const [allMenuItems, setAllMenuItems] = useState<MenuItemDTO[]>([]);
  const [combos, setCombos] = useState<ComboMealDTO[]>([]);

  // Load combos for meal deal detection
  useEffect(() => {
    fetch("/api/combos")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCombos(data);
      })
      .catch(() => {});

    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const flat = data.flatMap((cat: { items: MenuItemDTO[] }) => cat.items);
          setAllMenuItems(flat);
        }
      })
      .catch(() => {});
  }, []);

  // Detect meal deals when cart changes
  useEffect(() => {
    if (items.length < 2 || combos.length === 0) return;
    const deals = detectMealDeals(items, combos);
    const newDeal = deals.find((d) => !suggestedDeals.current.has(d.combo.id));
    if (newDeal) {
      suggestedDeals.current.add(newDeal.combo.id);
      setMealDealSuggestion(newDeal);
    }
  }, [items, combos]);

  // Clear chat bubbles and cart on mount (e.g. returning from idle screen)
  useEffect(() => {
    clearMessages();
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Idle timeout — 30s redirects to idle
  useIdleTimeout(() => {
    clearCart();
    clearMessages();
    resetConversation();
    destroyAvatar();
    router.push("/");
  }, 30000);

  // Check for meal conversion on voice-added items
  async function checkMealConversion(item: NLPOrderItem) {
    if (!item.matchedMenuItemId) return false;
    try {
      const res = await fetch("/api/meal-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item.matchedMenuItemId }),
      });
      const data = await res.json();
      if (data.combo) {
        setMealConversionData({
          combo: data.combo,
          itemName: item.name,
          itemPrice: item.unitPrice ?? 0,
          pendingItem: item,
        });
        speak(
          `Would you like to make that a ${data.combo.name}? It comes with fries and a drink for just $${(data.combo.basePrice - data.combo.discount).toFixed(2)}.`
        );
        addChatMessage({
          role: "assistant",
          text: `Would you like to make that a ${data.combo.name}?`,
        });
        return true;
      }
    } catch {
      // Silently fail
    }
    return false;
  }

  // Try upselling after adding items
  function tryUpsell() {
    if (items.length === 0 || allMenuItems.length === 0) return;
    const suggestions = getSuggestions(items, allMenuItems);
    const cartCategories = [
      ...new Set(
        items
          .map((ci) => {
            const mi = allMenuItems.find((m) => m.id === ci.menuItemId);
            return mi?.categoryName ?? "";
          })
          .filter(Boolean)
      ),
    ];
    const prompt = buildSuggestionPrompt(suggestions, cartCategories);
    if (prompt && canSuggest("pairing")) {
      markSuggested("pairing");
      setTimeout(() => {
        speak(prompt);
        addChatMessage({ role: "assistant", text: prompt });
      }, 2000);
    }
  }

  const handleNLPResponse = useCallback(
    async (intent: NLPOrderIntent) => {
      switch (intent.action) {
        case "add": {
          let mealOffered = false;
          for (const item of intent.items) {
            if (item.matchedMenuItemId) {
              if (item.categoryName) addOrderedCategory(item.categoryName);

              // Detect size preference
              const nameLower = item.name.toLowerCase();
              if (nameLower.includes("large")) setPreferredSize("large");
              else if (nameLower.includes("small")) setPreferredSize("small");
              else if (nameLower.includes("medium")) setPreferredSize("medium");

              // Meal conversion check on first item
              if (!mealOffered && intent.items.indexOf(item) === 0) {
                mealOffered = await checkMealConversion(item);
              }

              if (!mealOffered) {
                addItem({
                  menuItemId: item.matchedMenuItemId,
                  name: item.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice ?? 0,
                  customizations: item.customizations,
                  imageUrl: null,
                });
              }
            }
          }

          // Filter menu to show matched items
          const matchedIds = intent.items
            .filter((i) => i.matchedMenuItemId)
            .map((i) => i.matchedMenuItemId!);
          if (matchedIds.length > 0) {
            setFilteredItemIds(matchedIds);
            setFilterQuery(intent.items.map((i) => i.name).join(", "));
          }

          if (!mealOffered) setTimeout(tryUpsell, 3000);
          break;
        }

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

        case "modify":
          for (const item of intent.items) {
            const originalName = item.originalName ?? item.name;
            const cartItem = items.find(
              (ci) => ci.name.toLowerCase() === originalName.toLowerCase()
            );
            if (cartItem) {
              removeItem(cartItem.id);
              if (item.matchedMenuItemId) {
                addItem({
                  menuItemId: item.matchedMenuItemId,
                  name: item.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice ?? cartItem.unitPrice,
                  customizations: item.customizations,
                  imageUrl: null,
                });
              }
            }
          }
          break;

        case "clear":
          clearCart();
          break;

        case "checkout": {
          if (items.length === 0) {
            speak("Your order is empty. What would you like to order?");
            addChatMessage({
              role: "assistant",
              text: "Your order is empty. What would you like to order?",
            });
            break;
          }
          const readback = buildOrderReadback(items);
          speak(readback);
          addChatMessage({ role: "assistant", text: readback });
          setVoiceCheckoutStep("readback");
          break;
        }

        case "meal_response": {
          const answer = intent.items[0]?.name?.toLowerCase();
          if (mealConversionData && (answer === "yes" || answer?.includes("yes"))) {
            const combo = mealConversionData.combo;
            addItem({
              menuItemId: combo.mainItemId,
              name: combo.name,
              quantity: 1,
              unitPrice: combo.basePrice - combo.discount,
              customizations: ["Meal"],
              imageUrl: null,
            });
            setMealConversionData(null);
          } else if (mealConversionData) {
            const pi = mealConversionData.pendingItem;
            if (pi.matchedMenuItemId) {
              addItem({
                menuItemId: pi.matchedMenuItemId,
                name: pi.name,
                quantity: pi.quantity,
                unitPrice: pi.unitPrice ?? 0,
                customizations: pi.customizations,
                imageUrl: null,
              });
            }
            setMealConversionData(null);
          }

          // Voice checkout flow
          if (voiceCheckoutStep === "readback") {
            if (answer === "yes" || answer?.includes("yes")) {
              speak("Dine in or takeout?");
              addChatMessage({ role: "assistant", text: "Dine in or takeout?" });
              setVoiceCheckoutStep("order_type");
            } else {
              speak("No problem! What would you like to change?");
              addChatMessage({
                role: "assistant",
                text: "No problem! What would you like to change?",
              });
              setVoiceCheckoutStep("idle");
            }
          } else if (voiceCheckoutStep === "order_type") {
            const orderType = answer?.includes("take") ? "takeout" : "dine_in";
            speak("And how would you like to pay? Card, cash, or mobile?");
            addChatMessage({
              role: "assistant",
              text: "How would you like to pay? Card, cash, or mobile?",
            });
            setVoiceCheckoutStep("payment");
            voiceOrderTypeRef.current = orderType;
          } else if (voiceCheckoutStep === "payment") {
            setVoiceCheckoutStep("processing");
            const orderType = voiceOrderTypeRef.current;
            // Submit order
            try {
              const orderRes = await fetch("/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: items.map((i) => ({
                    menuItemId: i.menuItemId,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    customizations: i.customizations,
                  })),
                  orderType,
                }),
              });
              if (!orderRes.ok) throw new Error("Order failed");
              const order = await orderRes.json();
              speak("Your order has been placed! Thank you!");
              clearCart();
              resetConversation();
              router.push(
                `/confirmation?orderId=${order.orderId}&type=${orderType}`
              );
            } catch {
              speak("Sorry, there was an issue placing your order. Please try again.");
              setVoiceCheckoutStep("idle");
            }
          }
          break;
        }

        case "unknown": {
          const candidates = intent.fuzzyCandidates;
          if (candidates && candidates.length > 0) {
            activateClarification(
              "ambiguous",
              intent.clarificationNeeded ?? "",
              candidates.map((c) => ({
                id: c.id,
                name: c.name,
                price: c.price,
                categoryName: c.categoryName,
                description: null,
                imageUrl: null,
                available: true,
                categoryId: 0,
                aliases: [],
                customizations: [],
              }))
            );
          } else {
            activateClarification("not_found", intent.clarificationNeeded ?? "");
          }
          break;
        }
      }

      if (intent.response) {
        speak(intent.response);
        addChatMessage({ role: "assistant", text: intent.response });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, mealConversionData, voiceCheckoutStep, allMenuItems, combos]
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

        let contextSummary = cartSummary();
        if (voiceCheckoutStep !== "idle") {
          contextSummary += ` [CHECKOUT_STEP: ${voiceCheckoutStep}]`;
        }
        if (mealConversionData) {
          contextSummary += ` [PENDING_MEAL_OFFER: ${mealConversionData.combo.name}]`;
        }

        const res = await fetch("/api/nlp/parse-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            cartSummary: contextSummary,
            conversationHistory: recentMessages,
          }),
        });

        if (!res.ok) throw new Error("NLP request failed");

        const intent: NLPOrderIntent = await res.json();
        await handleNLPResponse(intent);
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
      voiceCheckoutStep,
      mealConversionData,
    ]
  );

  // Register STT callback + video ready greeting
  useEffect(() => {
    let greeted = false;

    onSTT((transcript) => {
      console.log("[OrderPage] STT received:", transcript);
      processTranscript(transcript);
    });

    onVideoReady(() => {
      if (greeted) return;
      greeted = true;
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
      {/* Header */}
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

      {/* Avatar Zone */}
      <div className="relative flex-1 bg-gradient-to-br from-mcdonalds-red to-[#C41E3A] py-1 overflow-hidden">
        <ErrorBoundary
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <p className="text-lg font-bold mb-2">Avatar unavailable</p>
                <p className="text-sm text-white/80">You can still order from the menu below</p>
              </div>
            </div>
          }
        >
          <AvatarContainer />
        </ErrorBoundary>

        <ChatMessages />

        {isProcessing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-mcdonalds-yellow border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm">Processing...</span>
            </div>
          </div>
        )}

        {/* Mic button or text input */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-end gap-3">
          {textInputMode ? (
            <div className="w-72">
              <TextInput onSubmit={processTranscript} disabled={isProcessing} />
            </div>
          ) : (
            <MicButton />
          )}
        </div>

        {/* Toggle text/voice */}
        <button
          onClick={() => setTextInputMode((prev) => !prev)}
          className="absolute bottom-6 right-4 z-40 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          title={textInputMode ? "Switch to voice" : "Type instead"}
        >
          {textInputMode ? (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu Section */}
      <ErrorBoundary>
        <MenuSection
          filteredItemIds={filteredItemIds}
          filterQuery={filterQuery}
          onClearFilter={() => {
            setFilteredItemIds(null);
            setFilterQuery("");
          }}
        />
      </ErrorBoundary>

      <CartDrawer />
      <DebugPanel />

      {/* Meal Conversion Modal */}
      <MealConversionModal
        open={mealConversionData !== null}
        onClose={() => setMealConversionData(null)}
        combo={mealConversionData?.combo ?? null}
        itemName={mealConversionData?.itemName ?? ""}
        itemPrice={mealConversionData?.itemPrice ?? 0}
        onAccept={() => {
          if (!mealConversionData) return;
          const combo = mealConversionData.combo;
          addItem({
            menuItemId: combo.mainItemId,
            name: combo.name,
            quantity: 1,
            unitPrice: combo.basePrice - combo.discount,
            customizations: ["Meal"],
            imageUrl: null,
          });
          setMealConversionData(null);
          speak(`Great choice! ${combo.name} added to your order.`);
          addChatMessage({ role: "assistant", text: `${combo.name} added!` });
        }}
        onDecline={() => {
          if (!mealConversionData) return;
          const pi = mealConversionData.pendingItem;
          if (pi.matchedMenuItemId) {
            addItem({
              menuItemId: pi.matchedMenuItemId,
              name: pi.name,
              quantity: pi.quantity,
              unitPrice: pi.unitPrice ?? 0,
              customizations: pi.customizations,
              imageUrl: null,
            });
          }
          setMealConversionData(null);
          speak(`No problem! ${pi.name} added. Anything else?`);
          addChatMessage({ role: "assistant", text: `${pi.name} added. Anything else?` });
        }}
      />

      {/* Meal Deal Suggestion */}
      <MealSuggestionModal
        open={mealDealSuggestion !== null}
        onClose={() => setMealDealSuggestion(null)}
        suggestion={mealDealSuggestion}
        onConvert={() => {
          if (!mealDealSuggestion) return;
          for (const id of mealDealSuggestion.matchedItemIds) removeItem(id);
          addItem({
            menuItemId: mealDealSuggestion.combo.mainItemId,
            name: mealDealSuggestion.combo.name,
            quantity: 1,
            unitPrice: mealDealSuggestion.comboPrice,
            customizations: ["Meal Deal"],
            imageUrl: null,
          });
          speak(`Switched to ${mealDealSuggestion.combo.name}. You saved $${mealDealSuggestion.savings.toFixed(2)}!`);
          setMealDealSuggestion(null);
        }}
        onKeepSeparate={() => setMealDealSuggestion(null)}
      />
    </div>
  );
}
