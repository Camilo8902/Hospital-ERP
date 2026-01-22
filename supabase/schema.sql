-- =====================================================
-- MEDICORE ERP - Esquema de Base de Datos
-- Sistema de Gestión Hospitalaria
-- =====================================================

-- =====================================================
-- TIPOS ENUMERADOS
-- =====================================================

-- Roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'nurse', 'reception', 'pharmacy');

-- Estados de cita
CREATE TYPE appointment_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show');

-- Estados de factura
CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- Géneros
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- =====================================================
-- TABLA: profiles (Extiende auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'reception' NOT NULL,
  specialty TEXT,
  license_number TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: patients
-- =====================================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  dob DATE NOT NULL,
  gender gender_type,
  address TEXT,
  city TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  blood_type TEXT,
  allergies TEXT[],
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: departments
-- =====================================================
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  phone_extension TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: rooms
-- =====================================================
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  room_type TEXT NOT NULL CHECK (room_type IN ('consultation', 'emergency', 'surgery', 'recovery', 'hospitalization', 'imaging', 'laboratory')),
  capacity INTEGER DEFAULT 1,
  current_occupancy INTEGER DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: appointments
-- =====================================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id),
  room_id UUID REFERENCES public.rooms(id),
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency', 'procedure', 'imaging', 'laboratory', 'surgery')),
  status appointment_status DEFAULT 'scheduled' NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: medical_records (Historia Clínica)
-- =====================================================
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visit_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('consultation', 'progress_note', 'procedure', 'discharge', 'referral', 'lab_result', 'imaging_result')),
  
  -- Datos clínicos
  chief_complaint TEXT,
  history_of_present_illness TEXT,
  physical_examination TEXT,
  vital_signs JSONB DEFAULT '{}',
  diagnosis JSONB DEFAULT '[]',
  icd_codes TEXT[],
  treatment_plan TEXT,
  prescriptions TEXT,
  recommendations TEXT,
  
  -- Notas estructuradas
  notes TEXT,
  private_notes TEXT,
  
  -- Seguimiento
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: inventory (Inventario y Farmacia)
-- =====================================================
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('medication', 'equipment', 'supplies', 'consumables', 'lab_supplies', 'office')),
  subcategory TEXT,
  unit TEXT NOT NULL,
  quantity INTEGER DEFAULT 0 NOT NULL,
  min_stock INTEGER DEFAULT 0 NOT NULL,
  max_stock INTEGER,
  unit_cost DECIMAL(10, 2) DEFAULT 0,
  unit_price DECIMAL(10, 2) DEFAULT 0,
  supplier TEXT,
  manufacturer TEXT,
  expiration_date DATE,
  batch_number TEXT,
  storage_location TEXT,
  requires_prescription BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: prescriptions (Recetas Médicas)
-- =====================================================
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  medication_id UUID REFERENCES public.inventory(id),
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  quantity_prescribed INTEGER NOT NULL,
  quantity_dispensed INTEGER DEFAULT 0,
  refills_allowed INTEGER DEFAULT 0,
  refills_used INTEGER DEFAULT 0,
  instructions TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partially_dispensed', 'dispensed', 'cancelled', 'expired')),
  prescribed_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  dispensed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: inventory_transactions (Movimientos de Inventario)
-- =====================================================
CREATE TABLE public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'transfer', 'return', 'disposal', 'prescription_dispense', 'sale')),
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: invoices (Facturación)
-- =====================================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  status invoice_status DEFAULT 'pending' NOT NULL,
  subtotal DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  payment_method TEXT,
  payment_reference TEXT,
  items JSONB DEFAULT '[]' NOT NULL,
  notes TEXT,
  due_date DATE NOT NULL,
  issued_date DATE DEFAULT CURRENT_DATE NOT NULL,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: invoice_items (Detalle de Facturas)
-- =====================================================
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  service_code TEXT,
  quantity INTEGER DEFAULT 1 NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: audit_logs (Logs de Auditoría)
