param(
    [switch]$AuditOnly
)

$ErrorActionPreference = "Stop"
$Repo = (Get-Location).Path
$Spec = Join-Path $Repo "IPO_SNIPER_SHARED_INTELLIGENCE_BOOTSTRAP.md"

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " IPO SNIPER AI — SHARED INTELLIGENCE BOOTSTRAP" -ForegroundColor Cyan
Write-Host " DASHBOARD + QUANT / GDELT" -ForegroundColor Cyan
Write-Host "==================================================`n" -ForegroundColor Cyan

# --------------------------------------------------
# 0. REPOSITORY / GIT SAFETY
# --------------------------------------------------
Write-Host "[0] Repository state" -ForegroundColor Yellow
git status --short
git log -1 --oneline --decorate

Write-Host "`n[0b] Existing architecture files" -ForegroundColor Yellow

$targets = @(
    "app\api\ipo-watch",
    "app\api\ipo-filed",
    "app\api\market-news",
    "app\(app)\workstation",
    "engine\quant\OpportunityEngine.ts",
    "engine\quant\OpportunityAdapter.ts",
    "engine\quant\OpportunityScanner.ts",
    "engine\quant\RiskEngine.ts",
    "engine\quant\orchestration",
    "engine\evidence\providers",
    "engine\fundamentals",
    "app\(app)\hedge-fund"
)

foreach ($t in $targets) {
    if (Test-Path $t) {
        Write-Host "FOUND  $t" -ForegroundColor Green
    } else {
        Write-Host "MISSING $t" -ForegroundColor DarkYellow
    }
}

# --------------------------------------------------
# 1. SHARED PROVIDER / NORMALIZATION AUDIT
# --------------------------------------------------
Write-Host "`n[1] Intelligence provider usage" -ForegroundColor Yellow

Get-ChildItem engine,app,components -Recurse -File `
    -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue |
    Select-String -Pattern `
        "CurrentsAPIProvider|NewsAPIProvider|newsBuilder|SEC|EDGAR|GDELT|market-news|ipo-watch|ipo-filed" |
    Select-Object Path,LineNumber,Line |
    Out-Host

# --------------------------------------------------
# 2. QUANT DISCOVERY / ORCHESTRATION AUDIT
# --------------------------------------------------
Write-Host "`n[2] Quant discovery and execution chain" -ForegroundColor Yellow

Get-ChildItem engine,app -Recurse -File `
    -Include *.ts,*.tsx -ErrorAction SilentlyContinue |
    Select-String -Pattern `
        "buildOpportunityUniverse|buildOpportunityUniverseWithStatus|buildAutonomousCandidateSet|scanForOpportunities|runObservationCycle|runAutonomousTradingSession|runBatchScan|placeOrder|RiskEngine|QuantControl" |
    Select-Object Path,LineNumber,Line |
    Out-Host

# --------------------------------------------------
# 3. DASHBOARD / WORKSTATION AUDIT
# --------------------------------------------------
Write-Host "`n[3] Dashboard / Workstation surfaces" -ForegroundColor Yellow

Get-ChildItem app,components -Recurse -File `
    -Include *.ts,*.tsx -ErrorAction SilentlyContinue |
    Select-String -Pattern `
        "IPO Intelligence|Scheduled|Filed|Watch|Live Intelligence|Market Movers|Market Context|Upcoming Earnings|What Matters|Workstation" |
    Select-Object Path,LineNumber,Line |
    Out-Host

# --------------------------------------------------
# 4. SHARED BOOTSTRAP SPEC
# --------------------------------------------------
$spec = @'
# IPO SNIPER AI — SHARED INTELLIGENCE BOOTSTRAP
## Dashboard + Quant / GDELT Integration

==================================================
MISSION
==================================================

Create ONE shared intelligence layer that improves BOTH:

1. IPO Sniper AI Dashboard / Workstation
2. Quant Opportunity Engine / autonomous research

