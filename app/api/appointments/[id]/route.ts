import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSupabase = createAdminClient();
    const { id: appointmentId } = await params;

    const { data, error } = await adminSupabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error) {
      console.error('Error al obtener cita:', error);
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment: data });
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
