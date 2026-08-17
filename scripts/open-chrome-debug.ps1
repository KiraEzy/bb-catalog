$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$profile = Join-Path $projectRoot "crawler\.chrome-cdp"
$url = "https://airsoft.tiger111hk.com/daily_deals.php?currency=HKD&language=en&display_num=360"
$port = 9222

$chrome = @(
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) {
  throw "Google Chrome not found."
}

New-Item -ItemType Directory -Force -Path $profile | Out-Null
Write-Output "Opening Chrome with a dedicated crawler profile."
Write-Output "Pass Cloudflare in this window if asked, then run: npm run crawl"
Start-Process -FilePath $chrome -ArgumentList @(
  "--remote-debugging-port=$port",
  "--user-data-dir=$profile",
  "--no-first-run",
  "--no-default-browser-check",
  $url
)
