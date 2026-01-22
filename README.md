# MediCore ERP - Sistema de Gestión Hospitalaria

MediCore ERP es un sistema integral de gestión hospitalaria desarrollado con Next.js 14 y Supabase. Permite gestionar pacientes, citas médicas, historia clínica electrónica, inventario de farmacia y facturación.

## Características Principales

### Gestión de Pacientes
- Registro completo de pacientes con información demográfica y médica
- Historial de alergias y tipo de sangre
- Contactos de emergencia
- Información de seguro médico
- Búsqueda avanzada y filtros

### Historia Clínica Electrónica (EHR)
- Notas de consulta estructuradas
- Signos vitales registrados
- Diagnósticos con ICD-10 codes
- Planes de tratamiento
- Recetas médicas electrónicas

### Gestión de Citas
- Agendamiento de citas con selección de médico y habitación
- Calendario visual de citas
- Estados: Programada, En Proceso, Completada, Cancelada
- Recordatorios automáticos

### Farmacia e Inventario
- Control de inventario de medicamentos e insumos
- Alertas de stock bajo
- Dispensación de recetas
- Seguimiento de vencimiento

### Facturación
- Generación de facturas por servicios
- Seguimiento de pagos
- Estados: Pendiente, Pagada, Vencida, Cancelada
- Reportes financieros

### Control de Acceso por Roles
- **Administrador**: Acceso completo a todas las funciones
- **Médico**: Gestión de pacientes, citas e historia clínica
- **Enfermero**: Consulta de información, registro de signos vitales
- **Recepción**: Gestión de pacientes y citas
- **Farmacéutico**: Inventario y dispensación de recetas

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Despliegue**: Netlify
- **UI Components**: Lucide React, Custom Components
- **Language**: TypeScript

## Requisitos Previos

- Node.js 18.x o superior
- Cuenta de Supabase
- Cuenta de Netlify

## Instalación Local

1. **Clonar el repositorio**
   ```bash
   cd medicore-erp
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env.local
   ```

4. **Editar .env.local con tus credenciales de Supabase**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

5. **Ejecutar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## Configuración de Supabase

### 1. Crear Proyecto
1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. Espera a que termine la configuración inicial

### 2. Ejecutar Schema de Base de Datos
1. En el panel de Supabase, ve a **SQL Editor**
2. Copia el contenido del archivo `supabase/schema.sql`
3. Ejecuta el script SQL

### 3. Configurar Auth
1. Ve a **Authentication** → **Providers**
2. Asegúrate de que Email esté habilitado
3. Configura las políticas de Row Level Security (ya incluidas en el schema)

### 4. Obtener Credenciales
1. Ve a **Settings** → **API**
2. Copia la URL del proyecto y la Anon Key
3. Agrégalas a tu archivo `.env.local`

## Despliegue en Netlify

### 1. Preparar el Proyecto
```bash
npm run build
```

### 2. Conectar a Netlify
1. Crea una cuenta en [Netlify](https://netlify.com)
2. Conecta tu repositorio de Git
3. Configura los comandos de build:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Agrega las variables de entorno en Netlify:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Desplegar
Netlify detectará automáticamente la configuración de Next.js y desplegará tu aplicación.

## Credenciales de Prueba

Después de ejecutar el seed data, puedes usar las siguientes credenciales:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@medicore.com | admin123 |
| Médico | doctor@medicore.com | doctor123 |
| Recepción | recepcion@medicore.com | recepcion123 |
| Farmacéutico | pharmacy@medicore.com | pharmacy123 |
| Enfermero | nurse@medicore.com | nurse123 |

## Estructura del Proyecto

```
medicore-erp/
├── app/
│   ├── (auth)/              # Páginas de autenticación
│   │   └── login/
│   │       └── page.tsx     # Página de login
│   ├── (dashboard)/         # Páginas protegidas
│   │   ├── layout.tsx       # Layout del dashboard
│   │   └── dashboard/
│   │       ├── page.tsx     # Dashboard principal
│   │       ├── patients/    # Módulo de pacientes
│   │       ├── appointments/# Módulo de citas
│   │       ├── pharmacy/    # Módulo de farmacia
│   │       ├── inventory/   # Módulo de inventario
│   │       └── billing/     # Módulo de facturación
│   ├── globals.css          # Estilos globales
│   └── layout.tsx           # Layout raíz
├── components/
│   ├── auth/                # Componentes de autenticación
│   └── shared/              # Componentes compartidos
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Cliente de Supabase (cliente)
│   │   └── server.ts        # Cliente de Supabase (servidor)
│   ├── types.ts             # Tipos TypeScript
│   └── utils.ts             # Funciones de utilidad
├── middleware.ts            # Middleware de autenticación
└── supabase/
    └── schema.sql           # Schema de base de datos
```

## Personalización

### Colores
Edita `tailwind.config.js` para cambiar la paleta de colores:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#0ea5e9',  // Color principal
      },
    },
  },
}
```

### Roles
Edita `lib/types.ts` para agregar o modificar roles:
```typescript
export type UserRole = 'admin' | 'doctor' | 'nurse' | 'reception' | 'pharmacy';
```

### Políticas RLS
Edita `supabase/schema.sql` para modificar las políticas de seguridad.

## Seguridad

- **Row Level Security (RLS)**: Todas las tablas tienen políticas RLS activas
- **Auditoría**: Cada modificación se registra en `audit_logs`
- **Autenticación**: Tokens JWT con refresh automático
- **Middleware**: Verificación de sesión en cada request

## Próximas Mejoras

- [ ] Notificaciones push
- [ ] Integración con SMS para recordatorios
- [ ] Reportes PDF/Excel
- [ ] Dashboard de analíticas
- [ ] Subida de archivos (imágenes, documentos)
- [ ] API externa para integración
- [ ] Multi-tenant support

## Licencia

MIT License - Feel free to use for personal or commercial projects.

## Soporte

Para preguntas o soporte, contacta al equipo de desarrollo.
