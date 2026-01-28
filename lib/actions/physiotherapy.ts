'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { 
  PhysioMedicalRecord, 
  PhysioSession, 
  PhysioSessionForm,
  PhysioDashboardStats,
  PhysioSessionListItem,
  PhysioSessionsFilter 
} from '@/lib/types/physiotherapy';

// ============================================
// OPERACIONES CON HISTORIA CLÍNICA
// ============================================

export interface CreatePhysioRecordInput {
  patient_id: string;
  therapist_id?: string;
  department_id?: string;
  chief_complaint?: string;
  pain_location?: string;
  pain_scale_baseline?: number;
  pain_duration?: string;
  pain_type?: string;
  pain_characteristics?: string;
  surgical_history?: string;
  traumatic_history?: string;
  medical_history?: string;
  family_history?: string;
  allergies?: string[];
  contraindications?: string[];
  precautions?: string;
  physical_examination?: string;
  postural_evaluation?: string;
  rom_measurements?: Record<string, unknown>;
  strength_grade?: Record<string, unknown>;
  neurological_screening?: string;
  special_tests?: string;
  vas_score?: number;
  oswestry_score?: number;
  dash_score?: number;
  womac_score?: number;
  roland_morris_score?: number;
  clinical_diagnosis?: string;
  icd10_codes?: string[];
  functional_limitations?: string;
  short_term_goals?: string[];
  long_term_goals?: string[];
  patient_expectations?: string;
  informed_consent_signed: boolean;
}

