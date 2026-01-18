-- ============================================
-- MÓDULO DE LABORATORIO - SCRIPT COMPLETO
-- ============================================

-- STEP 1: Fix profiles table
ALTER TABLE profiles ALTER COLUMN role TYPE VARCHAR(50);
UPDATE profiles SET role = 'admin' WHERE role IS NULL OR role = '';
UPDATE profiles SET role = 'doctor' WHERE role = 'medico';
UPDATE profiles SET role = 'pharmacy' WHERE role = 'farmacia';

-- STEP 2: Create ENUM types
DO $$ BEGIN CREATE TYPE lab_order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE lab_result_status AS ENUM ('pending', 'normal', 'abnormal', 'critical', 'reviewed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE lab_sample_type AS ENUM ('blood', 'urine', 'stool', 'tissue', 'fluid', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE lab_priority AS ENUM ('routine', 'urgent', 'stat', 'emergency'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- STEP 3: Create Tables
CREATE TABLE IF NOT EXISTS lab_test_catalog (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(50) NOT NULL UNIQUE, name VARCHAR(200) NOT NULL, description TEXT, category VARCHAR(100), sample_type lab_sample_type DEFAULT 'blood', container_type VARCHAR(100), volume_required VARCHAR(50), processing_time_hours INTEGER DEFAULT 24, price DECIMAL(10, 2), requires_fasting BOOLEAN DEFAULT FALSE, instructions TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

CREATE TABLE IF NOT EXISTS lab_parameters (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), test_id UUID NOT NULL REFERENCES lab_test_catalog(id) ON DELETE CASCADE, name VARCHAR(100) NOT NULL, unit VARCHAR(50), reference_min DECIMAL(10, 2), reference_max DECIMAL(10, 2), reference_text VARCHAR(100), method VARCHAR(100), sort_order INTEGER DEFAULT 0, is_critical_below DECIMAL(10, 2), is_critical_above DECIMAL(10, 2), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

CREATE TABLE IF NOT EXISTS lab_orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_number VARCHAR(50) NOT NULL UNIQUE, patient_id UUID NOT NULL REFERENCES patients(id), doctor_id UUID REFERENCES profiles(id), order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), priority lab_priority DEFAULT 'routine', status lab_order_status DEFAULT 'pending', notes TEXT, total_amount DECIMAL(10, 2), payment_status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

CREATE TABLE IF NOT EXISTS lab_order_details (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE, test_id UUID NOT NULL REFERENCES lab_test_catalog(id), sample_collected BOOLEAN DEFAULT FALSE, sample_collected_at TIMESTAMP WITH TIME ZONE, sample_id VARCHAR(100), collected_by UUID REFERENCES profiles(id), notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

CREATE TABLE IF NOT EXISTS lab_results (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), order_detail_id UUID NOT NULL REFERENCES lab_order_details(id) ON DELETE CASCADE, parameter_id UUID NOT NULL REFERENCES lab_parameters(id), value_text TEXT, value_numeric DECIMAL(15, 5), status lab_result_status DEFAULT 'pending', result_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), reviewed_by UUID REFERENCES profiles(id), reviewed_at TIMESTAMP WITH TIME ZONE, notes TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

CREATE TABLE IF NOT EXISTS lab_result_attachments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), result_id UUID NOT NULL REFERENCES lab_results(id) ON DELETE CASCADE, file_name VARCHAR(255) NOT NULL, file_type VARCHAR(100), file_size INTEGER, storage_path TEXT NOT NULL, description TEXT, uploaded_by UUID REFERENCES profiles(id), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- STEP 4: Create Indexes
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_date ON lab_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_lab_order_details_order ON lab_order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_order_detail ON lab_results(order_detail_id);
CREATE INDEX IF NOT EXISTS idx_lab_test_catalog_code ON lab_test_catalog(code);

-- STEP 5: Create Functions
CREATE OR REPLACE FUNCTION generate_lab_order_number() RETURNS VARCHAR(50) AS $$ DECLARE order_count INTEGER; year_prefix VARCHAR(4); BEGIN year_prefix := EXTRACT(YEAR FROM NOW())::VARCHAR; SELECT COUNT(*) + 1 INTO order_count FROM lab_orders; RETURN 'LAB-' || year_prefix || '-' || LPAD(order_count::VARCHAR, 6, '0'); END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_lab_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- STEP 6: Create Triggers
DROP TRIGGER IF EXISTS update_lab_catalog_timestamp ON lab_test_catalog;
DROP TRIGGER IF EXISTS update_lab_orders_timestamp ON lab_orders;
DROP TRIGGER IF EXISTS update_lab_results_timestamp ON lab_results;

