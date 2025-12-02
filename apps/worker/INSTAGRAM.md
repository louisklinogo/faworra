# Instagram: Worker vs Jobs — Exploration

## Current state
- Outbound IG sends/retries handled in Worker (communication_outbox).
- Inbound IG webhooks handled in API.
- Periodic token refresh implemented in Worker (poller), can be moved.

## Options
1) Keep in Worker (status quo)
- Pros: Single place for provider sockets/sends/retries; simple; uses existing outbox and infra.
- Cons: Poller responsibility grows; token refresh not strictly “queue/job”.

2) Split: Worker = send/retry; Jobs (@Faworra/jobs) = token refresh
- Pros: Periodic, long-running jobs live in dedicated runner; clearer separation; retries/alerts via jobs.
- Cons: Two places to reason about IG; needs job scheduling + secrets in jobs env.

3) API handles more (webhooks + token refresh)
- Pros: Fewer daemons.
- Cons: Request-bound runtime; bad fit for periodic/long tasks; failure isolation worse.

## Recommended direction
- Short term: keep Worker for send/retry (fastest path); leave token refresh here but behind a flag.
- Medium term: move token refresh to @Faworra/jobs; Worker continues provider sockets and outbox delivery only.

## Flags & config
- `INSTAGRAM_ENABLED`: gate outbound processing.
- `EVENT_OUTBOX_ENABLED=1`: durable event dispatch via event_outbox (Worker).
- `REALTIME_URL`, `REALTIME_INTERNAL_TOKEN`: realtime dispatch to Socket.IO server.
- `REDIS_URL`, `REALTIME_PRESENCE=redis`: realtime presence backend (realtime app).

## Telemetry & ops
- Emit structured logs on send failures (HTTP status, Graph error code).
- Track outbox retry_count and next_attempt_at; alert on sustained failures.
- Add success/error counters by provider/channel in logs/metrics.

## Rollout plan
1) Keep status quo; validate stability for a week.
2) Introduce `IG_REFRESH_IN_JOBS=1` and implement a Jobs task to refresh tokens.
3) Disable Worker IG refresh when jobs task is live; document ownership in jobs repo.

## Open questions
- SLA for token refresh window (how many days before expiry to refresh)?
- Do we need per-account backoff on repeated IG API failures?
- Centralize IG credentials rotation/auditing in jobs?
