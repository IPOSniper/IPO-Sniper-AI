"use client";
import Link from "next/link";
import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  UserCircle2,
  Activity,
  LogIn,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import type { SearchResult } from "@/app/api/search/route";

export default function Header() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 1) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then(res => res.json())
        .then(data => setResults(data.results ?? []))
        .catch(() => setResults([]));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleaned = query.trim().toUpperCase();
    if (!cleaned) return;
    if (!/^[A-Z.]{1,10}$/.test(cleaned)) {
      setError("That doesn't look like a valid ticker.");
      return;
    }
    setError(null);
    setShowDropdown(false);
    router.push(`/research/${cleaned}`);
    setQuery("");
  }

  function selectResult(symbol: string) {
    setShowDropdown(false);
    setQuery("");
    setResults([]);
    router.push(`/research/${symbol}`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-8">
        <div ref={containerRef} className="relative w-full max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-zinc-500"
            />
            <input
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setQuery(e.target.value);
                setShowDropdown(true);
                if (error) setError(null);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search companies or tickers..."
              className={`w-full rounded-lg border bg-zinc-900 py-2 pl-10 pr-4 text-sm outline-none transition-colors ${
                error ? "border-red-600 focus:border-red-500" : "border-zinc-700 focus:border-cyan-400"
              }`}
            />
            {error && (
              <p className="absolute left-0 top-full mt-1 text-xs text-red-400">{error}</p>
            )}
          </form>

          {showDropdown && query.trim().length > 0 && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
              {results.length > 0 ? (
                <div className="max-h-80 overflow-y-auto py-1">
                  <p className="px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-500">Companies</p>
                  {results.map(r => (
                    <button
                      key={r.symbol}
                      onClick={() => selectResult(r.symbol)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-800"
                    >
                      <span className="text-white">{r.description}</span>
                      <span className="text-zinc-500">{r.symbol}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-2.5 text-sm text-zinc-500">No matches — try an exact ticker and press Enter.</p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-900/40 px-3 py-2 text-sm">
            <Activity size={16} />
            <span>Market Open</span>
          </div>
          <span title="Notifications — coming soon" className="cursor-not-allowed">
            <Bell className="text-zinc-600" />
          </span>
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
