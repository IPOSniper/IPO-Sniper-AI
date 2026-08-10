# IPO Sniper AI — Architecture

Last updated: 2026-08-03, at tag `v0.8-workstation-online`.

This is the authoritative map of what's live vs dead. When in doubt
about whether to import from a folder, check here first.

## Live vs Legacy

```
LIVE (imported by the running app, keep):
app/(app)/               — authenticated routes (workstation, portfolio, settings, market, academy)
app/login, app/signup, app/auth/*  — auth flow
app/dev/*                — developer tools, role-gated
app/research/[ticker]/   — research report page
proxy.ts                 — auth + role gating (root of project — renamed from middleware.ts, Next.js 16 convention)
lib/supabase/            — auth clients (browser/server/middleware)
components/workstation/  — Workstation UI (see caveat below)
components/layout/       — AppShell, Sidebar, Header
engine/research/         — ResearchEngine, the real orchestrator
engine/evidence/         — EvidenceEngine + builders (package.ts, builders/*.ts — NOT builders/v2/)
engine/committee/        — CommitteeEngine, ChiefInvestmentOfficer, analysts/* (NOT analysts with "0.0.0-blocked" version)
engine/investment/       — InvestmentDecisionBuilder + its 5 sub-engines
engine/report/           — ResearchReportBuilder
engine/models/           — shared type contracts
engine/core/             — Workstation/WorkflowRunner capability-execution wrapper around ResearchEngine
engine/services/         — ResearchService (used by app/research/[ticker])
engine/ai/ResearchAssembler.ts — maps ResearchReport -> ResearchObject
supabase/migrations/     — profiles table + RLS

DELETED (as of v2.2 — was previously excluded-from-typecheck-only, now actually removed):
engine/gen3/, engine/evidence/builders/v2/ + EvidenceEngineV2.ts + EvidenceEngine.preV2.ts,
engine/backup/, engine/reasoning/intelligence_backup_*/, engine/workstation.disabled/,
engine/knowledge/KnowledgeEngine.v1.ts, engine/orchestration/, engine/committee/CommitteeFactory.ts,
frontend/frontend/ (nested duplicate), top-level backups/, audit/, bootstrap/,
controllers/, devtools/, features/, logs/, reports/, scripts/ (one file restored, see
caveat), services/, src/, terminal-export/, testing/, tools/, and 20 of the 21
"Workstation v1" duplicate panel folders (components/workstation/panels/{AICommittee,
ActivityFeed,BusinessOverview,Catalysts,Committee,CommitteeNotes,Company,Evidence,
EvidenceSummary,ExecutiveSummary,FinancialAnalysis,FinancialOverview,
InstitutionalConviction,InvestmentThesis,LiveFeed,News,NewsSentiment,Reasoning,
Recommendation,Risks,Valuation}).
If you need any of this, it's in git history before the v2.2 tag.

EXCEPTION — components/workstation/panels/MarketContext/ was NOT deleted, on purpose:
a real, live component (MarketContext.tsx) got written into this same pre-existing
"Workstation v1" folder in an earlier round, because mkdir -p silently succeeded into
the already-existing directory instead of erroring. A folder-name-based bulk delete
would have destroyed a real, screenshot-verified-working component. Caught only by
checking file content and content dates individually, not by trusting folder names or
file timestamps (git operations reset mtimes in ways that produced a false "safe to
delete" reading during this same pass — do not trust `find -newer` for this kind of
check either). The stray old index.ts inside that folder was left alone since it now
harmlessly re-exports the real component.

CAUTION — two real mistakes happened during this deletion pass, worth remembering for
next time:
1. Verifying "zero live imports" via TypeScript import statements alone is NOT
   sufficient — it misses package.json script references, CLI entrypoints, and config-
   file paths. scripts/research.ts (package.json's "analyze" script) was deleted and
   had to be restored from git history. Grep package.json/next.config.*/etc, not just
   .ts/.tsx imports, before deleting a folder.
2. A folder that shares a name with something on a "confirmed dead" list from an
   earlier audit round is NOT automatically still dead — check current content, every
   time, immediately before deleting, not just import statements against an old list.

BLOCKED (real code, but throws on purpose — no data source exists):
engine/committee/analysts/KnowledgeAnalyst.ts — see comment at top of file (needs a product decision, not just a data source)
```

**As of this tag, News and SEC are real, not blocked** — `NewsAnalyst` and `SECAnalyst` are registered in the live committee, backed by `NewsBuilder`/`SecBuilder` (NewsAPI.org + SEC EDGAR). See their doc comments for the honest limitations of each (keyword-heuristic sentiment, regex-heuristic prospectus extraction) before trusting the numbers.

**Also confirmed dead this pass:** `engine/evidence/EvidenceEngine.preV2.ts` — already unreferenced, and now also fails to type-check against the current `EvidencePackage` shape (missing `news`/`sec`). Doubly confirmed dead, not fixed, matches the existing legacy-naming cleanup list below.

