-- =====================================================
-- SCRIPT DE CORRECCIÓN: Vincular Recetas a Citas
-- =====================================================
-- Problema: Las recetas aparecen en el historial pero no en los detalles de la cita
-- Causa: Falta de vinculación entre prescriptions y medical_records via appointment_id
-- =====================================================

-- PASO 1: Diagnóstico - Ver recetas huérfanas (con appointment_id pero sin medical_record_id)
SELECT 
    p.id as prescription_id,
    p.appointment_id,
    p.patient_id,
    p.medication_name,
    p.created_at as prescription_created,
    m.id as medical_record_id,
    m.appointment_id as mr_appointment_id
FROM prescriptions p
LEFT JOIN medical_records m ON p.medical_record_id = m.id
WHERE p.appointment_id IS NOT NULL 
    AND p.medical_record_id IS NULL;

-- =====================================================

-- PASO 2: Crear medical_records faltantes para citas que no tienen uno
-- Este bloque crea registros médicos para citas que tienen recetas pero no tienen medical_record

-- Insertar medical_records para citas sin uno (pero con recetas)
INSERT INTO medical_records (
    patient_id,
    appointment_id,
    doctor_id,
    visit_date,
    record_type,
    prescriptions,
    created_at,
    updated_at
)
SELECT 
    p.patient_id,
    p.appointment_id,
    a.doctor_id,
    p.created_at as visit_date,
    'consultation' as record_type,
    JSON_BUILD_ARRAY(p.medication_name)::text as prescriptions,
    NOW() as created_at,
    NOW() as updated_at
FROM prescriptions p
INNER JOIN appointments a ON p.appointment_id = a.id
WHERE p.medical_record_id IS NULL
    AND NOT EXISTS (
        SELECT 1 FROM medical_records mr 
        WHERE mr.appointment_id = p.appointment_id
    )
ON CONFLICT DO NOTHING;

-- =====================================================

-- PASO 3: Actualizar las recetas con el medical_record_id correcto
UPDATE prescriptions p
SET medical_record_id = (
    SELECT mr.id 
    FROM medical_records mr 
    WHERE mr.appointment_id = p.appointment_id
    LIMIT 1
)
WHERE p.medical_record_id IS NULL
    AND p.appointment_id IS NOT NULL
    AND EXISTS (
        SELECT 1 FROM medical_records mr 
        WHERE mr.appointment_id = p.appointment_id
    );

-- =====================================================

-- PASO 4: Verificar que las recetas ahora tienen medical_record_id
SELECT 
    p.id as prescription_id,
    p.appointment_id,
    p.medical_record_id,
    p.medication_name,
    m.appointment_id as mr_appointment_id
FROM prescriptions p
INNER JOIN medical_records m ON p.medical_record_id = m.id
WHERE p.appointment_id IS NOT NULL;

-- =====================================================

-- NOTAS:
-- 1. Este script crea medical_records faltantes para citas que tienen recetas
-- 2. Vincula las recetas existentes al medical_record de su cita
-- 3. El campo 'prescriptions' en medical_records es un array de nombres (para compatibilidad)
-- 4. Los registros clínicos se vincularán correctamente en los detalles de cita
-- =====================================================
