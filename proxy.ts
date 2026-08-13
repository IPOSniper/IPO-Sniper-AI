/**
 * Named proxy.ts, not middleware.ts, because Next.js 16 deprecated
 * the "middleware" file convention in favor of "proxy" (same
 * mechanism — auth/redirect logic before routes render — just
 * renamed). If you're on an older Next.js version, revert this
 * filename to middleware.ts and the function name back to
 * `middleware`.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient, isSupabaseConfigured } from "./lib/supabase/middleware";

// Routes that don't require a logged-in session at all.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
];

// Prefixes that don't require a logged-in session — checked with
// startsWith rather than exact match, either because the path is
// dynamic (/r/[slug]) or because the route authenticates itself a
// different way (/api/cron/* checks CRON_SECRET internally; a user
// session was never the right check for a scheduler hitting this
// with a bearer token instead of a browser cookie).
//
// /education and /api/education/ added here after verifying (not
// assumed) there's zero auth dependency anywhere in the real chain --
// checked app/(app)/education/page.tsx, MarketPulseSection.tsx, and
// api/education/market-pulse/route.ts directly, all clean. Market
// Pulse is real index/instrument data with no user-specific content,
// genuinely safe to make public -- and its share-image route
// specifically NEEDS to be public, since a QR code or Twitter card
// image has to be fetchable by an unauthenticated crawler/browser,
// same reason /r/[slug] is public for research Share Cards.
const PUBLIC_PREFIXES = ["/r/", "/api/cron/", "/education", "/api/education/"];

// Route prefixes that require role 'hedge_admin' or 'admin'.
// The Hedge Fund workspace lives under app/(app)/hedge-fund/ (same
// URL prefix, /hedge-fund, despite the (app) route group folder) —
// gated here so it's protected regardless of whether a nav link
// points to it.
const HEDGE_FUND_PREFIX = "/hedge-fund";

// app/dev/* already exists (ResearchInspector, a raw-JSON debug
// view) and was unprotected by role — any logged-in retail user
// could see raw internal committee/evidence data. Gated here to
// match the "Developer Mode" role concept from the auth design doc.
const DEV_PREFIX = "/dev";

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some(path => pathname === path) ||
    PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix)) ||
    pathname.startsWith("/_next")
  );
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

/**
 * API routes get a real 401/403 JSON body, not a redirect to
 * /login. A redirect is meaningless to a fetch/curl/service caller —
 * either it doesn't follow redirects and just sees a 302 with no
 * useful body, or it does follow and gets back an HTML login page
 * where it expected JSON. Page routes still redirect, since that's
 * the correct UX for a browser navigation.
 */
function unauthorized(request: NextRequest, message: string) {
  if (isApiRoute(request.nextUrl.pathname)) {
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

function forbidden(request: NextRequest, message: string, fallbackPath: string) {
  if (isApiRoute(request.nextUrl.pathname)) {
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }

  return NextResponse.redirect(new URL(fallbackPath, request.url));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public paths never need a Supabase client at all — check this
  // FIRST. The previous version constructed a client unconditionally
  // before this check, which meant an unconfigured Supabase project
  // crashed every request, including the public landing page.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Everything past this point needs auth. If Supabase itself isn't
  // configured, there's no way to check for a session — treat that
  // as "no user" (fail closed: redirect to /login) rather than
  // crashing the request. /login itself is a public path above, so
  // this doesn't loop; it lands on the "Sign-in isn't set up yet"
  // state from app/login/page.tsx.
  if (!isSupabaseConfigured()) {
    return unauthorized(request, "Authentication is not configured.");
  }

  const { supabase, response } = createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized(request, "Authentication required.");
  }

  // If this user enrolled a TOTP factor (see /settings Security
  // section), a password alone only reaches aal1. Redirecting the
  // browser after login (app/login/page.tsx) is UX, not a security
  // boundary — a direct or bookmarked URL to a protected page has
  // to be blocked here too, or MFA enrollment would be theater.
  if (pathname !== "/mfa-challenge") {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aal && aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      if (isApiRoute(pathname)) {
        return NextResponse.json({ success: false, error: "MFA verification required." }, { status: 401 });
      }
      const mfaUrl = new URL("/mfa-challenge", request.url);
      mfaUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(mfaUrl);
    }
  }

  if (pathname.startsWith(HEDGE_FUND_PREFIX)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["hedge_admin", "admin"];

    if (!profile || !allowedRoles.includes(profile.role)) {
      return forbidden(request, "hedge_admin or admin role required.", "/workstation");
    }
  }

  if (pathname.startsWith(DEV_PREFIX)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_developer")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["hedge_admin", "admin"];
    const allowed = profile && (profile.is_developer || allowedRoles.includes(profile.role));

    if (!allowed) {
      return forbidden(request, "Developer access required.", "/workstation");
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on every route except static assets and image optimization
     * files, so session refresh (via createMiddlewareClient) happens
     * on every navigable page.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