Do NOT build two separate GDELT integrations.

Do NOT create a second news architecture.

Do NOT create a second Quant architecture.

Do NOT replace SEC/EDGAR.

Do NOT replace the existing OpportunityEngine.

Do NOT replace RiskEngine, BatchScanner, QuantOrchestrator,
ObservationCycle, Alpaca execution, position management, or exit engine.

The objective is:

GDELT
+
SEC/EDGAR
+
existing market / earnings / licensed-news infrastructure
        ↓
SHARED INTELLIGENCE NORMALIZER
        ↓
        ┌───────────────────────────────┐
        │                               │
        ↓                               ↓
IPO Sniper Dashboard             Quant Opportunity Engine
        │                               │
IPO Watch / Filed / Radar        catalyst / event discovery
Live Intelligence               ranking / research context
        │                               │
        └──────────────┬────────────────┘
                       ↓
              EXISTING USER / TRADING
                  INFRASTRUCTURE


==================================================
NON-NEGOTIABLE REUSE RULE
==================================================

Before creating ANY new provider, normalizer, cache, route,
hook, dashboard feed, or engine:

1. Search the repository.
2. Identify an existing equivalent.
3. Reuse or extend it.
4. Preserve the existing data contract where practical.
5. Only add new code where the capability genuinely does not exist.

The existing systems remain authoritative:

SEC / EDGAR:
    primary source for filings and IPO filing status

OpportunityEngine:
    primary Quant opportunity-discovery layer

OpportunityAdapter:
    existing bridge into Quant candidate flow

ObservationCycle:
    existing lifecycle

QuantOrchestrator:
    existing orchestration

BatchScanner:
    existing candidate evaluation

RiskEngine:
    existing risk controls

Alpaca execution:
    existing order path

Workstation:
    existing dashboard surface


==================================================
PHASE A — SHARED INTELLIGENCE CONTRACT
==================================================

Find the existing normalized article/news/event contract.

DO NOT immediately create a GDELT-specific UI type.

Create or extend ONE normalized event shape that can represent:

- IPO
- SEC
- NEWS
- STRATEGIC
- INSTITUTIONAL
- EARNINGS
- MARKET
- OPTIONS

Required core fields:

ticker / company when known
headline
description/snippet
source
url
publishedAt
provider
category
query/topic
relevance
attention
related filing/event metadata where available

Provider provenance MUST remain visible internally.

Distinguish:

NO_SIGNAL
DATA_UNAVAILABLE
PROVIDER_ERROR
PROVIDER_QUOTA_EXHAUSTED
PARTIAL_RESULTS


==================================================
PHASE B — GDELT PROVIDER
==================================================

Add ONE server-side GDELT provider.

Reuse the shared intelligence contract.

Requirements:

- GDELT DOC API
- bounded request count
- timeout
- graceful failure
- explicit error propagation
- configurable query
- configurable recent time window
- configurable result count
- normalize publishedAt
- deduplicate
- preserve source URL
- preserve provider name

Use GDELT query capabilities such as:

exact phrases
OR
Boolean operators
NEAR
REPEAT
recent time windows

Do NOT depend on simple company keyword matching.

The purpose is to reduce contamination such as:

"Anthropic mentioned in an article whose real subject is OpenAI."


==================================================
PHASE C — SEC-FIRST IPO INTELLIGENCE
==================================================

SEC remains the authority.

SEC determines:

- S-1
- S-1/A
- filing date
- filing link
- registrant identity
- official filing state

GDELT supports:

- discovery
- article clustering
- public-market rumors
- valuation reports
- IPO timing reports
- financing
- strategic activity
- partnerships
- contracts
- institutional developments

Never turn a GDELT article into an official filing status.

Example:

SEC:
    S-1 filed

GDELT:
    8 relevant reports

Result:

    FILED / VERIFIED


==================================================
PHASE D — IPO WATCH
==================================================

