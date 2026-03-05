# Architecture Details

## Full File Structure

```
mcdonalds-avatar-master/
├── app/
│   ├── page.tsx                    # Idle screen (Start Order button, ad background)
│   ├── layout.tsx                  # Root layout (Klleon SDK script, Inter font)
│   ├── globals.css                 # Tailwind + McDonald's brand CSS
│   ├── order/page.tsx              # MAIN: Theater mode (avatar + menu carousel)
│   ├── menu/page.tsx               # Browse mode (full grid view fallback)
│   ├── checkout/page.tsx           # Checkout page
│   ├── confirmation/page.tsx       # Order confirmation
│   └── api/
│       ├── menu/route.ts           # GET all menu items
│       ├── menu/[id]/route.ts      # GET single item + sizes + customizations
│       ├── combos/route.ts         # GET combo meals
│       ├── combos/[id]/route.ts    # GET single combo
│       ├── nlp/parse-order/route.ts # POST NLP processing (Gemini + fuzzy)
│       ├── order/route.ts          # POST create order
│       └── test-db/route.ts        # GET DB connection test
├── components/
│   ├── Avatar/
│   │   ├── AvatarContainer.tsx     # Main orchestrator: Klleon init, STT, NLP, cart integration
│   │   ├── ChatMessages.tsx        # Chat bubble display
│   │   └── index.ts
│   ├── Menu/
│   │   ├── MenuCarousel.tsx        # Horizontal scrolling menu (snap-scroll)
│   │   ├── MenuCard.tsx            # Individual menu item card
│   │   ├── CategoryTabs.tsx        # Category filter tabs (burger, chicken, etc.)
│   │   ├── CategoryFilter.tsx      # Alternative category filter
│   │   ├── CustomizationModal.tsx  # Item customization (sizes, toppings, meal options)
│   │   ├── FilterBanner.tsx        # Shows when fuzzy filter is active
│   │   ├── MenuList.tsx            # Grid view for /menu page
│   │   └── index.ts
│   ├── Cart/
│   │   ├── CartDrawer.tsx          # Slide-from-right cart panel
│   │   ├── CartButton.tsx          # Header cart icon with badge
│   │   ├── CartItem.tsx            # Individual cart item display
│   │   ├── CartSummary.tsx         # Subtotal, tax, total
│   │   └── index.ts
│   ├── Order/
│   │   ├── OrderItemsCarousel.tsx  # "Your Order" tab content
│   │   ├── OrderItemCard.tsx       # Order item display
│   │   ├── OrderReviewCarousel.tsx # Review before checkout
│   │   ├── EmptyOrderState.tsx     # Empty cart state
│   │   └── index.ts
│   ├── Debug/
│   │   ├── DebugPanel.tsx          # F8 debug overlay
│   │   └── index.ts
│   └── UI/
│       ├── Button.tsx, Card.tsx, Modal.tsx, Input.tsx
│       └── index.ts
├── lib/
│   ├── klleon/
│   │   ├── init.ts                 # Klleon SDK initialization (waitForSDK, init options)
│   │   ├── speak.ts                # echo() for TTS, stopSpeech()
│   │   ├── listeners.ts            # Klleon event listeners
│   │   └── index.ts
│   ├── speech/
│   │   └── browserSTT.ts           # Web Speech API wrapper (bypasses Klleon STT)
│   ├── nlp/
│   │   └── orderProcessor.ts       # Gemini prompt building + order parsing
│   ├── utils/
│   │   └── fuzzyMatcher.ts         # Fuse.js fuzzy search with fallback strategy
│   ├── supabase/
│   │   └── client.ts               # Supabase client
│   ├── db/
│   │   ├── menu.ts, orders.ts, sessions.ts, combos.ts, customizations.ts
│   │   └── index.ts
│   └── prisma.ts                   # Prisma client singleton
├── store/
│   ├── cart.ts                     # Zustand cart store (persisted)
│   └── clarification.ts           # Clarification state store
├── types/
│   ├── database.ts                 # DB type definitions
│   ├── api.ts                      # API response types
│   ├── klleon.d.ts                 # Klleon SDK type declarations
│   └── global.d.ts                 # Global type augmentations
├── prisma/
│   └── schema.prisma               # Prisma schema (6 models)
├── database/
│   ├── 01-create-tables.sql        # Table creation
│   ├── 02-seed-menu-items.sql      # 52+ menu items
│   ├── 03-seed-customizations.sql  # 120+ customization options
│   ├── 04-seed-combo-meals.sql     # 21 combo meals
│   └── VERIFY_DATABASE.sql         # Verification queries
├── Klleon Docs/                    # Klleon SDK documentation (Korean)
├── docs/                           # Testing docs
└── config files: package.json, tsconfig.json, tailwind.config.ts, next.config.js, etc.
```

## Data Flow: Voice Ordering
```
User speaks
  -> BrowserSTT (Web Speech API) transcribes to text
  -> AvatarContainer.processOrder(userText)
  -> POST /api/nlp/parse-order { userText, conversationHistory }
  -> Route fetches menu_items from Supabase
  -> Gemini 2.5 Flash parses with structured prompt (menu context + conversation history)
  -> If unclear/low confidence: Fuse.js fuzzy matching as fallback
  -> Response: { intent, items[], response, clarificationNeeded? }
  -> AvatarContainer processes result:
     - intent=order: add items to Zustand cart store
     - intent=unclear: show fuzzy-matched items in carousel (FilterBanner)
     - intent=modify/remove/checkout: handle accordingly
  -> Avatar speaks response via Klleon echo() (TTS with lip-sync)
  -> Chat messages updated in UI
```

## Data Flow: Visual Ordering
```
User browses MenuCarousel (swipe/tap)
  -> Tap "Add" on MenuCard -> handleAddToCart -> Zustand cart store
  -> Tap "Customize" -> CustomizationModal opens
  -> Choose size, toppings, meal options -> handleCustomizationAddToCart
  -> Cart updated, "Your Order" tab shows items
```

## Key Patterns
- AvatarContainer is the central orchestrator for the /order page
- All Klleon interactions go through lib/klleon/ utilities
- NLP is server-side only (API route) - Gemini API key not exposed to client
- Cart is client-side only (Zustand + localStorage)
- Menu data fetched from Supabase on each page load via API routes
