"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "health", href: "/inbox/settings/health", label: "Health" },
  { key: "channels", href: "/inbox/settings/channels", label: "Channels" },
];

export default function SettingsTabs() {
  const pathname = usePathname();
  const active = pathname?.includes("/channels") ? "channels" : "health";
  return (
    <div className="border-b bg-background">
      <div className="mx-4 flex items-center gap-2 overflow-x-auto py-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "shrink-0 rounded px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground",
              active === t.key && "bg-accent text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
