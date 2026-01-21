# Plan de Implementación por Fases - Módulo de Fisioterapia

## Análisis del Estado Actual y Estrategia General

El sistema actual presenta una estructura de navegación hardcodeada en el Sidebar, donde cada módulo está definido estáticamente en el componente. La integración con fisioterapia requiere una transformación progresiva que mantenga la estabilidad del sistema existente mientras se incorporan las nuevas funcionalidades de manera modular.

La estrategia de implementación se basa en tres principios fundamentales: primero, la mínima invasión al código existente para reducir riesgos de regresión; segundo, la construcción sobre la arquitectura actual de citas y pacientes que ya funciona; y tercero, la preparación para funcionalidades avanzadas sin implementarlas completamente desde el inicio.

El objetivo inmediato de modificar el Sidebar para mostrar departamentos dinámicamente es el punto de partida ideal porque establece la infraestructura de navegación que utilizará todo el módulo de fisioterapia, y además proporciona valor inmediato al permitir acceso rápido a todos los departamentos del hospital, no solo fisioterapia.

---

## Fase 1: Navegación Dinámica por Departamentos

### Objetivo Específico

Transformar el Sidebar estático en un sistema de navegación dinámico que lea los departamentos de la base de datos y los presente como elementos de menú desplegables, manteniendo compatibilidad total con los módulos existentes que no son de departamento.

### Análisis Técnico del Sidebar Actual

El componente Sidebar actual (`components/shared/Sidebar.tsx`) contiene un array `navigationConfig` con elementos hardcodeados. La modificación propuesta extrae este array de la base de datos, permitiendo que cualquier nuevo departamento aparezca automáticamente en la navegación sin modificar código.

La estructura actual separa los módulos especiales (Dashboard, Pacientes, Citas) de los módulos departamentales. La propuesta mantiene esta separación lógica, pero convierte la sección de departamentos en un submenú dinámico.

### Propuesta de Estructura de Menú

La navegación propuesta organiza los elementos en tres categorías:

1. **Módulos institucionales transversales**: Dashboard, Pacientes, Citas, Usuarios, Configuración
2. **Módulos departamentales**: Se cargan dinámicamente desde la tabla departments
3. **Módulos especiales**: Laboratorio, Farmacia, Facturación (por su naturaleza específica)

Esta estructura permite que fisioterapia sea un departamento más en la tabla departments, con código FT, y automáticamente aparezca en la navegación cuando el usuario tiene permisos para acceder a él.

### Implementación de la Carga de Departamentos

La carga de departamentos debe realizarse de manera eficiente para no impactar el tiempo de carga inicial de la aplicación. Se propone una estrategia de carga diferida que consulta los departamentos cuando el usuario hace hover sobre el elemento de menú, o precarga los datos en segundo plano durante la autenticación.

### Gestión de Permisos por Departamento

Cada departamento debe poder configurar qué roles de usuario tienen acceso a él. Esto se logra añadiendo una relación many-to-many entre departamentos y roles en la base de datos, permitiendo configuración granular de accesos.

---

## Fase 2: Integración con Sistema de Citas

### Objetivo Específico

Conectar el módulo de fisioterapia con el sistema de citas existente, aprovechando la estructura ya implementada de citas médicas pero adaptándola a las necesidades específicas de fisioterapia.

### Integración con Citas de Fisioterapia

El sistema de citas actual ya tiene la estructura para manejar citas con departamentos. La adaptación para fisioterapia requiere añadir campos específicos en el formulario de nueva cita cuando se selecciona el departamento de fisioterapia:
- Fisioterapeuta asignado
- Tipo de tratamiento programado
- Sesión de evaluación inicial o de seguimiento

### Programación de Sesiones Recurrentes

Una funcionalidad crítica para fisioterapia es la capacidad de programar series de sesiones recurrentes. El sistema debe permitir definir un patrón de citas (por ejemplo, lunes, miércoles, viernes durante 4 semanas) y generar automáticamente todas las citas del serie.

---

## Fase 3: Historia Clínica Digital de Fisioterapia

### Objetivo Específico

Implementar la Historia Clínica Digital completa de fisioterapia, incluyendo evaluación inicial, evolución de sesiones, y documentación clínica estructurada.

### Evaluación Inicial de Fisioterapia

La evaluación inicial es el documento fundamental que establece la línea base del paciente. El formulario debe incluir:
- Antecedentes médicos y quirúrgicos
- Alergias y contraindicaciones
- Evaluación del dolor usando escalas VAS y otras estándar
- Exploración física con rangos articulares y fuerza muscular
- Escalas funcionales específicas según la región afectada

### Registro de Evolución de Sesión (SOAP)

Cada sesión de tratamiento genera un registro de evolución que sigue el formato SOAP (Subjective, Objective, Assessment, Plan). La integración con el sistema de medición de rangos articulares permite almacenamiento histórico para visualizar la evolución temporal.

### Fotografías y Documentación Visual

