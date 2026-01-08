"use client";

import { createBrowserClient } from "@Faworra/supabase/client";
import { useEffect, useState } from "react";

export function useAuthReady() {
  const supabase = createBrowserClient();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setReady(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setReady(!!session?.access_token);
    });
    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, [supabase.auth.getSession, supabase.auth.onAuthStateChange]);

  return ready;
}
