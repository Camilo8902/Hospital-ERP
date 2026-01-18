import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSupabase = createAdminClient();
    const { id: appointmentId } = await params;

    console.log(`[Appointment Details] Cargando datos para cita: ${appointmentId}`);

    // 1. Obtener la cita
    const { data: appointment, error: aptError } = await adminSupabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (aptError || !appointment) {
      console.error('[Appointment Details] Cita no encontrada:', aptError);
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    console.log(`[Appointment Details] Cita: ${appointment.id}, Paciente: ${appointment.patient_id}`);

    // 2. Obtener el paciente
    const { data: patient, error: patError } = await adminSupabase
      .from('patients')
      .select('*')
      .eq('id', appointment.patient_id)
      .single();

    if (patError || !patient) {
      console.error('[Appointment Details] Paciente no encontrado:', patError);
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // 3. Obtener registros clínicos de esta cita
    const { data: medicalRecords, error: medError } = await adminSupabase
      .from('medical_records')
      .select('id')
      .eq('appointment_id', appointmentId);

    console.log(`[Appointment Details] Registros médicos encontrados: ${medicalRecords?.length || 0}`);

    let prescriptions: any[] = [];
    
    // 4. Buscar SOLO las recetas vinculadas a registros médicos de esta cita
    // NO usamos fallback por patient_id - solo queremos recetas de ESTA cita
    if (medicalRecords && medicalRecords.length > 0) {
      const recordIds = medicalRecords.map(r => r.id);
      
      const { data: rxByRecord, error: rxError } = await adminSupabase
        .from('prescriptions')
        .select('*')
        .in('medical_record_id', recordIds)
        .order('created_at', { ascending: false });
      
      if (rxError) {
        console.error('[Appointment Details] Error al buscar recetas:', rxError);
      } else if (rxByRecord && rxByRecord.length > 0) {
        prescriptions = rxByRecord;
        console.log(`[Appointment Details] Recetas encontradas para esta cita: ${prescriptions.length}`);
      } else {
        console.log(`[Appointment Details] No hay recetas para los medical_records de esta cita`);
      }
    } else {
      console.log(`[Appointment Details] No hay medical_records para esta cita`);
    }

    // 5. Enriquecer recetas con datos del doctor
    const doctorIds = Array.from(new Set(prescriptions.map(rx => rx.doctor_id).filter(Boolean)));
    let doctorMap: Record<string, { full_name: string; specialty: string | null }> = {};

    if (doctorIds.length > 0) {
      const { data: doctors } = await adminSupabase
        .from('profiles')
        .select('id, full_name, specialty')
        .in('id', doctorIds);
      
      if (doctors) {
        doctors.forEach(doctor => {
          doctorMap[doctor.id] = { full_name: doctor.full_name, specialty: doctor.specialty };
        });
      }
    }

    const enrichedPrescriptions = prescriptions.map(rx => ({
      ...rx,
      profiles: rx.doctor_id ? (doctorMap[rx.doctor_id] || null) : null,
    }));

    // 6. Obtener registro clínico principal (para mostrar)
    let clinicalRecord = null;
    if (medicalRecords && medicalRecords.length > 0) {
      const { data: fullRecord } = await adminSupabase
        .from('medical_records')
        .select('*')
        .eq('id', medicalRecords[0].id)
        .single();
      
      if (fullRecord) {
        // Enriquecer con datos del doctor
        if (fullRecord.doctor_id) {
          const { data: doctorData } = await adminSupabase
            .from('profiles')
            .select('full_name, specialty')
            .eq('id', fullRecord.doctor_id)
            .single();
          
          if (doctorData) {
            (fullRecord as any).profiles = doctorData;
          }
        }
        clinicalRecord = fullRecord;
      }
    }

    console.log(`[Appointment Details] Total recetas a mostrar: ${enrichedPrescriptions.length}`);

    return NextResponse.json({
      appointment,
      patient,
      clinicalRecord,
      prescriptions: enrichedPrescriptions,
      hasMedicalRecord: !!clinicalRecord,
      prescriptionsCount: enrichedPrescriptions.length,
    });

  } catch (error) {
    console.error('[Appointment Details] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
