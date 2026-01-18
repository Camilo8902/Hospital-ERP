import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/auth/callback', '/auth/confirm'];

// Rutas que requieren roles específicos
const roleRestrictedRoutes: Record<string, string[]> = {
  '/dashboard/patients': ['admin', 'doctor', 'nurse', 'reception'],
  '/dashboard/patients/new': ['admin', 'reception'],
  '/dashboard/patients/[id]': ['admin', 'doctor', 'nurse'],
  '/dashboard/appointments': ['admin', 'doctor', 'nurse', 'reception'],
  '/dashboard/appointments/new': ['admin', 'reception'],
  '/dashboard/inventory': ['admin', 'pharmacy'],
  '/dashboard/pharmacy': ['admin', 'pharmacy', 'doctor'],
  '/dashboard/billing': ['admin', 'reception'],
  '/dashboard/reports': ['admin', 'doctor'],
  '/dashboard/users': ['admin'],
  '/dashboard/users/new': ['admin'],
  '/dashboard/users/[id]': ['admin'],
  '/dashboard/settings': ['admin'],
  '/dashboard/lab': ['admin', 'lab', 'lab_admin', 'doctor'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar si es una ruta pública primero para evitar procesamiento innecesario
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Crear cliente de Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
        },
      },
    }
  );
  
  // Verificar sesión
  const { data: { session }, error } = await supabase.auth.getSession();
  
  // Si hay error o no hay sesión, redirigir al login
  if (error || !session) {
    const loginUrl = new URL('/login', request.url);
    // Guardar la ruta original para redirigir después del login
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verificar rol del usuario para rutas restringidas
  const userRole = session.user.user_metadata?.role || 'reception';
  
  for (const [route, roles] of Object.entries(roleRestrictedRoutes)) {
    // Convertir la ruta del patrón a regex para coincidencia
    const routePattern = route.replace(/\[id\]/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}`);
    
    if (regex.test(pathname)) {
      if (!roles.includes(userRole)) {
        // Redirigir a acceso no autorizado o dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }
  
  // Crear respuesta y refrescar token de forma asíncrona sin bloquear
  const response = NextResponse.next();
  
  // Refrescar sesión en background
  supabase.auth.refreshSession().catch(() => {
    // Silenciosamente ignorar errores de refresh
  });
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas de solicitud excepto:
     * - api (API routes) - se manejan por separado
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (icono)
     * - public folder
     * - Archivos con extensiones conocidas
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf)$).*)',
  ],
};
