import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // La función setAll se llama desde un componente del servidor
          }
        },
      },
    }
  );
}

// Función para obtener el usuario actual
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Función para obtener el perfil del usuario actual
export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

// Función para verificar si el usuario tiene un rol específico
export async function hasRole(role: string) {
  const profile = await getCurrentProfile();
  return profile?.role === role;
}

// Función para verificar si el usuario tiene alguno de los roles especificados
export async function hasAnyRole(roles: string[]) {
  const profile = await getCurrentProfile();
  return profile ? roles.includes(profile.role) : false;
}
