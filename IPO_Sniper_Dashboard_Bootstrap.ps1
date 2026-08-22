param(
  [switch]$AuditOnly,
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'
Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

Write-Host "`n=== IPO SNIPER AI DASHBOARD BOOTSTRAP ===" -ForegroundColor Cyan
Write-Host "Existing-architecture-first. No rebuilds. No new data providers unless required.`n" -ForegroundColor Yellow

# --- 0. Safety / baseline ---
git status --short
git branch --show-current
git log -1 --oneline

# --- 1. Discover existing workstation/dashboard implementation ---
$hits = Get-ChildItem app,components,engine -Recurse -File -Include *.ts,*.tsx,*.css 2>$null |
  Select-String -Pattern 'IPO INTELLIGENCE|IPO Intelligence|Scheduled|Filed|Watch|Live Intelligence|Market Intelligence|Market Context|Market Movers|Upcoming Earnings|Market Feed|IPO Watch|ipo-filed|ipo-watch|workstation' -CaseSensitive:$false |
  Select-Object Path,LineNumber,Line

Write-Host "`n=== RELEVANT EXISTING FILES ===" -ForegroundColor Cyan
$files = $hits.Path | Sort-Object -Unique
$files | ForEach-Object { Write-Host $_ }

# --- 2. Write a compact bootstrap spec using ONLY existing infrastructure ---
$spec = @'
IPO SNIPER AI — DASHBOARD BOOTSTRAP vNEXT
==========================================
MISSION: Refine the EXISTING workstation into the IPO-first intelligence terminal already envisioned. Do not rebuild the architecture. Reuse existing routes/components/data sources first.

CURRENT VISUAL FACTS TO PRESERVE AS BASELINE
- IPO Intelligence currently shows Scheduled 1 / Filed 10 / Watch 0.
- Scheduled currently exposes only one scheduled entry (PTT).
- Filed currently exposes 10 real SEC filings.
- Watch currently renders OpenAI/Anthropic as no-signal in the visible dashboard despite the IPO Watch API previously returning real developing articles; investigate the existing wiring rather than adding another watch system.
- Large unused horizontal/vertical space remains.
- Live Intelligence is still heavily mover-driven.
- Market Context is still thin (SPY/QQQ, VIX unavailable).

WHAT IS STILL MISSING FROM THE AGREED VISION
1) IPO-FIRST COMMAND CENTER
   - Merge Scheduled + Filed + Watch + emerging/discovered IPO intelligence into ONE full-width IPO Intelligence surface.
   - Keep tabs/filters, but stop rendering each as isolated giant cards with empty space.
   - Use a dense table/list/card grid that can show many companies at once.
   - Keep current real SEC Filed feed; do not fabricate IPO status.

2) BROADER UPCOMING/EMERGING IPO DISCOVERY
   - Scheduled=1 is too narrow for the product's core purpose.
   - Use existing data sources first; if they cannot provide breadth, surface that limitation honestly.
   - Candidates should have status/lifecycle labels such as: Rumored, Watch, Filed, Scheduled, Priced, Recent.
   - Attach relevant news/SEC evidence to each candidate.

3) IPO WATCH QUALITY / WIRING
   - Reuse /api/ipo-watch and its existing data path.
   - Fix dashboard mismatch if API returns developing signals but UI shows Watch 0.
   - De-duplicate company coverage; require article relevance to the company, not merely keyword contamination.
   - Preserve source/date/headline evidence.

4) IPO LIFECYCLE / EVENT CONTEXT
   - Existing lifecycle work should be surfaced where available: filing, expected date, pricing, first trade, lock-up, post-IPO.
   - Do not create another event engine if one exists.
   - Show countdown only when a real date exists.

5) STRATEGIC / INSTITUTIONAL RELATIONSHIP INTELLIGENCE
   - Add a compact section within IPO Intelligence, not a separate giant page.
   - Surface existing/verified evidence of: strategic investors, major contracts, partnerships, acquisitions, buyouts, financing, institutional ownership/filings.
   - Every item must carry source/evidence and a date when available.
   - Avoid implying causality from mere mentions.

