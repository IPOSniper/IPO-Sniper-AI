import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components and Server
 * Actions. Reads/writes the session via Next.js's cookies() so the
 * user stays logged in across server-rendered pages.
 *
 * NOTE: in a Server Component (not a Server Action or Route
 * Handler), cookies().set() will throw — that's expected Next.js
 * behavior, not a bug here. Session refresh in that context happens
 * in middleware.ts instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore since
            // middleware.ts handles session refresh on every request.
          }
        },
      },
    }
  );
}
