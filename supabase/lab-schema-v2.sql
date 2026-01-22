-- ============================================
-- MÓDULO DE LABORATORIO COMPLETO v2 (CORREGIDO v3)
-- Catálogo Extenso de Pruebas Médicas
-- ============================================

-- ============================================
-- STEP 1: Fix profiles table - Change role column from ENUM to VARCHAR
-- IMPORTANTE: Primero modificar la tabla profiles antes de crear nuevas tablas
-- ============================================

-- Primero eliminar el tipo ENUM si existe (esto NO afecta políticas)
DROP TYPE IF EXISTS user_role CASCADE;

-- Luego alterar la columna (si ya es VARCHAR esto no causará error)
-- Nota: Si hay políticas existentes que dependen de 'role',，我们需要先处理它们
-- Pero como aún no hemos creado las tablas del laboratorio, no hay políticas en ellas
ALTER TABLE profiles ALTER COLUMN role TYPE VARCHAR(50);

UPDATE profiles SET role = 'admin' WHERE role IS NULL OR role = '';
UPDATE profiles SET role = 'doctor' WHERE role = 'medico';
UPDATE profiles SET role = 'pharmacy' WHERE role = 'farmacia';

-- ============================================
-- STEP 2: Create ENUM types for the Laboratory Module
-- ============================================

