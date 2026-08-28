Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

function Clean-MojibakeFile($path) {
    # Read the raw bytes and decode as Latin-1 (ISO-8859-1) -- this maps
    # every byte 0x00-0xFF to the character with that exact code point,
    # a lossless 1:1 mapping. This lets us find corrupted (non-ASCII)
    # byte runs mathematically, without ever typing a literal corrupted
    # character in this script -- avoiding every encoding hop problem
    # we hit trying to match these as literal string patterns.
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
    $text = $latin1.GetString($bytes)

    $totalReplacements = 0

    # Special case first: "Scanning" directly followed by a corrupted
    # run (no space) is the ellipsis case -- give it "..." specifically.
    $pattern1 = "Scanning[\x80-\xFF]{1,12}"
    $matches1 = [regex]::Matches($text, $pattern1)
    if ($matches1.Count -gt 0) {
        $text = [regex]::Replace($text, $pattern1, "Scanning...")
        $totalReplacements += $matches1.Count
    }

    # General case: any remaining run of 1-15 non-ASCII (high) bytes
    # gets replaced with a single hyphen -- covers corrupted em-dashes,
    # emoji/checkmark/pause/hourglass prefixes, and any other mangled
    # decorative character. Collapse any resulting double-spaces after.
    $pattern2 = "[\x80-\xFF]{1,15}"
    $matches2 = [regex]::Matches($text, $pattern2)
    if ($matches2.Count -gt 0) {
        $text = [regex]::Replace($text, $pattern2, "-")
        $totalReplacements += $matches2.Count
    }

    $text = [regex]::Replace($text, "  +", " ")
    $text = [regex]::Replace($text, "- +Execute", "Execute")
    $text = [regex]::Replace($text, "- +Skip", "Skip")
    $text = [regex]::Replace($text, "- +Wait", "Wait")

    if ($totalReplacements -gt 0) {
        [System.IO.File]::WriteAllText(
            (Resolve-Path $path),
            $text,
            (New-Object System.Text.UTF8Encoding($false))
        )
        Write-Host "  Fixed $totalReplacements corrupted sequence(s) in $path" -ForegroundColor Green
    } else {
        Write-Host "  No corrupted sequences found in $path" -ForegroundColor Yellow
    }
    return $totalReplacements
}

Write-Host "=== Cleaning BatchScannerPanel.tsx ===" -ForegroundColor Cyan
Clean-MojibakeFile "components\hedge-fund\BatchScannerPanel.tsx"

Write-Host ""
Write-Host "=== Cleaning CurrentOpportunitiesPanel.tsx ===" -ForegroundColor Cyan
Clean-MojibakeFile "components\hedge-fund\CurrentOpportunitiesPanel.tsx"

Write-Host ""
Write-Host "=== VERIFY: scan for ANY remaining non-ASCII byte in either file ===" -ForegroundColor Cyan
foreach ($p in @("components\hedge-fund\BatchScannerPanel.tsx", "components\hedge-fund\CurrentOpportunitiesPanel.tsx")) {
    $bytes = [System.IO.File]::ReadAllBytes($p)
    $latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
    $text = $latin1.GetString($bytes)
    $remaining = [regex]::Matches($text, "[\x80-\xFF]")
    Write-Host "$p -- remaining non-ASCII bytes: $($remaining.Count)"
}

Write-Host ""
Write-Host "=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
