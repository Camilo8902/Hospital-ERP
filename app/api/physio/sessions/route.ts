import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/physio/sessions - Crear sesión de fisioterapia
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      treatment_plan_id,
      patient_id,
      session_number,
      session_date,
      session_time,
      duration_minutes,
      subjective,
      objective,
      analysis,
      plan,
      techniques_applied,
      pain_level,
      notes,
      body_region,
      muscle_group,
      muscle_strength_grade,
      rom_affected,
      modality,
      functional_score,
      is_reassessment,
    } = body;

    // 1. Crear la sesión
    const { data: session, error: sessionError } = await supabase
      .from('physio_sessions')
      .insert({
        treatment_plan_id,
        patient_id,
        therapist_id: user.id,
        session_number,
        session_date: session_date || new Date().toISOString().split('T')[0],
        session_time: session_time || new Date().toTimeString().split(' ')[0].substring(0, 5),
        duration_minutes: duration_minutes || 45,
        is_initial_session: session_number === 1,
        is_reassessment: is_reassessment || false,
        subjective,
        objective,
        analysis,
        plan,
        techniques_applied: techniques_applied || [],
        pain_level,
        notes,
        body_region,
        muscle_group,
        muscle_strength_grade,
        rom_affected,
        modality,
        functional_score,
        status: 'completed',
      })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // 2. Si hay un plan de tratamiento, actualizar su estado
    if (treatment_plan_id) {
      // Obtener el plan actual
      const { data: planData } = await supabase
        .from('physio_treatment_plans')
        .select('sessions_completed, total_sessions_prescribed, status')
        .eq('id', treatment_plan_id)
        .single();

      if (planData) {
        const newSessionsCompleted = (planData?.sessions_completed || 0) + 1;
        
        // Determinar nuevo estado:
        // - Si estaba 'indicated', cambiar a 'in_progress'
        // - Si ya estaba 'in_progress', mantenerlo
        let newStatus = planData?.status;
        if (planData?.status === 'indicated') {
          newStatus = 'in_progress';
        }

        // Verificar si todas las sesiones fueron completadas
        const isCompleted = newSessionsCompleted >= (planData?.total_sessions_prescribed || 0);

        await supabase
          .from('physio_treatment_plans')
          .update({
            sessions_completed: newSessionsCompleted,
            status: isCompleted ? 'completed' : newStatus,
            actual_end_date: isCompleted ? new Date().toISOString().split('T')[0] : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', treatment_plan_id);
      }
    }

    return NextResponse.json({ session }, { status: 201 });

  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear la sesión' },
      { status: 500 }
    );
  }
}

// GET /api/physio/sessions - Listar sesiones de fisioterapia
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('plan_id');
    const patientId = searchParams.get('patient_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('physio_sessions')
      .select(`
        *,
        patients (id, first_name, last_name, dni),
        therapists (id, full_name, specialty)
      `)
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (planId) {
      query = query.eq('treatment_plan_id', planId);
    }

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ sessions: data || [] });

  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener sesiones' },
      { status: 500 }
    );
  }
}
