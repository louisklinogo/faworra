# Realtime Architecture (Chatwoot Parity Plan)

Goal: mirror Chatwoot’s ActionCable + Redis design with our stack, using a modular Event Bus and typed domain events. Initial transport: Supabase Broadcast (existing). Next steps: Socket.IO server and Redis Pub/Sub/Streams. This doc captures the exact event names, payload shapes, channels/rooms, and rollout reflecting Chatwoot’s code we vendored in `chatwoot/`.

## Principles
- Domain events (not DB diffs), using Chatwoot’s event names from `lib/events/types.rb`.
- Conversation events carry a fresh conversation snapshot (presenter) to avoid stale UIs (Chatwoot’s `ActionCableBroadcastJob#prepare_broadcast_data`).
- Presence and typing are separate concerns: `presence.update` (account-wide) and `conversation.typing_on/off` (per conversation).
- Bus is transport-agnostic (adapters: Supabase now, Socket.IO next, Redis later). Reliability via outbox (later) and idempotent reconciliation via `client_message_id`.

## Event Model (names mirror Chatwoot)

- message.created | message.updated
  - channel/room: conversations:thread:{threadId}
  - payload: `message.push_event_data` equivalent
    - includes: { id, threadId, direction, type, content, created_at, status, attachments[], sender{}, conversation: { last_activity_at, unread_count, contact_inbox{ source_id }, assignee_id } }
- conversation.updated | conversation.status_changed | conversation.created | conversation.read
  - channel/room: conversations:thread:{threadId}
  - payload: conversation snapshot = our presenter equivalent of Chatwoot’s `Conversations::EventDataPresenter#push_data`:
    - { id, inbox_id, status, snoozed_until, unread_count, priority, labels[], meta{ sender, assignee, team }, messages[ last chat message ], timestamps{ last_activity_at, created_at, updated_at }, custom_attributes }
- conversation.typing_on | conversation.typing_off
  - channel/room: conversations:thread:{threadId}
  - payload: { conversation: snapshot-min, user: { id, name, avatar_url }, is_private: boolean }
- presence.update
  - channel/room: presence:team:{teamId}
  - payload: { account_id: teamId, users: [agent presence], contacts: [contact presence] }
- notifications (optional for parity): notification.created|updated|deleted → notifications:user:{userId}

Notes:
- Chatwoot tends to recompute a full conversation snapshot for conversation_* events to avoid out-of-order issues; we will do the same.
- They do not push counts directly; dashboard triggers a refetch on certain events. We may add `counts.updated` as an optimization later.

## Channels / Rooms
- conversations:thread:{threadId} — per conversation (thread) realtime
- presence:team:{teamId} — account/team-wide presence.update pings
- notifications:team:{teamId} and notifications:user:{userId} — optional notifications

Mapping to Chatwoot tokens
- Chatwoot broadcasts to `pubsub_token`s (user/admin/contact) and `account_{id}`; our Socket.IO uses rooms: team:{teamId}, user:{userId}, thread:{threadId}. Supabase adapter uses these room names as channel names.

## Server Design
1) EventBus interface (packages/realtime)
   - `publish(event)`; adapters fan out to channel/room with the typed payload.
   - Adapters: Supabase (now), Socket.IO (next), Redis bridge (later).
2) Emit after commit (API/Worker)
   - messages.send → message.created
   - messages.update status/read → message.updated / conversation.read
   - threads.update/archive/snooze/assign/tags → conversation.updated | conversation.status_changed
   - typing start/stop → conversation.typing_on/off
   - presence heartbeat → presence.update (account scope)
3) Fresh snapshot rule
   - For conversation_* events, fetch a fresh presenter right before publish (like `prepare_broadcast_data`).
4) Outbox (later)
   - `event_outbox` with retry worker; idempotency key = {type, entityId, createdAt}.

## Socket.IO (next)
- New service `apps/realtime`.
- Auth handshake: Bearer Supabase token → resolve { userId, teamId }.
- Join rooms: team:{teamId}, user:{userId}; clients join thread:{threadId} on conversation open.
- Redis adapter when multi-node.

## Client Design
- useRealtimeMessages
  - Prefer Socket.IO; fallback to Supabase Broadcast.
  - Listen: message.created/updated, conversation.updated/status_changed/read, conversation.typing_on/off on conversations:thread:{threadId}.
  - Still keep PG-change subscription temporarily for inbound worker inserts.
- Presence
  - Subscribe to presence:team:{teamId}; server emits every ~20s; client derives availability; typing TTL ~30s client-side (to auto off), mirroring Chatwoot.
- Notifications
  - Optional subscription for notifications; otherwise refetch counts on events (Chatwoot approach).

## Rollout Plan
1) EventBus + Supabase adapter (done) and API emits via bus (done for key paths).
2) Add Socket.IO service behind REALTIME_TRANSPORT=socketio; MultiBus can publish to both when DUAL=1.
3) Add presence + typing endpoints and events.
4) Add Redis adapter + (optional) counts.updated; keep refetch triggers for safety.
5) Introduce Outbox and remove PG-change fallback.

## Conventions
- Package: `@Faworra/realtime` (events, channels, adapters).
- Event names mirror Chatwoot; payloads are minimal, with timestamps as epoch seconds or ISO.
- No secrets/PII in payloads; include `account_id` (teamId) where relevant for client guards.
