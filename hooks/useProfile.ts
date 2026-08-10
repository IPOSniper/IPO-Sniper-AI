"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  role: "guest" | "retail" | "pro" | "hedge_admin" | "admin";
  isDeveloper: boolean;
}

/**
 * Client-side hook for the current user's profile (role, display
 * name, etc.) — used by the sidebar to show who's logged in and to
 * decide whether to show role-gated nav items. Redundant with
 * middleware's server-side role check by design: middleware is the
 * actual security boundary, this is just for UI decisions. Never
 * trust this hook alone to gate access to sensitive data or actions.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, email, display_name, role, is_developer")
        .eq("id", user.id)
        .single();

      if (!cancelled && data) {
        setProfile({
          id: data.id,
          email: data.email,
          displayName: data.display_name,
          role: data.role,
          isDeveloper: data.is_developer,
        });
      }

      if (!cancelled) setLoading(false);
    }

    load();

    return () => { cancelled = true; };
  }, []);

  return { profile, loading };
}
