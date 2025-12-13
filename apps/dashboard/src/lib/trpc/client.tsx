"use client";

import type { AppRouter } from "@Faworra/api/trpc/routers/_app";
import { createBrowserClient } from "@Faworra/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import { authRetryLink } from "@/lib/trpc/auth-retry-link";

// Create tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
          hydrate: {
            deserializeData: superjson.deserialize,
          },
        },
      }),
  );

  const [trpcClient] = useState(() => {
    const getTrpcUrl = () => {
      // Browser should use same-origin proxy to avoid CORS
      if (typeof window !== "undefined") return "/api/trpc";
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      return `${base}/trpc`;
    };

    return trpc.createClient({
      links: [
        authRetryLink(),
        httpBatchLink({
          url: getTrpcUrl(),
          transformer: superjson,
          // Ensure cookies are sent when same-origin (useful for debug endpoints)
          fetch(url, opts) {
            return fetch(url, { ...opts, credentials: "include" });
          },
          async headers() {
            const supabase = createBrowserClient();
            const {
              data: { session },
            } = await supabase.auth.getSession();
            let token = session?.access_token || "";
            // Dev fallback: if session not yet hydrated in browser, read token from debug endpoint
            if (!token && process.env.NODE_ENV !== "production") {
              try {
                const res = await fetch("/api/debug/session", { cache: "no-store" });
                if (res.ok) {
                  const j = await res.json();
                  if (j?.token) token = j.token as string;
                }
              } catch {}
            }
            const browserLocale =
              (typeof navigator !== "undefined" &&
                (navigator.languages?.[0] || navigator.language)) ||
              undefined;
            return {
              Authorization: token ? `Bearer ${token}` : "",
              ...(browserLocale ? { "x-user-locale": browserLocale } : {}),
            } as Record<string, string>;
          },
        }),
      ],
    });
  });

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
