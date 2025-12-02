"use client";

import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "@Faworra/api/trpc/routers/_app";
import { createBrowserClient } from "@Faworra/supabase/client";

// Retries a request once when the server responds UNAUTHORIZED, after refreshing Supabase session
export function authRetryLink(): TRPCLink<AppRouter> {
  return () => ({ op, next }) => {
    let retried = false;
    return observable((observer) => {
      const subscribeOnce = () =>
        next(op).subscribe({
          next(value) {
            observer.next(value);
          },
          error: async (err: any) => {
            const code = err?.data?.code ?? err?.shape?.data?.code ?? err?.message;
            if (!retried && (code === "UNAUTHORIZED" || code === "UNAUTHORIZED")) {
              retried = true;
              try {
                const supabase = createBrowserClient();
                await supabase.auth.getSession();
              } catch { }
              // Retry the operation once after attempting to refresh session
              subscribeOnce();
              return;
            }
            observer.error(err);
          },
          complete() {
            observer.complete();
          },
        });

      const sub = subscribeOnce();
      return () => {
        try {
          sub.unsubscribe();
        } catch { }
      };
    });
  };
}
