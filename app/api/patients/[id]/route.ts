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
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error) {
      console.error('Error al obtener paciente:', error);
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ patient: data });
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
