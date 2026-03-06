# McDonald's Avatar Ordering System

AI-powered McDonald's kiosk with a conversational avatar (Casey). Customers order via voice or touch menu. Built for portrait-mode kiosk displays (1080x1920).

## Features

### Voice Ordering
- **Speech-to-Text** via Klleon SDK — real-time transcription
- **NLP Parsing** via OpenAI GPT-4o-mini — extracts items, quantities, customizations, and intent
- **Text-to-Speech** via Klleon SDK — avatar speaks with lip-sync
- **Multi-turn context** — conversation history preserved across turns

### Smart Ordering Intelligence
- **Fuzzy matching** (Fuse.js) — handles misspellings, aliases, slang ("QP", "nuggs", "Big Mak")
- **Variant detection** — generic requests like "McFlurry" list available variants with prices
- **Meal conversion** — eligible items prompt "Would you like to make that a meal?"
- **Size-implies-meal** — saying "large Big Mac" auto-starts meal customization (sizes only apply to meals for mains)
- **Multi-step meal builder** — voice-driven: size → side → drink → ice level
- **Meal deal detection** — auto-detects when separate items form a cheaper combo
- **Pairing suggestions** — suggests complementary items (fries with burger, drink with meal)
- **Undo/redo** — "take that back" undoes the last action
- **Order readback** — "what's in my order?" reads back the full cart

### NLP Actions
| Action | Trigger Examples |
|--------|-----------------|
| `add` | "I want a Big Mac", "give me two fries" |
| `remove` | "remove the coke", "take off the nuggets" |
| `modify` | "change the Big Mac to a Quarter Pounder" |
| `modify_size` | "make that a large" |
| `undo` | "go back", "undo that" |
| `clear` | "start over", "clear everything" |
| `checkout` | "that's all", "I'm done" |
| `meal_response` | "yes" / "no" to meal offer |
| `info` | "what burgers do you have?", "how much is a Big Mac?" |
| `unknown` | Unclear input → fuzzy candidates shown |

### Touch Ordering
- Category tab navigation (Burgers, Chicken & Fish, Sides, Drinks, Desserts, Breakfast, Happy Meal)
- Drag-to-scroll menu carousel with momentum and arrow buttons
- 5-step customization modal (meal/solo → size → side → drink+ice → customizations+qty)
- "Your Order" tab with rich order cards showing meal breakdown

### UI
- Klleon avatar with chat bubbles (top portion)
- Menu carousel (bottom 35vh)
- Cart drawer (slide from right)
- Idle timeout with warning banner (60s → redirect to start)
- Text input toggle for typing instead of speaking
- Error boundaries for graceful degradation

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15 | App framework (App Router, SSR, API routes) |
| TypeScript | 5.9 | Type safety |
| Tailwind CSS | v4 | Styling |
| Prisma | 7 | PostgreSQL ORM (schema, migrations, seed) |
| Zustand | 5 | Client state management (cart, UI, conversation) |
| Klleon SDK | v1.2.0 | Avatar rendering, STT, TTS (lip-sync via `echo()`) |
| OpenAI | GPT-4o-mini | NLP order parsing (streaming, JSON mode) |
| Fuse.js | 7 | Fuzzy menu item matching |
| Framer Motion | 12 | Animations |
| PostgreSQL | 15+ | Menu, orders, combos, customizations |
| DynamoDB | (optional) | Session storage, menu cache (L2) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ running locally
- OpenAI API key
- Klleon SDK credentials

### Setup

```bash
# 1. Clone and install
git clone https://github.com/stefman1234/McDonalds-Avatar-Ordering-System---AWS-Rebuild.git
cd McDonalds-Avatar-Ordering-System---AWS-Rebuild
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys and database URL

# 3. Set up database
npx prisma migrate dev      # Create tables
npx tsx prisma/seed.ts       # Seed: 60 items, 312 customizations, 182 aliases, 21 combos

# 4. Run
npm run dev
```

Open http://localhost:3000

### Environment Variables

