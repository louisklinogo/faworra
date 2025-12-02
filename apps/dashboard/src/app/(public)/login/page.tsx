import { cookies } from "next/headers";
import Link from "next/link";
import { GoogleSignIn } from "@/components/google-sign-in";
import { OTPSignIn } from "@/components/otp-sign-in";
import { Icons } from "@/components/ui/icons";
import { CookiePreferredSignInProvider } from "@/lib/cookies";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const preferred = cookieStore.get(CookiePreferredSignInProvider)?.value;

  return (
    <div className="flex min-h-screen">
      {/* Left hero (hidden on mobile) */}
      <div className="hidden bg-gradient-to-br from-gray-50 to-gray-100 lg:block lg:w-1/2 dark:from-zinc-900 dark:to-zinc-800" />
      {/* Right: form */}
      <div className="relative w-full lg:w-1/2">
        <header className="absolute top-0 left-0 w-full p-6">
          <div className="flex items-center gap-2">
            <Icons.FaworraBlack className="h-16 w-auto md:h-24 dark:hidden" />
            <Icons.FaworraWhite className="hidden h-16 w-auto md:h-24 dark:block" />
          </div>
        </header>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="font-serif text-lg">Welcome</h1>
              <p className="text-muted-foreground text-sm">Choose how you want to continue</p>
            </div>
            <div className="space-y-4">
              <GoogleSignIn />
              <div className="flex items-center justify-center">
                <span className="text-muted-foreground text-xs">Or</span>
              </div>
              <OTPSignIn />
            </div>
            <div className="text-center text-muted-foreground text-xs">
              By signing in you agree to our{" "}
              <Link className="underline" href="#">
                Terms of service
              </Link>{" "}
              &{" "}
              <Link className="underline" href="#">
                Privacy policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
