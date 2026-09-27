-- Real, shared cache for AI-generated content that only genuinely
-- changes when its real underlying source does (e.g. a company's
-- SEC filing) -- NOT a per-user cache, since this content is the
-- same correct answer for every real user researching this ticker.
-- Real, deliberate design: cache_key already encodes everything that
-- should invalidate a cache hit (feature + ticker + real source
-- version, e.g. a filing date) -- a new real filing means a new
-- real key, not an update to an old row, so old rows are simply
-- never looked up again rather than needing an explicit expiry job.
create table if not exists ai_content_cache (
    cache_key text primary key,
    content text not null,
    created_at timestamptz not null default now()
);

comment on table ai_content_cache is 'Shared cache for AI-generated content keyed by feature + ticker + real source version (e.g. filing date). Same correct content for every user, not per-account.';