-- =====================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TABLA: notifications (Notificaciones)
-- =====================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('appointment', 'prescription', 'inventory', 'billing', 'system')),
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================
CREATE INDEX idx_patients_name ON public.patients(last_name, first_name);
CREATE INDEX idx_patients_mrn ON public.patients(medical_record_number);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(start_time);
CREATE INDEX idx_medical_records_patient ON public.medical_records(patient_id);
CREATE INDEX idx_medical_records_date ON public.medical_records(visit_date);
CREATE INDEX idx_inventory_sku ON public.inventory(sku);
CREATE INDEX idx_inventory_category ON public.inventory(category);
CREATE INDEX idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_status ON public.prescriptions(status);
CREATE INDEX idx_invoices_patient ON public.invoices(patient_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- =====================================================
-- FUNCIONES ÚTILES
-- =====================================================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at automático
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar número de historia clínica único
CREATE OR REPLACE FUNCTION generate_medical_record_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.medical_record_number IS NULL THEN
    NEW.medical_record_number := 'MRN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
      LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_patient_mrn BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION generate_medical_record_number();

-- Función para generar número de factura único
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(FLOOR(RANDOM() * 100000)::TEXT, 6, '0');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_invoice_number BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS - PROFILES
-- =====================================================

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Los administradores pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Los administradores pueden actualizar perfiles
CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================================================
-- POLÍTICAS RLS - PATIENTS
-- =====================================================

-- Todos los usuarios autenticados pueden ver pacientes
CREATE POLICY "All users can view patients" ON public.patients
  FOR SELECT USING (auth.role() IS NOT NULL);

-- Doctors, Nurses, Reception pueden actualizar pacientes
CREATE POLICY "Medical staff can update patients" ON public.patients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'doctor', 'nurse', 'reception')
    )
  );

-- Admin y Reception pueden insertar pacientes
CREATE POLICY "Admin and Reception can insert patients" ON public.patients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'reception')
    )
  );

-- =====================================================
-- POLÍTICAS RLS - APPOINTMENTS
-- =====================================================

-- Todos los usuarios pueden ver citas
CREATE POLICY "All users can view appointments" ON public.appointments
  FOR SELECT USING (auth.role() IS NOT NULL);

-- Reception y Admin pueden gestionar citas
CREATE POLICY "Reception and Admin can manage appointments" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'reception')
    )
  );

-- Doctores pueden ver y actualizar sus citas asignadas
CREATE POLICY "Doctors can manage their appointments" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'doctor')
    )
  );

-- =====================================================
-- POLÍTICAS RLS - MEDICAL_RECORDS
-- =====================================================

-- Solo personal médico puede ver historia clínica
CREATE POLICY "Medical staff can view records" ON public.medical_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'doctor', 'nurse')
    )
  );

-- Solo doctores pueden crear/actualizar historia clínica
CREATE POLICY "Doctors can manage records" ON public.medical_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'doctor')
    )
  );

-- Nurses pueden actualizar con notas limitadas
CREATE POLICY "Nurses can update records" ON public.medical_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'doctor', 'nurse')
    )
  );

-- =====================================================
-- POLÍTICAS RLS - INVENTORY
-- =====================================================

-- Todos pueden ver inventario
CREATE POLICY "All users can view inventory" ON public.inventory
  FOR SELECT USING (auth.role() IS NOT NULL);

-- Pharmacy y Admin pueden gestionar inventario
CREATE POLICY "Pharmacy and Admin can manage inventory" ON public.inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'pharmacy')
    )
  );

-- =====================================================
-- POLÍTICAS RLS - PRESCRIPTIONS
-- =====================================================

-- Personal médico puede ver recetas
CREATE POLICY "Medical staff can view prescriptions" ON public.prescriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'doctor', 'nurse', 'pharmacy')
    )
  );

-- Doctores pueden crear recetas
CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'doctor')
    )
  );

-- Pharmacy puede dispensar recetas
CREATE POLICY "Pharmacy can dispense prescriptions" ON public.prescriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'pharmacy')
    )
  );

-- =====================================================
-- POLÍTICAS RLS - INVOICES
-- =====================================================

-- Reception y Admin pueden ver y gestionar facturas
CREATE POLICY "Reception and Admin can manage invoices" ON public.invoices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'reception')
    )
  );

-- =====================================================
-- POLÍTICAS RLS - AUDIT_LOGS
-- =====================================================