El sistema de gestión de fotografías clínicas permite capturar imágenes del estado del paciente en diferentes momentos del tratamiento, con comparaciones lado a lado para evaluar progreso.

---

## Fase 4: Protocolos Clínicos y Tratamientos Instrumentales

### Objetivo Específico

Implementar la biblioteca de protocolos clínicos basados en evidencia y el registro de tratamientos instrumentales con parámetros detallados.

### Biblioteca de Protocolos Clínicos

La base de datos de protocolos almacena tratamientos estructurados por condición, región anatómica, y nivel de evidencia. Cada protocolo define:
- Fases progresivas con objetivos específicos
- Técnicas aplicables
- Criterios de progresión

### Registro de Uso de Dispositivos

Cada uso de equipo médico se registra con parámetros técnicos detallados, permitiendo trazabilidad completa del tratamiento aplicado. Los dispositivos incluyen MBST, electroterapia, láser, ultrasonido, vacío, crioterapia.

---

## Fase 5: Documentación Legal y Consentimientos

### Objetivo Específico

Implementar el sistema de consentimientos informados digitales y el registro de auditoría para cumplimiento RGPD y normativas de historia clínica.

### Consentimientos Informados Digitales

El sistema genera documentos de consentimiento personalizados que incluyen:
- Identificación del procedimiento
- Riesgos, beneficios, alternativas
- Espacio para firma del paciente o representante legal

### Registro de Auditoría

Cada acceso a información clínica se registra con detalle de quién accedió, cuándo, qué datos consultó, y desde dónde. Cumplimiento con LOPDGDD y normativas de protección de datos de salud.

---

## Fase 6: Alertas, Analítica y Mejora Continua

### Objetivo Específico

Implementar el sistema de alertas proactivas y analítica avanzada para mejora continua de la calidad asistencial.

### Sistema de Alertas Clínicas

Las alertas se disparan automáticamente cuando se detectan patrones que requieren atención clínica:
- Estancamiento en la evolución
- Ausencias reiteradas a sesiones
- Detección de contraindicaciones durante el tratamiento

### Dashboard de Analítica

Los paneles de análisis proporcionan métricas a nivel de paciente, terapeuta, y centro:
- Tasas de mejoría
- Tiempo promedio de tratamiento
- Satisfacción del paciente
- Comparativas entre profesionales

---

## Resumen de Fases y Dependencias

| Fase | Duración Estimada | Dependencias | Valor de Negocio Inmediato |
|------|-------------------|--------------|---------------------------|
| 1. Navegación Dinámica | 2-3 días | Ninguna | Acceso unificado a todos los módulos departamentales |
| 2. Integración Citas | 3-4 días | Fase 1 | Agenda específica de fisioterapia operativa |
| 3. Historia Clínica | 5-7 días | Fase 2 | Documentación clínica completa operativa |
| 4. Protocolos | 4-5 días | Fase 3 | Estandarización de tratamientos basada en evidencia |
| 5. Legal y Consentimientos | 3-4 días | Fase 3 | Cumplimiento normativo completo |
| 6. Alertas y Analítica | 4-5 días | Fases 2-5 | Mejora continua basada en datos |

**Duración total estimada**: 21-28 días, con entregas incrementales que proporcionan valor en cada fase.

---

## Entregables Fase 1 (Navegación Dinámica)

1. Migración de base de datos para relación departamentos-roles
2. Actualización del componente Sidebar con carga dinámica de departamentos
3. Página principal del módulo de fisioterapia con estadísticas y acceso rápido
4. ZIP con todos los archivos modificados para deployment

---

## Esquema de Base de Datos Extendido (Fisioterapia)

