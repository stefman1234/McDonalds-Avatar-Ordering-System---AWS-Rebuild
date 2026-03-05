# McDonald's Avatar Ordering System - AWS Rebuild Plan

**Version:** 2.0
**Date:** 2025-03-05
**Target:** Full AWS deployment, cost & performance optimized
**Display:** 1920x1080 kiosk (portrait mode)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [AWS Services & Justification](#2-aws-services--justification)
3. [Current Feature Inventory](#3-current-feature-inventory)
4. [Klleon Avatar Integration (Full)](#4-klleon-avatar-integration-full)
5. [Database Design](#5-database-design)
6. [API Routes & Endpoints](#6-api-routes--endpoints)
7. [NLP & Order Processing](#7-nlp--order-processing)
8. [Performance Optimization Strategy](#8-performance-optimization-strategy)
9. [Frontend Architecture](#9-frontend-architecture)
10. [Component Inventory](#10-component-inventory)
11. [State Management](#11-state-management)
12. [Mock Payment System](#12-mock-payment-system)
13. [Planned Features (Full Scope)](#13-planned-features-full-scope)
14. [Environment Variables](#14-environment-variables)
15. [Deployment Pipeline](#15-deployment-pipeline)
16. [Cost Estimate](#16-cost-estimate)
17. [Build Phases & Timeline](#17-build-phases--timeline)
18. [Ports & Networking](#18-ports--networking)

---

## 1. Architecture Overview

### Why NOT FastAPI

The current NLP processing is a simple OpenAI API call — there's no heavy ML,
no custom model inference, no Python-specific processing. Adding a FastAPI
backend would:
- Double deployment complexity (2 services, 2 containers, 2 sets of logs)
- Add cross-service network latency (~5-20ms per hop)
- Require CORS configuration
- Increase attack surface
- Cost more (two running services vs one)

Next.js API routes handle everything in a single deployment. The bottleneck
is OpenAI's API latency (500ms-2s), not our server processing time.

### Architecture Diagram

```
                        ┌─────────────────┐
                        │   CloudFront    │
                        │   (CDN + SSL)   │
                        │   Port 443      │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  ECS Fargate    │
                        │  (Next.js 15)   │
                        │  Port 3000      │
                        │                 │
                        │  ┌───────────┐  │
                        │  │ API Routes│  │
                        │  │ /api/*    │  │
                        │  └─────┬─────┘  │
                        │        │        │
                        └────┬───┼───┬────┘
                             │   │   │
                    ┌────────┘   │   └────────┐
                    │            │            │
           ┌────────▼───┐ ┌─────▼─────┐ ┌────▼────────┐
           │  RDS Proxy │ │  OpenAI   │ │  DynamoDB   │
           │     ↓      │ │ GPT-4o-   │ │  (Sessions  │
           │  Aurora     │ │  mini     │ │   + Cache)  │
           │ Serverless  │ │  (NLP)    │ │             │
           │  v2 (PG)   │ │           │ │             │
           │  Port 5432 │ │           │ │             │
           └────────────┘ └───────────┘ └─────────────┘

External (frontend loaded in browser):
           ┌─────────────────────────────────┐
           │  Klleon SDK v1.2.0 (CDN)        │
           │  - Avatar rendering             │
           │  - TTS (Text-to-Speech)         │
           │  - STT (Speech-to-Text)         │
           │  - Lip sync                     │
           │  wss://klleon servers           │
           └─────────────────────────────────┘
```

### Why This Architecture

| Decision | Reason |
|----------|--------|
| **ECS Fargate** over Lambda | No cold starts (critical for kiosk — must respond instantly). Fargate Spot is 70% cheaper than on-demand. Lambda cold starts of 1-3s are unacceptable for a kiosk. |
| **ECS Fargate** over Amplify | Amplify uses Lambda@Edge under the hood for SSR — same cold start problem. Fargate gives us a warm, always-on server. |
| **Aurora Serverless v2** over RDS | Scales to 0.5 ACU when idle (~$43/month minimum). Regular RDS minimum is db.t3.micro at ~$15/month but no auto-scaling. Aurora is better for variable kiosk traffic (busy lunch, dead overnight). |
| **RDS Proxy** over direct connection | Connection pooling. Next.js API routes open a new connection per request. Without RDS Proxy, you'll exhaust Aurora's connection limit (45 for 0.5 ACU). RDS Proxy pools connections and reuses them. |
| **DynamoDB** for sessions/cache | Sub-10ms reads. Menu cache and session state don't need relational queries. DynamoDB on-demand pricing = pay per read/write, ~$0 when idle. |
| **CloudFront** | SSL termination, static asset caching, DDoS protection. Free tier covers 1TB/month. |
| **No separate backend** | Single deployment, single codebase, zero cross-service latency. |

---

## 2. AWS Services & Justification

### Compute
| Service | Purpose | Config |
|---------|---------|--------|
| **ECS Fargate (Spot)** | Run Next.js app | 0.5 vCPU, 1GB RAM, 1 task |
| **ECR** | Docker image registry | Store Next.js container image |

### Database
| Service | Purpose | Config |
|---------|---------|--------|
| **Aurora Serverless v2** | PostgreSQL database (menu, orders, combos, customizations) | 0.5-2 ACU, PostgreSQL 15 |
| **RDS Proxy** | Connection pooling for Aurora | Max 45 connections |
| **DynamoDB** | Session state + menu cache | On-demand capacity |

### Networking & CDN
| Service | Purpose | Config |
|---------|---------|--------|
| **CloudFront** | CDN, SSL, static assets | Default cache behaviors |
| **VPC** | Private networking | 2 AZs, public + private subnets |
| **ALB** | Load balancer for Fargate | Port 80/443 → 3000 |

### Security
| Service | Purpose | Config |
|---------|---------|--------|
| **Secrets Manager** | Store API keys (OpenAI, Klleon) | 3-4 secrets |
| **IAM** | Service roles | Least-privilege policies |
| **ACM** | SSL certificate | Free with CloudFront |

### CI/CD
| Service | Purpose | Config |
|---------|---------|--------|
| **CodePipeline** | Build & deploy pipeline | GitHub → Build → Deploy |
| **CodeBuild** | Docker image builds | arm64 for cheaper Fargate |

### Monitoring
| Service | Purpose | Config |
|---------|---------|--------|
| **CloudWatch** | Logs, metrics, alarms | Basic monitoring |

---

## 3. Current Feature Inventory

### Implemented (in GitHub repo)

#### Core Ordering
- [x] Idle screen with "Start Order" button and ad background
- [x] Theater mode layout (65% avatar / 35% menu carousel)
- [x] Voice ordering via speech-to-text → NLP → cart
- [x] Visual ordering via menu carousel tap-to-add
- [x] Category filtering (All, Burgers, Chicken, Sides, Drinks, Desserts, Happy Meal)
- [x] "Your Order" tab showing cart items
- [x] Menu item customization modal (sizes, toppings, meal options, special instructions)
- [x] Full customization flow: meal type → size → side → drink → ice level → toppings
- [x] Cart with add/remove/update quantity/clear
- [x] Cart persistence (localStorage)
- [x] Cart drawer (slide from right)
- [x] Checkout page with order type (dine in / takeout)
- [x] Order confirmation page with order number and estimated time
- [x] 30-second inactivity timeout (reset kiosk)

#### Avatar & Voice
- [x] Klleon SDK v1.2.0 integration (avatar rendering + TTS)
- [x] Browser Web Speech API for STT (current — will change to Klleon STT in rebuild)
- [x] Avatar greeting on load: "Hey! Welcome to McDonald's! I'm Casey..."
- [x] Avatar speaks order confirmations via echo()
- [x] Chat message bubbles (user = yellow, Casey = white)
- [x] Microphone button (tap to speak, pulsing animation when listening)
- [x] Conversation memory (last 10 messages in UI, last 5 sent to NLP)

#### NLP & Intelligence
- [x] GPT-4o-mini order parsing with structured JSON output
- [x] Intent recognition: order, modify, remove, checkout, unclear, meal_response
- [x] Quantity extraction ("two Big Macs", "6 piece")
- [x] Size extraction (small, medium, large)
- [x] Customization extraction ("no pickles", "extra cheese")
- [x] Malaysian/Malay language understanding ("ayam", "ais krim", "kentang")
- [x] Misspelling handling ("borgir" → burger, "chiken" → chicken)
- [x] Conversation context awareness (references previous messages)
- [x] Fuse.js fuzzy matching fallback (5-stage: exact → close → category → loose → popular)
- [x] Menu filtering by voice search results (FilterBanner)

#### Meal Ordering Logic
- [x] Meal detection (keywords: "meal", "combo", "with fries and drink")
- [x] Multi-step meal customization state machine (size → side → drink → ice → complete)
- [x] PendingOrderManager for tracking multi-item ordering state
- [x] Meal conversion offers ("Would you like to make that a meal?")
- [x] Smart meal conversion acceptance parsing
- [x] Multiple item ordering in single utterance
- [x] Sequential meal customization for multiple meals
- [x] MealQuestionGenerator with randomized templates

#### Database
- [x] 50+ menu items across 7 categories
- [x] 120+ customization options (remove, add, modify, substitute)
- [x] 21 combo meals with JSONB includes
- [x] Size variants with price/calorie modifiers
- [x] Tags and search_terms for fuzzy matching
- [x] Order creation with auto-incrementing order numbers
- [x] Conversation sessions tracking

#### UI
- [x] McDonald's branding (Red #DA291C, Yellow #FFC72C)
- [x] Horizontal scroll carousel with momentum physics
- [x] Drag-to-scroll with velocity tracking
- [x] Category tabs with emoji icons
- [x] Menu cards with badges (Popular, Vegetarian, Gluten-Free)
- [x] Loading states, error states, empty states
- [x] Debug panel (F8)
- [x] Responsive card layouts
- [x] Full-screen browse mode (/menu page)

### NOT Yet Implemented (planned — include in rebuild)

See [Section 13: Planned Features](#13-planned-features-full-scope).

---

## 4. Klleon Avatar Integration (Full)

### Change from Current: Full Klleon STT

The current app disables Klleon's microphone (`enable_microphone: false`) and
uses a custom BrowserSTT class to avoid triggering Klleon's built-in LLM.

**In the rebuild, we will use Klleon for EVERYTHING:**
- Avatar rendering + lip sync
- TTS (Text-to-Speech) via `echo()`
- STT (Speech-to-Text) via Klleon's native microphone

**Challenge:** Klleon's STT feeds into their built-in LLM by default.
We need to intercept the STT result BEFORE it reaches Klleon's LLM
and route it to our own OpenAI GPT-4o-mini pipeline instead.

**Strategy:**
1. Enable microphone: `enable_microphone: true`
2. Listen for `onChatEvent` with `chat_type === 'STT_RESULT'`
3. When we receive the transcribed text, immediately call our NLP pipeline
4. Use `echo()` to make the avatar speak our custom response (bypasses Klleon LLM)
5. If Klleon's LLM generates a response too, ignore it (or suppress it)

### SDK Loading

```html
<!-- In app/layout.tsx <head> -->
<Script
  src="https://web.sdk.klleon.io/1.2.0/klleon-chat.umd.js"
  strategy="beforeInteractive"
/>
```

- **URL:** `https://web.sdk.klleon.io/1.2.0/klleon-chat.umd.js`
- **Version:** 1.2.0
- **Loading strategy:** `beforeInteractive` (must load before page JS)
- **Global object:** `window.KlleonChat`

### Initialization Options

```typescript
const options = {
  sdk_key: process.env.NEXT_PUBLIC_KLLEON_SDK_KEY,    // Required
  avatar_id: process.env.NEXT_PUBLIC_KLLEON_AVATAR_ID, // Required
  log_level: 'info',            // 'info' in dev, 'silent' in prod
  enable_microphone: true,      // CHANGED: Enable Klleon STT
  voice_code: 'en_us',          // English TTS voice
  subtitle_code: 'en_us',       // English subtitles
  voice_tts_speech_speed: 1.0,  // Normal speed (0.5-2.0)
};
```

### Initialization Sequence (CRITICAL ORDER)

```
1. Wait for window.KlleonChat to exist (poll every 100ms, timeout 10s)
2. Register onStatusEvent handler FIRST
3. Register onChatEvent handler SECOND
4. Call KlleonChat.init(options)
5. Wait for VIDEO_CAN_PLAY status event
6. Set avatar videoStyle and volume via ref
7. Speak greeting via echo()
```

### SDK Methods Used

| Method | Purpose | Notes |
|--------|---------|-------|
| `init(options)` | Initialize SDK | Call once, SDK prevents duplicates internally |
| `echo(text)` | TTS only — avatar speaks without LLM | Our primary output method |
| `stopSpeech()` | Stop current speech | Used when user interrupts |
| `onChatEvent(cb)` | Listen for chat events (STT results, etc.) | Re-registering replaces previous handler |
| `onStatusEvent(cb)` | Listen for status changes | Fires VIDEO_CAN_PLAY when ready |
| `destroy()` | Cleanup on unmount | Frees WebSocket, WebRTC, listeners |

### Methods NOT Used

| Method | Why Not |
|--------|---------|
| `sendTextMessage(text)` | Would trigger Klleon's LLM — we use our own |
| `startStt()` / `endStt()` | Using enable_microphone instead (always-on) |
| `startAudioEcho(audio)` | Not needed — we use text-based echo() |
| `changeAvatar(option)` | Single avatar per kiosk |

### Status Event Flow

```
init() called
  → IDLE
  → CONNECTING
  → SOCKET_CONNECTED
  → STREAMING_CONNECTED
  → VIDEO_LOAD
  → VIDEO_CAN_PLAY  ← SDK methods now usable, trigger greeting
```

Error statuses: `CONNECTING_FAILED`, `SOCKET_FAILED`, `STREAMING_FAILED`

### Chat Event Types (ResponseChatType)

| Type | Meaning | Our Action |
|------|---------|------------|
| `STT_RESULT` | User speech transcribed | Send to our NLP pipeline |
| `TEXT` | Avatar/user message | Log for debugging |
| `RESPONSE_IS_ENDED` | Avatar finished speaking | Re-enable listening |
| `PREPARING_RESPONSE` | Klleon LLM preparing (ignore) | Suppress — we use our own LLM |
| `RESPONSE_OK` | Klleon LLM responded (ignore) | Suppress |
| `USER_SPEECH_STARTED` | User started speaking | Update UI (listening indicator) |
| `USER_SPEECH_STOPPED` | User stopped speaking | Update UI |
| `ERROR` | General error | Log + show error state |
| `DISABLED_TIME_OUT` | Session timeout | Reset kiosk |

### Avatar DOM Element

```tsx
<avatar-container
  ref={avatarRef}
  className="w-full h-full"
  style={{ zIndex: 10 }}
/>
```

- Custom web component registered by Klleon SDK
- Must declare in TypeScript: `JSX.IntrinsicElements['avatar-container']`
- Properties set via ref (NOT JSX props):

```typescript
avatarRef.current.videoStyle = {
  borderRadius: '0px',
  objectFit: 'contain',
  width: '100%',
  height: '100%',
  maxWidth: '100%',
  maxHeight: '100%',
  transform: 'scale(0.85)',
};
avatarRef.current.volume = 100;
```

### STT → NLP Flow (Rebuild)

```
User speaks into kiosk microphone
  → Klleon SDK processes audio (STT)
  → onChatEvent fires with chat_type: 'STT_RESULT'
  → Extract transcribed text from event
  → Call our processOrder(text) function
  → POST /api/nlp/parse-order { userText, conversationHistory }
  → GPT-4o-mini parses order
  → Response returned to frontend
  → Items added to cart (Zustand store)
  → Avatar speaks confirmation via echo(response)
```

### Klleon Costs

Klleon pricing is per-session/per-minute. Contact Klleon for exact pricing.
Estimated: $0.01-0.05 per minute of avatar interaction.
At ~2 min average per order, 10,000 orders/month = ~$200-1,000/month.

---

## 5. Database Design

### PostgreSQL (Aurora Serverless v2)

Relational data that needs ACID transactions, JOINs, and complex queries.

#### Tables (same schema as current, optimized)

##### menu_items
```sql
CREATE TABLE menu_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  category        VARCHAR(50) NOT NULL,      -- burger, chicken, sides, drinks, desserts, happy_meal, breakfast
  subcategory     VARCHAR(50),
  description     TEXT,
  base_price      DECIMAL(5,2) NOT NULL,
  image_url       VARCHAR(255),
  calories        INT,
  available       BOOLEAN DEFAULT true,
  vegetarian      BOOLEAN DEFAULT false,
  gluten_free     BOOLEAN DEFAULT false,
  time_restriction VARCHAR(20),              -- breakfast, lunch, all_day
  popular         BOOLEAN DEFAULT false,
  tags            TEXT[],                     -- For fuzzy search
  search_terms    TEXT[],                     -- For fuzzy search
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes for query patterns
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(available);
CREATE INDEX idx_menu_items_time ON menu_items(time_restriction);
CREATE INDEX idx_menu_items_popular ON menu_items(popular);
CREATE INDEX idx_menu_items_tags ON menu_items USING GIN(tags);
```

##### menu_item_sizes
```sql
CREATE TABLE menu_item_sizes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id    UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  size_name       VARCHAR(20) NOT NULL,       -- Small, Medium, Large
  price_modifier  DECIMAL(5,2) DEFAULT 0.00,
  calories_modifier INT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_sizes_item ON menu_item_sizes(menu_item_id);
```

##### customization_options
```sql
CREATE TABLE customization_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,      -- "No Pickles", "Extra Cheese"
  category        VARCHAR(50) NOT NULL,       -- remove, add, modify, substitute
  price_modifier  DECIMAL(5,2) DEFAULT 0.00,
  applicable_to   VARCHAR(100),               -- JSON array: ['burgers', 'chicken']
  created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_customizations_category ON customization_options(category);
```

##### combo_meals
```sql
CREATE TABLE combo_meals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  base_price      DECIMAL(5,2) NOT NULL,
  discount_amount DECIMAL(5,2) DEFAULT 0.00,
  includes        JSONB NOT NULL,             -- {main, side, drink, drink_size}
  image_url       VARCHAR(255),
  popular         BOOLEAN DEFAULT false,
  available       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_combo_popular ON combo_meals(popular);
CREATE INDEX idx_combo_available ON combo_meals(available);
```

##### orders
```sql
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    VARCHAR(20) UNIQUE NOT NULL, -- #1001, #1002, ...
  customer_name   VARCHAR(100),
  order_type      VARCHAR(20) NOT NULL,        -- dine_in, takeout
  status          VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, preparing, ready, completed
  subtotal        DECIMAL(8,2) NOT NULL,
  tax             DECIMAL(8,2) NOT NULL,
  total           DECIMAL(8,2) NOT NULL,
  payment_method  VARCHAR(50),                 -- cash, card, mobile_pay (mock)
  payment_status  VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  session_id      VARCHAR(100),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_orders_number ON orders(order_number);
```

##### order_items
```sql
CREATE TABLE order_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id         UUID REFERENCES menu_items(id),
  combo_meal_id        UUID REFERENCES combo_meals(id),
  quantity             INT DEFAULT 1,
  size                 VARCHAR(20),
  unit_price           DECIMAL(5,2) NOT NULL,
  line_total           DECIMAL(6,2) NOT NULL,
  customizations       JSONB,
  special_instructions TEXT,
  created_at           TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu ON order_items(menu_item_id);
```

#### Seed Data Summary
- **50+ menu items**: 6 burgers, 5 chicken sandwiches, 4 nuggets, 12 breakfast, 2 sides, 15 drinks, 7 desserts, 3 happy meals
- **120+ customization options**: remove (free), add ($0-2), modify (free), substitute ($0-1.50), sauce packets (free)
- **21 combo meals**: burger combos, chicken combos, breakfast combos, value deals
- **10+ size variants**: fries, drinks, coffee with Small/Medium/Large pricing

### DynamoDB (Sessions & Cache)

Fast key-value lookups that don't need relational queries.

##### Table: kiosk-sessions
```
Partition Key: sessionId (String)
Attributes:
  - status: String (active, completed, abandoned)
  - conversationHistory: List (last 10 messages)
  - currentStep: String (greeting, ordering, customizing, confirming)
  - contextData: Map (pending order state, preferences)
  - orderId: String (linked order UUID)
  - startedAt: Number (epoch ms)
  - lastActivityAt: Number (epoch ms)
  - ttl: Number (epoch seconds, auto-delete after 1 hour)

TTL: Enabled — auto-deletes sessions after 1 hour (cost = $0)
```

##### Table: menu-cache
```
Partition Key: cacheKey (String) — e.g., "menu_all", "menu_burgers"
Attributes:
  - data: String (JSON serialized menu items)
  - cachedAt: Number (epoch ms)
  - ttl: Number (epoch seconds, 5-minute expiry)

TTL: Enabled — auto-refreshes every 5 minutes
```

**Why DynamoDB for sessions instead of PostgreSQL:**
- Sub-10ms reads vs 30-100ms for Aurora
- On-demand pricing = pay per read/write = ~$0/month at kiosk scale
- TTL auto-cleanup = no cron jobs needed
- Session data is non-relational (just key-value blobs)

**DynamoDB Cost Note:** DynamoDB is a native AWS service (not external).
On-demand pricing: $1.25/million writes, $0.25/million reads. A single kiosk
doing ~500 orders/day would cost < $0.10/month. Free tier includes 25GB
storage + 25 WCU + 25 RCU permanently — our usage likely stays within free
tier entirely.

---

## 6. API Routes & Endpoints

All routes run inside Next.js on ECS Fargate, port 3000.

### Menu APIs

| Method | Route | Purpose | Cache |
|--------|-------|---------|-------|
| GET | `/api/menu` | All menu items (filterable) | DynamoDB 5min |
| GET | `/api/menu/[id]` | Single item + sizes + customizations | DynamoDB 5min |
| GET | `/api/combos` | All combo meals | DynamoDB 5min |
| GET | `/api/combos/[id]` | Single combo | DynamoDB 5min |

**Query parameters for /api/menu:**
- `?category=burger` — filter by category
- `?available=true` — filter by availability
- `?popular=true` — filter popular items
- `?time=breakfast` — filter by time restriction

**Caching strategy:**
```
Request → Check DynamoDB cache (< 5ms)
  → Cache hit? Return cached data
  → Cache miss? Query Aurora → Store in DynamoDB → Return
```

### NLP API

| Method | Route | Purpose | Cache |
|--------|-------|---------|-------|
| POST | `/api/nlp/parse-order` | Process voice order | No cache |

**Request:**
```json
{
  "userText": "I want a Big Mac meal",
  "conversationHistory": [
    { "id": "msg-1", "text": "Welcome!", "sender": "avatar", "timestamp": "..." }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "intent": "order",
    "items": [{
      "menuItemId": "uuid",
      "name": "Big Mac",
      "basePrice": 5.99,
      "quantity": 1,
      "confidence": 1.0,
      "isMeal": true,
      "mealDetails": { "size": null, "side": null, "drink": null, "iceLevel": null }
    }],
    "response": "Great choice! Would you like your Big Mac meal medium or large?",
    "mealResponse": null
  }
}
```

### Order APIs

| Method | Route | Purpose | Cache |
|--------|-------|---------|-------|
| POST | `/api/order` | Create order | No cache |
| GET | `/api/order/[id]` | Get order details | No cache |

### Session APIs (new — DynamoDB backed)

| Method | Route | Purpose | Cache |
|--------|-------|---------|-------|
| POST | `/api/session` | Create session | N/A |
| GET | `/api/session/[id]` | Get session | N/A |
| PUT | `/api/session/[id]` | Update session | N/A |

### Mock Payment API (new)

| Method | Route | Purpose | Cache |
|--------|-------|---------|-------|
| POST | `/api/payment/process` | Simulate payment | No cache |
| GET | `/api/payment/[id]` | Get payment status | No cache |

### Health Check

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health` | ALB health check (returns 200) |

---

## 7. NLP & Order Processing

### LLM: OpenAI GPT-4o-mini

**Config:**
- Model: `gpt-4o-mini`
- Temperature: 0.3 (low randomness for consistent parsing)
- Response format: JSON object
- Max tokens: ~500 per response

**Prompt structure:**
1. System context: "You are Casey, a friendly McDonald's ordering assistant in Malaysia"
2. Available menu items list (from cache — NOT from DB per request)
3. Conversation history (last 5 messages)
4. Customer's latest speech
5. JSON output format specification
6. 14 rules including meal detection, Malaysian terms, misspellings

**Intents recognized:**
- `order` — add items to cart
- `modify` — change existing items
- `remove` — delete items from cart
- `checkout` — ready to pay
- `unclear` — need clarification
- `meal_response` — answering meal customization question

### Fuzzy Matching Fallback (Fuse.js)

When NLP returns unclear/low confidence:

```
1. Exact match (case-insensitive)
2. Close fuzzy match (threshold 0.3) — keys: name, tags, search_terms, subcategory
3. Category detection — keyword → category mapping
4. Loose fuzzy match (threshold 0.6) — keys: name, description, category
5. Popular items fallback
```

### Optimization: Menu Preloading

**Current problem:** Every NLP request queries the database for the full menu.
This adds 30-100ms per voice order.

**Solution:** Cache menu in DynamoDB with 5-minute TTL.

```
App boot → Fetch all menu items → Store in DynamoDB cache
NLP request → Read from DynamoDB cache (< 5ms) → Send to OpenAI
```

### Optimization: OpenAI Streaming + Buffered Echo

**Current problem:** Avatar waits for full OpenAI response before speaking.
This adds 500-2000ms of silence.

**Important:** Klleon's `echo()` does NOT support streaming — it requires the
complete text string before generating TTS audio. We cannot send partial text.

**Solution:** Stream OpenAI response server-side to reduce wait time, buffer
the complete response, then send to `echo()` all at once. Show a "thinking"
animation during processing to reduce perceived latency.

```
User speaks → STT → Send to OpenAI (stream: true)
  → Server buffers streamed tokens (~200ms for first, ~800ms for all)
  → Full response ready ~30-40% faster than non-streaming
  → Parse JSON → Send complete text to echo()
  → Avatar speaks with full response
```

**Implementation:**
```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...],
  stream: true,
  response_format: { type: 'json_object' },
});

// Buffer streamed JSON server-side, parse when complete
let buffer = '';
for await (const chunk of stream) {
  buffer += chunk.choices[0]?.delta?.content || '';
}
const result = JSON.parse(buffer);
// result.response is sent to Klleon echo() as complete string
```

**Why streaming still helps even without Klleon streaming support:**
- OpenAI streaming returns first tokens faster (~200ms vs ~1s for full response)
- Total response arrives ~30-40% faster with streaming enabled
- Server can start JSON parsing preparation while tokens arrive
- Combined with "thinking" animation, perceived wait drops significantly

---

## 8. Performance Optimization Strategy

### 1. Menu Cache (DynamoDB)

```
Cold path:  Browser → Next.js API → Aurora query (50-100ms) → Response
Hot path:   Browser → Next.js API → DynamoDB cache (3-8ms) → Response
```

- Cache all menu items on first request
- TTL: 5 minutes (menu barely changes)
- Cache keys: `menu_all`, `menu_burger`, `menu_chicken`, etc.
- Invalidation: TTL-based (no manual invalidation needed)
- Cost: ~$0.00 at kiosk scale (< 1000 reads/day)

### 2. Connection Pooling (RDS Proxy)

```
Without proxy: Each API request → New TCP connection → Aurora (100ms handshake)
With proxy:    Each API request → Reuse pooled connection → Aurora (< 5ms)
```

- Max 45 connections for 0.5 ACU Aurora
- RDS Proxy maintains warm pool
- Eliminates connection exhaustion under load

### 3. Preloading on Kiosk Boot

When `/order` page loads, fire ALL initialization in parallel:

```typescript
await Promise.all([
  prefetchMenu(),           // Cache menu in DynamoDB + component state
  initializeKlleon(),       // Load avatar (2-5 seconds)
  warmOpenAI(),             // Send a tiny request to warm the connection
]);
```

### 4. In-Memory Server Cache

For data that's accessed on every single NLP request:

```typescript
// In-memory cache (lives in Fargate container memory)
let menuCache: MenuItem[] | null = null;
let menuCacheExpiry = 0;

async function getMenuItems(): Promise<MenuItem[]> {
  if (menuCache && Date.now() < menuCacheExpiry) {
    return menuCache; // 0ms — already in memory
  }
  // Fetch from DynamoDB cache or Aurora
  menuCache = await fetchFromSource();
  menuCacheExpiry = Date.now() + 5 * 60 * 1000; // 5 min
  return menuCache;
}
```

### 5. Minimize OpenAI Token Usage

**Current prompt sends the FULL menu** (50+ items with IDs and prices) on
every single voice request. This wastes tokens and adds latency.

**Optimization: Compressed menu format**

```
Before (current):
- Big Mac (ID: 3fa85f64-5717-4562-b3fc-2c963f66afa6, Price: $5.99)
- Quarter Pounder with Cheese (ID: 7c9e6679-7425-40de-944b-e07fc1f90ae7, Price: $6.49)
... (50+ lines)

After (optimized):
MENU: Big Mac $5.99 | QP Cheese $6.49 | Dbl QP $8.49 | McDouble $3.49 | ...
(single line, ~200 tokens vs ~800 tokens)
```

Send full IDs in a lookup table and have GPT return just the name.
Match names to IDs on the server side (zero cost, zero latency).

**Token savings: ~60% per request = ~60% cost savings on OpenAI.**

### 6. Static Asset Optimization

- **CloudFront**: Cache all static assets (JS, CSS, images) at edge
- **Next.js Image Optimization**: WebP format, lazy loading
- **Bundle Size**: Tree-shake unused Radix UI components
- **Font**: Preload Inter font via `next/font/google`

### 7. Database Query Optimization

- **Menu queries**: Always include sizes as nested relation in a single query
- **Customization queries**: Filter by category in WHERE clause, not in JS
- **Order creation**: Use database transaction for order + order_items
- **Indexes**: Already optimized — category, available, popular, time_restriction

### Latency Budget (Target)

| Operation | Current | Target | How |
|-----------|---------|--------|-----|
| Menu fetch | 50-100ms | < 10ms | DynamoDB cache |
| NLP (OpenAI) | 500-2000ms | 300-1500ms | Compressed prompt, streaming |
| DB connection | 100ms first, 5ms reuse | < 5ms always | RDS Proxy |
| Avatar init | 2-5s | 2-5s | Cannot optimize (Klleon) |
| Static assets | 200-500ms | < 50ms | CloudFront CDN |
| **Total order** | **~3-5s** | **~1-3s** | All combined |

---

## 9. Frontend Architecture

### Framework
- **Next.js 15** (App Router)
- **React 18** (functional components only)
- **TypeScript 5.3** (strict mode)
- **Tailwind CSS 3.4** (utility-first)

### Pages

| Route | Purpose | SSR/CSR |
|-------|---------|---------|
| `/` | Idle screen (ad + Start Order button) | CSR |
| `/order` | Theater mode (avatar + menu carousel) | CSR |
| `/menu` | Full grid browse mode (fallback) | CSR |
| `/checkout` | Order review + payment | CSR |
| `/confirmation` | Order confirmation + receipt | CSR |

All pages are client-rendered (`'use client'`) because they depend on
browser APIs (Klleon SDK, localStorage, Web Audio).

### Layout Structure (Theater Mode - /order)

```
┌─────────────────────────────────────────┐
│  Header (sticky, z-9999)                │  ~48px
│  [Logo] [McDonald's - Order with Casey] │
│  [Browse Menu →] [Cart (3)]             │
├─────────────────────────────────────────┤
│                                         │
│         Avatar Zone (flex-1)            │  ~65%
│    bg-gradient: mcd-red → mcd-dark-red  │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  <avatar-container> (z-10)      │   │
│  │  Chat Messages overlay (z-30)   │   │
│  │  Mic button (z-50, bottom-4)    │   │
│  │  Loading/Error overlay (z-20)   │   │
│  └──────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤  border-t-4 border-mcd-yellow
│  Category Tabs (horizontal scroll)      │  ~40px
│  [All][Burgers][Chicken][Sides]...      │
├─────────────────────────────────────────┤
│                                         │
│  Menu Carousel / Your Order             │  35vh (min 300px)
│  (horizontal scroll, snap, momentum)    │
│                                         │
└─────────────────────────────────────────┘
```

### Z-Index Stack

| Layer | Z-Index | Element |
|-------|---------|---------|
| Header | 9999 | Sticky navigation |
| Microphone button | 50 | Bottom-center of avatar zone |
| Chat messages | 30 | Overlays avatar |
| Loading/Error overlay | 20 | Covers avatar during init |
| Avatar | 10 | Base rendering layer |
| Cart Drawer | 50 + backdrop 40 | Slides from right |
| Debug Panel | 9999 | Full-screen overlay |
| Customization Modal | 40 (Radix) | Centered dialog |

### McDonald's Branding

```css
:root {
  --mcd-red: #DA291C;
  --mcd-yellow: #FFC72C;
  --mcd-dark-red: #C41E3A;
  --mcd-light-yellow: #FFD700;
}
```

```javascript
// tailwind.config.ts
colors: {
  mcd: {
    red: '#DA291C',
    yellow: '#FFC72C',
    'dark-red': '#C41E3A',
    'light-yellow': '#FFD700',
  }
}
```

### Component Classes

```css
.btn-primary    → bg-mcd-red text-white hover:bg-mcd-dark-red active:scale-95
.btn-secondary  → bg-mcd-yellow text-black hover:bg-mcd-light-yellow
.btn-outline    → border-2 border-mcd-red text-mcd-red hover:bg-mcd-red hover:text-white
.card           → bg-white rounded-xl shadow-lg p-6 border border-gray-100
.card-hover     → card + hover:shadow-xl hover:-translate-y-1
.input          → w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-mcd-red
```

---

## 10. Component Inventory

### Avatar Components
| Component | File | Purpose |
|-----------|------|---------|
| AvatarContainer | `components/Avatar/AvatarContainer.tsx` | Main orchestrator: Klleon init, STT, NLP, cart integration, greeting, error handling |
| ChatMessages | `components/Avatar/ChatMessages.tsx` | Chat bubble display (user=yellow, Casey=white), auto-scroll |

### Menu Components
| Component | File | Purpose |
|-----------|------|---------|
| MenuCarousel | `components/Menu/MenuCarousel.tsx` | Horizontal scroll with momentum physics, 240px cards, drag-to-scroll |
| MenuCard | `components/Menu/MenuCard.tsx` | Item card with emoji, badges, price, Add/Customize buttons |
| CategoryTabs | `components/Menu/CategoryTabs.tsx` | 8 tabs: All, Burgers, Chicken, Sides, Drinks, Desserts, Happy Meal, Your Order |
| CustomizationModal | `components/Menu/CustomizationModal.tsx` | 5-step flow: meal type → size → side → drink+ice → toppings |
| FilterBanner | `components/Menu/FilterBanner.tsx` | Yellow banner for fuzzy search results |
| MenuList | `components/Menu/MenuList.tsx` | Grid view for /menu page |
| CategoryFilter | `components/Menu/CategoryFilter.tsx` | Alternative filter for /menu page |

### Cart Components
| Component | File | Purpose |
|-----------|------|---------|
| CartDrawer | `components/Cart/CartDrawer.tsx` | Slide-from-right panel, scrollable items, summary |
| CartButton | `components/Cart/CartButton.tsx` | Header icon with yellow badge count |
| CartItem | `components/Cart/CartItem.tsx` | Item display with quantity controls, customizations, price |
| CartSummary | `components/Cart/CartSummary.tsx` | Subtotal, tax (8.25%), total, checkout button |

### Order Components
| Component | File | Purpose |
|-----------|------|---------|
| OrderItemsCarousel | `components/Order/OrderItemsCarousel.tsx` | "Your Order" tab, horizontal scroll, checkout button |
| OrderItemCard | `components/Order/OrderItemCard.tsx` | Order item with meal details, customize/remove buttons |
| OrderReviewCarousel | `components/Order/OrderReviewCarousel.tsx` | Single-item review with prev/next navigation |
| EmptyOrderState | `components/Order/EmptyOrderState.tsx` | Empty cart with tips and Browse Menu button |

### UI Primitives
| Component | File | Purpose |
|-----------|------|---------|
| Button | `components/UI/Button.tsx` | primary/secondary/outline, sm/md/lg, loading state |
| Card | `components/UI/Card.tsx` | Card, CardHeader, CardBody, CardFooter |
| Modal | `components/UI/Modal.tsx` | Radix Dialog wrapper, sm/md/lg/xl sizes |
| Input | `components/UI/Input.tsx` | Label, error, helper text, validation |

### Debug
| Component | File | Purpose |
|-----------|------|---------|
| DebugPanel | `components/Debug/DebugPanel.tsx` | F8 overlay, event log, filters, statistics |

---

## 11. State Management

### Zustand Stores

#### Cart Store (`store/cart.ts`)
- Persisted to localStorage (key: `mcdonalds-cart-storage`)
- Items with full customization support
- Price calculation: `(basePrice + mealUpcharge + sizeModifier + customizations + side + drink) * quantity`
- Meal upcharge: $2.50 base + $1.00 for large

#### Clarification Store (`store/clarification.ts`)
- NOT persisted
- Tracks pending clarifications, item-not-found state
- Manages filtered item display

### Component State (React hooks)

#### AvatarContainer State
- `status`: 'loading' | 'ready' | 'error'
- `isListening`: boolean
- `messages`: ChatMessage[] (last 10)
- `errorMessage`: string | null
- Refs: hasGreeted, isListening, avatarRef, browserSTT

#### Order Page State
- `menuItems` / `filteredItems`: MenuItem[]
- `activeTab`: Category
- `isLoading` / `error`: loading states
- `isCartOpen` / `isCustomizationOpen`: modal states
- `filterMode` / `fuzzyFilteredItems`: voice search filter

### State Machines

#### PendingOrderManager (`lib/state/pendingOrderManager.ts`)
Class-based singleton tracking multi-step meal ordering:

```
States: meal_size → meal_side → meal_drink → ice_level → complete
        ↕ meal_conversion_offer (branching)

Methods:
  initialize(type, items)
  getCurrentItem() → PendingOrderItem
  updateCurrentItemMealDetails(updates)
  nextStep() → MealCustomizationStep
  completeCurrentItem() → boolean (more items?)
  convertItemToMeal(index)
  clear()
```

#### Meal Customization Flow (`lib/ordering/mealCustomizationFlow.ts`)
Question generation + response parsing:

```
MealQuestionGenerator:
  generateMealSizeQuestion(itemName) → "Would you like medium or large?"
  generateSideQuestion() → "Fries, corn cup, or garden salad?"
  generateDrinkQuestion() → "Coke, Sprite, Fanta, Milo...?"
  generateIceLevelQuestion(drinkName) → "Full ice, less ice, or no ice?"
  generateMealCompleteMessage(item) → "I've added a large Big Mac meal with..."

Parsers:
  parseMealSize(text) → 'medium' | 'large'
  findSideByName(text) → { id, name, priceModifier }
  findDrinkByName(text) → { id, name, priceModifier }
  parseIceLevel(text) → 'none' | 'less' | 'full'
```

Meal sides: Fries ($0), Corn Cup ($0), Garden Salad (+$0.50)
Meal drinks: Coke, Sprite, Fanta, Milo ($0), OJ (+$0.50), Water ($0)

#### Meal Conversion (`lib/ordering/mealConversion.ts`)
Detection + conversion logic:

```
Eligible categories: burgers, chicken, fish, breakfast
Eligible keywords: big mac, quarter pounder, mcchicken, filet-o-fish, cheeseburger...

Functions:
  isMealEligible(item) → boolean
  generateMealConversionOffer(items) → string
  parseMealConversionResponse(text, items) → { accepted, itemIndex, mealDetails }
  convertToPendingItem(item, isMeal) → PendingOrderItem
```

---

## 12. Mock Payment System

### Flow

```
1. User taps "Proceed to Checkout" in cart/order
2. Checkout page shows:
   - Order review (all items with prices)
   - Order type selection (Dine In / Takeout)
   - Payment method selection (NEW):
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │  💳 Card    │ │  💵 Cash    │ │  📱 Mobile  │
     │  (Tap)      │ │  (Counter)  │ │  Pay        │
     └─────────────┘ └─────────────┘ └─────────────┘
   - Order summary (subtotal, tax 8.25%, total)
3. User taps "Place Order"
4. POST /api/payment/process
5. Mock processing (1.5s simulated delay with progress animation)
6. Response: { success: true, transactionId: "TXN-...", method: "card" }
7. POST /api/order (create order with payment details)
8. Redirect to /confirmation with order number
```

### Mock Payment API

```typescript
// POST /api/payment/process
Request: {
  amount: number,        // Total in dollars
  method: 'card' | 'cash' | 'mobile_pay',
  orderId?: string
}

Response: {
  success: true,
  transactionId: "TXN-1709654321-A7B3",
  method: "card",
  amount: 15.99,
  processedAt: "2025-03-05T12:00:00Z",
  receiptNumber: "RCP-001234"
}
```

**Mock logic:**
- 95% success rate (simulate occasional failures for realistic UX)
- 1.5s simulated processing delay
- Generate fake transaction ID and receipt number
- Store payment details in order record

### Voice Payment

Avatar can initiate checkout:
- User: "That's all" / "I'm done" / "Checkout"
- Casey: "Great! Your total is $15.99. How would you like to pay — card, cash, or mobile?"
- User: "Card"
- Casey: "Perfect! Please tap your card on the reader..."
- (Mock: 1.5s delay)
- Casey: "Payment complete! Your order number is #1042. It'll be ready in about 10 minutes!"

---

## 13. Planned Features (Full Scope)

### Priority 1: Conversation & Upselling

#### 1.1 Conversation Memory & Context
- Store last 10 messages in session (DynamoDB)
- Send last 5 to NLP for context
- Track preferred size, ordered categories, order patterns
- Smart references: "same size as before", "another one"

#### 1.2 Meal Deal Upselling
- MealDealDetector: Analyze cart for combo opportunities
- Auto-detect burger + fries + drink ordered separately
- Calculate savings: "Save $2.48 by making it a meal!"
- MealSuggestionModal with price comparison
- ComboValueBadge showing savings

#### 1.3 Smart Upselling Prompts
- Size upgrades: "Upgrade to large for just $0.50 more?"
- Popular pairings: "Most people pair the Big Mac with fries"
- Category-based: After burger → suggest sides, after mains → suggest dessert
- Cooldown: Don't spam suggestions (15s minimum between prompts)
- Track suggested categories per session (suggest each category only once)

#### 1.4 Order Confirmation Flow
- Pre-checkout review: Avatar reads back entire order
- "Anything else?" with smart timing (3s delay, 15s cooldown)
- Silence detection: Prompt after 5s of silence
- OrderConfirmationDialog component

### Priority 2: Enhanced Experience

#### 2.1 Multi-Turn Conversation
- Corrections: "No, I meant LARGE not medium"
- Modifications: "Actually, make that 2 Big Macs instead of 1"
- Undo: "Remove the last item"
- Complex parsing: "Big Mac meal, no pickles, extra sauce, large Coke"

#### 2.2 Ambiguity Resolution
- "burger" → "Which burger? Big Mac, Cheeseburger, Quarter Pounder..."
- Show filtered carousel while asking
- Voice + visual hybrid selection

#### 2.3 Dietary Filtering
- Voice: "Show me vegetarian options" / "What's gluten-free?"
- Filter carousel in real-time
- Nutritional info on request: "How many calories?"

#### 2.4 Order Summary Card
- Visual review screen with thumbnails
- Swipe-to-delete items
- Voice: "Remove the apple pie" during review

### Priority 3: Advanced Features

#### 3.1 Mock Payment Flow (see Section 12)
#### 3.2 Receipt Generation (order number + details display)
#### 3.3 Order Status: "Ready in 5-7 minutes"

### Priority 4: Technical Improvements

#### 4.1 Error Handling
- Out-of-stock: "Sorry, we're out of apple pies. Try our chocolate sundae?"
- Breakfast hours: Enforce 6-11 AM restriction
- Graceful degradation: Visual ordering if Klleon fails

#### 4.2 Accessibility
- Text input fallback if voice fails
- High contrast mode
- ARIA labels for screen readers
- Subtitle customization

### Priority 5: UI Polish

#### 5.1 Animated Transitions
- Tab switching animations
- Add-to-cart celebration effect
- Progress indicators (Browse → Customize → Review → Pay → Confirm)

#### 5.2 First-Time User Guide
- "Tap mic to speak" animation
- Interactive tutorial mode
- Tooltips on first use

---

## 14. Environment Variables

### AWS Secrets Manager

```env
# OpenAI (NLP)
OPENAI_API_KEY=sk-...

# Klleon Avatar
NEXT_PUBLIC_KLLEON_SDK_KEY=your-sdk-key
NEXT_PUBLIC_KLLEON_AVATAR_ID=your-avatar-id

# Database (Aurora via RDS Proxy)
DATABASE_URL=postgresql://user:pass@rds-proxy-endpoint:5432/mcdonalds

# DynamoDB (auto from IAM role — no key needed)
DYNAMODB_TABLE_SESSIONS=kiosk-sessions
DYNAMODB_TABLE_CACHE=menu-cache
AWS_REGION=ap-southeast-1

# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://kiosk.yourdomain.com
```

**Note:** `NEXT_PUBLIC_` prefixed variables are exposed to the browser.
Only Klleon keys need this prefix. Everything else stays server-side.

**Security:** OpenAI key and DATABASE_URL stored in AWS Secrets Manager,
injected as environment variables into ECS task definition.

---

## 15. Deployment Pipeline

### CI/CD: GitHub → CodePipeline → ECS

```
GitHub Push (main branch)
  → CodePipeline trigger
  → CodeBuild:
      1. npm ci
      2. npm run build
      3. docker build -t mcdonalds-avatar .
      4. docker push → ECR
  → ECS Deploy:
      1. Update task definition with new image
      2. Rolling deployment (zero downtime)
      3. Health check: GET /api/health returns 200
```

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "start"]
```

### Infrastructure as Code

Use **AWS CDK** (TypeScript) or **Terraform** to define all infrastructure.
Store in `/infrastructure/` folder in the repo.

---

## 16. Cost Estimate

### Monthly Cost: 10,000 orders/month (~333/day)

| Service | Config | Monthly Cost |
|---------|--------|-------------|
| **ECS Fargate Spot** | 0.5 vCPU, 1GB RAM, 24/7 | ~$13 |
| **Aurora Serverless v2** | 0.5-1 ACU, PostgreSQL 15 | ~$45 |
| **RDS Proxy** | 1 instance | ~$22 |
| **DynamoDB** | On-demand, ~50K reads/month | ~$0.01 |
| **CloudFront** | ~50GB transfer/month | ~$5 |
| **ALB** | 1 load balancer | ~$18 |
| **ECR** | ~500MB images | ~$0.50 |
| **Secrets Manager** | 4 secrets | ~$2 |
| **CloudWatch** | Basic logs + metrics | ~$3 |
| **CodePipeline + CodeBuild** | ~30 builds/month | ~$2 |
| **OpenAI GPT-4o-mini** | ~10K requests × ~500 tokens | ~$2 |
| **Klleon SDK** | ~10K sessions × ~2 min | **TBD (contact Klleon)** |
| | | |
| **AWS Total** | | **~$113/month** |
| **OpenAI Total** | | **~$2/month** |
| **Klleon Total** | | **$200-1000/month (estimate)** |
| | | |
| **GRAND TOTAL** | | **~$315-1,115/month** |

### Cost Optimization Applied

| Optimization | Savings |
|-------------|---------|
| Fargate **Spot** instead of On-Demand | -70% compute (~$30 saved) |
| Aurora **Serverless** scales down overnight | -40% vs fixed RDS |
| DynamoDB **on-demand** instead of provisioned | -90% (near $0) |
| OpenAI **compressed prompts** | -60% tokens (~$3 saved) |
| CloudFront **free tier** (1TB) | -100% CDN cost first year |
| Menu **caching** reduces Aurora reads | -50% DB queries |

### Cost Comparison: Current vs AWS

| | Current (Supabase + Vercel) | AWS Rebuild |
|---|---|---|
| Database | $0-25 (Supabase free/pro) | ~$67 (Aurora + Proxy) |
| Hosting | $0-20 (Vercel free/pro) | ~$36 (Fargate + ALB + CF) |
| LLM | ~$2 (OpenAI) | ~$2 (OpenAI) |
| Other | $0 | ~$8 (Secrets, logs, CI/CD) |
| Klleon | TBD | TBD |
| **Total** | **~$2-47 + Klleon** | **~$113 + Klleon** |

AWS is more expensive but gives you:
- Full infrastructure control
- No vendor lock-in (Supabase/Vercel)
- Auto-scaling for multiple kiosks
- Enterprise security (VPC, IAM, encryption at rest)
- Monitoring and alerting (CloudWatch)

### Scaling Costs

| Kiosks | Orders/Month | AWS Cost | OpenAI | Total (excl. Klleon) |
|--------|-------------|----------|--------|---------------------|
| 1 | 10,000 | ~$113 | ~$2 | ~$115 |
| 5 | 50,000 | ~$145 | ~$10 | ~$155 |
| 10 | 100,000 | ~$200 | ~$20 | ~$220 |
| 50 | 500,000 | ~$400 | ~$100 | ~$500 |

Aurora and Fargate auto-scale. Cost grows sub-linearly.

---

## 17. Build Phases & Timeline

### Phase 0: AWS Infrastructure (Days 1-2)
- [ ] Set up AWS account, VPC, subnets
- [ ] Create Aurora Serverless v2 cluster
- [ ] Create RDS Proxy
- [ ] Create DynamoDB tables (sessions, cache)
- [ ] Set up ECR repository
- [ ] Create ECS cluster + Fargate service
- [ ] Set up ALB + CloudFront
- [ ] Configure Secrets Manager
- [ ] Set up CodePipeline + CodeBuild
- [ ] Deploy health check endpoint

### Phase 1: Database & Seed Data (Days 3-4)
- [ ] Run table creation SQL on Aurora
- [ ] Seed 50+ menu items
- [ ] Seed 120+ customization options
- [ ] Seed 21 combo meals
- [ ] Seed size variants
- [ ] Populate search tags and search_terms
- [ ] Set up Prisma with RDS Proxy connection
- [ ] Create DynamoDB session/cache utilities
- [ ] Verify all database queries work
- [ ] Implement menu caching layer

### Phase 2: API Routes (Days 5-7)
- [ ] GET /api/menu (with DynamoDB cache)
- [ ] GET /api/menu/[id] (with customizations)
- [ ] GET /api/combos + /api/combos/[id]
- [ ] POST /api/nlp/parse-order (OpenAI GPT-4o-mini)
- [ ] POST /api/order (order creation)
- [ ] POST /api/session (DynamoDB CRUD)
- [ ] POST /api/payment/process (mock)
- [ ] GET /api/health (ALB health check)
- [ ] Implement compressed NLP prompt
- [ ] Implement fuzzy matching fallback

### Phase 3: UI Foundation (Days 8-10)
- [ ] Set up Next.js 15 with TypeScript strict mode
- [ ] Configure Tailwind with McDonald's branding
- [ ] Build UI primitives (Button, Card, Modal, Input)
- [ ] Build idle screen (app/page.tsx)
- [ ] Build layout.tsx with Klleon script
- [ ] Build globals.css with all component classes

### Phase 4: Klleon Avatar Integration (Days 11-14)
- [ ] Implement Klleon init with full STT enabled
- [ ] Implement onStatusEvent handler (VIDEO_CAN_PLAY)
- [ ] Implement onChatEvent handler (intercept STT_RESULT)
- [ ] Implement echo() for TTS
- [ ] Implement stopSpeech()
- [ ] Build AvatarContainer with all state management
- [ ] Build ChatMessages component
- [ ] Build microphone button UI
- [ ] Build loading/error overlays
- [ ] Implement greeting sequence
- [ ] Test STT → NLP → echo() full flow
- [ ] Handle Klleon LLM suppression (ignore PREPARING_RESPONSE/RESPONSE_OK)

### Phase 5: Menu & Cart (Days 15-18)
- [ ] Build MenuCarousel with momentum scrolling
- [ ] Build MenuCard with badges and emoji detection
- [ ] Build CategoryTabs (8 categories)
- [ ] Build CustomizationModal (5-step flow)
- [ ] Build FilterBanner
- [ ] Build CartDrawer, CartButton, CartItem, CartSummary
- [ ] Build Zustand cart store with persistence
- [ ] Connect menu to cart (add, customize, remove)

### Phase 6: Order Flow (Days 19-21)
- [ ] Build OrderItemsCarousel ("Your Order" tab)
- [ ] Build OrderItemCard with meal details
- [ ] Build EmptyOrderState
- [ ] Build theater mode page (app/order/page.tsx)
- [ ] Build browse mode page (app/menu/page.tsx)
- [ ] Implement 30s inactivity timeout
- [ ] Connect voice ordering to cart

### Phase 7: NLP & Meal Logic (Days 22-26)
- [ ] Build orderProcessor with GPT-4o-mini
- [ ] Build PendingOrderManager state machine
- [ ] Build MealCustomizationFlow (questions + parsers)
- [ ] Build MealConversion (detection + offers)
- [ ] Build ClarificationStore
- [ ] Implement multi-item ordering
- [ ] Implement meal conversion acceptance
- [ ] Implement intent handling (order, modify, remove, checkout, meal_response)
- [ ] Test 30+ voice ordering scenarios

### Phase 8: Checkout & Payment (Days 27-29)
- [ ] Build checkout page
- [ ] Build payment method selection UI
- [ ] Build mock payment processing
- [ ] Build confirmation page with order number
- [ ] Build receipt display
- [ ] Implement voice checkout flow ("That's all" → payment → confirmation)
- [ ] Build confetti celebration effect

### Phase 9: Priority 1 Features (Days 30-35)
- [ ] Smart conversation context (preferred size, ordered categories)
- [ ] Meal deal detection (MealDealDetector)
- [ ] MealSuggestionModal with savings display
- [ ] ComboValueBadge
- [ ] Size upgrade suggestions
- [ ] Popular pairings (PairingEngine)
- [ ] Category-based suggestions with cooldowns
- [ ] "Anything else?" smart timing
- [ ] Order confirmation dialog with readback
- [ ] Silence detection prompts

### Phase 10: Priority 2-5 Features (Days 36-42)
- [ ] Multi-turn corrections ("No, I meant LARGE")
- [ ] Ambiguity resolution with filtered carousel
- [ ] Dietary filtering by voice
- [ ] Nutritional info on request
- [ ] Order summary card with swipe-to-delete
- [ ] Error handling (out of stock, breakfast hours)
- [ ] Text input fallback
- [ ] Accessibility (ARIA, high contrast)
- [ ] UI animations and transitions
- [ ] First-time user guide / tutorial
- [ ] Debug panel (F8)

### Phase 11: Testing & Polish (Days 43-45)
- [ ] End-to-end order flow testing
- [ ] Voice ordering test suite (30+ phrases)
- [ ] Edge case testing (interruptions, corrections, invalid input)
- [ ] Performance testing (latency targets)
- [ ] Kiosk portrait mode testing (1920x1080)
- [ ] Error recovery testing
- [ ] Load testing (concurrent orders)

**Total: ~45 working days (~9 weeks)**

---

## 18. Ports & Networking

### Port Map

| Service | Port | Protocol | Access |
|---------|------|----------|--------|
| **Next.js (Fargate)** | 3000 | HTTP | ALB only (private subnet) |
| **ALB** | 80 | HTTP | Redirects to 443 |
| **ALB** | 443 | HTTPS | CloudFront only |
| **CloudFront** | 443 | HTTPS | Public (kiosk browser) |
| **Aurora PostgreSQL** | 5432 | TCP | RDS Proxy only (private subnet) |
| **RDS Proxy** | 5432 | TCP | Fargate only (private subnet) |
| **DynamoDB** | 443 | HTTPS | VPC endpoint (private) |
| **Klleon SDK** | 443 | WSS | Public (browser → Klleon servers) |
| **OpenAI API** | 443 | HTTPS | Fargate outbound (NAT Gateway) |

### Network Flow

```
Kiosk Browser (1920x1080)
  │
  ├── HTTPS:443 → CloudFront → ALB:443 → Fargate:3000 (Next.js pages + API)
  │
  ├── HTTPS:443 → Klleon CDN (SDK script download)
  │
  └── WSS:443 → Klleon Servers (avatar streaming, STT, TTS)

Fargate:3000 (inside VPC)
  │
  ├── TCP:5432 → RDS Proxy → Aurora Serverless (SQL queries)
  │
  ├── HTTPS:443 → DynamoDB VPC Endpoint (sessions + cache)
  │
  └── HTTPS:443 → NAT Gateway → OpenAI API (NLP processing)
```

### VPC Design

```
VPC: 10.0.0.0/16

Public Subnets (2 AZs):
  10.0.1.0/24 (AZ-a) — ALB, NAT Gateway
  10.0.2.0/24 (AZ-b) — ALB

Private Subnets (2 AZs):
  10.0.3.0/24 (AZ-a) — Fargate tasks, RDS Proxy
  10.0.4.0/24 (AZ-b) — Fargate tasks, Aurora

Security Groups:
  ALB-SG:     Inbound 443 from CloudFront IPs
  Fargate-SG: Inbound 3000 from ALB-SG
  RDSProxy-SG: Inbound 5432 from Fargate-SG
  Aurora-SG:  Inbound 5432 from RDSProxy-SG
```

### DNS

```
kiosk.yourdomain.com → CloudFront distribution → ALB → Fargate
```

Or use CloudFront default domain: `d1234abcdef.cloudfront.net`

---

## Appendix: Key Differences from Current Codebase

| Aspect | Current (GitHub) | AWS Rebuild |
|--------|-----------------|-------------|
| Database | Supabase (hosted PostgreSQL) | Aurora Serverless v2 + RDS Proxy |
| Sessions | PostgreSQL table | DynamoDB (faster, auto-cleanup) |
| Menu Cache | None (query DB every time) | DynamoDB + in-memory (< 5ms) |
| Hosting | Vercel (implied) | ECS Fargate Spot + CloudFront |
| STT | Browser Web Speech API | Klleon native STT |
| LLM | GPT-4o-mini (OpenAI) | GPT-4o-mini (OpenAI) — same |
| TTS | Klleon echo() | Klleon echo() — same |
| Avatar | Klleon SDK v1.2.0 | Klleon SDK v1.2.0 — same |
| DB Client | Supabase JS client + Prisma | Prisma only (direct Aurora connection) |
| CI/CD | Manual / GitHub Actions | AWS CodePipeline + CodeBuild |
| Secrets | .env.local file | AWS Secrets Manager |
| Monitoring | Console logs | CloudWatch |
| Payment | None | Mock payment system |
| Upselling | Partial (meal conversion) | Full (detection, suggestions, pairings) |
| NLP Prompt | Full menu per request (~800 tokens) | Compressed menu (~200 tokens) |

---

**Document Status:** Ready for Review
**Next Step:** User approval → Begin Phase 0 (AWS Infrastructure)