-- Solo admin puede ver logs de auditoría
CREATE POLICY "Admin can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- POLÍTICAS RLS - NOTIFICATIONS
-- =====================================================

-- Usuarios ven sus propias notificaciones
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- DATOS DE SEED (Datos de Prueba)
-- =====================================================

-- Insertar departamentos
INSERT INTO public.departments (name, code, description, location) VALUES
('Medicina General', 'MG', 'Consultas de medicina general', 'Piso 1 - Ala A'),
('Cardiología', 'CAR', 'Especialidad cardíaca', 'Piso 2 - Ala B'),
('Pediatría', 'PED', 'Medicina infantil', 'Piso 1 - Ala C'),
('Cirugía General', 'CG', 'Procedimientos quirúrgicos', 'Piso 3 - Ala A'),
('Urgencias', 'URG', 'Atención de emergencias', 'Planta Baja'),
('Laboratorio', 'LAB', 'Análisis clínicos', 'Planta Baja - Ala B'),
('Radiología', 'RAD', 'Imágenes médicas', 'Piso 2 - Ala C'),
('Farmacia', 'FAR', 'Dispensación de medicamentos', 'Planta Baja - Ala C');

-- Insertar habitaciones
INSERT INTO public.rooms (room_number, department_id, room_type, capacity, status) VALUES
-- Medicina General
('MG-101', (SELECT id FROM public.departments WHERE code = 'MG'), 'consultation', 1, 'available'),
('MG-102', (SELECT id FROM public.departments WHERE code = 'MG'), 'consultation', 1, 'available'),
('MG-103', (SELECT id FROM public.departments WHERE code = 'MG'), 'consultation', 1, 'occupied'),
-- Cardiología
('CAR-201', (SELECT id FROM public.departments WHERE code = 'CAR'), 'consultation', 1, 'available'),
('CAR-202', (SELECT id FROM public.departments WHERE code = 'CAR'), 'imaging', 1, 'available'),
-- Urgencias
('URG-001', (SELECT id FROM public.departments WHERE code = 'URG'), 'emergency', 1, 'available'),
('URG-002', (SELECT id FROM public.departments WHERE code = 'URG'), 'emergency', 1, 'occupied'),
('URG-003', (SELECT id FROM public.departments WHERE code = 'URG'), 'emergency', 1, 'available'),
-- Quirófanos
('CIR-301', (SELECT id FROM public.departments WHERE code = 'CG'), 'surgery', 1, 'available'),
('CIR-302', (SELECT id FROM public.departments WHERE code = 'CG'), 'surgery', 1, 'reserved');

-- Insertar inventario (medicamentos)
INSERT INTO public.inventory (sku, name, description, category, unit, quantity, min_stock, unit_cost, unit_price, storage_location) VALUES
-- Medicamentos
('MED001', 'Paracetamol 500mg', 'Analgésico y antipirético', 'medication', 'tableta', 5000, 500, 0.10, 0.50, 'A-01-01'),
('MED002', 'Ibuprofeno 400mg', 'AINEs - Antiinflamatorio', 'medication', 'tableta', 3000, 300, 0.15, 0.75, 'A-01-02'),
('MED003', 'Amoxicilina 500mg', 'Antibiótico de amplio espectro', 'medication', 'cápsula', 1500, 200, 0.25, 1.25, 'A-02-01'),
('MED004', 'Metformina 850mg', 'Antidiabético oral', 'medication', 'tableta', 2000, 200, 0.20, 1.00, 'A-02-02'),
('MED005', 'Enalapril 10mg', 'IECAs - Antihipertensivo', 'medication', 'tableta', 2500, 250, 0.18, 0.90, 'A-03-01'),
('MED006', 'Omeprazol 20mg', 'Inhibidor de bomba de protones', 'medication', 'cápsula', 1800, 180, 0.30, 1.50, 'A-03-02'),
('MED007', 'Losartán 50mg', 'ARA-II - Antihipertensivo', 'medication', 'tableta', 2200, 220, 0.22, 1.10, 'A-04-01'),
('MED008', 'Aspirina 100mg', 'Antiagregante plaquetario', 'medication', 'tableta', 3000, 300, 0.08, 0.40, 'A-04-02'),
-- Insumos
('INS001', 'Guantes de látex M', 'Guantes examen tamaño mediano', 'supplies', 'caja', 150, 20, 8.00, 12.00, 'B-01-01'),
('INS002', 'Jeringas 5ml', 'Jeringas descartables 5ml', 'supplies', 'unidad', 5000, 500, 0.15, 0.25, 'B-02-01'),
('INS003', 'Algodón 500g', 'Algodón hidrofílico', 'supplies', 'paquete', 200, 30, 3.00, 5.00, 'B-03-01'),
('INS004', 'Vendas elásticas', 'Vendas 10cm elásticas', 'supplies', 'unidad', 300, 40, 2.50, 4.00, 'B-04-01');

