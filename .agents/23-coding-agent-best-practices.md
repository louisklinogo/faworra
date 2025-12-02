 # Coding Agent Best Practices (Summary)
 
 Short, enforceable rules distilled from the full guide. See full doc → `docs/coding-guidelines/coding-agent-best-practices.md`.
 
 Do’s
 - Use structured logging (Pino); never `console.*`. Include reqId/userId/teamId; redact secrets.
 - Extract magic numbers into small constant maps (HTTP, limits). Prefer enums/union types.
 - Keep complexity low: early returns, extracted helpers, readable variables.
 - Use Zod with named constants for `.min/.max/.default`; validate at boundaries.
 - Follow server→initialData→client pattern; scope every DB query by `team_id`.
 - Use optimistic updates and cache invalidation; measure with basic timings.
 
 Don’ts
 - No `console.log/warn/error`; no secrets in logs.
 - No magic numbers inline, no duplicated status codes.
 - No `async` without `await`; no empty catch; avoid deep nesting.
 - No client prefetch for initial loads; no unscoped queries; no `any`.
 - No ineffective lint suppressions; fix root causes.
 
 Patterns
 ```ts
 // http.ts
 export const HTTP = { OK: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, INTERNAL_SERVER_ERROR: 500 } as const;
 export function ensure(cond: unknown, message: string, status = HTTP.BAD_REQUEST): asserts cond {
   if (!cond) throw new HTTPException(status, { message });
 }
 ```
 
 ```ts
 // zod bounds
 const MIN_LIMIT = 1, MAX_LIMIT = 100, DEFAULT_LIMIT = 50;
 const schema = z.object({ limit: z.number().min(MIN_LIMIT).max(MAX_LIMIT).default(DEFAULT_LIMIT) });
 ```
