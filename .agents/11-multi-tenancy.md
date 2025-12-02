# Multi‑Tenancy

Scope Every Query by team_id
```ts
// ✅ Correct
await db.select().from(clients).where(and(
  eq(clients.teamId, ctx.teamId),
  isNull(clients.deletedAt)
));

// ❌ Wrong – missing team scope
await db.select().from(clients);
```

Auth Context
- API validates Bearer token → user → team.
- `ctx.teamId` is available in all `teamProcedure` calls.
- RLS enforces team isolation at the DB level.
- Never trust client‑provided `team_id`.

Pagination & Indexing
- Use keyset pagination for large tables; ensure composite indexes (e.g., `team_id, created_at DESC`).
