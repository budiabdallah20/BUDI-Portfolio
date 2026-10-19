# Generate a locally-trusted HTTPS certificate for the BUDI dev server.
# Requires: openssl (Git for Windows ships one). Run from repo root.
$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo
New-Item -ItemType Directory -Path "certs" -Force | Out-Null

# Pick the machine's LAN IPv4 (best-effort) so phones on Wi-Fi can use the cert.
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -First 1 -ExpandProperty IPAddress)
if (-not $lanIp) { $lanIp = "192.168.1.8" }

$config = @"
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req
x509_extensions = v3_req

[dn]
C = IQ
ST = Baghdad
L = Baghdad
O = BUDI Portfolio (Local Dev)
OU = Development
CN = localhost

[v3_req]
subjectAltName = @alt_names
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
basicConstraints = critical, CA:FALSE

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = budi.local
IP.1 = 127.0.0.1
IP.2 = ::1
IP.3 = $lanIp
"@
Set-Content -Path "certs\openssl.cnf" -Value $config -Encoding ASCII

$opensslCmd = Get-Command openssl -ErrorAction SilentlyContinue
$openssl = if ($opensslCmd) { $opensslCmd.Source } else { $null }
if (-not $openssl) {
  $openssl = "C:\Program Files\Git\usr\bin\openssl.exe"
  if (-not (Test-Path $openssl)) { $openssl = "C:\Users\Administrator\AppData\Local\hermes\git\usr\bin\openssl.exe" }
}
if (-not (Test-Path $openssl)) { throw "openssl not found" }

& $openssl req -x509 -nodes -days 825 -newkey rsa:2048 `
  -keyout certs\localhost.key -out certs\localhost.crt `
  -config certs\openssl.cnf -extensions v3_req

# Trust it on this machine (requires admin). Ignore failure on non-admin runs.
try { certutil -addstore -f "Root" "certs\localhost.crt" | Out-Null; Write-Host "Trusted root installed." }
catch { Write-Warning "Could not install trusted root (run as admin). Browser will show a warning." }

Write-Host "Certificate ready: certs\localhost.crt / certs\localhost.key"
Write-Host "LAN IP included: $lanIp"
