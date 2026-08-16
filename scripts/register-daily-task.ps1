param(
  [string]$Time = "07:00"
)

$ErrorActionPreference = "Stop"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$taskName = "BBCatalogDailyCrawl"

$action = New-ScheduledTaskAction -Execute $npm -Argument "run crawl-and-publish" -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
Write-Output "Registered scheduled task '$taskName' daily at $Time"
Write-Output "Working directory: $projectRoot"
Write-Output "If Cloudflare blocks headless runs, run 'npm run crawl:headed' once, then leave crawler/storage-state.json in place."
