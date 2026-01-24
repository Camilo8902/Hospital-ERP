# Medicore ERP - Módulo de Citas Modular por Departamento

## 📁 Contenido del ZIP

Este ZIP contiene los archivos necesarios para implementar un sistema de citas modular y escalable para múltiples departamentos hospitalarios.

```
medicore-erp-modular-appointments/
├── migrations/
│   └── 20260123_unify_appointments.sql
├── lib/
│   └── types/
│       └── department-data.ts
├── components/
│   └── appointments/
│       ├── index.ts
│       ├── AdaptiveAppointmentCard.tsx
│       ├── AdaptiveAppointmentForm.tsx
│       ├── department-specific/
│       │   ├── PhysioAppointmentDetails.tsx
│       │   ├── LabAppointmentDetails.tsx
│       │   ├── ImagingAppointmentDetails.tsx
│       │   └── GeneralAppointmentDetails.tsx
│       └── department-forms/
│           ├── PhysioAppointmentForm.tsx
│           ├── LabAppointmentForm.tsx
│           ├── ImagingAppointmentForm.tsx
│           └── GeneralAppointmentForm.tsx
└── README.md
```

## 🚀 Instrucciones de Instalación

### 1. Ejecutar Migración de Base de Datos

```bash
# Conectar a Supabase y ejecutar la migración
psql -h your-host.supabase.co -U postgres -d postgres -f migrations/20260123_unify_appointments.sql
```

O copiar el contenido del archivo SQL en el editor SQL de Supabase.

### 2. Copiar Tipos TypeScript

Copiar `lib/types/department-data.ts` a tu proyecto en la ruta:
```
lib/types/department-data.ts
```

### 3. Copiar Componentes

Copiar toda la carpeta `components/appointments/` a tu proyecto:
```
components/appointments/
```

### 4. Instalar Dependencias (si no las tienes)

```bash
npm install zod
```

## 📋 Departamentos Soportados

| Código | Nombre | Estado |
|--------|--------|--------|
| FT | Fisioterapia | ✅ Completo |
| LAB | Laboratorio | ✅ Completo |
| RAD | Radiología/Imagenología | ✅ Completo |
| MG | Medicina General | ✅ Completo |
| CG | Cirugía | ✅ Completo |
| CAR | Cardiología | ✅ Básico |
| PED | Pediatría | ✅ Básico |
| URG | Urgencias | ✅ Básico |
| OFT | Oftalmología | ⏳ Pendiente |
| PSI | Psicología | ⏳ Pendiente |
| NUT | Nutrición | ⏳ Pendiente |
| FAR | Farmacia | ⏳ Pendiente |
| DER | Dermatología | ⏳ Pendiente |
| GIN | Ginecología | ⏳ Pendiente |

## 💡 Uso

### Tarjeta de Cita Adaptativa

```tsx
import { AdaptiveAppointmentCard } from '@/components/appointments';

<AdaptiveAppointmentCard 
  appointment={appointment}
  onClick={() => router.push(`/appointments/${appointment.id}`)}
/>
```

### Formulario de Cita Adaptativo

```tsx
import { AdaptiveAppointmentForm } from '@/components/appointments';

<AdaptiveAppointmentForm
  departmentCode="FT"
  onDataChange={(data) => console.log('Datos específicos:', data)}
/>
```

## 🔧 Personalización

### Agregar Nuevo Departamento

1. Definir la interfaz en `lib/types/department-data.ts`
2. Agregar el schema Zod correspondiente
3. Crear componentes de detalles y formulario si es necesario
4. Actualizar el switch en `AdaptiveAppointmentCard.tsx` y `AdaptiveAppointmentForm.tsx`

## 📝 Notas

- El sistema usa `JSONB` para almacenar datos específicos de cada departamento
- Tipado completo con TypeScript y validación con Zod
- Compatible con el schema existente de Medicore ERP
- Escalable: agregar departamentos sin modificar código base

## 📄 Licencia

MIT License - Medicore ERP
