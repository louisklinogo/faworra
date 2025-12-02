import { Icons } from "@/components/ui/icons";
import { getCountryCode, getCurrency } from "@Faworra/location/server";
import { CreateTeamForm } from "./_components/create-team-form";
import Link from "next/link";

export default async function CreateTeamPage() {
  const defaultCountryCode = await getCountryCode();
  const defaultCurrency = await getCurrency();

  return (
    <>
      <header className="absolute left-0 right-0 flex w-full items-center justify-between">
        <div className="ml-5 mt-4 md:ml-10 md:mt-10">
          <Link href="/teams">
            <Icons.LogoSmall />
          </Link>
        </div>
      </header>
      <div className="flex min-h-screen items-center justify-center overflow-hidden p-6 md:p-0">
        <div className="z-20 m-auto flex w-full max-w-[480px] flex-col">
          <div className="text-center">
            <h1 className="mb-2 font-serif text-lg">Setup your team</h1>
            <p className="mb-8 text-sm text-[#878787]">Create your workspace to start managing your business</p>
          </div>
          <CreateTeamForm defaultCountryCode={defaultCountryCode} defaultCurrency={defaultCurrency} />
        </div>
      </div>
    </>
  );
}
