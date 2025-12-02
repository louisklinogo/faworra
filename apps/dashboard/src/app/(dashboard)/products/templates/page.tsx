import { getCurrentTeamId } from "@/lib/trpc/server";
import { redirect } from "next/navigation";
import { TemplatesView } from "./_components/templates-view";

export const metadata = {
  title: "Product Templates | FaworraAdmin",
};

export default async function ProductTemplatesPage() {
  const teamId = await getCurrentTeamId();
  if (!teamId) redirect("/teams");
  return <TemplatesView />;
}
