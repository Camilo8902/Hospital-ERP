// =============================================================================
// ARCHIVO: lib/actions/appointments/physiotherapy/createPhysioAppointment.ts
// Descripción: Server action especializado para crear citas de fisioterapia
//              con validación específica del dominio y manejo de JSONB
// =============================================================================

'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Schema de validación para citas de fisioterapia
const CreatePhysioAppointmentSchema = z.object({
  patient_id: z.string().uuid('ID de paciente inválido'),
  therapist_id: z.string().uuid('ID de terapeuta inválido').optional(),
  department_id: z.string().uuid('ID de departamento inválido').optional(),
  room_id: z.string().uuid('ID de habitación inválida').optional(),
  start_time: z.string().datetime('Fecha y hora de inicio inválida'),
  end_time: z.string().datetime('Fecha y hora de fin inválida'),
  reason: z.string().max(500).optional(),
  // Datos específicos de fisioterapia
  body_region: z.enum(
    ['cervical', 'shoulder', 'elbow', 'wrist', 'hand', 'lumbar', 'thoracic', 'hip', 'knee', 'ankle', 'foot', 'other'],
    { message: 'Región corporal no válida' }
  ),
  pain_level: z.number().min(0).max(10).optional(),
  therapy_type: z.enum(['manual', 'electro', 'hydro', 'exercise', 'combined']).optional(),
  requires_initial_assessment: z.boolean().optional(),
  session_number: z.number().int().min(1).optional(),
  treatment_plan_id: z.string().uuid().optional(),
  techniques: z.array(z.string()).optional(),
  therapist_notes: z.string().max(1000).optional(),
  referring_department_id: z.string().uuid().optional(),
});

export interface CreatePhysioAppointmentInput {
  patient_id: string;
  therapist_id?: string;
  department_id?: string;
  room_id?: string;
  start_time: string;
  end_time: string;
  reason?: string;
  body_region: string;
  pain_level?: number;
  therapy_type?: string;
  requires_initial_assessment?: boolean;
  session_number?: number;
  treatment_plan_id?: string;
  techniques?: string[];
  therapist_notes?: string;
  referring_department_id?: string;
}

export async function createPhysioAppointment(input: CreatePhysioAppointmentInput) {
  const supabase = await createClient();
  
  try {
    // Validar los datos de entrada
    const validationResult = CreatePhysioAppointmentSchema.safeParse(input);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Validation failed',
        details: validationResult.error.flatten().fieldErrors
      };
    }

    const data = validationResult.data;

    // Construir el objeto JSONB con datos específicos de fisioterapia
    const departmentSpecificData = {
      bodyRegion: data.body_region,
      painLevel: data.pain_level || 0,
      therapyType: data.therapy_type,
      requiresInitialAssessment: data.requires_initial_assessment || false,
      sessionNumber: data.session_number,
      treatmentPlanId: data.treatment_plan_id,
      techniques: data.techniques || [],
      therapistNotes: data.therapist_notes,
    };

    // Verificar que el paciente no tenga conflictos de horario
    const { data: conflicts, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_id', data.patient_id)
      .eq('appointment_type', 'physiotherapy')
      .or(`start_time.lte.${data.end_time},end_time.gte.${data.start_time}`)
      .not('workflow_status', 'eq', 'cancelled');

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
      return { success: false, error: conflictError.message };
    }

    if (conflicts && conflicts.length > 0) {
      return {
        success: false,
        error: 'El paciente ya tiene una cita de fisioterapia en ese horario'
      };
    }

    // Insertar la cita usando la función RPC
    const { data: appointment, error } = await supabase
      .rpc('create_physio_appointment', {
        p_patient_id: data.patient_id,
        p_therapist_id: data.therapist_id,
        p_department_id: data.department_id,
        p_room_id: data.room_id,
        p_start_time: data.start_time,
        p_end_time: data.end_time,
        p_body_region: data.body_region,
        p_pain_level: data.pain_level,
        p_therapy_type: data.therapy_type,
        p_session_number: data.session_number,
        p_treatment_plan_id: data.treatment_plan_id,
        p_techniques: data.techniques,
        p_therapist_notes: data.therapist_notes,
        p_reason: data.reason
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating physio appointment:', error);
      return { success: false, error: error.message };
    }

    // Si hay un plan de tratamiento, actualizar el contador de sesiones
    if (data.treatment_plan_id) {
      const { error: updatePlanError } = await supabase
        .from('physio_treatment_plans')
        .update({
          sessions_completed: supabase.rpc('increment', { val: 1 }),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.treatment_plan_id);

      if (updatePlanError) {
        console.error('Error updating treatment plan:', updatePlanError);
        // No fallar la operación por esto, solo registrar
      }
    }

    // Revalidar las rutas relacionadas
    revalidatePath('/dashboard/appointments');
    revalidatePath('/dashboard/physiotherapy');

    return {
      success: true,
      data: appointment,
      message: 'Cita de fisioterapia creada exitosamente'
    };
  } catch (err) {
    console.error('Unexpected error in createPhysioAppointment:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido al crear la cita'
    };
  }
}

// Función para crear una sesión de fisioterapia vinculada a la cita
export async function createPhysioSession(
  appointmentId: string,
  sessionData: {
    subjective?: string;
    objective?: string;
    analysis?: string;
    plan?: string;
    pain_level?: number;
    techniques_applied?: string[];
    notes?: string;
  }
) {
  const supabase = await createClient();
  
  try {
    // Primero obtener la cita para obtener el patient_id y therapist_id
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('patient_id, doctor_id, department_id, department_specific_data')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: 'Cita no encontrada' };
    }

    const physioData = appointment.department_specific_data as Record<string, unknown>;

    // Crear la sesión de fisioterapia
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
        body_region: physioData?.bodyRegion,
        techniques_applied: sessionData.techniques_applied || [],
        notes: sessionData.notes,
        session_number: physioData?.sessionNumber || 1,
        session_date: new Date().toISOString().split('T')[0],
        session_time: new Date().toTimeString().slice(0, 5),
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating physio session:', sessionError);
      return { success: false, error: sessionError.message };
    }

    // Actualizar el estado de la cita a completado
    await supabase
      .from('appointments')
      .update({
        workflow_status: 'completed',
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    revalidatePath(`/dashboard/appointments/${appointmentId}`);
    revalidatePath('/dashboard/physiotherapy');

    return {
      success: true,
      data: session,
      message: 'Sesión de fisioterapia creada exitosamente'
    };
  } catch (err) {
    console.error('Unexpected error in createPhysioSession:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    };
  }
}
