import type { Database } from "@Faworra/supabase/types";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type CreateClientOptions = { admin?: boolean };

export async function createServerClient(options?: CreateClientOptions) {
  const { admin = false } = options ?? {};
  let cookieStore: any = null;
  try {
    // Only available in Next.js request scope.
    // Keep as a dynamic import so non-Next runtimes (workers/CLI) don't require `next`.
    const mod: any = await import("next/headers");
    cookieStore = await mod.cookies?.();
  } catch {
    cookieStore = null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = admin ? process.env.SUPABASE_SERVICE_ROLE_KEY : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured");
  }

  const auth = admin
    ? {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      }
    : {};

  if (!cookieStore) {
    return createSupabaseClient<Database>(url, key, {
      auth,
      global: {
        headers: {
          "X-Client-Info": "@Faworra/supabase",
        },
      },
    });
  }

  return createSSRClient<Database>(url, key, {
    cookies: cookieStore
      ? {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options);
              }
            } catch {
              // ignore when called outside response scope
            }
          },
        }
      : {
          getAll() {
            return [] as any;
          },
          setAll() {
            /* no-op in non-Next runtimes */
          },
        },
    auth,
  });
}

// Suppress noisy Supabase warnings about getSession authenticity in server logs
// We use middleware cookie refresh and tRPC token validation; this message is expected
const IGNORE_WARNINGS = ["Using the user object as returned from supabase.auth.getSession()"];
const originalWarn = console.warn;
const originalLog = console.log;
console.warn = (...args: any[]) => {
  const match = args.find((arg) =>
    typeof arg === "string" ? IGNORE_WARNINGS.some((w) => arg.includes(w)) : false,
  );
  if (!match) originalWarn(...args);
};
console.log = (...args: any[]) => {
  const match = args.find((arg) =>
    typeof arg === "string" ? IGNORE_WARNINGS.some((w) => arg.includes(w)) : false,
  );
  if (!match) originalLog(...args);
};
