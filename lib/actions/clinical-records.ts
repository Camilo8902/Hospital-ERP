'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './users';

// ============ TIPOS PARA HISTORIA CLÍNICA ============

export interface VitalSigns {
  blood_pressure_systolic?: number;      // Presión arterial sistólica (mmHg)
  blood_pressure_diastolic?: number;     // Presión arterial diastólica (mmHg)
  heart_rate?: number;                   // Frecuencia cardíaca (ppm)
  respiratory_rate?: number;             // Frecuencia respiratoria (rpm)
  temperature?: number;                  // Temperatura (°C)
  temperature_unit?: string;             // Unidad: 'C' o 'F'
  oxygen_saturation?: number;            // Saturación de oxígeno (%)
  weight?: number;                       // Peso (kg)
  height?: number;                       // Altura (cm)
  bmi?: number;                          // Índice de masa corporal
  pain_level?: number;                   // Nivel de dolor (0-10)
}

export interface Diagnosis {
  id?: string;
  code: string;                          // Código ICD-10 (ej: J06.9)
  description: string;                   // Descripción del diagnóstico
  type: 'primary' | 'secondary' | 'rule_out' | 'final';
  severity?: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface ClinicalRecord {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  doctor_id: string | null;
  visit_date: string;
  record_type: string;
  
  // Identificación del encuentro
  chief_complaint: string | null;        // Motivo de consulta
  chief_complaint_duration?: string;     // Duración del síntoma principal
  
  // Historia de la enfermedad actual
  history_of_present_illness: string | null;
  
  // Revisión por sistemas (simplificada)
  review_of_systems?: {
    constitutional?: string;
    cardiovascular?: string;
    respiratory?: string;
    gastrointestinal?: string;
    musculoskeletal?: string;
    neurological?: string;
    skin?: string;
  };
  
  // Exploración física
  physical_examination: string | null;
  
  // Signos vitales
  vital_signs: VitalSigns | null;
  
  // Evaluación y diagnóstico
  assessment_notes?: string;             // Notas de evaluación
  diagnosis: Diagnosis[] | null;         // Array de diagnósticos
  icd_codes: string[] | null;
  
  // Plan de tratamiento
  treatment_plan: string | null;
  prescriptions_referred?: boolean;      // Si se emitieron recetas
  procedures_performed?: string[];       // Procedimientos realizados
  lab_orders?: string[];                 // Órdenes de laboratorio
  imaging_orders?: string[];             // Órdenes de imagen
  
  // Instrucciones al paciente
  recommendations: string | null;
  return_instructions?: string;          // Cuándo regresar
  follow_up_required: boolean;
  follow_up_date: string | null;
  
  // Notas adicionales
  notes: string | null;
  private_notes: string | null;          // Solo visible para doctores
  
  // Referencias
  prescriptions?: string[];              // IDs de recetas relacionadas
  
  created_at: string;
  updated_at: string;
}

// Tipos enriquecidos con relaciones
export interface ClinicalRecordWithRelations extends ClinicalRecord {
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
  profiles?: {
    id: string;
    full_name: string;
    specialty: string | null;
  } | null;
  prescriptions_list?: PrescriptionSummary[];
}

export interface PrescriptionSummary {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  status: string;
}

// ============ CONSULTAS POR PACIENTE ============

export async function getPatientClinicalHistory(patientId: string): Promise<ClinicalRecordWithRelations[]> {
  const adminSupabase = createAdminClient();
  
  // Obtener todos los registros médicos del paciente
  const { data: records, error } = await adminSupabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('visit_date', { ascending: false });

  if (error) {
    console.error('Error al obtener historia clínica:', error);
    return [];
  }

  if (!records || records.length === 0) {
    return [];
  }

  // Obtener doctor_ids únicos
  const doctorIds = Array.from(new Set(records.map(r => r.doctor_id).filter(Boolean)));
  
  let doctorMap: Record<string, { full_name: string; specialty: string | null }> = {};

  if (doctorIds.length > 0) {
    const { data: doctors } = await adminSupabase
      .from('profiles')
      .select('id, full_name, specialty')
      .in('id', doctorIds);
    
    if (doctors) {
      doctors.forEach(doctor => {
        doctorMap[doctor.id] = { full_name: doctor.full_name, specialty: doctor.specialty };
      });
    }
  }

  // Enriquecer registros
  return records.map(record => ({
    ...record,
    patients: null,
    profiles: record.doctor_id ? (doctorMap[record.doctor_id] || null) : null,
    prescriptions_list: [],
  }));
}

export async function getClinicalRecordById(id: string): Promise<ClinicalRecordWithRelations | null> {
  const adminSupabase = createAdminClient();
  
  const { data: record, error } = await adminSupabase
    .from('medical_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !record) {
    return null;
  }

  // Obtener información del doctor
  let enrichedRecord = { ...record };

  if (record.doctor_id) {
    const { data: doctor } = await adminSupabase
      .from('profiles')
      .select('id, full_name, specialty')
      .eq('id', record.doctor_id)
      .single();
    
    if (doctor) {
      enrichedRecord.profiles = doctor;
    }
  }

  // Obtener recetas relacionadas si existen
  if (record.appointment_id) {
    const { data: prescriptions } = await adminSupabase
      .from('prescriptions')
      .select('id, medication_name, dosage, frequency, duration, status')
      .eq('medical_record_id', id)
      .order('created_at', { ascending: false });

    if (prescriptions && prescriptions.length > 0) {
      enrichedRecord.prescriptions_list = prescriptions;
    }
  }

  return enrichedRecord as ClinicalRecordWithRelations;
}

// ============ OBTENER/REGISTRAR CONSULTA ACTIVA ============

export async function getActiveConsultation(appointmentId: string): Promise<ClinicalRecordWithRelations | null> {
  const adminSupabase = createAdminClient();
  
  // Buscar si ya existe un registro médico para esta cita
  const { data: existingRecord } = await adminSupabase
    .from('medical_records')
    .select('*')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existingRecord) {
    return getClinicalRecordById(existingRecord.id);
  }

