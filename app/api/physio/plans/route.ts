import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/physio/plans - Listar planes de tratamiento
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const patientId = searchParams.get('patient_id');
  const status = searchParams.get('status');
  const therapistId = searchParams.get('therapist_id');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('physio_treatment_plans')
    .select(`
      *,
      patients (id, first_name, last_name, dni),
      therapists (id, full_name, specialty)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (patientId) query = query.eq('patient_id', patientId);
  if (status) query = query.eq('status', status);
  if (therapistId) query = query.eq('therapist_id', therapistId);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    data: data || [], 
    total: count || 0,
    limit,
    offset 
  });
}

// POST /api/physio/plans - Crear plan de tratamiento
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    
    const planData = {
      patient_id: body.patient_id,
      evaluation_id: body.evaluation_id,
      prescribing_doctor_id: body.prescribing_doctor_id || user.id,
      department_id: body.department_id,
      diagnosis_code: body.diagnosis_code,
      diagnosis_description: body.diagnosis_description,
      plan_type: body.plan_type || 'rehabilitation',
      clinical_objective: body.clinical_objective,
      start_date: body.start_date || new Date().toISOString().split('T')[0],
      expected_end_date: body.expected_end_date,
      sessions_per_week: body.sessions_per_week,
      total_sessions_prescribed: body.total_sessions_prescribed,
      initial_assessment: body.initial_assessment,
      baseline_rom: body.baseline_rom,
      baseline_functional_score: body.baseline_functional_score,
      status: 'indicated',
      notes: body.notes,
    };

    const { data, error } = await supabase
      .from('physio_treatment_plans')
      .insert(planData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error('Error creating plan:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al crear plan' },
      { status: 500 }
    );
  }
}
