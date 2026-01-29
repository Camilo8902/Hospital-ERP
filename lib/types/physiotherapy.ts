// =============================================================================
// TIPOS DE DATOS PARA EL MÓDULO DE FISIOTERAPIA
// =============================================================================

// Tipo principal de registro médico de fisioterapia
export interface PhysioMedicalRecord {
  id: string;
  patient_id: string;
  therapist_id: string;
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
  rom_measurements?: ROMMeasurement[];
  strength_grade?: StrengthGrade[];
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
  informed_consent_signed?: boolean;
  informed_consent_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Campos relacionados
  physio_sessions?: PhysioSession[];
  physio_treatment_plans?: PhysioTreatmentPlan[];
  patients?: PatientSummary;
  therapists?: TherapistSummary;
}

// Medición de rango de movimiento
export interface ROMMeasurement {
  joint: string; // ej: "codo", "hombro", "rodilla"
  movement: string; // ej: "flexión", "extensión"
  right_side?: number; // en grados
  left_side?: number; // en grados
  normal?: number; // valor normal esperado
  limitation?: string; // descripción de la limitación
}

// Grado de fuerza muscular (Oxford Scale)
export interface StrengthGrade {
  muscle_group: string;
  right_side?: number; // 0-5
  left_side?: number; // 0-5
  description?: string;
}

// Sesión de fisioterapia
export interface PhysioSession {
  id: string;
  appointment_id?: string;
  medical_record_id?: string;
  patient_id: string;
  therapist_id: string;
  session_number?: number;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  is_initial_session: boolean;
  is_reassessment: boolean;
  subjective?: string;
  objective?: string;
  analysis?: string;
  plan?: string;
  pain_level: number; // 0-10
  pain_location?: string;
  pain_type?: string;
  body_region?: string;
  muscle_group?: string;
  muscle_strength_grade?: number;
  rom_affected?: string;
  modality?: string;
  techniques_applied: string[];
  functional_score?: number;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Campos relacionados
  patients?: PatientSummary;
  therapists?: TherapistSummary;
}

// Plan de tratamiento de fisioterapia
export interface PhysioTreatmentPlan {
  id: string;
  patient_id: string;
  prescribing_doctor_id?: string;
  department_id?: string;
  diagnosis_code?: string;
  diagnosis_description?: string;
  plan_type: 'rehabilitation' | 'maintenance' | 'preventive' | 'performance';
  clinical_objective?: string;
  start_date: string;
  expected_end_date?: string;
  actual_end_date?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  sessions_per_week?: number;
  total_sessions_prescribed?: number;
  sessions_completed?: number;
  initial_assessment?: string;
  baseline_rom?: string;
  baseline_functional_score?: number;
  progress_notes?: string[];
  outcome_measures?: OutcomeMeasure[];
  notes?: string;
  created_at: string;
  updated_at: string;
  // Campos relacionados
  patients?: PatientSummary;
  prescribers?: TherapistSummary;
  sessions?: PhysioSession[];
}

// Medida de resultado clínico
export interface OutcomeMeasure {
  name: string; // ej: "VAS", "Oswestry", "WOMAC"
  date: string;
  score: number;
  previous_score?: number;
  change?: number;
  interpretation?: string;
}

// Resumen de paciente (para referencias)
export interface PatientSummary {
  id: string;
  full_name: string;
  dni?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  medical_record_number?: string;
}

// Resumen de terapeuta (para referencias)
export interface TherapistSummary {
  id: string;
  full_name: string;
  specialty?: string;
  license_number?: string;
  email?: string;
}

// Filtros para buscar sesiones
export interface PhysioSessionsFilter {
  patientId?: string;
  therapistId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  sessionType?: string;
  bodyRegion?: string;
  searchTerm?: string;
  offset?: number;
  limit?: number;
}

// Estadísticas del dashboard de fisioterapia
export interface PhysioDashboardStats {
  active_patients?: number;
  sessions_this_month?: number;
  sessions_this_week?: number;
  average_pain_reduction?: number;
  pending_appointments?: number;
  completed_sessions_today?: number;
  average_session_duration?: number;
  patient_satisfaction?: number;
  activePatients?: number;
  sessionsThisMonth?: number;
  sessionsThisWeek?: number;
  averagePainReduction?: number;
  pendingAppointments?: number;
  completedSessionsToday?: number;
  averageSessionDuration?: number;
  patientSatisfaction?: number;
  sessionsByStatus?: Record<string, number>;
  sessionsByTechnique?: Record<string, number>;
  painTrend?: Array<{ date: string; averagePain: number }>;
}