  return null;
}

// ============ CREAR/ACTUALIZAR REGISTRO CLÍNICO ============

export async function upsertClinicalRecord(data: {
  id?: string;
  patient_id: string;
  appointment_id?: string;
  doctor_id?: string;
  record_type?: string;
  chief_complaint?: string;
  chief_complaint_duration?: string;
  history_of_present_illness?: string;
  review_of_systems?: Record<string, string>;
  physical_examination?: string;
  vital_signs?: VitalSigns;
  assessment_notes?: string;
  diagnosis?: Diagnosis[];
  icd_codes?: string[];
  treatment_plan?: string;
  procedures_performed?: string[];
  lab_orders?: string[];
  imaging_orders?: string[];
  recommendations?: string;
  return_instructions?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  notes?: string;
  private_notes?: string;
}): Promise<{ success: boolean; recordId?: string; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    const user = await getCurrentUser();
    
    const now = new Date().toISOString();
    
    const recordData = {
      patient_id: data.patient_id,
      appointment_id: data.appointment_id || null,
      doctor_id: data.doctor_id || user?.id || null,
      visit_date: now,
      record_type: data.record_type || 'consultation',
      
      // Datos clínicos
      chief_complaint: data.chief_complaint || null,
      chief_complaint_duration: data.chief_complaint_duration || null,
      history_of_present_illness: data.history_of_present_illness || null,
      review_of_systems: data.review_of_systems || null,
      physical_examination: data.physical_examination || null,
      vital_signs: data.vital_signs || null,
      
      // Diagnóstico
      assessment_notes: data.assessment_notes || null,
      diagnosis: data.diagnosis || null,
      icd_codes: data.icd_codes || null,
      
      // Tratamiento
      treatment_plan: data.treatment_plan || null,
      procedures_performed: data.procedures_performed || null,
      lab_orders: data.lab_orders || null,
      imaging_orders: data.imaging_orders || null,
      
      // Instrucciones
      recommendations: data.recommendations || null,
      return_instructions: data.return_instructions || null,
      follow_up_required: data.follow_up_required || false,
      follow_up_date: data.follow_up_date || null,
      
      // Notas
      notes: data.notes || null,
      private_notes: data.private_notes || null,
      
      updated_at: now,
    };

    if (data.id) {
      // Actualizar registro existente
      const { error } = await adminSupabase
        .from('medical_records')
        .update(recordData)
        .eq('id', data.id);

      if (error) {
        return { success: false, error: error.message };
      }

      revalidatePath(`/dashboard/patients/${data.patient_id}`);
      revalidatePath(`/dashboard/consultation/${data.appointment_id}`);
      return { success: true, recordId: data.id };
    } else {
      // Crear nuevo registro
      const { data: newRecord, error } = await adminSupabase
        .from('medical_records')
        .insert(recordData)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      revalidatePath(`/dashboard/patients/${data.patient_id}`);
      revalidatePath(`/dashboard/consultation/${data.appointment_id}`);
      return { success: true, recordId: newRecord.id };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al guardar registro clínico' };
  }
}

