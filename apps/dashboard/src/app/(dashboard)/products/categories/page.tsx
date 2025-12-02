import { getProductCategories } from "@Faworra/database/queries/product-categories";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { redirect } from "next/navigation";
import { CategoriesView } from "./_components/categories-view";

export const metadata = {
  title: "Product Categories | FaworraAdmin",
};

export default async function ProductCategoriesPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");

  const initialData = await getProductCategories(db, { teamId });
  return (
    <div className="space-y-3 px-6 py-6">
      <CategoriesView initialCategories={initialData} />
    </div>
  );
}
