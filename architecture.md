# Architecture Details

## System Overview

```
Kiosk Browser (1080x1920 portrait)
  │
  ├── Next.js 15 (App Router)
  │     ├── /                    Idle screen (tap → /order)
  │     ├── /order               Main orchestrator (avatar + voice + NLP + cart)
  │     ├── /checkout            Order type + payment
  │     ├── /confirmation        Order number + auto-return
  │     └── /api/*               Server-side API routes
  │
  ├── Klleon SDK v1.2.0          Avatar rendering, STT, TTS (lip-sync)
  ├── OpenAI GPT-4o-mini         NLP order intent parsing (streaming, JSON mode)
  ├── PostgreSQL                 Menu data, orders (via Prisma 7)
  └── DynamoDB (optional)        Session storage, menu cache (L2)
```

## File Structure

```
app/
├── page.tsx                       Idle screen (McDonald's branded, "Start Order")
├── order/page.tsx                 MAIN ORCHESTRATOR: voice, NLP, cart, checkout, meal flow
├── checkout/page.tsx              Checkout page
├── confirmation/page.tsx          Order confirmation with auto-return
├── layout.tsx                     Root layout (Klleon SDK script, Inter font)
├── globals.css                    Tailwind v4 + McDonald's brand CSS tokens
└── api/
    ├── menu/route.ts              GET: categories + items (from cache → DB)
    ├── menu/item/[id]/route.ts    GET: single item + customizations
    ├── nlp/parse-order/route.ts   POST: GPT-4o-mini NLP + fuzzy match + variant detection
    ├── meal-conversion/route.ts   POST: check combo meal eligibility
    ├── combos/route.ts            GET: all combo meals
    ├── order/route.ts             POST: create order
    ├── session/route.ts           POST: create kiosk session
    ├── session/[id]/route.ts      GET/PATCH: session management
    ├── health/route.ts            GET: health check
    ├── debug-log/route.ts         POST: dual logging (dev only)
    ├── payment/process/route.ts   POST: payment processing
    └── payment/[id]/route.ts      GET: payment status

components/
├── avatar/
│   ├── AvatarContainer.tsx        Klleon SDK mount point (<div id="klleon-avatar">)
│   ├── ChatMessages.tsx           Floating chat bubbles (user right, Casey left)
│   ├── MicButton.tsx              Animated microphone button
│   └── TextInput.tsx              Text input alternative to voice
├── menu/
│   ├── MenuSection.tsx            Category tabs + drag-scroll carousel + "Your Order" tab
│   ├── MenuCard.tsx               Menu item card (image, price, add/customize buttons)
│   ├── CategoryTabs.tsx           Horizontal tab bar with order count badge
│   ├── CustomizationModal.tsx     5-step meal builder wizard (modal)
│   ├── ClarificationBanner.tsx    "Did you mean...?" disambiguation UI
│   ├── FilterBanner.tsx           NLP filter indicator ("Showing results for...")
│   ├── MealConversionModal.tsx    "Make it a meal?" modal
│   ├── MealCustomizationFlow.tsx  Visual meal customization component
│   ├── MealSuggestionModal.tsx    Meal deal savings suggestion
│   ├── ComboValueBadge.tsx        Savings badge on combo items
│   └── MenuBottomSheet.tsx        Alternative bottom sheet menu view
├── cart/
│   ├── CartButton.tsx             Header icon with item count badge
│   ├── CartDrawer.tsx             Slide-from-right cart panel
│   ├── CartItem.tsx               Cart item row (qty, price, customizations)
│   ├── CartItemEditModal.tsx      Edit item modal
│   └── CartSummary.tsx            Subtotal + 8.25% tax + total
├── order/
│   ├── OrderItemsCarousel.tsx     "Your Order" tab: header + drag-scroll cards
│   ├── OrderItemCard.tsx          Rich card (image, COMBO badge, meal breakdown, buttons)
│   └── EmptyOrderState.tsx        Empty cart placeholder with tips
├── debug/
│   └── DebugPanel.tsx             F8-activated debug overlay
├── ErrorBoundary.tsx              React error boundary wrapper
└── ui/
    ├── Button.tsx, Modal.tsx, BottomSheet.tsx

stores/                            Zustand 5 state management
├── cartStore.ts                   Items, addItem, removeItem, updateQuantity, getItemTotal,
│                                  subtotal, tax, total, itemCount, cartSummary (with meal details)
├── uiStore.ts                     isProcessing, isListening, chatMessages, panel visibility
├── clarificationStore.ts          active, type, candidates, activate, dismiss
├── conversationStore.ts           orderedCategories, preferredSize, canSuggest, markSuggested
├── actionHistoryStore.ts          push/pop action history for undo/redo
└── pendingOrderStore.ts           Pending order state

lib/
├── nlp/
│   ├── orderProcessor.ts          GPT-4o-mini prompt (45 rules) + streaming + JSON parse
│   └── compressMenu.ts            Menu → compressed token-efficient format (~60% reduction)
├── klleon/
│   └── avatar.ts                  init, speak (echo + 150ms delay), onSTT, endStt, destroy
├── ordering/
│   ├── pendingOrderManager.ts     Singleton state machine: meal_size → meal_side → meal_drink → ice_level → complete
│   ├── mealCustomizationFlow.ts   parseMealSize, parseIceLevel, findSideByName, findDrinkByName, MealQuestionGenerator
│   └── mealConversion.ts          isMealEligible (category + keyword check), hasMealEligibleItems
├── cache/
│   ├── menuCache.ts               L1 in-memory Map (5-min TTL) → L2 DynamoDB → L3 Prisma
│   └── sessionStore.ts            Session create/get/update with DynamoDB fallback
├── utils/
│   └── fuzzyMatcher.ts            Fuse.js search: fuzzyMatchMenuItem, fuzzySearchAll (aliases + names)
├── clarificationResolver.ts       Resolve ambiguous: ordinals, exact names, normalized (M&M→M and M), keyword scoring
├── mealConversion.ts              DB-backed: checkMealConversion (Prisma combo lookup), getComboDefaults
├── mealDealDetector.ts            detectMealDeals: find cart items that form a cheaper combo
├── pairingEngine.ts               getSuggestions: category-based pairing rules + buildSuggestionPrompt
├── orderReadback.ts               buildOrderReadback: natural language cart summary for TTS
├── dynamodb.ts                    DynamoDB DocumentClient wrapper
├── db.ts                          Prisma client singleton (global caching for dev HMR)
├── env.ts                         Runtime env validation with lazy getters
└── types.ts                       All shared types: CartItem, NLPOrderIntent, MenuItemDTO, ComboMealDTO, etc.

hooks/
├── useDragScroll.ts               Mouse + touch drag-to-scroll with velocity tracking + momentum (rAF)
└── useIdleTimeout.ts              Configurable idle timeout with warning countdown

prisma/
├── schema.prisma                  8 models, PostgreSQL provider, Prisma 7
└── seed.ts                        Seeds 60 items, 312 customizations, 182 aliases, 21 combos

types/
└── klleon.d.ts                    Klleon SDK global type declarations
```

