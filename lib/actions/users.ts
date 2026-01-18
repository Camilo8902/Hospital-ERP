'use server';

import { revalidatePath } from 'next/cache';
import { 
  createAdminClient, 
  adminCreateUser, 
  adminUpdateUser, 
  adminDeleteUser,
  adminUpdateUserPassword 
} from '@/lib/supabase/admin';

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'reception' | 'pharmacy';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  specialty: string | null;
  license_number: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

// Obtener usuario actual autenticado
export async function getCurrentUser(): Promise<UserProfile | null> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', (await adminSupabase.auth.getSession()).data.session?.user.id || '')
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserProfile;
}

// Obtener todos los usuarios (USANDO ADMIN CLIENT para evitar problemas RLS)
export async function getUsers(): Promise<UserProfile[]> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener usuarios:', error);
    throw new Error('Error al obtener usuarios');
  }

  return data as UserProfile[];
}

// Obtener un usuario por ID (USANDO ADMIN CLIENT para evitar problemas RLS)
export async function getUserById(id: string): Promise<UserProfile | null> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener usuario:', error);
    return null;
  }

  return data as UserProfile;
}

// Crear un nuevo usuario (YA USA ADMIN CLIENT)
export async function createUser(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const role = formData.get('role') as UserRole;
  const specialty = formData.get('specialty') as string;
  const licenseNumber = formData.get('license_number') as string;
  const phone = formData.get('phone') as string;

  // Validaciones
  if (!email || !password || !fullName || !role) {
    return { success: false, error: 'Por favor completa todos los campos requeridos' };
  }

  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  try {
    // Crear usuario en auth.users usando el Service Role Key
    const { user: authUser, error: authError } = await adminCreateUser(
      email,
      password,
      {
        full_name: fullName,
        role: role,
      }
    );

    if (authError) {
      console.error('Error al crear usuario en auth:', authError);
      return { success: false, error: authError.message };
    }

    if (!authUser) {
      return { success: false, error: 'Error al crear usuario' };
    }

    // Insertar/Actualizar en public.profiles usando el cliente admin
    // El trigger ya crea el perfil automáticamente, pero necesitamos actualizar con los datos correctos
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        email,
        full_name: fullName,
        role,
        specialty: specialty || null,
        license_number: licenseNumber || null,
        phone: phone || null,
        is_active: true,
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error al crear perfil:', profileError);
      // Si falla el perfil, eliminar el usuario de auth
      await adminDeleteUser(authUser.id);
      return { success: false, error: 'Error al crear perfil de usuario' };
    }

    revalidatePath('/dashboard/users');
    return { success: true };

  } catch (error) {
    console.error('Error inesperado al crear usuario:', error);
    return { success: false, error: 'Ocurrió un error inesperado' };
  }
}

// Actualizar un usuario (USANDO ADMIN CLIENT)
export async function updateUser(
  id: string, 
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();
  
  const fullName = formData.get('full_name') as string;
  const role = formData.get('role') as UserRole;
  const specialty = formData.get('specialty') as string;
  const licenseNumber = formData.get('license_number') as string;
  const phone = formData.get('phone') as string;
  const isActive = formData.get('is_active') === 'true';

  // Validaciones
  if (!fullName || !role) {
    return { success: false, error: 'Por favor completa todos los campos requeridos' };
  }

  try {
    // Actualizar perfil
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        full_name: fullName,
        role,
        specialty: specialty || null,
        license_number: licenseNumber || null,
        phone: phone || null,
        is_active: isActive,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error al actualizar perfil:', updateError);
      return { success: false, error: 'Error al actualizar usuario' };
    }

    // Actualizar metadatos en auth.users usando el cliente de administración
    const { error: metadataError } = await adminUpdateUser(id, {
      full_name: fullName,
      role: role,
    });

    if (metadataError) {
      console.error('Error al actualizar metadatos:', metadataError);
      // No fallar por esto, el perfil ya se actualizó
    }

    revalidatePath('/dashboard/users');
    revalidatePath(`/dashboard/users/${id}`);
    return { success: true };

  } catch (error) {
    console.error('Error inesperado al actualizar usuario:', error);
    return { success: false, error: 'Ocurrió un error inesperado' };
  }
}

// Eliminar un usuario (USANDO ADMIN CLIENT)
export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();
  
  try {
    // Eliminar de auth.users (esto debería eliminar el perfil por CASCADE)
    const { error: deleteError } = await adminDeleteUser(id);

    if (deleteError) {
      console.error('Error al eliminar usuario:', deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/dashboard/users');
    return { success: true };

  } catch (error) {
    console.error('Error inesperado al eliminar usuario:', error);
    return { success: false, error: 'Ocurrió un error inesperado' };
  }
}

// Alternar estado activo/inactivo (USANDO ADMIN CLIENT)
export async function toggleUserStatus(
  id: string, 
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();
  
  try {
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id);

    if (updateError) {
      console.error('Error al cambiar estado:', updateError);
      return { success: false, error: 'Error al cambiar estado del usuario' };
    }

    revalidatePath('/dashboard/users');
    return { success: true };

  } catch (error) {
    console.error('Error inesperado al cambiar estado:', error);
    return { success: false, error: 'Ocurrió un error inesperado' };
  }
}

// Actualizar contraseña de usuario (USANDO ADMIN CLIENT)
export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  // Validaciones
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  try {
    const { error } = await adminUpdateUserPassword(userId, newPassword);

    if (error) {
      console.error('Error al actualizar contraseña:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Password Update] Contraseña actualizada exitosamente para usuario: ${userId}`);
    return { success: true };

  } catch (error) {
    console.error('Error inesperado al actualizar contraseña:', error);
    return { success: false, error: 'Ocurrió un error inesperado' };
  }
}
