param(
  [ValidateSet('blue','green')]
  [string]$TargetColor
)

$ErrorActionPreference = 'Stop'

function Get-ActiveColor {
  $conf = Get-Content -Path "$PSScriptRoot/../nginx/default.conf" -Raw
  if ($conf -match 'transaction-validator-blue') { return 'blue' } else { return 'green' }
}

function Switch-Nginx([string]$color) {
  Write-Host "Cambiando NGINX a $color"
  $src = "$PSScriptRoot/../nginx/nginx.conf"
  $content = Get-Content -Path $src -Raw
  $original = $content
  if ($color -eq 'blue') {
    $content = $content -replace 'transaction-validator-green','transaction-validator-blue'
  } else {
    $content = $content -replace 'transaction-validator-blue','transaction-validator-green'
  }
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($src, $content, $enc)
  try {
    docker exec nginx nginx -t
    docker exec nginx nginx -s reload
  } catch {
    [System.IO.File]::WriteAllText($src, $original, $enc)
    throw 'Error al recargar NGINX; revertido archivo de configuración'
  }
}

function Health-Check([string]$port) {
  try {
    $res = Invoke-WebRequest -Uri "http://localhost:$port/healthz" -UseBasicParsing -TimeoutSec 5
    return $res.StatusCode -eq 200
  } catch { return $false }
}

function Wait-ForHealth([string]$port, [int]$attempts = 12, [int]$delayMs = 500) {
  for ($i = 1; $i -le $attempts; $i++) {
    if (Health-Check -port $port) { return $true }
    Start-Sleep -Milliseconds $delayMs
  }
  return $false
}

function Smoke-Health([string]$url, [int]$attempts = 5) {
  for ($i = 1; $i -le $attempts; $i++) {
    try {
      $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
      if ($res.StatusCode -eq 200) { return $true }
    } catch {}
    Start-Sleep -Milliseconds 300
  }
  return $false
}

function Smoke-ValidateDirect([string]$port, [int]$attempts = 3) {
  for ($i = 1; $i -le $attempts; $i++) {
    try {
      $body = (@{transactionId='smoke'; amount=10} | ConvertTo-Json)
      $res = Invoke-WebRequest -Uri "http://localhost:$port/validate" -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing -TimeoutSec 5
      if ($res.StatusCode -eq 200 -or $res.StatusCode -eq 422) { return $true }
    } catch {}
    Start-Sleep -Milliseconds 300
  }
  return $false
}

docker compose build transaction-validator-blue transaction-validator-green

$active = Get-ActiveColor
$inactive = if ($active -eq 'blue') { 'green' } else { 'blue' }

Write-Host "Activo: $active, Inactivo: $inactive"

docker compose up -d "transaction-validator-$inactive"

$port = if ($inactive -eq 'blue') { 8081 } else { 8082 }
if (-not (Wait-ForHealth -port $port)) { throw "Health check falló en $inactive" }

if (-not (Smoke-ValidateDirect -port $port)) {
  Write-Host "Smoke directo falló en $inactive; abortando conmutación"
  docker compose rm -sf "transaction-validator-$inactive"
  throw 'Validación previa falló'
}

Switch-Nginx -color $inactive

Start-Sleep -Seconds 5

$ok = Smoke-Health -url "http://localhost/healthz" -attempts 12

if (-not $ok) {
  Write-Host 'Validación vía localhost falló; verificando salud directa del color inactivo'
  if (-not (Wait-ForHealth -port $port)) {
    Write-Host 'Salud directa falló, haciendo rollback'
    Switch-Nginx -color $active
    Write-Host 'Logs del contenedor inactivo:'
    try { docker logs "transaction-validator-$inactive" --tail 100 } catch {}
    docker compose rm -sf "transaction-validator-$inactive"
    throw 'Rollback ejecutado'
  } else {
    Write-Host 'App saludable en puerto directo; conservando conmutación'
  }
}

Write-Host "Despliegue completado. Activo: $inactive"
