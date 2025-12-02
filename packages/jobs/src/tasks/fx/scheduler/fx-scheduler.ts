import { schedules } from "@trigger.dev/sdk/v3";
import { createJobSupabaseClient } from "../../../clients/supabase";
import { triggerBatch } from "../../../utils/trigger-batch";
import { syncExchangeRates } from "../sync";

export const fxScheduler = schedules.task({
  id: "fx-scheduler",
  cron: "0 2 * * *", // daily at 02:00
  run: async () => {
    if (process.env.TRIGGER_ENVIRONMENT !== "production") return;

    const supabase = createJobSupabaseClient();
    // Fetch all teams with a defined base currency
    const { data: teams } = await supabase
      .from("teams")
      .select("id, base_currency")
      .not("base_currency", "is", null);
    if (!teams || teams.length === 0) return;

    type Payload = { base: string; targets: string[] };
    const payloads: Payload[] = [];

    for (const team of teams) {
      const base = String(team.base_currency).toUpperCase();
      const { data: accs } = await supabase
        .from("financial_accounts")
        .select("currency")
        .eq("team_id", team.id)
        .not("currency", "is", null);
      const targets = Array.from(
        new Set(
          ((accs || []) as Array<{ currency: string | null }>)
            .map((a) => (a.currency ? a.currency.toUpperCase() : ""))
            .filter((c) => c && c !== base),
        ),
      );
      if (targets.length > 0) payloads.push({ base, targets });
    }

    if (payloads.length > 0) {
      await triggerBatch(payloads, syncExchangeRates);
    }
  },
});
