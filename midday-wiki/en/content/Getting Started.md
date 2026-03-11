# Getting Started

<cite>
**Referenced Files in This Document**
- [README.md](file://midday/README.md)
- [package.json](file://midday/package.json)
- [bunfig.toml](file://midday/bunfig.toml)
- [apps/api/.env-template](file://midday/apps/api/.env-template)
- [apps/api/package.json](file://midday/apps/api/package.json)
- [apps/api/Dockerfile](file://midday/apps/api/Dockerfile)
- [apps/api/src/index.ts](file://midday/apps/api/src/index.ts)
- [apps/dashboard/.env-example](file://midday/apps/dashboard/.env-example)
- [apps/dashboard/package.json](file://midday/apps/dashboard/package.json)
- [apps/dashboard/Dockerfile](file://midday/apps/dashboard/Dockerfile)
- [apps/dashboard/src/middleware.ts](file://midday/apps/dashboard/src/middleware.ts)
- [apps/desktop/package.json](file://midday/apps/desktop/package.json)
- [apps/desktop/src/main.tsx](file://midday/apps/desktop/src/main.tsx)
- [apps/worker/package.json](file://midday/apps/worker/package.json)
- [packages/db/drizzle.config.ts](file://midday/packages/db/drizzle.config.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites and System Requirements](#prerequisites-and-system-requirements)
3. [Installation and Setup](#installation-and-setup)
4. [Environment Configuration](#environment-configuration)
5. [Initial Project Configuration](#initial-project-configuration)
6. [Development Environment Setup](#development-environment-setup)
7. [Local Development Server Startup](#local-development-server-startup)
8. [Verification and Basic Functionality Testing](#verification-and-basic-functionality-testing)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Conclusion](#conclusion)

## Introduction
This guide helps you set up Faworra (formerly Midday) locally for development across web, desktop, and API components. It covers prerequisites, installation, environment configuration, initial setup, and local server startup. It also includes verification steps and troubleshooting tips for common issues.

## Prerequisites and System Requirements
- Operating system: Windows, macOS, or Linux
- Package manager: Bun 1.3.x recommended
- Node.js compatibility: Managed via Bun; no separate Node.js required
- Ports: Ensure ports 3000–3003 are free for local services
- Optional: Redis server for caching and queues
- Optional: Supabase project for auth, database, storage, and realtime
- Optional: External integrations (Plaid, GoCardless, Teller, Stripe, etc.) as needed

**Section sources**
- [README.md](file://midday/README.md#L44-L75)
- [package.json](file://midday/package.json#L26-L26)

## Installation and Setup
Follow these steps to clone and prepare the repository:

1. Clone the repository to your machine.
2. Install dependencies using Bun:
   - Run: bun install
   - Linker mode is hoisted by default for faster installs.

Notes:
- Workspaces are defined in the monorepo root.
- The project uses a hoisted linker to optimize dependency installation.

**Section sources**
- [package.json](file://midday/package.json#L4-L7)
- [bunfig.toml](file://midday/bunfig.toml#L1-L3)

## Environment Configuration
Configure environment variables per component. Templates and examples are provided below.

### API Environment Variables
- Copy the template to a local .env file and fill in values:
  - [apps/api/.env-template](file://midday/apps/api/.env-template#L1-L149)
- Key areas to configure:
  - Authentication and Supabase: SUPABASE_URL, SUPABASE_JWT_SECRET, SUPABASE_SERVICE_KEY
  - Database: DATABASE_* URLs and DATABASE_SESSION_POOLER
  - External providers: Plaid, GoCardless, EnableBanking, Teller, Resend, Stripe, etc.
  - CORS and origins: ALLOWED_API_ORIGINS, MIDDAY_DASHBOARD_URL
  - Redis: REDIS_URL, REDIS_QUEUE_URL
  - Logging and debug: LOG_LEVEL, LOG_PRETTY

Verification tip:
- Confirm that ALLOWED_API_ORIGINS includes the dashboard URL for local development.

**Section sources**
- [apps/api/.env-template](file://midday/apps/api/.env-template#L1-L149)

### Dashboard Environment Variables
- Copy the example to a local .env file and fill in values:
  - [apps/dashboard/.env-example](file://midday/apps/dashboard/.env-example#L1-L87)
- Key areas to configure:
  - Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
  - API base URL: NEXT_PUBLIC_API_URL
  - Redis: REDIS_URL
  - Providers: Plaid, Teller, OpenAI, OpenPanel, Stripe, etc.
  - Encryption: NEXT_SERVER_ACTIONS_ENCRYPTION_KEY (must be identical across replicas)

**Section sources**
- [apps/dashboard/.env-example](file://midday/apps/dashboard/.env-example#L1-L87)

### Website Environment Variables
- Copy the template to a local .env file and fill in values:
  - [apps/website/.env-template](file://midday/apps/website/.env-template#L1-L5)
- Key areas to configure:
  - Upstash Redis: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
  - OpenPanel: NEXT_PUBLIC_OPENPANEL_CLIENT_ID
  - Resend: RESEND_API_KEY, RESEND_AUDIENCE_ID

**Section sources**
- [apps/website/.env-template](file://midday/apps/website/.env-template#L1-L5)

## Initial Project Configuration
Configure the database and migrations:

1. Set the database session pooler URL:
   - DATABASE_SESSION_POOLER in the API environment file
   - See: [apps/api/.env-template](file://midday/apps/api/.env-template#L17-L18)

2. Configure Drizzle:
   - Drizzle reads DATABASE_SESSION_POOLER from the environment
   - See: [packages/db/drizzle.config.ts](file://midday/packages/db/drizzle.config.ts#L7-L9)

3. Apply migrations:
   - Use drizzle-kit commands to generate and apply migrations
   - Example command (run from repository root):
     - npx drizzle-kit generate && npx drizzle-kit migrate

Note:
- Ensure the database is reachable and credentials are correct before running migrations.

**Section sources**
- [apps/api/.env-template](file://midday/apps/api/.env-template#L17-L18)
- [packages/db/drizzle.config.ts](file://midday/packages/db/drizzle.config.ts#L7-L9)

## Development Environment Setup
Set up your local development environment:

1. Install dependencies:
   - From the repository root, run: bun install

2. Choose your preferred development approach:
   - Single-command monorepo dev: bun run dev
     - Starts all apps in parallel
   - Per-app dev:
     - API: bun run dev --filter=@midday/api
     - Dashboard: bun run dev --filter=@midday/dashboard
     - Website: bun run dev --filter=@midday/website
     - Desktop: bun run dev --filter=@midday/desktop
     - Worker: bun run dev --filter=@midday/worker

3. Formatting and linting:
   - Format: bun run format
   - Lint: bun run lint
   - Typecheck: bun run typecheck

4. Optional: Use Tauri for desktop builds
   - Desktop scripts are defined in the desktop app package.json
   - See: [apps/desktop/package.json](file://midday/apps/desktop/package.json#L6-L16)

**Section sources**
- [package.json](file://midday/package.json#L8-L24)
- [apps/desktop/package.json](file://midday/apps/desktop/package.json#L6-L16)

## Local Development Server Startup
Start the local development servers for each component:

### API Server
- Port: 3003 (default)
- Start: bun run dev in the API app
- Health checks:
  - GET /health
  - GET /health/ready
  - GET /health/dependencies

References:
- [apps/api/package.json](file://midday/apps/api/package.json#L4-L4)
- [apps/api/src/index.ts](file://midday/apps/api/src/index.ts#L118-L130)

### Dashboard (Next.js)
- Port: 3001 (default)
- Start: bun run dev in the dashboard app
- Middleware enforces session and redirects unauthenticated users to /login

References:
- [apps/dashboard/package.json](file://midday/apps/dashboard/package.json#L8-L8)
- [apps/dashboard/src/middleware.ts](file://midday/apps/dashboard/src/middleware.ts#L13-L81)

### Website (Next.js)
- Start: bun run dev in the website app
- Environment variables are loaded from .env

References:
- [apps/website/.env-template](file://midday/apps/website/.env-template#L1-L5)

### Desktop (Tauri)
- Start: bun run tauri:dev (development mode)
- Build variants:
  - dev, staging, prod

References:
- [apps/desktop/package.json](file://midday/apps/desktop/package.json#L11-L16)
- [apps/desktop/src/main.tsx](file://midday/apps/desktop/src/main.tsx#L1-L9)

### Worker
- Start: bun run dev in the worker app
- Background jobs and queue processing

References:
- [apps/worker/package.json](file://midday/apps/worker/package.json#L6-L6)

## Verification and Basic Functionality Testing
Perform these checks to confirm a successful setup:

1. API health endpoints
   - curl http://localhost:3003/health
   - curl http://localhost:3003/health/ready
   - curl http://localhost:3003/health/dependencies

2. Dashboard accessibility
   - Visit http://localhost:3001
   - Verify middleware redirects unauthenticated requests to /login

3. OpenAPI documentation
   - Visit http://localhost:3003 to view the interactive API reference

4. Database connectivity
   - Confirm DATABASE_SESSION_POOLER is set and migrations applied
   - Check pool stats logs if enabled

5. Desktop app
   - Run bun run tauri:dev and verify the app starts

6. Worker
   - Start the worker and confirm it runs without errors

**Section sources**
- [apps/api/src/index.ts](file://midday/apps/api/src/index.ts#L118-L176)
- [apps/dashboard/src/middleware.ts](file://midday/apps/dashboard/src/middleware.ts#L13-L81)
- [apps/api/.env-template](file://midday/apps/api/.env-template#L17-L18)

## Troubleshooting Guide
Common issues and resolutions:

- Port conflicts
  - If ports 3000–3003 are in use, change the PORT or stop conflicting services
  - References: [apps/api/src/index.ts](file://midday/apps/api/src/index.ts#L282-L287), [apps/dashboard/package.json](file://midday/apps/dashboard/package.json#L8-L8)

- CORS errors
  - Ensure ALLOWED_API_ORIGINS includes the dashboard URL
  - Reference: [apps/api/.env-template](file://midday/apps/api/.env-template#L46-L46)

- Supabase configuration
  - Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the dashboard
  - Verify SUPABASE_URL, SUPABASE_JWT_SECRET, SUPABASE_SERVICE_KEY in the API
  - References: [apps/dashboard/.env-example](file://midday/apps/dashboard/.env-example#L1-L7), [apps/api/.env-template](file://midday/apps/api/.env-template#L4-L8)

- Database connectivity
  - Confirm DATABASE_SESSION_POOLER is set and reachable
  - Run migrations using drizzle-kit
  - Reference: [packages/db/drizzle.config.ts](file://midday/packages/db/drizzle.config.ts#L7-L9)

- Redis connectivity
  - Set REDIS_URL and REDIS_QUEUE_URL for API and worker
  - Reference: [apps/api/.env-template](file://midday/apps/api/.env-template#L64-L71)

- Middleware redirect loops
  - Ensure NEXT_PUBLIC_URL matches the dashboard origin
  - Reference: [apps/dashboard/src/middleware.ts](file://midday/apps/dashboard/src/middleware.ts#L5-L5)

- Desktop app not starting
  - Ensure Tauri CLI is installed and dev environment is configured
  - Reference: [apps/desktop/package.json](file://midday/apps/desktop/package.json#L11-L16)

- Worker not processing jobs
  - Confirm Redis connectivity and queue configuration
  - Reference: [apps/worker/package.json](file://midday/apps/worker/package.json#L6-L6)

## Conclusion
You now have the fundamentals to run Faworra locally across web, desktop, API, and worker components. Use the environment templates to configure services, apply database migrations, and start the development servers. For deeper integration with external services, expand the environment variables accordingly and consult the service-specific documentation linked in the repository.