Remove the assumption that IPO Watch is only:

OpenAI
Anthropic

The existing watchlist can remain as seed data temporarily,
but the architecture must allow real candidates to enter.

Supported lifecycle states:

NO_SIGNAL
REPORTED
DEVELOPING
FILED
SCHEDULED
PRICED
POST_IPO
LOCKUP_APPROACHING
UNAVAILABLE
PROVIDER_QUOTA_EXHAUSTED

For each company show:

company
lifecycle state
evidence count
latest relevant source
timestamp
SEC evidence
related events
attention
why surfaced


==================================================
PHASE E — DYNAMIC IPO DISCOVERY
==================================================

Candidate discovery may come from:

SEC filing
GDELT article cluster
credible IPO timing report
funding round
strategic investment
major partnership
major contract
acquisition activity
institutional relationship

Do NOT automatically promote every article into IPO Watch.

Use evidence thresholds.

The candidate system should eventually identify:

EMERGING
WATCH
FILED
SCHEDULED
POST_IPO


==================================================
PHASE F — WORKSTATION LIVE INTELLIGENCE
==================================================

Reuse the existing Workstation feed.

Do NOT create a second live feed.

Feed should merge:

IPO
SEC
NEWS
STRATEGIC
INSTITUTIONAL
EARNINGS
MARKET
OPTIONS

Items should appear chronologically but allow priority ranking.

Each item should include:

time
type
company
headline
source
attention
link

Attention means FEED PRIORITY.

Attention does NOT mean:
BUY
SELL
BULLISH
BEARISH


==================================================
PHASE G — WHAT MATTERS NOW
==================================================

Use the existing dashboard hierarchy.

Create a compact synthesis layer from existing events.

Prioritize:

S-1 filed
S-1/A
IPO timing change
major valuation report
strategic investment
major contract
institutional filing
lock-up event
major post-IPO development
major new listing movement

Do not invent summaries.

Every synthesis item must trace back to evidence.


==================================================
PHASE H — QUANT INTEGRATION
==================================================

GDELT events MUST feed the EXISTING OpportunityEngine
where the existing contract allows it.

Target:

GDELT
    ↓
shared normalized events
    ↓
existing OpportunityEngine
    ↓
existing OpportunityAdapter
    ↓
existing ObservationCycle
    ↓
existing QuantOrchestrator
    ↓
existing BatchScanner
    ↓
existing RiskEngine
    ↓
existing execution

DO NOT:

build a second OpportunityEngine
build a second scanner
build a second committee
build a second risk engine
build a second execution path


==================================================
PHASE I — QUANT EVENT TYPES
==================================================

GDELT-derived events should be classified as appropriate:

NEWS_SHOCK
CONTRACT
PARTNERSHIP
M_AND_A
FINANCING
REGULATORY
PRODUCT
IPO
IPO_RUMOR
VALUATION
INSTITUTIONAL
GEOPOLITICAL

The OpportunityEngine may score these as catalysts.

Do not hard-code final trade direction based on event type.

Event → evidence.

Committee → interpretation.

RiskEngine → approval.


==================================================
PHASE J — SHARED CACHING
==================================================

Reuse existing caching/revalidation.

Do NOT fetch the same GDELT story separately for:

Dashboard
IPO Watch
Quant

Prefer:

one normalized event fetch
→ shared cache
→ multiple consumers

This is important for:

API efficiency
rate limits
latency
consistency


==================================================
PHASE K — WORKSTATION "ALIVE" REQUIREMENT
==================================================

The Dashboard should visibly show activity.

Use existing UI surfaces.

Desired signals:

last updated
new events count
IPO developments
SEC filings
market events
Quant opportunities
timestamps
attention changes

Do NOT manufacture activity with animations.

The page is considered "alive" only when:

real events arrive
timestamps update
counters change
new IPO developments appear
Live Intelligence changes
Quant opportunities can change


