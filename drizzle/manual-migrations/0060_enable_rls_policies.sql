-- Enable RLS and add idempotent policies for remaining public tables flagged by Advisor

-- Helper: returns current team id for authenticated user
-- Note: we intentionally use (select auth.uid()) to avoid initplan re-evaluation

DO $$
BEGIN
  -- api_key_usage (team_id scoped)
  EXECUTE 'ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='api_key_usage'
  ) THEN
    CREATE POLICY api_key_usage_select ON public.api_key_usage FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY api_key_usage_insert ON public.api_key_usage FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY api_key_usage_update ON public.api_key_usage FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY api_key_usage_delete ON public.api_key_usage FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- api_keys (team_id scoped)
  EXECUTE 'ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='api_keys') THEN
    CREATE POLICY api_keys_select ON public.api_keys FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY api_keys_insert ON public.api_keys FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY api_keys_update ON public.api_keys FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY api_keys_delete ON public.api_keys FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- assignment_policies (team_id)
  EXECUTE 'ALTER TABLE public.assignment_policies ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='assignment_policies') THEN
    CREATE POLICY assignment_policies_select ON public.assignment_policies FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY assignment_policies_ins ON public.assignment_policies FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY assignment_policies_upd ON public.assignment_policies FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY assignment_policies_del ON public.assignment_policies FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- communication_thread_tags (team_id)
  EXECUTE 'ALTER TABLE public.communication_thread_tags ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='communication_thread_tags') THEN
    CREATE POLICY comm_thread_tags_sel ON public.communication_thread_tags FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY comm_thread_tags_ins ON public.communication_thread_tags FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY comm_thread_tags_upd ON public.communication_thread_tags FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY comm_thread_tags_del ON public.communication_thread_tags FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- documents (team_id)
  EXECUTE 'ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='documents') THEN
    CREATE POLICY documents_sel ON public.documents FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY documents_ins ON public.documents FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY documents_upd ON public.documents FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY documents_del ON public.documents FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- event_outbox (service_role only)
  EXECUTE 'ALTER TABLE public.event_outbox ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='event_outbox') THEN
    CREATE POLICY event_outbox_service_all ON public.event_outbox FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- exchange_rates (global read; writes service_role)
  EXECUTE 'ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='exchange_rates') THEN
    CREATE POLICY exchange_rates_sel ON public.exchange_rates FOR SELECT TO authenticated USING (true);
    CREATE POLICY exchange_rates_sr_all ON public.exchange_rates FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- financial_accounts (team_id)
  EXECUTE 'ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='financial_accounts') THEN
    CREATE POLICY fin_accounts_sel ON public.financial_accounts FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY fin_accounts_ins ON public.financial_accounts FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY fin_accounts_upd ON public.financial_accounts FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY fin_accounts_del ON public.financial_accounts FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- invoice_items (via invoices.team_id)
  EXECUTE 'ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='invoice_items') THEN
    CREATE POLICY invoice_items_sel ON public.invoice_items FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.id = invoice_items.invoice_id
          AND i.team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid()))
      ));
    CREATE POLICY invoice_items_ins ON public.invoice_items FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.id = invoice_id
          AND i.team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid()))
      ));
    CREATE POLICY invoice_items_upd ON public.invoice_items FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.id = invoice_items.invoice_id
          AND i.team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid()))
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.id = invoice_id
          AND i.team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid()))
      ));
    CREATE POLICY invoice_items_del ON public.invoice_items FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.invoices i
        WHERE i.id = invoice_items.invoice_id
          AND i.team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid()))
      ));
  END IF;

  -- macros (team_id)
  EXECUTE 'ALTER TABLE public.macros ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='macros') THEN
    CREATE POLICY macros_sel ON public.macros FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY macros_ins ON public.macros FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY macros_upd ON public.macros FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY macros_del ON public.macros FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- oauth_access_tokens (service_role only)
  EXECUTE 'ALTER TABLE public.oauth_access_tokens ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='oauth_access_tokens') THEN
    CREATE POLICY oauth_access_tokens_sr_all ON public.oauth_access_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- oauth_authorization_codes (service_role only)
  EXECUTE 'ALTER TABLE public.oauth_authorization_codes ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='oauth_authorization_codes') THEN
    CREATE POLICY oauth_authorization_codes_sr_all ON public.oauth_authorization_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- order_items (via orders.team_id)
  EXECUTE 'ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='order_items') THEN
    CREATE POLICY order_items_sel ON public.order_items FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid()))
      ));
    CREATE POLICY order_items_ins ON public.order_items FOR INSERT TO authenticated
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id
          AND o.team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid()))
      ));
    CREATE POLICY order_items_upd ON public.order_items FOR UPDATE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid()))
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_id
          AND o.team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid()))
      ));
    CREATE POLICY order_items_del ON public.order_items FOR DELETE TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = order_items.order_id
          AND o.team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid()))
      ));
  END IF;

  -- product_categories (team_id)
  EXECUTE 'ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='product_categories') THEN
    CREATE POLICY product_categories_sel ON public.product_categories FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY product_categories_ins ON public.product_categories FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY product_categories_upd ON public.product_categories FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY product_categories_del ON public.product_categories FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- product_category_mappings (team_id)
  EXECUTE 'ALTER TABLE public.product_category_mappings ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='product_category_mappings') THEN
    CREATE POLICY pcm_sel ON public.product_category_mappings FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY pcm_ins ON public.product_category_mappings FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY pcm_upd ON public.product_category_mappings FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY pcm_del ON public.product_category_mappings FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- saved_inbox_views (team_id)
  EXECUTE 'ALTER TABLE public.saved_inbox_views ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='saved_inbox_views') THEN
    CREATE POLICY saved_views_sel ON public.saved_inbox_views FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY saved_views_ins ON public.saved_inbox_views FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY saved_views_upd ON public.saved_inbox_views FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY saved_views_del ON public.saved_inbox_views FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- tags (team_id)
  EXECUTE 'ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='tags') THEN
    CREATE POLICY tags_sel ON public.tags FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY tags_ins ON public.tags FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY tags_upd ON public.tags FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY tags_del ON public.tags FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- team_daily_orders_summary (team_id)
  EXECUTE 'ALTER TABLE public.team_daily_orders_summary ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='team_daily_orders_summary') THEN
    CREATE POLICY tdos_sel ON public.team_daily_orders_summary FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- team_order_counters (team_id)
  EXECUTE 'ALTER TABLE public.team_order_counters ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='team_order_counters') THEN
    CREATE POLICY toc_sel ON public.team_order_counters FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- teams (membership-based read)
  EXECUTE 'ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='teams') THEN
    CREATE POLICY teams_sel ON public.teams FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.users_on_team u WHERE u.team_id = teams.id AND u.user_id = (select auth.uid())));
    CREATE POLICY teams_sr_all ON public.teams FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- transaction_categories (team_id)
  EXECUTE 'ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='transaction_categories') THEN
    CREATE POLICY tc_sel ON public.transaction_categories FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY tc_ins ON public.transaction_categories FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY tc_upd ON public.transaction_categories FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY tc_del ON public.transaction_categories FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- transaction_category_embeddings (global read; writes service_role)
  EXECUTE 'ALTER TABLE public.transaction_category_embeddings ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='transaction_category_embeddings') THEN
    CREATE POLICY tce_sel ON public.transaction_category_embeddings FOR SELECT TO authenticated USING (true);
    CREATE POLICY tce_sr_all ON public.transaction_category_embeddings FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  -- transaction_embeddings (team_id)
  EXECUTE 'ALTER TABLE public.transaction_embeddings ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='transaction_embeddings') THEN
    CREATE POLICY te_sel ON public.transaction_embeddings FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY te_ins ON public.transaction_embeddings FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY te_upd ON public.transaction_embeddings FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY te_del ON public.transaction_embeddings FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- transaction_enrichments (team_id)
  EXECUTE 'ALTER TABLE public.transaction_enrichments ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='transaction_enrichments') THEN
    CREATE POLICY ten_sel ON public.transaction_enrichments FOR SELECT TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY ten_ins ON public.transaction_enrichments FOR INSERT TO authenticated
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY ten_upd ON public.transaction_enrichments FOR UPDATE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())))
      WITH CHECK (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
    CREATE POLICY ten_del ON public.transaction_enrichments FOR DELETE TO authenticated
      USING (team_id = (SELECT current_team_id FROM public.users WHERE id = (select auth.uid())));
  END IF;

  -- document_tag_embeddings (global read; writes service_role)
  EXECUTE 'ALTER TABLE public.document_tag_embeddings ENABLE ROW LEVEL SECURITY';
  IF NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relname='document_tag_embeddings') THEN
    CREATE POLICY dte_sel ON public.document_tag_embeddings FOR SELECT TO authenticated USING (true);
    CREATE POLICY dte_sr_all ON public.document_tag_embeddings FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Revoke TRUNCATE from anon/authenticated as a safety improvement (RLs does not cover TRUNCATE)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public'
           AND tablename IN (
             'api_key_usage','api_keys','assignment_policies','communication_thread_tags','documents',
             'event_outbox','exchange_rates','financial_accounts','invoice_items','macros','oauth_access_tokens',
             'oauth_authorization_codes','order_items','product_categories','product_category_mappings',
             'saved_inbox_views','tags','team_daily_orders_summary','team_order_counters','teams',
             'transaction_categories','transaction_category_embeddings','transaction_embeddings','transaction_enrichments','document_tag_embeddings'
           )
  LOOP
    EXECUTE format('REVOKE TRUNCATE ON TABLE public.%I FROM anon, authenticated', r.tablename);
  END LOOP;
END $$;
