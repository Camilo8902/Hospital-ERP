// =============================================================================
// ARCHIVO: lib/actions/appointments/base/getAppointmentById.ts
// Descripción: Server action para obtener una cita específica por su ID
//              con todos los datos relacionados
// =============================================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { Appointment } from '@/lib/types/appointments';

export interface GetAppointmentByIdOptions {
  includePatient?: boolean;
  includeDoctor?: boolean;
  includeDepartment?: boolean;
  includePhysioDetails?: boolean;
}

export async function getAppointmentById(
  appointmentId: string,
  options: GetAppointmentByIdOptions = {}
) {
  const supabase = await createClient();
  
  try {
    // Construir la consulta según las opciones
    let query = supabase
      .from('appointments')
      .select(`
        *,
        patient:patients!inner(id, first_name, last_name, email, phone, medical_record_number, dob, gender),
        doctor:profiles!inner(id, full_name, specialty, email),
        department:departments!inner(id, name, code)
      `)
      .eq('id', appointmentId)
      .single();

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Cita no encontrada', data: null };
      }
      console.error('Error fetching appointment:', error);
      return { success: false, error: error.message, data: null };
    }

    // Si es una cita de fisioterapia, obtener detalles adicionales
    if (options.includePhysioDetails && data.appointment_type === 'physiotherapy') {
      const { data: physioDetails, error: physioError } = await supabase
        .from('physio_sessions')
        .select(`
          *,
          treatment_plan:physio_treatment_plans(id, plan_type, total_sessions_prescribed)
        `)
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!physioError && physioDetails) {
        (data as Record<string, unknown>).physio_session = physioDetails;
      }
    }

    return { 
      success: true, 
      data: data as unknown as Appointment 
    };
  } catch (err) {
    console.error('Unexpected error in getAppointmentById:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Error desconocido',
      data: null 
    };
  }
}

// Función para obtener el contexto clínico completo de una cita de fisioterapia
export async function getAppointmentPhysioContext(appointmentId: string) {
  const supabase = await createClient();
  
  try {
    // Primero obtener la cita para saber el paciente
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('patient_id, department_specific_data')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: 'Cita no encontrada', data: null };
    }

    // Obtener el registro médico de fisioterapia del paciente
    const { data: medicalRecord, error: recordError } = await supabase
      .from('physio_medical_records')
      .select(`
        *,
        patient:patients(id, full_name, medical_record_number)
      `)
      .eq('patient_id', appointment.patient_id)
      .eq('status', 'active')
      .single();

    if (recordError && recordError.code !== 'PGRST116') {
      console.error('Error fetching physio medical record:', recordError);
      return { success: false, error: recordError.message, data: null };
    }

    // Obtener el plan de tratamiento activo
    let treatmentPlan = null;
    if (medicalRecord) {
      const { data: plan, error: planError } = await supabase
        .from('physio_treatment_plans')
        .select(`
          *,
          sessions:physio_sessions(id, session_date, session_number)
        `)
        .eq('patient_id', appointment.patient_id)
        .eq('status', 'active')
        .single();

      if (!planError && plan) {
        treatmentPlan = plan;
      }
    }

    // Obtener sesiones recientes
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('physio_sessions')
      .select(`
        *,
        therapist:profiles(id, full_name, specialty)
      `)
      .eq('patient_id', appointment.patient_id)
      .order('session_date', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('Error fetching recent sessions:', sessionsError);
    }

    return {
      success: true,
      data: {
        appointment: {
          id: appointmentId,
          department_specific_data: appointment.department_specific_data
        },
        medicalRecord,
        treatmentPlan,
        recentSessions: recentSessions || []
      }
    };
  } catch (err) {
    console.error('Unexpected error in getAppointmentPhysioContext:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido',
      data: null
    };
  }
}
