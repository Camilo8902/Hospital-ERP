import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminSupabase = createAdminClient();
    const appointmentId = params.id;

    // Buscar si ya existe un registro médico para esta cita
    const { data: existingRecord, error } = await adminSupabase
      .from('medical_records')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error al buscar registro clínico:', error);
      return NextResponse.json(
        { error: 'Error al buscar registro clínico' },
        { status: 500 }
      );
    }

    if (!existingRecord) {
      return NextResponse.json({ record: null });
    }

    // Enriquecer con información del doctor
    let enrichedRecord = { ...existingRecord };

    if (existingRecord.doctor_id) {
      const { data: doctor } = await adminSupabase
        .from('profiles')
        .select('id, full_name, specialty')
        .eq('id', existingRecord.doctor_id)
        .single();
      
      if (doctor) {
        enrichedRecord.profiles = doctor;
      }
    }

    return NextResponse.json({ record: enrichedRecord });
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