export async function createPhysioRecord(input: CreatePhysioRecordInput): Promise<{ success: boolean; data?: PhysioMedicalRecord; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_medical_records')
      .insert({
        patient_id: input.patient_id,
        therapist_id: input.therapist_id,
        department_id: input.department_id,
        chief_complaint: input.chief_complaint,
        pain_location: input.pain_location,
        pain_scale_baseline: input.pain_scale_baseline,
        pain_duration: input.pain_duration,
        pain_type: input.pain_type,
        pain_characteristics: input.pain_characteristics,
        surgical_history: input.surgical_history,
        traumatic_history: input.traumatic_history,
        medical_history: input.medical_history,
        family_history: input.family_history,
        allergies: input.allergies,
        contraindications: input.contraindications,
        precautions: input.precautions,
        physical_examination: input.physical_examination,
        postural_evaluation: input.postural_evaluation,
        rom_measurements: input.rom_measurements,
        strength_grade: input.strength_grade,
        neurological_screening: input.neurological_screening,
        special_tests: input.special_tests,
        vas_score: input.vas_score,
        oswestry_score: input.oswestry_score,
        dash_score: input.dash_score,
        womac_score: input.womac_score,
        roland_morris_score: input.roland_morris_score,
        clinical_diagnosis: input.clinical_diagnosis,
        icd10_codes: input.icd10_codes,
        functional_limitations: input.functional_limitations,
        short_term_goals: input.short_term_goals,
        long_term_goals: input.long_term_goals,
        patient_expectations: input.patient_expectations,
        informed_consent_signed: input.informed_consent_signed,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear registro de fisioterapia:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/physiotherapy');
    return { success: true, data: data as PhysioMedicalRecord };
  } catch (error) {
    console.error('Error inesperado al crear registro:', error);
    return { success: false, error: 'Error inesperado al crear el registro' };
  }
}

export async function getPhysioRecord(recordId: string): Promise<{ success: boolean; data?: PhysioMedicalRecord; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_medical_records')
      .select('*, patients(first_name, last_name, phone, medical_record_number)')
      .eq('id', recordId)
      .single();

    if (error) {
      console.error('Error al obtener registro:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PhysioMedicalRecord };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function getPatientPhysioRecord(patientId: string): Promise<{ success: boolean; data?: PhysioMedicalRecord; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error al obtener registro del paciente:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PhysioMedicalRecord | undefined };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function getActivePhysioRecords(
  therapistId?: string
): Promise<{ success: boolean; data?: PhysioMedicalRecord[]; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    let query = adminSupabase
      .from('physio_medical_records')
      .select('*, patients(first_name, last_name, phone, medical_record_number)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (therapistId) {
      query = query.eq('therapist_id', therapistId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener registros activos:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PhysioMedicalRecord[] };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function updatePhysioRecord(
  recordId: string,
  updates: Partial<CreatePhysioRecordInput>
): Promise<{ success: boolean; data?: PhysioMedicalRecord; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_medical_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar registro:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/physiotherapy');
    revalidatePath(`/dashboard/physiotherapy/records/${recordId}`);
    return { success: true, data: data as PhysioMedicalRecord };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// OPERACIONES CON SESIONES
// ============================================

export async function createPhysioSession(input: PhysioSessionForm): Promise<{ success: boolean; data?: PhysioSession; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_sessions')
      .insert({
        medical_record_id: input.medical_record_id,
        appointment_id: input.appointment_id,
        patient_id: input.patient_id,
        therapist_id: input.therapist_id,
        subjective: input.subjective,
        objective: input.objective,
        analysis: input.analysis,
        plan: input.plan,
        pain_level: input.pain_level,
        body_region: input.body_region,
        techniques_applied: input.techniques_applied,
        notes: input.notes,
        session_number: input.session_number,
        session_date: input.session_date || new Date().toISOString().split('T')[0],
        session_time: input.session_time,
        duration_minutes: input.duration_minutes || 45,
        is_initial_session: input.is_initial_session,
        is_reassessment: input.is_reassessment,
        functional_score: input.functional_score,
        pain_location: input.pain_location,
        rom_affected: input.rom_affected,
        muscle_strength_grade: input.muscle_strength_grade,
        muscle_group: input.muscle_group,
        modality: input.modality,
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear sesión:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/physiotherapy');
    if (input.medical_record_id) {
      revalidatePath(`/dashboard/physiotherapy/records/${input.medical_record_id}`);
    }
    return { success: true, data: data as PhysioSession };
  } catch (error) {
    console.error('Error inesperado al crear sesión:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function getPhysioSessions(
  recordId: string
): Promise<{ success: boolean; data?: PhysioSession[]; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_sessions')
      .select('*')
      .eq('medical_record_id', recordId)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error al obtener sesiones:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PhysioSession[] };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function getPhysioSession(
  sessionId: string
): Promise<{ success: boolean; data?: PhysioSession; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error al obtener sesión:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PhysioSession };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function updatePhysioSession(
  sessionId: string,
  updates: Partial<PhysioSession>
): Promise<{ success: boolean; data?: PhysioSession; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar sesión:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/physiotherapy');
    return { success: true, data: data as PhysioSession };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// BÚSQUEDAS Y ESTADÍSTICAS
// ============================================

export async function searchPhysioPatients(
  query: string
): Promise<{ success: boolean; data?: PhysioMedicalRecord[]; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    // patients tiene first_name y last_name, no full_name
    const { data: patients } = await adminSupabase
      .from('patients')
      .select('id')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,medical_record_number.ilike.%${query}%`)
      .limit(10);

    if (!patients || patients.length === 0) {
      return { success: true, data: [] };
    }

    const patientIds = patients.map(p => p.id);

    const { data, error } = await adminSupabase
      .from('physio_medical_records')
      .select('*, patients(first_name, last_name, phone, medical_record_number)')
      .in('patient_id', patientIds)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al buscar pacientes:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PhysioMedicalRecord[] };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// UTILIDADES DE DEPARTAMENTO
// ============================================

export async function getPhysiotherapyDepartmentId(): Promise<string | null> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('departments')
      .select('id')
      .eq('code', 'FT')
      .single();

    if (error) {
      console.error('Error al obtener departamento de fisioterapia:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error inesperado al buscar departamento:', error);
    return null;
  }
}

export async function getPhysioAppointmentById(
  appointmentId: string
): Promise<{ 
  success: boolean; 
  data?: {
    id: string;
    patient_id: string;
    patient_full_name: string;
    patient_dni: string;
    start_time: string;
    department_name: string;
    reason: string;
    department_id: string;
  }; 
  error?: string 
}> {
  try {
    const adminSupabase = createAdminClient();
    const physioDeptId = await getPhysiotherapyDepartmentId();
    
    const { data, error } = await adminSupabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        start_time,
        department_id,
        reason,
        patients!inner(first_name, last_name, medical_record_number)
      `)
      .eq('id', appointmentId)
      .single();

    if (error) {
      console.error('Error al obtener cita:', error);
      return { success: false, error: error.message };
    }

    // Verificar que la cita pertenece al departamento de fisioterapia
    if (physioDeptId && data.department_id !== physioDeptId) {
      return { 
        success: false, 
        error: 'La cita no pertenece al departamento de fisioterapia' 
      };
    }

    // patients tiene first_name y last_name, no full_name
    const patientData = data.patients as any;
    const patientFullName = `${patientData?.first_name || ''} ${patientData?.last_name || ''}`.trim();

    return {
      success: true,
      data: {
        id: data.id,
        patient_id: data.patient_id,
        patient_full_name: patientFullName || 'Unknown',
        patient_dni: patientData?.medical_record_number || 'N/A',
        start_time: data.start_time,
        department_name: data.department_id || 'Fisioterapia',
        reason: data.reason || '',
        department_id: data.department_id || '',
      },
    };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// Obtener citas de fisioterapia filtradas por departamento
export async function getPhysioAppointments(
  options: {
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  } = {}
): Promise<{ 
  success: boolean; 
  data?: any[]; 
  error?: string 
}> {
  try {
    const adminSupabase = createAdminClient();
    const physioDeptId = await getPhysiotherapyDepartmentId();
    
    if (!physioDeptId) {
      return { success: false, error: 'Departamento de fisioterapia no encontrado' };
    }

    let query = adminSupabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        start_time,
        end_time,
        status,
        reason,
        notes,
        doctor_id,
        patients!inner(first_name, last_name, medical_record_number)
      `)
      .eq('department_id', physioDeptId)
      .order('start_time', { ascending: false });

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options.startDate) {
      query = query.gte('start_time', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('start_time', options.endDate);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener citas de fisioterapia:', error);
      return { success: false, error: error.message };
    }

    // Transformar datos para incluir información del paciente
    const appointmentsWithPatient = (data || []).map(apt => {
      const patientData = apt.patients as any;
      return {
        id: apt.id,
        patient_id: apt.patient_id,
        patient_full_name: `${patientData?.first_name || ''} ${patientData?.last_name || ''}`.trim(),
        patient_dni: patientData?.medical_record_number || 'N/A',
        start_time: apt.start_time,
        end_time: apt.end_time,
        status: apt.status,
        reason: apt.reason,
        notes: apt.notes,
        doctor_id: apt.doctor_id,
      };
    });

    return { success: true, data: appointmentsWithPatient };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// ESTADÍSTICAS DEL DASHBOARD
// ============================================

export async function getPhysioDashboardStats(
  therapistId?: string
): Promise<{ 
  success: boolean; 
  data?: PhysioDashboardStats; 
  error?: string 
}> {
  try {
    const adminSupabase = createAdminClient();
    
    // Intentar usar la función RPC si existe
    const { data: rpcData, error: rpcError } = await adminSupabase
      .rpc('get_physio_dashboard_stats', {
        p_therapist_id: therapistId || null
      });

    if (!rpcError && rpcData) {
      return { success: true, data: rpcData as PhysioDashboardStats };
    }

    // Fallback a consultas directas
    console.warn('Función RPC no disponible, usando consultas directas');
    
    const today = new Date().toISOString().split('T')[0];
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const startOfWeek = new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Pacientes activos
    let activeQuery = adminSupabase
      .from('physio_medical_records')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    if (therapistId) {
      activeQuery = activeQuery.eq('therapist_id', therapistId);
    }

    const { count: activePatients } = await activeQuery;

    // Sesiones este mes
    let monthQuery = adminSupabase
      .from('physio_sessions')
      .select('id', { count: 'exact' })
      .gte('session_date', startOfMonth);

    if (therapistId) {
      monthQuery = monthQuery.eq('therapist_id', therapistId);
    }

    const { count: sessionsThisMonth } = await monthQuery;

    // Sesiones esta semana
    let weekQuery = adminSupabase
      .from('physio_sessions')
      .select('id', { count: 'exact' })
      .gte('session_date', startOfWeek);

    if (therapistId) {
      weekQuery = weekQuery.eq('therapist_id', therapistId);
    }

    const { count: sessionsThisWeek } = await weekQuery;

    // Sesiones completadas hoy
    let todayQuery = adminSupabase
      .from('physio_sessions')
      .select('id', { count: 'exact' })
      .eq('session_date', today);

    if (therapistId) {
      todayQuery = todayQuery.eq('therapist_id', therapistId);
    }

    const { count: completedSessionsToday } = await todayQuery;

    // Promedio de nivel de dolor
    const { data: sessions } = await adminSupabase
      .from('physio_sessions')
      .select('pain_level')
      .not('pain_level', 'is', null);

    let averagePainLevel = 0;
    if (sessions && sessions.length > 0) {
      const total = sessions.reduce((sum, s) => sum + ((s.pain_level as number) || 0), 0);
      averagePainLevel = Math.round((total / sessions.length) * 10) / 10;
    }

    return {
      success: true,
      data: {
        active_patients: activePatients || 0,
        sessions_this_month: sessionsThisMonth || 0,
        sessions_this_week: sessionsThisWeek || 0,
        average_pain_reduction: averagePainLevel,
        pending_appointments: 0,
        completed_sessions_today: completedSessionsToday || 0,
      },
    };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// LISTA DE SESIONES CON FILTROS
// ============================================

export async function getPhysioSessionsList(
  filters: PhysioSessionsFilter
): Promise<{ 
  success: boolean; 
  data?: PhysioSessionListItem[]; 
  count?: number;
  error?: string 
}> {
  try {
    const adminSupabase = createAdminClient();
    
    // physio_sessions se une directamente a patients a través de patient_id
    let query = adminSupabase
      .from('physio_sessions')
      .select(`
        *,
        patients!inner (id, first_name, last_name, medical_record_number, phone)
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.therapistId) {
      query = query.eq('therapist_id', filters.therapistId);
    }

    if (filters.startDate) {
      query = query.gte('session_date', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('session_date', filters.endDate);
    }

    // Ordenar y paginar
    query = query
      .order('session_date', { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

    const { data, error, count: totalCount } = await query;

    if (error) {
      console.error('Error al listar sesiones:', error);
      return { success: false, error: error.message };
    }

    // Transformar datos al formato esperado
    const sessionList: PhysioSessionListItem[] = (data || []).map(session => ({
      id: session.id,
      session_date: session.session_date,
      session_time: session.session_time,
      duration_minutes: session.duration_minutes,
      pain_level: session.pain_level,
      patient_name: `${session.patients?.first_name || ''} ${session.patients?.last_name || ''}`.trim(),
      patient_dni: session.patients?.medical_record_number,
      techniques_applied: session.techniques_applied,
      therapist_id: session.therapist_id,
      medical_record_id: session.medical_record_id,
      patient_id: session.patient_id,
      created_at: session.created_at,
      status: (session.status as string) || 'completed',
    }));

    return { 
      success: true, 
      data: sessionList,
      count: totalCount || 0
    };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// REGISTROS RECIENTES PARA DASHBOARD
// ============================================

export async function getRecentPhysioRecords(
  limit: number = 5
): Promise<{ 
  success: boolean; 
  data?: PhysioMedicalRecord[]; 
  error?: string 
}> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_medical_records')
      .select('*, patients(first_name, last_name, phone, medical_record_number)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error al obtener registros recientes:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PhysioMedicalRecord[] };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// SESIONES DE HOY PARA DASHBOARD
// ============================================

export async function getTodayPhysioSessions(
  therapistId?: string
): Promise<{ 
  success: boolean; 
  data?: PhysioSession[]; 
  error?: string 
}> {
  try {
    const adminSupabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    let query = adminSupabase
      .from('physio_sessions')
      .select('*, patients(id, first_name, last_name, medical_record_number, phone)')
      .eq('session_date', today)
      .order('session_time', { ascending: true });

    if (therapistId) {
      query = query.eq('therapist_id', therapistId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener sesiones de hoy:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PhysioSession[] };
  } catch (error) {
    console.error('Error inesperado:', error);
    return { success: false, error: 'Error inesperado' };
  }
}
