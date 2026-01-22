-- =====================================================
-- MediCore ERP - Script RLS Simplificado y Definitivo
-- =====================================================
-- Este script crea políticas RLS mínimas y funcionales
-- para que la aplicación funcione correctamente
-- =====================================================

-- IMPORTANTE: Ejecutar en el Editor SQL de Supabase

-- =====================================================
-- Paso 1: Eliminar TODAS las políticas existentes
-- =====================================================

-- Eliminar todas las políticas de patients
DO $$
DECLARE
    p_name TEXT;
BEGIN
    FOR p_name IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'patients' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || p_name || '" ON public.patients';
    END LOOP;
END $$;

-- =====================================================
-- Paso 2: Verificar que RLS esté habilitado
-- =====================================================

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Paso 3: Crear UNA política simple y directa
-- =====================================================

-- Esta política permite que CUALQUIER usuario autenticado vea todos los pacientes
-- Es la política más permisiva necesaria para que funcione la aplicación
CREATE POLICY "Allow all authenticated users to view patients" ON public.patients
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
  );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver que la política se creó correctamente
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN permissive = 't' THEN 'Permissive'
        ELSE 'Restrictive'
    END as type,
    CASE 
        WHEN roles[1] IS NULL THEN 'All roles'
        ELSE array_to_string(roles, ', ')
    END as applied_roles
FROM pg_policies
WHERE tablename = 'patients' AND schemaname = 'public';

-- =====================================================
-- INSTRUCCIONES
-- =====================================================
-- 1. Copiar y ejecutar este script en Supabase SQL Editor
-- 2. Verificar que aparece la política en la lista
-- 3. Probar la aplicación
-- 
-- Si no funciona, verificar:
-- 1. Que el usuario tiene sesión activa en la aplicación
-- 2. Que auth.uid() devuelve un valor (no NULL)
-- 3. Que no hay otras políticas bloqueando el acceso
-- =====================================================
