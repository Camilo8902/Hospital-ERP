// ============================================================================
// ARCHIVO: lib/types/appointments.ts
// Definiciones de tipos para el sistema de citas por departamento
// Versión: 1.0.1 (Corrección de compatibilidad de tipos)
// Fecha: 2026-01-23
// ============================================================================

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TIPOS BASE Y ENUMERACIONES
// ============================================================================

/**
 * Estados posibles del flujo de trabajo de una cita.
 * 'scheduled': Cita programada, esperando ejecución
 * 'checked_in': Paciente ha llegado y está esperando
 * 'in_consultation': Cita en curso
 * 'completed': Cita finalizada
 * 'cancelled': Cita cancelada
 * 'no_show': Paciente no se presentó
 */
export type WorkflowStatus = 
  | 'scheduled' 
  | 'checked_in' 
  | 'in_consultation' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

/**
 * Tipos de referencia clínica para vinculación polimórfica.
 */
export type ClinicalReferenceType = 
  | 'general_record' 
  | 'physio_record' 
  | 'lab_result' 
  | 'imaging_result' 
  | 'treatment_plan';

/**
 * Tipos de departamento disponibles en el sistema.
 */
export type DepartmentType = 
  | 'general' 
  | 'physiotherapy' 
  | 'laboratory' 
  | 'imaging' 
  | 'emergency';

/**
 * Estados generales de cita (basados en el enum appointment_status de la BD).
 */
export type AppointmentStatus = 
  | 'scheduled' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'no_show';

/**
 * Tipos de cita disponibles.
 */
export type AppointmentType = 
  | 'consultation' 
  | 'follow_up' 
  | 'emergency' 
  | 'procedure' 
  | 'imaging' 
  | 'laboratory' 
  | 'surgery' 
  | 'physiotherapy';

// ============================================================================
// INTERFACES DE DATOS ESPECÍFICOS POR DEPARTAMENTO
// ============================================================================

/**
 * Datos específicos para citas de fisioterapia.
 * Se serializa en el campo JSONB department_specific_data.
 */
export interface PhysioSpecificData {
  /** Zona del cuerpo afectada */
  bodyPart?: string;
  /** Nivel de dolor inicial (0-10) */
  painLevel?: number;
  /** Tipo de terapia a aplicar */
  therapyType?: 'manual' | 'electro' | 'hydro' | 'exercise' | 'combined';
  /** Indica si es la evaluación inicial del paciente */
  requiresInitialAssessment: boolean;
  /** Número de sesión en el plan de tratamiento */
  sessionNumber?: number;
  /** ID del plan de tratamiento asociado */
  treatmentPlanId?: string;
  /** Técnicas aplicadas o a aplicar */
  techniques?: string[];
  /** Observaciones específicas del terapeuta */
  therapistNotes?: string;
  /** Duración estimada en minutos */
  estimatedDuration?: number;
  /** Índice de firma para compatibilidad con Record<string, unknown> */
  [key: string]: unknown;
}

/**
 * Datos específicos para citas de medicina general.
 */
export interface GeneralSpecificData {
  /** Motivo de la visita */
  reasonForVisit?: string;
  /** Síntomas reportados */
  symptoms?: string[];
  /** Prioridad de atención */
  priority?: 'routine' | 'urgent' | 'emergency';
  /** Indica si requiere derivación */
  requiresReferral?: boolean;
  /** Tipo de derivación requerida */
  referralType?: 'specialist' | 'laboratory' | 'imaging' | 'physiotherapy';
  /** Índice de firma para compatibilidad con Record<string, unknown> */
  [key: string]: unknown;
}

/**
 * Datos específicos para citas de laboratorio.
 */
export interface LabSpecificData {
  /** IDs de pruebas a realizar */
  testIds?: string[];
  /** Tipo de muestra requerida */
  sampleType?: 'blood' | 'urine' | 'stool' | 'tissue' | 'other';
  /** Indica si requiere ayuno */
  requiresFasting?: boolean;
  /** Instrucciones de preparación */
  preparationInstructions?: string;
  /** Prioridad de la orden */
  priority?: 'routine' | 'urgent' | 'stat';
  /** Índice de firma para compatibilidad con Record<string, unknown> */
  [key: string]: unknown;
}

