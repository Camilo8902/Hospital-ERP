// Tipos generados automáticamente de Supabase
// Esta configuración asegura que TypeScript reconozca los tipos de la base de datos

export type UserRole = 'admin' | 'doctor' | 'nurse' | 'reception' | 'pharmacy' | 'lab' | 'lab_admin';
export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type GenderType = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  specialty?: string;
  license_number?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  medical_record_number: string;
  dni?: number | null;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone: string;
  dob: string;
  gender?: GenderType | null;
  address?: string | null;
  city?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  blood_type?: string | null;
  allergies?: string[] | null;
  insurance_provider?: string | null;
  insurance_policy_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  phone_extension?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  department_id: string;
  room_type: 'consultation' | 'emergency' | 'surgery' | 'recovery' | 'hospitalization' | 'imaging' | 'laboratory';
  capacity: number;
  current_occupancy: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  notes?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  department_id?: string;
  room_id?: string;
  appointment_type: 'consultation' | 'follow_up' | 'emergency' | 'procedure' | 'imaging' | 'laboratory' | 'surgery';
  status: AppointmentStatus;
  start_time: string;
  end_time: string;
  reason?: string;
  notes?: string;
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
  // Campos relacionados para joins
  patients?: Patient;
  profiles?: Profile;
  departments?: Department;
  rooms?: Room;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  appointment_id?: string;
  doctor_id?: string;
  visit_date: string;
  record_type: 'consultation' | 'progress_note' | 'procedure' | 'discharge' | 'referral' | 'lab_result' | 'imaging_result';
  chief_complaint?: string;
  history_of_present_illness?: string;
  physical_examination?: string;
  vital_signs: VitalSigns;
  diagnosis: string[];
  icd_codes?: string[];
  treatment_plan?: string;
  prescriptions?: string;
  recommendations?: string;
  notes?: string;
  private_notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  created_at: string;
  updated_at: string;
  // Campos relacionados
  patients?: Patient;
  profiles?: Profile;
}

export interface VitalSigns {
  blood_pressure?: string;
  heart_rate?: number;
  temperature?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
}

export interface Inventory {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: 'medication' | 'equipment' | 'supplies' | 'consumables' | 'lab_supplies' | 'office';
  subcategory?: string;
  unit: string;
  quantity: number;
  min_stock: number;
  max_stock?: number;
  unit_cost: number;
  unit_price: number;
  supplier?: string;
  manufacturer?: string;
  expiration_date?: string;
  batch_number?: string;
  storage_location?: string;
  requires_prescription: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  medical_record_id: string;
  patient_id: string;
  doctor_id?: string | null;
  medication_id?: string | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity_prescribed: number;
  quantity_dispensed: number;
  refills_allowed: number;
  refills_used: number;
  instructions?: string | null;
  status: 'pending' | 'partially_dispensed' | 'dispensed' | 'cancelled' | 'expired';
  prescribed_date: string;
  dispensed_date?: string | null;
  created_at: string;
  updated_at: string;
  // Campos relacionados
  patients?: Patient;
  profiles?: Profile;
}

export interface InventoryTransaction {
  id: string;
  inventory_id: string;
  transaction_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'disposal' | 'prescription_dispense';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  performed_by?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  appointment_id?: string;
  status: InvoiceStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_method?: string;
  payment_reference?: string;
  items: InvoiceItem[];
  notes?: string;
  due_date: string;
  issued_date: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
  // Campos relacionados
  patients?: Patient;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  service_code?: string;
  quantity: number;
  unit_price: number;
  total: number;
  source_type?: string;
  source_id?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'prescription' | 'inventory' | 'billing' | 'system';
  read: boolean;
  link?: string;
  created_at: string;
}

// Tipos para componentes de UI
export interface StatCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

// ============================================
// TIPOS PARA MÓDULO DE LABORATORIO
// ============================================

export type LabOrderStatus = 'pending' | 'samples_collected' | 'processing' | 'completed' | 'cancelled';
export type LabPriority = 'normal' | 'urgent';
export type LabSampleType = 'blood' | 'urine' | 'stool' | 'sputum' | 'tissue' | 'cerebrospinal' | 'other';
export type LabParameterType = 'number' | 'text' | 'select' | 'boolean';

export interface LabTestCatalog {
  id: string;
  code: string;
  name: string;
  description?: string;
  category_id?: string;
  category?: {
    name: string;
    code: string;
  };
  sample_type: LabSampleType;
  instructions?: string;
  preparation_required?: string;
  duration_hours: number;
  price: number;
  inventory_item_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Parámetros asociados (según schema: lab_parameters)
  lab_parameters?: LabTestParameter[];
  parameters?: LabTestParameter[];
}

