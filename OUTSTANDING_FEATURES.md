# Outstanding Features & Implementation Guide

This document lists all features that are planned but **not yet built**. Each section includes what needs to be done and how to implement it.

---

## Table of Contents

1. [NLP Menu Filtering (Voice-to-Menu)](#1-nlp-menu-filtering-voice-to-menu)
2. [Meal Conversion Flow](#2-meal-conversion-flow)
3. [Meal Customization Q&A](#3-meal-customization-qa)
4. [Pending Order Manager](#4-pending-order-manager)
5. [Clarification Flow](#5-clarification-flow)
6. [Price Lookup on Voice Orders](#6-price-lookup-on-voice-orders)
7. [Fuse.js Fuzzy Matching Integration](#7-fusejs-fuzzy-matching-integration)
8. [Smart Conversation Context](#8-smart-conversation-context)
9. [Meal Deal Detection & Suggestions](#9-meal-deal-detection--suggestions)
10. [Upselling & Pairing Engine](#10-upselling--pairing-engine)
11. [Multi-Turn Corrections](#11-multi-turn-corrections)
12. [Voice Checkout Flow](#12-voice-checkout-flow)
13. [Inactivity Timeout](#13-inactivity-timeout)
14. [Klleon LLM Blocking](#14-klleon-llm-blocking)
15. [Text Input Fallback](#15-text-input-fallback)
16. [DynamoDB Session & Cache](#16-dynamodb-session--cache)
17. [Error Boundaries & Graceful Degradation](#17-error-boundaries--graceful-degradation)
18. [Compressed NLP Prompt](#18-compressed-nlp-prompt)
19. [Order Confirmation Readback](#19-order-confirmation-readback)
20. [Debug Panel Activation](#20-debug-panel-activation)

---

## 1. NLP Menu Filtering (Voice-to-Menu)

**Status**: Not wired up
**What exists**: FilterBanner component, Fuse.js dependency installed
**What's missing**: When the NLP parses a voice order and matches menu items, the menu should auto-filter to show those items.

### Implementation

1. In `app/order/page.tsx`, after receiving NLP results:
   ```typescript
   // After NLP returns parsed items
   const nlpResult = await fetch("/api/nlp/parse-order", { ... });
   const { items } = await nlpResult.json();

   // Filter the menu to show matched items
   setFilteredItems(items.map(i => i.menuItemId));
   setFilterQuery(userSpeechText);
   ```

2. Pass `filteredItems` and `filterQuery` to `MenuSection`:
   ```typescript
   <MenuSection
     filteredItemIds={filteredItems}
     filterQuery={filterQuery}
     onClearFilter={() => { setFilteredItems(null); setFilterQuery(""); }}
   />
   ```

3. In `MenuSection`, when `filteredItemIds` is set, show only those items across all categories and render `FilterBanner` at the top.

---

## 2. Meal Conversion Flow

**Status**: Not built
**Plan Phase**: 7

When a user orders an item that could be part of a combo (e.g., "Big Mac"), the system should offer to convert it to a meal.

### Implementation

1. Create `lib/mealConversion.ts`:
   ```typescript
   export async function checkMealConversion(menuItemId: number): Promise<ComboMeal | null> {
     // Query combo_meals where main_item_id matches
     // If combo exists and is available, return it
     // Otherwise return null
   }
   ```

2. Create `components/menu/MealConversionModal.tsx`:
   - Shows the combo offer: "Would you like to make that a Big Mac Meal for $X.XX more?"
   - Displays savings amount
   - "Make it a Meal" (primary) and "Just the Burger" (secondary) buttons
   - If accepted, replace the cart item with the combo + default side + default drink

3. Wire into cart flow:
   - When `addItem()` is called in cartStore, check if the item has an associated combo
   - If yes, show MealConversionModal before adding
   - If user accepts, add combo items instead

4. Voice flow:
   - After NLP parses "Big Mac", check for combo availability
   - Avatar asks via `echo()`: "Would you like to make that a Big Mac Meal? It comes with fries and a drink for just $2 more."
   - Parse response as `meal_response` intent (yes/no)

---

## 3. Meal Customization Q&A

**Status**: Not built
**Plan Phase**: 7

When a meal is ordered, ask step-by-step about side and drink choices.

### Implementation

1. Create `lib/mealCustomization.ts`:
   ```typescript
   interface MealCustomizationStep {
     type: "side" | "drink" | "size";
     question: string;
     options: MenuItem[];
     default: MenuItem;
   }

   export function getMealCustomizationSteps(combo: ComboMeal): MealCustomizationStep[] {
     return [
       { type: "side", question: "What side would you like?", options: sides, default: combo.defaultSide },
       { type: "drink", question: "And what drink?", options: drinks, default: combo.defaultDrink },
       { type: "size", question: "What size?", options: ["Small", "Medium", "Large"], default: "Medium" },
     ];
   }
   ```

2. Create `components/menu/MealCustomizationFlow.tsx`:
   - Full-screen step-by-step modal
   - Shows current step (1/3, 2/3, 3/3)
   - Horizontal scroll of options for each step
   - Default option pre-selected
   - "Next" and "Back" navigation
   - Avatar speaks each question via `echo()`

3. Parse voice responses:
   - NLP should handle responses like "medium fries", "Coke", "large"
   - Map to `meal_response` intent with `{ step, selection }`

---

## 4. Pending Order Manager

**Status**: Not built
**Plan Phase**: 7

Manages items that are being processed/confirmed before adding to cart.

### Implementation

1. Create `stores/pendingOrderStore.ts`:
   ```typescript
   interface PendingItem {
     menuItem: MenuItem;
     quantity: number;
     customizations: string[];
     status: "confirming" | "customizing" | "meal_offer" | "ready";
     comboOffer?: ComboMeal;
   }

   interface PendingOrderState {
     pendingItems: PendingItem[];
     addPending: (item: PendingItem) => void;
     confirmItem: (index: number) => void;  // moves to cart
     removePending: (index: number) => void;
     clearPending: () => void;
   }
   ```

2. Flow:
   - Voice order parsed -> items go to `pendingItems` with status "confirming"
   - Avatar reads back: "I heard Big Mac and medium fries. Is that right?"
   - On confirmation, check for meal conversion -> status "meal_offer"
   - After all decisions, status "ready" -> move to cart

---

## 5. Clarification Flow

**Status**: Not built
**Plan Phase**: 7

When NLP can't match an item or the match is ambiguous, ask for clarification.

### Implementation

1. Create `stores/clarificationStore.ts`:
   ```typescript
   interface ClarificationState {
     active: boolean;
     type: "not_found" | "ambiguous" | "size_needed";
     originalQuery: string;
     candidates: MenuItem[];  // for ambiguous
     activate: (type, query, candidates?) => void;
     resolve: (selectedItem: MenuItem) => void;
     dismiss: () => void;
   }
   ```

2. In the NLP response handler:
   - If `confidence < 0.6` and no match -> activate "not_found"
   - Avatar says: "I didn't quite catch that. Could you say it again?"
   - If multiple matches with similar scores -> activate "ambiguous"
   - Avatar says: "Did you mean the Big Mac or the Mac Chicken?"
   - Show filtered carousel with the candidates
   - If item needs size but none specified -> activate "size_needed"
   - Avatar says: "What size would you like? Small, medium, or large?"

3. Create `components/menu/ClarificationBanner.tsx`:
   - Shows at top of menu area during clarification
   - "Did you mean..." with tappable options
   - "None of these" dismiss button

---

## 6. Price Lookup on Voice Orders

**Status**: Not built
**Plan Phase**: 7

When items are added via voice, look up real prices from the database instead of relying on NLP.

### Implementation

1. In `app/api/nlp/parse-order/route.ts`, after GPT returns parsed items:
   ```typescript
   // GPT returns: [{ name: "Big Mac", quantity: 1 }]
   // Look up actual prices from DB
   for (const item of parsedItems) {
     const dbItem = await prisma.menuItem.findFirst({
       where: { name: { contains: item.name, mode: "insensitive" } },
       include: { customizations: true },
     });
     if (dbItem) {
       item.menuItemId = dbItem.id;
       item.unitPrice = Number(dbItem.price);
       item.name = dbItem.name; // Use canonical name
     }
   }
   ```

2. Return enriched items with real prices to the client.

---

## 7. Fuse.js Fuzzy Matching Integration

**Status**: Installed but not wired up
**Plan Phase**: 7

Use Fuse.js as a fallback when NLP can't find an exact match.

### Implementation

1. Create `lib/fuzzySearch.ts`:
   ```typescript
   import Fuse from "fuse.js";

   let fuseInstance: Fuse<MenuItem> | null = null;

   export function initFuzzySearch(menuItems: MenuItem[]) {
     fuseInstance = new Fuse(menuItems, {
       keys: ["name", "aliases.alias", "description"],
       threshold: 0.4,
       includeScore: true,
     });
   }

   export function fuzzySearch(query: string): MenuItem[] {
     if (!fuseInstance) return [];
     return fuseInstance.search(query).map(r => r.item);
   }
   ```

2. Initialize on menu load in the order page.

3. Use as fallback in NLP pipeline:
   - If GPT returns no matches, try `fuzzySearch(userQuery)`
   - If Fuse returns results, show them via FilterBanner with "Did you mean..."
   - Include `MenuItemAlias` records in the Fuse index for better matching

---

## 8. Smart Conversation Context

**Status**: Not built
**Plan Phase**: 9

Track conversation patterns to make smarter suggestions.

### Implementation

1. Create `stores/conversationStore.ts`:
   ```typescript
   interface ConversationState {
     orderedCategories: string[];  // track which categories user ordered from
     preferredSize: "small" | "medium" | "large" | null;
     suggestionsGiven: string[];   // prevent repeating suggestions
     lastSuggestionTime: number;
     addOrderedCategory: (cat: string) => void;
     setPreferredSize: (size: string) => void;
     canSuggest: (type: string) => boolean;  // check cooldown
   }
   ```

2. After each item added to cart:
   - Record the category
   - If size was specified, save as `preferredSize`
   - Use `preferredSize` as default for future items

3. Use context in NLP prompt:
   - "The customer has already ordered from: Burgers, Drinks"
   - "Their preferred size is Medium"

---

## 9. Meal Deal Detection & Suggestions

**Status**: Not built
**Plan Phase**: 9

Detect when items in the cart could be cheaper as a combo.

### Implementation

1. Create `lib/mealDealDetector.ts`:
   ```typescript
   export function detectMealDeals(cartItems: CartItem[]): MealDealSuggestion[] {
     // Check if any combination of cart items matches a combo_meal
     // e.g., Big Mac + Medium Fries + Medium Drink = Big Mac Meal (saves $2.50)
     // Return list of possible conversions with savings amounts
   }
   ```

2. Create `components/menu/MealSuggestionModal.tsx`:
   - Shows when a meal deal is detected
   - Displays current price vs meal price with savings highlighted
   - "Convert to Meal" and "Keep Separate" buttons

3. Create `components/menu/ComboValueBadge.tsx`:
   - Small badge on menu cards showing "Save $X as a meal"

4. Trigger detection:
   - Run `detectMealDeals()` every time cart changes
   - Only suggest once per combo (use `suggestionsGiven` from conversation store)

---

## 10. Upselling & Pairing Engine

**Status**: Not built
**Plan Phase**: 9

Suggest complementary items based on what's in the cart.

### Implementation

1. Create `lib/pairingEngine.ts`:
   ```typescript
   const PAIRINGS: Record<string, string[]> = {
     "Burgers": ["Fries", "Drinks", "Desserts"],
     "Chicken": ["Fries", "Drinks", "Sauces"],
     "Breakfast": ["Coffee", "Hash Browns", "Orange Juice"],
   };

   export function getSuggestions(cartItems: CartItem[], menu: MenuItem[]): MenuItem[] {
     // Based on cart categories, suggest items from paired categories
     // Filter out items already in cart
     // Prioritize popular items
   }
   ```

2. Avatar suggests at natural pauses:
   - After adding first item: "Would you like fries with that?"
   - After 5s silence: "Can I get you a drink to go with your meal?"
   - Respect cooldowns (don't suggest more than once per category)

3. Size upgrade suggestions:
   - When user orders "medium", avatar asks: "Would you like to make that a large for just $0.50 more?"

---

## 11. Multi-Turn Corrections

**Status**: Not built
**Plan Phase**: 10

Allow users to correct previous orders by voice.

### Implementation

1. Add intents to NLP:
   - `modify`: "Actually, make that a large" / "Change the fries to onion rings"
   - `remove`: "Remove the Big Mac" / "Take off the drink"
   - `replace`: "No, I meant the McChicken, not the Big Mac"

2. In the NLP prompt, include current cart contents:
   ```
   Current cart: 1x Big Mac ($5.99), 1x Medium Fries ($3.49)
   ```

3. Handle each intent:
   - `modify`: Find matching item in cart, update size/customization
   - `remove`: Find matching item, call `removeItem()` on cartStore
   - `replace`: Remove old item, add new item

4. Avatar confirms: "I've swapped the Big Mac for a McChicken. Anything else?"

---

## 12. Voice Checkout Flow

**Status**: Partially built (checkout page exists, voice trigger doesn't)
**Plan Phase**: 8

Allow users to check out entirely by voice.

### Implementation

1. Add `checkout` intent to NLP:
   - Triggers on: "That's all", "I'm done", "Check out", "That's everything"

2. When checkout intent detected:
   - Avatar reads order summary via `echo()`:
     "Alright, so you have 1 Big Mac, 1 Medium Fries, and 1 Medium Coke. Your total is $12.47. Dine in or takeout?"
   - Parse response for order type
   - Avatar: "And how would you like to pay? Card, cash, or mobile?"
   - Parse response for payment method
   - Process order and navigate to confirmation

3. Add to `app/order/page.tsx`:
   ```typescript
   if (nlpResult.intent === "checkout") {
     // Read back order summary
     const summary = buildOrderSummary(cartItems);
     await avatarEcho(summary);
     setCheckoutStep("order_type"); // start voice checkout flow
   }
   ```

---

## 13. Inactivity Timeout

**Status**: Not built (confirmation page has a 30s timer, but main order page doesn't)
**Plan Phase**: 6

### Implementation

1. In `app/order/page.tsx`:
   ```typescript
   const COLLAPSE_TIMEOUT = 30_000;  // 30s -> collapse panels
   const REDIRECT_TIMEOUT = 60_000;  // 60s -> redirect to idle

   useEffect(() => {
     let collapseTimer: NodeJS.Timeout;
     let redirectTimer: NodeJS.Timeout;

     const resetTimers = () => {
       clearTimeout(collapseTimer);
       clearTimeout(redirectTimer);
       collapseTimer = setTimeout(() => {
         // Collapse menu panel, hide cart
         setMenuOpen(false);
         setCartOpen(false);
       }, COLLAPSE_TIMEOUT);
       redirectTimer = setTimeout(() => {
         clearCart();
         router.push("/");
       }, REDIRECT_TIMEOUT);
     };

     // Reset on any interaction
     window.addEventListener("pointerdown", resetTimers);
     window.addEventListener("keydown", resetTimers);
     // Also reset on voice activity (STT events)

     resetTimers();
     return () => { /* cleanup */ };
   }, []);
   ```

---

## 14. Klleon LLM Blocking

**Status**: Pattern documented, not fully implemented
**Plan Phase**: 4

Prevent Klleon's built-in LLM from responding (we use our own GPT-4o-mini).

### Implementation

In `components/avatar/AvatarContainer.tsx`:
```typescript
let blockKlleonLLM = true; // Always block - we handle NLP ourselves

klleon.onChatEvent((event) => {
  if (event.type === "STT_RESULT") {
    klleon.stopSpeech(); // Stop any Klleon LLM response immediately
    handleUserSpeech(event.text); // Route to our NLP
    return;
  }

  if (blockKlleonLLM) {
    if (event.type === "PREPARING_RESPONSE" || event.type === "TEXT") {
      return; // Silently ignore Klleon's LLM responses
    }
  }
});
```

---

## 15. Text Input Fallback

**Status**: Not built
**Plan Phase**: 10

When STT fails or user prefers typing, show a text input.

### Implementation

1. Create `components/avatar/TextInput.tsx`:
   ```typescript
   // Fixed at bottom of avatar area
   // Shows when: STT fails, or user taps a "Type instead" button
   // On submit: send text to same NLP pipeline as voice
   <input
     placeholder="Type your order..."
     onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
   />
   ```

2. Add toggle in order page:
   - Small keyboard icon button near mic button
   - Switches between voice and text mode

---

## 16. DynamoDB Session & Cache

**Status**: Not built (tables not created)
**Plan Phase**: 0-2

### Implementation

1. Create DynamoDB tables:
   - `kiosk-sessions`: partition key = `sessionId`, TTL on `expiresAt`
   - `menu-cache`: partition key = `cacheKey`, TTL on `expiresAt`

2. Create `lib/dynamodb.ts`:
   ```typescript
   import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";

   export async function getSession(sessionId: string) { ... }
   export async function setSession(sessionId: string, data: any, ttlMinutes = 30) { ... }
   export async function getMenuCache() { ... }
   export async function setMenuCache(data: any, ttlMinutes = 60) { ... }
   ```

3. Use in API routes:
   - `GET /api/menu` checks DynamoDB cache first, falls back to RDS
   - `POST /api/nlp/parse-order` stores conversation in session

---

## 17. Error Boundaries & Graceful Degradation

**Status**: Not built
**Plan Phase**: 3

### Implementation

1. Create `components/ErrorBoundary.tsx`:
   ```typescript
   // Class component that catches render errors
   // Shows: "Something went wrong. Tap to retry."
   // Logs error to console / CloudWatch
   ```

2. Wrap sections independently in `app/order/page.tsx`:
   ```tsx
   <ErrorBoundary fallback={<AvatarFallback />}>
     <AvatarContainer />
   </ErrorBoundary>
   <ErrorBoundary fallback={<MenuFallback />}>
     <MenuSection />
   </ErrorBoundary>
   ```

3. Avatar failure = visual-only mode (menu + touch ordering still works)
4. STT failure = show text input fallback
5. TTS failure = show text in chat bubbles

---

## 18. Compressed NLP Prompt

**Status**: Not built (current prompt sends full item names)
**Plan Phase**: 7

Reduce token usage by compressing the menu in the NLP prompt.

### Implementation

1. Instead of listing every item:
   ```
   Current approach (~800 tokens):
   "Menu items: Big Mac ($5.99), Quarter Pounder ($6.49), McChicken ($4.99)..."

   Compressed approach (~200 tokens):
   "Categories: Burgers[Big Mac,QP,McChicken,Double], Chicken[McNuggets(6/10/20),Strips], Drinks[Coke,Sprite,Fanta,Coffee(S/M/L)]"
   ```

2. Create `lib/nlp/compressMenu.ts`:
   ```typescript
   export function compressMenuForPrompt(categories: Category[]): string {
     return categories.map(cat => {
       const items = cat.items.map(i => abbreviate(i.name)).join(",");
       return `${cat.name}[${items}]`;
     }).join(", ");
   }
   ```

---

## 19. Order Confirmation Readback

**Status**: Not built
**Plan Phase**: 9

Avatar reads back the full order before checkout.

### Implementation

1. When user says "that's all" or taps checkout:
   ```typescript
   const readback = buildReadback(cartItems, total);
   // "You've got 1 Big Mac, 1 Medium Fries, and 1 Medium Coke.
   //  Your total comes to $12.47. Shall I place the order?"
   await klleon.echo(readback);
   ```

2. Wait for confirmation ("yes" / "no" / "wait, change the...")
3. On "yes" -> proceed to payment
4. On "no" or modification -> handle accordingly

---

## 20. Debug Panel Activation

**Status**: Component built, not wired to keyboard shortcut
**Plan Phase**: 10

### Implementation

In `app/order/page.tsx`:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "F8") {
      setDebugPanelOpen(prev => !prev);
    }
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);
```

---

## Priority Order

| Priority | Features | Effort |
|----------|---------|--------|
| **P0 - Core** | NLP Menu Filtering, Price Lookup, Fuse.js, Klleon LLM Blocking | 3-4 days |
| **P1 - Meals** | Meal Conversion, Meal Customization Q&A, Pending Order Manager | 4-5 days |
| **P2 - Polish** | Clarification Flow, Multi-Turn Corrections, Voice Checkout | 3-4 days |
| **P3 - Smart** | Conversation Context, Meal Deal Detection, Upselling Engine | 3-4 days |
| **P4 - Infra** | DynamoDB, Error Boundaries, Compressed Prompt | 2-3 days |
| **P5 - Extra** | Text Input, Debug Panel, Inactivity Timeout, Readback | 2-3 days |