CREATE TRIGGER update_lab_catalog_timestamp BEFORE UPDATE ON lab_test_catalog FOR EACH ROW EXECUTE FUNCTION update_lab_timestamp();
CREATE TRIGGER update_lab_orders_timestamp BEFORE UPDATE ON lab_orders FOR EACH ROW EXECUTE FUNCTION update_lab_timestamp();
CREATE TRIGGER update_lab_results_timestamp BEFORE UPDATE ON lab_results FOR EACH ROW EXECUTE FUNCTION update_lab_timestamp();

-- STEP 7: Insert Sample Data
INSERT INTO lab_test_catalog (code, name, description, category, sample_type, price, is_active) VALUES
('HEMO-001', 'Hemograma Completo', 'Conteo completo de celulas sangre', 'Hematologia', 'blood', 25.00, TRUE),
('HEMO-002', 'Velocidad de Sedimentacion', 'Prueba de inflamacion', 'Hematologia', 'blood', 15.00, TRUE),
('QUIM-001', 'Glucosa', 'Nivel de azucar en sangre', 'Quimica Clinica', 'blood', 12.00, TRUE),
('QUIM-002', 'Hemoglobina Glicosilada', 'Control diabetes', 'Quimica Clinica', 'blood', 35.00, TRUE),
('QUIM-003', 'Creatinina', 'Funcion renal', 'Quimica Clinica', 'blood', 15.00, TRUE),
('QUIM-004', 'Nitrogeno Ureico', 'Funcion renal', 'Quimica Clinica', 'blood', 15.00, TRUE),
('QUIM-005', 'Colesterol Total', 'Perfil lipidico', 'Quimica Clinica', 'blood', 20.00, TRUE),
('QUIM-006', 'Trigliceridos', 'Perfil lipidico', 'Quimica Clinica', 'blood', 22.00, TRUE),
('QUIM-007', 'Transaminasa GOT', 'Funcion hepatica', 'Quimica Clinica', 'blood', 18.00, TRUE),
('QUIM-008', 'Transaminasa GPT', 'Funcion hepatica', 'Quimica Clinica', 'blood', 18.00, TRUE),
('ORIN-001', 'Analisis Completo de Orina', 'Evaluacion orina', 'Urologia', 'urine', 18.00, TRUE),
('INMU-001', 'Prueba Rapida COVID-19', 'Deteccion COVID', 'Inmunologia', 'blood', 45.00, TRUE),
('INMU-002', 'Prueba de Embarazo', 'Gonadotropina', 'Inmunologia', 'urine', 20.00, TRUE),
('MICR-001', 'Cultivo de Orina', 'Urocultivo', 'Microbiologia', 'urine', 35.00, TRUE),
('MICR-002', 'Cultivo de Garganta', 'Faringe', 'Microbiologia', 'tissue', 35.00, TRUE);

INSERT INTO lab_parameters (test_id, name, unit, reference_min, reference_max, sort_order) VALUES
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Leucocitos', 'x10³/µL', 4.5, 11.0, 1),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Eritrocitos', 'x10⁶/µL', 4.5, 5.5, 2),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Hemoglobina', 'g/dL', 12.0, 16.0, 3),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Hematocrito', '%', 36.0, 46.0, 4),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Plaquetas', 'x10³/µL', 150, 400, 5),
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-001'), 'Glucosa', 'mg/dL', 70, 100, 1);

-- STEP 8: Create RLS Policies
ALTER TABLE lab_test_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lab staff can view catalog" ON lab_test_catalog FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Lab staff can view orders" ON lab_orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin', 'doctor', 'medico', 'enfermera', 'nurse'))
);

CREATE POLICY "Lab staff can insert orders" ON lab_orders FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin', 'doctor', 'medico'))
);

CREATE POLICY "Lab staff can update orders" ON lab_orders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin', 'doctor', 'medico'))
);

CREATE POLICY "Lab staff can view details" ON lab_order_details FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin', 'doctor', 'medico', 'enfermera', 'nurse'))
);

CREATE POLICY "Lab staff can insert details" ON lab_order_details FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin', 'doctor', 'medico'))
);

CREATE POLICY "Lab staff can view results" ON lab_results FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin', 'doctor', 'medico'))
);

CREATE POLICY "Lab staff can insert results" ON lab_results FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin'))
);

CREATE POLICY "Lab staff can update results" ON lab_results FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin'))
);

-- STEP 9: Verification
SELECT 'Lab Test Catalog: ' || COUNT(*)::varchar as catalog_count FROM lab_test_catalog;
SELECT 'Lab Parameters: ' || COUNT(*)::varchar as parameters_count FROM lab_parameters;
