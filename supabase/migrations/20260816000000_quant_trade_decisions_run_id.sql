-- Real link from each per-ticker decision back to the specific run
-- that produced it -- the actual foundation the run drill-down tree
-- needs. Without this, quant_trade_decisions rows have no way to be
-- grouped by "which Run Trading Session click produced this."
--
-- Nullable: historical rows from before this existed genuinely have
-- no run to link back to, and that's honest -- not backfilled with
-- a guess.
--
-- NOTE: written against documented Supabase/Postgres syntax, not run
-- against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

alter table quant_trade_decisions
  add column if not exists run_id uuid;

create index if not exists quant_trade_decisions_run_id_idx
  on quant_trade_decisions (run_id);
