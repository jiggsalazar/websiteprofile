$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$vbsPath = Join-Path $projectDir "start-local-site-hidden.vbs"
$shortcutPath = Join-Path ([Environment]::GetFolderPath("Desktop")) "Open WEB Profile Site.url"
$startupShortcutPath = Join-Path ([Environment]::GetFolderPath("Startup")) "WEB Profile Local Site.lnk"
$taskName = "WEB Profile Local Site"
$siteUrl = "http://127.0.0.1:8765/"

$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$vbsPath`""
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

try {
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Keeps the WEB Profile local website available on this laptop." -Force | Out-Null
  $installedStartup = "Scheduled task: $taskName"
} catch {
  $wscript = New-Object -ComObject WScript.Shell
  $startupShortcut = $wscript.CreateShortcut($startupShortcutPath)
  $startupShortcut.TargetPath = "wscript.exe"
  $startupShortcut.Arguments = "`"$vbsPath`""
  $startupShortcut.WorkingDirectory = $projectDir
  $startupShortcut.WindowStyle = 7
  $startupShortcut.Save()
  $installedStartup = "Startup shortcut: $startupShortcutPath"
}

$shortcut = @"
[InternetShortcut]
URL=$siteUrl
"@
Set-Content -Path $shortcutPath -Value $shortcut -Encoding ASCII

Start-Process -FilePath "wscript.exe" -ArgumentList "`"$vbsPath`""
Start-Process $siteUrl

Write-Host "Installed startup launcher: $installedStartup"
Write-Host "Desktop shortcut created: $shortcutPath"
Write-Host "Site URL: $siteUrl"
