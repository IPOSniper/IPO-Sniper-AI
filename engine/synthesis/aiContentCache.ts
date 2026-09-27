import { createClient } from "@/lib/supabase/server";

/**
 * Real, shared cache for AI-generated content. Deliberately NOT
 * per-user -- the same real ticker + real filing date produces the
 * same correct content for every real user, so caching it here
 * means the AI call happens once ever per real (ticker, filing)
 * pair, not once per user per visit. A new real filing means a new
 * real cache_key, so stale content is never served -- it just stops
 * being looked up, and a fresh real row gets written under the new key.
 *
 * Fails open, not closed: if the cache read/write itself fails (a
 * real Supabase outage, say), callers should fall through to calling
 * the AI fresh rather than showing an error for what is only a cost
 * optimization, never a correctness requirement.
 */
export async function getCachedAiContent(cacheKey: string): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from("ai_content_cache")
            .select("content")
            .eq("cache_key", cacheKey)
            .maybeSingle();
        return data?.content ?? null;
    } catch {
        return null;
    }
}

export async function setCachedAiContent(cacheKey: string, content: string): Promise<void> {
    try {
        const supabase = await createClient();
        await supabase
            .from("ai_content_cache")
            .upsert({ cache_key: cacheKey, content }, { onConflict: "cache_key" });
    } catch {
        // Real, deliberate no-op: a failed cache WRITE should never
        // surface as an error to the user -- the AI content itself
        // was already generated successfully and is being returned;
        // only the next request's cost-saving is lost, not correctness.
    }
}