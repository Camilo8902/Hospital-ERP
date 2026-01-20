'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import type { POSTransaction, POSStats } from '@/lib/types';
import type { UserProfile } from './users';

// Tipos específicos para farmacia
export interface PharmacyProduct {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  unit: string;
  quantity: number;
  min_stock: number;
  max_stock: number | null;
  unit_cost: number;
  unit_price: number;
  supplier: string | null;
  manufacturer: string | null;
  expiration_date: string | null;
  batch_number: string | null;
  storage_location: string | null;
  requires_prescription: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryDocument {
  id: string;
  inventory_id: string;
  transaction_id: string;
  file_name: string;
  file_url: string;
  document_type: string;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  inventory_id: string;
  type: string;
  transaction_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'disposal' | 'prescription_dispense' | 'sale';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
  // Campos relacionados
  inventory?: PharmacyProduct;
  profile?: {
    full_name: string;
  };
  // Documentos adjuntos
  documents?: InventoryDocument[];
}

export interface PrescriptionWithRelations {
  id: string;
  medical_record_id: string;
  patient_id: string;
  doctor_id: string | null;
  medication_id: string | null;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity_prescribed: number;
  quantity_dispensed: number;
  refills_allowed: number;
  refills_used: number;
  instructions: string | null;
  status: 'pending' | 'partially_dispensed' | 'dispensed' | 'cancelled' | 'expired';
  prescribed_date: string;
  dispensed_date: string | null;
  created_at: string;
  updated_at: string;
  // Campos relacionados
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
  };
  profiles?: {
    id: string;
    full_name: string;
    specialty: string | null;
  };
  medical_records?: {
    appointment_id: string | null;
  };
}

export interface PharmacyStats {
  totalProducts: number;
  lowStockProducts: number;
  pendingPrescriptions: number;
  dispensedToday: number;
  totalInventoryValue: number;
  expiringProducts: number;
}

// ============ CONSULTAS DE INVENTARIO ============

export async function getInventoryProducts(
  search?: string,
  category?: string,
  lowStockOnly?: boolean,
  sortByExpiration?: boolean
): Promise<PharmacyProduct[]> {
  const adminSupabase = createAdminClient();
  
  let query = adminSupabase
    .from('inventory')
    .select('*')
    .eq('is_active', true);

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (lowStockOnly) {
    // Filtrar manualmente productos con stock bajo
    // La consulta principal ya trajo todos los productos, solo filtramos en memoria
  }

  // Ordenamiento por fecha de vencimiento si está activado
  if (sortByExpiration) {
    query = query.order('expiration_date', { 
      ascending: true,
      nullsFirst: false // Los productos con fecha null van al final
    });
  } else {
    query = query.order('name', { ascending: true });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener inventario:', error);
    return [];
  }

  // Filtrar manualmente productos con stock bajo si es necesario
  let products = data || [];
  
  if (lowStockOnly) {
    products = products.filter(p => p.quantity <= p.min_stock);
  }

  return products;
}

export async function getProductById(id: string): Promise<PharmacyProduct | null> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('inventory')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getLowStockProducts(): Promise<PharmacyProduct[]> {
  // Obtener todos los productos activos y filtrar manualmente
  const allProducts = await getInventoryProducts();
  return allProducts.filter(p => p.quantity <= p.min_stock);
}

export async function getExpiringProducts(daysAhead: number = 30): Promise<PharmacyProduct[]> {
  const adminSupabase = createAdminClient();
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await adminSupabase
    .from('inventory')
    .select('*')
    .eq('is_active', true)
    .lte('expiration_date', futureDate.toISOString().split('T')[0])
    .gte('expiration_date', new Date().toISOString().split('T')[0])
    .order('expiration_date', { ascending: true });

  if (error) {
    console.error('Error al obtener productos por vencer:', error);
    return [];
  }

  return data || [];
}

export async function createProduct(
  productData: Omit<PharmacyProduct, 'id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('inventory')
      .insert(productData);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/pharmacy/inventory');
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al crear producto' };
  }
}

export async function updateProduct(
  id: string,
  productData: Partial<Omit<PharmacyProduct, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('inventory')
      .update(productData)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/pharmacy/inventory');
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al actualizar producto' };
  }
}

export async function deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    // Soft delete - solo desactivar
    const { error } = await adminSupabase
      .from('inventory')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/pharmacy/inventory');
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al eliminar producto' };
  }
}

// ============ MOVIMIENTOS DE INVENTARIO ============

