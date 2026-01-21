'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ExtendedClinicalRecord, PhysioChapter, PhysioRecordFormData } from '@/lib/types';

// ============================================
// ACCIONES PARA REGISTROS CLÍNICOS CON FISIOTERAPIA
// ============================================

/**
 * Obtiene todos los registros clínicos de un paciente, incluyendo capítulos de fisioterapia
 */
export async function getPatientClinicalRecords(patientId: string): Promise<{
  success: boolean;
  records?: ExtendedClinicalRecord[];
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    // Obtener registros clínicos
    const { data: records, error: recordsError } = await supabase
      .from('clinical_records')
      .select(`
        *,
        profiles (
          full_name,
          specialty
        )
      `)
      .eq('patient_id', patientId)
      .order('visit_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (recordsError) {
      throw new Error(`Error al obtener registros clínicos: ${recordsError.message}`);
    }

    // Obtener capítulos de fisioterapia para registros de tipo 'physiotherapy'
    const physioRecordIds = records
      .filter(r => r.record_type === 'physiotherapy')
      .map(r => r.id);

    let physioChapters: Record<string, PhysioChapter> = {};

    if (physioRecordIds.length > 0) {
      const { data: chapters, error: chaptersError } = await supabase
        .from('physio_chapters')
        .select('*')
        .in('clinical_record_id', physioRecordIds);

      if (chaptersError) {
        console.error('Error al obtener capítulos de fisioterapia:', chaptersError);
      } else if (chapters) {
        physioChapters = chapters.reduce((acc, chapter) => {
          acc[chapter.clinical_record_id] = chapter as PhysioChapter;
          return acc;
        }, {} as Record<string, PhysioChapter>);
      }
    }

    // Combinar registros con sus capítulos de fisioterapia
    const extendedRecords: ExtendedClinicalRecord[] = records.map(record => ({
      ...record,
      physio_chapter: physioChapters[record.id] || null
    }));

    return { success: true, records: extendedRecords };
  } catch (error) {
    console.error('Error en getPatientClinicalRecords:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtiene un registro clínico específico con su capítulo de fisioterapia
 */
export async function getClinicalRecordById(recordId: string): Promise<{
  success: boolean;
  record?: ExtendedClinicalRecord;
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    const { data: record, error: recordError } = await supabase
      .from('clinical_records')
      .select(`
        *,
        profiles (
          full_name,
          specialty
        )
      `)
      .eq('id', recordId)
      .single();

    if (recordError) {
      throw new Error(`Error al obtener registro clínico: ${recordError.message}`);
    }

    let physioChapter: PhysioChapter | null = null;

    if (record.record_type === 'physiotherapy') {
      const { data: chapter, error: chapterError } = await supabase
        .from('physio_chapters')
        .select('*')
        .eq('clinical_record_id', recordId)
        .single();

      if (chapterError && chapterError.code !== 'PGRST116') {
        console.error('Error al obtener capítulo de fisioterapia:', chapterError);
      } else if (chapter) {
        physioChapter = chapter as PhysioChapter;
      }
    }

    return {
      success: true,
      record: {
        ...record,
        physio_chapter: physioChapter
      } as ExtendedClinicalRecord
    };
  } catch (error) {
    console.error('Error en getClinicalRecordById:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Crea un nuevo registro clínico de fisioterapia (integrado)
 * Maneja tanto el registro clínico como el capítulo de fisioterapia en una transacción
 */
export async function createPhysioClinicalRecord(data: PhysioRecordFormData): Promise<{
  success: boolean;
  recordId?: string;
  chapterId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar que el usuario tiene permisos
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Error al verificar permisos del usuario');
    }

    const allowedRoles = ['admin', 'doctor', 'physiotherapist'];
    if (!allowedRoles.includes(profile.role)) {
      throw new Error('No tiene permisos para crear registros de fisioterapia');
    }

    // Iniciar transacción para crear registro clínico y capítulo de fisioterapia
    const { data: clinicalRecord, error: clinicalError } = await supabase
      .from('clinical_records')
      .insert({
        patient_id: data.patient_id,
        appointment_id: data.appointment_id || null,
        visit_date: data.visit_date,
        record_type: 'physiotherapy',
        chief_complaint: data.chief_complaint,
        diagnosis: data.diagnosis,
        treatment_plan: data.treatment_plan,
        doctor_id: user.id,
        follow_up_required: data.treatment_continued ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (clinicalError) {
      throw new Error(`Error al crear registro clínico: ${clinicalError.message}`);
    }

    // Crear el capítulo de fisioterapia
    const { data: physioChapter, error: chapterError } = await supabase
      .from('physio_chapters')
      .insert({
        clinical_record_id: clinicalRecord.id,
        patient_id: data.patient_id,
        therapist_id: user.id,
        appointment_id: data.appointment_id || null,
        
        // Datos SOAP
        subjective: data.subjective,
        objective: data.objective,
        analysis: data.analysis,
        plan: data.plan,
        
        // Métricas
        pain_level: data.pain_level,
        pain_location: data.pain_location,
        pain_type: data.pain_type,
        
        // ROM
        rom_affected: data.rom_affected,
        rom_measure: data.rom_measure,
        
        // Fortaleza
        muscle_strength_grade: data.muscle_strength_grade,
        muscle_group: data.muscle_group,
        
        // Técnicas
        techniques_applied: data.techniques_applied || [],
        modality: data.modality,
        
        // Funcional
        functional_score: data.functional_score,
        functional_limitations: data.functional_limitations,
        functional_goals: data.functional_goals,
        
        // Sesión
        session_duration_minutes: data.session_duration_minutes,
        session_number: data.session_number,
        total_sessions_planned: data.total_sessions_planned,
        
        // Flags
        is_initial_session: data.is_initial_session ?? false,
        is_reassessment: data.is_reassessment ?? false,
        treatment_continued: data.treatment_continued ?? true,
        
        // Consentimiento
        informed_consent: data.informed_consent ?? false,
        consent_document_url: data.consent_document_url || null,
        
        // Notas
        notes: data.notes,
        private_notes: data.private_notes,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (chapterError) {
      // Si falla el capítulo, eliminar el registro clínico creado
      await supabase.from('clinical_records').delete().eq('id', clinicalRecord.id);
      throw new Error(`Error al crear capítulo de fisioterapia: ${chapterError.message}`);
    }

    // Revalidar páginas relevantes
    revalidatePath(`/dashboard/patients/${data.patient_id}/history`);
    revalidatePath(`/dashboard/patients/${data.patient_id}`);

    return {
      success: true,
      recordId: clinicalRecord.id,
      chapterId: physioChapter.id
    };
  } catch (error) {
    console.error('Error en createPhysioClinicalRecord:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Actualiza un registro clínico de fisioterapia existente
 */
export async function updatePhysioClinicalRecord(
  recordId: string, 
  recordData: Partial<PhysioRecordFormData>
): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar permisos
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Error al verificar permisos');
    }

    const allowedRoles = ['admin', 'doctor', 'physiotherapist'];
    if (!allowedRoles.includes(profile.role)) {
      throw new Error('No tiene permisos para actualizar registros');
    }

    // Obtener registro actual para verificar tipo
    const { data: currentRecord, error: fetchError } = await supabase
      .from('clinical_records')
      .select('record_type')
      .eq('id', recordId)
      .single();

    if (fetchError) {
      throw new Error('Registro no encontrado');
    }

    if (currentRecord.record_type !== 'physiotherapy') {
      throw new Error('El registro no es de tipo fisioterapia');
    }

    // Actualizar registro clínico
    const { error: updateRecordError } = await supabase
      .from('clinical_records')
      .update({
        chief_complaint: recordData.chief_complaint,
        diagnosis: recordData.diagnosis,
        treatment_plan: recordData.treatment_plan,
        follow_up_required: recordData.treatment_continued ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId);

    if (updateRecordError) {
      throw new Error(`Error al actualizar registro clínico: ${updateRecordError.message}`);
    }

    // Actualizar capítulo de fisioterapia
    const { error: updateChapterError } = await supabase
      .from('physio_chapters')
      .update({
        subjective: recordData.subjective,
        objective: recordData.objective,
        analysis: recordData.analysis,
        plan: recordData.plan,
        pain_level: recordData.pain_level,
        pain_location: recordData.pain_location,
        pain_type: recordData.pain_type,
        rom_affected: recordData.rom_affected,
        rom_measure: recordData.rom_measure,
        muscle_strength_grade: recordData.muscle_strength_grade,
        muscle_group: recordData.muscle_group,
        techniques_applied: recordData.techniques_applied,
        modality: recordData.modality,
        functional_score: recordData.functional_score,
        functional_limitations: recordData.functional_limitations,
        functional_goals: recordData.functional_goals,
        session_duration_minutes: recordData.session_duration_minutes,
        session_number: recordData.session_number,
        total_sessions_planned: recordData.total_sessions_planned,
        is_initial_session: recordData.is_initial_session,
        is_reassessment: recordData.is_reassessment,
        treatment_continued: recordData.treatment_continued,
        informed_consent: recordData.informed_consent,
        notes: recordData.notes,
        private_notes: recordData.private_notes,
        updated_at: new Date().toISOString()
      })
      .eq('clinical_record_id', recordId);

    if (updateChapterError) {
      throw new Error(`Error al actualizar capítulo de fisioterapia: ${updateChapterError.message}`);
    }

    // Revalidar páginas
    const { data: record } = await supabase
      .from('clinical_records')
      .select('patient_id')
      .eq('id', recordId)
      .single();

    if (record) {
      revalidatePath(`/dashboard/patients/${record.patient_id}/history`);
      revalidatePath(`/dashboard/patients/${record.patient_id}/history/${recordId}`);
    }
    revalidatePath(`/dashboard/patients/${record?.patient_id}/history/${recordId}/edit`);

    return { success: true };
  } catch (error) {
    console.error('Error en updatePhysioClinicalRecord:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Elimina un registro clínico de fisioterapia
 */
export async function deletePhysioClinicalRecord(recordId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar permisos
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw new Error('Error al verificar permisos');
    }

    if (profile.role !== 'admin' && profile.role !== 'physiotherapist') {
      throw new Error('No tiene permisos para eliminar registros');
    }

    // Obtener patient_id antes de eliminar
    const { data: record } = await supabase
      .from('clinical_records')
      .select('patient_id')
      .eq('id', recordId)
      .single();

    if (!record) {
      throw new Error('Registro no encontrado');
    }

    // La eliminación en cascada de physio_chapters会自动删除
    const { error: deleteError } = await supabase
      .from('clinical_records')
      .delete()
      .eq('id', recordId);

    if (deleteError) {
      throw new Error(`Error al eliminar registro: ${deleteError.message}`);
    }

    revalidatePath(`/dashboard/patients/${record.patient_id}/history`);
    
    return { success: true };
  } catch (error) {
    console.error('Error en deletePhysioClinicalRecord:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtiene estadísticas de fisioterapia de un paciente
 */
export async function getPhysioPatientStats(patientId: string): Promise<{
  success: boolean;
  stats?: {
    totalRecords: number;
    initialSessions: number;
    reassessments: number;
    averagePainLevel: number;
    painTrend: number; // Porcentaje de cambio
    averageFunctionalScore: number;
    functionalTrend: number;
    techniquesMostUsed: string[];
    lastSessionDate: string | null;
  };
  error?: string;
}> {
  const supabase = await createClient();
  
  try {
    // Obtener todos los registros de fisioterapia
    const { data: records, error: recordsError } = await supabase
      .from('clinical_records')
      .select(`
        id,
        created_at,
        physio_chapters (
          pain_level,
          functional_score,
          techniques_applied,
          is_initial_session,
          is_reassessment,
          created_at
        )
      `)
      .eq('patient_id', patientId)
      .eq('record_type', 'physiotherapy')
      .order('created_at', { ascending: false });

    if (recordsError) {
      throw new Error(`Error al obtener registros: ${recordsError.message}`);
    }

    if (!records || records.length === 0) {
      return { 
        success: true, 
        stats: {
          totalRecords: 0,
          initialSessions: 0,
          reassessments: 0,
          averagePainLevel: 0,
          painTrend: 0,
          averageFunctionalScore: 0,
          functionalTrend: 0,
          techniquesMostUsed: [],
          lastSessionDate: null
        }
      };
    }

    // Calcular estadísticas
    const chapters = records.flatMap(r => r.physio_chapters || []);
    
    const painLevels = chapters.map(c => c.pain_level).filter(v => v !== null) as number[];
    const functionalScores = chapters.map(c => c.functional_score).filter(v => v !== null) as number[];
    
    const allTechniques = chapters.flatMap(c => c.techniques_applied || []);
    const techniquesCount = allTechniques.reduce((acc, tech) => {
      acc[tech] = (acc[tech] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const techniquesMostUsed = (Object.entries(techniquesCount) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tech]) => tech);

    // Calcular tendencias (comparando primera mitad vs segunda mitad)
    const midpoint = Math.ceil(chapters.length / 2);
    const firstHalf = chapters.slice(midpoint);
    const secondHalf = chapters.slice(0, midpoint);

    const firstHalfPainAvg = firstHalf.reduce((sum, c) => sum + (c.pain_level || 0), 0) / (firstHalf.length || 1);
    const secondHalfPainAvg = secondHalf.reduce((sum, c) => sum + (c.pain_level || 0), 0) / (secondHalf.length || 1);
    const painTrend = firstHalfPainAvg > 0 
      ? ((firstHalfPainAvg - secondHalfPainAvg) / firstHalfPainAvg) * 100 
      : 0;

    const firstHalfFuncAvg = firstHalf.reduce((sum, c) => sum + (c.functional_score || 0), 0) / (firstHalf.length || 1);
    const secondHalfFuncAvg = secondHalf.reduce((sum, c) => sum + (c.functional_score || 0), 0) / (secondHalf.length || 1);
    const functionalTrend = firstHalfFuncAvg > 0 
      ? ((secondHalfFuncAvg - firstHalfFuncAvg) / firstHalfFuncAvg) * 100 
      : 0;

    const stats = {
      totalRecords: records.length,
      initialSessions: chapters.filter(c => c.is_initial_session).length,
      reassessments: chapters.filter(c => c.is_reassessment).length,
      averagePainLevel: painLevels.length > 0 
        ? painLevels.reduce((a, b) => a + b, 0) / painLevels.length 
        : 0,
      painTrend: parseFloat(painTrend.toFixed(1)),
      averageFunctionalScore: functionalScores.length > 0 
        ? functionalScores.reduce((a, b) => a + b, 0) / functionalScores.length 
        : 0,
      functionalTrend: parseFloat(functionalTrend.toFixed(1)),
      techniquesMostUsed,
      lastSessionDate: records[0]?.created_at || null
    };

    return { success: true, stats };
  } catch (error) {
    console.error('Error en getPhysioPatientStats:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}
