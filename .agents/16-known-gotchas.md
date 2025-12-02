# Known Gotchas

1) Import errors from workspace packages
- Run `bun install` to link workspace packages after adding new deps.

2) tRPC type errors
- Ensure `apps/api/package.json` exports the AppRouter:
```json
"exports": { "./trpc/routers/_app": "./src/trpc/routers/_app.ts" }
```

3) Server Component hooks error
- Server Components cannot use hooks; add `'use client'` to Client Components only.

4) RLS blocking queries
- Check if you are using service role vs anon key. Service role bypasses RLS; anon should be enforced.

5) Session files in Git
- Ensure `apps/worker/.sessions/` remains ignored; contains WhatsApp encryption keys.

6) Midday/Evolution repos in Git
- These are reference repos and excluded as embedded Git repos via .gitignore.
