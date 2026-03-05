'use client';

import { useEffect, useState, useRef } from 'react';
import { initializeKlleon, isKlleonReady } from '@/lib/klleon/init';
import { speak } from '@/lib/klleon/speak';
import { addDebugEvent } from '@/components/Debug';
import { useCartStore } from '@/store/cart';
import { BrowserSTT } from '@/lib/speech/browserSTT';
import { ChatMessages, type ChatMessage } from './ChatMessages';
import { pendingOrderManager, type PendingOrderItem } from '@/lib/state/pendingOrderManager';
import {
  MealQuestionGenerator,
  isMealComplete,
  parseMealSize,
  parseIceLevel,
  findSideByName,
  findDrinkByName,
} from '@/lib/ordering/mealCustomizationFlow';
import {
  isMealEligible,
  hasMealEligibleItems,
  getMealEligibleItems,
  generateMealConversionOffer,
  convertToPendingItem,
  parseMealConversionResponse,
} from '@/lib/ordering/mealConversion';

interface AvatarContainerProps {
  onReady?: () => void;
  onError?: (error: Error) => void;
  onItemAddedToCart?: () => void;
  onItemNotFound?: (filteredItems: any[], query: string, message: string) => void;
}

export function AvatarContainer({ onReady, onError, onItemAddedToCart, onItemNotFound }: AvatarContainerProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Cart store for adding and removing items
  const { addItem, removeItem, updateQuantity, items } = useCartStore();

  // Helper to add a message to the chat (keep last 10 messages for conversation memory)
  const addMessage = (text: string, sender: 'user' | 'avatar') => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages((prev) => {
      const updated = [...prev, newMessage];
      // Keep only the last 10 messages for conversation memory
      return updated.slice(-10);
    });
  };

  // Use refs for values that shouldn't trigger effect re-runs
  const hasGreetedRef = useRef(false);
  const isListeningRef = useRef(false);
  const avatarRef = useRef<HTMLElement & { videoStyle?: any; volume?: number }>(null);
  const shouldBlockKlleonLLMRef = useRef(false); // Track when to block Klleon's LLM
  const browserSTTRef = useRef<BrowserSTT | null>(null); // Browser STT instance (bypasses Klleon LLM)

  // Process order with NLP
  const processOrder = async (userText: string) => {
    try {
      addDebugEvent({
        type: 'info',
        source: 'AvatarContainer.processOrder',
        message: `Processing order: "${userText}"`
      });

      // Call NLP API to parse order
      const response = await fetch('/api/nlp/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const { success, data } = await response.json();

      if (!success) {
        throw new Error('Order parsing failed');
      }

      console.log(`[✅ NLP RESULT] Items: ${data.items.length} | Intent: ${data.intent}`);
      addDebugEvent({
        type: 'info',
        source: '✅ NLP RESULT',
        message: `Parsed ${data.items.length} items | Intent: ${data.intent}`,
        data: data
      });

      // ========================================
      // HANDLE MEAL CONVERSION OFFER RESPONSE (must check BEFORE meal response)
      // ========================================
      if (pendingOrderManager.isOfferingMealConversion()) {
        console.log('[🍔 MEAL CONVERSION] User responding to meal conversion offer');
        addDebugEvent({
          type: 'info',
          source: '🍔 MEAL CONVERSION',
          message: 'Processing meal conversion response',
          data: { userText }
        });

        const eligibleIndexes = pendingOrderManager.getMealEligibleIndexes();
        const pendingState = pendingOrderManager.getState();

        if (!pendingState) {
          console.error('[🍔 MEAL CONVERSION] No pending state found!');
          return;
        }

        // Get eligible items from pending state
        const eligibleItems = eligibleIndexes.map(idx => pendingState.items[idx]);

        // Parse user's response
        const conversionResponse = parseMealConversionResponse(userText, eligibleItems);

        if (conversionResponse.accepted) {
          console.log('[🍔 MEAL CONVERSION] User accepted meal conversion');

          // If specific item index provided, convert that item
          if (conversionResponse.itemIndex !== undefined) {
            const actualIndex = eligibleIndexes[conversionResponse.itemIndex];
            pendingOrderManager.convertItemToMeal(actualIndex);

            const item = pendingOrderManager.getCurrentItem();
            if (item) {
              // Pre-populate meal details from acceptance response
              const mealDetails = conversionResponse.mealDetails || {};

              if (mealDetails.size) {
                pendingOrderManager.updateCurrentItemMealDetails({ size: mealDetails.size });
                console.log(`[🍔 SMART CONVERSION] Size: ${mealDetails.size}`);
              }

              if (mealDetails.side) {
                pendingOrderManager.updateCurrentItemMealDetails({ side: mealDetails.side });
                console.log(`[🍔 SMART CONVERSION] Side: ${mealDetails.side.name}`);
              }

              if (mealDetails.drink) {
                pendingOrderManager.updateCurrentItemMealDetails({ drink: mealDetails.drink });
                console.log(`[🍔 SMART CONVERSION] Drink: ${mealDetails.drink.name}`);
              }

              if (mealDetails.iceLevel) {
                pendingOrderManager.updateCurrentItemMealDetails({ iceLevel: mealDetails.iceLevel });
                console.log(`[🍔 SMART CONVERSION] Ice level: ${mealDetails.iceLevel}`);
              }

              // Check if meal is already complete (all details provided in acceptance)
              if (pendingOrderManager.isCurrentItemComplete()) {
                console.log('[🍔 SMART CONVERSION] Meal complete from acceptance response! Adding to cart...');

                const completedItem = pendingOrderManager.getCurrentItem();
                if (completedItem) {
                  addItem({
                    menuItemId: completedItem.menuItemId,
                    name: completedItem.name,
                    basePrice: completedItem.basePrice,
                    quantity: completedItem.quantity,
                    isCombo: true,
                    mealSize: completedItem.mealDetails?.size || 'medium',
                    mealSide: completedItem.mealDetails?.side ? {
                      id: completedItem.mealDetails.side.id,
                      name: completedItem.mealDetails.side.name,
                      priceModifier: completedItem.mealDetails.side.priceModifier,
                    } : null,
                    mealDrink: completedItem.mealDetails?.drink ? {
                      id: completedItem.mealDetails.drink.id,
                      name: completedItem.mealDetails.drink.name,
                      priceModifier: completedItem.mealDetails.drink.priceModifier,
                      iceLevel: completedItem.mealDetails.iceLevel,
                    } : null,
                    customizations: [],
                  });

                  console.log(`[🛒 CART] Added complete meal: ${completedItem.quantity}x ${completedItem.name} meal`);

                  // Check if there are more eligible items to offer conversion
                  const hasMoreItems = pendingOrderManager.completeCurrentItem();
                  const remainingEligibleIndexes = pendingOrderManager.getRemainingMealEligibleIndexes();

                  if (remainingEligibleIndexes.length > 0) {
                    const pendingState = pendingOrderManager.getState();
                    if (pendingState) {
                      const nextEligibleItem = pendingState.items[remainingEligibleIndexes[0]];
                      const offerMessage = `Perfect! You also have a ${nextEligibleItem.name} in your order. Would you like to make that a meal too?`;

                      console.log(`[🤖 AVATAR RESPONSE] "${offerMessage}"`);
                      addMessage(offerMessage, 'avatar');
                      await speak(offerMessage, 'Custom-NLP-Gemini');

                      pendingOrderManager.setOfferingMealConversion(true, remainingEligibleIndexes);
                      pendingOrderManager.setAwaitingResponse(true, offerMessage);

                      return;
                    }
                  }

                  // Add remaining non-meal items and clear
                  const nonMealItems = pendingOrderManager.getNonMealItems();
                  if (nonMealItems.length > 0) {
                    nonMealItems.forEach((item) => {
                      if (!item.isComplete) {
                        addItem({
                          menuItemId: item.menuItemId,
                          name: item.name,
                          basePrice: item.basePrice,
                          quantity: item.quantity,
                          customizations: [],
                          isCombo: false,
                        });
                        console.log(`[🛒 CART] Added: ${item.quantity}x ${item.name}`);
                      }
                    });
                  }

                  pendingOrderManager.clear();

                  const completionMessage = MealQuestionGenerator.generateMealCompleteMessage(completedItem);
                  console.log(`[🤖 AVATAR RESPONSE] "${completionMessage}"`);
                  addMessage(completionMessage, 'avatar');
                  await speak(completionMessage, 'Custom-NLP-Gemini');

                  onItemAddedToCart?.();
                  return;
                }
              }

              // Start meal customization (will skip already-provided details)
              const nextStep = pendingOrderManager.nextStep();
              const question = MealQuestionGenerator.generateQuestionForStep(nextStep, item);

              console.log(`[🍔 SMART CONVERSION] Starting customization for ${item.name} (step: ${nextStep})`);
              addMessage(question, 'avatar');
              await speak(question, 'Custom-NLP-Gemini');
              pendingOrderManager.setAwaitingResponse(true, question);

              return;
            }
          } else {
            // User said yes but didn't specify which item - ask for clarification
            const itemNames = eligibleItems.map(item => item.name).join(', ');
            const clarificationMessage = `Great! Which item would you like as a meal? ${itemNames}?`;

            console.log(`[🍔 MEAL CONVERSION] Asking for item clarification`);
            addMessage(clarificationMessage, 'avatar');
            await speak(clarificationMessage, 'Custom-NLP-Gemini');

            return; // Stay in meal conversion offer mode
          }
        } else {
          // User declined meal conversion - add all items as regular items
          console.log('[🍔 MEAL CONVERSION] User declined meal conversion');

          pendingState.items.forEach((item) => {
            if (!item.isMeal) {
              addItem({
                menuItemId: item.menuItemId,
                name: item.name,
                basePrice: item.basePrice,
                quantity: item.quantity,
                customizations: [],
                isCombo: false,
              });

              console.log(`[🛒 CART] Added: ${item.quantity}x ${item.name}`);
            }
          });

          // Clear pending order
          pendingOrderManager.clear();

          // Confirmation message
          const confirmMessage = "Got it! Anything else I can get you?";
          addMessage(confirmMessage, 'avatar');
          await speak(confirmMessage, 'Custom-NLP-Gemini');

          onItemAddedToCart?.();
          return;
        }
      }

      // ========================================
      // HANDLE MEAL RESPONSE INTENT (or fallback if pending order exists)
      // ========================================
      // Check if we have a pending meal order - handle response even if NLP didn't detect meal_response
      if (pendingOrderManager.hasPendingOrder() &&
          !pendingOrderManager.isOfferingMealConversion() &&
          (data.intent === 'meal_response' ||
           data.intent === 'unclear' ||
           (data.intent === 'order' && data.items.length === 0))) {

        console.log('[🍔 MEAL FLOW] Pending order detected - processing as meal customization response');

        const currentItem = pendingOrderManager.getCurrentItem();
        if (!currentItem) {
          console.error('[🍔 MEAL FLOW] No current item in pending order!');
          throw new Error('No current item in pending order');
        }

        // If NLP detected meal_response intent, use that data
        if (data.intent === 'meal_response' && data.mealResponse) {
        console.log('[🍔 MEAL FLOW] Processing meal customization response');
        addDebugEvent({
          type: 'info',
          source: '🍔 MEAL FLOW',
          message: 'Processing meal customization response',
          data: data.mealResponse
        });

        // Update meal details based on response
        const mealResponse = data.mealResponse || {};

        if (mealResponse.size) {
          pendingOrderManager.updateCurrentItemMealDetails({ size: mealResponse.size });
          console.log(`[🍔 MEAL FLOW] Updated size: ${mealResponse.size}`);
        }

        if (mealResponse.side) {
          const side = findSideByName(mealResponse.side);
          if (side) {
            pendingOrderManager.updateCurrentItemMealDetails({ side });
            console.log(`[🍔 MEAL FLOW] Updated side: ${side.name}`);
          }
        }

        if (mealResponse.drink) {
          const drink = findDrinkByName(mealResponse.drink);
          if (drink) {
            pendingOrderManager.updateCurrentItemMealDetails({ drink });
            console.log(`[🍔 MEAL FLOW] Updated drink: ${drink.name}`);
          }
        }

        if (mealResponse.iceLevel) {
          pendingOrderManager.updateCurrentItemMealDetails({ iceLevel: mealResponse.iceLevel });
          console.log(`[🍔 MEAL FLOW] Updated ice level: ${mealResponse.iceLevel}`);
        }
        } else {
          // FALLBACK: NLP didn't detect meal_response, try to parse manually
          console.log('[🍔 MEAL FLOW] NLP did not detect meal_response - using fallback parsing');
          addDebugEvent({
            type: 'info',
            source: '🍔 MEAL FLOW',
            message: 'Fallback: Parsing user response manually',
            data: { userText }
          });

          const currentStep = pendingOrderManager.getState()?.currentStep;

          // Try to parse based on current step
          if (currentStep === 'meal_size') {
            const size = parseMealSize(userText);
            if (size) {
              pendingOrderManager.updateCurrentItemMealDetails({ size });
              console.log(`[🍔 MEAL FLOW] Fallback parsed size: ${size}`);
            }
          } else if (currentStep === 'meal_side') {
            const side = findSideByName(userText);
            if (side) {
              pendingOrderManager.updateCurrentItemMealDetails({ side });
              console.log(`[🍔 MEAL FLOW] Fallback parsed side: ${side.name}`);
            }
          } else if (currentStep === 'meal_drink') {
            const drink = findDrinkByName(userText);
            if (drink) {
              pendingOrderManager.updateCurrentItemMealDetails({ drink });
              console.log(`[🍔 MEAL FLOW] Fallback parsed drink: ${drink.name}`);
            }
          } else if (currentStep === 'ice_level') {
            const iceLevel = parseIceLevel(userText);
            if (iceLevel) {
              pendingOrderManager.updateCurrentItemMealDetails({ iceLevel });
              console.log(`[🍔 MEAL FLOW] Fallback parsed ice level: ${iceLevel}`);
            }
          }
        }

        // Check if meal is complete
        if (pendingOrderManager.isCurrentItemComplete()) {
          console.log('[🍔 MEAL FLOW] Meal customization complete! Adding to cart...');

          // Add completed meal to cart
          const completedItem = pendingOrderManager.getCurrentItem();
          if (completedItem) {
            addItem({
              menuItemId: completedItem.menuItemId,
              name: completedItem.name,
              basePrice: completedItem.basePrice,
              quantity: completedItem.quantity,
              isCombo: true, // It's a meal
              mealSize: completedItem.mealDetails?.size || 'medium',
              mealSide: completedItem.mealDetails?.side ? {
                id: completedItem.mealDetails.side.id,
                name: completedItem.mealDetails.side.name,
                priceModifier: completedItem.mealDetails.side.priceModifier,
              } : null,
              mealDrink: completedItem.mealDetails?.drink ? {
                id: completedItem.mealDetails.drink.id,
                name: completedItem.mealDetails.drink.name,
                priceModifier: completedItem.mealDetails.drink.priceModifier,
                iceLevel: completedItem.mealDetails.iceLevel,
              } : null,
              customizations: [],
            });

            console.log(`[🛒 CART] Added meal: ${completedItem.quantity}x ${completedItem.name} meal`);
            addDebugEvent({
              type: 'info',
              source: '🛒 CART',
              message: `Added meal: ${completedItem.quantity}x ${completedItem.name} meal`,
              data: completedItem
            });

            // Check if there are more items to process
            const hasMoreItems = pendingOrderManager.completeCurrentItem();

            if (hasMoreItems) {
              // Move to next meal
              const nextItem = pendingOrderManager.getCurrentItem();
              if (nextItem && nextItem.isMeal) {
                console.log(`[🍔 MEAL FLOW] Moving to next meal: ${nextItem.name}`);

                // Generate transition message
                const transitionMessage = `Awesome! Now let's customize your ${nextItem.name} meal. What size would you like - medium or large?`;
                console.log(`[🤖 AVATAR RESPONSE] "${transitionMessage}"`);
                addMessage(transitionMessage, 'avatar');
                await speak(transitionMessage, 'Custom-NLP-Gemini');
                pendingOrderManager.setAwaitingResponse(true, transitionMessage);

                return; // Wait for next meal customization
              }
            }

            // Check if there are remaining meal-eligible items to offer conversion for
            const remainingEligibleIndexes = pendingOrderManager.getRemainingMealEligibleIndexes();
            if (remainingEligibleIndexes.length > 0) {
              console.log(`[🍔 MEAL CONVERSION] ${remainingEligibleIndexes.length} meal-eligible items remaining`);

              const pendingState = pendingOrderManager.getState();
              if (pendingState) {
                // Get the next eligible item
                const nextEligibleItem = pendingState.items[remainingEligibleIndexes[0]];

                // Offer to convert it
                const offerMessage = `Perfect! You also have a ${nextEligibleItem.name} in your order. Would you like to make that a meal too? It comes with a side and drink!`;
                console.log(`[🤖 AVATAR RESPONSE] "${offerMessage}"`);

                addMessage(offerMessage, 'avatar');
                await speak(offerMessage, 'Custom-NLP-Gemini');

                // Set state to offering meal conversion for remaining items
                pendingOrderManager.setOfferingMealConversion(true, remainingEligibleIndexes);
                pendingOrderManager.setAwaitingResponse(true, offerMessage);

                return; // Wait for conversion response
              }
            }

            // Add any remaining non-meal items to cart
            const nonMealItems = pendingOrderManager.getNonMealItems();
            if (nonMealItems.length > 0) {
              console.log(`[🛒 CART] Adding ${nonMealItems.length} remaining non-meal items`);

              nonMealItems.forEach((item) => {
                if (!item.isComplete) {
                  addItem({
                    menuItemId: item.menuItemId,
                    name: item.name,
                    basePrice: item.basePrice,
                    quantity: item.quantity,
                    customizations: [],
                    isCombo: false,
                  });

                  console.log(`[🛒 CART] Added: ${item.quantity}x ${item.name}`);
                }
              });
            }

            // All meals complete - clear pending order
            pendingOrderManager.clear();

            // Generate completion message
            const completionMessage = MealQuestionGenerator.generateMealCompleteMessage(completedItem);
            console.log(`[🤖 AVATAR RESPONSE] "${completionMessage}"`);
            addMessage(completionMessage, 'avatar');
            await speak(completionMessage, 'Custom-NLP-Gemini');

            // Switch to "Your Order" tab
            onItemAddedToCart?.();
            return;
          }
        }

        // If not complete, ask next question
        const nextStep = pendingOrderManager.nextStep();
        const nextQuestion = MealQuestionGenerator.generateQuestionForStep(nextStep, currentItem);

        console.log(`[🍔 MEAL FLOW] Asking next question (step: ${nextStep})`);
        addDebugEvent({
          type: 'info',
          source: '🍔 MEAL FLOW',
          message: `Asking next question - Step: ${nextStep}`,
          data: { nextQuestion }
        });

        addMessage(nextQuestion, 'avatar');
        await speak(nextQuestion, 'Custom-NLP-Gemini');
        pendingOrderManager.setAwaitingResponse(true, nextQuestion);

        return;
      }

      // Check if item not found - trigger fuzzy match filter
      if (data.itemNotFound && data.filteredItems && data.filteredItems.length > 0) {
        console.log(`[🔍 FUZZY MATCH] Found ${data.filteredItems.length} matches for "${data.filterQuery}"`);
        addDebugEvent({
          type: 'info',
          source: '🔍 FUZZY MATCH',
          message: `Showing ${data.filteredItems.length} matches for "${data.filterQuery}"`
        });

        // Trigger filter mode in parent component
        onItemNotFound?.(data.filteredItems, data.filterQuery, data.filterMessage);

        // Speak the filter message
        console.log(`[🤖 AVATAR RESPONSE] [Fuzzy Match] "${data.response}"`);
        addDebugEvent({
          type: 'speech',
          source: '🤖 AVATAR OUTPUT',
          message: `[Fuzzy Match] "${data.response}"`
        });

        // Add avatar message to chat
        addMessage(data.response, 'avatar');

        await speak(data.response, 'Custom-NLP-Gemini');
        return; // Exit early - don't add items
      }

      // Handle remove intent
      if (data.intent === 'remove' && data.items && data.items.length > 0) {
        data.items.forEach((itemToRemove: any) => {
          // Find cart items matching this name
          const matchingItems = items.filter(cartItem =>
            cartItem.name.toLowerCase() === itemToRemove.name.toLowerCase()
          );

          if (matchingItems.length > 0) {
            // Determine how many to remove (default to 1 if quantity not specified)
            const quantityToRemove = itemToRemove.quantity || 1;

            // Process each matching cart item until we've removed the requested quantity
            let remainingToRemove = quantityToRemove;

            for (const cartItem of matchingItems) {
              if (remainingToRemove <= 0) break;

              if (cartItem.quantity <= remainingToRemove) {
                // Remove entire item if quantity to remove >= item quantity
                removeItem(cartItem.id);
                remainingToRemove -= cartItem.quantity;
                console.log(`[🗑️ CART] Removed entire item: ${cartItem.quantity}x ${cartItem.name}`);
              } else {
                // Decrement quantity if removing less than total
                const newQuantity = cartItem.quantity - remainingToRemove;
                updateQuantity(cartItem.id, newQuantity);
                console.log(`[🗑️ CART] Reduced quantity: ${cartItem.name} from ${cartItem.quantity} to ${newQuantity}`);
                remainingToRemove = 0;
              }
            }

            addDebugEvent({
              type: 'info',
              source: '🗑️ CART',
              message: `Removed: ${quantityToRemove}x ${itemToRemove.name}`
            });
          }
        });
      }

      // ========================================
      // HANDLE ORDER INTENT
      // ========================================
      if (data.intent === 'order' && data.items && data.items.length > 0) {
        // Check if any items are meals
        const mealItems = data.items.filter((item: any) => item.isMeal);
        const regularItems = data.items.filter((item: any) => !item.isMeal);

        // Check if regular items are meal-eligible
        const hasMealEligible = hasMealEligibleItems(regularItems);

        // PATTERN 1: Only regular items, some meal-eligible
        if (regularItems.length > 0 && hasMealEligible && mealItems.length === 0) {
          // Offer meal conversion for regular items
          console.log('[🍔 MEAL CONVERSION] Detected meal-eligible items, offering conversion');
          addDebugEvent({
            type: 'info',
            source: '🍔 MEAL CONVERSION',
            message: 'Offering meal conversion for eligible items',
            data: regularItems
          });

          // Convert to pending items
          const pendingItems: PendingOrderItem[] = regularItems.map((item: any) =>
            convertToPendingItem(item, false)
          );

          // Find eligible item indexes
          const eligibleIndexes: number[] = [];
          regularItems.forEach((item: any, idx: number) => {
            if (isMealEligible(item)) {
              eligibleIndexes.push(idx);
            }
          });

          // Initialize pending order
          pendingOrderManager.initialize(
            regularItems.length === 1 ? 'single' : 'multiple_items',
            pendingItems
          );

          // Set meal conversion offer state
          pendingOrderManager.setOfferingMealConversion(true, eligibleIndexes);

          // Generate and speak offer
          const offerMessage = generateMealConversionOffer(regularItems);
          console.log(`[🤖 AVATAR RESPONSE] "${offerMessage}"`);

          addMessage(offerMessage, 'avatar');
          await speak(offerMessage, 'Custom-NLP-Gemini');
          pendingOrderManager.setAwaitingResponse(true, offerMessage);

          return; // Wait for conversion response
        }

        // PATTERN 2: Mixed order (meal items + regular items)
        if (mealItems.length > 0 && regularItems.length > 0) {
          console.log(`[🍔 MIXED ORDER] Detected ${mealItems.length} meal(s) and ${regularItems.length} regular item(s)`);
          addDebugEvent({
            type: 'info',
            source: '🍔 MIXED ORDER',
            message: `Processing mixed order: ${mealItems.length} meal(s) + ${regularItems.length} regular item(s)`,
            data: { mealItems, regularItems }
          });

          // Convert ALL items to PendingOrderItem format (meals + regular)
          const allPendingItems: PendingOrderItem[] = [
            // First, add meal items
            ...mealItems.map((item: any) => ({
              menuItemId: item.menuItemId,
              name: item.name,
              basePrice: item.basePrice,
              quantity: item.quantity,
              isMeal: true,
              mealDetails: {
                size: item.mealDetails?.size,
                side: item.mealDetails?.side ? findSideByName(item.mealDetails.side) : undefined,
                drink: item.mealDetails?.drink ? findDrinkByName(item.mealDetails.drink) : undefined,
                iceLevel: item.mealDetails?.iceLevel,
              },
              isComplete: false,
            })),
            // Then add regular items
            ...regularItems.map((item: any) => convertToPendingItem(item, false))
          ];

          // Find meal-eligible indexes (offset by number of meal items)
          const eligibleIndexes: number[] = [];
          regularItems.forEach((item: any, idx: number) => {
            if (isMealEligible(item)) {
              eligibleIndexes.push(mealItems.length + idx); // Offset by meal items count
            }
          });

          // Initialize pending order with all items
          pendingOrderManager.initialize('multiple_items', allPendingItems);

          // Store eligible indexes for later conversion offers
          if (eligibleIndexes.length > 0) {
            pendingOrderManager.setOfferingMealConversion(false, eligibleIndexes);
          }

          // Start meal customization for first meal item
          const currentItem = pendingOrderManager.getCurrentItem();
          if (currentItem && currentItem.isMeal) {
            const nextStep = pendingOrderManager.nextStep();

            // Check if meal is already complete (all details provided in initial order)
            if (nextStep === 'complete') {
              console.log('[🍔 MIXED ORDER] First meal already complete! Adding to cart...');

              // Add completed meal to cart
              addItem({
                menuItemId: currentItem.menuItemId,
                name: currentItem.name,
                basePrice: currentItem.basePrice,
                quantity: currentItem.quantity,
                isCombo: true,
                mealSize: currentItem.mealDetails?.size || 'medium',
                mealSide: currentItem.mealDetails?.side ? {
                  id: currentItem.mealDetails.side.id,
                  name: currentItem.mealDetails.side.name,
                  priceModifier: currentItem.mealDetails.side.priceModifier,
                } : null,
                mealDrink: currentItem.mealDetails?.drink ? {
                  id: currentItem.mealDetails.drink.id,
                  name: currentItem.mealDetails.drink.name,
                  priceModifier: currentItem.mealDetails.drink.priceModifier,
                  iceLevel: currentItem.mealDetails.iceLevel,
                } : null,
                customizations: [],
              });

              console.log(`[🛒 CART] Added complete meal: ${currentItem.quantity}x ${currentItem.name} meal`);

              // Check if there are more meal items to process
              const hasMoreItems = pendingOrderManager.completeCurrentItem();
              if (hasMoreItems) {
                const nextItem = pendingOrderManager.getCurrentItem();
                if (nextItem && nextItem.isMeal) {
                  // Process next meal (recursively)
                  const nextMealStep = pendingOrderManager.nextStep();

                  if (nextMealStep === 'complete') {
                    // Next meal is also complete - continue processing
                    // This will be handled in next iteration
                    console.log('[🍔 MIXED ORDER] Next meal also complete, continuing...');
                    // Fall through to handle non-meal items below
                  } else {
                    // Next meal needs customization
                    const nextQuestion = MealQuestionGenerator.generateQuestionForStep(nextMealStep, nextItem);
                    console.log(`[🤖 AVATAR RESPONSE] "${nextQuestion}"`);
                    addMessage(nextQuestion, 'avatar');
                    await speak(nextQuestion, 'Custom-NLP-Gemini');
                    pendingOrderManager.setAwaitingResponse(true, nextQuestion);
                    return;
                  }
                }
              }

              // Add remaining non-meal items and eligible conversion offers
              const remainingEligibleIndexes = pendingOrderManager.getRemainingMealEligibleIndexes();
              if (remainingEligibleIndexes.length > 0) {
                const pendingState = pendingOrderManager.getState();
                if (pendingState) {
                  const nextEligibleItem = pendingState.items[remainingEligibleIndexes[0]];
                  const offerMessage = `Perfect! You also have a ${nextEligibleItem.name} in your order. Would you like to make that a meal too?`;
                  addMessage(offerMessage, 'avatar');
                  await speak(offerMessage, 'Custom-NLP-Gemini');
                  pendingOrderManager.setOfferingMealConversion(true, remainingEligibleIndexes);
                  pendingOrderManager.setAwaitingResponse(true, offerMessage);
                  return;
                }
              }

              // Add remaining non-meal items to cart
              const nonMealItems = pendingOrderManager.getNonMealItems();
              if (nonMealItems.length > 0) {
                nonMealItems.forEach((item) => {
                  if (!item.isComplete) {
                    addItem({
                      menuItemId: item.menuItemId,
                      name: item.name,
                      basePrice: item.basePrice,
                      quantity: item.quantity,
                      customizations: [],
                      isCombo: false,
                    });
                    console.log(`[🛒 CART] Added: ${item.quantity}x ${item.name}`);
                  }
                });
              }

              // Clear and complete
              pendingOrderManager.clear();
              const completionMessage = MealQuestionGenerator.generateMealCompleteMessage(currentItem);
              console.log(`[🤖 AVATAR RESPONSE] "${completionMessage}"`);
              addMessage(completionMessage, 'avatar');
              await speak(completionMessage, 'Custom-NLP-Gemini');
              onItemAddedToCart?.();
              return;
            }

            // If not complete, ask first question
            const firstQuestion = MealQuestionGenerator.generateQuestionForStep(nextStep, currentItem);

            console.log(`[🍔 MIXED ORDER] Starting customization for first meal (step: ${nextStep})`);
            console.log(`[🤖 AVATAR RESPONSE] "${firstQuestion}"`);

            addMessage(firstQuestion, 'avatar');
            await speak(firstQuestion, 'Custom-NLP-Gemini');
            pendingOrderManager.setAwaitingResponse(true, firstQuestion);

            return; // Wait for meal customization
          }
        }

        // PATTERN 3: Only meal items OR regular items without meal eligibility
        if (mealItems.length > 0 && regularItems.length === 0) {
          // Only meal items
          console.log(`[🍔 MEAL FLOW] Detected ${mealItems.length} meal order(s)`);
          addDebugEvent({
            type: 'info',
            source: '🍔 MEAL FLOW',
            message: `Starting meal customization for ${mealItems.length} meal(s)`,
            data: mealItems
          });

          // Convert NLP items to PendingOrderItem format
          const pendingItems: PendingOrderItem[] = mealItems.map((item: any) => ({
            menuItemId: item.menuItemId,
            name: item.name,
            basePrice: item.basePrice,
            quantity: item.quantity,
            isMeal: true,
            mealDetails: {
              size: item.mealDetails?.size,
              side: item.mealDetails?.side ? findSideByName(item.mealDetails.side) : undefined,
              drink: item.mealDetails?.drink ? findDrinkByName(item.mealDetails.drink) : undefined,
              iceLevel: item.mealDetails?.iceLevel,
            },
            isComplete: false,
          }));

          // Initialize pending order
          pendingOrderManager.initialize(
            mealItems.length === 1 ? 'meal' : 'multiple_meals',
            pendingItems
          );

          // Start meal customization flow
          const currentItem = pendingOrderManager.getCurrentItem();
          if (currentItem) {
            // Determine first missing component
            const nextStep = pendingOrderManager.nextStep();

            // Check if meal is already complete (all details provided in initial order)
            if (nextStep === 'complete') {
              console.log('[🍔 MEAL FLOW] Meal already complete! Adding to cart...');

              // Add completed meal to cart
              addItem({
                menuItemId: currentItem.menuItemId,
                name: currentItem.name,
                basePrice: currentItem.basePrice,
                quantity: currentItem.quantity,
                isCombo: true,
                mealSize: currentItem.mealDetails?.size || 'medium',
                mealSide: currentItem.mealDetails?.side ? {
                  id: currentItem.mealDetails.side.id,
                  name: currentItem.mealDetails.side.name,
                  priceModifier: currentItem.mealDetails.side.priceModifier,
                } : null,
                mealDrink: currentItem.mealDetails?.drink ? {
                  id: currentItem.mealDetails.drink.id,
                  name: currentItem.mealDetails.drink.name,
                  priceModifier: currentItem.mealDetails.drink.priceModifier,
                  iceLevel: currentItem.mealDetails.iceLevel,
                } : null,
                customizations: [],
              });

              console.log(`[🛒 CART] Added complete meal: ${currentItem.quantity}x ${currentItem.name} meal`);

              // Clear pending order
              pendingOrderManager.clear();

              // Generate completion message
              const completionMessage = MealQuestionGenerator.generateMealCompleteMessage(currentItem);
              console.log(`[🤖 AVATAR RESPONSE] "${completionMessage}"`);
              addMessage(completionMessage, 'avatar');
              await speak(completionMessage, 'Custom-NLP-Gemini');

              // Switch to "Your Order" tab
              onItemAddedToCart?.();
              return;
            }

            // If not complete, ask first question
            const firstQuestion = MealQuestionGenerator.generateQuestionForStep(nextStep, currentItem);

            console.log(`[🍔 MEAL FLOW] Starting customization (step: ${nextStep})`);
            console.log(`[🤖 AVATAR RESPONSE] "${firstQuestion}"`);

            addMessage(firstQuestion, 'avatar');
            await speak(firstQuestion, 'Custom-NLP-Gemini');
            pendingOrderManager.setAwaitingResponse(true, firstQuestion);

            return; // Don't continue - wait for meal customization
          }
        } else if (regularItems.length > 0 && !hasMealEligible && mealItems.length === 0) {
          // Only regular items, none meal-eligible - add directly to cart
          regularItems.forEach((item: any) => {
            addItem({
              menuItemId: item.menuItemId,
              name: item.name,
              basePrice: item.basePrice,
              quantity: item.quantity,
              selectedSize: item.size ? {
                id: item.size,
                name: item.size.charAt(0).toUpperCase() + item.size.slice(1),
                priceModifier: 0, // TODO: Get actual price modifier from menu
              } : undefined,
              customizations: [],
              isCombo: false,
            });

            console.log(`[🛒 CART] Added: ${item.quantity}x ${item.name}`);
            addDebugEvent({
              type: 'info',
              source: '🛒 CART',
              message: `Added: ${item.quantity}x ${item.name}`
            });
          });

          // Switch to "Your Order" tab
          onItemAddedToCart?.();
        }
      }

      // Speak response generated by Custom NLP
      console.log(`[🤖 AVATAR RESPONSE] [LLM: Custom-NLP-Gemini] "${data.response}"`);
      addDebugEvent({
        type: 'speech',
        source: '🤖 AVATAR OUTPUT',
        message: `[LLM: Custom-NLP-Gemini] "${data.response}"`
      });

      // Add avatar message to chat
      addMessage(data.response, 'avatar');

      await speak(data.response, 'Custom-NLP-Gemini');

      addDebugEvent({
        type: 'speech',
        source: '🤖 AVATAR OUTPUT',
        message: 'Speech completed successfully'
      });

    } catch (error) {
      console.error('[❌ ERROR] Order processing failed:', error);
      addDebugEvent({
        type: 'error',
        source: '❌ ERROR',
        message: `Order processing failed: ${error}`,
        data: error
      });

      // Fallback response
      const fallbackText = "Sorry, I had trouble understanding that. Could you repeat your order?";
      console.log(`[🤖 AVATAR RESPONSE] [LLM: Custom-NLP-Gemini] "${fallbackText}"`);
      addDebugEvent({
        type: 'speech',
        source: '🤖 AVATAR OUTPUT',
        message: `[LLM: Custom-NLP-Gemini] "${fallbackText}"`
      });

      // Add fallback message to chat
      addMessage(fallbackText, 'avatar');

      await speak(fallbackText, 'Custom-NLP-Gemini');
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        addDebugEvent({
          type: 'info',
          source: 'AvatarContainer.init',
          message: 'Starting avatar initialization (following Klleon official pattern)'
        });

        // Per Klleon docs: Set avatar properties via ref BEFORE initialization
        if (avatarRef.current) {
          avatarRef.current.videoStyle = {
            borderRadius: '0px',
            objectFit: 'contain',
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            transform: 'scale(0.85)'
          };
          avatarRef.current.volume = 100;
        }

        // Per Klleon docs: Register event handlers BEFORE calling init()
        // Event handlers are registered directly on window.KlleonChat
        // Re-registering replaces the previous handler (per docs)

        const { KlleonChat } = window;

        // 1. Register Status Event Handler
        // CRITICAL: Per docs, status parameter is a STRING, not an object!
        KlleonChat.onStatusEvent((status: string) => {
          console.log('[Avatar] Status:', status);
          addDebugEvent({
            type: 'status',
            source: 'Klleon.onStatusEvent',
            message: `Status: ${status}`,
            data: { status }
          });

          if (status === 'VIDEO_CAN_PLAY' && mounted) {
            setStatus('ready');
            addDebugEvent({
              type: 'status',
              source: 'AvatarContainer.handleStatus',
              message: 'Avatar video ready to play - status set to ready'
            });

            // Greet user when avatar is ready (only once)
            if (!hasGreetedRef.current) {
              hasGreetedRef.current = true;
              addDebugEvent({
                type: 'speech',
                source: 'AvatarContainer.handleStatus',
                message: 'Starting greeting sequence (1000ms delay)'
              });

              setTimeout(async () => {
                try {
                  const greetingText = "Hey! Welcome to McDonald's! I'm Casey, your ordering assistant. Press the microphone button to start ordering!";

                  console.log(`[🤖 AVATAR GREETING] [LLM: Custom-NLP-Gemini] "${greetingText}"`);
                  addDebugEvent({
                    type: 'speech',
                    source: '🤖 AVATAR OUTPUT',
                    message: `[LLM: Custom-NLP-Gemini] Greeting: "${greetingText}"`
                  });

                  await speak(greetingText, 'Custom-NLP-Gemini');

                  console.log('[Avatar] Greeting completed');
                  addDebugEvent({
                    type: 'speech',
                    source: '🤖 AVATAR OUTPUT',
                    message: 'Greeting completed successfully'
                  });
                } catch (error) {
                  console.error('[❌ ERROR] Greeting failed:', error);
                  addDebugEvent({
                    type: 'error',
                    source: '❌ ERROR',
                    message: `Greeting failed: ${error}`,
                    data: error
                  });
                }
              }, 1000);
            } else {
              addDebugEvent({
                type: 'info',
                source: 'AvatarContainer.handleStatus',
                message: 'Greeting skipped - already greeted'
              });
            }

            onReady?.();
          }
        });

        // 2. Register Chat Event Handler
        // NOTE: We use Browser STT (not Klleon STT), so we won't receive STT_RESULT events
        // This handler is only for monitoring Klleon's internal events (if any)
        KlleonChat.onChatEvent((event: any) => {
          console.log('[Klleon] Chat event:', event);
          addDebugEvent({
            type: 'chat',
            source: 'Klleon.onChatEvent',
            message: `Event: ${event.chat_type}`,
            data: event
          });

          // NOTE: No STT handling here - we use Browser STT which bypasses Klleon's LLM
        });

        // 3. Initialize SDK (after event handlers are registered)
        addDebugEvent({
          type: 'info',
          source: 'AvatarContainer.init',
          message: 'Calling initializeKlleon() - SDK will prevent duplicate init internally'
        });

        await initializeKlleon();

        addDebugEvent({
          type: 'status',
          source: 'AvatarContainer.init',
          message: 'Klleon initialization completed'
        });

        if (!mounted) return;

      } catch (error) {
        console.error('[Avatar] Initialization error:', error);
        addDebugEvent({
          type: 'error',
          source: 'AvatarContainer.init',
          message: `Initialization failed: ${error}`,
          data: error
        });

        if (!mounted) return;

        const errorMsg = error instanceof Error ? error.message : 'Failed to initialize avatar';
        setErrorMessage(errorMsg);
        setStatus('error');
        onError?.(error instanceof Error ? error : new Error(errorMsg));
      }
    };

    init();

    return () => {
      mounted = false;
      // Cleanup: destroy avatar instance
      if (isKlleonReady() && window.KlleonChat) {
        try {
          console.log('[Avatar] Cleaning up avatar instance...');
          window.KlleonChat.destroy();
        } catch (error) {
          console.error('[Avatar] Cleanup error:', error);
        }
      }
    };
  }, []); // ← EMPTY dependency array per Klleon docs - only run once!

  // Toggle microphone listening (push-to-talk)
  // USING BROWSER STT - Bypasses Klleon's LLM completely!
  const toggleMicrophone = async () => {
    // Check microphone availability first
    const micCheck = await BrowserSTT.checkMicrophoneAvailability();

    if (!micCheck.available) {
      console.error('[Microphone] Not available:', micCheck.error);
      addDebugEvent({
        type: 'error',
        source: 'Microphone Check',
        message: micCheck.error || 'Microphone not available'
      });

      // Show alert to user
      alert(`Microphone Error:\n\n${micCheck.error}\n\nPlease:\n1. Check Windows microphone privacy settings\n2. Ensure a microphone is connected\n3. Close other apps using the microphone\n4. Refresh the page after fixing`);
      return;
    }

    // Initialize Browser STT if not already done
    if (!browserSTTRef.current) {
      try {
        browserSTTRef.current = new BrowserSTT();
        console.log('[Browser STT] Initialized successfully');
        addDebugEvent({
          type: 'info',
          source: 'Browser STT',
          message: 'Initialized - Using native browser speech recognition (bypasses Klleon LLM)'
        });
      } catch (error) {
        console.error('[Browser STT] Initialization failed:', error);
        addDebugEvent({
          type: 'error',
          source: 'Browser STT',
          message: `Failed to initialize: ${error}`,
          data: error
        });
        alert(`Speech Recognition Error:\n\n${error}\n\nPlease refresh the page and try again.`);
        return;
      }
    }

    try {
      if (isListening) {
        // Stop listening
        console.log('[Browser STT] Stopping...');
        addDebugEvent({
          type: 'info',
          source: 'Browser STT',
          message: 'User stopped speaking - processing...'
        });
        browserSTTRef.current.stop();
        isListeningRef.current = false;
        setIsListening(false);
      } else {
        // Start listening
        console.log('[Browser STT] Starting...');
        addDebugEvent({
          type: 'info',
          source: 'Browser STT',
          message: 'Listening for user speech...'
        });

        browserSTTRef.current.start(
          // On successful speech recognition
          (text: string) => {
            console.log(`[👤 USER INPUT] "${text}"`);
            addDebugEvent({
              type: 'speech',
              source: '👤 USER INPUT',
              message: `"${text}"`
            });

            // Add user message to chat
            addMessage(text, 'user');

            // Stop listening
            isListeningRef.current = false;
            setIsListening(false);

            // Process order with custom NLP (NO Klleon LLM involved!)
            console.log('[🧠 NLP PROCESSING] Sending to Google Gemini for order parsing...');
            addDebugEvent({
              type: 'info',
              source: '🧠 NLP PROCESSING',
              message: 'Processing with Google Gemini 1.5 Flash (Klleon LLM never contacted!)'
            });

            processOrder(text);
          },
          // On error
          (error: Error) => {
            console.error('[Browser STT] Recognition error:', error);
            addDebugEvent({
              type: 'error',
              source: 'Browser STT',
              message: `Speech recognition failed: ${error.message}`,
              data: error
            });
            isListeningRef.current = false;
            setIsListening(false);
          }
        );

        isListeningRef.current = true;
        setIsListening(true);
      }
    } catch (error) {
      console.error('[Browser STT] Toggle error:', error);
      addDebugEvent({
        type: 'error',
        source: 'Browser STT',
        message: `Microphone toggle failed: ${error}`,
        data: error
      });
      isListeningRef.current = false;
      setIsListening(false);
    }
  };

  // CRITICAL: Always render avatar-container element, even while loading
  // SDK needs the element to exist in DOM when init() is called
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      {/* Klleon avatar custom element - MUST be in DOM before SDK init */}
      {/* Per docs: videoStyle and volume are set via ref, not JSX props */}
      <avatar-container
        ref={avatarRef}
        className="w-full h-full"
        style={{ zIndex: 10 }}
      />

      {/* Chat Messages Overlay - WhatsApp style with McDonald's theme */}
      {status === 'ready' && (
        <ChatMessages messages={messages} />
      )}

      {/* Loading Overlay - shown while status is 'loading' */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-mcd-red/80 to-mcd-dark-red/80 backdrop-blur-sm" style={{ zIndex: 20 }}>
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border-4 border-white/30 animate-pulse">
              <div className="w-20 h-20 border-4 border-white border-t-mcd-yellow rounded-full animate-spin" />
            </div>
            <p className="text-white text-lg font-medium">Loading Casey...</p>
            <p className="text-white/80 text-sm mt-1">Preparing your ordering assistant</p>
          </div>
        </div>
      )}

      {/* Error Overlay - shown if avatar fails to load */}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm" style={{ zIndex: 20 }}>
          <div className="text-center max-w-md px-6">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border-4 border-white/30 mx-auto">
              <span className="text-6xl">⚠️</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Avatar Unavailable</h3>
            <p className="text-white/90 text-sm mb-4">{errorMessage || 'Failed to load avatar'}</p>
            <p className="text-white/80 text-xs">
              You can still browse and order from the menu below
            </p>
          </div>
        </div>
      )}

      {/* Microphone Button - Push to Talk */}
      {status === 'ready' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={toggleMicrophone}
            className={`
              relative group
              w-24 h-24 rounded-full
              flex items-center justify-center
              transition-all duration-300 transform
              ${isListening
                ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse shadow-2xl shadow-red-500/50'
                : 'bg-mcd-red hover:bg-mcd-dark-red hover:scale-105 shadow-xl'
              }
            `}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {/* Microphone Icon */}
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isListening ? (
                // Stop icon when listening
                <rect x="6" y="6" width="12" height="12" strokeWidth={2} fill="currentColor" />
              ) : (
                // Microphone icon when not listening
                <>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </>
              )}
            </svg>

            {/* Listening indicator rings */}
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50"></span>
              </>
            )}
          </button>

          {/* Status text */}
          <div className="mt-3 text-center">
            <p className="text-sm font-bold text-white bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
              {isListening ? '🔴 Listening... Speak now!' : '🎤 Press to speak'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
