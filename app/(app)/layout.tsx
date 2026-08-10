import AppShell from "@/components/layout/AppShell";

/**
 * Wraps every route under app/(app)/ — workstation, portfolio,
 * settings, market, academy — in the authenticated app chrome
 * (sidebar + header). Public pages (landing, /login, /signup) live
 * outside this route group and don't get this shell.
 *
 * middleware.ts already blocks unauthenticated requests from
 * reaching anything in this group, so by the time this layout
 * renders, a session is guaranteed to exist.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