-- Insertar pacientes de prueba
INSERT INTO public.patients (first_name, last_name, email, phone, dob, gender, address, emergency_contact_name, emergency_contact_phone, blood_type, allergies, insurance_provider) VALUES
('Juan Carlos', 'Pérez García', 'juan.perez@email.com', '+52 555 123 4567', '1985-03-15', 'male', 'Av. Principal 123, Col. Centro', 'María Pérez', '+52 555 987 6543', 'O+', ARRAY['Penicilina'], 'Seguros Monterrey'),
('María Elena', 'Rodríguez López', 'maria.rodriguez@email.com', '+52 555 234 5678', '1990-07-22', 'female', 'Calle Secundaria 456, Col. Norte', 'José Rodríguez', '+52 555 876 5432', 'A+', NULL, 'AXA Seguros'),
('Roberto', 'Sánchez Hernández', 'roberto.sanchez@email.com', '+52 555 345 6789', '1978-11-08', 'male', 'Boulevard Central 789, Col. Oeste', 'Ana Sánchez', '+52 555 765 4321', 'B-', ARRAY['Sulfa', 'Aspirina'], 'GNP'),
('Ana Lucía', 'Martínez Torres', 'ana.martinez@email.com', '+52 555 456 7890', '1995-05-30', 'female', 'Avenida del Parque 321, Col. Este', 'Carlos Martínez', '+52 555 654 3210', 'AB+', ARRAY['Latex'], 'Seguros Bancomer'),
('Francisco', 'Gómez Ruiz', 'francisco.gomez@email.com', '+52 555 567 8901', '1965-09-12', 'male', 'Calle del Mercado 654, Col. Sur', 'Rosa Gómez', '+52 555 543 2109', 'O-', NULL, 'MetLife'),
('Sofía', 'Díaz Mendoza', 'sofia.diaz@email.com', '+52 555 678 9012', '2000-01-25', 'female', 'Plaza Mayor 987, Col. Centro', 'Pedro Díaz', '+52 555 432 1098', 'A+', ARRAY['Ibuprofeno'], 'Seguros Monterrey'),
('Miguel Ángel', 'Ramírez Castillo', 'miguel.ramirez@email.com', '+52 555 789 0123', '1982-08-18', 'male', 'Urbanización Norte 147, Col. Residencial', 'Laura Ramírez', '+52 555 321 0987', 'B+', NULL, 'AXA Seguros'),
('Elena', 'Vargas Peña', 'elena.vargas@email.com', '+52 555 890 1234', '1972-04-03', 'female', 'Residencial del Valle 258, Col. Empresarial', 'Jorge Vargas', '+52 555 210 9876', 'O+', ARRAY['Penicilina', 'Sulfa'], 'GNP');

