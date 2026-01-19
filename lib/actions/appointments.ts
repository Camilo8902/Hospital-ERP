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
  patient_first_name?: string | null;
  patient_last_name?: string | null;
  patient_phone?: string | null;
  patient_email?: string | null;
  doctor_full_name?: string | null;
  doctor_specialty?: string | null;
  department_name?: string | null;
  room_number?: string | null;
}

// Función para crear fecha en hora local desde string YYYY-MM-DD
function createLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export async function getAppointments(
  dateFilter: string = 'all',
  statusFilter: string = 'all',
  specificDate?: string
): Promise<AppointmentWithRelations[]> {
  const adminSupabase = createAdminClient();
  
  // Obtener todas las citas sin restricciones de fecha
  let appointmentsQuery = adminSupabase
    .from('appointments')
    .select(`
      id,
      patient_id,
      doctor_id,
      department_id,
      room_id,
      appointment_type,
      status,
      start_time,
      end_time,
      reason,
      notes,
      created_at,
      updated_at
    `)
    .order('start_time', { ascending: true })
    .limit(500);

  const { data: appointments, error } = await appointmentsQuery;

  if (error) {
    console.error('Error al obtener citas:', error);
    return [];
  }

  if (!appointments || appointments.length === 0) {
    return [];
  }

  // Aplicar filtro de fecha en memoria (sin restricciones de zona horaria)
  let filteredAppointments = appointments;

  // Si hay una fecha específica, usarla
  if (specificDate) {
    // Crear fecha en hora local usando la función helper
    const selectedDate = createLocalDate(specificDate);
    const selectedDateStart = new Date(selectedDate);
    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);
    
    filteredAppointments = appointments.filter(apt => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= selectedDateStart && aptDate <= selectedDateEnd;
    });
  } else {
    // Filtros por período
    switch (dateFilter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filteredAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= today && aptDate < tomorrow;
        });
        break;
      case 'week':
        const weekStart = new Date();
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
        filteredAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= weekStart && aptDate < weekEnd;
        });
        break;
      case 'upcoming':
        const now = new Date();
        filteredAppointments = appointments.filter(apt => {
          const aptDate = new Date(apt.start_time);
          return aptDate >= now;
        });
        break;
      case 'all':
      default:
        // No aplicar filtro de fecha - mostrar todas las citas
        filteredAppointments = appointments;
        break;
    }
  }

  // Aplicar filtro de estado
  if (statusFilter !== 'all') {
    filteredAppointments = filteredAppointments.filter(apt => apt.status === statusFilter);
  }

  // Obtener todos los patient_ids y doctor_ids
  const patientIds = Array.from(new Set(filteredAppointments.map(a => a.patient_id).filter(Boolean)));
  const doctorIds = Array.from(new Set(filteredAppointments.map(a => a.doctor_id).filter(Boolean)));
  const departmentIds = Array.from(new Set(filteredAppointments.map(a => a.department_id).filter(Boolean)));
  const roomIds = Array.from(new Set(filteredAppointments.map(a => a.room_id).filter(Boolean)));

  // Obtener pacientes
  const { data: patients } = patientIds.length > 0
    ? await adminSupabase
        .from('patients')
        .select('id, first_name, last_name, phone, email')
        .in('id', patientIds)
    : { data: [], error: null };

  // Obtener doctores
  const { data: doctors } = doctorIds.length > 0
    ? await adminSupabase
        .from('profiles')
        .select('id, full_name, specialty')
        .in('id', doctorIds)
    : { data: [], error: null };

  // Obtener departamentos
  const { data: departments } = departmentIds.length > 0
    ? await adminSupabase
        .from('departments')
        .select('id, name')
        .in('id', departmentIds)
    : { data: [], error: null };

  // Obtener habitaciones
  const { data: rooms } = roomIds.length > 0
    ? await adminSupabase
        .from('rooms')
        .select('id, room_number')
        .in('id', roomIds)
    : { data: [], error: null };

  // Crear mapas para acceso rápido
  const patientMap = new Map(patients?.map(p => [p.id, p]) || []);
  const doctorMap = new Map(doctors?.map(d => [d.id, d]) || []);
  const departmentMap = new Map(departments?.map(d => [d.id, d]) || []);
  const roomMap = new Map(rooms?.map(r => [r.id, r]) || []);

  // Combinar datos
  return filteredAppointments.map(apt => {
    const patient = patientMap.get(apt.patient_id);
    const doctor = doctorMap.get(apt.doctor_id);
    const department = departmentMap.get(apt.department_id);
    const room = roomMap.get(apt.room_id);

    return {
      id: apt.id,
      patient_id: apt.patient_id,
      doctor_id: apt.doctor_id,
      department_id: apt.department_id,
      room_id: apt.room_id,
      appointment_type: apt.appointment_type,
      status: apt.status,
      start_time: apt.start_time,
      end_time: apt.end_time,
      reason: apt.reason,
      notes: apt.notes,
      created_at: apt.created_at,
      updated_at: apt.updated_at,
      patient_first_name: patient?.first_name || null,
      patient_last_name: patient?.last_name || null,
      patient_phone: patient?.phone || null,
      patient_email: patient?.email || null,
      doctor_full_name: doctor?.full_name || null,
      doctor_specialty: doctor?.specialty || null,
      department_name: department?.name || null,
      room_number: room?.room_number || null,
    };
  });
}

export async function getAppointmentById(id: string): Promise<AppointmentWithRelations | null> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('appointments')
    .select(`
      id,
      patient_id,
      doctor_id,
      department_id,
      room_id,
      appointment_type,
      status,
      start_time,
      end_time,
      reason,
      notes,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
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
      department_id: formData.get('department_id') as string || null,
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
    return { success: false, error: error instanceof Error ? error.message : 'Error al actualizar estado' };
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
    console.error('Error al obtener pacientes:', error);
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
    console.error('Error al obtener doctores:', error);
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
    console.error('Error al obtener departamentos:', error);
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
    console.error('Error al obtener habitaciones:', error);
    return [];
  }

  return data;
}
