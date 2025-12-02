import { NextResponse } from "next/server";
import { createServerClient } from "@Faworra/supabase/server";
import { queueImportTransactions } from "@Faworra/jobs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filePath, bankAccountId, currency, currentBalance, inverted, mappings } = body as {
      filePath: string[];
      bankAccountId: string;
      currency: string;
      currentBalance?: string;
      inverted?: boolean;
      mappings: { amount: string; date: string; description: string };
    };

    const supabase = await createServerClient({ admin: true });

    // Get team id from auth context cookie (assumes RLS ensures current user/team); fallback to update via account lookup
    const { data: acc } = await supabase
      .from("financial_accounts")
      .select("team_id")
      .eq("id", bankAccountId)
      .maybeSingle();
    const teamId = acc?.team_id as string | undefined;
    if (!teamId) return NextResponse.json({ error: "Invalid account" }, { status: 400 });

    // Update account currency and opening balance if provided
    const updates: Record<string, any> = { currency };
    if (currentBalance != null && currentBalance !== "") {
      const parsed = Number(String(currentBalance).replace(/[^0-9.-]/g, ""));
      updates.opening_balance = Number.isFinite(parsed) ? parsed : null;
    }
    await supabase.from("financial_accounts").update(updates).eq("id", bankAccountId);

    const run = await queueImportTransactions({ teamId, bankAccountId, currency, filePath, inverted: Boolean(inverted), mappings });
    // v3 trigger returns a TaskRun; attempt to include id and publicAccessToken if present
    const out: any = run as any;
    return NextResponse.json({ id: out?.id, publicAccessToken: out?.publicAccessToken }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to start import" }, { status: 500 });
  }
}
