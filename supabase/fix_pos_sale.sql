-- Script de migración para corregir el campo reference_id en inventory_transactions
-- Este script debe ejecutarse en el Editor SQL de Supabase

-- 1. Cambiar el tipo de reference_id de UUID a TEXT
ALTER TABLE public.inventory_transactions
ALTER COLUMN reference_id TYPE TEXT;

-- 2. Agregar el tipo de transacción 'sale' si no existe
-- Para agregar 'sale', necesitamos recrear la constraint
-- Primero eliminamos la constraint existente
ALTER TABLE public.inventory_transactions
DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;

-- Luego creamos una nueva constraint con el tipo 'sale' incluido
ALTER TABLE public.inventory_transactions
ADD CONSTRAINT inventory_transactions_transaction_type_check
CHECK (transaction_type IN ('in', 'out', 'adjustment', 'transfer', 'return', 'disposal', 'prescription_dispense', 'sale'));

-- Verificar que los cambios se aplicaron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inventory_transactions' 
AND column_name = 'reference_id';

SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'inventory_transactions_transaction_type_check';
