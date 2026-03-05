# McDonald's Avatar Ordering System - Implementation Plan

**Project Version:** 0.1.0
**Last Updated:** 2025-11-11
**Status:** Foundation Complete (Phase 0)

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Timeline](#development-timeline)
4. [Phase Breakdown](#phase-breakdown)
5. [Quality Gates](#quality-gates)
6. [Risk Mitigation](#risk-mitigation)

---

## Project Overview

Building a McDonald's-style AI-powered ordering kiosk featuring a conversational avatar named "Casey" that can take orders via voice and visual interface.

### Goals
- Complete orders in < 90 seconds
- > 98% order accuracy
- Natural conversational experience
- Seamless payment integration
- Full order management system

### Key Features
- 🎭 AI Avatar with speech recognition and synthesis
- 🧠 Natural Language Processing for order understanding
- 🍔 60+ menu items with customizations
- 🛒 Smart cart with combo suggestions
- 💳 Payment processing (Stripe)
- 📊 Admin dashboard

---

## Technology Stack

### Frontend
- **Next.js 15** - App Router, Server Components
- **React 18** - Functional components only
- **TypeScript 5.3** - Strict mode enabled
- **Tailwind CSS 3.4** - Utility-first styling
- **Radix UI** - Accessible component primitives

### Avatar & Speech
- **Klleon SDK** - Avatar rendering
  - Built-in Speech-to-Text (STT)
  - Built-in Text-to-Speech (TTS)
  - Automatic lip sync

### AI & NLP
- **Google Gemini Flash** - Primary LLM ($3/month)
  - Order parsing
  - Response generation
- **compromise.js** - Free pattern matching for simple orders
- **LLM Abstraction Layer** - Provider-agnostic design

### Database & Backend
- **PostgreSQL** - via Supabase
- **Prisma ORM** - Type-safe database access
- **Next.js API Routes** - Serverless functions

### Payments
- **Stripe** - Payment processing (simulated in dev)

### State Management
- **Zustand** - Global state management

### Hosting & Deployment
- **Vercel** - Next.js optimized hosting

---

## Development Timeline

**Total Duration:** 7-8 weeks
**Team Size:** 1-2 developers
**Estimated Hours:** 280-350 hours

### Weekly Breakdown
- **Week 1:** Foundation & Database Setup (Phases 0-1)
- **Week 2:** Menu System & Cart (Phases 2-3)
- **Week 3:** Avatar & Basic NLP (Phases 4-5)
- **Week 4:** Advanced NLP & Voice Ordering (Phase 6)
- **Week 5:** Advanced Features (Customization, Combos) (Phase 7)
- **Week 6:** Polish & Optimization (Phase 8)
- **Week 7:** Payments & Admin Dashboard (Phase 9)
- **Week 8:** Testing, Documentation & Deployment (Phase 10)

---

## Phase Breakdown

### ✅ PHASE 0: FOUNDATION (Week 1, Days 1-2) - COMPLETE

#### Phase 0.1: Project Initialization ✅
**Time:** 20 minutes | **Status:** Complete

**Tasks Completed:**
- ✅ Created Next.js 14 project with TypeScript and Tailwind
- ✅ Installed all core dependencies
- ✅ Set up folder structure per FOLDER_STRUCTURE.md
- ✅ Created .env.local with credentials
- ✅ Initialized Git repository
- ✅ Created README.md

**Dependencies Installed:**
```bash
@google/generative-ai      # Gemini AI
@supabase/supabase-js      # Database
zustand                     # State management
framer-motion              # Animations
compromise                 # NLP pattern matching
@radix-ui/react-dialog     # Modal components
@radix-ui/react-select     # Select components
```

**Outcome:** ✅ Project runs at localhost:3000 with zero errors

---

#### Phase 0.2: TypeScript Configuration ✅
**Time:** 15 minutes | **Status:** Complete

**Tasks Completed:**
- ✅ Configured tsconfig.json with strict mode
- ✅ Added additional strict flags (noUnusedLocals, noUncheckedIndexedAccess, etc.)
- ✅ Set up path aliases (@/*)
- ✅ Configured ESLint for Next.js + TypeScript
- ✅ Configured Prettier for code formatting
- ✅ Created type definitions (database.ts, api.ts, global.d.ts)

**Outcome:** ✅ TypeScript compiles with zero errors

---

#### Phase 0.3: Tailwind & UI Setup ✅
**Time:** 20 minutes | **Status:** Complete

**Tasks Completed:**
- ✅ Updated globals.css with McDonald's branding
- ✅ Created custom CSS utilities and animations
- ✅ Built Button component (primary, secondary, outline)
- ✅ Built Card component (with header, body, footer)
- ✅ Built Modal component (using Radix UI)
- ✅ Built Input component (with labels, errors, validation)
- ✅ Created UI component showcase page

**McDonald's Brand Colors:**
- Red: #DA291C
- Yellow: #FFC72C
- Dark Red: #C41E3A
- Light Yellow: #FFD700

**Outcome:** ✅ Responsive UI components ready, all styled with McDonald's branding

---

### ⏳ PHASE 1: DATABASE & CORE SETUP (Week 1, Days 3-5)

#### Phase 1.1: Supabase Project Setup
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 0 complete, Supabase account created

**Tasks:**
1. Create Supabase project named "Mcdo"
2. Copy connection details to .env.local
3. Test connection from Next.js
4. Create Supabase client utility (`lib/supabase/client.ts`)
5. Verify connection with test query

**Expected Outcome:**
- Supabase project created
- Connection working from Next.js API route
- Client utility functional

**Testing Criteria:**
- Can query Supabase from `/api/test-db`
- No connection errors in console
- Environment variables loaded correctly

**Files to Create:**
- `lib/supabase/client.ts`
- `app/api/test-db/route.ts` (temporary test)

---

#### Phase 1.2: Database Schema - Core Tables
**Time:** 30 minutes | **Status:** Pending

**Prerequisites:** Phase 1.1 complete

**Tasks:**
1. Run SQL from DATABASE_SCHEMA.md in Supabase SQL Editor
2. Create `menu_items` table with all fields
3. Create `menu_item_sizes` table
4. Create `customization_options` table
5. Create indexes for performance
6. Verify tables created correctly

**Tables to Create:**
```sql
- menu_items (60+ items)
- menu_item_sizes (small, medium, large variants)
- customization_options (add, remove, substitute)
- combo_meals (meal deals)
```

**Expected Outcome:**
- All core tables exist in database
- Indexes created for foreign keys
- Can query tables without errors

**Testing Criteria:**
- `SELECT * FROM menu_items` returns empty result (no error)
- All columns exist as specified in schema
- Indexes show in Supabase dashboard

---

#### Phase 1.3: Database Schema - Seed Menu Data
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 1.2 complete

**Tasks:**
1. Insert ALL burger data from DATABASE_SCHEMA.md
2. Insert chicken & sandwich data
3. Insert sides data
4. Insert breakfast items (time-restricted)
5. Insert drinks data
6. Insert desserts data
7. Insert size modifiers for applicable items
8. Insert customization options
9. Verify 60+ items exist

**Menu Categories:**
- Burgers (Big Mac, Quarter Pounder, etc.)
- Chicken (McNuggets, McChicken, Crispy Chicken)
- Breakfast (McMuffin, Hotcakes, Hash Browns)
- Sides (Fries, Apple Slices)
- Drinks (Coke, Sprite, Coffee, McCafé)
- Desserts (Apple Pie, McFlurry, Cookies)

**Expected Outcome:**
- 60+ menu items in database
- All categories populated
- Prices and calories set
- Time restrictions applied (breakfast before 10:30 AM)

**Testing Criteria:**
- `SELECT COUNT(*) FROM menu_items` returns 60+
- Can query by category
- Popular items flagged correctly
- Vegetarian/gluten-free items marked

---

#### Phase 1.4: Database Schema - Orders & Sessions
**Time:** 20 minutes | **Status:** Pending

**Prerequisites:** Phase 1.3 complete

**Tasks:**
1. Create `orders` table
2. Create `order_items` table
3. Create `conversation_sessions` table
4. Set up foreign key relationships
5. Configure cascade deletes
6. Test with sample order

**Tables:**
```sql
orders (
  id, order_number, customer_name, order_type,
  status, subtotal, tax, total, payment_method,
  payment_status, session_id, notes, timestamps
)

order_items (
  id, order_id, menu_item_id, combo_meal_id,
  quantity, size, unit_price, line_total,
  customizations, special_instructions
)

conversation_sessions (
  id, session_id, order_id, status,
  conversation_history, current_step, context_data,
  timestamps
)
```

**Expected Outcome:**
- All order-related tables exist
- Relationships enforced
- Can create test order

**Testing Criteria:**
- Can insert test order
- Foreign keys prevent orphaned records
- Cascade deletes work correctly

---

#### Phase 1.5: Prisma ORM Setup
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 1.4 complete

**Tasks:**
1. Install Prisma CLI and client: `npm install @prisma/client prisma -D`
2. Initialize Prisma: `npx prisma init`
3. Pull schema from database: `npx prisma db pull`
4. Generate Prisma Client: `npx prisma generate`
5. Create database utility functions
6. Test queries with Prisma

**Files to Create:**
- `prisma/schema.prisma` (generated)
- `lib/supabase/menu.ts` (menu queries)
- `lib/supabase/orders.ts` (order queries)

**Expected Outcome:**
- Prisma Client generated
- Can query database via Prisma
- Types auto-generated and working

**Testing Criteria:**
- Can fetch menu items: `await prisma.menuItem.findMany()`
- Types are correctly inferred
- No Prisma errors
- Query results match database

---

### ⏳ PHASE 2: MENU API & UI (Week 1-2)

#### Phase 2.1: Menu API - GET All Items
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 1.5 complete

**Tasks:**
1. Create `/app/api/menu/route.ts`
2. Implement GET handler with Prisma
3. Add category filtering (`?category=burgers`)
4. Add availability filtering (`?available=true`)
5. Add time restriction filtering (breakfast items)
6. Return JSON response per API_SPECIFICATION.md
7. Test with Thunder Client/Postman

**API Endpoint:**
```
GET /api/menu
GET /api/menu?category=burgers
GET /api/menu?time=breakfast
GET /api/menu?popular=true
```

**Expected Outcome:**
- API endpoint functional
- Returns menu items as JSON
- Filtering works correctly

**Testing Criteria:**
- GET `/api/menu` returns all available items
- GET `/api/menu?category=burgers` returns only burgers
- GET `/api/menu?time=breakfast` returns breakfast items only
- Response format matches API_SPECIFICATION.md

**Files to Create:**
- `app/api/menu/route.ts`

---

#### Phase 2.2: Menu API - GET Single Item
**Time:** 20 minutes | **Status:** Pending

**Prerequisites:** Phase 2.1 complete

**Tasks:**
1. Create `/app/api/menu/[id]/route.ts`
2. Implement GET handler for single item by ID
3. Include size options in response
4. Include applicable customizations
5. Handle 404 for invalid ID
6. Test with various item IDs

**API Endpoint:**
```
GET /api/menu/{id}
```

**Expected Outcome:**
- Can fetch single item by ID
- Includes sizes array
- Includes customizations array
- 404 for invalid IDs

**Testing Criteria:**
- GET `/api/menu/{valid-id}` returns item with all details
- GET `/api/menu/{invalid-id}` returns 404
- Response includes `sizes: []` array
- Response includes `customizations: []` array

**Files to Create:**
- `app/api/menu/[id]/route.ts`

---

#### Phase 2.3: Menu Display Component - Structure
**Time:** 30 minutes | **Status:** Pending

**Prerequisites:** Phase 2.2 complete

**Tasks:**
1. Create `components/Menu/MenuDisplay.tsx`
2. Fetch menu data from API using custom hook
3. Create loading skeleton component
4. Create error state component
5. Display items in responsive grid
6. Test mobile/tablet/desktop layouts

**Expected Outcome:**
- Menu displays on screen
- Responsive grid layout
- Loading and error states functional

**Testing Criteria:**
- Menu items render in browser
- Grid adjusts on window resize (mobile: 1 col, tablet: 2 col, desktop: 3+ col)
- Loading skeleton shows while fetching
- Error message shows if API fails

**Files to Create:**
- `components/Menu/MenuDisplay.tsx`
- `components/Menu/MenuSkeleton.tsx`
- `components/Menu/ErrorState.tsx`
- `lib/hooks/useMenu.ts`

---

#### Phase 2.4: Menu Item Cards
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 2.3 complete

**Tasks:**
1. Create `components/Menu/MenuItem.tsx`
2. Display: image, name, price, calories
3. Add "Add to Order" button
4. Show popular badge if `item.popular === true`
5. Show vegetarian/gluten-free indicators
6. Add hover effects (scale, shadow)
7. Test with different item types

**Expected Outcome:**
- Beautiful menu item cards
- All info displayed clearly
- Interactive buttons and hover states

**Testing Criteria:**
- Cards render with correct data
- Hover effects work smoothly
- Popular badge shows on popular items
- Diet indicators display correctly
- Buttons are clickable (no function yet)

**Files to Create:**
- `components/Menu/MenuItem.tsx`

---

#### Phase 2.5: Category Filter Tabs
**Time:** 20 minutes | **Status:** Pending

**Prerequisites:** Phase 2.4 complete

**Tasks:**
1. Create `components/Menu/CategoryFilter.tsx`
2. Create tabs for: All, Burgers, Chicken, Breakfast, Sides, Drinks, Desserts
3. Implement active state styling
4. Filter menu items on tab click
5. Make responsive (horizontal scroll on mobile)
6. Test all categories

**Expected Outcome:**
- Category tabs functional
- Filtering works smoothly
- Mobile-friendly scrolling

**Testing Criteria:**
- Clicking tab filters menu to that category
- Active tab highlighted with McDonald's red
- "All" tab shows everything
- Works on mobile devices

**Files to Create:**
- `components/Menu/CategoryFilter.tsx`

---

### ⏳ PHASE 3: CART SYSTEM (Week 2)

#### Phase 3.1: Cart State Management
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 2.5 complete

**Tasks:**
1. Create Zustand cart store
2. Implement `addItem(item)` function
3. Implement `removeItem(itemId)` function
4. Implement `updateQuantity(itemId, quantity)` function
5. Implement `clearCart()` function
6. Implement `calculateTotal()` function (with 8% tax)
7. Add localStorage persistence
8. Create types for cart items

**Cart Store Structure:**
```typescript
interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  size?: string;
  customizations: Customization[];
  price: number;
  line_total: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
}
```

**Expected Outcome:**
- Cart store functional
- All CRUD operations work
- Cart persists across page refresh

**Testing Criteria:**
- Can add items to cart
- Quantities update correctly
- Total calculates with 8% tax: `total = subtotal * 1.08`
- Cart persists in localStorage
- Can clear cart

**Files to Create:**
- `lib/stores/cartStore.ts`
- `types/cart.ts`

---

#### Phase 3.2: Cart Sidebar UI
**Time:** 30 minutes | **Status:** Pending

**Prerequisites:** Phase 3.1 complete

**Tasks:**
1. Create `components/Cart/CartSidebar.tsx`
2. Create sliding panel animation (slide from right)
3. Display all cart items
4. Show empty state when cart is empty
5. Add close button
6. Make scrollable for many items
7. Test with 0, 1, 5, 10+ items

**Expected Outcome:**
- Cart sidebar slides in/out smoothly
- Shows all cart items
- Empty state when no items

**Testing Criteria:**
- Sidebar opens/closes with smooth animation
- Items display correctly
- Empty state shows "Your cart is empty" when no items
- Scrolls if more than 5-6 items
- Close button works

**Files to Create:**
- `components/Cart/CartSidebar.tsx`
- `components/Cart/EmptyCart.tsx`

---

#### Phase 3.3: Cart Item Component
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 3.2 complete

**Tasks:**
1. Create `components/Cart/CartItem.tsx`
2. Display: item name, price, quantity
3. Add quantity controls (+ / -)
4. Add remove button (trash icon)
5. Show customizations if any
6. Calculate and display line total
7. Handle edge cases (quantity can't go below 1)

**Expected Outcome:**
- Cart items render properly
- Quantity controls work
- Remove button works

**Testing Criteria:**
- Clicking + increases quantity
- Clicking - decreases quantity (min 1)
- Clicking remove deletes item from cart
- Line total = unit_price * quantity
- Customizations display below item name

**Files to Create:**
- `components/Cart/CartItem.tsx`

---

#### Phase 3.4: Cart Summary & Totals
**Time:** 20 minutes | **Status:** Pending

**Prerequisites:** Phase 3.3 complete

**Tasks:**
1. Create `components/Cart/CartSummary.tsx`
2. Calculate and display subtotal
3. Calculate and display tax (8%)
4. Calculate and display total
5. Display item count
6. Style clearly with borders
7. Test with different cart values

**Expected Outcome:**
- Summary shows all totals
- Calculations are correct
- Updates in real-time

**Testing Criteria:**
- Subtotal = sum of all line totals
- Tax = subtotal * 0.08
- Total = subtotal + tax
- Updates immediately when cart changes

**Files to Create:**
- `components/Cart/CartSummary.tsx`
- `lib/utils/calculations.ts`

---

#### Phase 3.5: Connect Menu to Cart
**Time:** 20 minutes | **Status:** Pending

**Prerequisites:** Phase 3.4 complete

**Tasks:**
1. Wire "Add to Order" button to cart store
2. Show success feedback when item added (toast notification)
3. Open cart sidebar automatically on add
4. Add cart badge to show item count in header
5. Test adding various items
6. Handle duplicate items (increase quantity)

**Expected Outcome:**
- Clicking "Add to Order" adds item to cart
- Cart opens automatically
- Badge shows item count

**Testing Criteria:**
- Items add to cart on click
- Cart sidebar opens
- Badge updates with correct count
- Duplicate items increase quantity instead of adding new entry
- Success feedback shows briefly

**Files Modified:**
- `components/Menu/MenuItem.tsx`
- `app/layout.tsx` (for cart badge in header)

---

### ⏳ PHASE 4: BASIC CHECKOUT (Week 2)

#### Phase 4.1: Checkout Page Structure
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 3.5 complete

**Tasks:**
1. Create `/app/checkout/page.tsx`
2. Display order review (all cart items)
3. Show cart summary (subtotal, tax, total)
4. Add order type selection (Dine In / Takeout radio buttons)
5. Add customer name input (optional)
6. Create layout with clear sections
7. Add navigation (back to menu)

**Expected Outcome:**
- Checkout page exists
- Shows order details clearly
- Order type selection works

**Testing Criteria:**
- Can navigate to `/checkout`
- Cart items display
- Order type buttons toggle correctly
- Name input accepts text
- Summary matches cart

**Files to Create:**
- `app/checkout/page.tsx`
- `components/Checkout/OrderReview.tsx`
- `components/Checkout/OrderTypeSelector.tsx`

---

#### Phase 4.2: Order Creation API
**Time:** 30 minutes | **Status:** Pending

**Prerequisites:** Phase 4.1 complete

**Tasks:**
1. Create `/app/api/order/route.ts`
2. Implement POST handler
3. Generate unique order number (e.g., #1001, #1002)
4. Save order to database using Prisma
5. Save order items with relationships
6. Handle validation errors
7. Return order confirmation with estimated time
8. Test with Postman/Thunder Client

**API Endpoint:**
```
POST /api/order
Body: {
  customer_name?: string,
  order_type: "dine_in" | "takeout",
  items: [...],
  subtotal: number,
  tax: number,
  total: number
}

Response: {
  id: string,
  order_number: string,
  status: "pending",
  total: number,
  estimated_time: 10,
  created_at: string
}
```

**Expected Outcome:**
- Can create orders via API
- Orders save to database with all items
- Order number auto-generated and unique

**Testing Criteria:**
- POST `/api/order` creates order successfully
- Order appears in Supabase dashboard
- Order number is unique (e.g., #1001, #1002, #1003)
- Returns order ID and number
- Validation errors handled (missing required fields)

**Files to Create:**
- `app/api/order/route.ts`
- `lib/utils/orderUtils.ts` (order number generation)

---

#### Phase 4.3: Submit Order Functionality
**Time:** 20 minutes | **Status:** Pending

**Prerequisites:** Phase 4.2 complete

**Tasks:**
1. Wire checkout form to API
2. Handle form submission
3. Show loading state during API call
4. Handle success (redirect to confirmation)
5. Handle error (show error message)
6. Clear cart on success
7. Test end-to-end order flow

**Expected Outcome:**
- Can submit order from UI
- Success redirects to confirmation page
- Cart clears after order

**Testing Criteria:**
- Clicking "Place Order" calls API
- Loading spinner shows during submission
- Success redirects to `/confirmation`
- Cart is empty after successful order
- Error message shows if API fails

**Files Modified:**
- `app/checkout/page.tsx`
- `lib/services/orderService.ts` (new file)

---

#### Phase 4.4: Confirmation Page
**Time:** 20 minutes | **Status:** Pending

**Prerequisites:** Phase 4.3 complete

**Tasks:**
1. Create `/app/confirmation/page.tsx`
2. Display order number prominently
3. Show order summary
4. Show estimated wait time (10 minutes)
5. Add "Start New Order" button
6. Optional: Add confetti animation
7. Auto-redirect to home after 30 seconds

**Expected Outcome:**
- Confirmation page displays
- Shows order details clearly
- Can start new order

**Testing Criteria:**
- Order number displays (e.g., "#1001")
- Order details match what was submitted
- "Start New Order" button navigates to home
- Page auto-redirects after 30 seconds

**Files to Create:**
- `app/confirmation/page.tsx`
- `components/Confirmation/OrderConfirmation.tsx`

---

### ⏳ PHASE 5: KLLEON AVATAR INTEGRATION (Week 3)

#### Phase 5.1: Klleon SDK Setup
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 4.4 complete, Klleon API keys obtained

**Tasks:**
1. Verify Klleon script in `app/layout.tsx`
2. Create Klleon initialization utility
3. Add type definitions for Klleon SDK
4. Create avatar container component
5. Initialize Klleon on page load
6. Test avatar loads and displays

**Klleon Initialization:**
```typescript
await KlleonChat.init({
  sdk_key: process.env.NEXT_PUBLIC_KLLEON_SDK_KEY,
  avatar_id: process.env.NEXT_PUBLIC_KLLEON_AVATAR_ID,
  subtitle_code: 'en_us',
  enable_speech_input: true,
  enable_speech_output: true,
});
```

**Expected Outcome:**
- Klleon script loaded
- Avatar initializes successfully
- Avatar visible on screen

**Testing Criteria:**
- Avatar appears in browser
- No console errors related to Klleon
- Klleon status events fire correctly

**Files Created:**
- `lib/klleon/init.ts`
- `components/Avatar/AvatarContainer.tsx`
- `types/klleon.d.ts` (enhanced)

---

#### Phase 5.2: Avatar State Management
**Time:** 20 minutes | **Status:** Pending

**Prerequisites:** Phase 5.1 complete

**Tasks:**
1. Create avatar Zustand store
2. Track loading/ready/error states
3. Handle Klleon status events
4. Create loading skeleton for avatar
5. Create error boundary for avatar failures
6. Test all state transitions

**Avatar States:**
- `loading` - Initializing
- `ready` - Avatar loaded and ready
- `speaking` - Avatar is speaking
- `listening` - Waiting for user input
- `error` - Failed to load

**Expected Outcome:**
- Avatar state tracked globally
- Loading states handled gracefully
- Errors caught and displayed

**Testing Criteria:**
- Loading skeleton shows during initialization
- Ready state activates when avatar loads
- Error state displays if avatar fails
- State updates correctly

**Files to Create:**
- `lib/stores/avatarStore.ts`
- `components/Avatar/AvatarLoadingState.tsx`
- `components/Avatar/AvatarErrorBoundary.tsx`

---

#### Phase 5.3: Avatar Speak Functionality
**Time:** 20 minutes | **Status:** Pending

**Prerequisites:** Phase 5.2 complete

**Tasks:**
1. Create speak utility function
2. Test with simple greeting: "Welcome to McDonald's!"
3. Add speech queue for multiple messages
4. Handle speech interruptions
5. Add subtitle display
6. Test various messages

**Speak Function:**
```typescript
export function speak(text: string) {
  if (window.KlleonChat) {
    window.KlleonChat.speak(text);
  }
}
```

**Expected Outcome:**
- Avatar speaks text with lip sync
- Subtitles display
- Multiple messages queue properly

**Testing Criteria:**
- `speak("Hello")` makes avatar speak
- Lip sync matches audio
- Subtitles display text
- Can queue multiple messages

**Files to Create:**
- `lib/klleon/speak.ts`
- `components/Avatar/Subtitles.tsx`

---

#### Phase 5.4: Avatar Event Listeners
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 5.3 complete

**Tasks:**
1. Set up `onChatEvent` listener for user speech
2. Set up `onStatusEvent` listener
3. Create event handler utilities
4. Log all events for debugging
5. Test with microphone
6. Handle microphone permissions

**Event Listeners:**
```typescript
KlleonChat.onChatEvent((data) => {
  if (data.type === 'user_speech') {
    console.log('User said:', data.text);
    handleUserSpeech(data.text);
  }
});

KlleonChat.onStatusEvent((status) => {
  console.log('Avatar status:', status);
  updateAvatarState(status);
});
```

**Expected Outcome:**
- Can receive user speech as text (STT working)
- Status events tracked
- Mic permissions handled

**Testing Criteria:**
- Speaking into mic triggers `onChatEvent`
- Transcribed text appears in console
- Permission request shows on first use
- Status updates correctly

**Files to Create:**
- `lib/klleon/listeners.ts`
- `components/Avatar/MicPermissionPrompt.tsx`

---

#### Phase 5.5: Basic Conversation Flow
**Time:** 30 minutes | **Status:** Pending

**Prerequisites:** Phase 5.4 complete

**Tasks:**
1. Implement greeting on avatar ready: "Hey! Welcome to McDonald's! What can I get for you?"
2. Echo user speech for testing (temporary)
3. Create conversation history store
4. Display conversation transcript on screen
5. Test back-and-forth conversation
6. Handle silence/timeout (after 30 seconds)

**Expected Outcome:**
- Avatar greets user on load
- User speech displays and echoes back
- Conversation history tracked

**Testing Criteria:**
- Avatar says greeting when ready
- User speech appears in transcript
- Avatar echoes what user said
- Conversation history saved
- Timeout warning after 30s silence

**Files to Create:**
- `lib/stores/conversationStore.ts`
- `components/Conversation/TranscriptDisplay.tsx`

---

### ⏳ PHASE 6: NLP INTEGRATION - GEMINI (Week 3-4)

#### Phase 6.1: Gemini Provider Setup
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 5.5 complete, Gemini API key obtained

**Tasks:**
1. Verify `@google/generative-ai` installed
2. Create Gemini provider class per GEMINI_PROVIDER.md
3. Set up types and interfaces (ParsedOrder, OrderContext, etc.)
4. Create basic test to verify API connection
5. Test Gemini API call
6. Handle API errors gracefully

**Gemini Provider:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  }

  async parseOrder(input: string, context: OrderContext): Promise<ParsedOrder> {
    const model = this.client.getGenerativeModel({
      model: 'gemini-1.5-flash'
    });
    // ... implementation
  }
}
```

**Expected Outcome:**
- Gemini provider functional
- Can make API calls successfully
- Connection verified

**Testing Criteria:**
- Can call Gemini API without errors
- Returns valid response
- Errors handled gracefully (rate limits, etc.)

**Files to Create:**
- `lib/llm/providers/gemini.ts`
- `lib/llm/types.ts`
- `tests/gemini-test.ts` (temporary)

---

#### Phase 6.2: LLM Abstraction Layer
**Time:** 30 minutes | **Status:** Pending

**Prerequisites:** Phase 6.1 complete

**Tasks:**
1. Create LLM service per LLM_ABSTRACTION_LAYER.md
2. Register Gemini provider
3. Implement `parseOrder(text, context)` method
4. Implement `generateResponse(order, context)` method
5. Add fallback logic (pattern matching if Gemini fails)
6. Test provider switching (future-proof)

**LLM Service:**
```typescript
class LLMService {
  private providers = new Map();
  private currentProvider = 'gemini-flash';

  async parseOrder(input: string, context: OrderContext) {
    try {
      return await this.getProvider().parseOrder(input, context);
    } catch (error) {
      return await this.fallbackPatternMatch(input);
    }
  }
}

export const llmService = new LLMService();
```

**Expected Outcome:**
- LLM service acts as single interface
- Can switch providers via config
- Fallback works if primary fails

**Testing Criteria:**
- `llmService.parseOrder()` uses Gemini
- Can parse simple order: "I want a Big Mac"
- Falls back to pattern matching if Gemini fails
- Provider can be changed via env variable

**Files to Create:**
- `lib/llm/llm-service.ts`
- `tests/llm-service.test.ts`

---

#### Phase 6.3: Pattern Matcher (Free Tier)
**Time:** 30 minutes | **Status:** Pending

**Prerequisites:** Phase 6.2 complete

**Tasks:**
1. Verify `compromise` installed
2. Create pattern matcher per NLP_INTEGRATION_CORRECTED.md
3. Implement menu item matching (fuzzy)
4. Extract quantities ("two" → 2, "couple" → 2)
5. Extract sizes ("large", "medium", "small")
6. Extract customizations ("no pickles", "extra cheese")
7. Test with 20+ phrases

**Pattern Matcher:**
```typescript
export function parseSimpleOrder(text: string): ParsedOrder {
  const doc = compromise(text.toLowerCase());

  // Extract quantity
  const numbers = doc.numbers().json();
  const quantity = numbers.length > 0 ? parseInt(numbers[0].text) : 1;

  // Match menu item
  const item = matchMenuItem(text);

  // Extract modifiers
  const size = extractSize(text);
  const customizations = extractCustomizations(text);

  return { items: [{ name: item, quantity, size, customizations }], ... };
}
```

**Expected Outcome:**
- Pattern matcher handles simple orders
- 90%+ accuracy on basic phrases
- Fast (<100ms)

**Testing Criteria:**
- "I want a Big Mac" → parsed correctly
- "Two Big Macs" → quantity = 2
- "Large fries" → size = "large"
- "No pickles" → customizations = ["no pickles"]

**Files to Create:**
- `lib/nlp/pattern-matcher.ts`
- `tests/pattern-matcher.test.ts` (with 20+ test phrases)

---

#### Phase 6.4: Hybrid Order Parser
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 6.3 complete

**Tasks:**
1. Create order parser that tries pattern matching first
2. Check confidence score (if > 0.85, use pattern match)
3. Fall back to Gemini for complex orders (confidence < 0.85)
4. Implement menu item fuzzy matching
5. Handle ambiguity (ask for clarification)
6. Test with 30+ phrases (simple and complex)

**Hybrid Logic:**
```typescript
export async function parseOrder(text: string): Promise<ParsedOrder> {
  // Try pattern matching first (free)
  const simpleResult = parseSimpleOrder(text);

  if (simpleResult.confidence > 0.85) {
    console.log('Using pattern matching (free)');
    return simpleResult;
  }

  // Fall back to Gemini for complex orders
  console.log('Using Gemini API');
  return await parseWithGemini(text);
}
```

**Expected Outcome:**
- Parser uses pattern matching for simple (70% of orders - FREE)
- Uses Gemini for complex (30% of orders - $0.003 each)
- High accuracy overall (>90%)

**Testing Criteria:**
- Simple orders use pattern matching
- Complex orders use Gemini
- Both return same format (ParsedOrder)
- Confidence scores accurate
- Ambiguous orders return clarifications_needed

**Files to Create:**
- `lib/nlp/order-parser.ts`
- `tests/hybrid-parser.test.ts` (30+ test cases)

---

#### Phase 6.5: Response Generator
**Time:** 25 minutes | **Status:** Pending

**Prerequisites:** Phase 6.4 complete

**Tasks:**
1. Create response generator per NLP_INTEGRATION_CORRECTED.md
2. Use templates for simple confirmations (FREE)
3. Use Gemini for complex responses
4. Follow Casey persona from AVATAR_PERSONA.md
5. Keep responses under 20 words
6. Test with various order states

**Response Templates (Simple):**
```typescript
const templates = [
  "Got it! {quantity} {item}. Anything else?",
  "Perfect! {quantity} {item}. What else can I get you?",
  "Great choice! Adding {quantity} {item}. Anything else?"
];
```

**Gemini Response (Complex):**
```typescript
async function generateWithGemini(order: ParsedOrder, context: ConversationContext) {
  const prompt = `You are Casey, a friendly McDonald's assistant.

  Order: ${JSON.stringify(order)}
  Cart: ${JSON.stringify(context.cart)}

  Generate a natural, friendly response (under 20 words).`;

  return await gemini.generateContent(prompt);
}
```

**Expected Outcome:**
- Generates natural, friendly responses
- Sounds like Casey
- Short and efficient (<20 words)

**Testing Criteria:**
- Simple confirmations use templates (FREE)
- Complex responses use Gemini
- All responses < 20 words
- Match Casey's personality (upbeat, efficient, friendly)

**Files to Create:**
- `lib/nlp/response-generator.ts`
- `lib/nlp/response-templates.ts`

---

#### Phase 6.6: Connect NLP to Avatar
**Time:** 30 minutes | **Status:** Pending

**Prerequisites:** Phase 6.5 complete

**Tasks:**
1. Wire user speech event to order parser
2. Parse order using hybrid parser
3. Generate response using response generator
4. Make avatar speak response
5. Update cart if items detected
6. Handle errors gracefully (show menu if unclear)
7. Test end-to-end voice ordering

**Integration Flow:**
```
User speaks: "I want two Big Macs with no pickles"
  ↓
Klleon STT: "I want two Big Macs with no pickles"
  ↓
Order Parser: { items: [{ name: "Big Mac", quantity: 2, customizations: ["no pickles"] }] }
  ↓
Response Generator: "Got it! Two Big Macs with no pickles. Anything else?"
  ↓
Avatar speaks: "Got it! Two Big Macs with no pickles. Anything else?"
  ↓
Cart updated: 2x Big Mac (no pickles)
```

**Expected Outcome:**
- User speaks → Order parsed → Avatar responds → Item added to cart
- Full voice ordering works end-to-end

**Testing Criteria:**
- Say "I want a Big Mac" → Order parses → Avatar confirms → Big Mac added to cart
- Say "Two large fries" → Both items added
- Say "With no pickles" → Customization applied
- Unclear input → Avatar asks for clarification

**Files Modified:**
- `lib/klleon/listeners.ts`
- `components/Avatar/AvatarContainer.tsx`

---

## Quality Gates

Every phase must pass these criteria before moving to the next:

### Code Quality
- [ ] ✅ Zero TypeScript errors
- [ ] ✅ Zero ESLint warnings
- [ ] ✅ Code formatted with Prettier
- [ ] ✅ No `any` types used
- [ ] ✅ All imports work correctly

### Functionality
- [ ] ✅ Feature works as expected
- [ ] ✅ No console errors
- [ ] ✅ Error states handled
- [ ] ✅ Loading states implemented
- [ ] ✅ Edge cases considered

### Testing
- [ ] ✅ Manual testing completed
- [ ] ✅ All test criteria passed
- [ ] ✅ Works on multiple screen sizes
- [ ] ✅ API endpoints tested (if applicable)
- [ ] ✅ Database operations verified (if applicable)

### Documentation
- [ ] ✅ Code commented where needed
- [ ] ✅ Git commit with clear message
- [ ] ✅ README updated (if needed)
- [ ] ✅ Types exported correctly

### User Confirmation
- [ ] ✅ User has reviewed the work
- [ ] ✅ User approves moving to next phase

---

## Risk Mitigation

### If Klleon SDK has issues
- **Fallback:** Text-only interface
- **Alternative:** Use different avatar solution
- **Simplify:** Basic order form without avatar

### If NLP accuracy is low
- **Improve:** Add more training data
- **Fallback:** Pattern matching only
- **Visual:** Make menu more prominent
- **Hybrid:** Combine voice + visual selection

### If performance is slow
- **Optimize:** Bundle size reduction
- **Cache:** Add Redis caching layer
- **CDN:** Use CDN for static assets
- **Simplify:** Reduce avatar quality/features

### If budget is exceeded
- **Free:** Use only pattern matching (no Gemini)
- **Reduce:** Fewer API calls
- **Alternative:** Switch to free LLM tier
- **Simplify:** Remove advanced features

### If timeline slips
- **MVP:** Ship with Phase 1-4 only (click ordering)
- **Defer:** Move voice to Phase 2 release
- **Reduce:** Cut admin dashboard initially
- **Focus:** Core ordering experience first

---

## Success Metrics

### Phase 0-1: Foundation
- Avatar loads successfully: **100%**
- Database working: **Yes**
- Can complete click-based order: **Yes**

### Phase 2-4: Core Features
- Menu loads in <2 seconds: **Yes**
- Can complete order in <90 seconds: **Yes**
- Cart calculations accurate: **100%**

### Phase 5-6: Voice & NLP
- Voice recognition accuracy: **>85%**
- NLP parsing accuracy: **>80%**
- Response time: **<2 seconds**

### Phase 7-8: Advanced Features
- Upsell conversion: **>10%**
- Customization usage: **>30% of orders**
- Voice adoption: **>50% of users try it**

### Phase 9-10: Production
- Payment success rate: **>98%**
- System uptime: **>99%**
- Page load time: **<3 seconds**
- Critical bugs: **Zero**

---

## Cost Estimates

### Monthly Operating Costs (10,000 orders)

| Service | Cost | Notes |
|---------|------|-------|
| **Klleon SDK** | TBD | Contact Klleon for pricing |
| **Google Gemini Flash** | **$3** | 30% of orders use AI = 3k calls |
| **Supabase** | $0-25 | Free tier → $25 Pro if needed |
| **Vercel** | $0-20 | Free tier → $20 Pro if needed |
| **Stripe** | Per transaction | 2.9% + $0.30 per order |
| **TOTAL** | **~$28-48** | **+ Klleon fees** |

### Development Costs

- **Timeline:** 7-8 weeks
- **Hours:** 280-350 hours
- **Rate:** Variable (freelancer vs agency)
- **Estimate:** $14,000 - $35,000 (at $50-100/hr)

---

## Git Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/phase-X-Y` - Feature branches per phase

### Commit Messages
```
Phase X.Y: Brief description

- Detailed change 1
- Detailed change 2
- Testing performed
```

### Example Commits
```
Phase 0.1: Initial project setup with Next.js 14

Phase 1.2: Database schema - Core tables created

Phase 2.3: Menu display component with responsive grid

Phase 6.4: Hybrid order parser with 90%+ accuracy
```

---

## Current Status

**Last Updated:** 2025-11-11

### Completed Phases ✅
- ✅ Phase 0.1: Project Initialization (20 min)
- ✅ Phase 0.2: TypeScript Configuration (15 min)
- ✅ Phase 0.3: Tailwind & UI Setup (20 min)

### In Progress 🔄
- ⏳ Phase 1.1: Supabase Project Setup (Next)

### Remaining Phases ⏳
- Phase 1.2 through Phase 10.3 (see detailed breakdown above)

### Total Progress
**Foundation:** 100% ✅
**Database:** 0%
**Menu System:** 0%
**Cart:** 0%
**Avatar & NLP:** 0%
**Advanced Features:** 0%
**Polish & Deploy:** 0%
**OVERALL:** ~15%

---

## Next Steps

1. **Set up Supabase project** (Phase 1.1)
2. **Create database schema** (Phase 1.2)
3. **Seed menu data** (Phase 1.3)
4. **Set up Prisma** (Phase 1.5)
5. **Build Menu API** (Phase 2)

---

## Contact & Resources

### Documentation
- Project docs in `/Documentation` folder
- Tech stack: `TECH_STACK_CORRECTED.md`
- Database schema: `DATABASE_SCHEMA.md`
- API spec: `API_SPECIFICATION.md`

### External Resources
- **Klleon:** https://studio.klleon.io/
- **Gemini:** https://makersuite.google.com/
- **Supabase:** https://supabase.com/
- **Vercel:** https://vercel.com/

---

**Document Version:** 1.0
**Status:** Active Development
**Next Review:** After Phase 1 complete
