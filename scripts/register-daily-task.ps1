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
Write-Output "First run 'npm run crawl' interactively and pass Cloudflare in the debug Chrome window."
Write-Output "Later auto runs reuse crawler\.chrome-cdp. If Chrome is already using that profile, close it before the task starts."
