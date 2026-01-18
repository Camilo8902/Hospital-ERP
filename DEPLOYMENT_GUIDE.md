# =============================================================================
# GUÍA DE DESPLIEGUE EN NETLIFY - MEDICORE ERP
# =============================================================================
# Este documento proporciona instrucciones detalladas para desplegar
# MediCore ERP exitosamente en Netlify.
# =============================================================================

## 1. ARCHIVOS MODIFICADOS PARA NETLIFY

Los siguientes archivos han sido actualizados para garantizar un despliegue exitoso:

### 1.1 netlify.toml
- Eliminado el redirect catch-all que causaba errores 404
- Agregado el plugin de Next.js para Netlify
- Configurados headers de seguridad apropiados
- Corregida la configuración de rutas de API

### 1.2 next.config.js
- Agregado `output: 'standalone'` para optimizar el tamaño del build
- Agregados headers de seguridad adicionales
- Configuradas imágenes para servir directamente desde CDN

### 1.3 middleware.ts
- Optimizado para verificar rutas públicas primero
- Mejorado el manejo de errores de sesión
- Corregido el matcher para excluir archivos estáticos correctamente

### 1.4 .env.example
- Agregada la variable SUPABASE_SERVICE_ROLE_KEY
- Agregadas notas explicativas sobre cada variable

## 2. VERIFICACIÓN PREVIA AL DESPLIEGUE

### 2.1 Dependencias Verificadas
- Next.js 14.2.18 ✓
- @supabase/ssr 0.5.2 ✓
- @supabase/supabase-js 2.47.10 ✓
- react 18.3.1 ✓
- react-dom 18.3.1 ✓
- Todas las dependencias son compatibles con Node.js 20

### 2.2 Estructura del Proyecto
```
medicore-erp/
├── app/
│   ├── (auth)/           # Rutas de autenticación
│   ├── (dashboard)/      # Dashboard principal
│   └── api/              # API routes
├── components/           # Componentes React
├── lib/                  # Utilidades y clientes de Supabase
├── supabase/             # Scripts de base de datos
└── public/               # Archivos estáticos
```

### 2.3 Configuración de Base de Datos
El archivo `supabase/schema.sql` contiene:
- Definición de todas las tablas
- Políticas RLS (Row Level Security)
- Funciones trigger para auditoría
- Datos de seed para pruebas

## 3. PASOS DE DESPLIEGUE

### 3.1 Preparación del Repositorio

```bash
# 1. Navegar al directorio del proyecto
cd medicore-erp

# 2. Verificar que los archivos estén actualizados
git status

# 3. Si hay cambios, hacer commit
git add .
git commit -m "feat: Configuración optimizada para Netlify"
git push origin master
```

### 3.2 Configuración en Netlify

#### Paso 1: Crear Proyecto en Supabase
1. Acceder a https://supabase.com
2. Crear un nuevo proyecto
3. Esperar a que termine la configuración inicial (2-3 minutos)

#### Paso 2: Ejecutar Schema de Base de Datos
1. En el panel de Supabase, ir a **SQL Editor**
2. Copiar el contenido de `supabase/schema.sql`
3. Ejecutar el script SQL

#### Paso 3: Conectar a Netlify
1. Acceder a https://netlify.com
2. Hacer clic en **Add new site** → **Import an existing project**
3. Seleccionar GitHub/GitLab/Bitbucket
4. Autorizar el acceso a Netlify
5. Seleccionar el repositorio `medicore-erp`

#### Paso 4: Configurar Variables de Entorno
En Netlify, ir a **Site settings** → **Environment variables** y agregar:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

#### Paso 5: Configurar Build
Netlify detectará automáticamente:
- Build command: `npm run build`
- Publish directory: `.next`

#### Paso 6: Desplegar
Hacer clic en **Deploy site**

## 4. VARIABLES DE ENTORNO REQUERIDAS

### 4.1 Variables de Producción

| Variable | Descripción | Fuente |
|----------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anónima | Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (servidor) | Settings → API → service_role secret |

