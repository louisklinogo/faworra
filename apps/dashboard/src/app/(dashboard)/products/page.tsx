import { getProductsEnriched } from "@Faworra/database/queries";
import { getProductStats, getTopProductCategories } from "@Faworra/database/queries/products";
import { redirect } from "next/navigation";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { ProductsView } from "./_components/products-view";

export const metadata = {
  title: "Products | FaworraAdmin",
  description: "Manage your products and inventory",
};

export const runtime = "nodejs";

export default async function ProductsPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");

  const [initialData, stats, topCategories] = await Promise.all([
    getProductsEnriched(db, { teamId, limit: 50 }),
    getProductStats(db, { teamId }),
    getTopProductCategories(db, { teamId, limit: 10 }),
  ]);

  return (
    <ProductsView
      initialData={initialData}
      initialStats={stats}
      initialTopCategories={topCategories}
    />
  );
}
