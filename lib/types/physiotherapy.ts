// ============================================
// MÓDULO DE FISIOTERAPIA - TIPOS TYPESCRIPT
// ============================================

// Tipo principal: Historia Clínica de Fisioterapia
export interface PhysioMedicalRecord {
  id: string;
  patient_id: string;
  therapist_id?: string;
  department_id?: string;
  status: 'active' | 'completed' | 'suspended' | 'cancelled';
  
  // Evaluación inicial
  chief_complaint?: string;
  pain_location?: string;
  pain_scale_baseline?: number;
  pain_duration?: string;
  pain_type?: string;
  pain_characteristics?: string;
  
  // Antecedentes
  surgical_history?: string;
  traumatic_history?: string;
  medical_history?: string;
  family_history?: string;
  
  // Alergias y contraindicaciones
  allergies?: string[];
  contraindications?: string[];
  precautions?: string;
  
  // Exploración física
  physical_examination?: string;
  postural_evaluation?: string;
  rom_measurements?: ROMMeasurements;
  strength_grade?: StrengthGrade;
  neurological_screening?: string;
  special_tests?: string;
  
  // Escalas funcionales
  vas_score?: number;
  oswestry_score?: number;
  dash_score?: number;
  womac_score?: number;
  roland_morris_score?: number;
  
  // Diagnóstico
  clinical_diagnosis?: string;
  icd10_codes?: string[];
  functional_limitations?: string;
  
  // Objetivos terapéuticos
  short_term_goals?: string[];
  long_term_goals?: string[];
  patient_expectations?: string;
  
  // Documentación
  informed_consent_signed: boolean;
  
  // Metadatos
  created_at?: string;
  updated_at?: string;
  
  // Campos relacionados para display (patients tiene first_name y last_name)
  patients?: PatientSummary;
  profiles?: TherapistSummary;
}

// Resumen de paciente (patients tiene first_name y last_name, medical_record_number)
export interface PatientSummary {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  medical_record_number?: string;
  email?: string;
  dob?: string;
  age?: number;
  gender?: string;
  address?: string;
}

// Resumen de terapeuta (profiles tiene full_name)
export interface TherapistSummary {
  id: string;
  full_name: string;
  email: string;
  specialty?: string;
  license_number?: string;
  phone?: string;
}

// Tipo: Rangos de Movimiento (ROM)
export interface ROMMeasurements {
  cervical_flexion?: number;
  cervical_extension?: number;
  cervical_lateral_flexion_left?: number;
  cervical_lateral_flexion_right?: number;
  cervical_rotation_left?: number;
  cervical_rotation_right?: number;
  
  shoulder_flexion_left?: number;
  shoulder_flexion_right?: number;
  shoulder_abduction_left?: number;
  shoulder_abduction_right?: number;
  shoulder_external_rotation_left?: number;
  shoulder_external_rotation_right?: number;
  shoulder_internal_rotation_left?: number;
  shoulder_internal_rotation_right?: number;
  
  elbow_flexion_left?: number;
  elbow_flexion_right?: number;
  elbow_extension_left?: number;
  elbow_extension_right?: number;
  
  wrist_flexion_left?: number;
  wrist_flexion_right?: number;
  wrist_extension_left?: number;
  wrist_extension_right?: number;
  
  lumbar_flexion?: number;
  lumbar_extension?: number;
  lumbar_lateral_flexion_left?: number;
  lumbar_lateral_flexion_right?: number;
  
  hip_flexion_left?: number;
  hip_flexion_right?: number;
  hip_abduction_left?: number;
  hip_abduction_right?: number;
  hip_external_rotation_left?: number;
  hip_external_rotation_right?: number;
  
  knee_flexion_left?: number;
  knee_flexion_right?: number;
  knee_extension_left?: number;
  knee_extension_right?: number;
  
  ankle_dorsiflexion_left?: number;
  ankle_dorsiflexion_right?: number;
  ankle_plantarflexion_left?: number;
  ankle_plantarflexion_right?: number;
}

// Tipo: Grados de Fuerza Muscular
export interface StrengthGrade {
  cervical?: { left?: number; right?: number };
  shoulder_abductors?: { left?: number; right?: number };
  shoulder_external_rotators?: { left?: number; right?: number };
  elbow_flexors?: { left?: number; right?: number };
  elbow_extensors?: { left?: number; right?: number };
  wrist_flexors?: { left?: number; right?: number };
  wrist_extensors?: { left?: number; right?: number };
  hip_flexors?: { left?: number; right?: number };
  hip_abductors?: { left?: number; right?: number };
  hip_extensors?: { left?: number; right?: number };
  knee_flexors?: { left?: number; right?: number };
  knee_extensors?: { left?: number; right?: number };
  ankle_plantarflexors?: { left?: number; right?: number };
  ankle_dorsiflexors?: { left?: number; right?: number };
}

// Tipo: Sesión de Tratamiento
export interface PhysioSession {
  id: string;
  medical_record_id?: string;  // Referencia a medical_records
  appointment_id?: string;
  patient_id: string;  // Referencia directa a patients
  therapist_id: string;
  
  // Fecha y duración
  session_date: string;  // tipo date
  session_time?: string;  // tipo time
  duration_minutes: number;
  
  // Notas SOAP
  subjective?: string;
  objective?: string;
  analysis?: string;
  plan?: string;
  
  // Métricas
  pain_level?: number;
  body_region?: string;
  