// Contexto de fisioterapia del paciente (para el formulario de citas)
export interface PhysioPatientContext {
  hasActiveRecord: boolean;
  medicalRecord?: {
    id: string;
    chief_complaint?: string;
    pain_location?: string;
    pain_scale_baseline?: number;
    clinical_diagnosis?: string;
    contraindications?: string[];
    allergies?: string[];
  };
  treatmentPlan?: {
    id: string;
    plan_type: string;
    total_sessions_prescribed: number;
    sessions_completed: number;
    sessions_remaining: number;
  };
  recentSessions: Array<{
    id: string;
    session_date: string;
    session_number?: number;
    techniques_applied?: string[];
    pain_level?: number;
  }>;
}

// Datos específicos de fisioterapia para el JSONB de appointments
export interface PhysioAppointmentData {
  bodyRegion?: string;
  painLevel?: number;
  therapyType?: 'manual' | 'electro' | 'hydro' | 'exercise' | 'combined';
  requiresInitialAssessment?: boolean;
  sessionNumber?: number;
  treatmentPlanId?: string;
  techniques?: string[];
  therapistNotes?: string;
  clinicalDiagnosis?: string;
  icd10Codes?: string[];
}

// Consentimiento informado de fisioterapia
export interface PhysioInformedConsent {
  id: string;
  patient_id: string;
  treatment_plan_id?: string;
  consent_type: 'initial_evaluation' | 'treatment' | 'specific_procedure' | 'photo_documentation';
  procedure_description: string;
  risks: string[];
  benefits: string[];
  alternatives: string[];
  patient_signature?: string;
  signed_by_patient: boolean;
  signed_by_representative: boolean;
  representative_name?: string;
  representative_dni?: string;
  validated_by?: string;
  validated_at?: string;
  valid_from: string;
  valid_until?: string;
  status: 'pending' | 'signed' | 'expired' | 'revoked';
  created_at: string;
}

