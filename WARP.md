# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core Commands

All commands are run from the project root.

### Development & Build
- `npm run dev` – Start the Next.js 15 App Router dev server on `http://localhost:3000`.
- `npm run build` – Production build.
- `npm run start` – Start the production server (after `npm run build`).
- `npm run lint` – Run ESLint for the entire project.

### Database & Admin Utilities (Drizzle + Xata/Vercel Postgres)
- `npm run db:generate` – Generate Drizzle migrations from `src/lib/db/schema.ts` into `drizzle/migrations/`.
- `npm run db:migrate` – Apply migrations (preferred for safer, stepwise migrations).
- `npm run db:push` – Push the current schema directly to the database (used heavily in docs for dev / initial setup).
- `npm run db:studio` – Open Drizzle Studio to inspect and edit data.
- `npm run db:seed` – Seed CISSP content (domains, topics, decks, sample flashcards). Requires a valid admin user ID configured in `scripts/seed-cissp-content.ts`.
- `npm run check-admin` – Script to inspect admin status for a given user (see `scripts/check-admin-status.ts`).
- `npm run make-admin` – Promote a user to admin (see `scripts/make-admin.ts`).

### Tests
There is currently no dedicated test runner configured (no Jest/Vitest/Playwright config or `test` npm script). If you add tests, prefer a single `npm test` entry point and document how to run an individual test file (e.g. `npx vitest path/to/file.test.ts`) here.

## Environment & Infrastructure