**Important build-config note:** `tsconfig.json`'s `include` was `**/*.ts`/`**/*.tsx` project-wide with only `node_modules` excluded — meaning `next build`'s type-check was scanning every dead/backup/legacy folder in the repo, not just the live app. This surfaced for real the first time someone actually ran `npm run build` (this sandbox never could, no network). Fixed by adding explicit excludes for every confirmed-dead top-level folder. That pass also turned up several top-level directories nobody had audited all session — `controllers/`, `devtools/`, `features/`, `logs/`, `reports/`, `scripts/`, `services/`, `src/`, `terminal-export/`, `testing/`, `tools/` — all confirmed to have **zero live imports** from `app/`, `components/`, `engine/`, `lib/`, or `hooks/` before excluding. Nobody has looked inside any of them for content worth salvaging — that's still open.

**Proxy API-route behavior:** `proxy.ts` used to redirect *every* unauthenticated/unauthorized request to `/login`, including `/api/*` routes. That's wrong for an API caller (fetch/curl/service) — a 302 to an HTML login page isn't a usable error. Fixed: API routes now get real `401`/`403` JSON responses; page routes still redirect, which is correct browser UX.

**`/api/forecast` and `/api/forecast/earnings`** previously returned `{ success: true, forecasts: [] }` / `{ success: true, earnings: [] }` — a confidently-fake response indistinguishable from "we checked, there's genuinely nothing." No forecast/earnings data source exists anywhere in this codebase (matches `FinancialOverviewChart.tsx`/`EarningsPanel.tsx`'s honest gaps on the UI side). Both now return `501 { success: false, error: "..." }` instead.

**Caveat on `components/workstation/`:** most of it is live and real as of this tag (IntelligenceLayer, AnalystLayer, OperationsLayer, IntelligenceSidebar, and their panels are all wired to real `ResearchObject` data). But the dead "Workstation v1" folders listed above sit in the *same directory* as the live ones — folder location alone doesn't tell you if something's live. Check imports, not just path.

## Research Flow

```
User submits ticker (ResearchTarget)
  -> app/research/[ticker]/page.tsx
  -> ResearchService.load(ticker)
  -> WorkflowRunner.analyze(ticker)
  -> Workstation.execute(ResearchWorkflow) -> ResearchCapability.execute()
  -> ResearchEngine.analyze({ ticker })
       -> EvidenceEngine.build(ticker)      [see Evidence Flow]
       -> CommitteeEngine.analyze(evidence)  [see Committee Flow]
       -> ResearchReportBuilder.build(...)   -> ResearchReport
  -> ResearchAssembler.assemble(report) -> ResearchObject
  -> WorkstationShell renders ResearchObject via IntelligenceLayer/AnalystLayer/OperationsLayer/IntelligenceSidebar
```

Separately, `ResearchEngine.analyzeInvestmentDecision()` builds an
`InvestmentDecisionReport` (Portfolio Impact, Capital Rotation, Risk
Radar, Scenarios) via `InvestmentDecisionBuilder` — this method
exists and is fully real, but **nothing in the live UI calls it
yet**. `ResearchCapability` only calls `.analyze()`. Wiring this in
is open work, not done.

## Evidence Flow

```
EvidenceEngine.build(ticker)
  -> CompanyBuilder       -> Finnhub /stock/profile2   [real, untested live — no network in build sandbox]
  -> FinancialBuilder     -> FinnhubFinancialProvider   [3 fields real: revenueGrowth, grossMargin, operatingMargin
                                                          via Finnhub /stock/metric; 15 fields honestly confidence:0]
  -> ManagementBuilder    -> honestly confidence:0, no provider wired
  -> IPOBuilder           -> Finnhub /calendar/ipo       [real: floatShares, ipoPrice. underwriters honestly
                                                          confidence:0 here — see sec.underwriters instead]
  -> MarketBuilder        -> honestly confidence:0, no provider wired
  -> IndustryBuilder      -> honestly confidence:0, no provider wired
  -> NewsBuilder          -> NewsAPI.org                 [real: articleCount, recentArticles with source/url/date.
                                                          sentimentScore is a keyword heuristic, capped confidence —
                                                          see newsBuilder.ts comment]
  -> SecBuilder           -> SEC EDGAR + ProspectusExtractor [real: latestFiling (100% confidence, actual SEC data).
                                                          underwriters + riskFactorCount are regex-heuristic
                                                          extraction from filing text — see ProspectusExtractor.ts
                                                          comment for exact limitations before trusting them]
```

Check live status any time at `/dev/providers` — it calls
`EvidenceEngine.build()` directly and reports real verified/confidence
numbers across all 7 categories, not a static description.

Required env vars for the real providers: `FINNHUB_API_KEY`,
`SEC_EDGAR_USER_AGENT` (SEC rejects requests without a descriptive
User-Agent), `NEWS_API_KEY`. See `.env.example`.

## Committee Flow

```
CommitteeEngine.analyze(evidence)
  -> ChiefInvestmentOfficer.analyze(evidence)
       -> runs all registered analysts in parallel (15 real + 1 blocked, not registered)
       -> analysts below MIN_USABLE_CONFIDENCE (20) return insufficientDataReport()
          instead of computing a confident verdict off placeholder data
       -> scoring EXCLUDES insufficient-data reports from the average
          (they still appear in .reports for UI transparency)
  -> CommitteeReport { reports, recommendation, overallScore, confidence, agreement, summary }
```

Registered analysts (in `engine/research/researchEngine.ts`):
Revenue, Margin, Financial (via adapter), BalanceSheet, CashFlow,
Growth, Liquidity, Valuation, Industry, Market, Management, Risk,
Verification, News, SEC. Knowledge is NOT registered — it throws
(needs a product decision, not just a data source).

## Provider Flow

Real, network-calling providers today: `FinnhubFinancialProvider`
(partial), `CompanyBuilder` (untested live). Everything else in
Evidence Flow above is an honest placeholder. See `/dev/providers`
for live status.

## Authentication

```
proxy.ts (project root — renamed from middleware.ts per Next.js 16)
  -> public paths (/, /login, /signup, /auth/callback): pass through
  -> no session: redirect to /login?redirectTo=<original path>
  -> /hedge-fund/*: requires role in (hedge_admin, admin)
  -> /dev/*: requires is_developer OR role in (hedge_admin, admin)
  -> everything else: requires any session
```

Session handling: `lib/supabase/client.ts` (browser), `server.ts`
(Server Components/Actions), `lib/supabase/middleware.ts` (the
middleware-specific client). All three exist because Next.js App
Router needs different cookie-handling per context — this isn't
redundancy, it's a requirement of `@supabase/ssr`.

## User Roles

Defined in `supabase/migrations/20260803000000_profiles.sql`:

| role | access |
|---|---|
| guest | landing page, marketing content only (not yet enforced beyond middleware's default "any session required" — no guest-specific UI exists yet) |
| retail | default on signup. Workstation, Portfolio, Watchlist, Alerts, Settings |
| pro | not yet differentiated from retail in code — schema supports it, no feature gating built |
| hedge_admin | + `/hedge-fund/*` |
| admin | + `/hedge-fund/*`, can read all profiles |
| (is_developer flag, any role) | + `/dev/*` |

Role/tier changes are blocked client-side by a DB trigger
(`prevent_self_privilege_escalation`) — must go through a
service-role path (admin action, Stripe webhook, etc.), never a
user's own client.

## Hedge Fund

Not built. `/hedge-fund` is reserved and role-gated in middleware
so that whenever it's built, it ships protected from day one rather
than shipping open and getting locked down after the fact. No pages,
no components, no engine work exist under this prefix yet.

## Folder Ownership

If you're adding a new engine capability: it goes in `engine/<name>/`,
following the existing pattern (a class implementing a narrow
interface, contracts in a `contracts/` or `models/` subfolder).
Register it in `engine/research/researchEngine.ts` if it's an
analyst; wire it into `InvestmentDecisionBuilder` if it's part of
the investment-decision output.

If you're adding a new UI panel: it goes in
`components/workstation/panels/<Name>/`, takes `WorkstationPanelProps`
(`{ research: ResearchObject }`), and gets wired into one of
`IntelligenceLayer` / `AnalystLayer` / `OperationsLayer` /
`IntelligenceSidebar` depending on what it shows. Do not create a
flat `<Name>Panel.tsx` alongside a `<Name>/` folder — that's exactly
the "two generations" problem this file exists to prevent.

## Known unresolved decisions (see PROJECT_STATUS.md history / prior audits for detail)

- Two divergent `InvestigationFinding` interfaces (`engine/investigation/findings/` vs `engine/investigation/contracts/`) — reconcile
- Wall Street vs IPO Sniper AI expectations are currently identical — no external consensus source
- `sector` field always "Unknown" — Finnhub profile2 has no GICS sector field (worked around in Portfolio Intelligence via `sectorOrIndustryLabel()`, but the underlying field is still empty everywhere else)
- **`FinnhubFinancialStatementsProvider.ts` + `FinnhubFinancialStatementMapper.ts` (in `engine/evidence/providers/` and `engine/evidence/mappers/`) — real, complete, working code that fetches and maps actual multi-year financial statements from Finnhub's real SEC XBRL data, discovered during the v2.2 cleanup. Not wired into `EvidenceEngine`/`EvidencePackage` at all — only referenced by a dead scratch script (`engine/testing/TestFinnhubProvider.ts`, kept, not deleted). This is very likely the fastest path to closing the "Financial Overview: no financial-statement-history provider" gap that `FinancialOverviewChart.tsx` has been honestly reporting all session — wiring it in is new `EvidencePackage` category + builder + UI work, not a new provider integration.** Highest-value item on this whole list.
- `engine/playground/RunCompanyAnalysis.ts`, `engine/testing/TestFinnhubProvider.ts` — dead scratch/debug scripts, no npm script references them, kept rather than deleted since they're low-risk and led to the discovery above
