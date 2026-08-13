-- Real fix for a real, confirmed production error: "new row violates
-- row-level security policy (USING expression) for table
-- 'research_history'". Root cause: the original research_history
-- migration deliberately had no UPDATE policy (append-only snapshots
-- by design, per that file's own comment) -- but publishResearchAction
-- (built later, for the Publish Report / Share Card feature) does a
-- real .upsert() that needs to UPDATE an existing row whenever the
-- same ticker is re-published (e.g. regenerating a Share Card for a
-- ticker already published once). These two features were built with
-- genuinely incompatible assumptions about the same table.
--
-- Scoped identically to the existing insert/select policies -- a user
-- can only ever update their OWN rows (auth.uid() = user_id), same
-- real ownership boundary already enforced everywhere else on this
-- table. Not a broad re-opening of the table, just the one real gap
-- that was blocking a real, legitimate feature.
--
-- NOTE: written against documented Supabase/Postgres syntax, not run
-- against a live database from this sandbox (no network access here).
-- Run this via the Supabase SQL editor or CLI, and verify.

create policy "Users can update their own research history"
  on research_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
