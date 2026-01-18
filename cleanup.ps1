# Script de limpieza completa para MediCore ERP
# Ejecutar como Administrador en PowerShell

Write-Host "=== LIMPIEZA COMPLETA DE MEDICORE ERP ===" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del proyecto
$projectPath = "D:\Cursor Josito\medicore-erp"
if (-not (Test-Path $projectPath)) {
    Write-Host "ERROR: No se encontro el directorio: $projectPath" -ForegroundColor Red
    Write-Host "Por favor ajusta la ruta en el script" -ForegroundColor Yellow
    exit 1
}

Write-Host "Directorio del proyecto: $projectPath" -ForegroundColor Green
Write-Host ""

# Paso 1: Eliminar carpetas de cache
Write-Host "[1/5] Eliminando carpetas de cache..." -ForegroundColor Yellow

$foldersToRemove = @(
    ".next",
    "node_modules\.cache",
    ".turbo",
    "coverage"
)

foreach ($folder in $foldersToRemove) {
    $fullPath = Join-Path $projectPath $folder
    if (Test-Path $fullPath) {
        try {
            Remove-Item -Recurse -Force $fullPath -ErrorAction Stop
            Write-Host "  ✓ Eliminado: $folder" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Error al eliminar $folder : $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ○ No existe: $folder" -ForegroundColor Gray
    }
}

# Paso 2: Eliminar archivos de lock
Write-Host ""
Write-Host "[2/5] Eliminando archivos de lock..." -ForegroundColor Yellow

$lockFiles = @(
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
)

foreach ($file in $lockFiles) {
    $fullPath = Join-Path $projectPath $file
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Force -ErrorAction Stop
            Write-Host "  ✓ Eliminado: $file" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ Error al eliminar $file : $_" -ForegroundColor Red
        }
    }
}

# Paso 3: Verificar .env.local
Write-Host ""
Write-Host "[3/5] Verificando archivo .env.local..." -ForegroundColor Yellow

$envPath = Join-Path $projectPath ".env.local"
if (Test-Path $envPath) {
    Write-Host "  ✓ .env.local existe" -ForegroundColor Green
} else {
    Write-Host "  ✗ .env.local NO existe - DEBE SER CREADO" -ForegroundColor Red
    Write-Host "  Creando archivo .env.local de ejemplo..." -ForegroundColor Yellow
    $envContent = @"
NEXT_PUBLIC_SUPABASE_URL=https://avfuvekuhihrcxlyuxvt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZnV2ZWt1aGlocmN4bHl1eHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNDkxMjYsImV4cCI6MjA4MjcyNTEyNn0.CqyVTTd_Fqp4fBEp2fvwRkPQdRh5eBnjs9Juov733tg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZnV2ZWt1aGlocmN4bHl1eHZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE0OTEyNiwiZXhwIjoyMDgyNzI1MTI2fQ.fK2f-tbEzFv5swRa6QQ4gGdk5ra1Ll3R54NtFz0ziGs
"@
    try {
        $envContent | Out-File -FilePath $envPath -Encoding UTF8 -ErrorAction Stop
        Write-Host "  ✓ .env.local creado" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Error al crear .env.local : $_" -ForegroundColor Red
    }
}

# Paso 4: Reinstalar dependencias
Write-Host ""
Write-Host "[4/5] Reinstalando dependencias (esto puede tomar unos minutos)..." -ForegroundColor Yellow

try {
    Push-Location $projectPath
    npm install
    Write-Host "  ✓ Dependencias instaladas" -ForegroundColor Green
    Pop-Location
} catch {
    Write-Host "  ✗ Error al instalar dependencias: $_" -ForegroundColor Red
    Pop-Location
}

# Paso 5: Verificar estructura del proyecto
Write-Host ""
Write-Host "[5/5] Verificando archivos criticales..." -ForegroundColor Yellow

$criticalFiles = @(
    "lib\supabase\admin.ts",
    "lib\actions\users.ts",
    "app\(dashboard)\dashboard\users\new\page.tsx",
    "app\(dashboard)\dashboard\users\[id]\page.tsx"
)

foreach ($file in $criticalFiles) {
    $fullPath = Join-Path $projectPath $file
    if (Test-Path $fullPath) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ FALTA: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== LIMPIEZA COMPLETA ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ahora sigue estos pasos:" -ForegroundColor White
Write-Host "1. Cierra este PowerShell" -ForegroundColor Yellow
Write-Host "2. Cierra COMPLETAMENTE la aplicacion Cursor" -ForegroundColor Yellow
Write-Host "3. Espera 10 segundos" -ForegroundColor Yellow
Write-Host "4. Abre Cursor de nuevo" -ForegroundColor Yellow
Write-Host "5. Espera a que termine de cargar (esquina inferior izquierda)" -ForegroundColor Yellow
Write-Host "6. Abre una nueva terminal en Cursor" -ForegroundColor Yellow
Write-Host "7. Ejecuta: npm run dev" -ForegroundColor Yellow
Write-Host "8. Espera a ver 'Ready on http://localhost:3000'" -ForegroundColor Yellow
Write-Host "9. Abre el navegador y ve a http://localhost:3000/dashboard/users/new" -ForegroundColor Yellow
Write-Host ""
Write-Host "Si el error persiste,.envianos una captura de pantalla de la terminal" -ForegroundColor Red
