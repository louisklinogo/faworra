# Debugging Tips

Server Components
- `bun run typecheck:dashboard` to catch type errors.

tRPC/API
- Check API logs and tRPC context. Verify Bearer token is sent and `team_id` is present in queries.

Database
- Verify `DATABASE_URL` in `.env.local`. Check Supabase dashboard and RLS policies.

WhatsApp
- Delete session files to reconnect if stuck. Inspect `apps/worker` logs.

Reference Implementations
- Prefer searching the `midday` and `evolution-api` code when stuck; reuse proven patterns.