### 4.2 Notas de Seguridad

⚠️ **IMPORTANTE**:
- NUNCA expongas `SUPABASE_SERVICE_ROLE_KEY` en el código del cliente
- Esta clave tiene acceso total a la base de datos
- Solo usarla en Server Actions y API routes del servidor

## 5. VERIFICACIÓN POST-DESPLIEGUE

### 5.1 Prueba de Funcionalidades

#### Autenticación
- [ ] Acceder a la página de login
- [ ] Iniciar sesión con credenciales de prueba
- [ ] Verificar redirección al dashboard
- [ ] Probar cierre de sesión

#### Dashboard
- [ ] Ver que se carguen las estadísticas
- [ ] Verificar citas del día
- [ ] Ver pacientes recientes

#### Módulos
- [ ] Acceder a lista de pacientes
- [ ] Crear nuevo paciente
- [ ] Ver módulo de farmacia
- [ ] Acceder a citas

### 5.2 Verificación de Consola

En el navegador, abrir Developer Tools (F12) y verificar:
- No hay errores en la consola
- No hay advertencias de TypeScript
- Las llamadas a Supabase retornan 200 OK

## 6. SOLUCIÓN DE PROBLEMAS COMUNES

### 6.1 Error 404 en Rutas

**Síntoma**: Las rutas del dashboard devuelven 404.

**Causa**: Configuración incorrecta de redirects en netlify.toml.

**Solución**: Verificar que el archivo netlify.toml tenga la configuración actualizada proporcionada.

### 6.2 Error de Autenticación

**Síntoma**: No se puede iniciar sesión o la sesión no persiste.

**Causa**: Variables de entorno incorrectas o faltantes.

**Solución**:
1. Verificar que las variables estén configuradas en Netlify
2. Revisar que las URLs sean correctas (sin trailing slash)
3. Verificar que la Anon Key sea la correcta

### 6.3 Error de Build

**Síntoma**: El build falla con errores de TypeScript.

**Causa**: Tipos faltantes o incompatibles.

**Solución**:
```bash
# Ejecutar build localmente para ver errores
npm run build

# Si hay errores de tipo, revisar los mensajes
```

### 6.4 Error de Conexión a Base de Datos

**Síntoma**: Las llamadas a la API fallan con error de conexión.

**Causa**: Políticas RLS bloqueando el acceso.

**Solución**:
1. Verificar que las políticas RLS estén correctamente configuradas
2. Asegurarse de que el usuario tenga el rol correcto en metadata

## 7. CREDENCIALES DE PRUEBA

Después de ejecutar el schema SQL en Supabase, se pueden crear los siguientes usuarios:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@medicore.com | admin123 |
| Médico | doctor@medicore.com | doctor123 |
| Recepción | recepcion@medicore.com | recepcion123 |
| Farmacéutico | pharmacy@medicore.com | pharmacy123 |
| Enfermero | nurse@medicore.com | nurse123 |

## 8. MONITOREO Y MANTENIMIENTO

### 8.1 Logs de Netlify

Acceder a Netlify Dashboard → **Function logs** para ver:
- Errores de API routes
- Problemas de autenticación
- Excepciones en Server Actions

### 8.2 Backups de Base de Datos

Supabase proporciona:
- Backups automáticos diarios (plan Pro)
- Backups manuales disponibles
- Point-in-time recovery (plan Enterprise)

### 8.3 Actualizaciones

Para actualizar la aplicación:
```bash
# Hacer cambios en el código local
git add .
git commit -m "descripción del cambio"
git push

# Netlify desplegará automáticamente
```

## 9. RECURSOS ADICIONALES

### Documentación
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Netlify Documentation](https://docs.netlify.com)

### Soporte
- [Netlify Community](https://community.netlify.com)
- [Supabase Discord](https://discord.supabase.com)

---

**Fecha de última actualización**: 18 de enero de 2025
**Versión del proyecto**: 1.0.0
**Framework**: Next.js 14.2.18
**Plataforma de despliegue**: Netlify
