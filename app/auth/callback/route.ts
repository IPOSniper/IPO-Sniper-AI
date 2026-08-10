import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback: Supabase redirects here with a `code` param after
 * the provider (Google/GitHub) auth completes. Exchanges it for a
 * session, then redirects to wherever the user was headed before
 * being sent to /login (see redirectTo handling in app/login).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo") || "/workstation";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Could not authenticate with that provider.`
  );
}
