$ErrorActionPreference = "Stop"
chcp 65001 > $null

$projectName = if ($env:CLOUDFLARE_PAGES_PROJECT) { $env:CLOUDFLARE_PAGES_PROJECT } else { "personal-resume-site" }
$siteDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeBin = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$toolBin = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\bin"

if (-not $env:CLOUDFLARE_API_TOKEN) {
  $env:CLOUDFLARE_API_TOKEN = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "User")
}

if (-not $env:CLOUDFLARE_API_TOKEN) {
  $env:CLOUDFLARE_API_TOKEN = [Environment]::GetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "Machine")
}

if (-not $env:CLOUDFLARE_API_TOKEN) {
  throw "CLOUDFLARE_API_TOKEN is not set in the current process, user environment, or machine environment."
}

$env:PATH = "$nodeBin;$toolBin;$env:PATH"
pnpm dlx wrangler pages deploy $siteDir --project-name $projectName --branch main