Key environment variables (see `README.md`, `SETUP.md`, and `.env.example` for full lists):
- Authentication (Clerk): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, and related redirect URLs.
- Payments (Stripe): `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the three price IDs for monthly/yearly/lifetime plans.
- Database: `DATABASE_URL` / `POSTGRES_URL` pointing to Xata or other Postgres-compatible provider; additional `POSTGRES_*` URLs for specific drivers.
- App config: `NEXT_PUBLIC_APP_URL` for absolute URLs in the UI and webhooks.
- Observability & security: `NEXT_PUBLIC_SENTRY_DSN`, Sentry auth/org/project env vars, plus any Redis / rate limit configuration variables described in the security and performance docs.

In production (e.g. Vercel), all of these must be set in the hosting platform’s env configuration; local dev uses `.env.local`.

## High-Level Architecture

### Overall
- Next.js 15 App Router project using `src/` with:
  - Route groups for authentication and dashboard flows.
  - API route handlers for domains, progress tracking, admin flashcard management, and analytics.
- Core business logic (flashcards, progress, subscriptions, security) lives in `src/lib/**` and is consumed by both server components and API routes.
- Data is stored in PostgreSQL (Xata-compatible) via Drizzle ORM, with a schema designed around CISSP domains, content, and user progress.

### Routing & Pages
- **App Router structure** (from `README.md`, `DEVELOPMENT_LOG.md`, and `IMPLEMENTATION_SUMMARY.md`):
  - `src/app/(auth)/…` – Sign-in and sign-up flows powered by Clerk.
  - `src/app/(dashboard)/dashboard`, `domains`, `progress`, `billing` – Authenticated user experience: dashboard overview, domain listing, study views, and billing UI.
  - `src/app/admin/**` – Admin area with a dedicated layout providing navigation between:
    - Overview dashboard (high-level stats).
    - Flashcard management (CRUD for flashcards with difficulty, explanation, deck assignment, and publish flags).
    - User analytics (per-user/domain study statistics, streaks, and mastery breakdowns).
  - `src/app/api/**` – Route handlers providing a thin HTTP layer over lib logic:
    - Public authenticated APIs (for regular users): fetch domains and flashcards, submit and read card/domain progress.
    - Admin APIs: manage flashcards and retrieve analytics.
    - Webhooks: Clerk and Stripe webhooks for user sync and subscription/payment events.
  - Global middleware (`src/middleware.ts`) – Centralizes route protection, security headers, CORS handling, and other cross-cutting concerns.

### Data & Domain Layer
- **Drizzle ORM schema** (`src/lib/db/schema.ts`): models the CISSP learning domain.
  - Core entities: `domains`, `topics`, `decks`, `flashcards` (admin-managed content hierarchy).
  - User/finance entities: `users`, `subscriptions`, `payments` (Clerk + Stripe integration and subscription state).
  - Progress entities: `user_card_progress`, `deck_progress`, `user_stats`, `study_sessions`, `session_cards` (confidence scores, mastery state, daily limits, and analytics).
- **Database client** (`src/lib/db/index.ts`): wraps a Postgres driver (postgres-js) with Drizzle, configured via `drizzle.config.ts` and `drizzle/migrations`.
- **Seeding & admin helpers** (`scripts/seed-cissp-content.ts`, admin status scripts): encode how CISSP content is structured and how admin roles are established.

### Auth, Access Control, and Payments
- **Clerk** is the source of truth for identity; users are mirrored into the `users` table via Clerk webhooks.
- **Role-based access** is implemented in `src/lib/auth/admin.ts`, which exposes helpers (`requireAdmin`, etc.) used in admin routes and APIs.
- **Stripe** integration (documented in `README.md` and `DEVELOPMENT_LOG.md`):
  - Products and price IDs for the three paid tiers.
  - Webhook route(s) under `src/app/api/webhooks/stripe/` that update subscriptions and payments.
  - Client-side helpers under `src/lib/stripe/**` (for checkout and customer portal flows).

### Learning Logic & UX
- **Confidence-based spaced repetition** is implemented in the progress APIs and supporting lib modules:
  - Users rate cards 1–5; this drives `user_card_progress` updates and next-review scheduling.
  - Mastery states (e.g. new → learning → mastered) and daily card limits (free vs pro) are computed from the progress tables and `user_stats`.
- **Dashboard and domain study pages** consume these APIs to render domain summaries, per-domain progress, and interactive flashcard study sessions.

### Observability, Security, and Performance
- **Error handling & logging** (see `ERROR_HANDLING_SETUP.md`):
  - Sentry is integrated via `@sentry/nextjs` and configured in `next.config.ts`.
  - A centralized API error handler and logger (`src/lib/api/error-handler`, `src/lib/logger`) replace ad-hoc `console.error` calls.
  - Helpers wrap route handlers (`withErrorHandling`) and provide structured logging with timers and contextual metadata.
- **Security hardening** (see `OWASP_SECURITY_COMPLIANCE.md`):
  - Security middleware applies CSP, HSTS, frame, content-type, referrer, and permissions policies globally.
  - Request validation middleware enforces size limits and performs basic sanitization/defense-in-depth checks.
  - Audit logging records auth, authorization, rate limiting, and other security-relevant events.
  - Environment validation ensures required secrets and URLs are present and well-formed before startup, particularly in production.
- **Performance & caching** (see `SSR_MIGRATION.md`, `REDIS_CACHE.md`, `PERFORMANCE*.md`):
  - Hot paths (e.g. class/detail and dashboard views) have been migrated to server components with SSR and Redis-backed caching to reduce LCP.
  - There are dedicated modules for Redis-backed caching and rate limiting, and performance tuning has focused on minimizing N+1 queries and expensive client-side rendering.

## How Future Agents Should Work in This Codebase

- Prefer implementing business logic in `src/lib/**` (db, auth, security, algorithms) and keep API route handlers and components thin.
- When adding or modifying database tables, update `src/lib/db/schema.ts`, regenerate migrations with `npm run db:generate`, then apply via `npm run db:migrate` or `npm run db:push` as appropriate, and adjust seed scripts if the content model changes.
- For new admin or analytics capabilities, follow the existing admin module pattern:
  - Add APIs under `src/app/api/admin/**` using `requireAdmin` and the centralized error/logging helpers.
  - Add UI under `src/app/admin/**` using the existing layout and design system.
- For new user-facing study features, integrate with the existing progress model (card/domain/deck-level progress and daily limits) instead of inventing parallel tracking.
- Maintain Sentry/error-handling, security middleware, and audit logging conventions when introducing new routes or background tasks so that security and observability remain consistent.
