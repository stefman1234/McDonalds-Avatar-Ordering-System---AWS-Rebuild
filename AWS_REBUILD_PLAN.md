# McDonald's Avatar Ordering System - AWS Rebuild Plan

**Version:** 2.2
**Date:** 2026-03-05
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
19. [Development Best Practices](#19-development-best-practices)

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
                        │  EC2 t3.micro   │
                        │  (Next.js 15)   │
                        │  Port 3000      │
                        │  Nginx :80/:443 │
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
           │    RDS      │ │  OpenAI   │ │  DynamoDB   │
           │ db.t4g.micro│ │ GPT-4o-   │ │  (Sessions  │
           │  (PG 15)   │ │  mini     │ │   + Cache)  │
           │  Port 5432 │ │  (NLP)    │ │             │
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
| **EC2 t3.micro** over Lambda | No cold starts (critical for kiosk — must respond instantly). Lambda cold starts of 1-3s are unacceptable. t3.micro is always warm and costs ~$8/month. |
| **EC2 t3.micro** over Fargate | Simpler, cheaper for a single kiosk. No container orchestration overhead. Direct SSH access for debugging. 2 vCPU + 1GB RAM is more than enough. |
| **EC2** over Amplify | Amplify uses Lambda@Edge under the hood for SSR — same cold start problem. EC2 gives us a warm, always-on server with full control. |
| **RDS db.t4g.micro** over Aurora Serverless | For a single demo kiosk, fixed RDS is cheaper (~$13/month vs ~$45). db.t4g.micro has 2 vCPU, 1GB RAM — more than enough for this workload. Upgrade to Aurora Serverless if scaling to multiple kiosks later. |
| **Direct DB connection** (no RDS Proxy) | Single EC2 instance with Prisma connection pooling handles connections fine. RDS Proxy adds $22/month overhead that's unnecessary for a single server. Prisma's built-in pool (connection_limit=10) prevents exhaustion. |
| **DynamoDB** for sessions/cache | Sub-10ms reads. Menu cache and session state don't need relational queries. DynamoDB on-demand pricing = pay per read/write, ~$0 when idle. |
| **CloudFront** | SSL termination, static asset caching, DDoS protection. Free tier covers 1TB/month. |
| **No ALB** | Single EC2 instance doesn't need a load balancer. CloudFront connects directly to the EC2 origin. Saves ~$18/month. |
| **No separate backend** | Single deployment, single codebase, zero cross-service latency. |

---

## 2. AWS Services & Justification

### Compute
| Service | Purpose | Config |
|---------|---------|--------|
| **EC2 t3.micro** | Run Next.js app | 2 vCPU, 1GB RAM, Amazon Linux 2023 |
| **Elastic IP** | Static IP for EC2 | 1 address (free when attached) |

### Database
| Service | Purpose | Config |
|---------|---------|--------|
| **RDS db.t4g.micro** | PostgreSQL 15 (menu, orders, combos, customizations) | 2 vCPU, 1GB RAM, 20GB gp3 |
| **DynamoDB** | Session state + menu cache | On-demand capacity |

### Networking & CDN
| Service | Purpose | Config |
|---------|---------|--------|
| **CloudFront** | CDN, SSL, static assets | Origin → EC2 Elastic IP:443 |
| **VPC** | Networking | Public subnet for EC2, private for RDS |

### Security
| Service | Purpose | Config |
|---------|---------|--------|
| **Secrets Manager** | Store API keys (OpenAI, Klleon) | 3-4 secrets |
| **IAM** | Service roles | Least-privilege policies |
| **ACM** | SSL certificate | Free with CloudFront |

### CI/CD
| Service | Purpose | Config |
|---------|---------|--------|
| **GitHub Actions** | Build & deploy pipeline | Push to main → SSH deploy to EC2 |

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
- [x] Full-screen browse mode (/menu page) — **replaced in rebuild with bottom sheet panel**

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

Special arrangement in place — Klleon costs are covered and not factored
into the cost estimate.

---

## 5. Database Design

### PostgreSQL (RDS db.t4g.micro)

Relational data that needs ACID transactions, JOINs, and complex queries.
Using fixed-size RDS for cost optimization on single demo kiosk (~$13/month vs ~$45 for Aurora Serverless).

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
  applicable_to   TEXT[],                      -- {'burgers', 'chicken'}
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
- Sub-10ms reads vs 30-100ms for RDS
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

All routes run inside Next.js on EC2 t3.micro, port 3000 (Nginx reverse proxy on 80/443).

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
  → Cache miss? Query RDS → Store in DynamoDB → Return
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
| GET | `/api/health` | Health check (returns 200) |

---

## 7. NLP & Order Processing

### Architecture Pattern: RAG (Retrieval-Augmented Generation)

This system uses a **RAG pattern** — the LLM does NOT have menu knowledge
built in. Instead, every NLP request:

1. **Retrieve**: Fetch current menu items from database (RDS → DynamoDB cache)
2. **Augment**: Inject menu data into the GPT-4o-mini prompt as context
3. **Generate**: LLM parses user speech against the real, live menu

This ensures the AI always references the actual menu (prices, availability,
item names) rather than hallucinating items that don't exist.

### LLM: OpenAI GPT-4o-mini

**Config:**
- Model: `gpt-4o-mini`
- Temperature: 0.3 (low randomness for consistent parsing)
- Response format: JSON object
- Max tokens: ~500 per response

**Prompt structure (RAG):**
1. System context: "You are Casey, a friendly McDonald's ordering assistant in Malaysia"
2. **Retrieved menu items list** (from DynamoDB cache — NOT from DB per request)
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
Cold path:  Browser → Next.js API → RDS query (50-100ms) → Response
Hot path:   Browser → Next.js API → DynamoDB cache (3-8ms) → Response
```

- Cache all menu items on first request
- TTL: 5 minutes (menu barely changes)
- Cache keys: `menu_all`, `menu_burger`, `menu_chicken`, etc.
- Invalidation: TTL-based (no manual invalidation needed)
- Cost: ~$0.00 at kiosk scale (< 1000 reads/day)

### 2. Connection Pooling (Prisma)

```
Without pooling: Each API request → New TCP connection → RDS (100ms handshake)
With pooling:    Each API request → Reuse pooled connection → RDS (< 5ms)
```

- Prisma connection pool: `connection_limit=10` in DATABASE_URL
- Single EC2 instance with 10 pooled connections is more than sufficient
- No RDS Proxy needed — saves $22/month

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
// In-memory cache (lives in EC2 process memory — persists across requests)
let menuCache: MenuItem[] | null = null;
let menuCacheExpiry = 0;

async function getMenuItems(): Promise<MenuItem[]> {
  if (menuCache && Date.now() < menuCacheExpiry) {
    return menuCache; // 0ms — already in memory
  }
  // Fetch from DynamoDB cache or RDS
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
| DB connection | 100ms first, 5ms reuse | < 5ms always | Prisma connection pool |
| Avatar init | 2-5s | 2-5s | Cannot optimize (Klleon) |
| Static assets | 200-500ms | < 50ms | CloudFront CDN |
| **Total order** | **~3-5s** | **~1-3s** | All combined |

---

## 9. Frontend Architecture

### Design Philosophy: Minimal & Contextual

The kiosk UI should be **minimal by default** — the avatar is the primary
interface. UI elements appear only when relevant and disappear when not needed.
This reduces visual clutter and keeps focus on the conversational experience.

**Core Principles:**
1. **Avatar-first**: Avatar takes up majority of screen. It IS the interface.
2. **Show on demand**: Menu, cart, and order details are hidden by default — revealed via buttons or voice triggers.
3. **Contextual display**: Elements appear when relevant (e.g., menu carousel slides up when user says "show me burgers") and auto-hide after interaction.
4. **Touch-friendly**: All interactive elements min 44px tap target (WCAG).
5. **No persistent chrome**: Minimize always-visible UI. Header is compact, no permanent sidebars.

### Framework
- **Next.js 15** (App Router)
- **React 18** (functional components only)
- **TypeScript 5.3** (strict mode)
- **Tailwind CSS 3.4** (utility-first)

### Pages

| Route | Purpose | SSR/CSR |
|-------|---------|---------|
| `/` | Idle screen (ad + Start Order button) | CSR |
| `/order` | Main ordering screen (avatar + contextual panels) | CSR |
| `/checkout` | Order review + payment | CSR |
| `/confirmation` | Order confirmation + receipt | CSR |

All pages are client-rendered (`'use client'`) because they depend on
browser APIs (Klleon SDK, localStorage, Web Audio).

**Removed:** `/menu` as a separate page. Browse functionality is now a
slide-up panel triggered from the `/order` page (button or voice command).
This keeps users in the avatar conversation flow.

### Layout Structure (Main Order Screen - /order)

```
┌─────────────────────────────────────────┐
│  Header (compact, semi-transparent)     │  ~40px
│  [Logo]                    [Cart (3)]   │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│         Avatar Zone (full screen)       │  100% - header
│    bg-gradient: mcd-red → mcd-dark-red  │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  <avatar-container> (z-10)      │   │
│  │                                  │   │
│  │  Chat bubbles (z-30)            │   │
│  │  (last 2-3 messages, fade out)  │   │
│  │                                  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────┐           ┌──────────────┐    │
│  │ 🎤   │           │ Browse Menu  │    │  Floating buttons
│  │ Mic  │           │      ↑       │    │  (bottom of screen)
│  └──────┘           └──────────────┘    │
│                                         │
└─────────────────────────────────────────┘

Contextual panels (slide up from bottom when triggered):

┌─────────────────────────────────────────┐
│  Panel Header: "Menu" / "Your Order"    │  Draggable
│  [Category Tabs] or [Order Items]       │  handle
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │Card │ │Card │ │Card │ │Card │      │  Carousel
│  └─────┘ └─────┘ └─────┘ └─────┘      │
│  [Close ×]                              │
└─────────────────────────────────────────┘
```

**Key difference from current UI:** The menu carousel is NOT permanently
visible. It slides up as a bottom sheet when:
- User taps "Browse Menu" button
- User says "show me the menu" / "what burgers do you have"
- NLP returns fuzzy matches (filtered results)
- Avatar suggests items ("Would you like to see our burgers?")

It auto-collapses after 15s of no interaction or when user starts speaking.

### Contextual Panel States

| Trigger | Panel Content | Auto-hide |
|---------|--------------|-----------|
| "Browse Menu" button / voice | Full menu with category tabs | 15s idle |
| NLP fuzzy match results | Filtered menu items + FilterBanner | 15s idle |
| "Your Order" / cart icon | Order items carousel | On close tap |
| Customization tap | CustomizationModal (full-screen overlay) | On complete |
| "Checkout" voice/button | Navigate to /checkout page | N/A |

### Chat Messages Behavior

- Show last **2-3 messages** only (not a full scrolling chat log)
- Messages **fade out** after 8 seconds to keep screen clean
- Latest message stays visible until next interaction
- Tap on avatar zone to temporarily show full message history (overlay)

### Z-Index Stack

| Layer | Z-Index | Element |
|-------|---------|---------|
| Customization Modal | 60 | Full-screen overlay |
| Cart Drawer | 50 + backdrop 40 | Slides from right |
| Microphone button | 50 | Bottom-left floating |
| Bottom sheet panel | 45 | Menu/Order slide-up |
| Chat messages | 30 | Overlays avatar, auto-fade |
| Loading/Error overlay | 20 | Covers avatar during init |
| Avatar | 10 | Base rendering layer |
| Debug Panel | 9999 | F8 full-screen overlay (dev only) |

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
.btn-floating   → rounded-full shadow-lg p-4 min-w-[44px] min-h-[44px]
.card           → bg-white rounded-xl shadow-lg p-4 border border-gray-100
.bottom-sheet   → fixed bottom-0 w-full bg-white rounded-t-2xl shadow-2xl transition-transform
```

---

## 10. Component Inventory

### Avatar Components (always visible)
| Component | File | Purpose |
|-----------|------|---------|
| AvatarContainer | `components/Avatar/AvatarContainer.tsx` | Main orchestrator: Klleon init, STT, NLP, cart integration, greeting, error handling |
| ChatMessages | `components/Avatar/ChatMessages.tsx` | Floating chat bubbles (last 2-3, auto-fade after 8s), tap to expand history |

### Menu Components (shown on demand via bottom sheet)
| Component | File | Purpose |
|-----------|------|---------|
| MenuBottomSheet | `components/Menu/MenuBottomSheet.tsx` | Slide-up panel container with drag handle, auto-collapse on idle |
| MenuCarousel | `components/Menu/MenuCarousel.tsx` | Horizontal scroll with momentum physics, 240px cards, drag-to-scroll |
| MenuCard | `components/Menu/MenuCard.tsx` | Item card with badges, price, Add/Customize buttons |
| CategoryTabs | `components/Menu/CategoryTabs.tsx` | 7 tabs: All, Burgers, Chicken, Sides, Drinks, Desserts, Happy Meal |
| CustomizationModal | `components/Menu/CustomizationModal.tsx` | Full-screen overlay: meal type → size → side → drink+ice → toppings |
| FilterBanner | `components/Menu/FilterBanner.tsx` | Yellow banner for fuzzy search results ("Showing results for...") |

### Cart Components (shown on demand)
| Component | File | Purpose |
|-----------|------|---------|
| CartDrawer | `components/Cart/CartDrawer.tsx` | Slide-from-right panel, scrollable items, summary |
| CartButton | `components/Cart/CartButton.tsx` | Header icon with yellow badge count (only shows when cart > 0) |
| CartItem | `components/Cart/CartItem.tsx` | Item display with quantity controls, customizations, price |
| CartSummary | `components/Cart/CartSummary.tsx` | Subtotal, tax (8.25%), total, checkout button |

### Order Components (shown on demand)
| Component | File | Purpose |
|-----------|------|---------|
| OrderBottomSheet | `components/Order/OrderBottomSheet.tsx` | Slide-up panel showing current order items |
| OrderItemCard | `components/Order/OrderItemCard.tsx` | Order item with meal details, remove button |
| EmptyOrderState | `components/Order/EmptyOrderState.tsx` | Empty state with "Start ordering by speaking or browsing" |

### Floating UI (always visible on /order)
| Component | File | Purpose |
|-----------|------|---------|
| MicButton | `components/UI/MicButton.tsx` | Floating mic button (bottom-left), pulsing when active |
| BrowseMenuButton | `components/UI/BrowseMenuButton.tsx` | Floating button (bottom-right), opens MenuBottomSheet |

### UI Primitives
| Component | File | Purpose |
|-----------|------|---------|
| Button | `components/UI/Button.tsx` | primary/secondary/outline/floating variants, loading state |
| BottomSheet | `components/UI/BottomSheet.tsx` | Reusable slide-up panel with drag-to-dismiss, backdrop |
| Modal | `components/UI/Modal.tsx` | Full-screen overlay for customization |

### Debug (dev only)
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
- Refs: hasGreeted, isListening, avatarRef

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
  processedAt: "2026-03-05T12:00:00Z",
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

# Database (RDS db.t4g.micro — direct connection with Prisma pooling)
DATABASE_URL=postgresql://user:pass@rds-endpoint.ap-southeast-1.rds.amazonaws.com:5432/mcdonalds?connection_limit=10

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
loaded into EC2 environment via a startup script that fetches from Secrets Manager on boot.

---

## 15. Deployment Pipeline

### CI/CD: GitHub Actions → SSH Deploy to EC2

```
GitHub Push (main branch)
  → GitHub Actions workflow triggers
  → Steps:
      1. SSH into EC2 via stored key
      2. cd /app && git pull origin main
      3. npm ci
      4. npx prisma generate
      5. npm run build
      6. pm2 restart mcdonalds-kiosk
      7. Health check: curl http://localhost:3000/api/health
```

**Why GitHub Actions over CodePipeline:**
- Free for public repos, 2000 min/month for private
- Simpler setup — no AWS CodePipeline + CodeBuild ($2/month saved)
- Same result: push to main → app updates on EC2

### EC2 Server Setup

```bash
# Amazon Linux 2023 on t3.micro
# Install Node.js 20, Nginx, PM2, Git

# Nginx reverse proxy config (/etc/nginx/conf.d/app.conf):
server {
    listen 80;
    listen 443 ssl;
    server_name kiosk.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/kiosk.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kiosk.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# PM2 process manager (auto-restart on crash):
pm2 start npm --name "mcdonalds-kiosk" -- start
pm2 startup  # Auto-start on EC2 reboot
pm2 save
```

### Secrets Loading (EC2 Startup Script)

```bash
#!/bin/bash
# /app/load-secrets.sh — run before app starts
# Fetches secrets from AWS Secrets Manager and exports as env vars

export OPENAI_API_KEY=$(aws secretsmanager get-secret-value \
  --secret-id mcdonalds/openai --query SecretString --output text)
export DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id mcdonalds/database --query SecretString --output text)
# Klleon keys are NEXT_PUBLIC_ so they go in .env.local (baked at build time)
```

### Infrastructure as Code

Use **AWS CDK** (TypeScript) or **Terraform** to define all infrastructure.
Store in `/infrastructure/` folder in the repo.

---

## 16. Cost Estimate

### Monthly Cost: Single Demo Kiosk

| Service | Config | Monthly Cost |
|---------|--------|-------------|
| **EC2 t3.micro** | 2 vCPU, 1GB RAM, 24/7 | ~$8 |
| **Elastic IP** | 1 address (attached to EC2) | $0 |
| **RDS db.t4g.micro** | PostgreSQL 15, 2 vCPU, 1GB RAM, 20GB gp3 | ~$13 |
| **DynamoDB** | On-demand, ~50K reads/month | ~$0.01 |
| **CloudFront** | ~50GB transfer/month | ~$5 |
| **Secrets Manager** | 4 secrets | ~$2 |
| **CloudWatch** | Basic logs + metrics | ~$3 |
| **OpenAI GPT-4o-mini** | ~10K requests × ~500 tokens | ~$2 |
| **Klleon SDK** | Special arrangement | $0 (covered) |
| | | |
| **GRAND TOTAL** | | **~$33/month** |

### Cost Optimization Applied

| Optimization | Impact |
|-------------|---------|
| **EC2 t3.micro** instead of Fargate/Lambda | Cheapest always-on compute |
| **RDS db.t4g.micro** instead of Aurora Serverless | -$32/month (fixed vs serverless) |
| **No ALB** (CloudFront → EC2 direct) | -$18/month |
| **No RDS Proxy** (Prisma connection pool) | -$22/month |
| **GitHub Actions** instead of CodePipeline | Free for public repos |
| DynamoDB **on-demand** | Near $0 at kiosk scale |
| OpenAI **compressed prompts** | -60% token cost |
| CloudFront **free tier** (1TB) | -100% CDN cost first year |
| Menu **caching** reduces DB reads | -50% DB queries |

### Cost Comparison: Current vs AWS

| | Current (Supabase + Vercel) | AWS Rebuild |
|---|---|---|
| Database | $0-25 (Supabase free/pro) | ~$13 (RDS db.t4g.micro) |
| Hosting | $0-20 (Vercel free/pro) | ~$13 (EC2 + CloudFront) |
| LLM | ~$2 (OpenAI) | ~$2 (OpenAI) |
| Other | $0 | ~$5 (Secrets, logs) |
| **Total** | **~$2-47** | **~$33** |

### Scaling Path

| Scale | Change | Cost Impact |
|-------|--------|-------------|
| 1 kiosk (demo) | Current plan | ~$33/month |
| 5 kiosks | Upgrade EC2 to t3.small, RDS to db.t4g.small | ~$50/month |
| 10+ kiosks | Switch to Aurora Serverless + ALB + auto-scaling | ~$150+/month |

---

## 17. Build Phases & Timeline

### Phase 0: AWS Infrastructure (Days 1-2)
- [ ] Set up AWS account, VPC, subnets
- [ ] Launch EC2 t3.micro (Amazon Linux 2023)
- [ ] Attach Elastic IP
- [ ] Install Node.js 20, Nginx, PM2, Git on EC2
- [ ] Configure Nginx reverse proxy (port 80/443 → 3000)
- [ ] Create RDS db.t4g.micro PostgreSQL 15 instance
- [ ] Create DynamoDB tables (sessions, cache)
- [ ] Set up CloudFront distribution (origin → EC2)
- [ ] Configure Secrets Manager (OpenAI key, DB URL)
- [ ] Set up GitHub Actions deploy workflow
- [ ] Deploy health check endpoint

### Phase 1: Database & Seed Data (Days 3-4)
- [ ] Run table creation SQL on RDS
- [ ] Seed 50+ menu items
- [ ] Seed 120+ customization options
- [ ] Seed 21 combo meals
- [ ] Seed size variants
- [ ] Populate search tags and search_terms
- [ ] Set up Prisma with RDS direct connection (connection_limit=10)
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
- [ ] GET /api/health (health check)
- [ ] Implement compressed NLP prompt
- [ ] Implement fuzzy matching fallback

### Phase 3: UI Foundation (Days 8-10)
- [ ] Set up Next.js 15 with TypeScript strict mode
- [ ] Configure Tailwind with McDonald's branding
- [ ] Build UI primitives (Button, BottomSheet, Modal)
- [ ] Build idle screen (app/page.tsx)
- [ ] Build layout.tsx with Klleon script + error boundary
- [ ] Build globals.css with component classes
- [ ] Set up environment variable validation (fail fast on missing vars)

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
- [ ] Build BottomSheet reusable component (slide-up, drag-to-dismiss)
- [ ] Build MenuBottomSheet (extends BottomSheet with category tabs)
- [ ] Build MenuCarousel with momentum scrolling
- [ ] Build MenuCard with badges
- [ ] Build CategoryTabs (7 categories)
- [ ] Build CustomizationModal (full-screen 5-step flow)
- [ ] Build FilterBanner for fuzzy results
- [ ] Build CartDrawer, CartButton (badge only when cart > 0), CartItem, CartSummary
- [ ] Build Zustand cart store with persistence
- [ ] Connect menu to cart (add, customize, remove)

### Phase 6: Order Flow (Days 19-21)
- [ ] Build OrderBottomSheet
- [ ] Build OrderItemCard with meal details
- [ ] Build EmptyOrderState
- [ ] Build main order page (app/order/page.tsx) — avatar-first, minimal UI
- [ ] Build floating MicButton and BrowseMenuButton
- [ ] Implement auto-show/hide bottom sheet on voice triggers
- [ ] Implement 30s inactivity timeout (collapse panels, then redirect)
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
| **Next.js (EC2)** | 3000 | HTTP | Localhost only (Nginx proxies) |
| **Nginx (EC2)** | 80 | HTTP | Redirects to 443 |
| **Nginx (EC2)** | 443 | HTTPS | CloudFront origin / direct |
| **CloudFront** | 443 | HTTPS | Public (kiosk browser) |
| **RDS PostgreSQL** | 5432 | TCP | EC2 only (private subnet) |
| **DynamoDB** | 443 | HTTPS | VPC endpoint (private) |
| **Klleon SDK** | 443 | WSS | Public (browser → Klleon servers) |
| **OpenAI API** | 443 | HTTPS | EC2 outbound (Internet Gateway) |

### Network Flow

```
Kiosk Browser (1920x1080)
  │
  ├── HTTPS:443 → CloudFront → EC2 Nginx:443 → localhost:3000 (Next.js)
  │
  ├── HTTPS:443 → Klleon CDN (SDK script download)
  │
  └── WSS:443 → Klleon Servers (avatar streaming, STT, TTS)

EC2 t3.micro (public subnet with Elastic IP)
  │
  ├── TCP:5432 → RDS db.t4g.micro (SQL queries, private subnet)
  │
  ├── HTTPS:443 → DynamoDB VPC Endpoint (sessions + cache)
  │
  └── HTTPS:443 → Internet Gateway → OpenAI API (NLP processing)
```

### VPC Design

```
VPC: 10.0.0.0/16

Public Subnet:
  10.0.1.0/24 (AZ-a) — EC2 t3.micro (Elastic IP)

Private Subnet:
  10.0.3.0/24 (AZ-a) — RDS db.t4g.micro

Security Groups:
  EC2-SG:     Inbound 80/443 from 0.0.0.0/0 (or CloudFront IPs only)
              Inbound 22 from your IP only (SSH)
  RDS-SG:     Inbound 5432 from EC2-SG only
```

**Simplified vs Fargate plan:** No ALB, no RDS Proxy, no NAT Gateway (EC2
is in public subnet with Internet Gateway). Fewer moving parts = fewer failure
points and lower cost.

### DNS

```
kiosk.yourdomain.com → Cloudflare DNS → CloudFront distribution → EC2 Elastic IP
```

**DNS Management:** Cloudflare (to be configured by user).
CNAME `kiosk.yourdomain.com` → CloudFront distribution domain.
Until domain is configured, use CloudFront default: `d1234abcdef.cloudfront.net`

---

## Appendix: Key Differences from Current Codebase

| Aspect | Current (GitHub) | AWS Rebuild |
|--------|-----------------|-------------|
| Database | Supabase (hosted PostgreSQL) | RDS db.t4g.micro PostgreSQL 15 (Prisma pool) |
| Sessions | PostgreSQL table | DynamoDB (faster, auto-cleanup) |
| Menu Cache | None (query DB every time) | DynamoDB + in-memory (< 5ms) |
| Hosting | Vercel (implied) | EC2 t3.micro + Nginx + CloudFront |
| STT | Browser Web Speech API | Klleon native STT |
| LLM | GPT-4o-mini (OpenAI) | GPT-4o-mini (OpenAI) — same |
| TTS | Klleon echo() | Klleon echo() — same |
| Avatar | Klleon SDK v1.2.0 | Klleon SDK v1.2.0 — same |
| DB Client | Supabase JS client + Prisma | Prisma only (direct RDS connection) |
| CI/CD | Manual / GitHub Actions | GitHub Actions → SSH deploy |
| Secrets | .env.local file | AWS Secrets Manager |
| Monitoring | Console logs | CloudWatch |
| Payment | None | Mock payment system |
| Upselling | Partial (meal conversion) | Full (detection, suggestions, pairings) |
| NLP Prompt | Full menu per request (~800 tokens) | Compressed menu (~200 tokens) |

---

---

## 19. Development Best Practices

### Error Handling

#### React Error Boundaries
```typescript
// components/ErrorBoundary.tsx — wraps each major section
// Catches render errors in Avatar, Menu, Cart independently
// Fallback: "Something went wrong. Tap to retry." with retry button
// Avatar failure → graceful degradation to visual-only ordering
```

#### API Error Handling
- All API routes return consistent shape: `{ success: boolean, data?, error? }`
- NLP failures return fallback response (never crash the ordering flow)
- DB connection failures log to CloudWatch and return cached data where possible
- Client-side: toast notifications for transient errors, full-screen for critical

#### Klleon Failure Graceful Degradation
- If Klleon SDK fails to load → show visual-only mode (menu + touch ordering)
- If STT fails → show text input fallback
- If TTS fails → show text response in chat bubbles (no audio)
- Never block the ordering flow due to avatar issues

### Environment Variable Validation

```typescript
// lib/env.ts — validate ALL required env vars at startup
const requiredVars = [
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'NEXT_PUBLIC_KLLEON_SDK_KEY',
  'NEXT_PUBLIC_KLLEON_AVATAR_ID',
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}
```

Import this in `app/layout.tsx` — app fails fast with a clear error
message rather than silently breaking at runtime.

### Security Headers

```typescript
// next.config.js — security headers
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'microphone=(self)' },
]
```

### Logging Strategy

| Level | What | Where |
|-------|------|-------|
| **error** | API failures, DB errors, Klleon crashes | CloudWatch + console |
| **warn** | Fallback activations, slow responses (>2s) | CloudWatch |
| **info** | Order created, NLP intent, session start/end | CloudWatch |
| **debug** | STT results, full NLP prompts, cache hits/misses | Console only (dev) |

Use structured JSON logging for CloudWatch parseability:
```typescript
console.log(JSON.stringify({ level: 'info', event: 'order_created', orderId, itemCount, total }));
```

### Code Organization Best Practices

- **Barrel exports** (`index.ts`) in each component folder — clean imports
- **Absolute imports** via `@/` path alias (already configured in tsconfig)
- **Co-locate tests**: `ComponentName.test.tsx` next to `ComponentName.tsx`
- **Type-safe API**: Shared types in `types/` used by both client and API routes
- **No `any`**: TypeScript strict mode, explicitly type all Klleon SDK interactions
- **Prisma type safety**: Use generated types from `npx prisma generate`

### Git Workflow

- `main` branch = production (auto-deploys to EC2)
- `dev` branch = development (manual merge to main)
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`
- PR required to merge to main (even for solo dev — creates audit trail)

---

**Document Status:** Ready for Review
**Next Step:** User approval → Begin Phase 0 (AWS Infrastructure)
