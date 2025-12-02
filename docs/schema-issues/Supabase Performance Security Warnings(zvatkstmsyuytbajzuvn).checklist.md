# Supabase Advisor — Performance/Security Warnings Checklist

Status legend: [x] implemented in migrations/scripts (pending DB run) • [ ] pending

## RLS initplan — wrap auth.*() and current_setting() with SELECT
- [x] public.notification_settings — policy notif_rw
- [x] public.users_on_team — policy users_on_team_rw
- [x] public.user_invites — policy user_invites_select_by_email
- [x] public.users — policy users_select_self
- [x] public.users — policy users_update_self
- [x] public.whatsapp_contacts — policy team_whatsapp_contacts_all
- [x] public.instagram_contacts — policy team_instagram_contacts_all
- [x] public.message_delivery — policy team_message_delivery_all
- [x] public.transaction_allocations — policy team_transaction_allocations_all
- [x] public.transaction_attachments — policy team_select_transaction_attachments
- [x] public.transaction_attachments — policy team_insert_transaction_attachments
- [x] public.transaction_attachments — policy team_update_transaction_attachments
- [x] public.transaction_attachments — policy team_delete_transaction_attachments
- [x] public.transaction_tags — policy team_select_transaction_tags
- [x] public.transaction_tags — policy team_insert_transaction_tags
- [x] public.transaction_tags — policy team_update_transaction_tags
- [x] public.transaction_tags — policy team_delete_transaction_tags
- [x] public.oauth_applications — policy "OAuth applications can be managed by team members"
- [x] public.products — policy team_select_products
- [x] public.products — policy team_insert_products
- [x] public.products — policy team_update_products
- [x] public.products — policy team_delete_products
- [x] public.product_variants — policy team_select_product_variants
- [x] public.product_variants — policy team_insert_product_variants
- [x] public.product_variants — policy team_update_product_variants
- [x] public.product_variants — policy team_delete_product_variants
- [x] public.inventory_locations — policy team_select_inventory_locations
- [x] public.inventory_locations — policy team_insert_inventory_locations
- [x] public.inventory_locations — policy team_update_inventory_locations
- [x] public.inventory_locations — policy team_delete_inventory_locations
- [x] public.product_inventory — policy team_select_product_inventory
- [x] public.product_inventory — policy team_insert_product_inventory
- [x] public.product_inventory — policy team_update_product_inventory
- [x] public.product_inventory — policy team_delete_product_inventory
- [x] public.product_media — policy team_select_product_media
- [x] public.product_media — policy team_insert_product_media
- [x] public.product_media — policy team_update_product_media
- [x] public.product_media — policy team_delete_product_media
- [x] public.leads — policy team_select_leads
- [x] public.leads — policy team_insert_leads
- [x] public.leads — policy team_update_leads
- [x] public.leads — policy team_delete_leads

Implemented by: drizzle/manual-migrations/0057_rls_initplan_select_wrapping.sql and scripts/migrate-rls-initplan-wrap.ts

## Multiple permissive policies — deduplicate
- [x] public.clients — SELECT (authenticated): restrict "Allow all operations for service role" to service_role
- [x] public.invoices — SELECT (authenticated): restrict "Allow all operations for service role" to service_role
- [x] public.measurements — SELECT (authenticated): restrict "Allow all operations for service role" to service_role
- [x] public.user_invites — SELECT (authenticated): merge permissive policies into one

Implemented by: drizzle/manual-migrations/0059_rls_policy_dedup_select.sql and scripts/migrate-rls-policy-dedup.ts

## Duplicate indexes — drop redundant (keep canonical)
- [x] public.products: drop idx_products_team_updated_id
- [x] public.transactions: drop transactions_team_id_idx
- [x] public.transactions: drop idx_transactions_team_date_id
- [x] public.transactions: drop idx_transactions_date
- [x] public.transactions: drop idx_transactions_description_trigram
- [x] public.transactions: drop idx_transactions_name_trigram
- [x] public.user_invites: drop uq_user_invites_code
- [x] public.user_invites: drop uq_user_invites_team_email

Implemented by: drizzle/manual-migrations/0058_drop_duplicate_indexes.sql and scripts/migrate-drop-duplicate-indexes.ts

## How to apply
1. Set DATABASE_URL or SUPABASE_DB_URL
2. Run:
   - `bun scripts/migrate-rls-initplan-wrap.ts`
   - `bun scripts/migrate-rls-policy-dedup.ts`
   - `bun scripts/migrate-drop-duplicate-indexes.ts`
3. Re-run Supabase Advisor and `bun scripts/verify-rls.ts`
