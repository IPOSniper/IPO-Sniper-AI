create table if not exists research_calls_ledger (
    id uuid primary key default gen_random_uuid(),
    ticker text not null,
    company_name text not null,
    recommendation text not null,
    conviction integer not null,
    confidence integer not null,
    agreement integer not null,
    committee_snapshot jsonb not null,
    content_hash text not null,
    created_at timestamptz not null default now()
);

create index if not exists research_calls_ledger_ticker_idx on research_calls_ledger (ticker, created_at desc);

alter table research_calls_ledger enable row level security;

create policy "Public read access" on research_calls_ledger
    for select using (true);

create policy "Service role can insert" on research_calls_ledger
    for insert with check (true);
