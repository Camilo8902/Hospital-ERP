// ============================================
// MÓDULO DE FISIOTERAPIA - TIPOS TYPESCRIPT
// ============================================

// Tipo principal: Historia Clínica de Fisioterapia
export interface PhysioMedicalRecord {
  id: string;
  patient_id: string;
  therapist_id: string;
  department_id?: string;
  status: 'active' | 'completed' | 'suspended' | 'cancelled';
  
  // Evaluación inicial
  evaluation_date: string;
  chief_complaint: string;
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
  clinical_diagnosis: string;
  icd10_codes?: string[];
  functional_limitations?: string;
  
  // Objetivos terapéuticos
  short_term_goals?: string[];
  long_term_goals?: string[];
  patient_expectations?: string;
  
  // Documentación
  initial_photos?: string[];
  informed_consent_signed: boolean;
  informed_consent_date?: string;
  consent_document_url?: string;
  
  // Metadatos
  created_at: string;
  updated_at: string;
  
  // Campos relacionados para display
  patient?: PatientSummary;
  therapist?: TherapistSummary;
}

// Resumen de paciente (para display en listas)
export interface PatientSummary {
  id: string;
  full_name: string;
  dni: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
}

// Resumen de terapeuta
export interface TherapistSummary {
  id: string;
  full_name: string;
  email: string;
  specialty?: string;
  license_number?: string;
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

// Tipo: Sesión de Tratamiento (Formato SOAP)
export interface PhysioSession {
  id: string;
  record_id: string;
  appointment_id?: string;
  therapist_id: string;
  
  // Fecha y duración
  session_date: string;
  duration_minutes: number;
  
  // Formato SOAP
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  
  // Métricas
  pain_before?: number;
  pain_after?: number;
  vas_current?: number;
  
  // ROM en esta sesión
  rom_session?: ROMMeasurements;
  rom_improvement?: string;
  strength_session?: StrengthGrade;
  strength_improvement?: string;
  
  // Técnicas aplicadas
  techniques_applied?: string[];
  equipment_used?: string[];
  
  // Respuesta del paciente
  patient_response?: string;
  tolerance?: string;
  adverse_reactions?: string;
  
  // Firma
  therapist_signature: string;
  signed_at: string;
  patient_present: boolean;
  
  // Notas adicionales
  observations?: string;
  home_exercises?: string;
  next_session_objectives?: string[];
  
  // Metadatos
  created_at: string;
  updated_at: string;
  
  // Campos relacionados
  record?: PhysioMedicalRecord;
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

// Item de lista de sesiones (versión simplificada para listas)
export interface PhysioSessionListItem {
  id: string;
  session_date: string;
  duration_minutes: number;
  patient_present: boolean;
  patient_name: string;
  patient_dni: string;
  pain_before?: number;
  pain_after?: number;
  techniques_applied?: string[];
  therapist_id: string;
  record_id: string;
  created_at: string;
}

// Datos de cita de fisioterapia (para integración con citas)
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
// TIPOS PARA PROTOCOLOS CLÍNICOS
// ============================================

// Tipo: Protocolo Clínico
export interface PhysioClinicalProtocol {
  id: string;
  name: string;
  code: string;
  description?: string;
  
  // Clasificación
  category?: string;
  subcategory?: string;
  body_region?: string;
  condition_type?: string;
  
  // Evidencia
  evidence_level?: string;
  references?: string[];
  clinical_guidelines?: string;
  
  // Estructura
  total_sessions: number;
  session_duration_minutes: number;
  session_frequency?: string;
  phases: ProtocolPhase[];
  
  // Objetivos
  therapeutic_objectives?: string[];
  expected_outcomes?: string;
  success_criteria?: Record<string, unknown>;
  
  // Consideraciones
  contraindications?: string[];
  precautions?: string;
  red_flags?: string[];
  
  // Requisitos
  required_equipment?: string[];
  required_rooms?: string[];
  staff_requirements?: string[];
  
  // Estado
  is_active: boolean;
  created_by?: string;
  
