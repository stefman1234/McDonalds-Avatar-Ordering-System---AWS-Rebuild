# McDonald's Avatar Ordering System

An AI-powered ordering kiosk featuring a conversational avatar for McDonald's-style quick service restaurants.

## Features

- 🎭 **AI Avatar** - Powered by Klleon SDK with speech-to-text and text-to-speech
- 🧠 **Natural Language Processing** - Google Gemini Flash for order understanding
- 🍔 **Complete Menu** - 60+ items including burgers, sides, drinks, and desserts
- 🛒 **Smart Cart System** - With customizations and combo meals
- 💳 **Payment Integration** - Stripe (simulated for development)
- 📊 **Admin Dashboard** - Order management and analytics

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript** (Strict Mode)
- **Tailwind CSS**

### Avatar & Speech
- **Klleon SDK** - Avatar rendering, STT, and TTS

### AI & NLP
- **Google Gemini Flash** - Order parsing and response generation
- **compromise.js** - Pattern matching for simple orders

### Database
- **PostgreSQL** via **Supabase**

### Payments
- **Stripe** (Simulated in development)

## Project Structure

```
mcdonalds-avatar/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout (includes Klleon SDK)
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Avatar/           # Avatar-related components
│   ├── Menu/             # Menu display
│   ├── Cart/             # Shopping cart
│   ├── Customization/    # Item customization
│   └── UI/               # Reusable UI components
├── lib/                   # Utilities and business logic
│   ├── supabase/         # Database utilities
│   ├── llm/              # LLM abstraction layer
│   ├── nlp/              # NLP parsing
│   ├── stores/           # Zustand stores
│   ├── klleon/           # Klleon SDK utilities
│   └── utils/            # Helper functions
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Klleon SDK account
- Google Gemini API key

### Installation

1. **Clone the repository** (if from Git)
   ```bash
   git clone <repo-url>
   cd mcdonalds-avatar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in your API keys and credentials

4. **Install additional dependencies**
   ```bash
   npm install @google/generative-ai @supabase/supabase-js zustand
   npm install framer-motion compromise
   npm install @radix-ui/react-dialog @radix-ui/react-select
   ```

5. **Set up database**
   - Create Supabase project
   - Run SQL schema from `Documentation/DATABASE_SCHEMA.md`
   - Update Supabase credentials in `.env.local`

6. **Run development server**
   ```bash
   npm run dev
   ```

7. **Open browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Development Timeline

- ✅ **Phase 0** - Project Setup (Complete)
- 🔄 **Phase 1** - Database & Core Setup
- ⏳ **Phase 2** - Menu API & UI
- ⏳ **Phase 3** - Cart System
- ⏳ **Phase 4** - Basic Checkout
- ⏳ **Phase 5** - Klleon Avatar Integration
- ⏳ **Phase 6** - NLP Integration (Gemini)
- ⏳ **Phase 7** - Advanced Features
- ⏳ **Phase 8** - Polish & Optimization
- ⏳ **Phase 9** - Payments & Admin
- ⏳ **Phase 10** - Deployment

## Environment Variables

See `.env.example` for all required environment variables.

### Required Keys:
- `NEXT_PUBLIC_KLLEON_SDK_KEY` - From Klleon Studio
- `NEXT_PUBLIC_KLLEON_AVATAR_ID` - From Klleon Studio
- `GOOGLE_API_KEY` - From Google AI Studio
- `NEXT_PUBLIC_SUPABASE_URL` - From Supabase dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - From Supabase dashboard

## Cost Estimates (10,000 orders/month)

- Klleon SDK: TBD (contact Klleon)
- Google Gemini Flash: ~$3/month
- Supabase: $0-25/month
- Vercel Hosting: $0-20/month
- **Total: ~$28-48/month** (+ Klleon fees)

## Documentation

Complete project documentation is available in the `Documentation/` folder:
- Project specifications
- Database schema
- API endpoints
- Implementation phases
- Avatar persona guide

## Development Status

**Current Phase:** Phase 0.1 Complete ✅
**Next:** Install dependencies and configure TypeScript

---

**Version:** 0.1.0
**Last Updated:** 2025-11-11
**Status:** In Development
