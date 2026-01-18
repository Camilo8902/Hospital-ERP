import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente de administración con Service Role Key
// Este cliente tiene privilegios de administrador para gestionar usuarios
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Faltan variables de entorno de Supabase');
  }

  return createServerClient(
    supabaseUrl,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No necesitamos cookies para el cliente de administración
        },
      },
    }
  );
}

// Tipo para el usuario de Supabase Auth
export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    role?: string;
    [key: string]: unknown;
  };
  created_at: string;
}

// Crear usuario (solo para administradores)
export async function adminCreateUser(
  email: string,
  password: string,
  metadata: Record<string, unknown>
): Promise<{ user: SupabaseUser | null; error: Error | null }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    return { user: null, error: new Error(error.message) };
  }

  return { user: data.user as SupabaseUser, error: null };
}

// Actualizar usuario (solo para administradores)
export async function adminUpdateUser(
  userId: string,
  metadata: Record<string, unknown>
): Promise<{ user: SupabaseUser | null; error: Error | null }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: metadata,
  });

  if (error) {
    return { user: null, error: new Error(error.message) };
  }

  return { user: data.user as SupabaseUser, error: null };
}

// Eliminar usuario (solo para administradores)
export async function adminDeleteUser(
  userId: string
): Promise<{ error: Error | null }> {
  const supabase = createAdminClient();

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}

// Obtener usuario por ID (solo para administradores)
export async function adminGetUser(
  userId: string
): Promise<{ user: SupabaseUser | null; error: Error | null }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.getUserById(userId);

  if (error) {
    return { user: null, error: new Error(error.message) };
  }

  return { user: data.user as SupabaseUser, error: null };
}

// Listar todos los usuarios (solo para administradores, con paginación)
export async function adminListUsers(
  page = 1,
  perPage = 100
): Promise<{ users: SupabaseUser[]; error: Error | null }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage,
  });

  if (error) {
    return { users: [], error: new Error(error.message) };
  }

  return { users: data.users as SupabaseUser[], error: null };
}

// Actualizar contraseña de usuario (solo para administradores)
export async function adminUpdateUserPassword(
  userId: string,
  newPassword: string
): Promise<{ error: Error | null }> {
  const supabase = createAdminClient();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
}