  created_at: string;
  updated_at: string;
}

// Fase de un protocolo
export interface ProtocolPhase {
  phase_number: number;
  name: string;
  description: string;
  objectives: string[];
  techniques: string[];
  exercises: string[];
  criteria_to_advance: string[];
  estimated_sessions: number;
}

// ============================================
// TIPOS PARA PLANES DE TRATAMIENTO
// ============================================

// Tipo: Plan de Tratamiento
export interface PhysioTreatmentPlan {
  id: string;
  record_id: string;
  protocol_id?: string;
  
  // Fechas
  start_date: string;
  expected_end_date?: string;
  actual_end_date?: string;
  
  // Sesiones
  total_sessions: number;
  sessions_completed: number;
  sessions_per_week?: number;
  
  // Progreso
  current_phase: number;
  progress_percentage: number;
  last_progress评估?: string;
  
  // Estado
  status: 'active' | 'completed' | 'paused' | 'cancelled' | 'modified';
  suspension_reason?: string;
  clinical_notes?: string;
  
  // Metadatos
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Campos relacionados
  protocol?: PhysioClinicalProtocol;
}

// ============================================
// TIPOS PARA CONSENTIMIENTO INFORMADO
// ============================================

// Tipo: Consentimiento Informado
export interface PhysioInformedConsent {
  id: string;
  patient_id: string;
  record_id?: string;
  
  consent_type: 
    | 'initial_evaluation'
    | 'treatment_session'
    | 'electrotherapy'
    | 'manual_therapy'
    | 'exercise_program'
    | 'hydrotherapy'
    | 'data_processing'
    | 'photo_documentation'
    | 'telehealth';
  
  procedure_description: string;
  risks: string;
  benefits: string;
  alternatives: string;
  risks_of_not_treating?: string;
  
  // Documento
  document_version?: string;
  generated_document_url?: string;
  
  // Firmas
  patient_signature?: string;
  signed_by_patient: boolean;
  signed_by_representative: boolean;
  representative_name?: string;
  representative_dni?: string;
  
  // Validación
  validated_by?: string;
  validated_at?: string;
  
  // Vigencia
  valid_from: string;
  valid_until?: string;
  status: 'pending' | 'signed' | 'expired' | 'revoked';
  
  created_at: string;
  updated_at: string;
}

// ============================================
// TIPOS PARA AUDITORÍA
// ============================================

// Tipo: Registro de Auditoría
export interface PhysioAuditLog {
  id: string;
  
  event_type: 
    | 'record_view'
    | 'record_create'
    | 'record_update'
    | 'record_delete'
    | 'session_view'
    | 'session_create'
    | 'session_update'
    | 'consent_signed'
    | 'consent_revoked'
    | 'data_export'
    | 'data_correction'
    | 'access_denied';
  
  event_category: string;
  
  // Usuario
  user_id: string;
  user_role: string;
  user_name: string;
  
  // Registro afectado
  patient_id?: string;
  record_id?: string;
  session_id?: string;
  record_type?: string;
  
  // Detalles
  action_details?: string;
  data_accessed?: Record<string, unknown>;
  data_modified?: Record<string, unknown>;
  
  // Contexto
  ip_address?: string;
  user_agent?: string;
  access_point?: string;
  
  event_timestamp: string;
}

// ============================================
// TIPOS PARA DISPOSITIVOS MÉDICOS
// ============================================

// Tipo: Dispositivo Médico
export interface PhysioMedicalDevice {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  
  device_type: 
    | 'mbst'
    | 'electrotherapy'
    | 'laser'
    | 'ultrasound'
    | 'vacuum'
    | 'cryotherapy'
    | 'heat_therapy'
    | 'traction'
    | 'compression'
    | 'rom_measurement'
    | 'strength_measurement'
    | 'other';
  
  modality?: string;
  
  // Especificaciones
  technical_specs?: Record<string, unknown>;
  available_programs?: string[];
  
  // Estado
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_history?: string[];
  
  // Calibración
  calibration_date?: string;
  calibration_due_date?: string;
  calibration_certificate_url?: string;
  
  // Estadísticas
  total_sessions_conducted: number;
  total_hours_used: number;
  
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Tipo: Sesión de Dispositivo
export interface PhysioDeviceSession {
  id: string;
  session_id: string;
  device_id: string;
  
  program_used?: string;
  intensity?: number;
  frequency?: number;
  duration_minutes: number;
  parameters?: Record<string, unknown>;
  