// ============ COMPLETAR CONSULTA ============

export async function finalizeConsultation(
  appointmentId: string,
  clinicalRecordId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    // Verificar que el registro tenga datos mínimos requeridos
    const { data: record } = await adminSupabase
      .from('medical_records')
      .select('*, patient_id')
      .eq('id', clinicalRecordId)
      .single();

    if (!record) {
      return { success: false, error: 'Registro clínico no encontrado' };
    }

    // Actualizar el registro para marcar que está completo
    const { error } = await adminSupabase
      .from('medical_records')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', clinicalRecordId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Actualizar estado de la cita a 'completed'
    const { error: aptError } = await adminSupabase
      .from('appointments')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    if (aptError) {
      return { success: false, error: aptError.message };
    }

    revalidatePath('/dashboard/appointments');
    revalidatePath(`/dashboard/consultation/${appointmentId}`);
    revalidatePath(`/dashboard/patients/${record.patient_id}`);

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al completar consulta' };
  }
}

// ============ BÚSQUEDA DE CÓDIGOS ICD-10 ============

export interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

const icd10Database: ICD10Code[] = [
  // Categoría A - Ciertas enfermedades infecciosas y parasitarias
  { code: 'A00.0', description: 'Cólera debida a Vibrio cholerae 01, biovar cholerae', category: 'A' },
  { code: 'A00.1', description: 'Cólera debida a Vibrio cholerae 01, biovar eltor', category: 'A' },
  { code: 'A01.0', description: 'Fiebre tifoidea', category: 'A' },
  { code: 'A02.0', description: 'Salmonelosis intestinal', category: 'A' },
  { code: 'A03.0', description: 'Shigelosis por Shigella dysenteriae', category: 'A' },
  { code: 'A04.5', description: 'Enteritis por Campylobacter', category: 'A' },
  { code: 'A08.0', description: 'Enteritis viral', category: 'A' },
  { code: 'A09', description: 'Otras gastroenteritis y colitis', category: 'A' },
  
  // Categoría B - Ciertas enfermedades virales
  { code: 'B00.0', description: 'Eczema herpético', category: 'B' },
  { code: 'B01.0', description: 'Varicela meningitis', category: 'B' },
  { code: 'B02.0', description: 'Encefalitis herpes zoster', category: 'B' },
  { code: 'B20.0', description: 'Enfermedad por VIH resulting in infectious', category: 'B' },
  
  // Categoría C - Tumores [neoplasias]
  { code: 'C00.0', description: 'Tumor maligno del labio inferior', category: 'C' },
  { code: 'C50.9', description: 'Tumor maligno de mama, no especificado', category: 'C' },
  { code: 'C61.9', description: 'Tumor maligno de prostata, no especificado', category: 'C' },
  
  // Categoría D - Enfermedades de la sangre y ciertos trastornos inmunitarios
  { code: 'D50.9', description: 'Anemia por deficiencia de hierro, no especificada', category: 'D' },
  { code: 'D64.9', description: 'Anemia, no especificada', category: 'D' },
  
  // Categoría E - Enfermedades endocrinas, nutricionales y metabólicas
  { code: 'E10.9', description: 'Diabetes mellitus tipo 1 sin complicaciones', category: 'E' },
  { code: 'E11.9', description: 'Diabetes mellitus tipo 2 sin complicaciones', category: 'E' },
  { code: 'E66.0', description: 'Obesidad debida a exceso de calorías', category: 'E' },
  { code: 'E78.0', description: 'Hipercolesterolemia pura', category: 'E' },
  { code: 'E78.5', description: 'Hipertrigliceridemia', category: 'E' },
  
  // Categoría F - Trastornos mentales y conductuales
  { code: 'F32.0', description: 'Episodio depresivo leve', category: 'F' },
  { code: 'F32.1', description: 'Episodio depresivo moderado', category: 'F' },
  { code: 'F33.0', description: 'Trastorno depresivo recurrente, episodio actual leve', category: 'F' },
  { code: 'F41.0', description: 'Trastorno de pánico', category: 'F' },
  { code: 'F41.1', description: 'Trastorno de ansiedad generalizada', category: 'F' },
  
  // Categoría G - Enfermedades del sistema nervioso
  { code: 'G40.9', description: 'Epilepsia, no especificada', category: 'G' },
  { code: 'G43.9', description: 'Migraña, no especificada', category: 'G' },
  { code: 'G44.1', description: 'Cefalea vascular', category: 'G' },
  { code: 'G45.9', description: 'Enfermedad cerebrovascular, no especificada', category: 'G' },
  
  // Categoría H - Enfermedades del ojo y sus anexos
  { code: 'H10.9', description: 'Conjuntivitis, no especificada', category: 'H' },
  { code: 'H25.9', description: 'Catarata senil, no especificada', category: 'H' },
  
  // Categoría I - Enfermedades del sistema circulatorio
  { code: 'I10', description: 'Hipertensión esencial', category: 'I' },
  { code: 'I11.9', description: 'Enfermedad cardíaca hipertensiva sin insuficiencia cardíaca', category: 'I' },
  { code: 'I20.0', description: 'Angina de pecho inestable', category: 'I' },
  { code: 'I21.3', description: 'Infarto agudo de miocardio', category: 'I' },
  { code: 'I48.0', description: 'Fibrilación auricular paroxística', category: 'I' },
  { code: 'I50.9', description: 'Insuficiencia cardíaca, no especificada', category: 'I' },
  
  // Categoría J - Enfermedades del sistema respiratorio
  { code: 'J00', description: 'Rinitis aguda', category: 'J' },
  { code: 'J01.9', description: 'Sinusitis aguda, no especificada', category: 'J' },
  { code: 'J02.0', description: 'Faringitis estreptocócica', category: 'J' },
  { code: 'J03.9', description: 'Amigdalitis aguda, no especificada', category: 'J' },
  { code: 'J04.1', description: 'Laringitis aguda', category: 'J' },
  { code: 'J06.9', description: 'Infección respiratoria aguda, no especificada', category: 'J' },
  { code: 'J10.0', description: 'Gripe con neumonía', category: 'J' },
  { code: 'J11.0', description: 'Gripe con neumonía', category: 'J' },
  { code: 'J18.9', description: 'Neumonía, no especificada', category: 'J' },
  { code: 'J20.9', description: 'Bronquitis aguda, no especificada', category: 'J' },
  { code: 'J40', description: 'Bronquitis, no especificada como aguda o crónica', category: 'J' },
  { code: 'J44.9', description: 'Enfermedad pulmonar obstructiva crónica, no especificada', category: 'J' },
  { code: 'J45.9', description: 'Asma, no especificada', category: 'J' },
  
  // Categoría K - Enfermedades del sistema digestivo
  { code: 'K08.1', description: 'Pérdida de dientes', category: 'K' },
  { code: 'K21.0', description: 'Enfermedad por reflujo gastroesofágico con esofagitis', category: 'K' },
  { code: 'K29.7', description: 'Gastritis, no especificada', category: 'K' },
  { code: 'K30', description: 'Dispepsia', category: 'K' },
  { code: 'K35.2', description: 'Apendicitis aguda con peritonitis generalizada', category: 'K' },
  { code: 'K50.0', description: 'Enfermedad de Crohn del intestino delgado', category: 'K' },
  { code: 'K51.9', description: 'Colitis ulcerosa, no especificada', category: 'K' },
  { code: 'K57.2', description: 'Enfermedad diverticular del colon con perforación', category: 'K' },
  { code: 'K80.2', description: 'Cálculos biliares con otras colecistitis', category: 'K' },
  { code: 'K81.9', description: 'Colecistitis, no especificada', category: 'K' },
  { code: 'K85.9', description: 'Pancreatitis aguda, no especificada', category: 'K' },
  
  // Categoría L - Enfermedades de la piel y el tejido subcutáneo
  { code: 'L20.9', description: 'Dermatitis atópica, no especificada', category: 'L' },
  { code: 'L23.9', description: 'Dermatitis alérgica de contacto, no especificada', category: 'L' },
  { code: 'L30.9', description: 'Dermatitis, no especificada', category: 'L' },
  { code: 'L70.9', description: 'Acné, no especificado', category: 'L' },
  
  // Categoría M - Enfermedades del sistema musculoesquelético
  { code: 'M16.9', description: 'Artrosis de cadera, no especificada', category: 'M' },
  { code: 'M17.9', description: 'Artrosis de rodilla, no especificada', category: 'M' },
  { code: 'M25.5', description: 'Dolor articular', category: 'M' },
  { code: 'M54.5', description: 'Lumbago', category: 'M' },
  { code: 'M79.1', description: 'Mialgia', category: 'M' },
  { code: 'M79.6', description: 'Dolor en extremidad', category: 'M' },
  
  // Categoría N - Enfermedades del sistema genitourinario
  { code: 'N10', description: 'Nefritis tubulointersticial aguda', category: 'N' },
  { code: 'N30.0', description: 'Cistitis aguda', category: 'N' },
  { code: 'N34.1', description: 'Uretritis no especificada', category: 'N' },
  { code: 'N39.0', description: 'Infección de vías urinarias, no especificada', category: 'N' },
  { code: 'N40', description: 'Hiperplasia de prostata', category: 'N' },
  { code: 'N63', description: 'Masa mamaria no especificada', category: 'N' },
  { code: 'N89.9', description: 'Trastorno vaginal no especificado', category: 'N' },
  
  // Categoría O - Embarazo, parto y puerperio
  { code: 'O09.0', description: 'Supervisión de embarazo molar', category: 'O' },
  { code: 'O09.1', description: 'Supervisión de embarazo ectópico', category: 'O' },
  
  // Categoría Q - Malformaciones congénitas
  { code: 'Q90.9', description: 'Síndrome de Down, no especificado', category: 'Q' },
  
  // Categoría R - Síntomas, signos y hallazgos anormales
  { code: 'R05', description: 'Tos', category: 'R' },
  { code: 'R06.0', description: 'Disnea', category: 'R' },
  { code: 'R10.9', description: 'Dolor abdominal, no especificado', category: 'R' },
  { code: 'R11.0', description: 'Náuseas', category: 'R' },
  { code: 'R11.1', description: 'Vómito', category: 'R' },
  { code: 'R21', description: 'Erupción cutánea', category: 'R' },
  { code: 'R50.9', description: 'Fiebre, no especificada', category: 'R' },
  { code: 'R51', description: 'Cefalea', category: 'R' },
  { code: 'R53', description: 'Malestar y fatiga', category: 'R' },
  
  // Categoría S - Lesiones, traumatismos
  { code: 'S01.0', description: 'Herida del cuero cabelludo', category: 'S' },
  { code: 'S61.9', description: 'Herida de dedo(s) de la mano', category: 'S' },
  
  // Categoría Z - Factores que influyen en la salud
  { code: 'Z00.0', description: 'Examen general médico', category: 'Z' },
  { code: 'Z00.1', description: 'Examen de recepción y empleo', category: 'Z' },
  { code: 'Z00.6', description: 'Examen para comparación con población normal', category: 'Z' },
  { code: 'Z30.2', description: 'Estérilización (mujer)', category: 'Z' },
  { code: 'Z71.3', description: 'Asesoramiento dietético', category: 'Z' },
  { code: 'Z71.8', description: 'Otro asesoramiento médico especificado', category: 'Z' },
  { code: 'Z99.1', description: 'Dependencia de respirador', category: 'Z' },
];

export async function searchICD10Codes(query: string): Promise<ICD10Code[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const queryLower = query.toLowerCase();
  
  // Filtrar códigos que coincidan con la búsqueda
  const results = icd10Database.filter(item => 
    item.code.toLowerCase().includes(queryLower) ||
    item.description.toLowerCase().includes(queryLower)
  );

  return results.slice(0, 20); // Limitar a 20 resultados
}

// ============ ESTADÍSTICAS DE HISTORIA CLÍNICA ============

export async function getClinicalRecordsStats(patientId: string) {
  const history = await getPatientClinicalHistory(patientId);
  
  return {
    totalRecords: history.length,
    lastVisit: history.length > 0 ? history[0].visit_date : null,
    diagnosesCount: history.reduce((count, record) => {
      return count + (record.diagnosis?.length || 0);
    }, 0),
  };
}