export interface LabTestParameter {
  id: string;
  test_id: string;
  name: string;
  code?: string | null;
  description?: string;
  unit?: string | null;
  parameter_type?: LabParameterType;
  // Nombres de campos según el JSON del usuario
  reference_min?: string | null;
  reference_max?: string | null;
  reference_text?: string | null;
  method?: string | null;
  is_critical_below?: string | null;
  is_critical_above?: string | null;
  decimal_places?: number;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  // Nombres legacy para compatibilidad
  ref_range_min?: number | null;
  ref_range_max?: number | null;
  ref_range_text?: string;
  is_critical?: boolean;
  critical_min?: number | null;
  critical_max?: number | null;
}

export interface LabOrder {
  id: string;
  order_number: string;
  patient_id: string;
  doctor_id?: string;
  appointment_id?: string;
  status: LabOrderStatus;
  priority: LabPriority;
  notes?: string;
  internal_notes?: string;
  total_amount: number;
  is_paid: boolean;
  completed_at?: string;
  completed_by?: string;
  cancelled_at?: string;
  cancelled_reason?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Campos relacionados
  patients?: Patient;
  profiles?: Profile;
  doctor?: Profile;
  // Según schema: lab_order_details contiene las pruebas de la orden
  lab_order_details?: LabOrderDetail[];
  samples?: LabSample[];
  results?: LabOrderResult[];
}

export interface LabOrderDetail {
  id: string;
  order_id: string;
  test_id?: string;
  is_custom?: boolean;
  custom_name?: string;
  custom_price?: number;
  custom_category_id?: string;
  sample_collected?: boolean;
  sample_collected_at?: string;
  sample_id?: string;
  collected_by?: string;
  notes?: string;
  created_at: string;
  // Campos relacionados
  tests?: LabTestCatalog;
  lab_results?: LabOrderResult[];
}

export interface LabSample {
  id: string;
  order_id: string;
  sample_code: string;
  sample_type: LabSampleType;
  volume?: string;
  collected_at?: string;
  collected_by?: string;
  received_at?: string;
  received_by?: string;
  status: string;
  rejection_reason?: string;
  storage_location?: string;
  notes?: string;
  created_at: string;
  // Campos relacionados
  collector?: Profile;
  receiver?: Profile;
}

export interface LabOrderResult {
  id: string;
  order_detail_id: string;
  parameter_id?: string;
  value_text?: string;
  value_numeric?: number;
  status: string;
  result_date?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Campos relacionados
  parameter?: LabTestParameter;
  // NOTA: is_abnormal e is_critical no existen en la tabla lab_results de la base de datos real
}

export interface LabStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedToday: number;
  urgentOrders: number;
  totalRevenue: number;
}

export interface LabOrderInput {
  patient_id: string;
  doctor_id?: string;
  appointment_id?: string;
  priority?: LabPriority;
  notes?: string;
  test_ids: string[];
}

export interface LabResultInput {
  order_id: string;
  test_id: string;
  parameter_id?: string;
  value: string;
  notes?: string;
  attached_file_url?: string;
}

export interface LabSampleInput {
  order_id: string;
  sample_type: LabSampleType;
  volume?: string;
  collected_by?: string;
  notes?: string;
}

// ============================================
// TIPOS PARA ANOTACIONES DE PACIENTES
// ============================================

export interface PatientNote {
  id: string;
  patient_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

// ============================================
// TIPOS PARA PUNTO DE VENTA (POS) DE FARMACIA
// ============================================

export type POSPaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'INSURANCE';
export type POSTransactionStatus = 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  stockAvailable: number;
  discount: number;
  subtotal: number;
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  inventory_id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  created_at: string;
}

export interface POSTransaction {
  id: string;
  transaction_number: string;
  status: POSTransactionStatus;
  payment_method: POSPaymentMethod;
  subtotal: number;
  discount_total: number;
  tax_amount: number;
  total_amount: number;
  items_count: number;
  customer_name?: string;
  notes?: string;
  operator_id: string;
  operator_name: string;
  created_at: string;
  updated_at: string;
  // Items relacionados
  items?: POSTransactionItem[];
}

