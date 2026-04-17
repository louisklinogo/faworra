# Architecture Overview

<cite>
**Referenced Files in This Document**
- [package.json](file://midday/package.json)
- [turbo.json](file://midday/turbo.json)
- [api/package.json](file://midday/apps/api/package.json)
- [api/src/index.ts](file://midday/apps/api/src/index.ts)
- [dashboard/package.json](file://midday/apps/dashboard/package.json)
- [desktop/package.json](file://midday/apps/desktop/package.json)
- [desktop/src/main.tsx](file://midday/apps/desktop/src/main.tsx)
- [worker/package.json](file://midday/apps/worker/package.json)
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts)
- [website/package.json](file://midday/apps/website/package.json)
- [website/src/app/layout.tsx](file://midday/apps/website/src/app/layout.tsx)
- [db/package.json](file://midday/packages/db/package.json)
- [trpc/package.json](file://midday/packages/trpc/package.json)
- [events/package.json](file://midday/packages/events/package.json)
- [jobs/package.json](file://midday/packages/jobs/package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes Faworra’s (Midday) system architecture as a modern monorepo built with a layered design pattern. The system comprises five main applications and twenty-five plus shared packages. The applications are:
- API (Hono-based backend with tRPC and REST)
- Dashboard (Next.js frontend)
- Desktop (Tauri desktop application)
- Worker (background job processing with BullMQ)
- Website (Next.js marketing site)

The shared packages encapsulate cross-cutting concerns such as database access, typed RPC, events/analytics, jobs orchestration, and UI utilities. The architecture follows a layered pattern separating presentation, business logic, and data access, while implementing microservices and event-driven patterns for scalability and resilience.

## Project Structure
The repository uses a monorepo layout managed by Turborepo and Bun. Workspaces define the five applications and the shared packages. Scripts enable parallel development and targeted builds per application.

```mermaid
graph TB
subgraph "Monorepo Root"
P["package.json<br/>workspaces: apps/*, packages/*"]
T["turbo.json<br/>task orchestration"]
end
subgraph "Applications"
API["@midday/api<br/>Hono + tRPC + REST"]
DASH["@midday/dashboard<br/>Next.js App Router"]
DESK["@midday/desktop<br/>Tauri + React"]
WORK["@midday/worker<br/>BullMQ + Hono"]
WEB["@midday/website<br/>Next.js Marketing"]
end
subgraph "Shared Packages"
DB["@midday/db<br/>PostgreSQL ORM + clients"]
TRPC["@midday/trpc<br/>typed RPC client/server"]
EVENTS["@midday/events<br/>analytics provider"]
JOBS["@midday/jobs<br/>job orchestration"]
UI["@midday/ui<br/>shared UI primitives"]
end
P --> API
P --> DASH
P --> DESK
P --> WORK
P --> WEB
T --> API
T --> DASH
T --> DESK
T --> WORK
T --> WEB
DASH --> API
DASH --> TRPC
DASH --> DB
DASH --> EVENTS
DASH --> UI
API --> DB
API --> TRPC
API --> JOBS
WORK --> DB
WORK --> JOBS
DESK --> DB
DESK --> TRPC
WEB --> UI
WEB --> EVENTS
```

**Diagram sources**
- [package.json](file://midday/package.json#L4-L7)
- [turbo.json](file://midday/turbo.json#L1-L87)
- [api/package.json](file://midday/apps/api/package.json#L28-L48)
- [dashboard/package.json](file://midday/apps/dashboard/package.json#L28-L39)
- [desktop/package.json](file://midday/apps/desktop/package.json#L18-L29)
- [worker/package.json](file://midday/apps/worker/package.json#L13-L35)
- [website/package.json](file://midday/apps/website/package.json#L13-L23)
- [db/package.json](file://midday/packages/db/package.json#L37-L53)
- [trpc/package.json](file://midday/packages/trpc/package.json#L17-L21)
- [events/package.json](file://midday/packages/events/package.json#L13-L23)
- [jobs/package.json](file://midday/packages/jobs/package.json#L16-L34)

**Section sources**
- [package.json](file://midday/package.json#L1-L70)
- [turbo.json](file://midday/turbo.json#L1-L87)

## Core Components
- API Application: Hono server exposing REST endpoints and tRPC routes, OpenAPI documentation, health/readiness probes, Sentry error reporting, and CORS/security middleware.
- Dashboard Application: Next.js App Router frontend consuming tRPC and REST APIs, integrating analytics, PDF generation, and Stripe for payments.
- Desktop Application: Tauri-based desktop client using React, with plugins for filesystem, dialogs, updater, and deep linking.
- Worker Application: Background job processor using BullMQ, Workbench admin UI, health checks, and centralized error handling.
- Website Application: Next.js marketing site with SEO, analytics, and content components.

Key shared packages:
- @midday/db: Drizzle ORM client, SQL utilities, API keys, search query builder, and health helpers.
- @midday/trpc: Typed RPC client/server exports for API communication.
- @midday/events: Analytics provider integration for client-side telemetry.
- @midday/jobs: Job orchestration and Trigger.dev integration.

**Section sources**
- [api/src/index.ts](file://midday/apps/api/src/index.ts#L26-L176)
- [dashboard/package.json](file://midday/apps/dashboard/package.json#L16-L97)
- [desktop/src/main.tsx](file://midday/apps/desktop/src/main.tsx#L1-L9)
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts#L25-L120)
- [website/src/app/layout.tsx](file://midday/apps/website/src/app/layout.tsx#L1-L153)
- [db/package.json](file://midday/packages/db/package.json#L21-L36)
- [trpc/package.json](file://midday/packages/trpc/package.json#L12-L16)
- [events/package.json](file://midday/packages/events/package.json#L19-L23)
- [jobs/package.json](file://midday/packages/jobs/package.json#L13-L15)

## Architecture Overview
The system follows a layered architecture:
- Presentation Layer: Dashboard (Next.js) and Website (Next.js) deliver user interfaces. Desktop (Tauri) provides native desktop UX.
- Business Logic Layer: API (Hono) exposes REST and tRPC endpoints; Worker handles background jobs; Shared packages encapsulate domain logic.
- Data Access Layer: @midday/db provides PostgreSQL access via Drizzle ORM and maintains separate clients for API and Worker contexts.

Microservices and event-driven characteristics:
- API and Worker operate as distinct services behind a shared data plane.
- Worker uses BullMQ queues and Workbench for observability and admin controls.
- Events/analytics are decoupled via @midday/events for client-side telemetry.

```mermaid
graph TB
subgraph "Presentation"
DASH["Dashboard (Next.js)"]
WEB["Website (Next.js)"]
DESK["Desktop (Tauri)"]
end
subgraph "Business Logic"
API["API (Hono)<br/>REST + tRPC"]
WORKER["Worker (BullMQ)<br/>Jobs + Workbench"]
JOBS_PKG["@midday/jobs"]
end
subgraph "Data Access"
DB_PKG["@midday/db<br/>ORM + clients"]
PG["PostgreSQL"]
end
subgraph "Observability"
TRPC_PKG["@midday/trpc"]
EVENTS_PKG["@midday/events"]
end
DASH --> API
DASH --> TRPC_PKG
WEB --> EVENTS_PKG
DESK --> API
DESK --> TRPC_PKG
API --> DB_PKG
WORKER --> DB_PKG
JOBS_PKG --> WORKER
DB_PKG --> PG
```

**Diagram sources**
- [api/src/index.ts](file://midday/apps/api/src/index.ts#L26-L176)
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts#L128-L200)
- [dashboard/package.json](file://midday/apps/dashboard/package.json#L28-L39)
- [desktop/package.json](file://midday/apps/desktop/package.json#L18-L29)
- [website/package.json](file://midday/apps/website/package.json#L13-L23)
- [db/package.json](file://midday/packages/db/package.json#L37-L53)
- [trpc/package.json](file://midday/packages/trpc/package.json#L17-L21)
- [events/package.json](file://midday/packages/events/package.json#L13-L23)
- [jobs/package.json](file://midday/packages/jobs/package.json#L16-L34)

## Detailed Component Analysis

### API Application
The API server initializes instrumentation, registers middleware (CORS, secure headers, logging), mounts tRPC and REST routers, and exposes health endpoints. It integrates Sentry for error reporting and manages graceful shutdown with database and Redis client cleanup.

```mermaid
sequenceDiagram
participant Client as "Dashboard/Web/Desktop"
participant API as "API (Hono)"
participant TRPC as "tRPC Server"
participant REST as "REST Routers"
participant DB as "@midday/db"
participant Sentry as "Sentry"
Client->>API : HTTP Request
API->>API : Apply CORS/Security/Logging
API->>TRPC : Route /trpc/*
TRPC->>DB : Execute queries
DB-->>TRPC : Results
TRPC-->>API : Response
API->>REST : Route REST endpoints
REST->>DB : Execute queries
DB-->>REST : Results
REST-->>API : Response
API-->>Client : HTTP Response
API->>Sentry : Capture errors/unhandled
```

**Diagram sources**
- [api/src/index.ts](file://midday/apps/api/src/index.ts#L26-L176)
- [api/src/index.ts](file://midday/apps/api/src/index.ts#L202-L211)
- [api/src/index.ts](file://midday/apps/api/src/index.ts#L262-L280)

**Section sources**
- [api/src/index.ts](file://midday/apps/api/src/index.ts#L26-L176)
- [api/src/index.ts](file://midday/apps/api/src/index.ts#L213-L288)

### Dashboard Application
The Dashboard is a Next.js application that consumes tRPC and REST endpoints, integrates analytics, PDF rendering, and payment providers. It relies on shared packages for UI, events, and Supabase integration.

```mermaid
flowchart TD
Start(["User Interaction"]) --> LoadPage["Load Next.js Page"]
LoadPage --> InitTRPC["Initialize tRPC Client"]
InitTRPC --> FetchData["Call tRPC/REST Endpoints"]
FetchData --> RenderUI["Render Components"]
RenderUI --> Actions["User Actions"]
Actions --> Mutate["Mutations via tRPC/REST"]
Mutate --> Update["State/UI Update"]
Update --> End(["Done"])
```

**Diagram sources**
- [dashboard/package.json](file://midday/apps/dashboard/package.json#L16-L97)

**Section sources**
- [dashboard/package.json](file://midday/apps/dashboard/package.json#L16-L97)

### Desktop Application
The Desktop app initializes a minimal React root and leverages Tauri plugins for OS-level features. It communicates with the API via tRPC and REST.

```mermaid
sequenceDiagram
participant User as "Desktop User"
participant App as "Desktop (Tauri)"
participant TRPC as "tRPC Client"
participant API as "API (Hono)"
User->>App : Launch App
App->>TRPC : Initialize client
App->>API : Authenticate/Authorize
API-->>App : Session/Token
App-->>User : Render UI
```

**Diagram sources**
- [desktop/src/main.tsx](file://midday/apps/desktop/src/main.tsx#L1-L9)
- [desktop/package.json](file://midday/apps/desktop/package.json#L18-L29)

**Section sources**
- [desktop/src/main.tsx](file://midday/apps/desktop/src/main.tsx#L1-L9)
- [desktop/package.json](file://midday/apps/desktop/package.json#L18-L29)

### Worker Application
The Worker creates BullMQ workers per queue configuration, registers schedulers, and exposes a Workbench admin UI. It includes centralized error handling and readiness checks.

```mermaid
flowchart TD
Start(["Worker Startup"]) --> Config["Load Queue Configurations"]
Config --> CreateWorkers["Create BullMQ Workers"]
CreateWorkers --> RegisterHandlers["Attach Error/Failed Handlers"]
RegisterHandlers --> InitWorkbench["Mount Workbench Admin"]
InitWorkbench --> Health["Expose Health/Info Endpoints"]
Health --> RunLoop["Listen for Jobs"]
RunLoop --> Process["Process Jobs via Processors"]
Process --> Complete["Mark Completed/Failures"]
Complete --> Shutdown["Graceful Shutdown on Signal"]
```

**Diagram sources**
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts#L25-L120)
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts#L128-L200)
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts#L232-L281)

**Section sources**
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts#L25-L120)
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts#L128-L200)
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts#L232-L312)

### Website Application
The Website is a Next.js marketing site that sets up analytics and global styles, integrating with shared UI and events packages.

```mermaid
sequenceDiagram
participant Visitor as "Website Visitor"
participant Site as "Website (Next.js)"
participant Events as "@midday/events"
Visitor->>Site : Visit Pages
Site->>Events : Initialize Analytics
Site-->>Visitor : Render Content
```

**Diagram sources**
- [website/src/app/layout.tsx](file://midday/apps/website/src/app/layout.tsx#L1-L153)
- [website/package.json](file://midday/apps/website/package.json#L13-L23)

**Section sources**
- [website/src/app/layout.tsx](file://midday/apps/website/src/app/layout.tsx#L1-L153)
- [website/package.json](file://midday/apps/website/package.json#L13-L23)

## Dependency Analysis
The monorepo enforces workspace-based dependencies among applications and shared packages. The API depends on @midday/db, @midday/trpc, @midday/jobs, and others. The Dashboard depends on @midday/api, @midday/trpc, @midday/db, and UI packages. The Worker depends on @midday/db and @midday/jobs. The Desktop depends on @midday/api and @midday/trpc. The Website depends on @midday/ui and @midday/events.

```mermaid
graph LR
API["@midday/api"] --> DB["@midday/db"]
API --> TRPC["@midday/trpc"]
API --> JOBS["@midday/jobs"]
DASH["@midday/dashboard"] --> API
DASH --> TRPC
DASH --> DB
DASH --> EVENTS["@midday/events"]
DASH --> UI["@midday/ui"]
DESK["@midday/desktop"] --> API
DESK --> TRPC
WORK["@midday/worker"] --> DB
WORK --> JOBS
WEB["@midday/website"] --> UI
WEB --> EVENTS
```

**Diagram sources**
- [api/package.json](file://midday/apps/api/package.json#L28-L48)
- [dashboard/package.json](file://midday/apps/dashboard/package.json#L28-L39)
- [desktop/package.json](file://midday/apps/desktop/package.json#L18-L29)
- [worker/package.json](file://midday/apps/worker/package.json#L13-L35)
- [website/package.json](file://midday/apps/website/package.json#L13-L23)
- [db/package.json](file://midday/packages/db/package.json#L37-L53)
- [trpc/package.json](file://midday/packages/trpc/package.json#L17-L21)
- [events/package.json](file://midday/packages/events/package.json#L13-L23)
- [jobs/package.json](file://midday/packages/jobs/package.json#L16-L34)

**Section sources**
- [api/package.json](file://midday/apps/api/package.json#L28-L48)
- [dashboard/package.json](file://midday/apps/dashboard/package.json#L28-L39)
- [desktop/package.json](file://midday/apps/desktop/package.json#L18-L29)
- [worker/package.json](file://midday/apps/worker/package.json#L13-L35)
- [website/package.json](file://midday/apps/website/package.json#L13-L23)
- [db/package.json](file://midday/packages/db/package.json#L37-L53)
- [trpc/package.json](file://midday/packages/trpc/package.json#L17-L21)
- [events/package.json](file://midday/packages/events/package.json#L13-L23)
- [jobs/package.json](file://midday/packages/jobs/package.json#L16-L34)

## Performance Considerations
- API and Worker log database pool statistics periodically to monitor utilization and prevent saturation.
- API includes a performance logger for tRPC procedures when enabled, capturing request timing and pool stats.
- Worker logs DB pool stats and uses a longer graceful shutdown window to drain in-flight jobs.
- Turborepo caching and persistent tasks reduce rebuild times during development.
- Sentry integration captures errors and unhandled exceptions to maintain runtime stability.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common operational signals:
- API graceful shutdown sequences close database connections and flush Sentry events on SIGTERM/SIGINT.
- Worker gracefully closes BullMQ workers, waits for in-flight jobs, and flushes Sentry events.
- Both API and Worker capture unhandled exceptions and rejections with structured error details.

Health and readiness:
- API exposes /health, /health/ready, and /health/dependencies endpoints for readiness probes.
- Worker exposes /health and /health/ready endpoints and a /info endpoint listing queues and Workbench URL.

**Section sources**
- [api/src/index.ts](file://midday/apps/api/src/index.ts#L217-L258)
- [api/src/index.ts](file://midday/apps/api/src/index.ts#L262-L280)
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts#L232-L281)
- [worker/src/index.ts](file://midday/apps/worker/src/index.ts#L286-L311)

## Conclusion
Faworra’s architecture combines a monorepo structure with layered design, microservices boundaries, and event-driven background processing. The API, Dashboard, Desktop, Worker, and Website collaborate through shared packages that encapsulate data access, typed RPC, and observability. This foundation supports scalable development, cross-platform delivery, and robust operational practices.