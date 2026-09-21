-- Enforces append-only at the database level: research_calls_ledger rows can
-- never be modified or removed once written, not even by the service_role key
-- (RLS alone does not cover this, since service_role bypasses RLS entirely).
-- This closes the "tamper-evident but not tamper-proof" gap: the hash and the
-- row it protects can no longer be altered together from inside the app.

create or replace function reject_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
    raise exception 'research_calls_ledger is append-only: % is not permitted', TG_OP;
end;
$$;

drop trigger if exists ledger_append_only on research_calls_ledger;
create trigger ledger_append_only
    before update or delete on research_calls_ledger
    for each row
    execute function reject_ledger_mutation();