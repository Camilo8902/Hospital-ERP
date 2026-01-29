import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/physio/plans/[id] - Obtener plan por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('physio_treatment_plans')
    .select(`
      *,
      patients (id, first_name, last_name, dni, phone),
      therapists (id, full_name, specialty, email),
      physio_sessions (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/physio/plans/[id] - Actualizar plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient();
  const { id } = await params;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const updateData = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    // No permitir cambiar ciertos campos directamente
    delete updateData.id;
    delete updateData.patient_id;
    delete updateData.therapist_id;
    delete updateData.created_at;

    const { data, error } = await supabase
      .from('physio_treatment_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al actualizar' },
      { status: 500 }
    );
  }
}

// DELETE /api/physio/plans/[id] - Eliminar plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient();
  const { id } = await params;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo permitir eliminar planes sin sesiones
    const { count } = await supabase
      .from('physio_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('medical_record_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un plan con sesiones asociadas' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('physio_treatment_plans')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al eliminar' },
      { status: 500 }
    );
  }
}
