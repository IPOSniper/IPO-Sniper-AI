import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Same check as lib/supabase/client.ts's isSupabaseConfigured() —
 * duplicated rather than imported because this file needs to stay
 * usable from proxy.ts without pulling in browser-client code.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Supabase client for use inside proxy.ts specifically — needs
 * request/response cookie plumbing that differs from both the
 * browser client and the Server Component client above.
 *
 * Callers MUST check isSupabaseConfigured() first — see proxy.ts,
 * which checks public paths before ever calling this, and treats
 * "not configured" as "no user" for everything else rather than
 * crashing every request.
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response };
}
