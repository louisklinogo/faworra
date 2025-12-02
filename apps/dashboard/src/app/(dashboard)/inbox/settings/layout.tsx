import type { ReactNode } from "react";
import { InboxSubnav } from "@/components/inbox/inbox-subnav";
import SettingsTabs from "./_components/settings-tabs";

export default function InboxSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-8 -mb-4 flex h-full">
      <InboxSubnav />
      <div className="flex min-w-0 flex-1 flex-col">
        <SettingsTabs />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}
