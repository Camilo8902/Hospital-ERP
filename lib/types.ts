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
  doctor_id?: string;
  medication_id?: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity_prescribed: number;
  quantity_dispensed: number;
  refills_allowed: number;
  refills_used: number;
  instructions?: string;
  status: 'pending' | 'partially_dispensed' | 'dispensed' | 'cancelled' | 'expired';
  prescribed_date: string;
  dispensed_date?: string;
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
