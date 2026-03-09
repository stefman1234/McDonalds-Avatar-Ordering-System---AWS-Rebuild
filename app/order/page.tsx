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
import MealSuggestionModal from "@/components/menu/MealSuggestionModal";
import CartFlyOverlay from "@/components/cart/CartFlyOverlay";
import CheckoutModal from "@/components/cart/CheckoutModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useUIStore } from "@/stores/uiStore";
import { useCartStore } from "@/stores/cartStore";
import { useClarificationStore } from "@/stores/clarificationStore";
import { useConversationStore } from "@/stores/conversationStore";
import { useActionHistoryStore } from "@/stores/actionHistoryStore";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { onSTT, speak, stopSpeech, onVideoReady, endStt, destroyAvatar } from "@/lib/klleon/avatar";
import { buildOrderReadback } from "@/lib/orderReadback";
import { detectMealDeals } from "@/lib/mealDealDetector";
import { getSuggestions, buildSuggestionPrompt } from "@/lib/pairingEngine";
import { resolveClarification } from "@/lib/clarificationResolver";
import { pendingOrderManager } from "@/lib/ordering/pendingOrderManager";
import {
  parseMealSize,
  parseIceLevel,
  findSideByName,
  findDrinkByName,
  MealQuestionGenerator,
} from "@/lib/ordering/mealCustomizationFlow";
import { isMealEligible } from "@/lib/ordering/mealConversion";
import type {
  NLPOrderIntent,
  NLPOrderItem,
  ComboMealDTO,
  MealDealSuggestion,
  MenuItemDTO,
  VoiceCheckoutStep,
} from "@/lib/types";

/** Removes exactly one unit of a solo (non-combo) cart item with the given menuItemId.
 *  Decrements quantity if > 1; removes the entry entirely if quantity is 1.
 *  This ensures that when converting one of multiple solos to a meal, the others are preserved. */
function removeSoloUnit(
  menuItemId: number,
  cartItems: { id: string; menuItemId: number; quantity: number; isCombo?: boolean | null }[],
  removeFn: (id: string) => void,
  updateQtyFn: (id: string, qty: number) => void
) {
  const solo = cartItems.find((ci) => ci.menuItemId === menuItemId && !ci.isCombo);
  if (!solo) return;
  if (solo.quantity > 1) {
    updateQtyFn(solo.id, solo.quantity - 1);
  } else {
    removeFn(solo.id);
  }
}

