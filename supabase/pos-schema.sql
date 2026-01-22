-- ============================================
-- ESQUEMA PARA PUNTO DE VENTA (POS) DE FARMACIA
-- ============================================

-- Tabla de transacciones POS
CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_number VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'CANCELLED', 'REFUNDED')),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'INSURANCE')),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  items_count INTEGER NOT NULL DEFAULT 0,
  customer_name VARCHAR(255),
  notes TEXT,
  operator_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabla de items de transacción POS
CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  sku VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL,
  discount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_pos_transactions_created_at ON pos_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_operator_id ON pos_transactions(operator_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_status ON pos_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_number ON pos_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_transaction_id ON pos_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_inventory_id ON pos_transaction_items(inventory_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en pos_transactions
DROP TRIGGER IF EXISTS update_pos_transactions_updated_at ON pos_transactions;
CREATE TRIGGER update_pos_transactions_updated_at
  BEFORE UPDATE ON pos_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- EJEMPLO DE CONSULTA PARA REPORTE DE VENTAS
-- ============================================

-- Ventas del día actual
-- SELECT 
--   COUNT(*) as total_transacciones,
--   SUM(total_amount) as total_ventas,
--   AVG(total_amount) as ticket_promedio
-- FROM pos_transactions
-- WHERE created_at >= CURRENT_DATE
--   AND created_at < CURRENT_DATE + INTERVAL '1 day'
--   AND status = 'COMPLETED';

-- Productos más vendidos hoy
-- SELECT 
--   pti.name,
--   SUM(pti.quantity) as cantidad_vendida,
--   SUM(pti.subtotal) as ingresos
-- FROM pos_transaction_items pti
-- JOIN pos_transactions pt ON pti.transaction_id = pt.id
-- WHERE pt.created_at >= CURRENT_DATE
--   AND pt.created_at < CURRENT_DATE + INTERVAL '1 day'
--   AND pt.status = 'COMPLETED'
-- GROUP BY pti.name
-- ORDER BY cantidad_vendida DESC
-- LIMIT 10;

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;

-- Crear política para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver transacciones" 
  ON pos_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados pueden ver items" 
  ON pos_transaction_items FOR SELECT
  TO authenticated
  USING (true);

-- Solo administradores y pharmacy pueden ver/crear transacciones
-- (Las inserciones se hacen desde el servidor, no directamente desde el cliente)