```sql
-- Tabla principal de evaluación inicial de fisioterapia
CREATE TABLE physio_clinical_evaluation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    therapist_id UUID NOT NULL REFERENCES profiles(id),
    evaluation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    medical_diagnosis TEXT NOT NULL,
    icd10_codes TEXT[],
    referring_physician VARCHAR(255),
    prescription_details TEXT,
    
    surgical_history TEXT,
    traumatic_history TEXT,
    medical_history TEXT,
    family_history TEXT,
    
    allergies TEXT[],
    contraindications TEXT[],
    precautions TEXT,
    
    pain_location TEXT,
    pain_type VARCHAR(100),
    pain_duration VARCHAR(100),
    pain_scale_baseline INTEGER CHECK (pain_scale_baseline BETWEEN 0 AND 10),
    pain_characteristics TEXT,
    aggravating_factors TEXT,
    relieving_factors TEXT,
    
    functional_limitations TEXT,
    adl_impact TEXT,
    work_impact TEXT,
    sports_impact TEXT,
    
    patient_goals TEXT,
    patient_expectations TEXT,
    
    physical_examination TEXT,
    postural_evaluation TEXT,
    rom_measurements JSONB,
    strength_grade JSONB,
    neurological_screening TEXT,
    special_tests TEXT,
    
    vas_score INTEGER,
    oswestry_score INTEGER,
    dash_score DECIMAL(5,2),
    womac_score DECIMAL(5,2),
    roland_morris_score INTEGER,
    equiscale_score DECIMAL(5,2),
    
    initial_photos UUID[],
    
    informed_consent_signed BOOLEAN DEFAULT FALSE,
    informed_consent_date TIMESTAMPTZ,
    consent_document_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registro de evolución funcional por sesión
CREATE TABLE physio_functional_evolution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES physio_sessions(id),
    
    subjective_assessment TEXT NOT NULL,
    objective_findings TEXT NOT NULL,
    assessment TEXT NOT NULL,
    treatment_plan TEXT NOT NULL,
    
    pain_before INTEGER CHECK (pain_before BETWEEN 0 AND 10),
    pain_after INTEGER CHECK (pain_after BETWEEN 0 AND 10),
    pain_location TEXT,
    pain_type VARCHAR(100),
    
    rom_measurements JSONB,
    rom_improvement TEXT,
    strength_grade JSONB,
    strength_improvement TEXT,
    
    vas_current INTEGER CHECK (vas_current BETWEEN 0 AND 10),
    functional_indexes JSONB,
    
    session_objectives TEXT[],
    objectives_achieved TEXT[],
    
    patient_response TEXT,
    tolerance TEXT,
    adverse_reactions TEXT,
    
    therapist_signature UUID NOT NULL REFERENCES profiles(id),
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protocolos clínicos basados en evidencia
CREATE TABLE physio_clinical_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    
    category VARCHAR(100),
    subcategory VARCHAR(100),
    body_region VARCHAR(100),
    condition_type VARCHAR(100),
    
    evidence_level VARCHAR(50),
    references TEXT[],
    clinical_guidelines TEXT,
    
    total_sessions INTEGER NOT NULL,
    session_duration_minutes INTEGER NOT NULL DEFAULT 60,
    session_frequency VARCHAR(100),
    phases JSONB NOT NULL,
    
    therapeutic_objectives TEXT[],
    expected_outcomes TEXT,
    success_criteria JSONB,
    
    contraindications TEXT[],
    precautions TEXT,
    red_flags TEXT,
    
    required_equipment TEXT[],
    required_rooms TEXT[],
    staff_requirements TEXT[],
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instrumentación y dispositivos médicos
CREATE TABLE physio_medical_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    
    device_type VARCHAR(100) NOT NULL,
    modality VARCHAR(100),
    
    technical_specs JSONB,
    available_programs JSONB,
    
    status VARCHAR(50) DEFAULT 'available',
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_history TEXT[],
    
    calibration_date DATE,
    calibration_due_date DATE,
    calibration_certificate_url TEXT,
    
    total_sessions_conducted INTEGER DEFAULT 0,
    total_hours_used DECIMAL(10,2) DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consentimientos informados
CREATE TABLE physio_informed_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    treatment_plan_id UUID REFERENCES physio_treatment_plans(id),
    
    consent_type VARCHAR(100) NOT NULL,
    consent_template_id UUID,
    
    procedure_description TEXT NOT NULL,
    risks TEXT NOT NULL,
    benefits TEXT NOT NULL,
    alternatives TEXT NOT NULL,
    risks_of_not_treating TEXT,
    
    generated_document_url TEXT,
    document_version VARCHAR(20),
    
    patient_signature UUID,
    signed_by_patient BOOLEAN DEFAULT FALSE,
    signed_by_representative BOOLEAN DEFAULT FALSE,
    representative_name VARCHAR(255),
    representative_dni VARCHAR(20),
    
    validated_by UUID REFERENCES profiles(id),
    validated_at TIMESTAMPTZ,
    
    valid_from DATE NOT NULL,
    valid_until DATE,
    status VARCHAR(50) DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registros de auditoría para cumplimiento RGPD/LOPDGDD
CREATE TABLE physio_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    
    user_id UUID NOT NULL REFERENCES profiles(id),
    user_role VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    
    patient_id UUID REFERENCES patients(id),
    record_id UUID,
    record_type VARCHAR(100),
    
    action_details TEXT,
    data_accessed JSONB,
    data_modified JSONB,
    
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    access_point VARCHAR(100),
    
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuración de alertas
CREATE TABLE physio_alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium',
    
    conditions JSONB NOT NULL,
    notification_channels JSONB,
    recipients JSONB,
    message_template TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de alertas generadas
CREATE TABLE physio_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_rule_id UUID NOT NULL REFERENCES physio_alert_rules(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    treatment_plan_id UUID REFERENCES physio_treatment_plans(id),
    
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    clinical_context JSONB,
    recommendations TEXT,
    
    status VARCHAR(50) DEFAULT 'active',
    acknowledged_by UUID REFERENCES profiles(id),
    acknowledged_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

---

*Documento creado: 2026-01-21*
*Autor: MiniMax Agent*
*Versión: 1.0*
