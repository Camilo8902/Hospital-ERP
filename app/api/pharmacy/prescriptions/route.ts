import { NextRequest, NextResponse } from 'next/server';
import { createPrescription } from '@/lib/actions/pharmacy';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointment_id, patient_id, items, notes } = body;

    // Validar datos requeridos
    if (!patient_id) {
      return NextResponse.json(
        { error: 'El ID del paciente es requerido' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un medicamento' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    let medicalRecordId = body.medical_record_id;

    // Determinar el medical_record_id de forma robusta
    if (!medicalRecordId && appointment_id) {
      // 1. Buscar si existe un medical_record para esta cita
      const { data: existingRecords } = await adminSupabase
        .from('medical_records')
        .select('id')
        .eq('appointment_id', appointment_id)
        .limit(1);

      if (existingRecords && existingRecords.length > 0) {
        // Ya existe un registro médico para esta cita
        medicalRecordId = existingRecords[0].id;
        console.log(`[Create Prescription] Usando medical_record existente: ${medicalRecordId}`);
      } else {
        // 2. Crear un nuevo medical_record para esta cita
        const { data: appointment, error: aptError } = await adminSupabase
          .from('appointments')
          .select('patient_id, doctor_id')
          .eq('id', appointment_id)
          .single();

        if (aptError || !appointment) {
          return NextResponse.json(
            { error: 'Cita no encontrada o error al consultarla' },
            { status: 404 }
          );
        }

        if (!appointment.patient_id) {
          return NextResponse.json(
            { error: 'La cita no tiene un paciente asociado' },
            { status: 400 }
          );
        }

        // Crear medical_record con returning para obtener el ID directamente
        const { data: newRecord, error: recordError } = await adminSupabase
          .from('medical_records')
          .insert({
            patient_id: appointment.patient_id,
            appointment_id: appointment_id,
            doctor_id: appointment.doctor_id || null,
            visit_date: new Date().toISOString(),
            record_type: 'consultation',
            prescriptions: JSON.stringify(items.map((item: { medication_name: string }) => item.medication_name)),
          })
          .select('id')
          .single();

        if (recordError) {
          console.error('[Create Prescription] Error al crear registro médico:', recordError);
          return NextResponse.json(
            { error: 'Error al crear registro médico: ' + recordError.message },
            { status: 500 }
          );
        }

        if (newRecord) {
          medicalRecordId = newRecord.id;
          console.log(`[Create Prescription] Nuevo medical_record creado: ${medicalRecordId}`);
        }
      }
    }

    // Si aún no tenemos medicalRecordId, crear uno básico sin cita asociada
    if (!medicalRecordId) {
      console.log('[Create Prescription] Creando registro médico básico sin cita');
      
      const { data: newRecord, error: basicRecordError } = await adminSupabase
        .from('medical_records')
        .insert({
          patient_id: patient_id,
          doctor_id: body.doctor_id || null,
          visit_date: new Date().toISOString(),
          record_type: 'consultation',
          prescriptions: JSON.stringify(items.map((item: { medication_name: string }) => item.medication_name)),
        })
        .select('id')
        .single();

      if (basicRecordError || !newRecord) {
        return NextResponse.json(
          { error: 'Error al crear registro médico básico' },
          { status: 500 }
        );
      }

      medicalRecordId = newRecord.id;
      console.log(`[Create Prescription] medical_record básico creado: ${medicalRecordId}`);
    }

    // Verificación final antes de crear recetas
    if (!medicalRecordId) {
      console.error('[Create Prescription] No se pudo establecer medicalRecordId');
      return NextResponse.json(
        { error: 'No se pudo crear ni obtener el registro médico' },
        { status: 500 }
      );
    }

    // Crear las recetas vinculadas al medical_record
    const createdPrescriptions = [];

    for (const item of items) {
      const result = await createPrescription({
        medical_record_id: medicalRecordId,
        patient_id: patient_id,
        doctor_id: body.doctor_id || null,
        medication_id: item.medication_id || null,
        medication_name: item.medication_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        quantity_prescribed: item.quantity_prescribed,
        refills_allowed: item.refills_allowed || 0,
        instructions: item.instructions,
      });

      if (result.success && result.prescriptionId) {
        createdPrescriptions.push(result.prescriptionId);
      } else {
        console.error('Error al crear receta para:', item.medication_name, result.error);
      }
    }

    if (createdPrescriptions.length === 0) {
      return NextResponse.json(
        { error: 'No se pudo crear ninguna receta' },
        { status: 500 }
      );
    }

    console.log(`[Create Prescription] ${createdPrescriptions.length} receta(s) creadas vinculadas al medical_record: ${medicalRecordId}`);

    return NextResponse.json({
      success: true,
      prescriptions: createdPrescriptions,
      medical_record_id: medicalRecordId,
      message: `Se crearon ${createdPrescriptions.length} receta(s)`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear receta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
