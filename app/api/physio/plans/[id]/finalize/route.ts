import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/physio/plans/[id]/finalize - Culminar plan de tratamiento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar datos requeridos
    if (typeof body.final_vas !== 'number') {
      return NextResponse.json({ error: 'Puntuación VAS final requerida' }, { status: 400 });
    }

    // Obtener datos del plan
    const { data: plan, error: planError } = await supabase
      .from('physio_treatment_plans')
      .select(`
        *,
        patients (id, first_name, last_name, dni),
        physio_medical_records (id, pain_scale_baseline)
      `)
      .eq('id', id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    // Calcular mejora
    const initialVas = plan.physio_medical_records?.pain_scale_baseline || plan.baseline_functional_score || 0;
    const finalVas = body.final_vas;
    const painImprovement = initialVas > 0 
      ? Math.round(((initialVas - finalVas) / initialVas) * 100)
      : 0;

    // Crear resumen de alta
    const dischargeSummary = {
      plan_id: id,
      evaluation_id: plan.evaluation_id,
      patient_id: plan.patient_id,
      sessions_completed: body.sessions_completed,
      sessions_attended: body.sessions_attended || body.sessions_completed,
      initial_vas: initialVas,
      final_vas: finalVas,
      pain_improvement_percent: painImprovement,
      objectives_achieved: body.objectives_achieved || [],
      objectives_not_achieved: body.objectives_not_achieved || [],
      final_recommendations: body.final_recommendations,
      follow_up_required: body.follow_up_required || false,
      follow_up_date: body.follow_up_date || null,
      patient_satisfaction: body.patient_satisfaction,
      discharge_notes: body.discharge_notes,
      discharged_by: user.id,
      discharged_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    // Insertar resumen de alta
    const { data: summary, error: summaryError } = await supabase
      .from('physio_discharge_summaries')
      .insert(dischargeSummary)
      .select()
      .single();

    if (summaryError) {
      return NextResponse.json({ error: summaryError.message }, { status: 500 });
    }

    // Actualizar estado del plan
    const { error: updateError } = await supabase
      .from('physio_treatment_plans')
      .update({
        status: 'completed',
        actual_end_date: new Date().toISOString().split('T')[0],
        sessions_completed: body.sessions_completed,
        final_assessment: body.final_assessment,
        progress_notes: body.progress_notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      data: summary,
      summary: {
        painImprovement,
        sessionsCompleted: body.sessions_completed,
      }
    }, { status: 201 });

  } catch (err) {
    console.error('Error finalizing plan:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al culminar plan' },
      { status: 500 }
    );
  }
}

// GET /api/physio/plans/[id]/finalize - Obtener resumen de alta existente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('physio_discharge_summaries')
    .select('*')
    .eq('plan_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ data: null });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
