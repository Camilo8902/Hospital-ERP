# Manual de Usuario - Módulo de Fisioterapia

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Evaluación Inicial](#evaluación-inicial)
3. [Planes de Tratamiento](#planes-de-tratamiento)
4. [Sesiones de Fisioterapia](#sesiones-de-fisioterapia)
5. [Culminación y Alta](#culminación-y-alta)
6. [Derivaciones](#derivaciones)

---

## Introducción

El módulo de fisioterapia de MediCore ERP permite gestionar todo el ciclo de atención fisioterapéutica del paciente, desde la evaluación inicial hasta el alta médica.

### Roles que pueden acceder
- **Fisioterapeutas**: Crear evaluaciones, planes y sesiones
- **Médicos**: Crear derivaciones, ver historiales
- **Administradores**: Acceso completo al sistema

### Acceder al módulo
1. Iniciar sesión en MediCore ERP
2. Navegar a **Dashboard → Fisioterapia**

---

## Evaluación Inicial

### Objetivo
Registrar la primera evaluación clínica del paciente para establecer el diagnóstico fisioterapéutico y baseline del tratamiento.

### Pasos para crear una evaluación

1. **Acceder a Evaluaciones**
   - Ir a **Fisioterapia → Evaluaciones**
   - Click en **Nueva Evaluación**

2. **Completar datos del paciente**
   - Seleccionar paciente existente o crear uno nuevo
   - Verificar información demográfica

3. **Motivo de Consulta (Paso 1)**
   - Descripción principal del problema
   - Ubicación del dolor (región corporal)
   - Duración del dolor
   - Tipo de dolor (agudo, crónico, etc.)
   - Escala VAS (0-10) para medir intensidad

4. **Antecedentes Clínicos (Paso 2)**
   - Antecedentes quirúrgicos
   - Antecedentes traumáticos
   - Antecedentes médicos
   - Alergias (separadas por coma)
   - Contraindicaciones

5. **Exploración Física (Paso 3)**
   - Evaluación postural
   - Exploración física general
   - Screening neurológico
   - Tests especiales

6. **Diagnóstico y Plan (Paso 4)**
   - Diagnóstico clínico fisioterapéutico
   - Código CIE-10 (opcional)
   - Objetivos a corto plazo
   - Objetivos a largo plazo

7. **Consentimiento Informado**
   - El paciente debe firmar el consentimiento
   - Adjuntar documento escaneado si es necesario

8. **Guardar**
   - Click en **Guardar Evaluación**
   - El sistema generará un ID único

### Ver/Editar Evaluación
1. Ir a **Fisioterapia → Evaluaciones**
2. Buscar por paciente o fecha
3. Click en **Ver** para detalles
4. Click en **Editar** para modificar

---

## Planes de Tratamiento

### Objetivo
Crear un plan estructurado de sesiones de fisioterapia basado en la evaluación inicial.

### Tipos de Plan
| Tipo | Descripción |
|------|-------------|
| **Rehabilitación** | Recuperación tras lesión/cirugía |
| **Mantenimiento** | Conservar función alcanzada |
| **Preventivo** | Prevención de lesiones |
| **Rendimiento** | Optimización deportiva |

### Crear un Plan

1. **Acceder a Planes**
   - Ir a **Fisioterapia → Planes**
   - Click en **Nuevo Plan**

2. **Seleccionar Paciente**
   - Elegir paciente de la lista
   - (Opcional) Vincular a evaluación existente

3. **Diagnóstico**
   - Descripción del diagnóstico
   - Código CIE-10
   - Tipo de plan

4. **Programación**
   - Fecha de inicio
   - Fecha fin esperada
   - Sesiones por semana
   - Total de sesiones prescritas

5. **Evaluación Inicial**
   - Valoración inicial
   - ROM baseline
   - Score funcional inicial (0-100)

6. **Guardar Plan**

### Gestión de Planes

#### Ver Detalle de Plan
1. Click en **Ver** en la lista de planes
2. Muestra:
   - Progreso de sesiones
   - Estadísticas
   - Lista de sesiones realizadas
   - Objetivo clínico

#### Cambiar Estado
- **Activo**: Plan en curso
- **Pausado**: Tratamiento suspendido temporalmente
- **Completado**: Todas las sesiones realizadas

#### Editar Plan
1. Click en **Editar**
2. Modificar campos necesarios
3. **No modificar**: paciente, terapeuta, fecha creación

---

## Sesiones de Fisioterapia

### Objetivo
Registrar cada sesión de tratamiento con el modelo SOAP (Subjetivo, Objetivo, Análisis, Plan).

### Crear Nueva Sesión

1. **Acceder a Sesiones**
   - Ir a **Fisioterapia → Sesiones**
   - Click en **Nueva Sesión**

2. **Datos Básicos**
   - Seleccionar paciente
   - (Opcional) Vincular a plan de tratamiento
   - Fecha y hora
   - Duración (minutos)
   - Tipo de sesión (inicial o seguimiento)

3. **Subjetivo (S)**
   - Que refiere el paciente
   - Dolor actual (escala 0-10)
   - Cambios desde última sesión

4. **Objetivo (O)**
   - Exploración física del día
   - ROM medido
   - Fuerza muscular (escala 0-5)
   - Tests realizados

5. **Análisis (A)**
   - Evaluación del progreso
   - Comparación con sesión anterior
   - Respuesta al tratamiento

6. **Plan (P)**
   - Técnicas aplicadas
   - Ejercicios para casa
   - Próxima sesión

7. **Técnicas Comunes**
   - Masaje terapéutico
   - Movilización articular
   - Electroestimulación
   - Ejercicio terapéutico
   - Vendaje neuromuscular
   - Y más...

8. **Guardar Sesión**

### Ver Historial de Sesiones
1. Ir al perfil del paciente
2. Click en **Historial → Fisioterapia**
3. Ver todas las sesiones SOAP

---

## Culminación y Alta

### Objetivo
Finalizar el tratamiento y generar el resumen de alta del paciente.

### Proceso de Alta

1. **Iniciar Culminación**
   - Ir al **Plan de Tratamiento**
   - Click en **Culminar Plan**

2. **Resumen del Tratamiento**
   - Dolor inicial (EVA)
   - Dolor final (EVA)
   - % Mejora del dolor
   - Total sesiones realizadas

3. **Evaluación Final**
   - Valoración del estado actual
   - Objetivos logrados (lista)
   - Objetivos no logrados (lista)
   - Recomendaciones post-alta

4. **Seguimiento**
   - ¿Requiere seguimiento?
   - Fecha propuesta de control
   - Satisfacción del paciente (1-5)

5. **Confirmar Alta**
   - Click en **Completar Alta**
   - El sistema genera el resumen

### Resumen de Alta Generado
El resumen incluye:
- Datos del paciente
- Fechas de inicio/fin
- Total sesiones asistidas
- Objetivos cumplidos
- Recomendaciones
- Score de satisfacción

---

## Derivaciones

### Objetivo
Derivar pacientes desde otros departamentos o hacia especialidades.

### Crear Derivación

1. **Acceder a Derivaciones**
   - Ir a **Derivaciones**
   - Click en **Nueva Derivación**

2. **Datos de la Derivación**
   - Paciente
   - Departamento origen
   - Departamento destino
   - Tipo (evaluación, tratamiento, procedimiento)
   - Prioridad (rutinaria, urgente, emergencia)

3. **Información Clínica**
   - Diagnóstico
   - Códigos CIE-10
   - Motivo de derivación
   - Notas adicionales

4. **Enviar Derivación**

### Gestionar Derivaciones

#### Ver Derivaciones
- Lista de todas las derivaciones
- Filtrar por estado (pendiente, aceptada, completada)

#### Aceptar/Rechazar
1. Click en la derivación
2. Aceptar o rechazar con理由
3. El departamento destino recibe notificación

---

## atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+N` | Nuevo registro |
| `Ctrl+S` | Guardar |
| `Ctrl+F` | Buscar |
| `Esc` | Cancelar/Cerrar |

---

## Preguntas Frecuentes

### ¿Puedo eliminar una evaluación?
No, las evaluaciones son registros permanentes. Solo se pueden editar.

### ¿Qué pasa si el paciente falta a una sesión?
Registrar la sesión con estado "cancelada" y razón de ausencia.

### ¿Cómo calculo el porcentaje de mejora?
El sistema lo calcula automáticamente: `((VAS inicial - VAS final) / VAS inicial) × 100`

### ¿Puedo vincular un plan a varias evaluaciones?
Sí, pero se recomienda una evaluación principal.

### ¿El consentimiento informado es obligatorio?
Sí, no se puede guardar una evaluación sin consentimiento firmado.

---

## Soporte

Para dudas o problemas:
- Email: soporte@medicore.com
- Teléfono: [ número de soporte ]
- Manual completo: [enlace al docs]

---

**Versión del documento:** 1.0  
**Última actualización:** Enero 2025  
**Módulo:** MediCore ERP - Fisioterapia
