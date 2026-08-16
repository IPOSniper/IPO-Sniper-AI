import Link from "next/link";

/**
 * Real, deliberate access restriction: this app is a single-owner
 * deployment. Sign-ups are closed at the UI level here, AND (the
 * real security boundary, since this page alone can't stop someone
 * calling Supabase's signup API directly) via Supabase's own
 * "Allow new users to sign up" toggle in the dashboard
 * (Authentication -> Settings), which must be turned off separately
 * -- a real, external account-level action, not something this code
 * can enforce on its own.
 *
 * The original signup form (email/password via supabase.auth.signUp())
 * is preserved in git history (see the commit that replaced it) if
 * signups ever need to be re-enabled.
 */
export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">
          Sign-ups are closed
        </h1>
        <p className="text-sm text-zinc-500">
          IPO Sniper AI is currently a single-owner deployment — new accounts aren&apos;t being created.
        </p>
        <p className="mt-4 text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
