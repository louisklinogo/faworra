"use client";

import type { InboxShellProps } from "./conversation/inbox-shell";
import { InboxShell } from "./conversation/inbox-shell";
import { RealtimeProvider } from "../realtime/RealtimeProvider";

export type InboxViewProps = InboxShellProps & { teamId: string };

export function InboxView({ teamId, ...props }: InboxViewProps) {
  return (
    <RealtimeProvider teamId={teamId}>
      <InboxShell {...props} />
    </RealtimeProvider>
  );
}