See [`.env.example`](.env.example) for all required variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key (starts with `sk-`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_KLLEON_SDK_KEY` | Yes | Klleon SDK application key |
| `NEXT_PUBLIC_KLLEON_AVATAR_ID` | Yes | Klleon avatar ID |
| `NEXT_PUBLIC_APP_URL` | No | App URL (default: http://localhost:3000) |
| `DYNAMODB_TABLE_SESSIONS` | No | DynamoDB table for sessions |
| `DYNAMODB_TABLE_CACHE` | No | DynamoDB table for menu cache |

---

## Project Structure

```
app/
  page.tsx                         # Idle screen (tap to start)
  order/page.tsx                   # Main orchestrator (avatar + voice + NLP + cart + checkout)
  checkout/page.tsx                # Checkout page
  confirmation/page.tsx            # Order confirmation
  layout.tsx                       # Root layout (Klleon SDK script, fonts)
  globals.css                      # Tailwind v4 + McDonald's brand tokens
  api/
    menu/route.ts                  # GET menu categories + items
    menu/item/[id]/route.ts        # GET single item + customizations
    nlp/parse-order/route.ts       # POST NLP parsing (GPT-4o-mini + fuzzy + variant detection)
    meal-conversion/route.ts       # POST check meal eligibility for item
    combos/route.ts                # GET all combo meals
    order/route.ts                 # POST create order
    session/route.ts               # POST create session
    session/[id]/route.ts          # GET/PATCH session
    health/route.ts                # GET health check
    debug-log/route.ts             # POST debug log (dev only)
    payment/process/route.ts       # POST payment processing
    payment/[id]/route.ts          # GET payment status

components/
  avatar/
    AvatarContainer.tsx            # Klleon SDK mount point
    ChatMessages.tsx               # Chat bubble overlay
    MicButton.tsx                  # Microphone button with animation
    TextInput.tsx                  # Text input alternative
  menu/
    MenuSection.tsx                # Tab navigation + menu/order carousel
    MenuCard.tsx                   # Menu item card with image fallback
    CategoryTabs.tsx               # Category tab bar
    CustomizationModal.tsx         # 5-step meal builder wizard
    ClarificationBanner.tsx        # Fuzzy match disambiguation UI
    FilterBanner.tsx               # NLP filter indicator
    MealConversionModal.tsx        # Meal offer modal
    MealCustomizationFlow.tsx      # Visual meal customization
    MealSuggestionModal.tsx        # Meal deal suggestion modal
    ComboValueBadge.tsx            # Combo savings badge
  cart/
    CartButton.tsx                 # Header cart icon + badge
    CartDrawer.tsx                 # Slide-out cart panel
    CartItem.tsx                   # Cart item display
    CartItemEditModal.tsx          # Edit cart item
    CartSummary.tsx                # Subtotal, tax, total
  order/
    OrderItemsCarousel.tsx         # "Your Order" tab carousel
    OrderItemCard.tsx              # Rich order card (meal breakdown, badges)
    EmptyOrderState.tsx            # Empty cart placeholder
  debug/
    DebugPanel.tsx                 # F8 debug overlay
  ErrorBoundary.tsx                # React error boundary

stores/
  cartStore.ts                     # Cart state (items, totals, meal details, summary)
  uiStore.ts                       # UI state (panels, processing, listening, chat)
  clarificationStore.ts            # Disambiguation state
  conversationStore.ts             # Multi-turn context (categories, sizes, suggestions)
  actionHistoryStore.ts            # Undo/redo action stack
  pendingOrderStore.ts             # Pending order state

lib/
  nlp/
    orderProcessor.ts              # GPT-4o-mini prompt + streaming + parsing
    compressMenu.ts                # Menu compression for token optimization (~60% reduction)
  klleon/
    avatar.ts                      # Klleon SDK wrapper (init, speak, STT, destroy)
  ordering/
    pendingOrderManager.ts         # State machine for multi-step meal customization
    mealCustomizationFlow.ts       # Parsers + question generators for meal steps
    mealConversion.ts              # Meal eligibility detection (category + keyword)
  cache/
    menuCache.ts                   # L1 in-memory + L2 DynamoDB + L3 Prisma
    sessionStore.ts                # Session management
  utils/
    fuzzyMatcher.ts                # Fuse.js fuzzy search with alias support
  clarificationResolver.ts         # Resolve ambiguous selections (ordinals, names, normalized matching)
  mealConversion.ts                # DB-backed combo meal lookup
  mealDealDetector.ts              # Detect combo savings from separate cart items
  pairingEngine.ts                 # Suggestion engine (complements, upsells)
  orderReadback.ts                 # Natural language order summary for TTS
  dynamodb.ts                      # DynamoDB client
  db.ts                            # Prisma client singleton
  env.ts                           # Environment variable validation
  types.ts                         # Shared TypeScript types

hooks/
  useDragScroll.ts                 # Drag-to-scroll with momentum (mouse + touch)
  useIdleTimeout.ts                # Idle timeout with warning countdown

prisma/
  schema.prisma                    # 8 models: Category, MenuItem, Alias, Customization, ComboMeal, ComboAlias, Order, OrderItem
  seed.ts                          # Seeds 60 items, 312 customizations, 182 aliases, 21 combos

types/
  klleon.d.ts                      # Klleon SDK TypeScript declarations
```

---

## Architecture

### Data Flow: Voice Ordering
```
User speaks
  → Klleon SDK STT transcribes to text
  → processTranscript() intercept chain:
      1. Active clarification? → resolveClarification()
      2. Pending meal customization? → pendingOrderManager state machine
      3. Pending meal offer? → accept/reject meal conversion
      4. Otherwise → POST /api/nlp/parse-order
  → NLP route:
      - GPT-4o-mini parses with menu context + conversation history + cart summary
      - Fuzzy matching enriches items with menuItemId + real price
      - Variant detection for ambiguous items (e.g., "McFlurry")
      - Server-side meal offer stripping for non-eligible items
  → handleNLPResponse() processes intent:
      - add: items to cart + check meal eligibility + size-implies-meal
      - remove/modify/modify_size: update cart
      - checkout: voice checkout flow (readback → order type → payment)
      - info: speak response (no cart changes)
      - unknown: show fuzzy candidates for disambiguation
  → Avatar speaks response via Klleon echo() (TTS with lip-sync)
```

### Data Flow: Touch Ordering
```
User browses MenuSection (tab + swipe)
  → Tap "Add" on MenuCard → addItem() → Zustand cart store
  → Tap "Customize" → CustomizationModal 5-step wizard
      Step 1: Meal or solo?
      Step 2: Medium or Large? (meal only)
      Step 3: Pick a side (meal only)
      Step 4: Pick a drink + ice level (meal only)
      Step 5: Customizations + special instructions + quantity
  → "Your Order" tab shows OrderItemsCarousel with rich cards
```

### State Management (Zustand)
| Store | Purpose |
|-------|---------|
| `cartStore` | Items, totals, meal details, cart summary for NLP context |
| `uiStore` | Panel visibility, processing state, chat messages |
| `clarificationStore` | Active disambiguation with candidates |
| `conversationStore` | Ordered categories, preferred sizes, suggestion cooldowns |
| `actionHistoryStore` | Undo/redo stack for cart operations |

### Menu Cache (3-tier)
```
L1: In-memory Map (< 1ms, 5-min TTL)
L2: DynamoDB (optional, ~20ms)
L3: Prisma/PostgreSQL (~50ms, source of truth)
```

### NLP Prompt Design
- 45 rules covering: ordering, modifications, questions, suggestions, disambiguation, meals, variants
- Compressed menu format saves ~60% tokens
- Includes: MENU items with prices/aliases/customizations, CART summary with meal details, LAST_ADDED for pronoun resolution, MEAL_ELIGIBLE list, conversation history

---

## Database

### Schema (8 models)
- **Category** — Menu categories (Burgers, Chicken & Fish, Sides, etc.)
- **MenuItem** — 60 menu items with prices, descriptions, images
- **MenuItemAlias** — 182 aliases for fuzzy matching ("QP" → Quarter Pounder)
- **Customization** — 312 customization options with price modifiers
- **ComboMeal** — 21 combo meals with default side/drink
- **ComboAlias** — Combo name aliases
- **Order** — Customer orders with status tracking
- **OrderItem** — Individual items within an order

### Seed Data
```bash
npx tsx prisma/seed.ts
# Creates: 60 menu items, 312 customizations, 182 aliases, 21 combos
```

---

## Testing

**Framework:** Jest 30 + ts-jest

### Test Suites

| Category | Files | Tests | Requirements |
|----------|-------|-------|--------------|
| Unit (stores, utilities) | 9 | 82 | None |
| Environment & DB | 1 | 11 | Running PostgreSQL |
| NLP Integration | 1 | 10 | OpenAI API key |
| API Endpoints | 1 | 10 | Running dev server |
| User Flow Simulations | 1 | 20 | Running dev server + OpenAI |
| Conversation Simulations | 1 | 50 | Running dev server + OpenAI |
| User Journey Tests | 1 | 15 | Running dev server + OpenAI |
| Difficult Customers | 1 | Various | Running dev server + OpenAI |

### Running Tests

```bash
# All tests
npm test

# Unit tests only (no external dependencies)
npm run test:unit

# Integration tests (requires running server + API keys + seeded DB)
npm run test:integration

# Environment check
npm run test:env
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | Production build (generates Prisma client + Next.js build) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed menu data (60 items, 312 customizations, 182 aliases, 21 combos) |
| `npm test` | Run all tests |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests |
| `npm run test:env` | Environment validation |

---

## How It Works

1. **Idle Screen** — McDonald's branded start screen with "Start Order" button
2. **Order Screen** — Klleon avatar (top) + menu carousel (bottom 35vh)
3. **Voice Ordering** — Speak to Casey, NLP parses intent, items added to cart with conversational responses
4. **Touch Ordering** — Browse categories, tap to add, customize via 5-step modal
5. **Meal Flow** — Eligible items trigger meal customization (voice: multi-step Q&A, touch: wizard modal)
6. **Cart Management** — Drawer shows items with edit/remove, order tab shows rich cards with meal breakdown
7. **Checkout** — Voice: readback → confirm → dine-in/takeout → payment. Touch: cart drawer checkout button
8. **Confirmation** — Order number displayed, auto-return to idle after timeout

---

## Production Target

**AWS Architecture:**
- EC2 t3.micro (Next.js app) or App Runner
- RDS db.t4g.micro (PostgreSQL)
- DynamoDB (sessions + menu cache)
- CloudFront CDN
- Estimated cost: ~$33/month

See [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) for step-by-step deployment instructions.
