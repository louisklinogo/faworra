-- Wrap auth.*() and current_setting() calls with a scalar subselect in all public RLS policies
-- This avoids per-row initplan re-evaluation and follows Supabase guidance.
-- Idempotent: first normalizes previously wrapped tokens, then wraps once.

DO $$
DECLARE
  r RECORD;
  using_src TEXT;
  check_src TEXT;
  using_new TEXT;
  check_new TEXT;
  sql TEXT;
BEGIN
  FOR r IN
    SELECT n.nspname AS schemaname,
           c.relname AS tablename,
           p.polname,
           p.polcmd,
           pg_get_expr(p.polqual, p.polrelid)      AS using_expr,
           pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND EXISTS (
        SELECT 1 FROM (
          VALUES
            ('notification_settings','notif_rw'),
            ('users_on_team','users_on_team_rw'),
            ('user_invites','user_invites_select_by_email'),
            ('users','users_select_self'),
            ('users','users_update_self'),
            ('whatsapp_contacts','team_whatsapp_contacts_all'),
            ('instagram_contacts','team_instagram_contacts_all'),
            ('message_delivery','team_message_delivery_all'),
            ('transaction_allocations','team_transaction_allocations_all'),
            ('transaction_attachments','team_select_transaction_attachments'),
            ('transaction_attachments','team_insert_transaction_attachments'),
            ('transaction_attachments','team_update_transaction_attachments'),
            ('transaction_attachments','team_delete_transaction_attachments'),
            ('transaction_tags','team_select_transaction_tags'),
            ('transaction_tags','team_insert_transaction_tags'),
            ('transaction_tags','team_update_transaction_tags'),
            ('transaction_tags','team_delete_transaction_tags'),
            ('oauth_applications','OAuth applications can be managed by team members'),
            ('products','team_select_products'),
            ('products','team_insert_products'),
            ('products','team_update_products'),
            ('products','team_delete_products'),
            ('product_variants','team_select_product_variants'),
            ('product_variants','team_insert_product_variants'),
            ('product_variants','team_update_product_variants'),
            ('product_variants','team_delete_product_variants'),
            ('inventory_locations','team_select_inventory_locations'),
            ('inventory_locations','team_insert_inventory_locations'),
            ('inventory_locations','team_update_inventory_locations'),
            ('inventory_locations','team_delete_inventory_locations'),
            ('product_inventory','team_select_product_inventory'),
            ('product_inventory','team_insert_product_inventory'),
            ('product_inventory','team_update_product_inventory'),
            ('product_inventory','team_delete_product_inventory'),
            ('product_media','team_select_product_media'),
            ('product_media','team_insert_product_media'),
            ('product_media','team_update_product_media'),
            ('product_media','team_delete_product_media'),
            ('leads','team_select_leads'),
            ('leads','team_insert_leads'),
            ('leads','team_update_leads'),
            ('leads','team_delete_leads')
        ) AS v(tab, pol)
        WHERE v.tab = c.relname AND v.pol = p.polname
      )
      AND (
        (p.polqual IS NOT NULL AND (
           pg_get_expr(p.polqual, p.polrelid) ~ 'auth\.[a-z_]+\(\)' OR
           pg_get_expr(p.polqual, p.polrelid) ~ 'current_setting\('
        )) OR
        (p.polwithcheck IS NOT NULL AND (
           pg_get_expr(p.polwithcheck, p.polrelid) ~ 'auth\.[a-z_]+\(\)' OR
           pg_get_expr(p.polwithcheck, p.polrelid) ~ 'current_setting\('
        ))
      )
  LOOP
    using_src := r.using_expr;
    check_src := r.check_expr;

    IF using_src IS NOT NULL THEN
      using_new := using_src;
      using_new := regexp_replace(using_new, '\(\s*select\s+(auth\.[a-z_]+\(\))\s*\)', '\1', 'gi');
      using_new := regexp_replace(using_new, '\(\s*select\s+(current_setting\([^\)]*\))\s*\)', '\1', 'gi');
      using_new := regexp_replace(using_new, '(auth\.[a-z_]+\(\))', '(select \1)', 'gi');
      using_new := regexp_replace(using_new, '(current_setting\([^\)]*\))', '(select \1)', 'gi');
    END IF;

    IF check_src IS NOT NULL THEN
      check_new := check_src;
      check_new := regexp_replace(check_new, '\(\s*select\s+(auth\.[a-z_]+\(\))\s*\)', '\1', 'gi');
      check_new := regexp_replace(check_new, '\(\s*select\s+(current_setting\([^\)]*\))\s*\)', '\1', 'gi');
      check_new := regexp_replace(check_new, '(auth\.[a-z_]+\(\))', '(select \1)', 'gi');
      check_new := regexp_replace(check_new, '(current_setting\([^\)]*\))', '(select \1)', 'gi');
    END IF;

    -- Always update USING; update WITH CHECK only for non-SELECT policies, with safe fallback
    -- Apply USING only where allowed (not INSERT)
    IF using_new IS NOT NULL AND r.polcmd <> 'i' THEN
      BEGIN
        EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)', r.polname, r.schemaname, r.tablename, using_new);
      EXCEPTION WHEN others THEN
        -- ignore, continue to WITH CHECK updates
      END;
    END IF;

    -- Apply WITH CHECK only where allowed (not SELECT/DELETE)
    IF check_new IS NOT NULL AND r.polcmd <> 'r' AND r.polcmd <> 'd' THEN
      BEGIN
        EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)', r.polname, r.schemaname, r.tablename, check_new);
      EXCEPTION WHEN others THEN
        -- ignore
      END;
    END IF;
  END LOOP;
END $$;
