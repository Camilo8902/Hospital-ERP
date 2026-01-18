#!/bin/bash
# MediCore ERP - Script de Diagnóstico y Solución para Error 403
# Este script identifica y resuelve el problema de llamadas directas a Supabase

echo "=============================================="
echo "  MediCore ERP - Diagnóstico de Error 403"
echo "=============================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# 1. Verificar variables de entorno
echo "1. Verificando Variables de Entorno..."
echo "   --------------------------------"

if [ -f ".env.local" ]; then
    echo "   Archivo .env.local encontrado"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        check_status 0 "NEXT_PUBLIC_SUPABASE_URL configurada"
    else
        check_status 1 "NEXT_PUBLIC_SUPABASE_URL NO configurada"
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        KEY_LENGTH=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d'=' -f2 | tr -d ' ' | wc -c)
        echo "   SUPABASE_SERVICE_ROLE_KEY: ${KEY_LENGTH} caracteres"
        if [ $KEY_LENGTH -gt 40 ]; then
            check_status 0 "Service Role Key válida"
        else
            check_status 1 "Service Role Key muy corta"
        fi
    else
        check_status 1 "SUPABASE_SERVICE_ROLE_KEY NO configurada"
    fi
else
    echo -e "${RED}✗${NC} Archivo .env.local no encontrado"
fi

echo ""

# 2. Verificar archivos del API route
echo "2. Verificando Archivos del API Route..."
echo "   --------------------------------"

API_FILE="app/api/clinical-records/appointments/[id]/route.ts"

if [ -f "$API_FILE" ]; then
    check_status 0 "Archivo $API_FILE existe"
    
    # Verificar que usa createAdminClient
    if grep -q "createAdminClient" "$API_FILE"; then
        check_status 0 "Usa createAdminClient() correctamente"
    else
        check_status 1 "NO usa createAdminClient() - PROBLEMA ENCONTRADO"
    fi
    
    # Verificar que no usa createClient regular
    if grep -q "createClient()" "$API_FILE"; then
        echo -e "${RED}✗${NC} USA createClient() REGULAR - ESTO CAUSA EL 403"
    else
        check_status 0 "No usa createClient() regular"
    fi
else
    check_status 1 "Archivo $API_FILE no encontrado"
fi

echo ""

# 3. Verificar otros archivos de la aplicación
echo "3. Verificando Otros Archivos Críticos..."
echo "   --------------------------------"

# Verificar lib/supabase/admin.ts
if [ -f "lib/supabase/admin.ts" ]; then
    if grep -q "createAdminClient" "lib/supabase/admin.ts"; then
        check_status 0 "lib/supabase/admin.ts define createAdminClient"
    else
        check_status 1 "lib/supabase/admin.ts NO define createAdminClient"
    fi
fi

# Verificar que no hay imports de @supabase/supabase-js en archivos del cliente
CLIENT_FILES=$(find app -name "*.tsx" -type f | xargs grep -l "from '@supabase/supabase-js'" 2>/dev/null || true)
if [ -z "$CLIENT_FILES" ]; then
    check_status 0 "No hay imports directos de @supabase/supabase-js en el cliente"
else
    echo -e "${YELLOW}!${NC} Archivos con imports directos de @supabase/supabase-js:"
    echo "$CLIENT_FILES" | head -5
fi

echo ""

# 4. Limpiar build cacheado
echo "4. Limpiando Build Cacheado..."
echo "   --------------------------------"

if [ -d ".next" ]; then
    rm -rf .next
    check_status 0 "Carpeta .next eliminada"
else
    check_status 0 "Carpeta .next no existe (ya está limpia)"
fi

# Limpiar caché de node_modules si existe
if [ -d "node_modules/.cache" ]; then
    rm -rf node_modules/.cache
    check_status 0 "Caché de node_modules eliminada"
fi

echo ""

# 5. Verificar configuración de RLS en Supabase (manual)
echo "5. Configuración de RLS en Supabase..."
echo "   --------------------------------"
echo "   Por favor, verificar en el dashboard de Supabase:"
echo "   - Ir a Authentication > Row Level Security"
echo "   - Verificar que las políticas permitan acceso"
echo "   - Para development,可以考虑 temporarily disable RLS"
echo ""

# 6. Instrucciones finales
echo "=============================================="
echo "  RESUMEN Y PRÓXIMOS PASOS"
echo "=============================================="
echo ""
echo "Si los checks anteriores muestran problemas:"
echo "  1. Corregir las configuraciones marcadas con ✗"
echo "  2. Ejecutar: rm -rf .next && npm run dev"
echo ""
echo "Si todo está correcto pero el error persiste:"
echo "  1. Abrir DevTools (F12) > Network"
echo "  2. Buscar llamadas a 'patients' que fallen"
echo "  3. Compartir captura de pantalla"
echo ""
echo "Para testing rápido sin RLS (development):"
echo "  1. Ir a Supabase Dashboard > Authentication > Policies"
echo "  2. Deshabilitar RLS temporalmente para la tabla 'patients'"
echo "  3. Probar la aplicación"
echo ""