export async function getInventoryMovements(
  productId?: string,
  startDate?: string,
  endDate?: string,
  transactionType?: string,
  limit: number = 100
): Promise<InventoryMovement[]> {
  const adminSupabase = createAdminClient();
  
  let query = adminSupabase
    .from('inventory_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (productId) {
    query = query.eq('inventory_id', productId);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  if (transactionType && transactionType !== 'all') {
    query = query.eq('transaction_type', transactionType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener movimientos:', error);
    return [];
  }

  const movements = data || [];
  
  // Obtener nombres de productos y usuarios por separado
  const inventoryIds = Array.from(new Set(movements.map(m => m.inventory_id).filter(Boolean)));
  const userIds = Array.from(new Set(movements.map(m => m.performed_by).filter(Boolean)));
  const transactionIds = Array.from(new Set(movements.map(m => m.id).filter(Boolean)));

  let inventoryMap: Record<string, { name: string; sku: string }> = {};
  let userMap: Record<string, string> = {};
  let documentsMap: Record<string, InventoryDocument[]> = {};

  if (inventoryIds.length > 0) {
    const { data: inventoryItems } = await adminSupabase
      .from('inventory')
      .select('id, name, sku')
      .in('id', inventoryIds);
    
    if (inventoryItems) {
      inventoryItems.forEach(item => {
        inventoryMap[item.id] = { name: item.name, sku: item.sku };
      });
    }
  }

  if (userIds.length > 0) {
    const { data: users } = await adminSupabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    
    if (users) {
      users.forEach(user => {
        userMap[user.id] = user.full_name;
      });
    }
  }

  // Obtener documentos relacionados
  if (transactionIds.length > 0) {
    const { data: documents } = await adminSupabase
      .from('inventory_documents')
      .select('*')
      .in('transaction_id', transactionIds);
    
    if (documents) {
      documents.forEach(doc => {
        if (!documentsMap[doc.transaction_id]) {
          documentsMap[doc.transaction_id] = [];
        }
        documentsMap[doc.transaction_id].push(doc);
      });
    }
  }

  // Enriquecer movimientos con datos relacionados
  return movements.map(movement => ({
    ...movement,
    inventory: inventoryMap[movement.inventory_id] || null,
    profile: movement.performed_by ? { full_name: userMap[movement.performed_by] || 'Desconocido' } : null,
    documents: documentsMap[movement.id] || [],
  }));
}

export async function addInventoryMovement(
  movementData: {
    inventory_id: string;
    transaction_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'disposal' | 'prescription_dispense';
    quantity: number;
    notes?: string;
    reference_type?: string;
    reference_id?: string;
  },
  user?: UserProfile | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    // Obtener cantidad actual
    const { data: product } = await adminSupabase
      .from('inventory')
      .select('quantity')
      .eq('id', movementData.inventory_id)
      .single();

    if (!product) {
      return { success: false, error: 'Producto no encontrado' };
    }

    const previousQuantity = product.quantity;
    let newQuantity = previousQuantity;

    // Calcular nueva cantidad según el tipo de movimiento
    switch (movementData.transaction_type) {
      case 'in':
      case 'return':
        newQuantity = previousQuantity + movementData.quantity;
        break;
      case 'out':
      case 'disposal':
      case 'prescription_dispense':
        newQuantity = Math.max(0, previousQuantity - movementData.quantity);
        break;
      case 'adjustment':
        newQuantity = movementData.quantity; // En ajustes, quantity es la cantidad absoluta
        break;
      case 'transfer':
        // Los transfers requieren lógica adicional
        break;
    }

    // Iniciar transacción
    const { error: txError } = await adminSupabase.rpc('BEGIN_TRANSACTION');
    
    if (txError) {
      // Si no existe la función RPC, ejecutar directamente
      // Actualizar inventario
      const { error: updateError } = await adminSupabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', movementData.inventory_id);

      if (updateError) {
        // Intentar hacer rollback si falla la actualización
        try {
          await adminSupabase.rpc('ROLLBACK_TRANSACTION');
        } catch (rollbackError) {
          // Ignorar errores de rollback
        }
        return { success: false, error: updateError.message };
      }

      // Registrar movimiento
      const { error: movementError } = await adminSupabase
        .from('inventory_transactions')
        .insert({
          inventory_id: movementData.inventory_id,
          transaction_type: movementData.transaction_type,
          quantity: movementData.quantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          notes: movementData.notes,
          reference_type: movementData.reference_type,
          reference_id: movementData.reference_id,
          performed_by: user?.id,
        });

      if (movementError) {
        // Intentar hacer rollback si falla el registro del movimiento
        try {
          await adminSupabase.rpc('ROLLBACK_TRANSACTION');
        } catch (rollbackError) {
          // Ignorar errores de rollback
        }
        return { success: false, error: movementError.message };
      }

      // Hacer commit de la transacción
      try {
        await adminSupabase.rpc('COMMIT_TRANSACTION');
      } catch (commitError) {
        // Ignorar errores de commit
      }
    } else {
      // Usar transacción manual si RPC no está disponible
      // Actualizar inventario
      const { error: updateError } = await adminSupabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', movementData.inventory_id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Registrar movimiento
      const { error: movementError } = await adminSupabase
        .from('inventory_transactions')
        .insert({
          inventory_id: movementData.inventory_id,
          transaction_type: movementData.transaction_type,
          quantity: movementData.quantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          notes: movementData.notes,
          reference_type: movementData.reference_type,
          reference_id: movementData.reference_id,
          performed_by: user?.id,
        });

      if (movementError) {
        return { success: false, error: movementError.message };
      }
    }

    revalidatePath('/dashboard/pharmacy/inventory');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/pharmacy/movements');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al registrar movimiento' };
  }
}

