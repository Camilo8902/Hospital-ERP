import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET - Listar derivaciones
export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const departmentId = searchParams.get('department_id');
    const patientId = searchParams.get('patient_id');
    
    let query = adminSupabase
      .from('clinical_references')
      .select(`
        *,
        patients!inner(id, first_name, last_name, dni, medical_record_number),
        referring_department:departments!referring_department_id(id, name, code),
        target_department:departments!target_department_id(id, name, code),
        referring_profile:profiles!referring_doctor_id(id, full_name, specialty)
      `);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (departmentId) {
      query = query.eq('target_department_id', departmentId);
    }
    
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Transformar datos para respuesta
    const referrals = data?.map(ref => ({
      ...ref,
      patient_name: `${ref.patients.first_name} ${ref.patients.last_name}`,
      patient_dni: ref.patients.dni,
      medical_record_number: ref.patients.medical_record_number,
      referring_department_name: ref.referring_department?.name,
      target_department_name: ref.target_department?.name,
      referring_doctor_name: ref.referring_profile?.full_name,
    })) || [];
    
    return NextResponse.json(referrals);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json({ error: 'Error al obtener derivaciones' }, { status: 500 });
  }
}

// POST - Crear nueva derivación
export async function POST(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    
    const { 
      patient_id, 
      referring_doctor_id, 
      referring_department_id, 
      target_department_id,
      reference_type,
      clinical_diagnosis,
      icd10_codes,
      priority,
      notes 
    } = body;
    
    // Validaciones
    if (!patient_id || !target_department_id || !clinical_diagnosis) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: patient_id, target_department_id, clinical_diagnosis' },
        { status: 400 }
      );
    }
    
    const { data, error } = await adminSupabase
      .from('clinical_references')
      .insert({
        patient_id,
        referring_doctor_id: referring_doctor_id || null,
        referring_department_id: referring_department_id || null,
        target_department_id,
        reference_type: reference_type || 'evaluation',
        clinical_diagnosis,
        icd10_codes: icd10_codes || [],
        priority: priority || 'routine',
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating referral:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Revalidar páginas relacionadas
    adminSupabase.from('dashboard').select('*').eq('id', 'dummy').then();
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating referral:', error);
    return NextResponse.json({ error: 'Error al crear derivación' }, { status: 500 });
  }
}