DO $$ BEGIN
    CREATE TYPE lab_order_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lab_result_status AS ENUM ('pending', 'normal', 'abnormal', 'critical', 'reviewed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lab_sample_type AS ENUM ('blood', 'urine', 'stool', 'tissue', 'fluid', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lab_priority AS ENUM ('routine', 'urgent', 'stat', 'emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- STEP 3: Create Laboratory Tables
-- ============================================

-- Lab Test Categories
CREATE TABLE IF NOT EXISTS lab_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    sample_type lab_sample_type DEFAULT 'blood',
    color VARCHAR(20) DEFAULT 'blue',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab Test Catalog
CREATE TABLE IF NOT EXISTS lab_test_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES lab_categories(id),
    sample_type lab_sample_type DEFAULT 'blood',
    container_type VARCHAR(100),
    volume_required VARCHAR(50),
    processing_time_hours INTEGER DEFAULT 24,
    price DECIMAL(10, 2),
    requires_fasting BOOLEAN DEFAULT FALSE,
    instructions TEXT,
    preparation TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab Parameters
CREATE TABLE IF NOT EXISTS lab_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES lab_test_catalog(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    unit VARCHAR(50),
    reference_min DECIMAL(10, 2),
    reference_max DECIMAL(10, 2),
    reference_text VARCHAR(200),
    method VARCHAR(100),
    sort_order INTEGER DEFAULT 0,
    is_critical_below DECIMAL(10, 2),
    is_critical_above DECIMAL(10, 2),
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab Orders
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID REFERENCES profiles(id),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    priority lab_priority DEFAULT 'routine',
    status lab_order_status DEFAULT 'pending',
    notes TEXT,
    total_amount DECIMAL(10, 2),
    payment_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab Order Details
CREATE TABLE IF NOT EXISTS lab_order_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    test_id UUID REFERENCES lab_test_catalog(id),
    is_custom BOOLEAN DEFAULT FALSE,
    custom_name VARCHAR(200),
    custom_price DECIMAL(10, 2),
    custom_category_id UUID,
    sample_collected BOOLEAN DEFAULT FALSE,
    sample_collected_at TIMESTAMP WITH TIME ZONE,
    sample_id VARCHAR(100),
    collected_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab Results
CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_detail_id UUID NOT NULL REFERENCES lab_order_details(id) ON DELETE CASCADE,
    parameter_id UUID REFERENCES lab_parameters(id),
    value_text TEXT,
    value_numeric DECIMAL(15, 5),
    status lab_result_status DEFAULT 'pending',
    result_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab Result Attachments
CREATE TABLE IF NOT EXISTS lab_result_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    result_id UUID NOT NULL REFERENCES lab_results(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    storage_path TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lab_categories_sort ON lab_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_lab_test_catalog_category ON lab_test_catalog(category_id);
CREATE INDEX IF NOT EXISTS idx_lab_test_catalog_code ON lab_test_catalog(code);
CREATE INDEX IF NOT EXISTS idx_lab_parameters_test ON lab_parameters(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_order_details_order ON lab_order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_order_detail ON lab_results(order_detail_id);

-- ============================================
-- STEP 5: Create Functions
-- ============================================

CREATE OR REPLACE FUNCTION generate_lab_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    order_count INTEGER;
    year_prefix VARCHAR(4);
BEGIN
    year_prefix := EXTRACT(YEAR FROM NOW())::VARCHAR;
    SELECT COUNT(*) + 1 INTO order_count FROM lab_orders;
    RETURN 'LAB-' || year_prefix || '-' || LPAD(order_count::VARCHAR, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_lab_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: Create Triggers
-- ============================================

DROP TRIGGER IF EXISTS update_lab_catalog_timestamp ON lab_test_catalog;
DROP TRIGGER IF EXISTS update_lab_orders_timestamp ON lab_orders;
DROP TRIGGER IF EXISTS update_lab_results_timestamp ON lab_results;

CREATE TRIGGER update_lab_catalog_timestamp
    BEFORE UPDATE ON lab_test_catalog
    FOR EACH ROW EXECUTE FUNCTION update_lab_timestamp();

CREATE TRIGGER update_lab_orders_timestamp
    BEFORE UPDATE ON lab_orders
    FOR EACH ROW EXECUTE FUNCTION update_lab_timestamp();

CREATE TRIGGER update_lab_results_timestamp
    BEFORE UPDATE ON lab_results
    FOR EACH ROW EXECUTE FUNCTION update_lab_timestamp();

-- ============================================
-- STEP 7: Insert Categories
-- ============================================

INSERT INTO lab_categories (name, code, description, sample_type, color, sort_order, is_active) VALUES
('Hematología', 'HEMO', 'Análisis de células sangre y coagulación', 'blood', 'red', 1, TRUE),
('Química Clínica', 'QUIM', 'Análisis bioquímicos de sangre', 'blood', 'green', 2, TRUE),
('Urología', 'ORIN', 'Análisis de orina', 'urine', 'yellow', 3, TRUE),
('Inmunología', 'INMU', 'Pruebas inmunológicas', 'blood', 'purple', 4, TRUE),
('Microbiología', 'MICR', 'Cultivos y antibiogramas', 'tissue', 'orange', 5, TRUE),
('Serología', 'SERO', 'Pruebas serológicas', 'blood', 'pink', 6, TRUE),
('Endocrinología', 'ENDO', 'Hormonas y función endocrina', 'blood', 'cyan', 7, TRUE),
('Coagulación', 'COAG', 'Pruebas de coagulación', 'blood', 'red', 8, TRUE),
('Gasometría', 'GASO', 'Gases en sangre arterial', 'blood', 'blue', 9, TRUE),
('Electrolitos', 'ELEC', 'Electrolitos séricos', 'blood', 'yellow', 10, TRUE),
('Marcadores Cardíacos', 'CARD', 'Enzimas y marcadores cardíacos', 'blood', 'red', 11, TRUE),
('Marcadores Tumorales', 'TUMO', 'Marcadores de cáncer', 'blood', 'purple', 12, TRUE),
('Parasitología', 'PARA', 'Parásitos y huevos', 'stool', 'green', 13, TRUE),
('Toxicología', 'TOXI', 'Drogas y tóxicos', 'blood', 'gray', 14, TRUE),
('Vitaminas', 'VITA', 'Niveles de vitaminas', 'blood', 'orange', 15, TRUE);

-- ============================================
-- STEP 8: Insert Test Catalog
-- ============================================

-- HEMATOLOGÍA (8 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('HEMO-001', 'Hemograma Completo', 'Conteo completo de células sanguíneos con diferencial', (SELECT id FROM lab_categories WHERE code = 'HEMO'), 'blood', 25.00, TRUE),
('HEMO-002', 'Velocidad de Sedimentación', 'Prueba de inflamación inespecífica (VSG)', (SELECT id FROM lab_categories WHERE code = 'HEMO'), 'blood', 15.00, TRUE),
('HEMO-003', 'Grupo Sanguíneo y RH', 'Tipificación sanguínea ABO y Rh', (SELECT id FROM lab_categories WHERE code = 'HEMO'), 'blood', 20.00, TRUE),
('HEMO-004', 'Tiempo de Protrombina (TP)', 'Evaluación de vía extrínseca de coagulación', (SELECT id FROM lab_categories WHERE code = 'HEMO'), 'blood', 30.00, TRUE),
('HEMO-005', 'INR', 'Índice normalizado internacional para control anticoagulación', (SELECT id FROM lab_categories WHERE code = 'HEMO'), 'blood', 18.00, TRUE),
('HEMO-006', 'Tiempo de Tromboplastina (TTP)', 'Evaluación de vía intrínseca de coagulación', (SELECT id FROM lab_categories WHERE code = 'HEMO'), 'blood', 30.00, TRUE),
('HEMO-007', 'Recuento de Plaquetas', 'Conteo de plaquetas sanguíneo', (SELECT id FROM lab_categories WHERE code = 'HEMO'), 'blood', 12.00, TRUE),
('HEMO-008', 'Frotis de Sangre Periférico', 'Evaluación morfológica de células', (SELECT id FROM lab_categories WHERE code = 'HEMO'), 'blood', 35.00, TRUE);

-- QUÍMICA CLÍNICA (21 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, requires_fasting, is_active) VALUES
('QUIM-001', 'Glucosa en Ayunas', 'Nivel de azúcar en sangre en ayunas', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 12.00, TRUE, TRUE),
('QUIM-002', 'Hemoglobina Glicosilada (HbA1c)', 'Control metabólico de los últimos 3 meses', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 35.00, TRUE, TRUE),
('QUIM-003', 'Creatinina', 'Función renal', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 15.00, FALSE, TRUE),
('QUIM-004', 'Nitrógeno Ureico (BUN)', 'Función renal', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 15.00, FALSE, TRUE),
('QUIM-005', 'Ácido Úrico', 'Metabolismo de purinas', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 15.00, TRUE, TRUE),
('QUIM-006', 'Colesterol Total', 'Perfil lipídico total', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 20.00, TRUE, TRUE),
('QUIM-007', 'Colesterol HDL', 'Colesterol bueno', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 22.00, TRUE, TRUE),
('QUIM-008', 'Colesterol LDL', 'Colesterol malo calculado', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 22.00, TRUE, TRUE),
('QUIM-009', 'Triglicéridos', 'Grasas en sangre', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 22.00, TRUE, TRUE),
('QUIM-010', 'Transaminasa GOT (AST)', 'Función hepática', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 18.00, FALSE, TRUE),
('QUIM-011', 'Transaminasa GPT (ALT)', 'Función hepática', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 18.00, FALSE, TRUE),
('QUIM-012', 'Fosfatasa Alcalina', 'Función hepática y ósea', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 18.00, FALSE, TRUE),
('QUIM-013', 'Bilirrubina Total', 'Metabolismo biliar', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 15.00, FALSE, TRUE),
('QUIM-014', 'Bilirrubina Directa', 'Función hepática', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 15.00, FALSE, TRUE),
('QUIM-015', 'Proteínas Totales', 'Estado nutricional y hepático', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 15.00, FALSE, TRUE),
('QUIM-016', 'Albúmina', 'Proteína hepática principal', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 15.00, TRUE, TRUE),
('QUIM-017', 'Gammaglutamil Transferasa (GGT)', 'Función hepática y biliar', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 20.00, TRUE, TRUE),
('QUIM-018', 'Deshidrogenasa Láctica (LDH)', 'Daño celular generalize', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 18.00, TRUE, TRUE),
('QUIM-019', 'Amilasa', 'Función pancreática', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 25.00, TRUE, TRUE),
('QUIM-020', 'Lipasa', 'Función pancreática', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 28.00, TRUE, TRUE),
('QUIM-021', 'Bilirrubina Indirecta', 'Hemólisis', (SELECT id FROM lab_categories WHERE code = 'QUIM'), 'blood', 15.00, TRUE, TRUE);

-- UROLOGÍA (6 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('ORIN-001', 'Análisis de Orina Completo', 'Examen físico, químico y microscópico', (SELECT id FROM lab_categories WHERE code = 'ORIN'), 'urine', 18.00, TRUE),
('ORIN-002', 'Microalbuminuria', 'Detección temprana de daño renal', (SELECT id FROM lab_categories WHERE code = 'ORIN'), 'urine', 25.00, TRUE),
('ORIN-003', 'Proteinuria 24 Horas', 'Proteínas en orina de 24 horas', (SELECT id FROM lab_categories WHERE code = 'ORIN'), 'urine', 30.00, TRUE),
('ORIN-004', 'Creatinina en Orina', 'Función renal', (SELECT id FROM lab_categories WHERE code = 'ORIN'), 'urine', 15.00, TRUE),
('ORIN-005', 'Urocultivo', 'Cultivo bacteriano de orina', (SELECT id FROM lab_categories WHERE code = 'ORIN'), 'urine', 35.00, TRUE),
('ORIN-006', 'Sedimento Urinario', 'Análisis microscópico del sedimento', (SELECT id FROM lab_categories WHERE code = 'ORIN'), 'urine', 12.00, TRUE);

-- INMUNOLOGÍA (9 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('INMU-001', 'Proteína C Reactiva (PCR)', 'Inflamación aguda', (SELECT id FROM lab_categories WHERE code = 'INMU'), 'blood', 25.00, TRUE),
('INMU-002', 'Velocidad de Sedimentación (VSG)', 'Inflamación crónica', (SELECT id FROM lab_categories WHERE code = 'INMU'), 'blood', 15.00, TRUE),
('INMU-003', 'Factor Reumatoideo', 'Artritis reumatoide', (SELECT id FROM lab_categories WHERE code = 'INMU'), 'blood', 30.00, TRUE),
('INMU-004', 'Anticuerpos Antinucleares (ANA)', 'Enfermedades autoinmunes', (SELECT id FROM lab_categories WHERE code = 'INMU'), 'blood', 45.00, TRUE),
('INMU-005', 'Inmunoglobulina G (IgG)', 'Inmunidad humoral', (SELECT id FROM lab_categories WHERE code = 'INMU'), 'blood', 35.00, TRUE),
('INMU-006', 'Inmunoglobulina A (IgA)', 'Inmunidad mucosal', (SELECT id FROM lab_categories WHERE code = 'INMU'), 'blood', 35.00, TRUE),
('INMU-007', 'Inmunoglobulina M (IgM)', 'Respuesta inmune temprana', (SELECT id FROM lab_categories WHERE code = 'INMU'), 'blood', 35.00, TRUE),
('INMU-008', 'Complemento C3', 'Sistema de complemento', (SELECT id FROM lab_categories WHERE code = 'INMU'), 'blood', 30.00, TRUE),
('INMU-009', 'Complemento C4', 'Sistema de complemento', (SELECT id FROM lab_categories WHERE code = 'INMU'), 'blood', 30.00, TRUE);

-- MICROBIOLOGÍA (8 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('MICR-001', 'Cultivo de Orina', 'Urocultivo con identificación', (SELECT id FROM lab_categories WHERE code = 'MICR'), 'urine', 35.00, TRUE),
('MICR-002', 'Cultivo de Garganta', 'Faringe/amígdalas', (SELECT id FROM lab_categories WHERE code = 'MICR'), 'tissue', 35.00, TRUE),
('MICR-003', 'Cultivo de Expectoración', 'Muestra respiratoria', (SELECT id FROM lab_categories WHERE code = 'MICR'), 'fluid', 40.00, TRUE),
('MICR-004', 'Coprocultivo', 'Cultivo de heces', (SELECT id FROM lab_categories WHERE code = 'MICR'), 'stool', 40.00, TRUE),
('MICR-005', 'Hemocultivo', 'Cultivo de sangre', (SELECT id FROM lab_categories WHERE code = 'MICR'), 'blood', 65.00, TRUE),
('MICR-006', 'Antibiograma', 'Sensibilidad antibiótica', (SELECT id FROM lab_categories WHERE code = 'MICR'), 'other', 45.00, TRUE),
('MICR-007', 'Tinción de Gram', 'Tinción microscópica', (SELECT id FROM lab_categories WHERE code = 'MICR'), 'other', 20.00, TRUE),
('MICR-008', 'Ziehl-Neelsen (BAAR)', 'Detección de tuberculosis', (SELECT id FROM lab_categories WHERE code = 'MICR'), 'other', 25.00, TRUE);

-- SEROLOGÍA (11 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('SERO-001', 'VIH 1/2', 'Anticuerpos contra VIH', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'blood', 45.00, TRUE),
('SERO-002', 'Hepatitis B (HBsAg)', 'Antígeno de superficie hepatitis B', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'blood', 40.00, TRUE),
('SERO-003', 'Hepatitis C (VHC)', 'Anticuerpos hepatitis C', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'blood', 50.00, TRUE),
('SERO-004', 'VDRL/RPR', 'Prueba de sífilis', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'blood', 22.00, TRUE),
('SERO-005', 'Dengue NS1', 'Detección temprana dengue', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'blood', 55.00, TRUE),
('SERO-006', 'Dengue IgM/IgG', 'Anticuerpos dengue', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'blood', 45.00, TRUE),
('SERO-007', 'COVID-19 PCR', 'Prueba molecular COVID', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'tissue', 85.00, TRUE),
('SERO-008', 'COVID-19 Antígeno', 'Prueba rápida COVID', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'tissue', 35.00, TRUE),
('SERO-009', 'Helicobacter pylori', 'Infección gástrica', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'blood', 40.00, TRUE),
('SERO-010', 'Toxoplasma IgG/IgM', 'Infección toxoplasma', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'blood', 45.00, TRUE),
('SERO-011', 'Rubéola IgG/IgM', 'Inmunidad rubéola', (SELECT id FROM lab_categories WHERE code = 'SERO'), 'blood', 45.00, TRUE);

-- ENDOCRINOLOGÍA (13 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, requires_fasting, is_active) VALUES
('ENDO-001', 'TSH', 'Hormona estimulante tiroidea', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 35.00, TRUE, TRUE),
('ENDO-002', 'T4 Libre', 'Tiroxina libre', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 35.00, TRUE, TRUE),
('ENDO-003', 'T3 Libre', 'Triyodotironina libre', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 35.00, TRUE, TRUE),
('ENDO-004', 'Cortisol Matutino', 'Hormona del estrés', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 40.00, TRUE, TRUE),
('ENDO-005', 'Cortisol Vespertino', 'Hormona del estrés', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 40.00, TRUE, TRUE),
('ENDO-006', 'Insulina', 'Hormona reguladora glucosa', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 45.00, TRUE, TRUE),
('ENDO-007', 'Testosterona Total', 'Hormona masculina', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 40.00, FALSE, TRUE),
('ENDO-008', 'Estradiol', 'Hormona femenina', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 40.00, FALSE, TRUE),
('ENDO-009', 'Progesterona', 'Hormona de ovulación', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 40.00, FALSE, TRUE),
('ENDO-010', 'Prolactina', 'Hormona de lactation', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 35.00, FALSE, TRUE),
('ENDO-011', 'FSH', 'Hormona folículo estimulante', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 35.00, FALSE, TRUE),
('ENDO-012', 'LH', 'Hormona luteinizante', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 35.00, FALSE, TRUE),
('ENDO-013', 'Hormona de Crecimiento (GH)', 'Crecimiento', (SELECT id FROM lab_categories WHERE code = 'ENDO'), 'blood', 55.00, TRUE, TRUE);

-- ELECTROLITOS (7 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('ELEC-001', 'Sodio (Na+)', 'Electrolito principal', (SELECT id FROM lab_categories WHERE code = 'ELEC'), 'blood', 15.00, TRUE),
('ELEC-002', 'Potasio (K+)', 'Electrolito intracelular', (SELECT id FROM lab_categories WHERE code = 'ELEC'), 'blood', 15.00, TRUE),
('ELEC-003', 'Cloruro (Cl-)', 'Electrolito extracelular', (SELECT id FROM lab_categories WHERE code = 'ELEC'), 'blood', 15.00, TRUE),
('ELEC-004', 'Calcio Total', 'Mineral óseo', (SELECT id FROM lab_categories WHERE code = 'ELEC'), 'blood', 18.00, TRUE),
('ELEC-005', 'Calcio Ionizado', 'Calcio activo biológicamente', (SELECT id FROM lab_categories WHERE code = 'ELEC'), 'blood', 25.00, TRUE),
('ELEC-006', 'Magnesio', 'Cofactor enzimático', (SELECT id FROM lab_categories WHERE code = 'ELEC'), 'blood', 18.00, TRUE),
('ELEC-007', 'Fósforo', 'Metabolismo óseo', (SELECT id FROM lab_categories WHERE code = 'ELEC'), 'blood', 18.00, TRUE);

-- MARCADORES CARDÍACOS (6 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('CARD-001', 'Troponina I', 'Marcador de daño cardíaco', (SELECT id FROM lab_categories WHERE code = 'CARD'), 'blood', 65.00, TRUE),
('CARD-002', 'Troponina T', 'Marcador de daño cardíaco', (SELECT id FROM lab_categories WHERE code = 'CARD'), 'blood', 65.00, TRUE),
('CARD-003', 'CK-MB', 'Isoenzima cardíaca', (SELECT id FROM lab_categories WHERE code = 'CARD'), 'blood', 45.00, TRUE),
('CPK-001', 'CPK Total', 'Enzima muscular', (SELECT id FROM lab_categories WHERE code = 'CARD'), 'blood', 25.00, TRUE),
('CARD-005', 'Mioglobina', 'Proteína muscular', (SELECT id FROM lab_categories WHERE code = 'CARD'), 'blood', 40.00, TRUE),
('CARD-006', 'BNP (Péptido Natriurético)', 'Insuficiencia cardíaca', (SELECT id FROM lab_categories WHERE code = 'CARD'), 'blood', 75.00, TRUE);

-- MARCADORES TUMORALES (7 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('TUMO-001', 'PSA Total', 'Antígeno prostático', (SELECT id FROM lab_categories WHERE code = 'TUMO'), 'blood', 40.00, TRUE),
('TUMO-002', 'PSA Libre', 'Fracción libre PSA', (SELECT id FROM lab_categories WHERE code = 'TUMO'), 'blood', 45.00, TRUE),
('TUMO-003', 'CEA', 'Antígeno carcinoembrionario', (SELECT id FROM lab_categories WHERE code = 'TUMO'), 'blood', 50.00, TRUE),
('TUMO-004', 'CA-125', 'Marcador ovárico', (SELECT id FROM lab_categories WHERE code = 'TUMO'), 'blood', 55.00, TRUE),
('TUMO-005', 'CA 19-9', 'Marcador pancreático', (SELECT id FROM lab_categories WHERE code = 'TUMO'), 'blood', 55.00, TRUE),
('TUMO-006', 'AFP', 'Alfafetoproteína', (SELECT id FROM lab_categories WHERE code = 'TUMO'), 'blood', 50.00, TRUE),
('TUMO-007', 'CA 15-3', 'Marcador mamario', (SELECT id FROM lab_categories WHERE code = 'TUMO'), 'blood', 55.00, TRUE);

-- GASOMETRÍA (7 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('GASO-001', 'Gasometría Arterial', 'Análisis completo sangre arterial', (SELECT id FROM lab_categories WHERE code = 'GASO'), 'blood', 65.00, TRUE),
('GASO-002', 'pH Arterial', 'Equilibrio ácido-base', (SELECT id FROM lab_categories WHERE code = 'GASO'), 'blood', 25.00, TRUE),
('GASO-003', 'pCO2', 'Presión parcial CO2', (SELECT id FROM lab_categories WHERE code = 'GASO'), 'blood', 25.00, TRUE),
('GASO-004', 'pO2', 'Presión parcial O2', (SELECT id FROM lab_categories WHERE code = 'GASO'), 'blood', 25.00, TRUE),
('GASO-005', 'HCO3', 'Bicarbonato', (SELECT id FROM lab_categories WHERE code = 'GASO'), 'blood', 20.00, TRUE),
('GASO-006', 'Lactato', 'Ácido láctico', (SELECT id FROM lab_categories WHERE code = 'GASO'), 'blood', 35.00, TRUE),
('GASO-007', 'Saturación O2', 'Oxigenación', (SELECT id FROM lab_categories WHERE code = 'GASO'), 'blood', 20.00, TRUE);

-- COAGULACIÓN (6 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('COAG-001', 'Tiempo de Protrombina (PT)', 'Vía extrínseca', (SELECT id FROM lab_categories WHERE code = 'COAG'), 'blood', 30.00, TRUE),
('COAG-002', 'INR', 'Control anticoagulación', (SELECT id FROM lab_categories WHERE code = 'COAG'), 'blood', 18.00, TRUE),
('COAG-003', 'TTPK/TTP', 'Vía intrínseca', (SELECT id FROM lab_categories WHERE code = 'COAG'), 'blood', 35.00, TRUE),
('COAG-004', 'Fibrinógeno', 'Factor de coagulación', (SELECT id FROM lab_categories WHERE code = 'COAG'), 'blood', 40.00, TRUE),
('COAG-005', 'D-Dímero', 'Fibrinolisis', (SELECT id FROM lab_categories WHERE code = 'COAG'), 'blood', 45.00, TRUE),
('COAG-006', 'Tiempo de Sangría', 'Función plaquetaria', (SELECT id FROM lab_categories WHERE code = 'COAG'), 'other', 20.00, TRUE);

-- PARASITOLOGÍA (5 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('PARA-001', 'Coproparasitológico', 'Huevos y quistes de parásitos', (SELECT id FROM lab_categories WHERE code = 'PARA'), 'stool', 25.00, TRUE),
('PARA-002', 'Test de Graham', 'Oxiuros', (SELECT id FROM lab_categories WHERE code = 'PARA'), 'tissue', 15.00, TRUE),
('PARA-003', 'Sangre Oculta en Heces', 'Sangrado digestivo', (SELECT id FROM lab_categories WHERE code = 'PARA'), 'stool', 20.00, TRUE),
('PARA-004', 'Antigéno de Giardia', 'Detección rápida giardia', (SELECT id FROM lab_categories WHERE code = 'PARA'), 'stool', 35.00, TRUE),
('PARA-005', 'Frotis Rectal', 'Investigación amebiasis', (SELECT id FROM lab_categories WHERE code = 'PARA'), 'tissue', 20.00, TRUE);

-- TOXICOLOGÍA (6 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('TOXI-001', 'Nivel de Alcohol en Sangre', 'Etanol', (SELECT id FROM lab_categories WHERE code = 'TOXI'), 'blood', 40.00, TRUE),
('TOXI-002', 'Nivel de Plomo', 'Metal pesado', (SELECT id FROM lab_categories WHERE code = 'TOXI'), 'blood', 55.00, TRUE),
('TOXI-003', 'Panel de Drogas en Orina', 'Cannabis, coca, opiáceos', (SELECT id FROM lab_categories WHERE code = 'TOXI'), 'urine', 65.00, TRUE),
('TOXI-004', 'Carbamazepina', 'Nivel terapéutico', (SELECT id FROM lab_categories WHERE code = 'TOXI'), 'blood', 50.00, TRUE),
('TOXI-005', 'Valproato', 'Nivel terapéutico', (SELECT id FROM lab_categories WHERE code = 'TOXI'), 'blood', 50.00, TRUE),
('TOXI-006', 'Fenitoína', 'Nivel terapéutico', (SELECT id FROM lab_categories WHERE code = 'TOXI'), 'blood', 50.00, TRUE);

-- VITAMINAS (5 pruebas)
INSERT INTO lab_test_catalog (code, name, description, category_id, sample_type, price, is_active) VALUES
('VITA-001', 'Vitamina B12', 'Cobalamina', (SELECT id FROM lab_categories WHERE code = 'VITA'), 'blood', 50.00, TRUE),
('VITA-002', 'Ácido Fólico', 'Folate', (SELECT id FROM lab_categories WHERE code = 'VITA'), 'blood', 45.00, TRUE),
('VITA-003', 'Vitamina D Total', '25-OH vitamina D', (SELECT id FROM lab_categories WHERE code = 'VITA'), 'blood', 60.00, TRUE),
('VITA-004', 'Vitamina A', 'Retinol', (SELECT id FROM lab_categories WHERE code = 'VITA'), 'blood', 55.00, TRUE),
('VITA-005', 'Vitamina E', 'Tocoferol', (SELECT id FROM lab_categories WHERE code = 'VITA'), 'blood', 55.00, TRUE);

-- ============================================
-- STEP 9: Insert Parameters for Sample Tests
-- ============================================

-- Hemograma Completo Parameters
INSERT INTO lab_parameters (test_id, name, unit, reference_min, reference_max, reference_text, sort_order, decimal_places) VALUES
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Leucocitos', 'x10³/µL', 4.5, 11.0, '4.5-11.0', 1, 1),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Eritrocitos (Hombres)', 'x10⁶/µL', 4.5, 5.5, '4.5-5.5', 2, 2),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Eritrocitos (Mujeres)', 'x10⁶/µL', 4.0, 5.0, '4.0-5.0', 3, 2),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Hemoglobina (Hombres)', 'g/dL', 13.5, 17.5, '13.5-17.5', 4, 1),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Hemoglobina (Mujeres)', 'g/dL', 12.0, 16.0, '12.0-16.0', 5, 1),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Hematocrito (Hombres)', '%', 38.8, 50.0, '38.8-50.0', 6, 1),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Hematocrito (Mujeres)', '%', 34.9, 44.5, '34.9-44.5', 7, 1),
((SELECT id FROM lab_test_catalog WHERE code = 'HEMO-001'), 'Plaquetas', 'x10³/µL', 150, 400, '150-400', 8, 0);

-- Glucosa Parameters
INSERT INTO lab_parameters (test_id, name, unit, reference_min, reference_max, reference_text, sort_order, decimal_places) VALUES
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-001'), 'Glucosa', 'mg/dL', 70, 100, '70-100', 1, 0);

-- Hemoglobina Glicosilada Parameters
INSERT INTO lab_parameters (test_id, name, unit, reference_min, reference_max, reference_text, sort_order, decimal_places, is_critical_above) VALUES
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-002'), 'HbA1c', '%', 4.0, 5.6, '4.0-5.6', 1, 1, 7.0);

-- Creatinina Parameters
INSERT INTO lab_parameters (test_id, name, unit, reference_min, reference_max, reference_text, sort_order, decimal_places, is_critical_above) VALUES
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-003'), 'Creatinina (Hombres)', 'mg/dL', 0.7, 1.3, '0.7-1.3', 1, 2, 2.5),
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-003'), 'Creatinina (Mujeres)', 'mg/dL', 0.6, 1.1, '0.6-1.1', 2, 2, 2.0);

-- Colesterol Parameters
INSERT INTO lab_parameters (test_id, name, unit, reference_min, reference_max, reference_text, sort_order, decimal_places) VALUES
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-006'), 'Colesterol Total', 'mg/dL', 0, 200, '<200 desirable', 1, 0),
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-007'), 'Colesterol HDL', 'mg/dL', 40, 100, '>40 desirable', 1, 0),
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-009'), 'Triglicéridos', 'mg/dL', 0, 150, '<150 normal', 1, 0);

-- Función Hepática Parameters
INSERT INTO lab_parameters (test_id, name, unit, reference_min, reference_max, reference_text, sort_order, decimal_places) VALUES
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-010'), 'GOT/AST', 'U/L', 0, 40, '0-40', 1, 0),
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-011'), 'GPT/ALT', 'U/L', 0, 41, '0-41', 1, 0),
((SELECT id FROM lab_test_catalog WHERE code = 'QUIM-012'), 'Fosfatasa Alcalina', 'U/L', 44, 147, '44-147', 1, 0);

-- Electrolitos Parameters
INSERT INTO lab_parameters (test_id, name, unit, reference_min, reference_max, reference_text, sort_order, decimal_places, is_critical_below, is_critical_above) VALUES
((SELECT id FROM lab_test_catalog WHERE code = 'ELEC-001'), 'Sodio', 'mEq/L', 136, 145, '136-145', 1, 0, 120, 160),
((SELECT id FROM lab_test_catalog WHERE code = 'ELEC-002'), 'Potasio', 'mEq/L', 3.5, 5.0, '3.5-5.0', 1, 1, 2.5, 6.5),
((SELECT id FROM lab_test_catalog WHERE code = 'ELEC-003'), 'Cloruro', 'mEq/L', 98, 106, '98-106', 1, 0, 80, 115);

-- ============================================
-- STEP 10: Create RLS Policies
-- ============================================

ALTER TABLE lab_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_test_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;

-- Políticas para categorías y catálogo (solo lectura)
CREATE POLICY "Lab categories view active" ON lab_categories FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Lab catalog view active" ON lab_test_catalog FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Lab parameters view active" ON lab_parameters FOR SELECT TO authenticated USING (is_active = true);

-- Políticas para órdenes
CREATE POLICY "Lab staff can view orders" ON lab_orders FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin', 'doctor', 'medico', 'enfermera', 'nurse'))
);

CREATE POLICY "Lab staff can insert orders" ON lab_orders FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin', 'doctor', 'medico'))
);

CREATE POLICY "Lab staff can update orders" ON lab_orders FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin', 'doctor', 'medico'))
);

-- Políticas para detalles de orden
CREATE POLICY "Anyone can view order details" ON lab_order_details FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Anyone can insert order details" ON lab_order_details FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Lab staff can update order details" ON lab_order_details FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin'))
);

-- Políticas para resultados
CREATE POLICY "Lab staff can view results" ON lab_results FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin', 'doctor', 'medico'))
);

CREATE POLICY "Lab staff can insert results" ON lab_results FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin'))
);

CREATE POLICY "Lab staff can update results" ON lab_results FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'lab', 'lab_admin'))
);

-- ============================================
-- STEP 11: Verification
-- ============================================

SELECT 'Categorías: ' || COUNT(*)::varchar FROM lab_categories;
SELECT 'Pruebas: ' || COUNT(*)::varchar FROM lab_test_catalog WHERE is_active = true;
SELECT 'Parámetros: ' || COUNT(*)::varchar FROM lab_parameters;
SELECT 'Pruebas por categoría:' as info;
SELECT c.name, COUNT(t.id) as test_count
FROM lab_categories c
LEFT JOIN lab_test_catalog t ON c.id = t.category_id AND t.is_active = true
GROUP BY c.id, c.name
ORDER BY c.sort_order;