export interface POSStats {
  totalSalesToday: number;
  transactionCountToday: number;
  averageTicket: number;
  topSellingProducts: Array<{
    name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

export interface TransactionPayload {
  items: CartItem[];
  paymentMethod: POSPaymentMethod;
  customerName?: string;
  notes?: string;
}

// ============================================
// TIPOS PARA SISTEMA DE PAGOS EUROPEOS (FASE 1)
// ============================================

export type PaymentStatus = 
  | 'PENDING'        // Pago iniciado, esperando confirmación
  | 'PROCESSING'     // Procesando con el proveedor
  | 'SUCCEEDED'      // Pago completado exitosamente
  | 'FAILED'         // Pago falló
  | 'REFUNDED'       // Reembolso completo
  | 'PARTIALLY_REFUNDED' // Reembolso parcial
  | 'CANCELLED';     // Pago cancelado antes de completar

export type PaymentMethodType = 
  | 'CARD'           // Tarjetas de crédito/débito (Visa, Mastercard, etc.)
  | 'BIZUM'          // Bizum (España)
  | 'SEPA_DEBIT'     // Débito directo SEPA
  | 'PAYPAL';        // PayPal (futuro)

export type PaymentReferenceType = 
  | 'LAB_ORDER'      // Orden de laboratorio
  | 'CONSULTATION'   // Consulta médica
  | 'INVOICE'        // Factura general
  | 'POS_SALE';      // Venta POS de farmacia

// Transacción de pago
export interface PaymentTransaction {
  id: string;
  amount: number;              // En céntimos
  currency: string;            // EUR por defecto
  status: PaymentStatus;
  payment_method: PaymentMethodType;
  provider: string;            // 'STRIPE'
  provider_transaction_id?: string;
  provider_payment_intent_id?: string;
  provider_customer_id?: string;
  description?: string;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
  reference_type?: PaymentReferenceType;
  reference_id?: string;
  metadata?: Record<string, unknown>;
  refunded_amount: number;     // En céntimos
  refund_reason?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Reembolso
export interface PaymentRefund {
  id: string;
  transaction_id: string;
  amount: number;              // En céntimos
  currency: string;
  status: PaymentStatus;
  provider_refund_id?: string;
  reason: string;
  notes?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Método de pago guardado
export interface PaymentMethod {
  id: string;
  user_id: string;
  type: PaymentMethodType;
  provider_method_id: string;
  last4?: string;              // Últimos 4 dígitos
  brand?: string;              // Visa, Mastercard, etc.
  bank_name?: string;          // Para SEPA
  iban_prefix?: string;        // Para SEPA
  is_default: boolean;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Evento de webhook
export interface PaymentWebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  received_at: string;
}

// DTOs para la API

export interface CreatePaymentIntentDTO {
  amount: number;              // En céntimos
  currency?: string;           // Por defecto 'EUR'
  paymentMethod: PaymentMethodType;
  referenceType: PaymentReferenceType;
  referenceId: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  clientSecret?: string;       // Para completar el pago en el cliente
  transactionId?: string;
  providerPaymentIntentId?: string;
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  transaction?: PaymentTransaction;
  error?: string;
}

export interface ProcessRefundDTO {
  amount?: number;             // Opcional, si no se indica es reembolso total
  reason: string;
  notes?: string;
}

export interface ProcessRefundResponse {
  success: boolean;
  refund?: PaymentRefund;
  error?: string;
}

export interface PaymentStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalAmount: number;
  totalRefunded: number;
  averageTicket: number;
  byPaymentMethod: Record<PaymentMethodType, {
    count: number;
    amount: number;
  }>;
}

// Tipos para el cliente (Stripe Elements)
export interface StripePaymentMethodData {
  type: PaymentMethodType;
  card?: {
    element: unknown;
  };
  sepa_debit?: {
    element: unknown;
  };
}

export interface PaymentConfirmationResult {
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action';
  clientSecret: string;
  error?: string;
}

// ============================================
// TIPOS PARA INTEGRACIÓN DE FISIOTERAPIA EN HISTORIA CLÍNICA
// ============================================

// Extendemos el tipo ClinicalRecord para incluir fisioterapia
export type ExtendedRecordType = 
  | 'consultation' 
  | 'progress_note' 
  | 'procedure' 
  | 'discharge' 
  | 'referral' 
  | 'lab_result' 
  | 'imaging_result'
  | 'physiotherapy'; // Nuevo tipo para registros de fisioterapia

// Capítulo de fisioterapia (modelo SOAP)
export interface PhysioChapter {
  id: string;
  clinical_record_id: string;
  patient_id: string;
  therapist_id?: string;
  appointment_id?: string;
  
  // Campo S: Subjetivo
  subjective?: string;
  
  // Campo O: Objetivo
  objective?: string;
  
  // Campo A: Análisis
  analysis?: string;
  
  // Campo P: Plan
  plan?: string;
  
  // Métricas específicas
  pain_level?: number;
  pain_location?: string;
  pain_type?: string;
  
  // Rango de movimiento
  rom_affected?: string;
  rom_measure?: string;
  
  // Fortaleza muscular
  muscle_strength_grade?: number;
  muscle_group?: string;
  
  // Técnicas
  techniques_applied?: string[];
  modality?: string; // 'manual', 'instrumental', 'ejercicio', 'hidroterapia'
  
  // Evaluación funcional
  functional_score?: number;
  functional_limitations?: string;
  functional_goals?: string;
  
  // Sesión
  session_duration_minutes?: number;
  session_number?: number;
  total_sessions_planned?: number;
  
  // Flags clínicos
  is_initial_session?: boolean;
  is_reassessment?: boolean;
  treatment_continued?: boolean;
  
  // Consentimiento
  informed_consent?: boolean;
  consent_document_url?: string;
  
  // Notas
  notes?: string;
  private_notes?: string;
  
  created_at: string;
  updated_at: string;
}

// Registro clínico extendido con capítulo de fisioterapia
export interface ExtendedClinicalRecord {
  id: string;
  visit_date: string;
  record_type: ExtendedRecordType;
  chief_complaint?: string;
  diagnosis: any[] | null;
  treatment_plan?: string;
  doctor_id?: string;
  follow_up_required: boolean;
  created_at: string;
  updated_at: string;
  
  // Datos del médico/terapeuta
  profiles?: {
    full_name: string;
    specialty?: string | null;
  } | null;
  
  // Capítulo de fisioterapia (opcional, solo si record_type === 'physiotherapy')
  physio_chapter?: PhysioChapter | null;
}

// Plan de tratamiento de fisioterapia
export interface PhysioTreatmentPlan {
  id: string;
  patient_id: string;
  prescribing_doctor_id?: string;
  department_id?: string;
  
  diagnosis_code?: string;
  diagnosis_description?: string;
  
  plan_type: 'rehabilitation' | 'pain_management' | 'post_surgical' | 'sports' | 'preventive';
  clinical_objective?: string;
  
  start_date: string;
  expected_end_date?: string;
  actual_end_date?: string;
  
  status: 'active' | 'completed' | 'suspended' | 'cancelled';
  
  sessions_per_week?: number;
  total_sessions_prescribed?: number;
  
  initial_assessment?: string;
  baseline_rom?: string;
  baseline_functional_score?: number;
  
  progress_notes?: string[];
  outcome_measures?: string[];
  
  notes?: string;
  
  created_at: string;
  updated_at: string;
}

// Sesión individual de fisioterapia
export interface PhysioSession {
  id: string;
  treatment_plan_id?: string;
  physio_chapter_id?: string;
  appointment_id?: string;
  
  session_number: number;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  
  pain_level_before?: number;
  pain_level_after?: number;
  
  rom_before?: string;
  rom_after?: string;
  
  techniques_used?: string[];
  equipment_used?: string[];
  
  patient_response?: string;
  tolerance_level?: 'excellent' | 'good' | 'fair' | 'poor';
  
  home_exercises?: string;
  instructions?: string;
  
  attendance_status: 'completed' | 'missed' | 'cancelled' | 'rescheduled';
  cancellation_reason?: string;
  
  therapist_id?: string;
  
  created_at: string;
  updated_at: string;
}

// Estadísticas de fisioterapia para un paciente
export interface PhysioPatientStats {
  totalSessions: number;
  completedSessions: number;
  missedSessions: number;
  averagePainLevel: number;
  averageFunctionalScore: number;
  painImprovement: number; // Porcentaje de mejora
  functionalImprovement: number; // Porcentaje de mejora
  treatmentPlanStatus: 'active' | 'completed' | 'suspended' | 'cancelled';
  currentSessionNumber: number;
  remainingSessions: number;
}

// Formulario para crear registro de fisioterapia
export interface PhysioRecordFormData {
  patient_id: string;
  appointment_id?: string;
  visit_date: string;
  chief_complaint: string;
  diagnosis: Array<{ code: string; description: string }>;
  treatment_plan: string;
  
  // Datos SOAP
  subjective?: string;
  objective?: string;
  analysis?: string;
  plan?: string;
  
  // Métricas
  pain_level?: number;
  pain_location?: string;
  pain_type?: string;
  
  // ROM
  rom_affected?: string;
  rom_measure?: string;
  
  // Fortaleza
  muscle_strength_grade?: number;
  muscle_group?: string;
  
  // Técnicas
  techniques_applied?: string[];
  modality?: string;
  
  // Funcional
  functional_score?: number;
  functional_limitations?: string;
  functional_goals?: string;
  
  // Sesión
  session_duration_minutes?: number;
  session_number?: number;
  total_sessions_planned?: number;
  
  // Flags
  is_initial_session?: boolean;
  is_reassessment?: boolean;
  treatment_continued?: boolean;
  
  // Consentimiento
  informed_consent?: boolean;
  consent_document_url?: string;
  
  // Notas
  notes?: string;
  private_notes?: string;
}