## Data Flow: Voice Ordering (Detailed)

```
1. User speaks into microphone
     ↓
2. Klleon SDK STT transcribes → onSTT callback → processTranscriptRef.current(transcript)
     ↓
3. processTranscript() intercept chain (checked in order):
     a. Active clarification? → resolveClarification() → resolve or dismiss
     b. Pending meal customization? → pendingOrderManager parses step response
     c. Pending meal offer? → accept (start meal flow) or reject
     d. Voice checkout in progress? → handle readback/order-type/payment step
     e. None of the above → call NLP API
     ↓
4. POST /api/nlp/parse-order
     ├── Fetch menu from cache (menuCache.ts: L1 → L2 → L3)
     ├── Fetch meal-eligible items (combo DB query, 5-min cache)
     ├── Build GPT-4o-mini messages: system prompt (45 rules) + conversation history + user message
     │     User message includes: compressed MENU, CART summary, LAST_ADDED, MEAL_ELIGIBLE list
     ├── Stream GPT response → buffer → JSON.parse
     ├── Post-processing:
     │     ├── Fuzzy match item names → menuItemId + real price + categoryName
     │     ├── Variant detection (generic "McFlurry" → list all variants)
     │     ├── Server-side meal offer stripping (non-eligible items)
     │     └── Fallback response generation if GPT omits fields
     └── Return NLPOrderIntent JSON
     ↓
5. handleNLPResponse(intent, transcript) in order/page.tsx
     ├── add: add items to cart → check meal eligibility
     │     ├── User said "meal" → start meal flow immediately
     │     ├── User said size + meal-eligible → size-implies-meal → start flow
     │     ├── NLP mentioned meal → arm mealConversionData for next response
     │     └── No meal → try upsell suggestions after 3s
     ├── remove: find cart item (fuzzy) → remove
     ├── modify: find original → replace with new item
     ├── modify_size: check meal-eligible → start meal flow OR do size swap
     ├── undo: pop actionHistory → reverse last action
     ├── clear: clear cart + history
     ├── checkout: readback → confirm → order type → payment → confirmation
     ├── meal_response: accept/reject meal offer → start/skip flow
     ├── info: speak response (no cart changes)
     └── unknown: show fuzzy candidates → ClarificationBanner
     ↓
6. Avatar speaks response via speak() → Klleon echo() with 150ms delay
     ↓
7. Chat messages updated in UI (ChatMessages component)
```

