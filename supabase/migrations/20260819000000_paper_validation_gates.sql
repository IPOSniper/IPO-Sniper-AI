-- Real, persistent per-test flag for the paper-validation execution
-- gate mode -- per direct, deliberate instruction: "lower the gate
-- only in the paper-validation environment." Must be persisted (not
-- just a UI-session choice) since the real cron path runs
-- independently of any browser session and needs to know which real
-- gate set this specific test was started with.
--
-- NOTE: written against documented Supabase/Postgres syntax, not run
-- against a live database from this sandbox (no network access
-- here). Run this via the Supabase SQL editor or CLI, and verify.

alter table quant_test_harness
  add column if not exists use_paper_validation_gates boolean not null default false;