==================================================
PHASE L — ERROR INTEGRITY
==================================================

Never display:

NO SIGNAL

when the provider actually failed.

Use:

NO_SIGNAL
DATA_UNAVAILABLE
PROVIDER_ERROR
PROVIDER_QUOTA_EXHAUSTED
PARTIAL_RESULTS

Examples:

SEC works + GDELT fails:
    PARTIAL_RESULTS

GDELT works + no relevant event:
    NO_SIGNAL

GDELT quota exhausted:
    PROVIDER_QUOTA_EXHAUSTED

This must be reflected in the API AND UI.


==================================================
PHASE M — LICENSING
==================================================

GDELT being free does NOT automatically mean every derived
commercial use is solved for every source it surfaces.

Treat provider/source rights separately from API access.

SEC public filings:
    primary public source

GDELT:
    discovery / event layer

Commercial news:
    only use within its license/terms

Do not make licensing claims in code.


==================================================
PHASE N — EXECUTION SEPARATION
==================================================

This build does NOT modify:

Quant Control
RiskEngine
BatchScanner gates
Alpaca execution
position sizing
exit engine
session-aware execution
stock/options order mechanics

Those are separate infrastructure tracks.

The only Quant change here is:
    better intelligence entering OpportunityEngine.


==================================================
PHASE O — ACCEPTANCE TESTS
==================================================

SHARED DATA:

[ ] GDELT returns real normalized events
[ ] SEC continues working
[ ] Provider errors are visible
[ ] No fabricated events
[ ] Duplicate events are removed

IPO DASHBOARD:

[ ] Scheduled uses real data
[ ] Filed uses real SEC data
[ ] Watch can become > 0 when evidence exists
[ ] OpenAI / Anthropic are not the permanent universe
[ ] IPO lifecycle states are visible
[ ] Live Intelligence contains multiple event categories
[ ] Attention does not imply direction

QUANT:

[ ] GDELT event reaches normalized contract
[ ] Normalized event reaches OpportunityEngine
[ ] OpportunityEngine includes catalyst evidence
[ ] OpportunityAdapter remains intact
[ ] Existing BatchScanner remains intact
[ ] Existing RiskEngine remains intact
[ ] No second trading architecture exists

ALIVE WORKSTATION:

[ ] leave page open 10–15 minutes
[ ] real timestamps update
[ ] event counts can change
[ ] IPO intelligence can change
[ ] Live Intelligence can change
[ ] Quant opportunity feed can change


==================================================
PHASE P — BUILD ORDER
==================================================

1. Audit existing shared event/news contract
2. Audit all current provider consumers
3. Add minimal GDELT adapter
4. Normalize into existing contract
5. Add IPO-specific query builders
6. Integrate shared event cache/flow
7. Feed IPO Watch
8. Feed Live Intelligence
9. Feed OpportunityEngine
10. Verify API → Dashboard
11. Verify normalized event → Quant
12. Only then expand dynamic IPO discovery


==================================================
SUCCESS DEFINITION
==================================================

ONE shared intelligence layer powers:

    IPO Sniper Dashboard
            +
    Quant Opportunity Engine

The same underlying event can become:

    IPO Intelligence
    Live Intelligence
    Research evidence
    Quant catalyst
    Opportunity score

without duplicating provider calls or creating parallel architectures.

The goal is not:
"add GDELT to the dashboard."

The goal is:

"Create a reusable intelligence stream that makes both
IPO Sniper AI and Quant more aware, more current,
and more opportunistic."
'@

Set-Content -LiteralPath $Spec -Value $spec -Encoding UTF8

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host " COMBINED BOOTSTRAP GENERATED" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Spec: $Spec"
Write-Host ""
Write-Host "No application code was modified." -ForegroundColor Green
Write-Host "This bootstrap is designed to be executed as ONE shared build:"
Write-Host "GDELT/SEC intelligence -> Dashboard + Quant." -ForegroundColor Green