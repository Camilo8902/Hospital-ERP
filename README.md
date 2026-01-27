# MediCore ERP - Sistema de Gestión Hospitalaria

MediCore ERP es un sistema integral de gestión hospitalaria desarrollado con Next.js 14 y Supabase. Permite gestionar pacientes, citas médicas, historia clínica electrónica, inventario de farmacia y facturación.

## 🚀 Despliegue en Vercel

### Requisitos Previos

- Cuenta de [Vercel](https://vercel.com)
- Cuenta de [Supabase](https://supabase.com)
- Node.js 18.x o superior

### Pasos para Desplegar en Vercel

#### 1. Preparar el Proyecto

```bash
# Clonar el repositorio
git clone <tu-repo-url>
cd medicore-erp

# Instalar dependencias
npm install
```

#### 2. Configurar Variables de Entorno

Crear archivo `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

#### 3. Conectar a Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Iniciar sesión
vercel login

# Deploy
vercel
```

O desde la web de Vercel:
1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en "Add New Project"
3. Importar tu repositorio de Git
4. Configurar las variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click en "Deploy"

#### 4. Configurar Supabase para Producción

En tu proyecto de Supabase:
1. Ir a **Settings** → **API**
2. Agregar tu dominio de Vercel a **Allowed Callback URLs**
3. Agregar tu dominio de Vercel a **Allowed Redirect URLs**

### Despliegue Automático

Cada vez que hagas push a la rama principal, Vercel redeployará automáticamente.

---

## 🏥 Características Principales

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

### Módulo de Fisioterapia
- Evaluación inicial completa (5 pasos)
- Dashboard con estadísticas
- Sesiones de tratamiento con notas SOAP
- Protocolos clínicos basados en evidencia
- Consentimientos informados digitales

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

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **UI Components**: Lucide React, Custom Components
- **Language**: TypeScript
- **Deployment**: Vercel

## 📁 Estructura del Proyecto

```
medicore-erp/
├── app/
│   ├── (auth)/              # Páginas de autenticación
│   ├── (dashboard)/         # Páginas protegidas
│   │   ├── dashboard/
│   │   │   ├── patients/    # Módulo de pacientes
│   │   │   ├── appointments/# Módulo de citas
│   │   │   ├── physiotherapy/# Módulo de fisioterapia
│   │   │   ├── pharmacy/    # Módulo de farmacia
│   │   │   ├── lab/         # Módulo de laboratorio
│   │   │   └── billing/     # Módulo de facturación
│   ├── api/                 # API routes
│   └── globals.css          # Estilos globales
├── components/              # Componentes reutilizables
├── lib/                     # Utilidades y configuraciones
│   ├── supabase/            # Clientes de Supabase
│   ├── types/               # Tipos TypeScript
│   └── actions/             # Server Actions
├── supabase/
│   └── migrations/          # Migraciones de base de datos
└── vercel.json              # Configuración de Vercel
```

## 🔧 Configuración de Supabase

### 1. Crear Proyecto
1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. Espera a que termine la configuración inicial

### 2. Ejecutar Migración de Base de Datos
1. Ve a **SQL Editor** en Supabase
2. Copia el contenido del archivo `supabase/migrations/20260127_physiotherapy_complete.sql`
3. Ejecuta el script SQL

### 3. Configurar Auth
1. Ve a **Authentication** → **Providers**
2. Asegúrate de que Email esté habilitado

### 4. Obtener Credenciales
1. Ve a **Settings** → **API**
2. Copia la URL del proyecto y la Anon Key
3. Agrégalas a las variables de entorno en Vercel

## 🔐 Credenciales de Prueba

Después de ejecutar la migración de seed data:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@medicore.com | admin123 |
| Médico | doctor@medicore.com | doctor123 |
| Recepción | recepcion@medicore.com | recepcion123 |
| Farmacéutico | pharmacy@medicore.com | pharmacy123 |
| Enfermero | nurse@medicore.com | nurse123 |

## 📝 Scripts Disponibles

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Construir para producción
npm run start    # Iniciar servidor de producción
npm run lint     # Ejecutar linter
```

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Feel free to use for personal or commercial projects.

## 📞 Soporte

Para preguntas o soporte, contacta al equipo de desarrollo.
