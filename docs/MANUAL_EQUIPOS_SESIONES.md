# Manual de Usuario: Planes de Tratamiento, Sesiones y Equipos

## 1. Planes de Tratamiento

### Crear un Plan desde Evaluación
1. Ir a **Fisioterapia** → **Nueva Evaluación**
2. Completar la evaluación del paciente
3. En el **Step 5: Diagnóstico y Plan de Tratamiento**:
   - Marcar **"Crear Plan de Tratamiento"**
   - Seleccionar tipo de plan (Rehabilitación, Mantenimiento, etc.)
   - Configurar sesiones por semana y total prescrito
   - Definir objetivo clínico

### Estados del Plan
| Estado | Descripción |
|--------|-------------|
| **Indicado** | Plan creado, pendiente de iniciar |
| **En Proceso** | Tratamiento activo |
| **Pausado** | Tratamiento temporalmente detenido |
| **Culminado** | Tratamiento completado |
| **Cancelado** | Plan cancelado |

### Gestionar Plan
1. Ir a **Fisioterapia** → **Planes**
2. Ver lista de planes por estado
3. Click en un plan para ver detalles
4. Desde el plan se pueden:
   - Registrar sesiones
   - Editar configuración
   - Culminar tratamiento

---

## 2. Sesiones de Fisioterapia

### Registrar Sesión
1. Desde un **Plan de Tratamiento** activo:
   - Click en **"Registrar Sesión"**
2. O desde **Fisioterapia** → **Nueva Sesión**

### Datos de la Sesión
- **Número de sesión** (auto-incrementado)
- **Fecha y hora**
- **Duración** en minutos
- **Evaluación subjetiva**: Que refiere el paciente
- **Evaluación objetiva**: Lo que observa el fisioterapeuta
- **Análisis**: Interpretación del fisioterapeuta
- **Plan**: Plan para próximas sesiones
- **Nivel de dolor** (0-10)
- **Técnicas aplicadas**: Selección múltiple
- **Equipo usado**: Si aplica

### Estado Auto-cambio del Plan
- Al registrar la **primera sesión**: Plan pasa a "En Proceso"
- Al **culminar**: Plan pasa a "Culminado"

---

## 3. Catálogo de Equipos

### Acceder al Catálogo
Ir a **Fisiotherapy** → **Catalogos** → **Equipos**

### Agregar Nuevo Equipo
1. Click en **"Agregar Equipo"**
2. Completar datos básicos:
   - Código único
   - Nombre del equipo
   - Marca/Modelo
   - Número de serie
   - Tipo de tratamiento
   - Estado (disponible, mantenimiento, fuera de servicio)

### Configurar Campos Parametrizables

Cada equipo puede tener **campos configurables** que guían al fisioterapeuta durante las sesiones:

#### Tipos de Campo
| Tipo | Uso | Ejemplo |
|------|-----|---------|
| **number** | Valores numéricos | Intensidad: 0-100 mA |
| **text** | Texto libre | Observaciones |
| **select** | Opciones predefinidas | Modo: Continuo/Pulsado |
| **range** | Slider con rango | Frecuencia: 1-100 Hz |
| **boolean** | Si/No | Conducción bipolar |

#### Ejemplo: Configurar TENS
```
Nombre del campo: intensity
Label: Intensidad
Tipo: number
Unidad: mA
Mínimo: 0
Máximo: 100
Default: 20
Requerido: Si
Orden: 1
```

#### Ejemplo: Configurar Ultrasonido
```
Nombre: frequency
Label: Frecuencia
Tipo: range
Unidad: MHz
Mínimo: 1
Máximo: 3
Default: 1
Orden: 1

Nombre: mode
Label: Modo
Tipo: select
Opciones: [{"value":"continuous","label":"Continuo"},{"value":"pulsed","label":"Pulsado"}]
Orden: 2
```

### Usar Campos en Sesiones
Al registrar una sesión y seleccionar un equipo:
1. Se muestran los campos configurables definidos
2. El fisioterapeuta ingresa los valores usados
3. Los datos quedan registrados en la sesión

---

## 4. Resumen del Flujo

```
Paciente llega
    ↓
Evaluación inicial
    ↓
¿Necesita fisioterapia?
    ↓ SÍ
Crear Plan de Tratamiento (desde evaluación)
    ↓
Plan en estado "Indicado"
    ↓
Primera sesión → Plan pasa a "En Proceso"
    ↓
Sesiones subsiguientes
    ↓
¿Tratamiento completado?
    ↓ SÍ
Culminar plan → Plan pasa a "Culminado"
```

---

## 5. Tips

- **Configurar equipos primero**: Defina los campos parametrizables antes de usar los equipos en sesiones
- **Usar valores por defecto**: Facilita el registro rápido
- **Ordenar campos**: Configure el orden de aparición con "field_order"
- **Requeridos vs opcionales**: Marque como requeridos los campos críticos
