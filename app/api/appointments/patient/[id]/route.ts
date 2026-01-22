import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSupabase = createAdminClient();
    const { id: patientId } = await params;

    const { data, error } = await adminSupabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error al obtener citas del paciente:', error);
      return NextResponse.json(
        { error: 'Error al obtener citas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ appointments: data || [] });
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