6) LIVE INTELLIGENCE
   - Keep the existing chronological feed.
   - Rebalance it so it is not mostly raw movers.
   - Use event labels already supported by data: IPO, SEC, News, Earnings, Market, Strategic, Options.
   - Keep the existing attention concept but treat it as feed priority, not bullish/bearish.

7) MARKET INTELLIGENCE
   - Reuse the existing Market Context and Market Movers.
   - Make price-change semantics obvious: current price, dollar change, previous/reference close, 1D % change.
   - Add broader market fields only where real data already exists; do not invent VIX/10Y/gold/oil/BTC values.
   - If data is unavailable, show unavailable explicitly.

8) DENSITY / SPACE
   - Use the available width.
   - Prefer a single full-width IPO command center at the top.
   - Keep Market Intelligence compact below it.
   - Keep supporting Research/Earnings/Market Feed lower on the page.
   - Do not add more giant empty panels.

9) COPY / DEFINITIONS
   - "1D Price Change" = price change from previous/reference close.
   - "Attention" = feed priority; not an investment recommendation.
   - Make "Filed" visibly mean a real SEC filing; do not call every filing an IPO.

10) ARCHITECTURE RULE
   - Reuse existing routes, components, fetchers, IPO Engine, SEC feed, NewsAPI path, Market Movers, Live Intelligence, Earnings, and existing workstation page.
   - No parallel IPO engine.
   - No duplicate news engine.
   - No duplicate market-data provider.
   - No wholesale rewrite.

IMPLEMENTATION ORDER
A. Audit existing workstation component(s) and data routes; identify exact source of Scheduled/File/Watch counts and renderers.
B. Fix Watch UI/API mismatch before expanding UI.
C. Merge IPO Intelligence layout using existing data contracts.
D. Surface IPO lifecycle + strategic/institutional evidence using existing sources.
E. Rebalance Live Intelligence feed categories.
F. Tighten Market Intelligence density/labels without adding unsupported data.
G. Type-check + diff-check + deploy only after exact-path verification.

ACCEPTANCE TESTS
- IPO Intelligence is one dominant full-width command center.
- Scheduled/File/Watch counts are real and dynamically derived.
- Watch does not remain 0 when /api/ipo-watch returns developing companies.
- Filed continues to show real SEC filings.
- No fabricated IPO dates/statuses.
- Strategic/institutional items show evidence/source.
- Live feed is mixed, not mover-only.
- Market Movers clearly explains % change.
- No new duplicate engine/route/provider was introduced.
- Git diff is limited to targeted dashboard files.
'@

$specPath = Join-Path (Get-Location) 'IPO_SNIPER_DASHBOARD_BOOTSTRAP.md'
Set-Content -LiteralPath $specPath -Value $spec -Encoding UTF8

Write-Host "`nBootstrap spec written: $specPath" -ForegroundColor Green

# Copy to clipboard for immediate use in Claude/terminal agent.
if (Get-Command Set-Clipboard -ErrorAction SilentlyContinue) {
  $spec | Set-Clipboard
  Write-Host "Bootstrap spec copied to clipboard." -ForegroundColor Green
}

if ($AuditOnly) {
  Write-Host "`nAUDIT ONLY: no files changed except the generated bootstrap spec." -ForegroundColor Yellow
  exit 0
}

if (-not $Apply) {
  Write-Host "`nNo application changes made. Review the spec, then rerun with -Apply when ready." -ForegroundColor Yellow
  exit 0
}

# This script intentionally does NOT auto-edit unknown UI code.
# It creates the grounded implementation contract, then requires the coding agent/manual edit.
Write-Host "`nApply mode requested, but no blind source rewrite is performed." -ForegroundColor Yellow
Write-Host "Use the generated spec with the existing coding agent, then run the normal type-check/deploy workflow." -ForegroundColor Yellow
