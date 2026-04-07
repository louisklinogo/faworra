## 1. Purpose

This document is the canonical schema/architecture checkpoint for Faworra's
team-tenancy model as of 2026-03-11.

Use it to keep future schema, onboarding, invite, and team-switching work
aligned. If code changes diverge from this document, update the document in the
same change.

## 2. Current implemented state

Faworra currently has these app-level tenancy tables:

- `teams`
- `team_memberships`
- `team_invites`
- `team_settings`
- `user_context.activeMembershipId`
- `user_context.activeTeamId`

Current behavior:

- first onboarding creates a team, an owner membership row, team settings, and
  both active context fields during the compatibility rollout
- viewer state resolves from `activeMembershipId`, then `activeTeamId`, then the
  first membership
- owner-only invite management APIs exist for listing pending invites,
  bulk-creating invites, and deleting/revoking pending invites
- authenticated users can fetch their invite inbox by email and accept/decline
  invites by invite id
- invite acceptance activates the accepted membership in
  `user_context.activeMembershipId`
- only one effective team is still exercised in product flows today

## 3. Midday reference and adaptation

Midday is still the architectural reference point for:

- team-scoped tenancy
- owner/member roles
- member invites
- active workspace switching

However, Faworra should adapt Midday rather than copy it literally.

Specifically:

- do not introduce `users.teamId` as the primary source of truth
- keep Better Auth tables focused on auth/session identity only
- keep tenancy in app-level schema modules
- prefer explicit membership and invite concepts over an overloaded join table

## 4. Approved design decisions

### 4.1 Membership naming

- Canonical domain term: `team_memberships`
- `users_on_team` is now a retired pre-migration name
- future schema and application code should continue using
  `team_memberships`

### 4.2 Membership lifecycle

- Membership rows represent accepted membership, not invitations
- Do not store `pending` membership rows if a separate invite table exists
- Near-term simplest model: only accepted memberships exist
- If lifecycle state is added, use membership-only states such as:
  - `active`
  - `left`
  - `removed`

### 4.3 Invite model

Use a dedicated `team_invites` table.

Minimum planned fields:

- `id`
- `team_id`
- `email`
- `role`
- `invited_by_user_id`
- `status`
- `token_hash`
- `expires_at`
- `accepted_at`
- `accepted_by_user_id`
- `created_at`
- `updated_at`

Planned invite statuses:

- `pending`
- `accepted`
- `revoked`
- `expired`

Invites should be email-based so users can be invited before signup.

### 4.4 Active workspace context

Current implementation uses both:

- `user_context.activeMembershipId`
- `user_context.activeTeamId`

Target model:

- `user_context.activeMembershipId`

Reason:

- the active context is really a membership, not just a team id
- membership carries both the team and the role
- this reduces the chance of invalid user/team combinations

During the compatibility rollout, `activeTeamId` remains in place as a fallback
field until all runtime reads and writes stop depending on it.

### 4.5 Uniqueness and integrity constraints

Planned constraints:

- memberships unique on `(user_id, team_id)`
- pending invites unique on `(team_id, normalized_email)`
- invite token hash unique
- every team must always retain at least one owner (initially enforced in app
  logic)

### 4.6 Onboarding and invites coexistence

Rules:

- if a user has zero accepted memberships, onboarding may create a default team
- if a user accepts an invite before creating a workspace, do not auto-create a
  personal/default team
- invite acceptance should set that invited team as the active membership
- invite inbox lookups should be based on the signed-in user's email rather than
  team-scoped token submission alone

This prevents users from ending up with a meaningless default team plus the real
team they were invited to.

## 5. Migration direction

Recommended rollout order:

1. keep the current flow stable while documenting the target model
2. rename the membership concept in code from `usersOnTeam` to
   `teamMemberships` ✅
3. add `team_invites` ✅
4. migrate `user_context.activeTeamId` toward `activeMembershipId` ✅
5. update viewer state resolution and onboarding logic to use the new source of
   truth ✅
6. build team switching only after multiple memberships/invites are supported

Detailed implementation plan:

- `docs/plans/2026-03-11-multi-membership-migration-plan.md`

## 6. Documentation workflow

For every schema or architecture change in this area:

1. update this document first or in the same PR
2. document the reason, invariants, and migration/rollback implications
3. update `docs/plans/faworra-revised-next-steps-2026-03-11.md` if milestone
   sequencing changes
4. update README/env docs if local setup or runtime behavior changes
5. add or update focused tests for any changed invariants

## 7. Immediate next implementation targets

The next concrete tasks that should follow this checkpoint are:

- add invite UI/email delivery flows on top of the backend invite APIs
- build the team-switching API/UI once multiple memberships are real
- eventually remove `activeTeamId` after the compatibility window closes

## 8. Open questions to resolve when invite work starts

- whether membership status should be added immediately or deferred until real
  leave/remove flows exist
- whether invite email links should deep-link into the in-product invite inbox or
  resolve through a separate signed-token landing page
- whether owner transfer rules should be modeled immediately or deferred until
  member-management flows exist