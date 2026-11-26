# Backup de la base local antes de aplicar migraciones.
# Se guarda en /backups (ignorado por git) con fecha y hora en el nombre.
$ErrorActionPreference = "Stop"

$carpeta = Join-Path (Get-Location) "backups"
New-Item -ItemType Directory -Force -Path $carpeta | Out-Null
$archivo = Join-Path $carpeta ("backup-" + (Get-Date -Format "yyyyMMdd-HHmm") + ".sql")

Write-Host "[Carpoo] Haciendo backup en $archivo"
cmd /c "docker compose exec -T db pg_dump -U carpoo -d carpoo --no-owner --no-privileges > `"$archivo`""

if ($LASTEXITCODE -ne 0) {
  throw "No se pudo hacer el backup. Revisá que la base esté levantada."
}
Write-Host "[Carpoo] Backup listo."