## Data Flow: Touch Ordering

```
1. User browses MenuSection (tap category tabs, swipe carousel)
     ↓
2. Tap "Add" on MenuCard → handleAdd() → cartStore.addItem()
   OR
   Tap "Customize" → CustomizationModal opens
     ├── Step 1: Meal ($2.50 more) or A la carte?
     ├── Step 2: Medium or Large? (meal only, +$1 for large)
     ├── Step 3: Pick a side (Fries, Corn Cup, Garden Salad)
     ├── Step 4: Pick a drink + ice level (6 drinks, 3 ice options)
     └── Step 5: Customizations + special instructions + quantity
     ↓
3. handleCustomizeConfirm() → cartStore.addItem() with all meal/customization fields
     ↓
4. "Your Order" tab shows OrderItemsCarousel
     ├── OrderItemCard: image, name, COMBO badge, meal breakdown (size/side/drink/ice), price, buttons
     ├── Customize button: re-opens modal for editing
     └── Remove button: removes item from cart
```

## Meal Customization State Machine (pendingOrderManager)

```
States: meal_size → meal_side → meal_drink → ice_level → complete

                    ┌─── size pre-filled? ───┐
                    │                         │
initialize() → meal_size ──→ meal_side ──→ meal_drink ──→ ice_level ──→ complete
                    │                                                      │
                    │            nextStep() checks what's missing          │
                    │            and skips filled steps                     │
                    └──────────────────────────────────────────────────────┘
                                                                           │
                                                                    completeCurrentItem()
                                                                           │
                                                                    add to cart with:
                                                                    isCombo, mealSize,
                                                                    mealSide, mealDrink
                                                                    (with iceLevel)
```

## Key Patterns

### Stale Closure Prevention
```typescript
// processTranscriptRef always points to the latest processTranscript
const processTranscriptRef = useRef<(transcript: string) => void>(() => {});
useEffect(() => { processTranscriptRef.current = processTranscript; }, [processTranscript]);
// STT callback uses ref to avoid stale closure
onSTT((transcript) => { processTranscriptRef.current(transcript); });
```

### Cart Summary for NLP Context
Cart items include meal details so NLP knows what's already configured:
```
"1x Big Mac MEAL (large meal, Fries, Coke no ice), 1x McFlurry with OREO"
```

### Dual Logging (dlog)
```typescript
function dlog(event: string, data?: any) {
  console.log(`[CASEY] ${event}: ${data}`);
  fetch("/api/debug-log", { method: "POST", body: JSON.stringify({ event, data }) });
}
```
Logs to both browser console and server file (`conversation-debug.log`) for debugging voice flows.

### Server-Side NLP Post-Processing
The NLP route applies several corrections after GPT returns:
1. **Fuzzy enrichment**: Map item names → menuItemId + real DB price
2. **Variant detection**: Generic names → list variants with prices
3. **Meal offer stripping**: Remove "make it a meal?" for non-eligible items (McFlurry, Apple Pie, etc.)
4. **Meal-eligible cache**: 5-min TTL cache of items with combo meals in DB

### Meal Eligibility
Two layers:
1. **Client-side** (`lib/ordering/mealConversion.ts`): keyword + category check (fast, no DB)
2. **Server-side** (`lib/mealConversion.ts`): Prisma combo meal lookup (authoritative)
3. **NLP prompt**: MEAL_ELIGIBLE list injected into GPT context

### Size-Implies-Meal Logic
When user says "large Big Mac" (size + meal-eligible item without saying "meal"):
- `modify_size` handler: detects meal eligibility → starts meal flow with size pre-filled
- `add` handler: `sizeImpliesMeal` flag → same path as explicit "meal" request
- Non-meal items (drinks, fries) get normal size changes
