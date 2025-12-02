import { getTeamById, getTransactionCategories } from "@Faworra/database/queries";
import { db, getCurrentTeamId } from "@/lib/trpc/server";
import { CategoriesTable } from "./_components/categories-table";
import { getTaxTypeForCountry } from "@Faworra/utils/tax";

export default async function TransactionCategoriesPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) return null;

  const categories = await getTransactionCategories(db, { teamId });
  const team = await getTeamById(db, teamId);
  const defaultTaxType = getTaxTypeForCountry(team?.country ?? "").value;

  return (
    <div className="space-y-3 px-6 py-6">
      <CategoriesTable defaultTaxType={defaultTaxType ?? undefined} initialCategories={categories as any} />
    </div>
  );
}
