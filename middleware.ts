import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/auth/callback'];

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
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isPublicRoute) {
    // Verificar sesión
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Redirigir a login si no hay sesión
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verificar rol del usuario para rutas restringidas
    const userRole = session.user.user_metadata?.role || 'reception';

    for (const [route, roles] of Object.entries(roleRestrictedRoutes)) {
      if (request.nextUrl.pathname.startsWith(route)) {
        if (!roles.includes(userRole)) {
          // Redirigir a acceso no autorizado o dashboard
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }
  }

  // Refrescar token si es necesario
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await supabase.auth.refreshSession();
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Coincidir con todas las rutas de solicitud excepto:
     * - api (API routes)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (icono)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
