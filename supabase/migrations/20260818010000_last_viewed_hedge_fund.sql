-- Real "last viewed" tracking for the Hedge Fund dashboard --
-- Round 118's first piece: the "While You Were Away" summary.
-- Adding a real, nullable column to the existing profiles table
-- rather than a new table -- this is a single per-user timestamp,
-- not a table-shaped concept.
--
-- NOTE: written against documented Supabase/Postgres syntax, not run
-- against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

alter table profiles
  add column if not exists hedge_fund_last_viewed_at timestamptz;
