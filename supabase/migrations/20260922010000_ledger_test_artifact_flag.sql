-- Flags rows that are known, disclosed test artifacts rather than genuine
-- research calls -- without ever mutating their content (the append-only
-- trigger added in 20260922000000_ledger_append_only_trigger.sql makes that
-- impossible by design, which is correct: a row that was written before the
-- trigger existed and got overwritten mid-test cannot be silently "fixed"
-- without undermining the same tamper-evidence guarantee it's meant to prove).
--
-- Default false so every existing and future real row is unaffected. Any
-- future public verification page / aggregate ledger view must exclude
-- is_test_artifact = true rows from published track-record statistics.

alter table research_calls_ledger
    add column if not exists is_test_artifact boolean not null default false;

-- One known incident: this row's recommendation was overwritten to the
-- literal string 'TEST' during trigger testing on 2026-09-21, before the
-- append-only trigger was actually live in this database (the trigger SQL
-- had been written to a migration file and committed to git, but not yet
-- run against Supabase -- confirmed via pg_trigger returning zero rows at
-- the time). Its content_hash no longer corresponds to any recoverable
-- original snapshot, so it is flagged and permanently excluded rather than
-- guessed back into a plausible-looking value.
update research_calls_ledger
set is_test_artifact = true
where id = 'ced8f848-63f5-4b4a-af2d-9a2ff8780d53';