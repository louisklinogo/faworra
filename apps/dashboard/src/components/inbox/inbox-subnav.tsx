"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type Tab = { key: string; href: string; label: string };

const TABS: Tab[] = [
  { key: "conversations", href: "/inbox/conversations", label: "Conversations" },
  { key: "views", href: "/inbox/views", label: "Views" },
  { key: "health", href: "/inbox/settings/health", label: "Health" },
  { key: "settings", href: "/inbox/settings", label: "Settings" },
];

export function InboxSubnav() {
  const pathname = usePathname();
  const router = useRouter();
  const activeKey = (() => {
    if (pathname?.startsWith("/inbox/settings")) {
      if (pathname?.includes("/health")) return "health";
      return "settings";
    }
    if (pathname?.startsWith("/inbox/views")) return "views";
    if (pathname?.startsWith("/inbox/conversations") || pathname === "/inbox") return "conversations";
    return "conversations";
  })();

  // Keyboard: g i (inbox), g h (health), g s (settings)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ignore in inputs/textareas
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (e as any).isComposing) return;
      if (e.key.toLowerCase() === "g") {
        let next: string | null = null;
        const onKey = (evt: KeyboardEvent) => {
          const k = evt.key.toLowerCase();
          if (k === "i") next = "/inbox/conversations";
          if (k === "h") next = "/inbox/settings/health";
          if (k === "s") next = "/inbox/settings";
          if (k === "v") next = "/inbox/views";
          window.removeEventListener("keydown", onKey, true);
          if (next) router.push(next);
          evt.preventDefault();
          evt.stopPropagation();
        };
        window.addEventListener("keydown", onKey, true);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [router]);

  return (
    <>
      <nav className="md:hidden border-b bg-background">
        <div className="mx-4 flex items-center gap-2 overflow-x-auto py-2">
          {TABS.map((t) => (
            <Link
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground",
                activeKey === t.key && "bg-accent text-foreground"
              )}
              href={t.href}
              key={t.key}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
      <aside className="hidden h-full max-h-full w-52 flex-col border-r bg-background pb-6 pt-4 text-sm md:flex">
        <div className="px-4 pb-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide">Inbox</p>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {TABS.map((t) => (
            <Link
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                activeKey === t.key && "bg-accent text-foreground shadow-sm"
              )}
              href={t.href}
              key={t.key}
            >
              <span>{t.label}</span>
              <span className="text-xs text-muted-foreground/70">↗</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default InboxSubnav;
