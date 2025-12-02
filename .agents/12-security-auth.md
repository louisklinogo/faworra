# Security & Auth

Authentication Flow
1) User logs in via Supabase Magic Link.
2) Session stored in cookie (Supabase managed).
3) Admin app sends Bearer token to API.
4) API validates token, loads user/team, scopes all queries by `team_id`.

Environment Variables (never commit)
- `SUPABASE_SERVICE_ROLE_KEY` — server‑side only; bypasses RLS (use cautiously).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client‑side; subject to RLS.
- `DATABASE_URL` — Postgres connection string.
- Any API keys belong in `.env.local` (gitignored).

RLS Policies
- Enabled on all tables except `users`, `teams`.
- Policies enforce `team_id = (SELECT current_team_id FROM users WHERE id = auth.uid())`.
- Test with non‑service‑role keys to verify RLS.

Additional Controls
- Rate limit sensitive endpoints (auth, create/update, webhooks).
- Enforce payload/file size limits; validate content‑types.
- Signed storage URLs have short TTLs (≈ 5–15 minutes).
