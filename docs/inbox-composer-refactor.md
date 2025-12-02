## Inbox Composer Parity & Refactor Plan

### Current Pain Points
- Monolithic `Composer` component couples UI, data fetching, uploads, macros, and editor logic, complicating maintenance.
- Shared TipTap wrapper (`components/ui/editor`) is tuned for invoice builder; inbox needs separate feature flags, shortcuts, and decorations.
- Visual/layout gap versus Chatwoot: missing top panel, attachment gallery, footer control strip, banners, modal launches, and keyboard affordances.
- Channel-specific behaviors (quoting email, WhatsApp templates, signature toggles, AI assist) are either missing or tightly inlined.

### Target Architecture
1. **Container Layer** (`InboxComposer/index.tsx`): orchestrates state, data queries, and feature toggles; delegates rendering to submodules.
2. **Header Module** (`InboxComposer/Header.tsx`): mode toggle (reply vs note), character counter, pop-out control, banners.
3. **Body Module** (`InboxComposer/Body.tsx`): hosts editor switcher, reply-to panel, quoted email preview, attachment gallery, inline pickers.
4. **Footer Module** (`InboxComposer/Footer.tsx`): icon-only controls (emoji, uploads, audio, macros/templates, AI, signature, send CTA).
5. **Composer Editor** (`InboxComposer/editor/`): dedicated TipTap instance with inbox-specific extensions, keymap, TypeScript typing, and slash/mention providers isolated from invoice builder.
6. **Shared Hooks/Utilities**: upload manager, presence signalling, canned responses, mentions, variable lookups extracted into `hooks/` or `utils/` under inbox namespace.

### Parity Workstream
- **Visual Parity**: replicate card styling, spacing, and control grouping; align typography and icon sizing via existing design tokens.
- **Feature Parity**: implement signature toggles, quoted email switch, CC/BCC handling (email channels), WhatsApp/content templates modal launchers, AI assist entrypoint, article search trigger, pop-out state, keyboard shortcuts.
- **Media & Uploads**: replace sequential XHR uploads with reusable upload hook supporting progress, cancellation, and ActiveStorage-style configuration; enforce channel-based constraints.
- **Message Handling**: support multi-part sends for Instagram/WhatsApp, template variable insertion, slash commands, mentions, canned responses, macro execution isolation, and typing indicators via Supabase presence.
- **State Persistence**: manage drafts, UI preferences (send key, rich/plain editor, signature opt-in, quoted reply) via dedicated storage utilities.

### Implementation Phases
1. Scaffold new module structure and migration path (feature flag fallback to legacy composer until parity ready).
2. Introduce dedicated inbox editor and reroute composer to use it.
3. Incrementally port existing features into modular slices, adding unit/integration coverage per slice.
4. Layer in missing Chatwoot parity features, validating against design references.
5. Remove legacy monolith once feature flag rolled out.

### Testing & Verification
- Unit tests for hooks, utilities, and upload manager.
- Playwright/Cypress coverage for composer flows (send message, attachment upload, slash commands, templates, quoted email toggle).
- Manual regression across channel types (email, WhatsApp, Instagram) and private note vs reply modes.

### Open Questions
- Source of truth for AI assist and article search actions? (Existing endpoints or new integrations?)
- Do we retain current Supabase presence channel or align with Chatwoot’s typing bus events?
- Rollout strategy: feature flag per account vs global switch?
