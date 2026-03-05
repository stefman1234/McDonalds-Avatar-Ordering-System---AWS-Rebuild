# McDonald's Avatar Ordering System - Project Memory

## Project Overview
AI-powered McDonald's ordering kiosk with a conversational avatar named "Casey". Users order via voice (speech-to-text) or visual menu carousel. Built as a portrait-mode kiosk app (1080x1920).

## Repositories
- **Original (Supabase/Vercel)**: `stefman1234/mcdonalds-avatar` on GitHub
  - Local clone: `c:\Users\User\Desktop\mcdo main\mcdonalds-avatar-latest\`
  - Latest commit: `6d8ebfe` "Switch to GPT-4o-mini and fix complete meal cart addition"
- **AWS Rebuild**: `stefman1234/McDonalds-Avatar-Ordering-System---AWS-Rebuild` on GitHub
  - Local folder: `c:\Users\User\Desktop\mcdo main\McDonalds Avatar Ordering System - AWS Rebuild\`
  - Contains: AWS_REBUILD_PLAN.md (comprehensive 19-section rebuild plan, v2.2)

## AWS Rebuild - Key Decisions (v2.2)
- **Compute**: EC2 t3.micro (2 vCPU, 1GB RAM, ~$8/month) + Nginx + PM2
- **Database**: RDS db.t4g.micro PostgreSQL 15 (~$13/month) — cheapest for demo
- **Cache/Sessions**: DynamoDB on-demand (~$0/month at kiosk scale)
- **CDN**: CloudFront for SSL + static assets
- **DNS**: Cloudflare (to be configured by user later)
- **Avatar**: Klleon SDK handles avatar + TTS + STT (confirmed STT interception works)
- **NLP**: OpenAI GPT-4o-mini with RAG pattern (menu retrieved from DB, injected into prompt)
- **Streaming**: OpenAI streaming server-side, buffered before echo() — Klleon does NOT support streaming TTS
- **Payment**: Mock payment system
- **No FastAPI, No ALB, No RDS Proxy**: Single Next.js on EC2, Prisma connection pooling
- **CI/CD**: GitHub Actions → SSH deploy to EC2
- **Klleon costs**: Special arrangement, not factored in
- **Estimated AWS cost**: ~$33/month
- **UI Philosophy**: Minimal & contextual — avatar-first, bottom sheets on demand, no permanent panels

## Original Tech Stack
- **Framework**: Next.js 15 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS with McDonald's branding (Red #DA291C, Yellow #FFC72C)
- **Avatar/TTS**: Klleon SDK v1.2.0 (`echo()` for TTS)
- **STT**: Browser Web Speech API (BrowserSTT class) — replaced by Klleon native STT in rebuild
- **NLP/LLM**: OpenAI GPT-4o-mini (was Gemini, switched in latest commit)
- **Fuzzy Matching**: Fuse.js for menu item matching
- **Database**: PostgreSQL via Supabase + Prisma ORM
- **State**: Zustand with localStorage persistence
- **Hosting**: Vercel (replaced by AWS in rebuild)

## Key Architecture
See [architecture.md](architecture.md) for full file structure and data flow diagrams.

## Key Patterns
- `echo()` not `sendTextMessage()` — avoids triggering Klleon's built-in LLM
- Minimal UI: Avatar-first, bottom sheets for menu/order (not permanent panels)
- 30s inactivity timeout clears cart
- Meal customization state machine: meal_size -> meal_side -> meal_drink -> ice_level -> complete
- Tax rate: 8.25%, Meal upcharge: $2.50 base + $1.00 large
- Cart persisted in localStorage under key `mcdonalds-cart-storage`
- RAG pattern: DB menu -> DynamoDB cache -> inject into GPT prompt -> parse order

## Current Status
- Original app: Phases 0-6 complete (foundation through voice ordering)
- AWS Rebuild: Planning complete (v2.2), ready to start Phase 0 (AWS Infrastructure)
- Region: ap-southeast-1 (Singapore)
