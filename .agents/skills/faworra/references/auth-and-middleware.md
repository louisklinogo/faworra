# Auth and Middleware Reference

## Provider choice

- Use **Better Auth** for sessions, cookies, provider accounts, and auth flows.
- Do **not** copy Supabase Auth implementation details from Midday.

## Pattern choice

- Keep Midday's architecture for route gating, request context, and protected procedures.
- Auth provider and architectural pattern are separate concerns.
- Check Midday's dashboard middleware and API context patterns before changing Faworra auth flow structure.
- Only ask for clarification when Midday's pattern does not answer the question or Better Auth makes the direct translation ambiguous.

## Dashboard rules

- Private routes should be gated in middleware.
- Public routes must be explicitly allowed.
- Share/public product routes must be explicitly allowed.
- Redirect unauthenticated users to login and preserve `return_to`.
- Leave room for onboarding and team-selection checks after login.

## API and tRPC rules

- Resolve session early in request handling.
- Resolve the active `teamId` early in request handling.
- Pass typed auth and tenancy context into Hono handlers and tRPC procedures.
- Keep `publicProcedure` and `protectedProcedure`; add `teamProcedure` once the team model lands.

## Package ownership

- `packages/auth` owns Better Auth config and shared auth helpers.
- `packages/supabase` owns Postgres, storage, and realtime helpers.
- Domain packages should never implement ad hoc session parsing or team resolution.