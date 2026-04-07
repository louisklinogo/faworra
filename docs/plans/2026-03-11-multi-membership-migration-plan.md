## 1. Purpose

This document turns the approved tenancy architecture into a concrete migration
plan for multi-membership, invites, and active team switching.

It should be used before any new schema or API changes in this area.

## 2. Current starting point

Current tables and behavior after Phase 1:

- `teams`
- `team_memberships`
- `team_invites`
- `team_settings`
- `user_context.activeMembershipId`
- `user_context.activeTeamId`
- onboarding creates a default team + owner membership + both active context
  fields during the compatibility rollout
- viewer resolution checks `activeMembershipId`, then `activeTeamId`, then the
  first membership
- owner-side invite management is bulk/team-scoped
- recipient-side invite access is email-scoped with accept/decline by invite id

Current limitation:

- no multi-membership switching flow
- invite backend flows exist, but invite UI/email delivery is not implemented yet

## 3. Target state

Target schema concepts:

- `teams`
- `team_memberships`
- `team_invites`
- `team_settings`
- `user_context.activeMembershipId`

Key rules:

- membership rows represent accepted membership only
- invites are separate, email-based records
- active workspace context resolves from membership, not just a team id
- onboarding creates a default team only when the user has zero accepted
  memberships

## 4. Approved schema shape

### 4.1 `team_memberships`

Planned columns:

- `id`
- `user_id`
- `team_id`
- `role`
- `created_at`
- `updated_at`

Near-term decision:

- do not add membership `status` in the first migration
- only accepted memberships exist initially
- add status later only when leave/remove flows exist

Constraints and indexes:

- unique `(user_id, team_id)`
- index on `user_id`
- index on `team_id`
- optional composite unique `(user_id, id)` to support stronger active-membership
  foreign-key enforcement later

### 4.2 `team_invites`

Planned columns:

- `id`
- `team_id`
- `email`
- `normalized_email`
- `role`
- `status`
- `token_hash`
- `invited_by_user_id`
- `accepted_by_user_id`
- `expires_at`
- `accepted_at`
- `created_at`
- `updated_at`

Invite status enum:

- `pending`
- `accepted`
- `revoked`
- `expired`

Constraints and indexes:

- unique `token_hash`
- partial unique index on `(team_id, normalized_email)` where status is `pending`
- index on `normalized_email`
- index on `team_id`

### 4.3 `user_context`

Current field:

- `activeTeamId`

Target field:

- `activeMembershipId`

Migration rule:

- add `activeMembershipId` first
- keep `activeTeamId` during compatibility rollout
- backfill `activeMembershipId` from `(user_id, activeTeamId)` -> membership row
- remove `activeTeamId` only after viewer/API/UI paths stop reading it

## 5. Recommended migration phases

### Phase 1 — additive schema migration ✅ implemented

Goal: add the missing pieces without breaking current reads.

Changes:

1. rename physical table `users_on_team` to `team_memberships`
2. rename related indexes and Drizzle exports accordingly
3. add `team_invites`
4. add invite status enum
5. add nullable `user_context.active_membership_id`
6. backfill `active_membership_id` from existing active team rows where possible
7. keep `active_team_id` in place for compatibility

Why rename now:

- the repo is still early
- there is only one existing migration
- this is the cheapest point to align naming with the domain model

Implementation note:

- preserve data with a rename-aware migration plus manual
  `active_membership_id` backfill

### Phase 2 — application compatibility rollout ✅ implemented

Goal: make API and onboarding read the new source of truth first.

Changes:

1. update DB exports and app code to use `teamMemberships`
2. update viewer resolution order to:
   - `activeMembershipId`
   - fallback `activeTeamId`
   - fallback first membership
3. update onboarding logic to write both active fields during the transition
4. add invite acceptance logic that:
   - validates the invite
   - inserts a membership row
   - marks invite accepted
   - sets `activeMembershipId`

### Phase 3 — invite and switching product flow

Goal: expose multi-membership behavior in product surfaces.

Changes:

1. add invite UI/email delivery on top of the shipped invite endpoints/actions
2. add team switcher UI only when a user has more than one accepted membership
3. team switching writes `user_context.activeMembershipId`
4. invited users skip default-team creation if they already joined a real team
5. invite email links should route users into the authenticated invite inbox
   flow unless a signed-token landing page is explicitly needed

### Phase 4 — cleanup migration

Goal: remove transitional fields and simplify the model.

Changes:

1. stop writing `activeTeamId`
2. remove API fallback behavior that depends on `activeTeamId`
3. drop `user_context.active_team_id`
4. optionally add stronger DB-level active-membership ownership constraints

## 6. API and viewer-state changes

Planned behavior for `getViewerState()`:

1. if `activeMembershipId` resolves to a valid membership for the user, use it
2. else if `activeTeamId` resolves to a valid membership, use it
3. else fall back to the first membership by creation time
4. if no membership exists, return `needsOnboarding: true`

Planned behavior for onboarding:

- if the user already has an accepted membership, do not create a new team
- set active membership/context to the existing membership
- only create a default team for users with zero memberships

Planned behavior for invite acceptance:

- accept invite by token and matching email/user identity
- create membership only once
- set accepted metadata on the invite row
- set the accepted membership as active

## 7. UI and product rules

- do not show a team switcher until multiple memberships are real
- if a user has one membership, go straight to that team
- if a user accepts an invite before creating a workspace, skip personal team
  creation
- if a user loses access to the active membership later, fall back to the next
  valid membership or onboarding state

## 8. Validation checklist for future implementation

Before merging schema work in this area, validate:

- migration preserves existing membership data
- backfill correctly populates `active_membership_id`
- onboarding still produces one owner membership and one active context
- invite acceptance is idempotent
- unique pending invite constraint behaves correctly
- viewer state handles stale active membership/team references safely

## 9. Rollback strategy

- land additive schema changes before destructive cleanup
- keep `activeTeamId` until runtime reads no longer depend on it
- separate the cleanup migration from invite introduction
- if invite rollout regresses, disable invite/API usage without reverting the
  membership rename/backfill unless data integrity is affected

## 10. Next implementation step

The next schema/product work after this plan should be:

1. add invite UI/email delivery flows
2. add team-switching API/UI on top of multiple memberships
3. keep compatibility reads until `activeTeamId` can be removed safely