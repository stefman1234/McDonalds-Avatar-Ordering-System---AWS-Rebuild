# McDonald's Avatar Ordering System - Project Memory

## Project Overview
AI-powered McDonald's ordering kiosk with a conversational avatar named "Casey". Users order via voice (speech-to-text) or visual menu carousel. Built as a portrait-mode kiosk app (1080x1920).

## Repositories
- **Original (Supabase/Vercel)**: `stefman1234/mcdonalds-avatar` on GitHub
  - Local clone: `c:\Users\User\Desktop\mcdo main\mcdonalds-avatar-latest\`
  - Latest commit: `6d8ebfe` "Switch to GPT-4o-mini and fix complete meal cart addition"
- **AWS Rebuild (NEW)**: `stefman1234/McDonalds-Avatar-Ordering-System---AWS-Rebuild` on GitHub
  - Local folder: `c:\Users\User\Desktop\mcdo main\McDonalds Avatar Ordering System - AWS Rebuild\`
  - Contains: AWS_REBUILD_PLAN.md (comprehensive 18-section rebuild plan)

## AWS Rebuild - Key Decisions
- **Compute**: ECS Fargate Spot (0.5 vCPU, 1GB RAM) — no Lambda cold starts
- **Database**: Aurora Serverless v2 (PostgreSQL 15, 0.5-2 ACU) + RDS Proxy
- **Cache/Sessions**: DynamoDB on-demand (native AWS, ~$0/month at kiosk scale)
- **CDN**: CloudFront for SSL + static assets
- **Avatar**: Klleon SDK handles avatar + TTS + STT (no more BrowserSTT workaround)
- **NLP**: OpenAI GPT-4o-mini (switched from Gemini in latest code)
- **Streaming**: OpenAI streaming enabled server-side, but buffered before echo() — Klleon does NOT support streaming TTS
- **Payment**: Mock payment system (not real Stripe)
- **No FastAPI**: Single Next.js deployment handles everything
- **Estimated cost**: ~$315-1,115/month (mostly Klleon)

## Original Tech Stack
- **Framework**: Next.js 15 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS with McDonald's branding (Red #DA291C, Yellow #FFC72C)
- **Avatar/TTS**: Klleon SDK v1.2.0 (`echo()` for TTS)
- **STT**: Browser Web Speech API (BrowserSTT class) — to be replaced by Klleon native STT
- **NLP/LLM**: OpenAI GPT-4o-mini (was Gemini, switched in latest commit)
- **Fuzzy Matching**: Fuse.js for menu item matching
- **Database**: PostgreSQL via Supabase + Prisma ORM
- **State**: Zustand with localStorage persistence
- **Hosting**: Vercel (to be replaced by AWS)

## Key Architecture
See [architecture.md](architecture.md) for full file structure and data flow diagrams.

## Key Patterns
- `echo()` not `sendTextMessage()` — avoids triggering Klleon's built-in LLM
- Theater mode: 65% avatar / 35% menu carousel
- 30s inactivity timeout clears cart
- Meal customization state machine: meal_size -> meal_side -> meal_drink -> ice_level -> complete
- Tax rate: 8.25%, Meal upcharge: $2.50 base + $1.00 large
- Cart persisted in localStorage under key `mcdonalds-cart-storage`

## Current Status
- Original app: Phases 0-6 complete (foundation through voice ordering)
- AWS Rebuild: Planning complete, ready to start Phase 0 (AWS Infrastructure)