/**
 * Datos específicos para citas de imagenología.
 */
export interface ImagingSpecificData {
  /** Tipo de estudio solicitado */
  imagingType?: 'xray' | 'ultrasound' | 'ct' | 'mri' | 'mammography';
  /** Región anatómica a estudiar */
  bodyRegion?: string;
  /** Contrastre requerido */
  contrastRequired?: boolean;
  /** Embarazo potencial (para rayos X) */
  pregnancyRisk?: boolean;
  /** Instrucciones previas al estudio */
  preProcedureInstructions?: string;
  /** Índice de firma para compatibilidad con Record<string, unknown> */
  [key: string]: unknown;
}

// ============================================================================
// INTERFACE BASE DE CITA
// ============================================================================

/**
 * Interface base para todas las citas.
 * Contiene los campos comunes a cualquier tipo de cita.
 */
export interface BaseAppointment {
  /** Identificador único de la cita */
  id: string;
  /** ID del paciente */
  patient_id: string;
  /** ID del médico/terapeuta asignado */
  doctor_id?: string | null;
  /** ID del departamento */
  department_id?: string | null;
  /** ID de la habitación */
  room_id?: string | null;
  /** Tipo de cita */
  appointment_type: AppointmentType;
  /** Estado general de la cita */
  status: AppointmentStatus;
  /** Fecha y hora de inicio */
  start_time: string;
  /** Fecha y hora de fin */
  end_time: string;
  /** Razón de la cita */
  reason?: string | null;
  /** Notas adicionales */
  notes?: string | null;
  /** Indicador de recordatorio enviado */
  reminder_sent: boolean;
  /** Fecha de creación */
  created_at: string;
  /** Fecha de última actualización */
  updated_at: string;
  
  // =========================================================================
  // CAMPOS NUEVOS DE FASE 1
  // =========================================================================
  
  /** Estado del flujo de trabajo */
  workflow_status: WorkflowStatus;
  /** Datos específicos del departamento (JSONB) */
  department_specific_data: Record<string, unknown>;
  /** Tipo de registro clínico vinculado */
  clinical_reference_type?: ClinicalReferenceType | null;
  /** ID del registro clínico vinculado */
  clinical_reference_id?: string | null;
  /** ID del departamento que refiere */
  referring_department_id?: string | null;
}

// ============================================================================
// INTERFACES DISCRIMINADAS POR DEPARTAMENTO
// ============================================================================

/**
 * Interface para citas de fisioterapia.
 * Discriminada por el campo 'department'.
 */
export interface PhysioAppointment extends Omit<BaseAppointment, 'department_specific_data'> {
  /** Tipo de departamento (discriminador) */
  department: 'physiotherapy';
  /** Tipo de cita debe ser fisioterapia */
  appointment_type: 'physiotherapy';
  /** Datos específicos de fisioterapia */
  department_specific_data: PhysioSpecificData;
  /** Datos del paciente para显示 */
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone: string;
  };
  /** Datos del terapeuta */
  therapist?: {
    id: string;
    full_name: string;
    specialty?: string;
  };
}

/**
 * Interface para citas de medicina general.
 */
export interface GeneralAppointment extends Omit<BaseAppointment, 'department_specific_data'> {
  department: 'general';
  appointment_type: 'consultation' | 'follow_up' | 'emergency' | 'procedure';
  department_specific_data: GeneralSpecificData;
}

/**
 * Interface para citas de laboratorio.
 */
export interface LabAppointment extends Omit<BaseAppointment, 'department_specific_data'> {
  department: 'laboratory';
  appointment_type: 'laboratory';
  department_specific_data: LabSpecificData;
}

/**
 * Interface para citas de imagenología.
 */
export interface ImagingAppointment extends Omit<BaseAppointment, 'department_specific_data'> {
  department: 'imaging';
  appointment_type: 'imaging';
  department_specific_data: ImagingSpecificData;
}

// ============================================================================
// TIPO UNIÓN PARA EXPORTACIÓN
// ============================================================================

/**
 * Tipo unión que representa cualquier tipo de cita.
 * El discriminador 'department' permite determinar el tipo específico.
 */
export type Appointment = 
  | PhysioAppointment 
  | GeneralAppointment 
  | LabAppointment 
  | ImagingAppointment;

