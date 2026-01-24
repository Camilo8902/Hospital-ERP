// =============================================================================
// ARCHIVO: lib/actions/appointments/physiotherapy/linkToMedicalRecord.ts
// Descripción: Server action para vincular citas de fisioterapia con registros
//              médicos y planes de tratamiento
// =============================================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface LinkToMedicalRecordInput {
  appointmentId: string;
  medicalRecordId: string;
  recordType: 'physio_record' | 'treatment_plan' | 'initial_assessment';
}

export async function linkToMedicalRecord(input: LinkToMedicalRecordInput) {
  const supabase = await createClient();
  
  try {
    const { appointmentId, medicalRecordId, recordType } = input;

    // Verificar que la cita existe y es de fisioterapia
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, appointment_type, department_specific_data')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: 'Cita no encontrada' };
    }

    if (appointment.appointment_type !== 'physiotherapy') {
      return { success: false, error: 'La cita no es de fisioterapia' };
    }

    // Verificar que el registro médico existe y pertenece al mismo paciente
    const { data: medicalRecord, error: recordError } = await supabase
      .from('physio_medical_records')
      .select('id, patient_id')
      .eq('id', medicalRecordId)
      .single();

    if (recordError || !medicalRecord) {
      return { success: false, error: 'Registro médico no encontrado' };
    }

    // Verificar que el paciente coincide
    const { data: appointmentPatient } = await supabase
      .from('appointments')
      .select('patient_id')
      .eq('id', appointmentId)
      .single();

    if (appointmentPatient?.patient_id !== medicalRecord.patient_id) {
      return { success: false, error: 'El registro médico no pertenece al paciente de la cita' };
    }

    // Actualizar la cita con la referencia clínica
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        clinical_reference_type: recordType,
        clinical_reference_id: medicalRecordId,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error linking clinical reference:', updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/dashboard/appointments/${appointmentId}`);

    return {
      success: true,
      message: 'Registro médico vinculado exitosamente'
    };
  } catch (err) {
    console.error('Unexpected error in linkToMedicalRecord:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    };
  }
}

// Función para obtener el contexto de fisioterapia de un paciente
export async function getPatientPhysioContext(patientId: string) {
  const supabase = await createClient();
  
  try {
    // Obtener el registro médico de fisioterapia activo
    const { data: medicalRecord, error: recordError } = await supabase
      .from('physio_medical_records')
      .select(`
        *,
        patient:patients(id, full_name, medical_record_number, phone)
      `)
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .single();

    if (recordError && recordError.code !== 'PGRST116') {
      console.error('Error fetching medical record:', recordError);
      return { success: false, error: recordError.message };
    }

    // Obtener el plan de tratamiento activo
    let treatmentPlan = null;
    if (medicalRecord) {
      const { data: plan, error: planError } = await supabase
        .from('physio_treatment_plans')
        .select(`
          *,
          sessions_aggregate:physio_sessions(count)
        `)
        .eq('patient_id', patientId)
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
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    // Obtener citas pendientes de fisioterapia
    const { data: pendingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id, start_time, end_time, workflow_status,
        doctor:profiles(id, full_name)
      `)
      .eq('patient_id', patientId)
      .eq('appointment_type', 'physiotherapy')
      .in('workflow_status', ['scheduled', 'checked_in'])
      .order('start_time', { ascending: true })
      .limit(3);

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
    }

    return {
      success: true,
      data: {
        medicalRecord,
        treatmentPlan,
        recentSessions: recentSessions || [],
        pendingAppointments: pendingAppointments || []
      }
    };
  } catch (err) {
    console.error('Unexpected error in getPatientPhysioContext:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    };
  }
}

// Función para crear un registro médico de fisioterapia desde una cita
export async function createPhysioMedicalRecord(
  appointmentId: string,
  recordData: {
    chief_complaint?: string;
    pain_location?: string;
    pain_scale_baseline?: number;
    pain_duration?: string;
    pain_type?: string;
    pain_characteristics?: string;
    clinical_diagnosis?: string;
  }
) {
  const supabase = await createClient();
  
  try {
    // Obtener la cita para saber el paciente y terapeuta
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('patient_id, doctor_id, department_id')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: 'Cita no encontrada' };
    }

    // Crear el registro médico
    const { data: medicalRecord, error: createError } = await supabase
      .from('physio_medical_records')
      .insert({
        patient_id: appointment.patient_id,
        therapist_id: appointment.doctor_id,
        department_id: appointment.department_id,
        chief_complaint: recordData.chief_complaint,
        pain_location: recordData.pain_location,
        pain_scale_baseline: recordData.pain_scale_baseline,
        pain_duration: recordData.pain_duration,
        pain_type: recordData.pain_type,
        pain_characteristics: recordData.pain_characteristics,
        clinical_diagnosis: recordData.clinical_diagnosis,
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating medical record:', createError);
      return { success: false, error: createError.message };
    }

    // Vincular el registro a la cita
    await linkToMedicalRecord({
      appointmentId,
      medicalRecordId: medicalRecord.id,
      recordType: 'physio_record'
    });

    revalidatePath(`/dashboard/appointments/${appointmentId}`);

    return {
      success: true,
      data: medicalRecord,
      message: 'Registro médico de fisioterapia creado exitosamente'
    };
  } catch (err) {
    console.error('Unexpected error in createPhysioMedicalRecord:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    };
  }
}