function dlog(event: string, data?: any) {
  const msg = data !== undefined ? (typeof data === "string" ? data : JSON.stringify(data)) : "";
  console.log(`[CASEY] ${event}: ${msg}`);
  fetch("/api/debug-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, data: msg }),
  }).catch(() => {});
}

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
  const updateQuantity = useCartStore((s) => s.updateQuantity);
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

  // Action history for undo
  const pushAction = useActionHistoryStore((s) => s.push);
  const popAction = useActionHistoryStore((s) => s.pop);
  const clearHistory = useActionHistoryStore((s) => s.clear);

  // Track last added item for pronoun resolution ("make THAT a large")
  const lastAddedItemRef = useRef<{ name: string; menuItemId: number } | null>(null);

  // Ref to always call the latest processTranscript from STT callback (avoids stale closure)
  const processTranscriptRef = useRef<(transcript: string) => void>(() => {});

  // Clarification dismiss
  const dismissClarification = useClarificationStore((s) => s.dismiss);

  // NLP menu filtering
  const [filteredItemIds, setFilteredItemIds] = useState<number[] | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [tabOverride, setTabOverride] = useState<"your_order" | "menu" | null>(null);

  // Text input mode
  const [textInputMode, setTextInputMode] = useState(false);

  // Frustration tracking: consecutive "unknown" NLP responses
  const consecutiveUnknownsRef = useRef(0);

  // B2: TTS gate — track last speak time to avoid rapid-fire speech
  const lastSpeakTimeRef = useRef(0);
  function gatedSpeak(text: string, minGapMs: number = 1500) {
    const now = Date.now();
    if (!text || text.length < 5) return;
    if (now - lastSpeakTimeRef.current < minGapMs) return;
    lastSpeakTimeRef.current = now;
    speak(text);
  }

  // Meal conversion modal
  const [mealConversionData, setMealConversionData] = useState<{
    combo: ComboMealDTO;
    itemName: string;
    itemPrice: number;
    pendingItem: NLPOrderItem;
    detectedSize?: "medium" | "large";
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
        if (Array.isArray(data) && data.length > 0) {
          const flat = data.flatMap((cat: { items: MenuItemDTO[] }) => cat.items ?? []);
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

  // Idle timeout — 30s redirects to idle, warning at 10s before
  const { showWarning: idleWarning, secondsLeft: idleSecondsLeft } = useIdleTimeout(() => {
    clearCart();
    clearMessages();
    resetConversation();
    destroyAvatar();
    router.push("/");
  }, 30000, 10000);

  // Silently check meal conversion — stores data for meal_response handler
  // No modal or speech — Casey handles meal offers conversationally via NLP prompt rule 22
  async function checkMealConversionSilent(item: NLPOrderItem, detectedSize?: "medium" | "large") {
    if (!item.matchedMenuItemId) {
      dlog("MEAL_CHECK", "skipped — no matchedMenuItemId");
      return;
    }
    try {
      dlog("MEAL_CHECK", { menuItemId: item.matchedMenuItemId, name: item.name });
      const res = await fetch("/api/meal-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item.matchedMenuItemId }),
      });
      const data = await res.json();
      dlog("MEAL_CHECK_RESULT", { hasCombo: !!data.combo, comboName: data.combo?.name });
      if (data.combo) {
        setMealConversionData({
          combo: data.combo,
          itemName: item.name,
          itemPrice: item.unitPrice ?? 0,
          pendingItem: item,
          detectedSize,
        });
        dlog("MEAL_CONVERSION_DATA_SET", { combo: data.combo.name, detectedSize });
      }
    } catch (err) {
      dlog("MEAL_CHECK_ERROR", String(err));
    }
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
        gatedSpeak(prompt, 3000); // B2: Skip upsell if Casey spoke recently
        addChatMessage({ role: "assistant", text: prompt });
      }, 2000);
    }
  }

  // Robust cart item lookup — handles size prefixes, partial names, and menuItemId
  function findCartItem(
    searchName: string,
    menuItemId?: number
  ) {
    const needle = searchName.toLowerCase();
    const stripSize = (n: string) => n.replace(/^(small|medium|large)\s+/i, "").toLowerCase();
    return (
      // 1. Exact name match
      items.find((ci) => ci.name.toLowerCase() === needle) ||
      // 2. menuItemId match
      (menuItemId ? items.find((ci) => ci.menuItemId === menuItemId) : null) ||
      // 3. Size-stripped match ("Coca-Cola" matches "Medium Coca-Cola")
      items.find((ci) => stripSize(ci.name) === stripSize(needle)) ||
      // 4. Partial includes match ("Double Cheeseburger" in "Double Cheeseburger Meal")
      items.find((ci) => ci.name.toLowerCase().includes(needle) || needle.includes(ci.name.toLowerCase())) ||
      null
    );
  }

  const handleNLPResponse = useCallback(
    async (intent: NLPOrderIntent, transcript?: string) => {
      let handlerSpoke = false;
      dlog("HANDLER", intent.action);
      switch (intent.action) {
        case "add": {
          consecutiveUnknownsRef.current = 0; // Reset frustration counter on successful add
          // Add ALL items to cart immediately — never block on meal offers
          for (const item of intent.items) {
            if (item.matchedMenuItemId) {
              if (item.categoryName) addOrderedCategory(item.categoryName);

              // Detect size preference
              const nameLower = item.name.toLowerCase();
              if (nameLower.includes("large")) setPreferredSize("large");
              else if (nameLower.includes("small")) setPreferredSize("small");
              else if (nameLower.includes("medium")) setPreferredSize("medium");

              const cartItem = {
                menuItemId: item.matchedMenuItemId,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice ?? 0,
                customizations: item.customizations,
                imageUrl: null,
              };
              addItem(cartItem);
              // Track for undo and pronoun resolution
              const id = `${cartItem.menuItemId}-solo-${cartItem.customizations.sort().join(",")}`;
              pushAction({ type: "add", item: { ...cartItem, id }, timestamp: Date.now() });
              lastAddedItemRef.current = { name: item.name, menuItemId: item.matchedMenuItemId };
            }
          }
          setTabOverride("your_order");

          // Check if user explicitly asked for a meal vs NLP just mentioning meal
          const userSaidMeal = /\bmeal\b/i.test(transcript ?? "");
          const nlpMentionedMeal = /\bmeal\b/i.test(intent.response ?? "");
          const firstMainItem = intent.items.find((i) => i.matchedMenuItemId);
          // Size + meal-eligible = implicit meal (sizes only apply to meals for mains)
          const sizeFromTranscript = parseMealSize(transcript ?? "");
          const sizeImpliesMeal = !userSaidMeal && !!sizeFromTranscript && !!firstMainItem?.matchedMenuItemId &&
            isMealEligible({ name: firstMainItem.name, categoryName: firstMainItem.categoryName });

          // If user already specified both a side and a drink in this order, skip the meal flow —
          // they've self-composed their meal and asking again causes frustration
          const intentNames = intent.items.map((i) => i.name.toLowerCase());
          const intentHasSide = intentNames.some((n) =>
            /fries|corn|salad/.test(n)
          );
          const intentHasDrink = intentNames.some((n) =>
            /coke|cola|sprite|fanta|milo|water|juice|latte|americano|cappuccino|ribena|tea|sirap|100/.test(n)
          );
          const userSelfComposedMeal = intentHasSide && intentHasDrink;

          if ((userSaidMeal || sizeImpliesMeal) && firstMainItem?.matchedMenuItemId && !userSelfComposedMeal) {
            // User explicitly requested a meal — start flow immediately
            try {
              dlog("MEAL_CHECK", { menuItemId: firstMainItem.matchedMenuItemId, name: firstMainItem.name });
              const mealRes = await fetch("/api/meal-conversion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ menuItemId: firstMainItem.matchedMenuItemId }),
              });
              const mealData = await mealRes.json();
              dlog("MEAL_CHECK_RESULT", { hasCombo: !!mealData.combo, comboName: mealData.combo?.name });

              if (mealData.combo) {
                // Remove exactly the unit we just added (decrement if multiple solos exist)
                const currentItems = useCartStore.getState().items;
                removeSoloUnit(firstMainItem.matchedMenuItemId!, currentItems, removeItem, updateQuantity);

                // Pre-fill size if user specified it
                const prefilledSize = sizeFromTranscript;
                const pendingItem = {
                  menuItemId: firstMainItem.matchedMenuItemId,
                  name: firstMainItem.name,
                  basePrice: firstMainItem.unitPrice ?? 0,
                  quantity: firstMainItem.quantity,
                  isMeal: true,
                  mealDetails: prefilledSize ? { size: prefilledSize } : ({} as any),
                  isComplete: false,
                };
                dlog("EXPLICIT_MEAL_START", { item: pendingItem.name, prefilledSize });
                pendingOrderManager.initialize("meal", [pendingItem]);
                const nextStep = pendingOrderManager.nextStep();
                const question = MealQuestionGenerator.generateQuestionForStep(nextStep, pendingItem.name);
                pendingOrderManager.setAwaitingResponse(true, question);
                speak(question);
                addChatMessage({ role: "assistant", text: question });
                handlerSpoke = true;
              }
            } catch (err) {
              dlog("MEAL_CHECK_ERROR", String(err));
            }
          } else if (nlpMentionedMeal && !userSelfComposedMeal) {
            // NLP offered a meal — find which item it's referring to
            // The NLP response may reference a cart item (e.g., "make your Double Cheeseburger a meal")
            // not necessarily the item just added (e.g., BBQ Sauce)
            const responseText = (intent.response ?? "").toLowerCase();
            const currentCartItems = useCartStore.getState().items;

            // First: try to find which non-combo cart item the NLP is offering a meal for
            const targetCartItem = currentCartItems.find(
              (ci) => !ci.isCombo && responseText.includes(ci.name.toLowerCase())
            );
            if (targetCartItem) {
              // Arm for the specific item mentioned in the NLP response
              const fakeNlpItem = {
                name: targetCartItem.name,
                matchedMenuItemId: targetCartItem.menuItemId,
                unitPrice: targetCartItem.unitPrice,
              } as any;
              checkMealConversionSilent(fakeNlpItem, sizeFromTranscript ?? undefined);
            } else if (firstMainItem?.matchedMenuItemId) {
              // Fallback: arm for the item just added
              checkMealConversionSilent(firstMainItem, sizeFromTranscript ?? undefined);
            }
          } else {
            // No meal involved — try upsell, but only if Casey's response didn't already ask a question
            // (e.g. "What sauce?" + upsell drink = two questions at once)
            if (!intent.response?.includes("?")) {
              setTimeout(tryUpsell, 3000);
            }
          }

          // Filter menu to show matched items
          const matchedIds = intent.items
            .filter((i) => i.matchedMenuItemId)
            .map((i) => i.matchedMenuItemId!);
          if (matchedIds.length > 0) {
            setFilteredItemIds(matchedIds);
            setFilterQuery(intent.items.map((i) => i.name).join(", "));
            setTabOverride("menu");
          }
          break;
        }

        case "remove":
          for (const item of intent.items) {
            const cartItem = findCartItem(item.name, item.matchedMenuItemId);
            if (cartItem) {
              pushAction({ type: "remove", item: { ...cartItem }, timestamp: Date.now() });
              removeItem(cartItem.id);
            }
          }
          break;

        case "modify":
          for (const item of intent.items) {
            const originalName = item.originalName ?? item.name;

            // Quantity-only correction: "I said 2 not 1"
            if (item.newQuantity !== undefined) {
              const cartItem = findCartItem(originalName, item.matchedMenuItemId);
              if (cartItem) {
                pushAction({ type: "modify", item: { ...cartItem }, timestamp: Date.now() });
                const { updateQuantity } = useCartStore.getState();
                updateQuantity(cartItem.id, item.newQuantity);
              }
              break;
            }

            const cartItem = findCartItem(originalName, item.matchedMenuItemId);
            if (cartItem) {
              pushAction({ type: "modify", item: { ...cartItem }, timestamp: Date.now() });
              removeItem(cartItem.id);
              if (item.matchedMenuItemId) {
                addItem({
                  menuItemId: item.matchedMenuItemId,
                  name: item.name,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice ?? cartItem.unitPrice,
                  customizations: item.customizations.length > 0 ? item.customizations : cartItem.customizations,
                  imageUrl: null,
                });
                lastAddedItemRef.current = { name: item.name, menuItemId: item.matchedMenuItemId };
              }
            }
          }
          break;

        case "modify_size": {
          const item = intent.items[0];
          if (!item) break;

          // Size + meal-eligible item = implicit meal request
          // At McDonald's, sizes only apply to meals for main items (burgers, chicken, etc.)
          const sizeForMeal = parseMealSize(transcript ?? "") ?? (item.newSize ? parseMealSize(item.newSize) : null);
          const itemMealEligible = item.matchedMenuItemId && isMealEligible({ name: item.name, categoryName: item.categoryName });

          if (itemMealEligible && sizeForMeal) {
            try {
              const mealRes = await fetch("/api/meal-conversion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ menuItemId: item.matchedMenuItemId }),
              });
              const mealData = await mealRes.json();
              if (mealData.combo) {
                // Remove exactly one solo unit (decrement if multiple exist)
                const currentItems = useCartStore.getState().items;
                removeSoloUnit(item.matchedMenuItemId!, currentItems, removeItem, updateQuantity);

                const pendingItem = {
                  menuItemId: item.matchedMenuItemId!,
                  name: item.name,
                  basePrice: item.unitPrice ?? 0,
                  quantity: item.quantity || 1,
                  isMeal: true,
                  mealDetails: { size: sizeForMeal },
                  isComplete: false,
                };
                dlog("SIZE_IMPLIES_MEAL", { item: pendingItem.name, size: sizeForMeal });
                pendingOrderManager.initialize("meal", [pendingItem]);
                const nextStep = pendingOrderManager.nextStep();
                const question = MealQuestionGenerator.generateQuestionForStep(nextStep, pendingItem.name);
                pendingOrderManager.setAwaitingResponse(true, question);
                speak(question);
                addChatMessage({ role: "assistant", text: question });
                handlerSpoke = true;
                break;
              }
            } catch (err) {
              dlog("MEAL_CHECK_ERROR", String(err));
            }
          }

          // Not meal-eligible or no combo found — do normal size change (drinks, fries, etc.)
          const originalName = item.originalName ?? lastAddedItemRef.current?.name ?? "";
          const cartItem = findCartItem(originalName, item.matchedMenuItemId);
          if (cartItem && item.newSize) {
            pushAction({ type: "modify", item: { ...cartItem }, timestamp: Date.now() });
            removeItem(cartItem.id);
            const sizedName = `${item.newSize} ${cartItem.name.replace(/^(Small|Medium|Large)\s+/i, "")}`;
            addItem({
              menuItemId: item.matchedMenuItemId ?? cartItem.menuItemId,
              name: item.matchedMenuItemId ? item.name : sizedName,
              quantity: cartItem.quantity,
              unitPrice: item.unitPrice ?? cartItem.unitPrice,
              customizations: cartItem.customizations,
              imageUrl: null,
            });
          }
          break;
        }

        case "undo": {
          const lastAction = popAction();
          if (!lastAction) {
            speak("There's nothing to undo.");
            addChatMessage({ role: "assistant", text: "Nothing to undo." });
            break;
          }
          // Reverse the action
          if (lastAction.type === "add") {
            removeItem(lastAction.item.id);
          } else if (lastAction.type === "remove") {
            addItem({
              menuItemId: lastAction.item.menuItemId,
              name: lastAction.item.name,
              quantity: lastAction.item.quantity,
              unitPrice: lastAction.item.unitPrice,
              customizations: lastAction.item.customizations,
              imageUrl: lastAction.item.imageUrl,
            });
          } else if (lastAction.type === "modify") {
            // Restore the snapshot (remove current version, re-add original)
            const current = items.find(
              (ci) => ci.menuItemId === lastAction.item.menuItemId
            );
            if (current) removeItem(current.id);
            addItem({
              menuItemId: lastAction.item.menuItemId,
              name: lastAction.item.name,
              quantity: lastAction.item.quantity,
              unitPrice: lastAction.item.unitPrice,
              customizations: lastAction.item.customizations,
              imageUrl: lastAction.item.imageUrl,
            });
          }
          break;
        }

        case "clear":
          clearHistory();
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
          // Check both the item name and the full response text for acceptance/rejection
          const mealResponseText = `${answer ?? ""} ${(intent.response ?? "").toLowerCase()}`;
          const isMealAccepting = /\b(yes|yeah|yep|sure|ok|okay|let'?s|do it|go for it|make it|meal|please|absolutely|definitely)\b/.test(mealResponseText);
          const isMealRejecting = /\b(no\b|nope|nah|solo|just the|skip|not now|no thanks|don'?t|without)\b/.test(mealResponseText);

          // Handle pending order meal customization (voice-driven multi-step)
          if (pendingOrderManager.hasPendingOrder()) {
            const currentItem = pendingOrderManager.getCurrentItem();
            const step = pendingOrderManager.getState()?.currentStep;

            if (step === "meal_conversion_offer") {
              // User responding to "make it a meal?" offer
              const isAccepting = /\b(yes|yeah|yep|sure|ok|okay|meal)\b/i.test(intent.response || answer || "");
              if (isAccepting) {
                const indexes = pendingOrderManager.getMealEligibleIndexes();
                if (indexes.length > 0) {
                  pendingOrderManager.convertItemToMeal(indexes[0]);
                  const item = pendingOrderManager.getCurrentItem();
                  if (item) {
                    const nextStep = pendingOrderManager.nextStep();
                    const question = MealQuestionGenerator.generateQuestionForStep(nextStep, item.name);
                    pendingOrderManager.setAwaitingResponse(true, question);
                    speak(question);
                    addChatMessage({ role: "assistant", text: question });
                  }
                }
              } else {
                // Declined — complete all items as-is
                const completedItems = pendingOrderManager.getState()?.items ?? [];
                for (const pi of completedItems) {
                  addItem({
                    menuItemId: pi.menuItemId,
                    name: pi.name,
                    quantity: pi.quantity,
                    unitPrice: pi.basePrice,
                    customizations: [],
                    imageUrl: null,
                  });
                }
                pendingOrderManager.clear();
              }
            } else if (currentItem && step && step !== "complete") {
              // Voice meal customization in progress
              const userText = intent.response || answer || "";

              if (step === "meal_size") {
                const size = parseMealSize(userText);
                if (size) pendingOrderManager.updateCurrentItemMealDetails({ size });
              } else if (step === "meal_side") {
                const side = findSideByName(userText);
                if (side) pendingOrderManager.updateCurrentItemMealDetails({ side });
              } else if (step === "meal_drink") {
                const drink = findDrinkByName(userText);
                if (drink) pendingOrderManager.updateCurrentItemMealDetails({ drink });
              } else if (step === "ice_level") {
                const ice = parseIceLevel(userText) ?? "full";
                pendingOrderManager.updateCurrentItemMealDetails({ iceLevel: ice });
              }

              const nextStep = pendingOrderManager.nextStep();
              if (nextStep === "complete") {
                const { hasMore } = pendingOrderManager.completeCurrentItem();
                if (hasMore) {
                  const nextItem = pendingOrderManager.getCurrentItem();
                  if (nextItem && nextItem.isMeal) {
                    const ns = pendingOrderManager.nextStep();
                    const q = MealQuestionGenerator.generateQuestionForStep(ns, nextItem.name);
                    pendingOrderManager.setAwaitingResponse(true, q);
                    speak(q);
                    addChatMessage({ role: "assistant", text: q });
                  }
                } else {
                  // All done — add everything to cart
                  const allItems = pendingOrderManager.getState()?.items ?? [];
                  for (const pi of allItems) {
                    addItem({
                      menuItemId: pi.menuItemId,
                      name: pi.name,
                      quantity: pi.quantity,
                      unitPrice: pi.basePrice,
                      customizations: [],
                      imageUrl: null,
                      isCombo: pi.isMeal,
                      mealSize: pi.mealDetails?.size,
                      mealSide: pi.mealDetails?.side,
                      mealDrink: pi.mealDetails?.drink
                        ? { ...pi.mealDetails.drink, iceLevel: pi.mealDetails.iceLevel }
                        : null,
                    });
                  }
                  const msg = MealQuestionGenerator.generateMealCompleteMessage(currentItem.name);
                  speak(msg);
                  addChatMessage({ role: "assistant", text: msg });
                  pendingOrderManager.clear();
                }
              } else {
                const drinkName = pendingOrderManager.getCurrentItem()?.mealDetails?.drink?.name;
                const q = MealQuestionGenerator.generateQuestionForStep(nextStep, currentItem.name, drinkName);
                pendingOrderManager.setAwaitingResponse(true, q);
                speak(q);
                addChatMessage({ role: "assistant", text: q });
              }
            }
            break;
          }

          if (mealConversionData && isMealAccepting && !isMealRejecting) {
            // Remove exactly one solo unit (decrement if multiple exist, add !ci.isCombo guard)
            removeSoloUnit(mealConversionData.pendingItem.matchedMenuItemId!, items, removeItem, updateQuantity);
            // Start the multi-step meal customization flow, pre-filling size if known
            const pendingItem = {
              menuItemId: mealConversionData.pendingItem.matchedMenuItemId ?? 0,
              name: mealConversionData.itemName,
              basePrice: mealConversionData.itemPrice,
              quantity: 1,
              isMeal: true,
              mealDetails: mealConversionData.detectedSize
                ? { size: mealConversionData.detectedSize }
                : {},
              isComplete: false,
            };
            pendingOrderManager.initialize("meal", [pendingItem]);
            const nextStep = pendingOrderManager.nextStep();
            const question = MealQuestionGenerator.generateQuestionForStep(nextStep, pendingItem.name);
            pendingOrderManager.setAwaitingResponse(true, question);
            speak(question);
            addChatMessage({ role: "assistant", text: question });
            setMealConversionData(null);
            handlerSpoke = true;
          } else if (mealConversionData) {
            // User declined — item is already in cart, just clear the offer
            setMealConversionData(null);
          }

          // Proactive meal conversion: user asked "make X a meal" without a prior offer
          if (!handlerSpoke && !pendingOrderManager.hasPendingOrder() && isMealAccepting) {
            const requestedName = intent.items[0]?.name;
            if (requestedName) {
              const soloItem = items.find(
                (ci) => ci.name.toLowerCase() === requestedName.toLowerCase() && !ci.isCombo
              );
              if (soloItem) {
                dlog("PROACTIVE_MEAL_CONVERSION", { item: soloItem.name, menuItemId: soloItem.menuItemId });
                // Decrement by 1 rather than wiping the entry (preserves other solos of the same item)
                if (soloItem.quantity > 1) {
                  updateQuantity(soloItem.id, soloItem.quantity - 1);
                } else {
                  removeItem(soloItem.id);
                }
                const pendingItem = {
                  menuItemId: soloItem.menuItemId,
                  name: soloItem.name,
                  basePrice: soloItem.unitPrice,
                  quantity: 1,
                  isMeal: true,
                  mealDetails: {} as any,
                  isComplete: false,
                };
                pendingOrderManager.initialize("meal", [pendingItem]);
                const nextStep = pendingOrderManager.nextStep();
                const question = MealQuestionGenerator.generateQuestionForStep(nextStep, pendingItem.name);
                pendingOrderManager.setAwaitingResponse(true, question);
                speak(question);
                addChatMessage({ role: "assistant", text: question });
                handlerSpoke = true;
              }
            }
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
              clearHistory();
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

        case "info": {
          // Category browse: "show me burgers", "what chicken do you have?" → filter carousel
          if (transcript && allMenuItems.length > 0) {
            const CATEGORY_KEYWORDS: [string, string[]][] = [
              ["Burgers", ["burger", "burgers", "big mac", "quarter pounder", "cheeseburger", "double"]],
              ["Chicken", ["chicken", "nugget", "nuggets", "mcnugget", "ayam", "crispy", "tender"]],
              ["Sides", ["fries", "fry", "hash brown", "corn cup", "side", "sides"]],
              ["Drinks", ["drink", "drinks", "beverage", "coke", "soda", "juice", "water", "milo", "pepsi"]],
              ["Desserts", ["dessert", "desserts", "mcflurry", "sundae", "ice cream", "pie", "cone", "waffle"]],
              ["Breakfast", ["breakfast", "egg", "pancake", "hotcake"]],
              ["McCafé", ["coffee", "latte", "cappuccino", "mccafe", "cafe", "americano", "espresso"]],
              ["Happy Meal", ["happy meal", "kids meal", "kids"]],
            ];
            const lower = (transcript ?? "").toLowerCase();
            for (const [catName, keywords] of CATEGORY_KEYWORDS) {
              if (keywords.some((k) => lower.includes(k))) {
                const catItems = allMenuItems.filter((m) => {
                  const mCat = m.categoryName.toLowerCase();
                  const mName = m.name.toLowerCase();
                  return (
                    mCat.includes(catName.toLowerCase()) ||
                    catName.toLowerCase().includes(mCat) ||
                    // Fallback: match item names directly — handles cases where DB category
                    // names don't align (e.g. "Ayam Goreng McD" / "McNuggets" for "Chicken")
                    keywords.some((k) => mName.includes(k))
                  );
                });
                if (catItems.length > 0) {
                  setFilteredItemIds(catItems.map((m) => m.id));
                  setFilterQuery(catName);
                  setTabOverride("menu");
                }
                break;
              }
            }
          }
          break;
        }

        case "unknown": {
          consecutiveUnknownsRef.current += 1;
          // C6: After 2 mishears — empathetic tone; after 3 — auto-show text input
          if (consecutiveUnknownsRef.current >= 3 && !textInputMode) {
            setTextInputMode(true);
            intent.response = "No worries! I've opened a text input so you can type your order instead.";
          } else if (consecutiveUnknownsRef.current >= 2 && !intent.fuzzyCandidates?.length) {
            intent.response = "Sorry, I'm having a bit of trouble. Could you say that one more time, or try typing it below?";
          }
          const candidates = intent.fuzzyCandidates?.filter((c) => (c.score ?? 0) >= 0.35);
          if (candidates && candidates.length > 0) {
            const candidateDTOs = candidates.map((c) => ({
              id: c.id,
              name: c.name,
              price: c.price,
              categoryName: c.categoryName,
              description: null,
              imageUrl: null,
              available: true,
              categoryId: 0,
              aliases: [] as string[],
              customizations: [] as { id: number; name: string; priceExtra: number }[],
            }));
            activateClarification("ambiguous", intent.clarificationNeeded ?? "", candidateDTOs);
            // Avatar speaks the numbered options for voice selection
            const top = candidateDTOs.slice(0, 3);
            const nameList = top.map((c, i) => `${i + 1} for ${c.name}`).join(", or ");
            const openers = [
              "Sorry, I didn't quite catch that!",
              "Hmm, I didn't quite get that!",
              "Oops, I missed that one!",
              "Sorry about that, I didn't catch it!",
            ];
            const opener = openers[Math.floor(Math.random() * openers.length)];
            const clarifyPrompt = `${opener} Did you mean — say ${nameList}?`;
            speak(clarifyPrompt);
            addChatMessage({ role: "assistant", text: clarifyPrompt });
            return; // Skip the default response since we spoke our own
          } else {
            activateClarification("not_found", intent.clarificationNeeded ?? "");
          }
          break;
        }
      }

      if (intent.response && !handlerSpoke) {
        dlog("CASEY_SPEAKS", intent.response.slice(0, 100));
        speak(intent.response);
        addChatMessage({ role: "assistant", text: intent.response });
      } else if (handlerSpoke) {
        dlog("CASEY_SPEAKS", "(handler spoke, NLP response suppressed)");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, mealConversionData, voiceCheckoutStep, allMenuItems, combos]
  );

  const processTranscript = useCallback(
    async (transcript: string) => {
      if (isProcessing) return;

      dlog("USER", transcript);
      dlog("STATE", { mealOffer: !!mealConversionData, pendingOrder: pendingOrderManager.hasPendingOrder(), checkoutStep: voiceCheckoutStep });

      endStt();
      setListening(false);
      addChatMessage({ role: "user", text: transcript });
      setProcessing(true);

      try {
        // Voice-triggered clarification: intercept before NLP if clarification is active
        const clarState = useClarificationStore.getState();
        if (clarState.active) {
          const result = resolveClarification(transcript, clarState.candidates, clarState.type!);
          if (result.resolved) {
            if (result.dismissed) {
              dismissClarification();
              speak("No problem. What would you like to order?");
              addChatMessage({ role: "assistant", text: "What would you like to order?" });
            } else if (result.item) {
              addItem({
                menuItemId: result.item.id,
                name: result.item.name,
                quantity: 1,
                unitPrice: result.item.price,
                customizations: [],
                imageUrl: result.item.imageUrl,
              });
              dismissClarification();
              const msg = `Great, I've added ${result.item.name} to your order!`;
              speak(msg);
              addChatMessage({ role: "assistant", text: msg });
              lastAddedItemRef.current = { name: result.item.name, menuItemId: result.item.id };
            } else if (result.size) {
              // Size needed resolution — add item with selected size
              const query = clarState.originalQuery;
              dismissClarification();
              const msg = `Got it, ${result.size} ${query}!`;
              speak(msg);
              addChatMessage({ role: "assistant", text: msg });
            }
            setProcessing(false);
            return;
          }
          // Not resolved — clear stale clarification, fall through to NLP
          dismissClarification();
        }

        // Pending meal customization: intercept before NLP
        if (pendingOrderManager.hasPendingOrder()) {
          dlog("PENDING_ORDER_INTERCEPT", { step: pendingOrderManager.getState()?.currentStep, item: pendingOrderManager.getCurrentItem()?.name });
          const currentItem = pendingOrderManager.getCurrentItem();
          const step = pendingOrderManager.getState()?.currentStep;

          if (currentItem && step && step !== "complete") {
            const userText = transcript.toLowerCase();

            if (step === "meal_conversion_offer") {
              const isAccepting = /\b(yes|yeah|yep|sure|ok|okay|meal)\b/i.test(userText);
              if (isAccepting) {
                const indexes = pendingOrderManager.getMealEligibleIndexes();
                if (indexes.length > 0) {
                  pendingOrderManager.convertItemToMeal(indexes[0]);
                  const item = pendingOrderManager.getCurrentItem();
                  if (item) {
                    const nextStep = pendingOrderManager.nextStep();
                    const question = MealQuestionGenerator.generateQuestionForStep(nextStep, item.name);
                    pendingOrderManager.setAwaitingResponse(true, question);
                    speak(question);
                    addChatMessage({ role: "assistant", text: question });
                  }
                }
              } else {
                // Declined — add all items as-is
                const allPending = pendingOrderManager.getState()?.items ?? [];
                for (const pi of allPending) {
                  addItem({
                    menuItemId: pi.menuItemId,
                    name: pi.name,
                    quantity: pi.quantity,
                    unitPrice: pi.basePrice,
                    customizations: [],
                    imageUrl: null,
                  });
                }
                pendingOrderManager.clear();
                speak("No problem! Anything else?");
                addChatMessage({ role: "assistant", text: "No problem! Anything else?" });
              }
              setProcessing(false);
              return;
            }

            // Active meal step — parse the response directly
            dlog("MEAL_STEP_PARSE", { step, userText });
            if (step === "meal_size") {
              const size = parseMealSize(userText);
              dlog("MEAL_SIZE_PARSED", size);
              if (size) pendingOrderManager.updateCurrentItemMealDetails({ size });
            } else if (step === "meal_side") {
              const side = findSideByName(userText);
              dlog("MEAL_SIDE_PARSED", side?.name ?? "null");
              if (side) pendingOrderManager.updateCurrentItemMealDetails({ side });
            } else if (step === "meal_drink") {
              const drink = findDrinkByName(userText);
              dlog("MEAL_DRINK_PARSED", drink?.name ?? "null");
              if (drink) {
                pendingOrderManager.updateCurrentItemMealDetails({ drink });
              } else {
                // User might be asking what's available — repeat the question with options
                const q = MealQuestionGenerator.generateDrinkQuestion();
                pendingOrderManager.setAwaitingResponse(true, q);
                dlog("CASEY_SPEAKS", q);
                speak(q);
                addChatMessage({ role: "assistant", text: q });
                setProcessing(false);
                return;
              }
            } else if (step === "ice_level") {
              const ice = parseIceLevel(userText) ?? "full";
              dlog("MEAL_ICE_PARSED", ice);
              pendingOrderManager.updateCurrentItemMealDetails({ iceLevel: ice });
            }

            const nextStep = pendingOrderManager.nextStep();
            dlog("MEAL_NEXT_STEP", nextStep);
            if (nextStep === "complete") {
              const { hasMore } = pendingOrderManager.completeCurrentItem();
              if (hasMore) {
                const nextItem = pendingOrderManager.getCurrentItem();
                if (nextItem && nextItem.isMeal) {
                  const ns = pendingOrderManager.nextStep();
                  const q = MealQuestionGenerator.generateQuestionForStep(ns, nextItem.name);
                  pendingOrderManager.setAwaitingResponse(true, q);
                  dlog("CASEY_SPEAKS", q);
                  speak(q);
                  addChatMessage({ role: "assistant", text: q });
                }
              } else {
                // All done — add everything to cart
                const allItems = pendingOrderManager.getState()?.items ?? [];
                dlog("MEAL_COMPLETE", { itemCount: allItems.length });
                for (const pi of allItems) {
                  addItem({
                    menuItemId: pi.menuItemId,
                    name: pi.name,
                    quantity: pi.quantity,
                    unitPrice: pi.basePrice,
                    customizations: [],
                    imageUrl: null,
                    isCombo: pi.isMeal,
                    mealSize: pi.mealDetails?.size,
                    mealSide: pi.mealDetails?.side,
                    mealDrink: pi.mealDetails?.drink
                      ? { ...pi.mealDetails.drink, iceLevel: pi.mealDetails.iceLevel }
                      : null,
                  });
                }
                const msg = MealQuestionGenerator.generateMealCompleteMessage(currentItem.name);
                dlog("CASEY_SPEAKS", msg);
                speak(msg);
                addChatMessage({ role: "assistant", text: msg });
                pendingOrderManager.clear();
              }
            } else {
              const drinkName = pendingOrderManager.getCurrentItem()?.mealDetails?.drink?.name;
              const q = MealQuestionGenerator.generateQuestionForStep(nextStep, currentItem.name, drinkName);
              pendingOrderManager.setAwaitingResponse(true, q);
              dlog("CASEY_SPEAKS", q);
              speak(q);
              addChatMessage({ role: "assistant", text: q });
            }
            setProcessing(false);
            return;
          }
        }

        // Pending meal offer: intercept before NLP to avoid NLP handling it
        if (mealConversionData) {
          const userText = transcript.toLowerCase();
          const isAccepting = /\b(yes|yeah|yep|sure|ok|okay|let'?s|do it|go for it|make it|meal|please|absolutely|definitely)\b/.test(userText);
          const isRejecting = /\b(no\b|nope|nah|solo|just the|skip|not now|no thanks|don'?t|without)\b/.test(userText);
          dlog("MEAL_OFFER_INTERCEPT", { accepting: isAccepting, rejecting: isRejecting, text: userText });

          if (isAccepting && !isRejecting) {
            // Remove exactly one solo unit (decrement if multiple exist, add !ci.isCombo guard)
            removeSoloUnit(mealConversionData.pendingItem.matchedMenuItemId!, items, removeItem, updateQuantity);
            // Start multi-step meal customization, pre-filling size if already known
            const pendingItem = {
              menuItemId: mealConversionData.pendingItem.matchedMenuItemId ?? 0,
              name: mealConversionData.itemName,
              basePrice: mealConversionData.itemPrice,
              quantity: 1,
              isMeal: true,
              mealDetails: mealConversionData.detectedSize
                ? { size: mealConversionData.detectedSize }
                : ({} as any),
              isComplete: false,
            };
            dlog("MEAL_FLOW_START", { item: pendingItem.name, prefilledSize: mealConversionData.detectedSize ?? "none" });
            pendingOrderManager.initialize("meal", [pendingItem]);
            const nextStep = pendingOrderManager.nextStep();
            const question = MealQuestionGenerator.generateQuestionForStep(nextStep, pendingItem.name);
            pendingOrderManager.setAwaitingResponse(true, question);
            speak(question);
            addChatMessage({ role: "assistant", text: question });
            setMealConversionData(null);
            setProcessing(false);
            return;
          } else if (isRejecting) {
            // User declined — item stays in cart
            setMealConversionData(null);
            speak("No problem! Anything else you'd like?");
            addChatMessage({ role: "assistant", text: "No problem! Anything else you'd like?" });
            setProcessing(false);
            return;
          }
          // Ambiguous — fall through to NLP
        }

        // A5: Rolling window of 8 messages; compress long assistant messages to save tokens
        const recentMessages = chatMessages.slice(-8).map((m) => ({
          role: m.role,
          text: m.role === "assistant" && m.text.length > 100
            ? m.text.slice(0, 97) + "…"
            : m.text,
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
            lastAdded: lastAddedItemRef.current?.name ?? undefined,
          }),
        });

        if (!res.ok) throw new Error("NLP request failed");

        const intent: NLPOrderIntent = await res.json();
        dlog("NLP_RESPONSE", { action: intent.action, response: intent.response?.slice(0, 100), items: intent.items?.map(i => i.name) });
        await handleNLPResponse(intent, transcript);
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
      addItem,
      dismissClarification,
    ]
  );

  // Keep processTranscript ref in sync so the STT callback always calls the latest version
  useEffect(() => {
    processTranscriptRef.current = processTranscript;
  }, [processTranscript]);

  // Register STT callback + video ready greeting
  useEffect(() => {
    let greeted = false;

    onSTT((transcript) => {
      console.log("[OrderPage] STT received:", transcript);
      processTranscriptRef.current(transcript);
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
      {/* Idle Timeout Warning */}
      {idleWarning && (
        <div className="fixed top-0 left-0 right-0 z-[70] bg-amber-500 text-white px-4 py-3 text-center shadow-lg animate-pulse">
          <p className="text-sm font-semibold">
            Are you still there? Session will reset in {idleSecondsLeft}s — tap anywhere to continue.
          </p>
        </div>
      )}

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

        {/* Mic button / text input + stop-speaking button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-end gap-3">
          {/* Stop speaking button — always visible next to mic */}
          <button
            onClick={() => stopSpeech()}
            className="w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/60 active:scale-95 transition-all touch-manipulation"
            title="Stop Casey speaking"
            aria-label="Stop speaking"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>

          {textInputMode ? (
            <div className="w-64">
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
          tabOverride={tabOverride}
          onTabOverrideConsumed={() => setTabOverride(null)}
        />
      </ErrorBoundary>

      <CartDrawer />
      <DebugPanel />

      {/* Meal conversion is now handled conversationally by Casey — no modal needed */}

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
          speak(`Switched to ${mealDealSuggestion.combo.name}. You saved RM ${mealDealSuggestion.savings.toFixed(2)}!`);
          setMealDealSuggestion(null);
        }}
        onKeepSeparate={() => setMealDealSuggestion(null)}
      />

      {/* C2: Fly-to-cart animation overlay */}
      <CartFlyOverlay />

      {/* Checkout modal — review, payment, receipt */}
      <CheckoutModal />
    </div>
  );
}
