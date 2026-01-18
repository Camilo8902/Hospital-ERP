'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface AppointmentWithRelations {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  department_id: string | null;
  room_id: string | null;
  appointment_type: string;
  status: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
  } | null;
  profiles: {
    id: string;
    full_name: string;
    specialty: string | null;
  } | null;
  departments: {
    id: string;
    name: string;
  } | null;
  rooms: {
    id: string;
    room_number: string;
  } | null;
}

export async function getAppointments(
  dateFilter: string = 'upcoming',
  statusFilter: string = 'all'
): Promise<AppointmentWithRelations[]> {
  const adminSupabase = createAdminClient();
  
  // Usar fecha actual en UTC para consistencia
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowUTC = new Date(todayUTC);
  tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
  const weekEndUTC = new Date(todayUTC);
  weekEndUTC.setUTCDate(weekEndUTC.getUTCDate() + 7);

  let query = adminSupabase
    .from('appointments')
    .select(`
      *,
      patients (id, first_name, last_name, phone, email),
      profiles (id, full_name, specialty),
      departments (id, name),
      rooms (id, room_number)
    `)
    .order('start_time', { ascending: true });

  // Filtro por fecha - mostrar todas las citas futuras por defecto
  switch (dateFilter) {
    case 'today':
      query = query
        .gte('start_time', todayUTC.toISOString())
        .lt('start_time', tomorrowUTC.toISOString());
      break;
    case 'week':
      query = query
        .gte('start_time', todayUTC.toISOString())
        .lt('start_time', weekEndUTC.toISOString());
      break;
    case 'upcoming':
    default:
      query = query.gte('start_time', now.toISOString());
      break;
  }

  // Filtro por estado
  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }

  return data as AppointmentWithRelations[];
}

export async function getAppointmentById(id: string): Promise<AppointmentWithRelations | null> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('appointments')
    .select(`
      *,
      patients (id, first_name, last_name, phone, email),
      profiles (id, full_name, specialty),
      departments (id, name),
      rooms (id, room_number)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching appointment:', error);
    return null;
  }

  return data as AppointmentWithRelations;
}

export async function createAppointment(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const appointment = {
      patient_id: formData.get('patient_id') as string,
      doctor_id: formData.get('doctor_id') as string || null,
      department_id: formData.get('department_id') as string,
      room_id: formData.get('room_id') as string || null,
      appointment_type: formData.get('appointment_type') as string,
      status: 'scheduled',
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
      reason: formData.get('reason') as string || null,
      notes: formData.get('notes') as string || null,
    };

    const { error } = await adminSupabase
      .from('appointments')
      .insert(appointment);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/appointments');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al crear cita' };
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/appointments');
    revalidatePath(`/dashboard/appointments/${id}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al actualizar cita' };
  }
}

export async function deleteAppointment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/appointments');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al eliminar cita' };
  }
}

export async function getAllPatients() {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('patients')
    .select('id, first_name, last_name, phone, email')
    .order('last_name', { ascending: true });

  if (error) {
    console.error('Error fetching patients:', error);
    return [];
  }

  return data;
}

export async function getActiveDoctors() {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('profiles')
    .select('id, full_name, specialty')
    .in('role', ['doctor', 'admin'])
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }

  return data;
}

export async function getActiveDepartments() {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('departments')
    .select('id, name, code')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching departments:', error);
    return [];
  }

  return data;
}

export async function getAvailableRooms(departmentId?: string) {
  const adminSupabase = createAdminClient();
  
  let query = adminSupabase
    .from('rooms')
    .select('id, room_number, room_type, department_id')
    .eq('status', 'available');

  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }

  return data;
}
