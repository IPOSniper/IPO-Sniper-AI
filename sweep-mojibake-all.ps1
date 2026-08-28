Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$targets = Get-ChildItem "components\workstation","app\workstation","app\(app)\workstation","app\education","app\(app)\education" -Recurse -File -Include *.tsx,*.ts -ErrorAction SilentlyContinue

$latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
$totalFixed = 0
$filesFixed = @()

foreach ($file in $targets) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $text = $latin1.GetString($bytes)
    $mojiPattern = "[\x80-\xFF]{1,15}"
    $moji = [regex]::Matches($text, $mojiPattern)
    if ($moji.Count -gt 0) {
        $newText = [regex]::Replace($text, $mojiPattern, "-")
        $newText = [regex]::Replace($newText, "  +", " ")
        [System.IO.File]::WriteAllText($file.FullName, $newText, (New-Object System.Text.UTF8Encoding($false)))
        $totalFixed += $moji.Count
        $filesFixed += "$($file.FullName) ($($moji.Count) fixed)"
        Write-Host "PATCHED: $($file.Name) - $($moji.Count) sequence(s)" -ForegroundColor Green
    }
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Files scanned: $($targets.Count)"
Write-Host "Files fixed: $($filesFixed.Count)"
Write-Host "Total sequences fixed: $totalFixed"

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check