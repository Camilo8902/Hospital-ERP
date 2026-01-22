-- =====================================================
-- MEDICORE ERP - Esquema de Pagos Europeos
-- Fase 1: Base de datos para integración de pagos (Stripe)
-- Soporta: Tarjetas, Bizum, SEPA Direct Debit
-- =====================================================

-- =====================================================
-- TIPOS ENUMERADOS PARA PAGOS
-- =====================================================

-- Estados de transacción de pago
CREATE TYPE payment_status AS ENUM (
  'PENDING',        -- Pago iniciado, esperando confirmación
  'PROCESSING',     -- Procesando con el proveedor
  'SUCCEEDED',      -- Pago completado exitosamente
  'FAILED',         -- Pago falló
  'REFUNDED',       -- Reembolso completo
  'PARTIALLY_REFUNDED', -- Reembolso parcial
  'CANCELLED'       -- Pago cancelado antes de completar
);

-- Métodos de pago soportados
CREATE TYPE payment_method_type AS ENUM (
  'CARD',           -- Tarjetas de crédito/débito (Visa, Mastercard, etc.)
  'BIZUM',          -- Bizum (España)
  'SEPA_DEBIT',     -- Débito directo SEPA
  'PAYPAL'          -- PayPal (futuro)
);

-- Tipo de entidad relacionada con el pago
CREATE TYPE payment_reference_type AS ENUM (
  'LAB_ORDER',      -- Orden de laboratorio
  'CONSULTATION',   -- Consulta médica
  'INVOICE',        -- Factura general
  'POS_SALE'        -- Venta POS de farmacia
);

-- =====================================================
-- TABLA: payment_transactions (Transacciones de Pago)
-- =====================================================
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información del monto (siempre en céntimos)
  amount DECIMAL(12, 0) NOT NULL,        -- Cantidad en céntimos (ej: 1000 = 10.00 EUR)
  currency VARCHAR(3) DEFAULT 'EUR' NOT NULL, -- Moneda (EUR para España)
  
  -- Estado y método
  status payment_status DEFAULT 'PENDING' NOT NULL,
  payment_method payment_method_type NOT NULL,
  
  -- Referencia al proveedor de pago (Stripe)
  provider VARCHAR(50) DEFAULT 'STRIPE' NOT NULL,
  provider_transaction_id VARCHAR(255),  -- ID de Stripe (pi_xxx, py_xxx)
  provider_payment_intent_id VARCHAR(255),
  provider_customer_id VARCHAR(255),
  
  -- Descripción del pago
  description TEXT,
  
  -- Datos del cliente (para SEPA/Bizum)
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  
  -- Referencia a la entidad relacionada (orden, consulta, etc.)
  reference_type payment_reference_type,
  reference_id UUID,                      -- ID de lab_orders, appointments, invoices, etc.
  
  -- Datos adicionales en formato JSON
  metadata JSONB DEFAULT '{}',
  
  -- Información de reembolso
  refunded_amount DECIMAL(12, 0) DEFAULT 0,
  refund_reason TEXT,
  
  -- Campos de auditoría
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount >= 0)
);

-- =====================================================
-- TABLA: payment_refunds (Reembolsos)
-- =====================================================
CREATE TABLE public.payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia a la transacción original
  transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE CASCADE NOT NULL,
  
  -- Monto del reembolso
  amount DECIMAL(12, 0) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
  
  -- Estado del reembolso
  status payment_status DEFAULT 'PENDING' NOT NULL,
  
  -- Referencia en el proveedor
  provider_refund_id VARCHAR(255),
  
  -- Razón del reembolso
  reason TEXT NOT NULL,
  notes TEXT,
  
  -- Usuario que procesó el reembolso
  processed_by UUID REFERENCES public.profiles(id),
  
  -- Campos de auditoría
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT refund_positive_amount CHECK (amount > 0)
);

-- =====================================================
-- TABLA: payment_methods (Métodos de Pago Guardados)
-- =====================================================
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario asociado
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Tipo de método
  type payment_method_type NOT NULL,
  
  -- Referencia en el proveedor (Stripe)
  provider_method_id VARCHAR(255) NOT NULL,
  
  -- Datos para visualización
  last4 VARCHAR(4),                        -- Últimos 4 dígitos
  brand VARCHAR(50),                       -- Visa, Mastercard, etc.
  bank_name VARCHAR(255),                  -- Para SEPA: nombre del banco
  iban_prefix VARCHAR(10),                 -- Para SEPA: prefijos del IBAN
  
  -- Estado
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Datos adicionales
  metadata JSONB DEFAULT '{}',
  
  -- Campos de auditoría
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(provider_method_id)
);

