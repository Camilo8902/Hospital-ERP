# Análisis del Estado Actual del Sistema de Fisioterapia

## Resumen Ejecutivo

El sistema de fisioterapia de MediCore ERP tiene una implementación **parcial pero sólida** (~65% completo). La base está establecida con tipos TypeScript, server actions, y componentes UI, pero faltan integraciones clave para completar el flujo del paciente.

---

## Estado por Componente

### ✅ COMPLETOS

| Componente | Estado | Notas |
|------------|--------|-------|
| Tipos TypeScript | ✅ Completo | Interfaces para PhysioMedicalRecord, PhysioSession, ROMMeasurement, StrengthGrade |
| Server Actions | ✅ Completo | Funciones createPhysioRecord, createPhysioSession, getDashboardStats |
| Dashboard Principal | ✅ Completo | Stats, sesiones recientes, gráficos de progreso |
| Evaluación Inicial | ✅ Completo | UI completa con ROM, fuerza muscular, escalas (VAS, Oswestry, DASH, WOMAC) |
| Registro de Sesiones | ✅ Completo | Formulario con técnica, equipos, ejercicios, notas |
| Catálogos Base | ✅ Completo | Treatment Types, Techniques, Equipment, Exercises, Protocols |
| Búsqueda por DNI | ✅ Completo | Componente PatientSearchByDni + función getPatientByDni |

### ⚠️ PARCIALMENTE COMPLETOS

| Componente | Estado | Gap |
|------------|--------|-----|
| Formulario de Sesiones | 80% | Falta modelo SOAP (Subjetivo/Objetivo/Análisis/Plan) completo |
| Planes de Tratamiento | 40% | Existen tipos pero no UI de creación desde evaluación |
| Integración con Citas | 30% | Las sesiones no se crean como citas en `appointments` |
| Consentimiento Informado | 50% | Existe el campo pero no la firma digital |

### ❌ NO IMPLEMENTADOS

| Componente | Prioridad | Esfuerzo |
|------------|-----------|----------|
| Sistema de Derivaciones | Media | Alto |
| Calendario de Sesiones | Alta | Medio |
| Evolución Funcional | Alta | Medio |
| Evaluación Final/Alta | Media | Bajo |
| Resumen de Alta para HC | Media | Bajo |
| Módulo de Admisión de Emergencia | Alta | Medio |

---

## Bugs Identificados

### Bug 1: Evaluación usa `full_name` inexistente
**Archivo:** `app/(dashboard)/dashboard/physiotherapy/evaluation/new/page.tsx:129`

```typescript
// INCORRECTO - patients no tiene full_name
.select('id, full_name, dni, phone')

// CORRECTO - patients tiene first_name y last_name
.select('id, first_name, last_name, dni, phone')
```

**Impacto:** La búsqueda de pacientes falla

**Estado:** 🔴 Sin corregir

---

### Bug 2: El DNI es numérico en BD pero se busca como string
**Archivo:** `lib/actions/patients.ts:getPatientByDni`

```typescript
// El campo dni es numeric en la tabla patients
// Pero se recibe como string del formulario
const dniNumber = parseInt(dni); // ✅ Correcto
```

**Estado:** 🟢 Corregido

---

### Bug 3: Falta columna `dni` en tabla patients
Según el esquema, la columna `dni` existe en `patients`:
```sql
patients.dni numeric UNIQUE,
```

**Verificar:** Ejecutar migración si no existe la columna.

**Estado:** 🟡 Pendiente de verificar

---

## Análisis de Integración con Flujo del Paciente

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO IMPLEMENTADO vs FLUJO DOCUMENTADO          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Llegada sin cita    ⚠️  Falta módulo de admisión               │
│     → Búsqueda DNI      ✅  Ya funciona                             │
│     → Registro rápido   ❌  No existe                               │
│                                                                     │
│  2. Consulta Médica     ✅  Usa módulo existente                    │
│                                                                     │
│  3. Derivación          ❌  No existe sistema de referencias        │
│                                                                     │
│  4. Evaluación Fisio    ✅  Completa (ROM, fuerza, escalas)         │
│                                                                     │
│  5. Plan de Tratamiento ⚠️  Tipos existen, pero no UI completa      │
│                                                                     │
│  6. Sesiones            ⚠️  Falta modelo SOAP completo              │
│                                                                     │
│  7. Culminación         ❌  No existe evaluación final ni alta      │
│                                                                     │
│  8. Historia Clínica    ⚠️  No hay integración automática           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Gap Analysis: Lo que falta vs Lo que existe

### Lo que EXISTE (reutilizar):

1. **Componente PatientSearchByDni** - Para usar en admisión y derivaciones
2. **Tipos PhysioMedicalRecord** - Para evaluación y evolución funcional
3. **Tipos PhysioSession** - Para sesiones con SOAP
4. **Catálogos existentes** - Treatment types, techniques, equipment, exercises
5. **Dashboard stats** - Para métricas de seguimiento

### Lo que FALTA implementar:

1. **Módulo de Admisión** - Pantalla con búsqueda + registro rápido
2. **Sistema de Derivaciones** - Crear/aceptar referencias entre departamentos
3. **Plan de Tratamiento UI** - Crear plan desde evaluación
4. **Calendario** - Programación de sesiones
5. **SOAP en Sesiones** - Subjetivo/Objetivo/Análisis/Plan
6. **Evolución Funcional** - Comparación sesión a sesión
7. **Evaluación Final** - Comparación inicio vs final
8. **Generador de Resumen** - Para historia clínica

---

## Recomendaciones de Prioridad

### Inmediato (Esta semana)
1. 🔧 **Corregir Bug 1** - full_name inexistente en evaluación
2. 📋 **Verificar migración DNI** - Asegurar que la columna existe

### Corto plazo (2 semanas)
3. 📋 **Completar SOAP** - Agregar Subjetivo/Objetivo/Análisis/Plan a sesiones
4. 📋 **Crear Plan desde Evaluación** - Workflow: evaluación → plan → sesiones

### Mediano plazo (1 mes)
5. 📋 **Sistema de Derivaciones** - clinical_references
6. 📋 **Calendario de Sesiones** - Programación visual
7. 📋 **Evolución Funcional** - Comparación automática

### Largo plazo (2 meses)
8. 📋 **Módulo de Admisión** - Para pacientes sin cita
9. 📋 **Evaluación Final y Alta** - Cierre del ciclo
10. 📋 **Integración HC** - Resumen automático

---

## Próxima Acción Recomendada

**Corregir el Bug 1** (full_name) ya que está causando que la evaluación no pueda buscar pacientes correctamente.

```bash
# El error en consola es:
# column patients.full_name does not exist
```

¿Quieres que comience corrigiendo este bug y luego continuemos con el desarrollo del SOAP en las sesiones?