/**
 * Tipo para crear una nueva cita.
 * Los campos opcionales tienen valores por defecto en la base de datos.
 */
export interface CreateAppointmentInput {
  patient_id: string;
  doctor_id?: string;
  department_id?: string;
  room_id?: string;
  appointment_type: AppointmentType;
  start_time: string;
  end_time: string;
  reason?: string;
  notes?: string;
  department_specific_data?: Record<string, unknown>;
  referring_department_id?: string;
}

/**
 * Tipo para actualizar una cita.
 * Todos los campos son opcionales.
 */
export interface UpdateAppointmentInput {
  doctor_id?: string;
  department_id?: string;
  room_id?: string;
  appointment_type?: AppointmentType;
  status?: AppointmentStatus;
  start_time?: string;
  end_time?: string;
  reason?: string;
  notes?: string;
  workflow_status?: WorkflowStatus;
  department_specific_data?: Record<string, unknown>;
  clinical_reference_type?: ClinicalReferenceType;
  clinical_reference_id?: string;
  referring_department_id?: string;
}

// ============================================================================
// TIPOS PARA RESPUESTAS DE API
// ============================================================================

/**
 * Respuesta paginada de citas.
 */
export interface PaginatedAppointments {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Respuesta con datos extendidos de citas.
 */
export interface AppointmentWithDetails extends BaseAppointment {
  patient_name: string;
  doctor_name?: string;
  department_name?: string;
}

/**
 * Estadísticas de citas por estado de flujo de trabajo.
 * Usa snake_case para coincidir con WorkflowStatus y la base de datos.
 */
export interface AppointmentWorkflowStats {
  scheduled: number;
  checked_in: number;
  in_consultation: number;
  completed: number;
  cancelled: number;
  no_show: number;
  total: number;
}

// ============================================================================
// UTIDADES DE TIPO
// ============================================================================

/**
 * Type guard para verificar si una cita es de fisioterapia.
 */
export function isPhysioAppointment(
  appointment: Appointment
): appointment is PhysioAppointment {
  return appointment.department === 'physiotherapy';
}

/**
 * Type guard para verificar si una cita es de medicina general.
 */
export function isGeneralAppointment(
  appointment: Appointment
): appointment is GeneralAppointment {
  return appointment.department === 'general';
}

/**
 * Type guard para verificar si una cita es de laboratorio.
 */
export function isLabAppointment(
  appointment: Appointment
): appointment is LabAppointment {
  return appointment.department === 'laboratory';
}

/**
 * Type guard para verificar si una cita es de imagenología.
 */
export function isImagingAppointment(
  appointment: Appointment
): appointment is ImagingAppointment {
  return appointment.department === 'imaging';
}

/**
 * Obtiene los datos específicos del departamento tipados correctamente.
 */
export function getDepartmentSpecificData<T extends Record<string, unknown>>(
  appointment: Appointment
): T {
  return appointment.department_specific_data as T;
}

// ============================================================================
// FUNCIONES DE CONSULTA A LA BASE DE DATOS
// ============================================================================

/**
 * Opciones para filtrar citas.
 */
export interface AppointmentFilters {
  department_id?: string | null;
  workflow_status?: WorkflowStatus | null;
  patient_id?: string;
  doctor_id?: string;
  start_date?: string;
  end_date?: string;
  appointment_type?: AppointmentType;
  status?: AppointmentStatus;
  limit?: number;
  offset?: number;
}

/**
 * Obtiene citas con filtros opcionales.
 */
export async function getAppointments(
  supabase: SupabaseClient,
  filters?: AppointmentFilters
): Promise<Appointment[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      patient:patients!inner(id, first_name, last_name, email, phone),
      doctor:profiles!inner(id, full_name, specialty),
      department:departments!inner(id, name)
    `);

  if (filters?.department_id) {
    query = query.eq('department_id', filters.department_id);
  }
  if (filters?.workflow_status) {
    query = query.eq('workflow_status', filters.workflow_status);
  }
  if (filters?.patient_id) {
    query = query.eq('patient_id', filters.patient_id);
  }
  if (filters?.doctor_id) {
    query = query.eq('doctor_id', filters.doctor_id);
  }
  if (filters?.appointment_type) {
    query = query.eq('appointment_type', filters.appointment_type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  query = query.order('start_time', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching appointments: ${error.message}`);
  }

  return data as unknown as Appointment[];
}

