"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Rocket,
  BrainCircuit,
  Eye,
  BriefcaseBusiness,
  Bell,
  Settings,
  LogOut,
  LogIn,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

const links = [
  {
    label: "Workstation (Home)",
    href: "/workstation",
    icon: Home,
  },
  {
    label: "Market Pulse",
    href: "/education",
    icon: GraduationCap,
  },
  {
    label: "IPO Calendar",
    href: "/calendar",
    icon: Rocket,
    comingSoon: true,
  },
  {
    label: "AI Rankings",
    href: "/rankings",
    icon: BrainCircuit,
    comingSoon: true,
  },
  {
    label: "Watchlist",
    href: "/watchlist",
    icon: Eye,
  },
  {
    label: "Portfolio",
    href: "/portfolio",
    icon: BriefcaseBusiness,
    comingSoon: true,
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: Bell,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

// Hedge Fund is real (app/(app)/hedge-fund/page.tsx) and gated
// server-side by proxy.ts to hedge_admin/admin roles — this link is
// an added convenience, not the security boundary. Only shown to
// roles that would actually get past the gate, so retail accounts
// don't see a link that 403s.

export default function Sidebar() {
  const pathname = usePathname();
  const { profile } = useProfile();

  return (
    <aside className="hidden w-64 border-r bg-zinc-950 text-zinc-100 lg:flex lg:flex-col">
      <div className="border-b p-6">
        <h1 className="text-2xl font-bold">
          IPO Sniper AI
        </h1>

        <p className="mt-1 text-sm text-zinc-400">
          AI-Powered IPO Intelligence
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {links.map((item) => {
          const Icon = item.icon;

          const active = pathname === item.href;

          if (item.comingSoon) {
            return (
              <div
                key={item.href}
                title="Coming soon"
                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-4 py-3 text-zinc-600"
              >
                <Icon size={20} />

                {item.label}

                <span className="ml-auto rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon size={20} />

              {item.label}
            </Link>
          );
        })}

        {(profile?.role === "hedge_admin" || profile?.role === "admin") && (
          <Link
            href="/hedge-fund"
            className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
              pathname === "/hedge-fund"
                ? "bg-blue-600 text-white"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <ShieldCheck size={20} />
            Hedge Fund
          </Link>
        )}
      </nav>

      <div className="border-t border-zinc-900 p-4">
        {profile && (
          <div className="mb-2 px-1">
            <p className="truncate text-sm text-white">
              {profile.displayName || profile.email}
            </p>
            <p className="text-xs capitalize text-zinc-500">
              {profile.role.replace("_", " ")}
            </p>
          </div>
        )}

        <a
          href="/#disclosures"
          className="block px-4 py-1 text-xs text-zinc-600 hover:text-zinc-400"
        >
          Disclosures &amp; Terms
        </a>

        {profile ? (
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center gap-3 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-400"
          >
            <LogIn size={18} />
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
