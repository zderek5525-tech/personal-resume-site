$ErrorActionPreference = "Stop"
chcp 65001 > $null

$node = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$siteDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = if ($env:PORT) { $env:PORT } else { "4173" }
$env:HOST = if ($env:HOST) { $env:HOST } else { "0.0.0.0" }

if (-not (Test-Path -LiteralPath $node)) {
  throw "Node.js not found: $node"
}

$existing = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
  Where-Object { $_.State -eq "Listen" } |
  Select-Object -First 1

if ($existing) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($existing.OwningProcess)" -ErrorAction SilentlyContinue
  if ($process.CommandLine -like "*server.mjs*") {
    Stop-Process -Id $existing.OwningProcess -Force
    Start-Sleep -Milliseconds 500
  }
}

Start-Process -FilePath $node -ArgumentList @("server.mjs") -WorkingDirectory $siteDir -WindowStyle Hidden
Start-Sleep -Seconds 1

$url = "http://127.0.0.1:$port"
$response = Invoke-WebRequest -Uri $url -UseBasicParsing
if ($response.StatusCode -ne 200) {
  throw "Start failed: HTTP $($response.StatusCode)"
}

Write-Host "Personal intro site is running: $url"

$lanIp = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Sort-Object InterfaceMetric |
  Select-Object -First 1 -ExpandProperty IPAddress

if ($lanIp) {
  Write-Host "Phone/LAN URL: http://$lanIp`:$port/"
} else {
  Write-Host "No LAN IPv4 address found. Make sure Wi-Fi or Ethernet is connected."
}
