Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$path = ".github\workflows\quant-opportunities.yml"

$lines = @(
'# Real, persistent external trigger for Opportunity Discovery --'
'# calls the real /api/cron/quant-opportunities route on a schedule.'
'# The scheduler itself contains zero discovery logic -- it is'
'# purely "invoke this real endpoint periodically," nothing more.'
'#'
'# Real, honest prerequisite, not assumed: this file only does'
'# anything once committed to a real GitHub repository with Actions'
'# enabled, AND the existing repository secret QUANT_CRON_SECRET'
'# (already configured for quant-harness.yml) matches the real'
'# CRON_SECRET value in Vercel production. No new secret is needed --'
'# both cron routes check the same CRON_SECRET env var.'
'#'
'# Real, deliberate interval: every 30 minutes, not 10 -- this route'
'# does discovery/scoring against earnings and catalyst data, not a'
'# time-sensitive trading decision, and this app has already shown'
'# real Finnhub 429 pressure under frequent calls. 30 minutes gives'
'# Current Opportunities real, bounded freshness (previously it had'
'# NO schedule at all and was only ever triggered manually, which is'
'# the confirmed root cause of "STALE 73h ago" opportunities). GitHub'
'# Actions schedule triggers are not guaranteed to run at the exact'
'# minute specified -- this is an upper bound on frequency, not a'
'# precise clock.'
'name: Quant Opportunities Discovery Cron'
'"on":'
'  schedule:'
'    - cron: "*/30 * * * *"'
'  workflow_dispatch: {}'
'jobs:'
'  trigger-discovery:'
'    runs-on: ubuntu-latest'
'    steps:'
'      - name: Call the real opportunity discovery endpoint'
'        run: |'
'          curl -sf -X GET \'
'            -H "Authorization: Bearer ${{ secrets.QUANT_CRON_SECRET }}" \'
'            "https://ipo-sniper-ai.vercel.app/api/cron/quant-opportunities"'
)

$content = $lines -join "`r`n"

[System.IO.File]::WriteAllText(
    (Resolve-Path ".github\workflows" | Join-Path -ChildPath "quant-opportunities.yml"),
    $content,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "PATCHED: quant-opportunities.yml created." -ForegroundColor Green

Write-Host "`n=== VERIFY ===" -ForegroundColor Cyan
Get-Item $path | Select-Object Name, Length
Get-Content $path | Select-String -Pattern "cron:|QUANT_CRON_SECRET|quant-opportunities"

Write-Host "`n=== COMMIT AND PUSH (no Vercel deploy needed -- this is GitHub-only) ===" -ForegroundColor Cyan
git add $path
git commit -m "feat: schedule quant-opportunities discovery cron every 30 min via GitHub Actions"
git push origin HEAD:main