  // Resultado
  patient_tolerance?: string;
  adverse_reactions?: string;
  
  created_at: string;
  
  // Campos relacionados
  device?: PhysioMedicalDevice;
}

// ============================================
// TIPOS PARA FORMULARIOS
// ============================================

// Formulario de evaluación inicial
export interface PhysioEvaluationForm {
  // Datos del paciente
  patient_id: string;
  
  // Motivo de consulta
  chief_complaint: string;
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
  contraindicaciones?: string[];
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
  
  // Diagnóstico y objetivos
  clinical_diagnosis: string;
  icd10_codes?: string[];
  functional_limitations?: string;
  short_term_goals?: string[];
  long_term_goals?: string[];
  patient_expectations?: string;
  
  // Consentimiento
  informed_consent_signed: boolean;
}

// Formulario de sesión SOAP
export interface PhysioSessionForm {
  record_id: string;
  appointment_id?: string;
  therapist_id: string;
  
  // Formato SOAP
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  
  // Métricas
  pain_before?: number;
  pain_after?: number;
  vas_current?: number;
  
  // ROM en esta sesión
  rom_session?: ROMMeasurements;
  strength_session?: StrengthGrade;
  
  // Técnicas
  techniques_applied?: string[];
  equipment_used?: string[];
  
  // Respuesta
  patient_response?: string;
  tolerance?: string;
  adverse_reactions?: string;
  
  // Notas
  observations?: string;
  home_exercises?: string;
  next_session_objectives?: string[];
  
  patient_present: boolean;
}

// ============================================
// TIPOS PARA ESTADÍSTICAS Y REPORTES
// ============================================

// Paciente activo en fisioterapia
export interface ActivePhysioPatient {
  patient_id: string;
  patient_name: string;
  dni: string;
  record_id: string;
  evaluation_date: string;
  clinical_diagnosis: string;
  total_sessions: number;
  last_session_date?: string;
  status: string;
}

// Estadísticas de fisioterapeuta
export interface PhysioTherapistStats {
  therapist_id: string;
  therapist_name: string;
  total_patients: number;
  total_sessions: number;
  avg_days_on_treatment?: number;
}

// Resumen de evolución del paciente
export interface PatientEvolutionSummary {
  record_id: string;
  patient_id: string;
  patient_name: string;
  start_date: string;
  total_sessions: number;
  pain_progression: {
    dates: string[];
    values: number[];
  };
  rom_progression: {
    joint: string;
    dates: string[];
    left_values: number[];
    right_values: number[];
  }[];
}

// ============================================
// CONSTANTES
// ============================================

// Técnicas de fisioterapia comunes
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

// Equipos disponibles
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

// Regiones corporales
export const BODY_REGIONS = [
  ' Cervical',
  'Hombro',
  'Codo',
  'Muñeca/Mano',
  'Columna Dorsal',
  'Columna Lumbar',
  'Cadera',
  'Rodilla',
  'Tobillo/Pie',
  '全身 (全身)',
] as const;

// Condiciones comunes
export const COMMON_CONDITIONS = [
  'Lumbalgia aguda',
  'Lumbalgia crónica',
  'Lumbar hernia discal',
  'Cervicalgia',
  'Cervicobraquialgia',
  'Hombro doloroso',
  'Hombro congelado',
  'Rotura del manguito rotador',
  'Epicondilitis lateral',
  'Epicondilitis medial',
  'Síndrome del túnel carpiano',
  'Gonartrosis',
  'Coxartrosis',
  'Esguince de tobillo',
  'Fascitis plantar',
  'Lesiones deportivas',
  'Post-cirugía',
  'Rehabilitación neurológica',
  'Pediatría',
  'Geriatría',
] as const;

// Tipos de escalas funcionales
export const FUNCTIONAL_SCALES = {
  VAS: 'Escala Visual Analógica del Dolor (0-10)',
  OSWESTRY: 'Índice de Discapacidad Oswestry',
  DASH: 'Cuestionario DASH',
  WOMAC: 'Índice WOMAC para artrosis',
  ROLAND_MORRIS: 'Cuestionario de Discapacidad Roland-Morris',
  EQ_5D: 'EQ-5D - Calidad de vida',
  SF_36: 'SF-36 - Estado de salud',
} as const;