/**
 * Obtiene una cita por su ID.
 */
export async function getAppointmentById(
  supabase: SupabaseClient,
  appointmentId: string
): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:patients!inner(id, first_name, last_name, email, phone),
      doctor:profiles!inner(id, full_name, specialty),
      department:departments!inner(id, name)
    `)
    .eq('id', appointmentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error fetching appointment: ${error.message}`);
  }

  return data as unknown as Appointment;
}

/**
 * Crea una nueva cita con soporte de datos específicos por departamento.
 */
export async function createAppointment(
  supabase: SupabaseClient,
  input: CreateAppointmentInput
): Promise<Appointment> {
  const { data, error } = await supabase
    .rpc('create_appointment_with_dept_data', {
      p_patient_id: input.patient_id,
      p_doctor_id: input.doctor_id,
      p_department_id: input.department_id,
      p_start_time: input.start_time,
      p_end_time: input.end_time,
      p_appointment_type: input.appointment_type,
      p_reason: input.reason,
      p_department_specific_data: input.department_specific_data || {},
      p_referring_department_id: input.referring_department_id
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating appointment: ${error.message}`);
  }

  return data as unknown as Appointment;
}

/**
 * Actualiza el estado de flujo de trabajo de una cita.
 */
export async function updateWorkflowStatus(
  supabase: SupabaseClient,
  appointmentId: string,
  newWorkflowStatus: WorkflowStatus
): Promise<Appointment> {
  const { data, error } = await supabase
    .rpc('update_appointment_workflow_status', {
      p_appointment_id: appointmentId,
      p_new_workflow_status: newWorkflowStatus
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating workflow status: ${error.message}`);
  }

  return data as unknown as Appointment;
}

/**
 * Vincula un registro clínico a una cita.
 */
export async function linkClinicalReference(
  supabase: SupabaseClient,
  appointmentId: string,
  clinicalReferenceType: ClinicalReferenceType,
  clinicalReferenceId: string
): Promise<Appointment> {
  const { data, error } = await supabase
    .rpc('link_clinical_reference', {
      p_appointment_id: appointmentId,
      p_clinical_reference_type: clinicalReferenceType,
      p_clinical_reference_id: clinicalReferenceId
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error linking clinical reference: ${error.message}`);
  }

  return data as unknown as Appointment;
}

/**
 * Obtiene citas de fisioterapia con datos específicos.
 */
export async function getPhysioAppointments(
  supabase: SupabaseClient,
  filters?: {
    workflow_status?: WorkflowStatus | null;
    patient_id?: string;
    therapist_id?: string;
    limit?: number;
    offset?: number;
  }
): Promise<PhysioAppointment[]> {
  let query = supabase
    .from('appointments')
    .select(`
      *,
      patient:patients!inner(id, first_name, last_name, email, phone),
      doctor:profiles!inner(id, full_name, specialty)
    `)
    .eq('appointment_type', 'physiotherapy');

  if (filters?.workflow_status) {
    query = query.eq('workflow_status', filters.workflow_status);
  }
  if (filters?.patient_id) {
    query = query.eq('patient_id', filters.patient_id);
  }
  if (filters?.therapist_id) {
    query = query.eq('doctor_id', filters.therapist_id);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  query = query.order('start_time', { ascending: false });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching physio appointments: ${error.message}`);
  }

  return data as unknown as PhysioAppointment[];
}

/**
 * Obtiene estadísticas de citas por estado de flujo de trabajo.
 */
export async function getAppointmentWorkflowStats(
  supabase: SupabaseClient,
  departmentId?: string
): Promise<AppointmentWorkflowStats> {
  let query = supabase
    .from('appointments')
    .select('workflow_status', { count: 'exact' });

  if (departmentId) {
    query = query.eq('department_id', departmentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Error fetching workflow stats: ${error.message}`);
  }

  const stats: AppointmentWorkflowStats = {
    scheduled: 0,
    checked_in: 0,
    in_consultation: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
    total: data?.length || 0
  };

  data?.forEach((row) => {
    const status = row.workflow_status as WorkflowStatus;
    if (status in stats) {
      stats[status]++;
    }
  });

  return stats;
}
