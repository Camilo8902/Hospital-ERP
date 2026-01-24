// =============================================================================
// ARCHIVO: lib/actions/appointments/base/getAppointments.ts
// Descripción: Server action base para obtener citas con soporte de filtros
//              incluyendo consultas sobre datos específicos de departamento
// =============================================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { Appointment, AppointmentFilters } from '@/lib/types/appointments';

export interface GetAppointmentsOptions extends AppointmentFilters {
  departmentCode?: string;
  includeDetails?: boolean;
}

export async function getAppointments(options: GetAppointmentsOptions = {}) {
  const supabase = await createClient();
  
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients!inner(id, first_name, last_name, email, phone, medical_record_number),
        doctor:profiles!inner(id, full_name, specialty),
        department:departments!inner(id, name, code)
      `);

    // Aplicar filtros básicos
    if (options.department_id) {
      query = query.eq('department_id', options.department_id);
    }

    if (options.workflow_status) {
      query = query.eq('workflow_status', options.workflow_status);
    }

    if (options.patient_id) {
      query = query.eq('patient_id', options.patient_id);
    }

    if (options.doctor_id) {
      query = query.eq('doctor_id', options.doctor_id);
    }

    if (options.appointment_type) {
      query = query.eq('appointment_type', options.appointment_type);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    // Filtrar por código de departamento si se proporciona
    if (options.departmentCode) {
      query = query.eq('department.code', options.departmentCode);
    }

    // Filtrar por rango de fechas
    if (options.start_date) {
      query = query.gte('start_time', options.start_date);
    }

    if (options.end_date) {
      query = query.lte('start_time', options.end_date);
    }

    // Aplicar paginación
    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset !== undefined) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    // Ordenar por fecha de inicio descendente
    query = query.order('start_time', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return { success: false, error: error.message, data: null };
    }

    return { 
      success: true, 
      data: data as unknown as Appointment[],
      total: data?.length || 0 
    };
  } catch (err) {
    console.error('Unexpected error in getAppointments:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Error desconocido',
      data: null 
    };
  }
}

// Función para buscar citas por datos específicos en JSONB
export async function searchAppointmentsByPhysioData(
  searchField: string,
  searchValue: unknown,
  departmentCode?: string
) {
  const supabase = await createClient();
  
  try {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients!inner(id, first_name, last_name, email, phone),
        doctor:profiles!inner(id, full_name, specialty),
        department:departments!inner(id, name, code)
      `)
      .eq('appointment_type', 'physiotherapy');

    if (departmentCode) {
      query = query.eq('department.code', departmentCode);
    }

    // Usar contains para buscar en el JSONB
    // Ejemplo: buscar por región corporal específica
    const searchObject = JSON.stringify({ [searchField]: searchValue });
    query = query.contains('department_specific_data', searchObject);

    const { data, error } = await query;

    if (error) {
      console.error('Error searching appointments:', error);
      return { success: false, error: error.message, data: null };
    }

    return { 
      success: true, 
      data: data as unknown as Appointment[],
      total: data?.length || 0 
    };
  } catch (err) {
    console.error('Unexpected error in searchAppointmentsByPhysioData:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Error desconocido',
      data: null 
    };
  }
}