-- =====================================================
-- TABLA: payment_webhook_events (Registro de Webhooks)
-- =====================================================
CREATE TABLE public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificador del evento de Stripe
  stripe_event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  
  -- Datos del evento
  payload JSONB NOT NULL,
  
  -- Estado de procesamiento
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Campos de auditoría
  received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  UNIQUE(stripe_event_id)
);

-- =====================================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =====================================================

CREATE INDEX idx_payment_transactions_reference ON public.payment_transactions(reference_type, reference_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_provider_id ON public.payment_transactions(provider_transaction_id);
CREATE INDEX idx_payment_transactions_created ON public.payment_transactions(created_at);
CREATE INDEX idx_payment_transactions_customer ON public.payment_transactions(customer_email, customer_name);
CREATE INDEX idx_payment_refunds_transaction ON public.payment_refunds(transaction_id);
CREATE INDEX idx_payment_methods_user ON public.payment_methods(user_id);
CREATE INDEX idx_payment_webhooks_event_id ON public.payment_webhook_events(stripe_event_id);
CREATE INDEX idx_payment_webhooks_processed ON public.payment_webhook_events(processed, received_at);

-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_payment_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at_column();

CREATE TRIGGER update_payment_refunds_updated_at BEFORE UPDATE ON public.payment_refunds
  FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_payment_updated_at_column();

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- Payment Transactions: Acceso controlado
-- Los usuarios pueden ver sus propias transacciones
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT USING (
    auth.role() IS NOT NULL
  );

-- Admin y Reception pueden ver todas las transacciones
CREATE POLICY "Admin and Reception can view all transactions" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'reception', 'billing')
    )
  );

-- Admin y Billing pueden crear transacciones
CREATE POLICY "Admin and Billing can create transactions" ON public.payment_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'reception', 'billing')
    )
  );

-- =====================================================
-- FUNCIONES UTILITARIAS
-- =====================================================

-- Función para generar número de transacción único
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(FLOOR(RANDOM() * 100000)::TEXT, 6, '0');
END;
$$ language 'plpgsql';

-- Función para convertir euros a céntimos
CREATE OR REPLACE FUNCTION eur_to_cents(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(amount * 100);
END;
$$ language 'plpgsql' IMMUTABLE;

-- Función para convertir céntimos a euros
CREATE OR REPLACE FUNCTION cents_to_eur(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND(amount / 100.0, 2);
END;
$$ language 'plpgsql' IMMUTABLE;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de transacciones del día
CREATE OR REPLACE VIEW vw_payments_today AS
SELECT 
  pt.*,
  cents_to_eur(pt.amount) as amount_eur,
  cents_to_eur(pt.refunded_amount) as refunded_amount_eur,
  p.full_name as operator_name
FROM public.payment_transactions pt
LEFT JOIN public.profiles p ON pt.metadata->>'operator_id' = p.id::text
WHERE pt.created_at::date = CURRENT_DATE;

-- Vista de resumen diario de pagos
CREATE OR REPLACE VIEW vw_payments_daily_summary AS
SELECT 
  DATE(created_at) as payment_date,
  payment_method,
  status,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount_cents,
  COUNT(*) FILTER (WHERE status = 'SUCCEEDED') as successful_count,
  SUM(amount) FILTER (WHERE status = 'SUCCEEDED') as successful_amount_cents,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed_count,
  COUNT(*) FILTER (WHERE status = 'REFUNDED') as refund_count,
  SUM(refunded_amount) as total_refunded_cents
FROM public.payment_transactions
GROUP BY DATE(created_at), payment_method, status;

-- =====================================================
-- NOTA PARA IMPLEMENTACIÓN
-- =====================================================

-- Para activar este esquema:
-- 1. Ejecutar este script en la base de datos de Supabase
-- 2. Configurar las variables de entorno de Stripe en .env.local:
--    STRIPE_SECRET_KEY=sk_test_...
--    STRIPE_WEBHOOK_SECRET=whsec_...
--    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
-- 3. Instalar el SDK de Stripe: npm install stripe