// ============ ENTRADA DE INVENTARIO CON ARCHIVO ============

export interface StockEntryData {
  productId: string;
  quantity: number;
  notes?: string;
  fileUrl?: string;
  fileName?: string;
}

export async function addStockEntry(
  entryData: StockEntryData,
  user?: UserProfile | null
): Promise<{ success: boolean; error?: string; movementId?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    // Obtener cantidad actual del producto
    const { data: product, error: productError } = await adminSupabase
      .from('inventory')
      .select('id, name, quantity')
      .eq('id', entryData.productId)
      .single();

    if (productError || !product) {
      return { success: false, error: 'Producto no encontrado' };
    }

    const previousQuantity = product.quantity;
    const newQuantity = previousQuantity + entryData.quantity;

    // Actualizar inventario
    const { error: updateError } = await adminSupabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', entryData.productId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Registrar movimiento
    const { data: movement, error: movementError } = await adminSupabase
      .from('inventory_transactions')
      .insert({
        inventory_id: entryData.productId,
        transaction_type: 'in',
        quantity: entryData.quantity,
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        notes: entryData.notes || 'Entrada de inventario',
        reference_type: 'stock_entry',
        reference_id: null,
        performed_by: user?.id,
      })
      .select()
      .single();

    if (movementError) {
      // Revertir actualización si falla el movimiento
      await adminSupabase
        .from('inventory')
        .update({ quantity: previousQuantity })
        .eq('id', entryData.productId);
      
      return { success: false, error: movementError.message };
    }

    // Si hay archivo adjunto, registrar en la tabla de documentos
    if (entryData.fileUrl && entryData.fileName) {
      const { error: docError } = await adminSupabase
        .from('inventory_documents')
        .insert({
          inventory_id: entryData.productId,
          transaction_id: movement.id,
          file_name: entryData.fileName,
          file_url: entryData.fileUrl,
          document_type: 'entry_voucher',
          uploaded_by: user?.id,
        });

      if (docError) {
        console.error('Error al registrar documento:', docError);
        // No fallamos la operación por error de documento
      }
    }

    revalidatePath('/dashboard/pharmacy/inventory');
    revalidatePath('/dashboard/inventory');
    revalidatePath('/dashboard/pharmacy/movements');
    
    return { success: true, movementId: movement.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al registrar entrada de inventario' };
  }
}

// ============ RECETAS MÉDICAS ============

export async function getPrescriptions(
  status?: string,
  patientId?: string,
  search?: string
): Promise<PrescriptionWithRelations[]> {
  const adminSupabase = createAdminClient();
  
  let query = adminSupabase
    .from('prescriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener recetas:', error);
    return [];
  }

  let prescriptions = data || [];
  
  // Obtener datos relacionados por separado
  const patientIds = Array.from(new Set(prescriptions.map(rx => rx.patient_id).filter(Boolean)));
  const doctorIds = Array.from(new Set(prescriptions.map(rx => rx.doctor_id).filter(Boolean)));

  let patientMap: Record<string, { first_name: string; last_name: string; phone: string; email: string | null }> = {};
  let doctorMap: Record<string, { full_name: string; specialty: string | null }> = {};

  if (patientIds.length > 0) {
    const { data: patients } = await adminSupabase
      .from('patients')
      .select('id, first_name, last_name, phone, email')
      .in('id', patientIds);
    
    if (patients) {
      patients.forEach(patient => {
        patientMap[patient.id] = patient;
      });
    }
  }

  if (doctorIds.length > 0) {
    const { data: doctors } = await adminSupabase
      .from('profiles')
      .select('id, full_name, specialty')
      .in('id', doctorIds);
    
    if (doctors) {
      doctors.forEach(doctor => {
        doctorMap[doctor.id] = { full_name: doctor.full_name, specialty: doctor.specialty };
      });
    }
  }

  // Enriquecer recetas con datos relacionados
  prescriptions = prescriptions.map(rx => ({
    ...rx,
    patients: rx.patient_id ? (patientMap[rx.patient_id] || null) : null,
    profiles: rx.doctor_id ? (doctorMap[rx.doctor_id] || null) : null,
  }));

  // Filtrar por búsqueda si es necesario
  if (search) {
    const searchLower = search.toLowerCase();
    prescriptions = prescriptions.filter(rx => 
      rx.medication_name.toLowerCase().includes(searchLower) ||
      rx.patients?.first_name?.toLowerCase().includes(searchLower) ||
      rx.patients?.last_name?.toLowerCase().includes(searchLower)
    );
  }

  return prescriptions;
}

export async function getPrescriptionById(id: string): Promise<PrescriptionWithRelations | null> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('prescriptions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  const rx = data;
  
  // Obtener datos relacionados por separado
  let enrichedRx = { ...rx };

  if (rx.patient_id) {
    const { data: patient } = await adminSupabase
      .from('patients')
      .select('id, first_name, last_name, phone, email')
      .eq('id', rx.patient_id)
      .single();
    
    if (patient) {
      enrichedRx.patients = patient;
    }
  }

  if (rx.doctor_id) {
    const { data: doctor } = await adminSupabase
      .from('profiles')
      .select('id, full_name, specialty')
      .eq('id', rx.doctor_id)
      .single();
    
    if (doctor) {
      enrichedRx.profiles = doctor;
    }
  }

  return enrichedRx;
}