-- Insertar citas de prueba
INSERT INTO public.appointments (patient_id, doctor_id, department_id, room_id, appointment_type, status, start_time, end_time, reason) VALUES
-- Citas de hoy
((SELECT id FROM public.patients WHERE last_name = 'Pérez'), NULL, (SELECT id FROM public.departments WHERE code = 'MG'), (SELECT id FROM public.rooms WHERE room_number = 'MG-101'), 'consultation', 'scheduled', NOW() + INTERVAL '1 hour', NOW() + INTERVAL '1 hour 30 minutes', 'Dolor de cabeza persistente'),
((SELECT id FROM public.patients WHERE last_name = 'Rodríguez'), NULL, (SELECT id FROM public.departments WHERE code = 'CAR'), (SELECT id FROM public.rooms WHERE room_number = 'CAR-201'), 'consultation', 'scheduled', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '2 hours 30 minutes', 'Chequeo cardíaco anual'),
((SELECT id FROM public.patients WHERE last_name = 'Sánchez'), NULL, (SELECT id FROM public.departments WHERE code = 'URG'), (SELECT id FROM public.rooms WHERE room_number = 'URG-001'), 'emergency', 'in_progress', NOW(), NOW() + INTERVAL '2 hours', 'Dolor torácico'),
-- Citas futuras
((SELECT id FROM public.patients WHERE last_name = 'Martínez'), NULL, (SELECT id FROM public.departments WHERE code = 'PED'), (SELECT id FROM public.rooms WHERE room_number = 'MG-102'), 'follow_up', 'scheduled', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 30 minutes', 'Seguimiento de tratamiento'),
((SELECT id FROM public.patients WHERE last_name = 'Gómez'), NULL, (SELECT id FROM public.departments WHERE code = 'MG'), (SELECT id FROM public.rooms WHERE room_number = 'MG-103'), 'consultation', 'scheduled', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 30 minutes', 'Revisión general');

-- Insertar historia clínica de ejemplo
INSERT INTO public.medical_records (patient_id, doctor_id, visit_date, record_type, chief_complaint, diagnosis, treatment_plan, vital_signs) VALUES
((SELECT id FROM public.patients WHERE last_name = 'Pérez'), NULL, NOW() - INTERVAL '7 days', 'consultation', 
'Fiebre y tos seca por 3 días',
'["Infección respiratoria aguda"]',
'Reposo, líquidos, paracetamol 500mg cada 8 horas',
'{"blood_pressure": "120/80", "heart_rate": 72, "temperature": 37.8, "weight": 75}'),
((SELECT id FROM public.patients WHERE last_name = 'Rodríguez'), NULL, NOW() - INTERVAL '30 days', 'consultation',
'Control cardiológico anual',
'["Paciente sano", "Ligera hipertensión stage 1"]',
'Continuar con dieta baja en sal, ejercicio regular, control mensual',
'{"blood_pressure": "140/90", "heart_rate": 68, "temperature": 36.5, "weight": 70}');

-- Insertar recetas de ejemplo
INSERT INTO public.prescriptions (medical_record_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, quantity_prescribed, status) VALUES
((SELECT id FROM public.medical_records WHERE patient_id = (SELECT id FROM public.patients WHERE last_name = 'Pérez') ORDER BY created_at DESC LIMIT 1),
(SELECT id FROM public.patients WHERE last_name = 'Pérez'),
NULL,
'Paracetamol 500mg',
'1 tableta',
'Cada 8 horas',
'5 días',
15,
'dispensed'),
((SELECT id FROM public.medical_records WHERE patient_id = (SELECT id FROM public.patients WHERE last_name = 'Rodríguez') ORDER BY created_at DESC LIMIT 1),
(SELECT id FROM public.patients WHERE last_name = 'Rodríguez'),
NULL,
'Enalapril 10mg',
'1 tableta',
'Una vez al día',
'30 días',
30,
'pending');

-- Insertar factura de ejemplo
INSERT INTO public.invoices (patient_id, status, subtotal, total_amount, due_date, items) VALUES
((SELECT id FROM public.patients WHERE last_name = 'Pérez'), 'pending', 450.00, 450.00, NOW() + INTERVAL '30 days',
'[{"description": "Consulta médica general", "quantity": 1, "unit_price": 250}, {"description": "Análisis de sangre completo", "quantity": 1, "unit_price": 200}]');

-- =====================================================
-- FUNCIONES Y TRIGGER PARA AUDITORÍA
-- =====================================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL, current_setting('request.header', true), current_setting('request.header', true));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), to_jsonb(NEW), current_setting('request.header', true), current_setting('request.header', true));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW), current_setting('request.header', true), current_setting('request.header', true));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Crear triggers de auditoría para tablas sensibles
CREATE TRIGGER audit_medical_records AFTER INSERT OR UPDATE OR DELETE ON public.medical_records
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =====================================================
-- POLICY PARA auth.users (Permitir creación de perfiles)
-- =====================================================

CREATE POLICY "Users can create their own profile" ON auth.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON auth.users
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'reception');
  RETURN NEW;
END;
$$ language plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
