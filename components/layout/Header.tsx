"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  UserCircle2,
  Activity,
  LogIn,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export default function Header() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleaned = query.trim().toUpperCase();

    if (!cleaned) return;

    if (!/^[A-Z.]{1,10}$/.test(cleaned)) {
      setError("That doesn't look like a valid ticker.");
      return;
    }

    setError(null);
    router.push(`/research/${cleaned}`);
    setQuery("");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-8">

        <form onSubmit={handleSearch} className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-3 text-zinc-500"
          />

          <input
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setQuery(e.target.value); if (error) setError(null); }}
            placeholder="Search a ticker (e.g. AAPL) and press Enter..."
            className={`w-full rounded-lg border bg-zinc-900 py-2 pl-10 pr-4 text-sm outline-none transition-colors ${
              error ? "border-red-600 focus:border-red-500" : "border-zinc-700 focus:border-cyan-400"
            }`}
          />

          {error && (
            <p className="absolute left-0 top-full mt-1 text-xs text-red-400">{error}</p>
          )}
        </form>

        <div className="flex items-center gap-6">

          <div className="flex items-center gap-2 rounded-lg bg-emerald-900/40 px-3 py-2 text-sm">
            <Activity size={16} />
            <span>Market Open</span>
          </div>

          {/* Notifications aren't built yet (no notifications table/
              feed exists in this repo) — cursor-not-allowed and a
              title tell the truth instead of looking clickable and
              doing nothing, matching the Sidebar's "Soon" pattern. */}
          <Bell
            className="cursor-not-allowed text-zinc-600"
            title="Notifications — coming soon"
          />

          {!loading && !profile ? (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-black hover:bg-cyan-400 transition"
            >
              <LogIn size={16} />
              Sign In
            </Link>
          ) : (
            <Link href="/settings" title="Account settings">
              <UserCircle2
                size={34}
                className="cursor-pointer text-zinc-300 transition hover:text-white"
              />
            </Link>
          )}

        </div>

      </div>
    </header>
  );
}