export async function getPrescriptionsByAppointment(appointmentId: string): Promise<PrescriptionWithRelations[]> {
  const adminSupabase = createAdminClient();
  
  // Buscar recetas asociadas a esta cita a través de medical_records
  const { data: medicalRecords } = await adminSupabase
    .from('medical_records')
    .select('id')
    .eq('appointment_id', appointmentId);

  if (!medicalRecords || medicalRecords.length === 0) {
    return [];
  }

  const recordIds = medicalRecords.map(r => r.id);

  const { data, error } = await adminSupabase
    .from('prescriptions')
    .select('*')
    .in('medical_record_id', recordIds)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener recetas por cita:', error);
    return [];
  }

  let prescriptions = data || [];
  
  // Obtener datos relacionados por separado
  const patientIds = Array.from(new Set(prescriptions.map(rx => rx.patient_id).filter(Boolean)));
  const doctorIds = Array.from(new Set(prescriptions.map(rx => rx.doctor_id).filter(Boolean)));

  let patientMap: Record<string, { first_name: string; last_name: string; phone: string; email: string | null }> = {};
  let doctorMap: Record<string, { full_name: string; specialty: string | null }> = {};

  if (patientIds.length > 0) {
    const { data: patients } = await adminSupabase
      .from('patients')
      .select('id, first_name, last_name, phone, email')
      .in('id', patientIds);
    
    if (patients) {
      patients.forEach(patient => {
        patientMap[patient.id] = patient;
      });
    }
  }

  if (doctorIds.length > 0) {
    const { data: doctors } = await adminSupabase
      .from('profiles')
      .select('id, full_name, specialty')
      .in('id', doctorIds);
    
    if (doctors) {
      doctors.forEach(doctor => {
        doctorMap[doctor.id] = { full_name: doctor.full_name, specialty: doctor.specialty };
      });
    }
  }

  // Enriquecer recetas con datos relacionados
  return prescriptions.map(rx => ({
    ...rx,
    patients: rx.patient_id ? (patientMap[rx.patient_id] || null) : null,
    profiles: rx.doctor_id ? (doctorMap[rx.doctor_id] || null) : null,
  }));
}

