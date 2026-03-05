# McDonald's Avatar Ordering System - Setup & Credentials

## API Keys & Environment Variables

Create a `.env.local` file in the project root with these values:

```env
# Klleon Avatar SDK
NEXT_PUBLIC_KLLEON_SDK_KEY=APP-pjy6uvOiZf42ycX5ip8C
NEXT_PUBLIC_KLLEON_AVATAR_ID=e1d054ad-a6f8-4359-95bf-3038b8ec97ea

# OpenAI (NLP - order parsing)
OPENAI_API_KEY=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

# Database (local dev - changes to RDS for production)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mcdonalds?connection_limit=10

# DynamoDB (not needed until AWS deployment)
# DYNAMODB_TABLE_SESSIONS=kiosk-sessions
# DYNAMODB_TABLE_CACHE=menu-cache
# AWS_REGION=ap-southeast-1

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **PostgreSQL** 15+ running locally on port 5432
- **npm** (comes with Node.js)

---

## Database Setup

1. Install PostgreSQL locally and create a database:
   ```bash
   psql -U postgres
   CREATE DATABASE mcdonalds;
   \q
   ```

2. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

3. Push schema to database:
   ```bash
   npm run db:push
   ```

4. Seed the database with menu items:
   ```bash
   npm run db:seed
   ```

---

## Running the Project

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up `.env.local` (see above)

3. Set up the database (see above)

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Next.js dev server |
| `build` | `npm run build` | Generate Prisma client + build for production |
| `start` | `npm run start` | Start production server |
| `lint` | `npm run lint` | Run ESLint |
| `db:generate` | `npm run db:generate` | Generate Prisma client from schema |
| `db:push` | `npm run db:push` | Push Prisma schema to database |
| `db:seed` | `npm run db:seed` | Seed database with menu items |

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15 | App framework (App Router) |
| React | 18 | UI library |
| TypeScript | 5.9 | Type safety |
| Tailwind CSS | 4 | Styling (uses `@theme` in CSS, not config file) |
| Prisma | 7 | ORM for PostgreSQL |
| Zustand | 5 | State management (cart, UI state) |
| Fuse.js | 7.1 | Fuzzy search matching |
| OpenAI SDK | 6 | GPT-4o-mini for NLP order parsing |
| Framer Motion | 12 | Animations (BottomSheet) |
| Klleon SDK | 1.2.0 | Avatar rendering, STT, TTS |

---

## Key Services

### Klleon Avatar SDK
- **Dashboard**: Klleon developer portal
- **SDK Key**: `APP-pjy6uvOiZf42ycX5ip8C` (public, loaded in browser)
- **Avatar ID**: `e1d054ad-a6f8-4359-95bf-3038b8ec97ea`
- **Features used**: Avatar rendering, native STT (speech-to-text), TTS via `echo()`, lip sync
- **SDK loaded via**: Script tag in `app/layout.tsx`

### OpenAI
- **Model**: GPT-4o-mini
- **Purpose**: Parse voice/text orders into structured intents (items, quantities, customizations)
- **Key**: Server-side only (never exposed to browser)

### PostgreSQL (Prisma)
- **Local**: `postgresql://postgres:postgres@localhost:5432/mcdonalds`
- **Production**: AWS RDS db.t4g.micro
- **Schema**: See `prisma/schema.prisma`
- **Models**: Category, MenuItem, MenuItemAlias, Customization, ComboMeal, ComboAlias, Order, OrderItem

---

## Project Structure

```
app/
  page.tsx              - Idle screen (start order)
  order/page.tsx        - Main ordering screen (avatar + menu)
  checkout/page.tsx     - Checkout with order type + payment
  confirmation/page.tsx - Order confirmed screen
  api/
    menu/route.ts       - GET menu items
    order/route.ts      - POST create order
    nlp/parse-order/    - POST parse voice input
    payment/process/    - POST mock payment

components/
  avatar/               - AvatarContainer, ChatMessages
  cart/                 - CartButton, CartDrawer, CartItem, CartSummary
  menu/                 - MenuSection, MenuCard, CategoryTabs, CustomizationModal, FilterBanner
  ui/                   - Button, Modal, BottomSheet
  debug/                - DebugPanel

stores/
  cartStore.ts          - Zustand cart state
  uiStore.ts            - Zustand UI state

lib/
  generated/prisma/     - Generated Prisma client
  prisma.ts             - Prisma singleton

prisma/
  schema.prisma         - Database schema
  seed.ts               - Menu seed data
```

---

## GitHub Repository

https://github.com/stefman1234/McDonalds-Avatar-Ordering-System---AWS-Rebuild.git
