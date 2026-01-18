import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSupabase = createAdminClient();
    const { id: patientId } = await params;

    console.log(`[Clinical Records] Cargando historial clínico para paciente: ${patientId}`);

    // Obtener todos los registros médicos del paciente (historia clínica única por paciente)
    const { data: records, error } = await adminSupabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false });

    if (error) {
      console.error('[Clinical Records] Error al obtener historial clínico:', error);
      return NextResponse.json(
        { error: 'Error al obtener historial clínico' },
        { status: 500 }
      );
    }

    console.log(`[Clinical Records] Registros médicos encontrados: ${records?.length || 0}`);

    // Obtener doctor_ids únicos para enriquecer
    const doctorIds = Array.from(new Set(records?.map(r => r.doctor_id).filter(Boolean) || []));
    
    let doctorMap: Record<string, { full_name: string; specialty: string | null }> = {};

    if (doctorIds.length > 0) {
      const { data: doctors, error: doctorError } = await adminSupabase
        .from('profiles')
        .select('id, full_name, specialty')
        .in('id', doctorIds);
      
      if (doctorError) {
        console.error('[Clinical Records] Error al obtener doctores:', doctorError);
      } else if (doctors) {
        doctors.forEach(doctor => {
          doctorMap[doctor.id] = { full_name: doctor.full_name, specialty: doctor.specialty };
        });
      }
    }

    // Obtener IDs de registros médicos para buscar recetas
    const recordIds = records?.map(r => r.id) || [];
    let prescriptionsMap: Record<string, any[]> = {};

    if (recordIds.length > 0) {
      const { data: prescriptions, error: rxError } = await adminSupabase
        .from('prescriptions')
        .select('*')
        .in('medical_record_id', recordIds)
        .order('created_at', { ascending: false });

      if (rxError) {
        console.error('[Clinical Records] Error al obtener recetas:', rxError);
      } else if (prescriptions) {
        // Agrupar recetas por medical_record_id
        prescriptions.forEach(rx => {
          if (rx.medical_record_id) {
            if (!prescriptionsMap[rx.medical_record_id]) {
              prescriptionsMap[rx.medical_record_id] = [];
            }
            prescriptionsMap[rx.medical_record_id].push(rx);
          }
        });
        console.log(`[Clinical Records] Recetas encontradas: ${prescriptions.length}`);
      }
    }

    // Enriquecer registros con información del doctor y sus recetas
    const enrichedRecords = records?.map(record => ({
      ...record,
      profiles: record.doctor_id ? (doctorMap[record.doctor_id] || null) : null,
      prescriptions: prescriptionsMap[record.id] || [],
    })) || [];

    return NextResponse.json({ 
      records: enrichedRecords,
      totalRecords: enrichedRecords.length,
    });
  } catch (error) {
    console.error('[Clinical Records] Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