// Protocolo clínico de fisioterapia
export interface PhysioClinicalProtocol {
  id: string;
  name: string;
  code: string;
  description?: string;
  category: 'musculoskeletal' | 'neurological' | 'cardiopulmonary' | 'sports' | 'pediatric' | 'geriatric';
  subcategory?: string;
  body_region?: string;
  condition_type?: string;
  evidence_level?: 'A' | 'B' | 'C' | 'D';
  references?: string[];
  total_sessions?: number;
  session_duration_minutes?: number;
  session_frequency?: string;
  phases?: ProtocolPhase[];
  therapeutic_objectives?: string[];
  expected_outcomes?: string;
  contraindications?: string[];
  precautions?: string;
  required_equipment?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Fase de un protocolo clínico
export interface ProtocolPhase {
  phase_number: number;
  name: string;
  description?: string;
  objectives: string[];
  techniques: string[];
  exercises: string[];
  session_duration_minutes: number;
  sessions_count: number;
  criteria_to_advance: string[];
}

// Alerta clínica de fisioterapia
export interface PhysioAlert {
  id: string;
  alert_type: 'stagnation' | 'missed_session' | 'contraindication' | 'pain_increase' | 'goal_achieved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  patient_id: string;
  treatment_plan_id?: string;
  session_id?: string;
  title: string;
  message: string;
  clinical_context?: Record<string, unknown>;
  recommendations?: string[];
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_at?: string;
  triggered_at: string;
}

// Tipos de técnicas de fisioterapia disponibles
export const PHYSIOTHERAPY_TECHNIQUES = [
  'Masaje terapéutico',
  'Movilización articular',
  'Estiramiento',
  'Fortalecimiento',
  'Electroestimulación',
  'Ultrasonido',
  'Laserterapia',
  'Magnetoterapia',
  'Tracción',
  'Vendaje neuromuscular',
  'Crioterapia',
  'Termoterapia',
  'Punción seca',
  'Técnicas de respiración',
  'Terapia manual',
  'Ejercicio terapéutico',
  'Entrenamiento funcional',
  'Reeducación postural',
  'Drenaje linfático',
  '释放放松',
] as const;

export type PhysioTechnique = typeof PHYSIOTHERAPY_TECHNIQUES[number];

// Tipos de modalidades de tratamiento
export const PHYSIOTHERAPY_MODALITIES = [
  { value: 'manual', label: 'Terapia Manual', icon: '👐' },
  { value: 'electro', label: 'Electroterapia', icon: '⚡' },
  { value: 'hydro', label: 'Hidroterapia', icon: '💧' },
  { value: 'exercise', label: 'Ejercicio Terapéutico', icon: '🏋️' },
  { value: 'combined', label: 'Tratamiento Combinado', icon: '🔄' },
] as const;

// Regiones corporales
export const BODY_REGIONS = [
  { value: 'cervical', label: 'Cervical (Cuello)', category: 'columna' },
  { value: 'thoracic', label: 'Torácica', category: 'columna' },
  { value: 'lumbar', label: 'Lumbar (Espalda baja)', category: 'columna' },
  { value: 'shoulder', label: 'Hombro', category: 'miembro_superior' },
  { value: 'elbow', label: 'Codo', category: 'miembro_superior' },
  { value: 'wrist', label: 'Muñeca', category: 'miembro_superior' },
  { value: 'hand', label: 'Mano', category: 'miembro_superior' },
  { value: 'hip', label: 'Cadera', category: 'miembro_inferior' },
  { value: 'knee', label: 'Rodilla', category: 'miembro_inferior' },
  { value: 'ankle', label: 'Tobillo', category: 'miembro_inferior' },
  { value: 'foot', label: 'Pie', category: 'miembro_inferior' },
  { value: 'other', label: 'Otra', category: 'otra' },
] as const;

// Escalas de evaluación funcional
export const FUNCTIONAL_SCALES = [
  { name: 'VAS', fullName: 'Escala Visual Analógica del Dolor', range: '0-10' },
  { name: 'Oswestry', fullName: 'Índice de Discapacidad de Oswestry', range: '0-100' },
  { name: 'WOMAC', fullName: 'Índice WOMAC de Artrosis', range: '0-96' },
  { name: 'Roland-Morris', fullName: 'Cuestionario de Discapacidad de Roland-Morris', range: '0-24' },
  { name: 'DASH', fullName: 'Escala de Discapacidad del Brazo, Hombro y Mano', range: '0-100' },
] as const;

// Grades de fuerza muscular (Oxford Scale)
export const MUSCLE_STRENGTH_GRADES = [
  { value: 0, label: '0 - Parálisis total', description: 'Sin contracción visible' },
  { value: 1, label: '1 - Contracción visible', description: 'Contracción sin movimiento' },
  { value: 2, label: '2 - Movimiento con gravedad eliminada', description: 'Movimiento completo con gravedad eliminada' },
  { value: 3, label: '3 - Movimiento contra gravedad', description: 'Movimiento completo contra gravedad' },
  { value: 4, label: '4 - Movimiento contra resistencia', description: 'Movimiento contra resistencia moderada' },
  { value: 5, label: '5 - Fuerza normal', description: 'Movimiento contra resistencia completa' },
] as const;

// Elemento de lista de sesiones (para UI)
export interface PhysioSessionListItem {
  id: string;
  session_number?: number;
  session_date: string;
  session_time: string;
  patient_id: string;
  patient_name?: string;
  therapist_id: string;
  therapist_name?: string;
  pain_level?: number;
  techniques_applied?: string[];
  status: string;
  is_initial_session?: boolean;
  duration_minutes?: number;
}

// Formulario de sesión de fisioterapia (para creación/actualización)
export interface PhysioSessionForm {
  appointment_id?: string;
  medical_record_id?: string;
  patient_id: string;
  therapist_id: string;
  session_number?: number;
  session_date: string;
  session_time: string;
  duration_minutes?: number;
  is_initial_session?: boolean;
  is_reassessment?: boolean;
  subjective?: string;
  objective?: string;
  analysis?: string;
  plan?: string;
  pain_level?: number;
  pain_location?: string;
  pain_type?: string;
  body_region?: string;
  muscle_group?: string;
  muscle_strength_grade?: number;
  rom_affected?: string;
  modality?: string;
  techniques_applied?: string[];
  functional_score?: number;
  notes?: string;
  status?: string;
}
