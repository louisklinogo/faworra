# Coding Style & Conventions

TypeScript
- Strict mode; no `any` (use `unknown` if needed). Prefer `type` for domain models.
- Always use Zod for runtime validation at boundaries.

File Naming
- Kebab‑case for files/folders: `client-card.tsx`.
- Server Components: `page.tsx`, `layout.tsx` (no `use client`).
- Client Components: in `_components/` folder with `use client`.
- Routers: plural noun (`clients.ts`); Queries: plural (`getClients`).

Import Order
1) React/Next.js  2) Third‑party  3) `@Faworra/*` packages  4) Local components  5) Types  6) Utilities

Component Organization
```
feature/
├─ page.tsx
├─ layout.tsx
└─ _components/
   ├─ feature-list.tsx
   ├─ feature-card.tsx
   └─ create-feature-dialog.tsx
```
