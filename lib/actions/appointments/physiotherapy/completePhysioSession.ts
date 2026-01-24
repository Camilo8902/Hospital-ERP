// =============================================================================
// ARCHIVO: lib/actions/appointments/physiotherapy/completePhysioSession.ts
// Descripción: Server action para completar sesiones de fisioterapia y
//              actualizar el flujo de trabajo de las citas
// =============================================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CompletePhysioSessionInput {
  appointmentId: string;
  sessionData: {
    subjective?: string;
    objective?: string;
    analysis?: string;
    plan?: string;
    pain_level?: number;
    pain_location?: string;
    rom_affected?: string;
    muscle_strength_grade?: number;
    techniques_applied?: string[];
    modality?: string;
    notes?: string;
    functional_score?: number;
  };
  updateAppointmentStatus?: boolean;
}

export async function completePhysioSession(input: CompletePhysioSessionInput) {
  const supabase = await createClient();
  
  try {
    const { appointmentId, sessionData, updateAppointmentStatus = true } = input;

    // Verificar que la cita existe
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, patient_id, doctor_id, department_specific_data, workflow_status')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: 'Cita no encontrada' };
    }

    const physioData = appointment.department_specific_data as Record<string, unknown>;

    // Crear el registro de la sesión
    const { data: session, error: sessionError } = await supabase
      .from('physio_sessions')
      .insert({
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        therapist_id: appointment.doctor_id,
        subjective: sessionData.subjective,
        objective: sessionData.objective,
        analysis: sessionData.analysis,
        plan: sessionData.plan,
        pain_level: sessionData.pain_level,
        pain_location: sessionData.pain_location,
        rom_affected: sessionData.rom_affected,
        muscle_strength_grade: sessionData.muscle_strength_grade,
        techniques_applied: sessionData.techniques_applied || [],
        modality: sessionData.modality,
        notes: sessionData.notes,
        functional_score: sessionData.functional_score,
        session_number: physioData?.sessionNumber || null,
        session_date: new Date().toISOString().split('T')[0],
        session_time: new Date().toTimeString().slice(0, 5),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return { success: false, error: sessionError.message };
    }

    // Si se solicita, actualizar el estado de la cita
    if (updateAppointmentStatus) {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          workflow_status: 'completed',
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('Error updating appointment:', updateError);
        return { success: false, error: updateError.message };
      }
    }

    // Si hay un plan de tratamiento, actualizar progreso
    if (physioData?.treatmentPlanId) {
      const { data: plan, error: planError } = await supabase
        .from('physio_treatment_plans')
        .select('id, sessions_completed, total_sessions_prescribed')
        .eq('id', physioData.treatmentPlanId)
        .single();

      if (!planError && plan) {
        const newCompleted = (plan.sessions_completed || 0) + 1;
        const newStatus = newCompleted >= (plan.total_sessions_prescribed || 0) 
          ? 'completed' 
          : 'active';

        await supabase
          .from('physio_treatment_plans')
          .update({
            sessions_completed: newCompleted,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', plan.id);
      }
    }

    // Revalidar caché
    revalidatePath('/dashboard/appointments');
    revalidatePath(`/dashboard/appointments/${appointmentId}`);
    revalidatePath('/dashboard/physiotherapy');

    return {
      success: true,
      data: session,
      message: 'Sesión de fisioterapia completada exitosamente'
    };
  } catch (err) {
    console.error('Unexpected error in completePhysioSession:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    };
  }
}

// Función para actualizar solo el estado de workflow de una cita
export async function updatePhysioWorkflowStatus(
  appointmentId: string,
  newStatus: 'scheduled' | 'checked_in' | 'in_consultation' | 'completed' | 'cancelled' | 'no_show'
) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('appointments')
      .update({
        workflow_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (error) {
      console.error('Error updating workflow status:', error);
      return { success: false, error: error.message };
    }

    // Actualizar estado general si está completada o cancelada
    if (newStatus === 'completed') {
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);
    } else if (newStatus === 'cancelled' || newStatus === 'no_show') {
      await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);
    }

    revalidatePath('/dashboard/appointments');
    revalidatePath(`/dashboard/appointments/${appointmentId}`);

    return {
      success: true,
      message: `Estado actualizado a ${newStatus}`
    };
  } catch (err) {
    console.error('Unexpected error in updatePhysioWorkflowStatus:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    };
  }
}
