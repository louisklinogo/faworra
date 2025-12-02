import { getOrdersWithClients } from "@Faworra/database/queries";
import { redirect } from "next/navigation";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { OrdersView } from "./_components/orders-view";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");

  const params = (await searchParams) ?? {};
  const readStr = (k: string): string | undefined => {
    const v = params[k];
    if (Array.isArray(v)) return v[0] || undefined;
    return v && v.trim() !== "" ? v : undefined;
  };
  const statusParam = readStr("status");
  const allowed = new Set(["generated", "in_progress", "completed", "cancelled"]);
  const status = statusParam && allowed.has(statusParam) ? (statusParam as any) : undefined;
  const search = readStr("q");

  // ✅ Direct DB query in Server Component (aligned to URL filters)
  const orders = await getOrdersWithClients(db, { teamId, limit: 50, status, search });

  return <OrdersView initialOrders={orders} />;
}
