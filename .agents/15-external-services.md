# External Services

Supabase
- Auth, Database, Storage, Real‑time.
- Project: `zvatkstmsyuytbajzuvn` (see Supabase dashboard).
- Generate app types with `bun run db:types`.

WhatsApp (Baileys)
- Session files: `apps/worker/.sessions/` (NEVER commit; in .gitignore).
- Media stored in Supabase Storage.
- Webhooks handled in `apps/api/src/rest/webhooks/`.

Instagram (Planned)
- Integration TBD.
