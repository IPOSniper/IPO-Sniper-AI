"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workstation", href: "/workstation", icon: Home },
  { label: "Market Pulse", href: "/education", icon: GraduationCap },
  { label: "IPO Calendar", href: "/calendar", icon: Rocket, comingSoon: true },
  { label: "AI Rankings", href: "/rankings", icon: BrainCircuit, comingSoon: true },
  { label: "Watchlist", href: "/watchlist", icon: Eye },
  { label: "Portfolio", href: "/portfolio", icon: BriefcaseBusiness, comingSoon: true },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile } = useProfile();

  return (
    <aside className="hidden w-20 border-r bg-zinc-950 text-zinc-100 lg:flex lg:flex-col">
      <div className="flex flex-col items-center border-b p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-950 text-sm font-bold text-violet-300">
          IS
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {links.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          if (item.comingSoon) {
            return (
              <div
                key={item.href}
                title={`${item.label} — Coming soon`}
                className="flex cursor-not-allowed flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-zinc-600"
              >
                <Icon size={20} />
                <span className="text-[8px] uppercase tracking-wide text-zinc-700">Soon</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 transition ${
                active
                  ? "bg-violet-950 text-violet-300"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <Icon size={20} />
            </Link>
          );
        })}

        {(profile?.role === "hedge_admin" || profile?.role === "admin") && (
          <Link
            href="/hedge-fund"
            title="Hedge Fund"
            className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 transition ${
              pathname === "/hedge-fund"
                ? "bg-violet-950 text-violet-300"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <ShieldCheck size={20} />
          </Link>
        )}
      </nav>

      <div className="flex flex-col items-center gap-2 border-t border-zinc-900 p-2">
        {profile && (
          <div title={profile.displayName || profile.email} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300">
            {(profile.displayName || profile.email).charAt(0).toUpperCase()}
          </div>
        )}

        <a href="/#disclosures" title="Disclosures & Terms" className="text-zinc-600 hover:text-zinc-400">
          <span className="text-[9px]">Terms</span>
        </a>

        {profile ? (
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              title="Sign out"
              className="flex items-center justify-center rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <LogOut size={18} />
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            title="Sign in"
            className="flex items-center justify-center rounded-lg bg-violet-600 p-2 text-white transition hover:bg-violet-500"
          >
            <LogIn size={18} />
          </Link>
        )}
      </div>
    </aside>
  );
}
