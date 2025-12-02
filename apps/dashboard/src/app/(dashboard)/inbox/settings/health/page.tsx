import { getTeamAccounts } from "@Faworra/database/queries";
import { createServerClient } from "@Faworra/supabase/server";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AccountsGrid } from "../../health/_components/accounts-grid";
import { KpiCard } from "../../health/_components/kpi-card";

export default async function InboxSettingsHealthPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");
  const accounts = (await getTeamAccounts(db, teamId)) as Array<{
    id: string;
    provider: string;
    externalId: string;
    displayName: string | null;
    status: string;
  }>;
  const supabase = await createServerClient();
  const details = await Promise.all(
    accounts.map(async (a) => {
      const { data: accRow } = await supabase
        .from("communication_accounts")
        .select("credentials_encrypted")
        .eq("id", a.id)
        .maybeSingle<{ credentials_encrypted: string | null }>();
      let expiresAt: string | null = null;
      if (accRow?.credentials_encrypted) {
        try {
          const parsed = JSON.parse(accRow.credentials_encrypted as string) as { expires_at?: string };
          if (typeof parsed.expires_at === "string") expiresAt = parsed.expires_at;
        } catch {}
      }
      const { data: failures } = await supabase
        .from("communication_outbox")
        .select("id, created_at, error")
        .eq("account_id", a.id)
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(5);
      return { ...a, expiresAt, failures: failures ?? [] };
    }),
  );
  const unhealthy = details.filter((a) => a.status !== "connected");

  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [inInbound, inOutboxQueued, inOutboxSent, inOutboxFailed, outBounced] = await Promise.all([
    supabase
      .from("communication_messages")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("direction", "in")
      .gte("created_at", sinceIso),
    supabase
      .from("communication_outbox")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("status", "queued")
      .gte("created_at", sinceIso),
    supabase
      .from("communication_outbox")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("status", "sent")
      .gte("created_at", sinceIso),
    supabase
      .from("communication_outbox")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("status", "failed")
      .gte("created_at", sinceIso),
    supabase
      .from("communication_messages")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("direction", "out")
      .eq("status", "bounced")
      .gte("created_at", sinceIso),
  ]);
  const inboundCount = inInbound.count || 0;
  const queuedCount = inOutboxQueued.count || 0;
  const sentCount = inOutboxSent.count || 0;
  const failedCount = inOutboxFailed.count || 0;
  const bouncedCount = outBounced.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="font-medium text-lg">Health overview</div>
        <Button asChild size="sm" variant="outline"><a href="/inbox/conversations">Open Inbox</a></Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard helper="Last 24 hours" label="Inbound" value={inboundCount} valueClassName="text-sky-600" />
        <KpiCard helper="Last 24 hours" label="Outbox Sent" value={sentCount} valueClassName="text-emerald-600" />
        <KpiCard helper="Last 24 hours" label="Outbox Failed" value={failedCount} valueClassName="text-red-600" />
        <KpiCard helper="Last 24 hours" label="Outbox Queued" value={queuedCount} valueClassName="text-amber-600" />
      <KpiCard helper="Last 24 hours" label="Bounced Emails" value={bouncedCount} valueClassName="text-rose-600" />
      </div>

      <AccountsGrid
        initialRows={details.map((a) => ({
          id: a.id,
          provider: a.provider,
          externalId: a.externalId,
          displayName: a.displayName,
          status: a.status,
          expiresAt: a.expiresAt,
          failures: a.failures as Array<{ id: string; created_at: string; error: string | null }>,
        }))}
      />

      {unhealthy.length === 0 && details.length > 0 ? (
        <div className="rounded border bg-green-50 p-3 text-sm text-green-700">All channels healthy</div>
      ) : null}
    </div>
  );
}
