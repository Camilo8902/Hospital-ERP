import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const {
      id,
      patient_id,
      appointment_id,
      doctor_id,
      record_type,
      chief_complaint,
      history_of_present_illness,
      physical_examination,
      vital_signs,
      diagnosis,
      icd_codes,
      treatment_plan,
      recommendations,
      notes,
      private_notes,
      follow_up_required,
      follow_up_date,
      complete,
    } = body;

    const now = new Date().toISOString();

    // Solo incluir campos que existen en la tabla medical_records
    const recordData = {
      patient_id,
      appointment_id: appointment_id || null,
      doctor_id: doctor_id || null,
      visit_date: now,
      record_type: record_type || 'consultation',
      chief_complaint: chief_complaint || null,
      history_of_present_illness: history_of_present_illness || null,
      physical_examination: physical_examination || null,
      vital_signs: vital_signs || null,
      diagnosis: diagnosis || null,
      icd_codes: icd_codes || null,
      treatment_plan: treatment_plan || null,
      recommendations: recommendations || null,
      notes: notes || null,
      private_notes: private_notes || null,
      follow_up_required: follow_up_required || false,
      follow_up_date: follow_up_date || null,
      updated_at: now,
    };

    let record;

    if (id) {
      // Actualizar registro existente
      const { data, error } = await adminSupabase
        .from('medical_records')
        .update(recordData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar registro:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      record = data;
    } else {
      // Crear nuevo registro
      const { data, error } = await adminSupabase
        .from('medical_records')
        .insert(recordData)
        .select()
        .single();

      if (error) {
        console.error('Error al crear registro:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      record = data;
    }

    // Si se completa la consulta, actualizar el estado de la cita
    if (complete && appointment_id) {
      const { error: aptError } = await adminSupabase
        .from('appointments')
        .update({
          status: 'completed',
          updated_at: now,
        })
        .eq('id', appointment_id);

      if (aptError) {
        console.error('Error al actualizar cita:', aptError);
      }

      revalidatePath('/dashboard/appointments');

      // Crear cita de seguimiento si está programada
      if (follow_up_required && follow_up_date) {
        const followUpDate = new Date(follow_up_date);
        // Asumir duración de 30 minutos para seguimiento
        const followUpStart = followUpDate.toISOString();
        const followUpEnd = new Date(followUpDate.getTime() + 30 * 60000).toISOString();

        const { error: followUpError } = await adminSupabase
          .from('appointments')
          .insert({
            patient_id,
            doctor_id: doctor_id || null,
            appointment_type: 'follow_up',
            status: 'scheduled', // Estado PROGRAMADA, no completada
            start_time: followUpStart,
            end_time: followUpEnd,
            reason: `Seguimiento programado desde consulta del ${new Date().toLocaleDateString()}`,
            notes: 'Cita de seguimiento programada automáticamente',
            created_at: now,
            updated_at: now,
          });

        if (followUpError) {
          console.error('Error al crear cita de seguimiento:', followUpError);
        } else {
          console.log('Cita de seguimiento programada exitosamente');
        }
      }
    }

    revalidatePath(`/dashboard/patients/${patient_id}`);
    revalidatePath(`/dashboard/consultation/${appointment_id}`);
    revalidatePath(`/dashboard/patients/${patient_id}/history`);

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Error al guardar registro clínico:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar registro clínico' },
      { status: 500 }
    );
  }
}
