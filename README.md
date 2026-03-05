# McDonald's Avatar Ordering System - AWS Rebuild

AI-powered McDonald's kiosk with a conversational avatar. Customers order via voice (speech-to-text) or touch menu. Built for portrait-mode kiosk displays (1080x1920).

## Quick Start

```bash
npm install
# Set up .env.local (see stuff.md for all keys)
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 15 | App framework (App Router) |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| Prisma 7 | PostgreSQL ORM |
| Zustand 5 | State management |
| Klleon SDK v1.2.0 | Avatar rendering, STT, TTS |
| OpenAI GPT-4o-mini | NLP order parsing |
| Fuse.js | Fuzzy menu matching |

## Architecture

```
Kiosk Browser (1080x1920 portrait)
  |
  +-- Next.js 15 (App Router)
  |     +-- /           Idle screen (tap to start)
  |     +-- /order      Main ordering (avatar + menu)
  |     +-- /checkout   Order type + payment
  |     +-- /confirmation  Order confirmed
  |     +-- /api/*      API routes
  |
  +-- Klleon SDK (avatar + voice)
  +-- OpenAI GPT-4o-mini (NLP)
  +-- PostgreSQL (menu, orders)
```

**Production target:** EC2 t3.micro + RDS db.t4g.micro + CloudFront (~$33/month)

## Project Structure

```
app/                    Pages and API routes
components/
  avatar/               AvatarContainer, ChatMessages, MicButton
  cart/                 CartButton, CartDrawer, CartItem, CartSummary
  menu/                 MenuSection, MenuCard, CategoryTabs, CustomizationModal
  ui/                   Button, Modal, BottomSheet
  debug/                DebugPanel
stores/                 Zustand stores (cart, UI)
lib/                    Database, NLP, Klleon, utilities
prisma/                 Schema and seed data
reference/              Old project versions (for reference)
```

## Documentation

- [stuff.md](stuff.md) - API keys, env vars, setup instructions
- [OUTSTANDING_FEATURES.md](OUTSTANDING_FEATURES.md) - Unbuilt features with implementation guides
- [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) - Step-by-step AWS deployment
- [AWS_REBUILD_PLAN.md](AWS_REBUILD_PLAN.md) - Full architecture and build plan (v2.2)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed menu data |

## How It Works

1. **Idle Screen** - Ad background with "Start Order" button
2. **Order Screen** - Avatar occupies top portion, menu carousel at bottom
3. **Voice Ordering** - Speak to avatar, Klleon STT transcribes, GPT-4o-mini parses intent, items added to cart
4. **Touch Ordering** - Browse categories, tap to add items, customize via modal
5. **Checkout** - Select dine-in/takeout, payment method, confirm
6. **Confirmation** - Order number displayed, auto-return to idle after 30s