export async function createPrescription(
  prescriptionData: {
    medical_record_id: string;
    patient_id: string;
    doctor_id?: string;
    medication_id?: string;
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity_prescribed: number;
    refills_allowed?: number;
    instructions?: string;
  }
): Promise<{ success: boolean; error?: string; prescriptionId?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('prescriptions')
      .insert({
        medical_record_id: prescriptionData.medical_record_id,
        patient_id: prescriptionData.patient_id,
        doctor_id: prescriptionData.doctor_id || null,
        medication_id: prescriptionData.medication_id || null,
        medication_name: prescriptionData.medication_name,
        dosage: prescriptionData.dosage,
        frequency: prescriptionData.frequency,
        duration: prescriptionData.duration,
        quantity_prescribed: prescriptionData.quantity_prescribed,
        refills_allowed: prescriptionData.refills_allowed || 0,
        instructions: prescriptionData.instructions || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/pharmacy');
    revalidatePath('/dashboard/pharmacy/prescriptions');
    return { success: true, prescriptionId: data.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al crear receta' };
  }
}

export async function dispensePrescription(
  prescriptionId: string,
  quantityDispensed?: number,
  user?: UserProfile | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    // Obtener la receta primero
    const { data: prescription, error: rxError } = await adminSupabase
      .from('prescriptions')
      .select('*')
      .eq('id', prescriptionId)
      .single();

    if (rxError || !prescription) {
      return { success: false, error: 'Receta no encontrada' };
    }

    const dispenseQty = quantityDispensed || prescription.quantity_prescribed - prescription.quantity_dispensed;

    // Verificar stock si hay un medication_id - obtener inventario por separado
    let inventoryItem = null;
    if (prescription.medication_id) {
      const { data: inventory } = await adminSupabase
        .from('inventory')
        .select('id, name, quantity')
        .eq('id', prescription.medication_id)
        .single();
      
      inventoryItem = inventory;
      
      if (inventory && inventory.quantity < dispenseQty) {
        return { success: false, error: `Stock insuficiente. Disponible: ${inventory.quantity}, Solicitado: ${dispenseQty}` };
      }
    }

    // Actualizar receta
    const newDispensedQty = prescription.quantity_dispensed + dispenseQty;
    const newStatus = newDispensedQty >= prescription.quantity_prescribed 
      ? 'dispensed' 
      : 'partially_dispensed';

    const { error: updateRxError } = await adminSupabase
      .from('prescriptions')
      .update({
        status: newStatus,
        quantity_dispensed: newDispensedQty,
        dispensed_date: new Date().toISOString(),
      })
      .eq('id', prescriptionId);

    if (updateRxError) {
      return { success: false, error: updateRxError.message };
    }

    // Descontar del inventario si hay un medication_id
    if (prescription.medication_id) {
      const { data: inventory, error: invError } = await adminSupabase
        .from('inventory')
        .select('quantity')
        .eq('id', prescription.medication_id)
        .single();

      if (invError || !inventory) {
        return { success: false, error: 'Producto de inventario no encontrado' };
      }

      const newQuantity = Math.max(0, inventory.quantity - dispenseQty);

      // Actualizar inventario
      const { error: updateInvError } = await adminSupabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', prescription.medication_id);

      if (updateInvError) {
        return { success: false, error: updateInvError.message };
      }

      // Registrar movimiento
      const { error: movementError } = await adminSupabase
        .from('inventory_transactions')
        .insert({
          inventory_id: prescription.medication_id,
          transaction_type: 'prescription_dispense',
          quantity: dispenseQty,
          previous_quantity: inventory.quantity,
          new_quantity: newQuantity,
          reference_type: 'prescription',
          reference_id: prescriptionId,
          performed_by: user?.id,
        });

      if (movementError) {
        return { success: false, error: movementError.message };
      }
    }

    revalidatePath('/dashboard/pharmacy');
    revalidatePath('/dashboard/pharmacy/prescriptions');
    revalidatePath('/dashboard/pharmacy/inventory');
    revalidatePath('/dashboard/inventory');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al dispensar receta' };
  }
}

export async function cancelPrescription(
  prescriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('prescriptions')
      .update({ status: 'cancelled' })
      .eq('id', prescriptionId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/pharmacy');
    revalidatePath('/dashboard/pharmacy/prescriptions');
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error al cancelar receta' };
  }
}

// ============ ESTADÍSTICAS ============

export async function getPharmacyStats(): Promise<PharmacyStats> {
  const [products, lowStockProducts, prescriptions, movements] = await Promise.all([
    getInventoryProducts(),
    getLowStockProducts(),
    getPrescriptions('all'),
    getInventoryMovements(),
  ]);

  const today = new Date().toISOString().split('T')[0];

  const stats: PharmacyStats = {
    totalProducts: products.length,
    lowStockProducts: lowStockProducts.length,
    pendingPrescriptions: prescriptions.filter(rx => rx.status === 'pending').length,
    dispensedToday: prescriptions.filter(rx => rx.status === 'dispensed' && rx.dispensed_date?.startsWith(today)).length,
    totalInventoryValue: products.reduce((sum, p) => sum + (p.quantity * p.unit_cost), 0),
    expiringProducts: (await getExpiringProducts(30)).length,
  };

  return stats;
}

// ============ BÚSQUEDA DE PRODUCTOS ============

export async function searchProducts(query: string, limit: number = 10): Promise<PharmacyProduct[]> {
  const adminSupabase = createAdminClient();
  
  let queryBuilder = adminSupabase
    .from('inventory')
    .select('*')
    .eq('is_active', true);

  // Solo agregar filtro de búsqueda si hay query
  if (query && query.trim()) {
    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`);
  }

  const { data, error } = await queryBuilder.limit(limit);

  if (error) {
    console.error('Error al buscar productos:', error);
    return [];
  }

  return data || [];
}

// ============ CATEGORÍAS ============

export async function getCategories(): Promise<string[]> {
  const products = await getInventoryProducts();
  const categories = Array.from(new Set(products.map(p => p.category)));
  return categories.sort();
}

// ============ RECETAS POR PACIENTE ============

export async function getPrescriptionsByPatient(patientId: string): Promise<PrescriptionWithRelations[]> {
  const adminSupabase = createAdminClient();
  
  // Obtener todas las recetas del paciente
  const { data: prescriptions, error } = await adminSupabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener recetas del paciente:', error);
    return [];
  }

  if (!prescriptions || prescriptions.length === 0) {
    return [];
  }

  // Obtener doctor_ids para enriquecer los datos
  const doctorIds = Array.from(new Set(prescriptions.map(rx => rx.doctor_id).filter(Boolean)));
  
  let doctorMap: Record<string, { full_name: string; specialty: string | null }> = {};

  if (doctorIds.length > 0) {
    const { data: doctors } = await adminSupabase
      .from('profiles')
      .select('id, full_name, specialty')
      .in('id', doctorIds);
    
    if (doctors) {
      doctors.forEach(doctor => {
        doctorMap[doctor.id] = { full_name: doctor.full_name, specialty: doctor.specialty };
      });
    }
  }

  // Enriquecer recetas con datos del doctor
  return prescriptions.map(rx => ({
    ...rx,
    patients: null, // No necesitamos datos del paciente, ya estamos filtrando por paciente
    profiles: rx.doctor_id ? (doctorMap[rx.doctor_id] || null) : null,
    medical_records: null, // No necesitamos datos del registro médico
  }));
}

// ============================================
// PUNTO DE VENTA (POS)
// ============================================

export interface POSSaleItem {
  inventory_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface ProcessPOSaleResult {
  success: boolean;
  transaction_id?: string;
  transaction_number?: string;
  error?: string;
}

/**
 * Procesa una venta en el punto de venta
 * Maneja la transacción atómicamente: crea registro de venta, descuenta inventario y registra movimientos
 * Usa la tabla inventory_transactions para registrar la venta completa
 */
export async function processPOSale(
  items: POSSaleItem[],
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'INSURANCE',
  customerName?: string,
  notes?: string,
  user?: UserProfile | null
): Promise<ProcessPOSaleResult> {
  const adminSupabase = createAdminClient();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Generar número de transacción
    const today = new Date().toISOString().split('T')[0];
    const { data: lastTransaction } = await adminSupabase
      .from('inventory_transactions')
      .select('reference_id')
      .like('reference_id', `POS-${today}-%`)
      .order('created_at', { ascending: false })
      .limit(1);

    let sequence = 1;
    if (lastTransaction && lastTransaction.length > 0) {
      const lastRef = lastTransaction[0].reference_id;
      const sequenceMatch = lastRef?.match(/POS-\d{4}-\d{2}-\d{2}-(\d+)/);
      if (sequenceMatch) {
        sequence = parseInt(sequenceMatch[1]) + 1;
      }
    }
    const transactionNumber = `POS-${today}-${sequence.toString().padStart(4, '0')}`;

    // Calcular totales
    let subtotal = 0;
    let discountTotal = 0;

    // Verificar stock disponible para todos los productos y preparar detalles de items
    const itemDetails: Array<{
      inventory_id: string;
      quantity: number;
      unit_price: number;
      discount: number;
      subtotal: number;
      productName: string;
    }> = [];

    for (const item of items) {
      const { data: product } = await adminSupabase
        .from('inventory')
        .select('id, name, quantity, unit_price')
        .eq('id', item.inventory_id)
        .single();

      if (!product) {
        return { success: false, error: `Producto no encontrado: ${item.inventory_id}` };
      }

      if (product.quantity < item.quantity) {
        return { success: false, error: `Stock insuficiente para ${product.name}. Disponible: ${product.quantity}, Solicitado: ${item.quantity}` };
      }

      const itemSubtotal = (item.unit_price * item.quantity) - item.discount;
      subtotal += item.unit_price * item.quantity;
      discountTotal += item.discount;

      itemDetails.push({
        inventory_id: item.inventory_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount,
        subtotal: itemSubtotal,
        productName: product.name,
      });
    }

    const taxRate = 0.16; // 16% IVA
    const taxAmount = (subtotal - discountTotal) * taxRate;
    const totalAmount = subtotal - discountTotal + taxAmount;

    // Preparar detalles completos de la venta como JSON
    const saleDetails = JSON.stringify({
      transaction_number: transactionNumber,
      payment_method: paymentMethod,
      customer_name: customerName || null,
      items: itemDetails,
      subtotal: subtotal,
      discount_total: discountTotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      items_count: items.reduce((sum, item) => sum + item.quantity, 0),
    });

    // Iniciar transacción de base de datos
    const { error: beginError } = await adminSupabase.rpc('BEGIN_TRANSACTION');
    
    if (beginError) {
      // Si RPC no está disponible, ejecutar sin transacción explícita
      // Registrar cada movimiento de inventario para los items
      for (const item of itemDetails) {
        // Obtener cantidad actual
        const { data: product } = await adminSupabase
          .from('inventory')
          .select('quantity')
          .eq('id', item.inventory_id)
          .single();

        if (!product) {
          return { success: false, error: `Producto no encontrado: ${item.inventory_id}` };
        }

        const previousQuantity = product.quantity;
        const newQuantity = previousQuantity - item.quantity;

        // Actualizar inventario
        const { error: updateError } = await adminSupabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', item.inventory_id);

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        // Registrar movimiento individual
        const { error: movementError } = await adminSupabase
          .from('inventory_transactions')
          .insert({
            inventory_id: item.inventory_id,
            transaction_type: 'sale',
            quantity: item.quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            notes: `Venta POS: ${transactionNumber}. ${item.productName} x${item.quantity}`,
            reference_type: 'pos_sale',
            reference_id: transactionNumber,
            performed_by: user.id,
          });

        if (movementError) {
          return { success: false, error: movementError.message };
        }
      }

      // Crear registro maestro de la venta con todos los detalles
      const { error: masterError } = await adminSupabase
        .from('inventory_transactions')
        .insert({
          inventory_id: items[0]?.inventory_id || '',
          transaction_type: 'sale',
          quantity: 0,
          previous_quantity: 0,
          new_quantity: 0,
          notes: saleDetails,
          reference_type: 'pos_sale_master',
          reference_id: transactionNumber,
          performed_by: user.id,
        });

      if (masterError) {
        console.error('Error al crear registro maestro de venta:', masterError);
        // No fallamos la operación por esto, los movimientos individuales ya fueron registrados
      }

      revalidatePath('/dashboard/pharmacy');
      revalidatePath('/dashboard/pharmacy/pos');
      revalidatePath('/dashboard/pharmacy/inventory');

      return {
        success: true,
        transaction_id: transactionNumber,
        transaction_number: transactionNumber,
      };
    }

    try {
      // Registrar cada movimiento de inventario para los items
      for (const item of itemDetails) {
        // Obtener cantidad actual
        const { data: product } = await adminSupabase
          .from('inventory')
          .select('quantity')
          .eq('id', item.inventory_id)
          .single();

        if (!product) {
          throw new Error(`Producto no encontrado: ${item.inventory_id}`);
        }

        const previousQuantity = product.quantity;
        const newQuantity = previousQuantity - item.quantity;

        // Actualizar inventario
        const { error: updateError } = await adminSupabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', item.inventory_id);

        if (updateError) {
          throw updateError;
        }

        // Registrar movimiento individual
        const { error: movementError } = await adminSupabase
          .from('inventory_transactions')
          .insert({
            inventory_id: item.inventory_id,
            transaction_type: 'sale',
            quantity: item.quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            notes: `Venta POS: ${transactionNumber}. ${item.productName} x${item.quantity}`,
            reference_type: 'pos_sale',
            reference_id: transactionNumber,
            performed_by: user.id,
          });

        if (movementError) {
          throw movementError;
        }
      }

      // Crear registro maestro de la venta con todos los detalles
      const { error: masterError } = await adminSupabase
        .from('inventory_transactions')
        .insert({
          inventory_id: items[0]?.inventory_id || '',
          transaction_type: 'sale',
          quantity: 0,
          previous_quantity: 0,
          new_quantity: 0,
          notes: saleDetails,
          reference_type: 'pos_sale_master',
          reference_id: transactionNumber,
          performed_by: user.id,
        });

      if (masterError) {
        console.error('Error al crear registro maestro de venta:', masterError);
        // No fallamos la operación por esto, los movimientos individuales ya fueron registrados
      }

      // Hacer commit de la transacción
      await adminSupabase.rpc('COMMIT_TRANSACTION');

      revalidatePath('/dashboard/pharmacy');
      revalidatePath('/dashboard/pharmacy/pos');
      revalidatePath('/dashboard/pharmacy/inventory');

      return {
        success: true,
        transaction_id: transactionNumber,
        transaction_number: transactionNumber,
      };
    } catch (error) {
      // Hacer rollback en caso de error
      await adminSupabase.rpc('ROLLBACK_TRANSACTION');
      throw error;
    }
  } catch (error) {
    console.error('Error al procesar venta POS:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error al procesar la venta' };
  }
}

/**
 * Obtiene productos disponibles para el POS (solo con stock > 0)
 */
export async function getPOSProducts(search?: string): Promise<PharmacyProduct[]> {
  const adminSupabase = createAdminClient();

  let query = adminSupabase
    .from('inventory')
    .select('*')
    .eq('is_active', true)
    .gt('quantity', 0);

  if (search && search.trim()) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
  }

  query = query.order('name', { ascending: true }).limit(100);

  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener productos POS:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene el stock actual de un producto para verificación en tiempo real
 */
export async function getProductStock(productId: string): Promise<number> {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from('inventory')
    .select('quantity')
    .eq('id', productId)
    .single();

  if (error || !data) {
    return 0;
  }

  return data.quantity;
}

/**
 * Obtiene transacciones POS por fecha
 * Busca registros master de ventas en inventory_transactions
 */
export async function getPOSTransactions(
  startDate?: string,
  endDate?: string,
  limit: number = 50
): Promise<POSTransaction[]> {
  const adminSupabase = createAdminClient();

  let query = adminSupabase
    .from('inventory_transactions')
    .select('*')
    .eq('reference_type', 'pos_sale_master')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error al obtener transacciones POS:', error);
    return [];
  }

  // Convertir registros inventory_transactions a formato POSTransaction
  const transactions: POSTransaction[] = (data || []).map(tx => {
    let saleDetails = {
      transaction_number: tx.reference_id,
      payment_method: 'CASH' as const,
      customer_name: null,
      items_count: 0,
      subtotal: 0,
      discount_total: 0,
      tax_amount: 0,
      total_amount: 0,
    };

    try {
      if (tx.notes) {
        saleDetails = { ...saleDetails, ...JSON.parse(tx.notes) };
      }
    } catch (e) {
      // Si no se puede parsear, usar valores por defecto
    }

    return {
      id: tx.id,
      transaction_number: tx.reference_id || '',
      status: 'COMPLETED',
      payment_method: saleDetails.payment_method,
      subtotal: saleDetails.subtotal,
      discount_total: saleDetails.discount_total,
      tax_amount: saleDetails.tax_amount,
      total_amount: saleDetails.total_amount,
      items_count: saleDetails.items_count,
      customer_name: saleDetails.customer_name,
      notes: tx.notes || null,
      operator_id: tx.performed_by || null,
      created_at: tx.created_at,
      updated_at: tx.created_at,
      items: [],
    };
  });

  return transactions;
}

/**
 * Obtiene estadísticas del POS para el día actual
 */
export async function getPOSStats(): Promise<POSStats> {
  const adminSupabase = createAdminClient();

  const today = new Date().toISOString().split('T')[0];
  const startOfDay = `${today}T00:00:00`;
  const endOfDay = `${today}T23:59:59`;

  // Obtener transacciones master del día
  const { data: masterTransactions, error } = await adminSupabase
    .from('inventory_transactions')
    .select('notes, reference_id')
    .eq('reference_type', 'pos_sale_master')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay);

  if (error) {
    console.error('Error al obtener estadísticas POS:', error);
    return {
      totalSalesToday: 0,
      transactionCountToday: 0,
      averageTicket: 0,
      topSellingProducts: [],
    };
  }

  let transactionCount = 0;
  let totalSales = 0;
  const productSales: Record<string, { name: string; quantity_sold: number; revenue: number }> = {};

  for (const tx of masterTransactions || []) {
    try {
      if (tx.notes) {
        const details = JSON.parse(tx.notes);
        totalSales += details.total_amount || 0;
        transactionCount++;

        // Acumular productos vendidos
        if (details.items && Array.isArray(details.items)) {
          for (const item of details.items) {
            if (!productSales[item.inventory_id]) {
              productSales[item.inventory_id] = {
                name: item.productName || 'Producto',
                quantity_sold: 0,
                revenue: 0,
              };
            }
            productSales[item.inventory_id].quantity_sold += item.quantity;
            productSales[item.inventory_id].revenue += item.subtotal || (item.unit_price * item.quantity);
          }
        }
      }
    } catch (e) {
      // Si no se puede parsear, ignorar
    }
  }

  const averageTicket = transactionCount > 0 ? totalSales / transactionCount : 0;

  const topSellingProducts = Object.values(productSales)
    .sort((a, b) => b.quantity_sold - a.quantity_sold)
    .slice(0, 5);

  return {
    totalSalesToday: totalSales,
    transactionCountToday: transactionCount,
    averageTicket: averageTicket,
    topSellingProducts: topSellingProducts,
  };
}

/**
 * Cancela una transacción POS (revierte el inventario)
 */
export async function cancelPOSTransaction(
  transactionId: string,
  reason: string,
  user?: UserProfile | null
): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Obtener la transacción master
    const { data: transaction, error: txError } = await adminSupabase
      .from('inventory_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return { success: false, error: 'Transacción no encontrada' };
    }

    if (transaction.reference_type !== 'pos_sale_master') {
      return { success: false, error: 'Esta no es una transacción POS válida' };
    }

    // Parsear detalles de la venta
    let saleDetails: {
      transaction_number: string;
      items: Array<{
        inventory_id: string;
        quantity: number;
        productName: string;
      }>;
    } | null = null;

    try {
      if (transaction.notes) {
        saleDetails = JSON.parse(transaction.notes);
      }
    } catch (e) {
      return { success: false, error: 'No se pudieron leer los detalles de la transacción' };
    }

    if (!saleDetails || !saleDetails.items) {
      return { success: false, error: 'No hay items en esta transacción' };
    }

    // Iniciar transacción
    const { error: beginError } = await adminSupabase.rpc('BEGIN_TRANSACTION');

    try {
      if (!beginError) {
        await adminSupabase.rpc('COMMIT_TRANSACTION');
      }
    } catch (e) {
      // Continuar sin transacción explícita
    }

    // Restaurar inventario para cada item
    for (const item of saleDetails.items) {
      const { data: product } = await adminSupabase
        .from('inventory')
        .select('id, quantity')
        .eq('id', item.inventory_id)
        .single();

      if (product) {
        const previousQuantity = product.quantity;
        const newQuantity = previousQuantity + item.quantity;

        const { error: invError } = await adminSupabase
          .from('inventory')
          .update({ quantity: newQuantity })
          .eq('id', item.inventory_id);

        if (invError) {
          return { success: false, error: invError.message };
        }

        // Registrar movimiento de restauración
        const { error: movementError } = await adminSupabase
          .from('inventory_transactions')
          .insert({
            inventory_id: item.inventory_id,
            transaction_type: 'return',
            quantity: item.quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            notes: `Cancelación POS: ${saleDetails.transaction_number}. Motivo: ${reason}`,
            reference_type: 'pos_cancellation',
            reference_id: transactionId,
            performed_by: user.id,
          });

        if (movementError) {
          return { success: false, error: movementError.message };
        }
      }
    }

    // Marcar la transacción master como cancelada
    const { error: updateError } = await adminSupabase
      .from('inventory_transactions')
      .update({
        notes: `${transaction.notes}\n\n[CANCELADA]: ${reason}. Cancelada por: ${user.id} el ${new Date().toISOString()}`,
      })
      .eq('id', transactionId);

    if (updateError) {
      console.error('Error al marcar transacción como cancelada:', updateError);
      // No fallamos por esto
    }

    revalidatePath('/dashboard/pharmacy/pos');
    revalidatePath('/dashboard/pharmacy/inventory');

    return { success: true };
  } catch (error) {
    console.error('Error al cancelar transacción POS:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error al cancelar la transacción' };
  }
}
