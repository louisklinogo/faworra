import { redirect } from "next/navigation";

export default async function InboxSettingsPage() {
  redirect("/inbox/settings/health");
}
