/**
 * Supabase client for Trigger.dev background jobs
 * Midday parity: exact copy of midday/packages/supabase/src/client/job.ts
 *
 * Uses service role key (SUPABASE_SECRET_KEY) to bypass RLS
 * This is required for background tasks that need full database access
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/db";

export const createClient = () =>
	createSupabaseClient<Database>(
		process.env.SUPABASE_URL!,
		process.env.SUPABASE_SECRET_KEY!
	);
