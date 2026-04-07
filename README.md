# faworra-new

This repository is the scaffold for **Faworra**. It started from Better-T-Stack, but the target architecture now leans heavily on **Midday's proven app/package patterns** while using **Better Auth** instead of Supabase Auth.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **Supabase Postgres** - Database platform
- **Authentication** - Better Auth
- **Onboarding flow** - creates a team, owner membership, team settings, and active team context after signup
- **Biome** - Linting and formatting
- **PWA** - Progressive Web App support
- **Turborepo** - Optimized monorepo build system

## Current Architecture Direction

- `apps/dashboard` - main authenticated product app
- `apps/api` - Hono + tRPC API app
- `apps/mobile` - Expo mobile scaffold
- `apps/docs` - docs surface kept for now

### Midday-first rule

- Midday is the default source of truth for app/package boundaries, routing, middleware, request context, onboarding shape, and team patterns.
- Check Midday's organization and implementation patterns before introducing a Faworra-specific structure.
- Only deviate when Midday is genuinely unclear for the use case or when Better Auth requires a concrete adaptation.
- Ask for clarification only after checking Midday and only when the decision is still not clear.

### Core platform decisions

- **Authentication provider:** Better Auth
- **Auth architecture pattern:** Midday-style route gating, request context, and protected procedures adapted to Better Auth + Next 16 proxy
- **Database:** Supabase Postgres
- **ORM:** Drizzle
- **Multi-tenancy:** Midday-style team model from day one
- **Local dev URLs:** Portless with role-based names

### Current Phase 1 progress

#### Completed

- app rename completed: `dashboard`, `api`, `mobile`, `docs`
- scripts/docs/path references updated to the renamed app structure
- docs app Biome conflict removed
- Portless wired into dashboard/API/docs dev scripts
- dashboard route gating now uses a Next 16 `proxy.ts` with Better Auth session-cookie checks
- API/tRPC context now resolves `session -> userId -> activeTeam -> membership` centrally
- signup now routes into an industry-neutral onboarding flow that bootstraps team, membership, settings, and active team
- targeted validation completed with `bun run check-types` and `bun x ultracite check packages/api/src apps/dashboard/src`

#### Still open

- multi-membership team switching once invites and additional memberships exist

### Current onboarding flow

- A new user signs up in `apps/dashboard`
- They are redirected to `/onboarding`
- Onboarding collects company name, base currency, and country code
- The bootstrap transaction creates:
  - a `teams` row
  - an owner `team_memberships` row
  - a `team_settings` row with `industry_key = null` (industry configuration deferred to `packages/industry-config`)
  - a `user_context` row with `activeMembershipId` as the primary active-workspace pointer and `activeTeamId` kept as a compatibility fallback during the migration window
- Authenticated users without an active team are redirected into onboarding before they can use `/dashboard`

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses Supabase Postgres with Drizzle ORM.

1. Make sure you have a Supabase Postgres database set up.
2. Update your `apps/api/.env` file with your database connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Portless is now wired into the dashboard, API, and docs dev scripts. Running `bun run dev` or the app-specific dev scripts will register stable local URLs such as:

- `dashboard.faworra.localhost`
- `api.faworra.localhost`
- `docs.faworra.localhost`

Local auth and dashboard/API communication are expected to use the `*.faworra.localhost` subdomain contract in development.

Portless currently supports macOS and Linux. On Windows, the dev scripts automatically fall back to the legacy localhost ports while keeping the repo Portless-ready.

The mobile app still uses Expo's normal local development flow for now. Use the Expo Go app to run it.

### Local auth and billing envs

For local API boot and Polar checkout, `apps/api/.env` must include:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `POLAR_ACCESS_TOKEN`
- `POLAR_PRO_PRODUCT_ID`
- `POLAR_SUCCESS_URL`
- `CORS_ORIGIN`

For the dashboard, `apps/dashboard/.env` must include:

- `NEXT_PUBLIC_SERVER_URL`

`POLAR_PRO_PRODUCT_ID` must be a real Polar product id for the `pro` plan. The API now rejects the old placeholder value `your-product-id` so checkout misconfiguration fails fast.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/dashboard/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@faworra-new/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/dashboard`.

## Git Hooks and Formatting

- Repo-wide lint/format check: `bun run check`
- Targeted lint/format check for the auth/team flow: `bun x ultracite check packages/api/src apps/dashboard/src`

## Project Structure

```
faworra-new/
├── apps/
│   ├── dashboard/   # Main authenticated product app (Next.js)
│   ├── mobile/      # Mobile application (React Native, Expo)
│   ├── api/         # Backend API (Hono, tRPC)
│   └── docs/        # Documentation surface
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:dashboard`: Start only the dashboard app
- `bun run dev:api`: Start only the API app
- `bun run dev:docs`: Start only the docs app
- `bun run check-types`: Check TypeScript types across all apps
- `bun run dev:mobile`: Start the React Native/Expo development server
- `bun run portless:list`: Show active Portless routes
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Biome formatting and linting
- `cd apps/dashboard && bun run generate-pwa-assets`: Generate PWA assets