  // Técnicas aplicadas
  techniques_applied?: string[];
  
  // Campos adicionales del esquema
  notes?: string;
  session_number?: number;
  is_initial_session?: boolean;
  is_reassessment?: boolean;
  functional_score?: number;
  pain_location?: string;
  rom_affected?: string;
  muscle_strength_grade?: number;
  muscle_group?: string;
  modality?: string;
  treatment_plan_id?: string;
  
  // Metadatos
  created_at?: string;
  updated_at?: string;
  
  // Campos relacionados
  physio_medical_records?: PhysioMedicalRecord;
  patients?: PatientSummary;  // Unión directa a patients
}

// ============================================
// TIPOS PARA DASHBOARD Y LISTAS
// ============================================

// Estadísticas del Dashboard de Fisioterapia
export interface PhysioDashboardStats {
  active_patients: number;
  sessions_this_month: number;
  sessions_this_week: number;
  average_pain_reduction: number;
  pending_appointments?: number;
  completed_sessions_today?: number;
}

// Item de lista de sesiones
export interface PhysioSessionListItem {
  id: string;
  session_date: string;
  session_time?: string;
  duration_minutes: number;
  pain_level?: number;
  patient_name: string;  // Generado como CONCAT(first_name, ' ', last_name)
  patient_dni?: string;  // medical_record_number de patients
  techniques_applied?: string[];
  therapist_id: string;
  medical_record_id?: string;
  patient_id: string;
  created_at?: string;
}

// Datos de cita de fisioterapia
export interface PhysioAppointmentData {
  id: string;
  patient_id: string;
  patient_full_name: string;
  patient_dni: string;
  start_time: string;
  department_name: string;
  reason: string;
  department_id: string;
}

// Item de lista de citas de fisioterapia
export interface PhysioAppointmentListItem {
  id: string;
  patient_id: string;
  patient_full_name: string;
  patient_dni: string;
  start_time: string;
  end_time: string;
  status: string;
  reason?: string;
  notes?: string;
  doctor_id?: string;
}

// Filtros para listing de sesiones
export interface PhysioSessionsFilter {
  therapistId?: string;
  startDate?: string;
  endDate?: string;
  patientName?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// TIPOS PARA FORMULARIOS
// ============================================

// Formulario de evaluación inicial
export interface PhysioEvaluationForm {
  patient_id: string;
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
  rom_measurements?: ROMMeasurements;
  strength_grade?: StrengthGrade;
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

// Formulario de sesión
export interface PhysioSessionForm {
  medical_record_id?: string;
  appointment_id?: string;
  therapist_id: string;
  patient_id: string;
  
  // Formato SOAP
  subjective?: string;
  objective?: string;
  analysis?: string;
  plan?: string;
  
  // Métricas
  pain_level?: number;
  body_region?: string;
  
  // Técnicas
  techniques_applied?: string[];
  
  // Notas
  notes?: string;
  
  // Campos adicionales
  session_number?: number;
  session_date?: string;
  session_time?: string;
  duration_minutes?: number;
  is_initial_session?: boolean;
  is_reassessment?: boolean;
  functional_score?: number;
  pain_location?: string;
  rom_affected?: string;
  muscle_strength_grade?: number;
  muscle_group?: string;
  modality?: string;
}

// ============================================
// CONSTANTES
// ============================================

export const PHYSIOTHERAPY_TECHNIQUES = [
  'Movilización articular',
  'Movilización neural',
  'Estiramiento muscular',
  'Fortalecimiento muscular',
  'Entrenamiento funcional',
  'Terapia manual',
  'Drenaje linfático',
  'Masaje terapéutico',
  'Punción seca',
  'Electrólisis percutánea',
  'Vendaje neuromuscular',
  'Vendaje funcional',
  'Tracción cervical',
  'Tracción lumbar',
  'Ultrasonido terapéutico',
  'Laserterapia',
  'Magnetoterapia',
  'Electroterapia TENS',
  'Electroterapia EMS',
  'Crioterapia',
  'Termoterapia',
  'Hidroterapia',
  'Ejercicios de respiración',
  'Reeducación postural',
] as const;

export const PHYSIOTHERAPY_EQUIPMENT = [
  'MBST (Resonancia Magnética Terapéutica)',
  'Láser de alta potencia',
  'Ultrasonido terapéutico',
  'Electroestimulador TENS',
  'Electroestimulador EMS',
  'Máquina de vacío',
  'Banda de tracción cervical',
  'Banda de tracción lumbar',
  'Bicicleta estática',
  'Tapiz rodante',
  'Pesa rusa',
  'Bandas elásticas',
  'Balones suizos',
  'Foam roller',
  'Plataformas de equilibrio',
] as const;

export const BODY_REGIONS = [
  'Cervical',
  'Hombro',
  'Codo',
  'Muñeca/Mano',
  'Columna Dorsal',
  'Columna Lumbar',
  'Cadera',
  'Rodilla',
  'Tobillo/Pie',
] as const;

export const FUNCTIONAL_SCALES = {
  VAS: 'Escala Visual Analógica del Dolor (0-10)',
  OSWESTRY: 'Índice de Discapacidad Oswestry',
  DASH: 'Cuestionario DASH',
  WOMAC: 'Índice WOMAC para artrosis',
  ROLAND_MORRIS: 'Cuestionario de Discapacidad Roland-Morris',
} as const;
