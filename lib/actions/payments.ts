'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './users';
import type { PaymentStats } from '@/lib/types';

// ============================================
// CONFIGURACIÓN DE STRIPE (Simulada para Fase 1)
// ============================================

interface StripePaymentIntent {
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
}

interface StripeRefund {
  id: string;
  status: string;
  amount: number;
}

// ============================================
// TIPOS BASADOS EN EL ESQUEMA SQL
// ============================================

interface InvoiceItemData {
  id?: string;
  description: string;
  service_code?: string;
  quantity: number;
  unit_price: number;
  total: number;
  source_type?: string;
  source_id?: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  appointment_id: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_method: string | null;
  payment_reference: string | null;
  items: InvoiceItemData[];
  notes: string | null;
  due_date: string;
  issued_date: string;
  paid_date: string | null;
  created_at: string;
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    insurance_provider: string | null;
    insurance_policy_number: string | null;
  };
}

interface LabOrder {
  id: string;
  order_number: string;
  patient_id: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function eurToCents(eurAmount: number): number {
  return Math.round(eurAmount * 100);
}

function centsToEur(centsAmount: number): number {
  return centsAmount / 100;
}

function generatePaymentReference(): string {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `PAY-${today}-${random}`;
}

function mapPaymentMethodToStripe(method: string): string {
  switch (method) {
    case 'CARD':
      return 'card';
    case 'BIZUM':
      return 'card';
    case 'SEPA_DEBIT':
      return 'sepa_debit';
    default:
      return 'card';
  }
}

function getEmptyPaymentStats(): PaymentStats {
  return {
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalAmount: 0,
    totalRefunded: 0,
    averageTicket: 0,
    byPaymentMethod: {
      CARD: { count: 0, amount: 0 },
      BIZUM: { count: 0, amount: 0 },
      SEPA_DEBIT: { count: 0, amount: 0 },
      PAYPAL: { count: 0, amount: 0 },
    },
  };
}

// ============================================
// OBTENER FACTURAS
// ============================================

export interface GetInvoicesFilters {
  status?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getInvoices(
  filters?: GetInvoicesFilters,
  limit: number = 50,
  offset: number = 0
): Promise<{ invoices: Invoice[]; total: number }> {
  const adminSupabase = createAdminClient();

  try {
    let query = adminSupabase
      .from('invoices')
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          last_name,
          medical_record_number
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error al obtener facturas:', error);
      return { invoices: [], total: 0 };
    }

    return {
      invoices: (data || []) as Invoice[],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    return { invoices: [], total: 0 };
  }
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  const adminSupabase = createAdminClient();

  try {
    const { data, error } = await adminSupabase
      .from('invoices')
      .select(`
        *,
        patients!inner(
          id,
          first_name,
          last_name,
          medical_record_number,
          email,
          phone
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      ...data,
      updated_at: data.updated_at || new Date().toISOString()
    } as Invoice;
  } catch (error) {
    console.error('Error al obtener factura:', error);
    return null;
  }
}

export async function cancelInvoice(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Verificar que la factura existe y está en estado 'pending'
    const { data: invoice, error: invoiceError } = await adminSupabase
      .from('invoices')
      .select('id, status, patient_id')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: 'Factura no encontrada' };
    }

    if (invoice.status !== 'pending') {
      return { success: false, error: 'Solo se pueden cancelar facturas en estado pendiente' };
    }

    // Actualizar estado de la factura a 'cancelled'
    const { error: updateError } = await adminSupabase
      .from('invoices')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/dashboard/billing');

    return { success: true };
  } catch (error) {
    console.error('Error al cancelar factura:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al cancelar factura' 
    };
  }
}

export async function deleteInvoice(invoiceId: string): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Verificar que la factura existe
    const { data: invoice, error: invoiceError } = await adminSupabase
      .from('invoices')
      .select('id, status')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: 'Factura no encontrada' };
    }

    // Solo permitir eliminar facturas canceladas o en borrador
    if (invoice.status !== 'cancelled' && invoice.status !== 'draft') {
      return { success: false, error: 'Solo se pueden eliminar facturas canceladas o en borrador' };
    }

    // Eliminar los items de la factura primero
    const { error: itemsError } = await adminSupabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);

    if (itemsError) {
      return { success: false, error: itemsError.message };
    }

    // Eliminar la factura
    const { error: deleteError } = await adminSupabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/dashboard/billing');

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al eliminar factura' 
    };
  }
}

// ============================================
// CREAR INTENCIÓN DE PAGO (STRIPE)
// ============================================

export interface CreatePaymentIntentDTO {
  amount: number;
  currency?: string;
  paymentMethod?: string;
  description?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  referenceType: 'INVOICE' | 'LAB_ORDER';
  referenceId: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  transactionId?: string;
  providerPaymentIntentId?: string;
  error?: string;
}

export async function createPaymentIntent(
  paymentData: CreatePaymentIntentDTO
): Promise<CreatePaymentIntentResult> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    if (paymentData.amount <= 0) {
      return { success: false, error: 'El monto debe ser mayor a 0' };
    }

    const paymentReference = generatePaymentReference();

    // Simular PaymentIntent de Stripe
    const mockPaymentIntent: StripePaymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      status: 'requires_payment_method',
      amount: paymentData.amount,
      currency: paymentData.currency || 'eur',
    };

    // Actualizar la factura con referencia de pago pendiente
    if (paymentData.referenceType === 'INVOICE') {
      await adminSupabase
        .from('invoices')
        .update({
          payment_reference: mockPaymentIntent.id,
          payment_method: 'STRIPE_PENDING',
        })
        .eq('id', paymentData.referenceId);
    }

    // Para órdenes de laboratorio
    if (paymentData.referenceType === 'LAB_ORDER') {
      await adminSupabase
        .from('lab_orders')
        .update({
          payment_status: 'processing',
        })
        .eq('id', paymentData.referenceId);
    }

    revalidatePath('/dashboard/billing');
    revalidatePath('/dashboard/lab/orders');

    return {
      success: true,
      clientSecret: mockPaymentIntent.client_secret,
      transactionId: paymentReference,
      providerPaymentIntentId: mockPaymentIntent.id,
    };
  } catch (error) {
    console.error('Error al crear intención de pago:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al crear la intención de pago' 
    };
  }
}

// ============================================
// CONFIRMAR PAGO DE FACTURA
// ============================================

export interface ConfirmInvoicePaymentResult {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export async function confirmInvoicePayment(
  invoiceId: string,
  paymentMethod: string,
  providerTransactionId?: string
): Promise<ConfirmInvoicePaymentResult> {
  const adminSupabase = createAdminClient();

  try {
    // Obtener la factura
    const { data: invoice, error: invoiceError } = await adminSupabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: 'Factura no encontrada' };
    }

    // Actualizar la factura como pagada
    const { data: updatedInvoice, error: updateError } = await adminSupabase
      .from('invoices')
      .update({
        status: 'paid',
        amount_paid: invoice.total_amount,
        payment_method: paymentMethod,
        payment_reference: providerTransactionId || invoice.payment_reference,
        paid_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error al confirmar pago:', updateError);
      return { success: false, error: 'Error al actualizar la factura' };
    }

    revalidatePath('/dashboard/billing');
    revalidatePath(`/dashboard/billing/${invoiceId}`);

    return {
      success: true,
      invoice: updatedInvoice as Invoice,
    };
  } catch (error) {
    console.error('Error al confirmar pago de factura:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al confirmar el pago' 
    };
  }
}

// ============================================
// PROCESAR PAGO MANUAL (EFECTIVO, TARJETA, TRANSFERENCIA)
// ============================================

export interface ProcessManualPaymentDTO {
  invoiceId: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
  amount: number;
  reference?: string;
  notes?: string;
}

export interface ProcessManualPaymentResult {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  error?: string;
}

export async function processManualPayment(
  paymentData: ProcessManualPaymentDTO
): Promise<ProcessManualPaymentResult> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Obtener la factura
    const { data: invoice, error: invoiceError } = await adminSupabase
      .from('invoices')
      .select('*')
      .eq('id', paymentData.invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: 'Factura no encontrada' };
    }

    if (invoice.status === 'paid') {
      return { success: false, error: 'Esta factura ya está pagada' };
    }

    // Validar el monto
    const pendingAmount = Number(invoice.total_amount) - Number(invoice.amount_paid || 0);
    if (paymentData.amount <= 0) {
      return { success: false, error: 'El monto debe ser mayor a 0' };
    }

    if (paymentData.amount > pendingAmount) {
      return { success: false, error: `El monto excede el pendiente de ${pendingAmount.toFixed(2)}` };
    }

    // Generar referencia de pago
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const paymentReference = `PAY-${today}-${random}`;

    // Calcular nuevo monto pagado
    const newAmountPaid = Number(invoice.amount_paid || 0) + paymentData.amount;
    const newStatus = newAmountPaid >= Number(invoice.total_amount) ? 'paid' : 'pending';

    // Actualizar la factura directamente (sin tabla payment_transactions)
    const { error: updateError } = await adminSupabase
      .from('invoices')
      .update({
        status: newStatus,
        amount_paid: newAmountPaid,
        payment_method: paymentData.paymentMethod,
        payment_reference: paymentReference,
        paid_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoice.id);

    if (updateError) {
      console.error('Error al actualizar factura:', updateError);
      return { success: false, error: 'Error al procesar el pago' };
    }

    revalidatePath('/dashboard/billing');
    revalidatePath(`/dashboard/billing/${invoice.id}`);

    return {
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
    };
  } catch (error) {
    console.error('Error al procesar pago manual:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al procesar el pago' 
    };
  }
}

// ============================================
// PROCESAR PAGO DE ÓRDEN DE LABORATORIO
// ============================================

export interface ProcessLabOrderPaymentDTO {
  orderId: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER';
  amount: number;
  reference?: string;
  notes?: string;
}

export async function processLabOrderPayment(
  paymentData: ProcessLabOrderPaymentDTO
): Promise<ProcessManualPaymentResult> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Obtener la orden de laboratorio
    const { data: order, error: orderError } = await adminSupabase
      .from('lab_orders')
      .select('*')
      .eq('id', paymentData.orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Orden de laboratorio no encontrada' };
    }

    if (order.payment_status === 'paid') {
      return { success: false, error: 'Esta orden ya está pagada' };
    }

    // Validar el monto
    if (paymentData.amount <= 0) {
      return { success: false, error: 'El monto debe ser mayor a 0' };
    }

    // Generar referencia de pago
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const paymentReference = `PAY-${today}-${random}`;

    // Actualizar la orden como pagada
    const { error: updateOrderError } = await adminSupabase
      .from('lab_orders')
      .update({
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateOrderError) {
      console.error('Error al actualizar orden:', updateOrderError);
      return { success: false, error: 'Error al procesar el pago' };
    }

    revalidatePath('/dashboard/lab/orders');
    revalidatePath(`/dashboard/lab/orders/${order.id}`);

    return {
      success: true,
      invoiceId: order.id,
      invoiceNumber: order.order_number,
    };
  } catch (error) {
    console.error('Error al procesar pago de orden:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al procesar el pago' 
    };
  }
}

// ============================================
// OBTENER ESTADÍSTICAS DE FACTURACIÓN
// ============================================

export async function getPaymentStats(
  startDate?: string,
  endDate?: string
): Promise<PaymentStats> {
  const adminSupabase = createAdminClient();

  try {
    let query = adminSupabase
      .from('invoices')
      .select('status, payment_method, total_amount, amount_paid, created_at');

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error al obtener estadísticas:', error);
      return getEmptyPaymentStats();
    }

    const invoices = data || [];
    
    // Calcular estadísticas basadas en facturas
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
    const totalAmount = invoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
    const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.amount_paid) || 0), 0);
    const averageTicket = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

    // Estadísticas por método de pago
    const byPaymentMethod: Record<string, { count: number; amount: number }> = {
      CASH: { count: 0, amount: 0 },
      CARD: { count: 0, amount: 0 },
      TRANSFER: { count: 0, amount: 0 },
      STRIPE: { count: 0, amount: 0 },
      BIZUM: { count: 0, amount: 0 },
      STRIPE_PENDING: { count: 0, amount: 0 },
    };

    invoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        const method = invoice.payment_method || 'CASH';
        if (byPaymentMethod[method]) {
          byPaymentMethod[method].count++;
          byPaymentMethod[method].amount += Number(invoice.amount_paid) || 0;
        }
      }
    });

    return {
      totalTransactions: totalInvoices,
      successfulTransactions: paidInvoices,
      failedTransactions: pendingInvoices,
      totalAmount,
      totalRefunded: 0, // No hay reembolsos en el esquema actual
      averageTicket,
      byPaymentMethod: byPaymentMethod as Record<string, { count: number; amount: number }>,
    };
  } catch (error) {
    console.error('Error al calcular estadísticas:', error);
    return getEmptyPaymentStats();
  }
}

// ============================================
// CREAR NUEVA FACTURA
// ============================================

export interface CreateInvoiceDTO {
  patientId: string;
  appointmentId?: string;
  items: Array<{
    description: string;
    service_code?: string;
    quantity: number;
    unit_price: number;
    source_type?: string;
    source_id?: string;
  }>;
  taxRate?: number;
  discountAmount?: number;
  dueDate: string;
  notes?: string;
}

export interface CreateInvoiceResult {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

export async function createInvoice(invoiceData: CreateInvoiceDTO): Promise<CreateInvoiceResult> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Generar número de factura
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `INV-${today}-${random}`;

    // Calcular totales
    const subtotal = invoiceData.items.reduce(
      (sum, item) => sum + (item.quantity * item.unit_price),
      0
    );
    const taxAmount = invoiceData.taxRate ? subtotal * (invoiceData.taxRate / 100) : 0;
    const discountAmount = invoiceData.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Preparar items como JSONB
    const items = invoiceData.items.map(item => ({
      description: item.description,
      service_code: item.service_code || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
      source_type: item.source_type || null,
      source_id: item.source_id || null,
    }));

    // Insertar factura
    const { data: invoice, error: insertError } = await adminSupabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        patient_id: invoiceData.patientId,
        appointment_id: invoiceData.appointmentId || null,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        amount_paid: 0,
        items,
        due_date: invoiceData.dueDate,
        notes: invoiceData.notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear factura:', insertError);
      return { success: false, error: 'Error al crear la factura' };
    }

    // Marcar items como facturados (excepto los manuales)
    const billedItems = invoiceData.items
      .filter(item => item.source_type && item.source_id)
      .map(item => ({
        type: item.source_type!,
        id: item.source_id!,
        invoiceId: invoice.id
      }));

    if (billedItems.length > 0) {
      await markItemsAsBilled(billedItems);
    }

    revalidatePath('/dashboard/billing');

    return {
      success: true,
      invoice: invoice as Invoice,
    };
  } catch (error) {
    console.error('Error al crear factura:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al crear la factura' 
    };
  }
}

// ============================================
// OBTENER ITEMS NO FACTURADOS (PARA INTEGRACIÓN)
// ============================================

export interface UnbilledItem {
  id: string;
  type: 'lab_order' | 'appointment' | 'inventory' | 'prescription' | 'manual';
  description: string;
  date: string;
  amount: number;
  details?: string;
  source_data?: Record<string, unknown>;
}

type GetUnbilledItemsResult = {
  success: boolean;
  items?: UnbilledItem[];
  error?: string;
};

export async function getUnbilledItems(
  patientId: string
): Promise<GetUnbilledItemsResult> {
  const adminSupabase = createAdminClient();

  try {
    const unbilledItems: UnbilledItem[] = [];

    // 1. Buscar órdenes de laboratorio no pagadas
    const { data: labOrders, error: labError } = await adminSupabase
      .from('lab_orders')
      .select('id, order_number, total_amount, created_at, payment_status, doctor_id, appointment_id')
      .eq('patient_id', patientId)
      .neq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    if (labError) {
      console.error('Error al obtener órdenes de laboratorio:', labError);
    } else if (labOrders) {
      for (const order of labOrders) {
        const { count } = await adminSupabase
          .from('lab_order_details')
          .select('id', { count: 'exact', head: true })
          .eq('order_id', order.id);
        
        unbilledItems.push({
          id: order.id,
          type: 'lab_order',
          description: `Orden de Laboratorio #${order.order_number}`,
          date: order.created_at,
          amount: Number(order.total_amount) || 0,
          details: `${count || 0} prueba(s) • Estado: ${order.payment_status}`,
          source_data: {
            order_number: order.order_number,
            appointment_id: order.appointment_id,
            doctor_id: order.doctor_id
          }
        });
      }
    }

    // 2. Buscar citas médicas completadas sin factura asociada
    const { data: appointments, error: apptError } = await adminSupabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        appointment_type,
        status,
        reason,
        doctor_id,
        departments!inner(name)
      `)
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('start_time', { ascending: false });

    if (apptError) {
      console.error('Error al obtener citas:', apptError);
    } else if (appointments) {
      for (const appt of appointments) {
        const { data: invoiceData } = await adminSupabase
          .from('invoices')
          .select('id')
          .eq('appointment_id', appt.id)
          .single();

        if (!invoiceData) {
          const appointmentPrices: Record<string, number> = {
            consultation: 100,
            follow_up: 50,
            emergency: 200,
            procedure: 150,
            imaging: 120,
            laboratory: 80,
            surgery: 500
          };
          
          const basePrice = appointmentPrices[appt.appointment_type] || 100;
          
          unbilledItems.push({
            id: appt.id,
            type: 'appointment',
            description: `Consulta: ${appt.appointment_type.replace('_', ' ')}`,
            date: appt.start_time,
            amount: basePrice,
            details: `${appt.departments?.[0]?.name || 'General'} • ${new Date(appt.start_time).toLocaleDateString()}`,
            source_data: {
              appointment_type: appt.appointment_type,
              department: appt.departments?.[0]?.name,
              reason: appt.reason,
              doctor_id: appt.doctor_id
            }
          });
        }
      }
    }

    // 3. Buscar ventas de inventario (medicamentos) no facturadas
    const { data: inventorySales, error: invError } = await adminSupabase
      .from('inventory_transactions')
      .select(`
        id,
        inventory_id,
        quantity,
        previous_quantity,
        new_quantity,
        created_at,
        reference_type,
        reference_id,
        inventory!inner(name, unit_price, category)
      `)
      .eq('transaction_type', 'sale')
      .order('created_at', { ascending: false });

    if (invError) {
      console.error('Error al obtener ventas de inventario:', invError);
    } else if (inventorySales) {
      for (const sale of inventorySales) {
        const inventory = sale.inventory?.[0] as Record<string, unknown> | undefined;
        if (!inventory) continue;
        const amount = (inventory.unit_price as number) * Math.abs(sale.quantity);
        const category = inventory.category as string;
        
        if (category === 'medication' || category === 'consumables' || category === 'lab_supplies') {
          unbilledItems.push({
            id: sale.id,
            type: 'inventory',
            description: `${inventory.name} (x${Math.abs(sale.quantity)} ${inventory.unit})`,
            date: sale.created_at,
            amount: amount,
            details: `${category} • Venta`,
            source_data: {
              inventory_id: sale.inventory_id,
              category: category,
              quantity: sale.quantity
            }
          });
        }
      }
    }

    // 4. Buscar prescripciones pendientes de cobro
    const { data: prescriptions, error: presError } = await adminSupabase
      .from('prescriptions')
      .select(`
        id,
        medication_name,
        quantity_prescribed,
        quantity_dispensed,
        status,
        prescribed_date,
        unit_price
      `)
      .eq('patient_id', patientId)
      .eq('status', 'pending')
      .order('prescribed_date', { ascending: false });

    if (presError) {
      console.error('Error al obtener prescripciones:', presError);
    } else if (prescriptions) {
      for (const pres of prescriptions) {
        const unitPrice = pres.unit_price || 25;
        const totalAmount = unitPrice * pres.quantity_prescribed;
        
        unbilledItems.push({
          id: pres.id,
          type: 'prescription',
          description: `Medicamento: ${pres.medication_name}`,
          date: pres.prescribed_date,
          amount: totalAmount,
          details: `${pres.quantity_prescribed} unidades • ${pres.status}`,
          source_data: {
            medication_name: pres.medication_name,
            quantity: pres.quantity_prescribed,
            status: pres.status
          }
        });
      }
    }

    return {
      success: true,
      items: unbilledItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  } catch (error) {
    console.error('Error al obtener items no facturados:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener items' 
    };
  }
}

// ============================================
// MARCAR ITEMS COMO FACTURADOS
// ============================================

export async function markItemsAsBilled(
  items: Array<{ type: string; id: string; invoiceId: string }>
): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    for (const item of items) {
      switch (item.type) {
        case 'lab_order':
          await adminSupabase
            .from('lab_orders')
            .update({
              payment_status: 'invoiced',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          break;
        case 'appointment':
          await adminSupabase
            .from('appointments')
            .update({
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          break;
        case 'inventory':
          break;
        case 'prescription':
          await adminSupabase
            .from('prescriptions')
            .update({
              status: 'dispensed',
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          break;
      }
    }

    revalidatePath('/dashboard/billing');
    revalidatePath('/dashboard/lab/orders');
    revalidatePath('/dashboard/appointments');
    
    return { success: true };
  } catch (error) {
    console.error('Error al marcar items como facturados:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al actualizar items' 
    };
  }
}

// ============================================
// LEDGER CONSOLIDADO DEL PACIENTE
// ============================================

export interface PatientLedgerEntry {
  id: string;
  date: string;
  type: 'invoice' | 'payment' | 'credit' | 'refund' | 'lab_order' | 'appointment' | 'inventory';
  description: string;
  reference: string;
  debit: number; // Amount owed/increased
  credit: number; // Amount paid/decreased
  balance: number;
  details?: Record<string, unknown>;
}

export interface PatientLedgerSummary {
  patientId: string;
  patientName: string;
  totalInvoiced: number;
  totalPaid: number;
  totalCredits: number;
  pendingBalance: number;
  entries: PatientLedgerEntry[];
}

export async function getPatientLedger(
  patientId: string,
  startDate?: string,
  endDate?: string
): Promise<{ success: boolean; ledger?: PatientLedgerSummary; error?: string }> {
  const adminSupabase = createAdminClient();

  try {
    // Obtener datos del paciente
    const { data: patient, error: patientError } = await adminSupabase
      .from('patients')
      .select('id, first_name, last_name, phone, insurance_provider, insurance_policy_number')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return { success: false, error: 'Paciente no encontrado' };
    }

    const entries: PatientLedgerEntry[] = [];
    let runningBalance = 0;

    // 1. Obtener facturas
    let invoiceQuery = adminSupabase
      .from('invoices')
      .select('id, invoice_number, total_amount, amount_paid, status, created_at, due_date, items')
      .eq('patient_id', patientId);

    if (startDate) invoiceQuery = invoiceQuery.gte('created_at', startDate);
    if (endDate) invoiceQuery = invoiceQuery.lte('created_at', endDate);

    const { data: invoices } = await invoiceQuery.order('created_at', { ascending: true });

    if (invoices) {
      for (const inv of invoices) {
        const items = inv.items as InvoiceItemData[] || [];
        const description = items.length > 0 
          ? `Factura #${inv.invoice_number} (${items.length} item(s))`
          : `Factura #${inv.invoice_number}`;
        
        entries.push({
          id: inv.id,
          date: inv.created_at,
          type: 'invoice',
          description,
          reference: inv.invoice_number,
          debit: Number(inv.total_amount),
          credit: Number(inv.amount_paid),
          balance: 0, // Se calcula después
          details: { status: inv.status, due_date: inv.due_date }
        });
      }
    }

    // 2. Obtener pagos (simulados desde invoices)
    // Los pagos están registrados en amount_paid de las facturas
    for (const entry of entries.filter(e => e.type === 'invoice')) {
      if (entry.credit > 0) {
        entries.push({
          id: `${entry.id}-payment`,
          date: entry.date,
          type: 'payment',
          description: `Pago a factura ${entry.reference}`,
          reference: `PAY-${entry.reference}`,
          debit: 0,
          credit: entry.credit,
          balance: 0,
          details: { invoice_id: entry.id }
        });
      }
    }

    // 3. Obtener órdenes de laboratorio
    const { data: labOrders } = await adminSupabase
      .from('lab_orders')
      .select('id, order_number, total_amount, payment_status, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true });

    if (labOrders) {
      for (const order of labOrders) {
        entries.push({
          id: order.id,
          date: order.created_at,
          type: 'lab_order',
          description: `Orden de Laboratorio #${order.order_number}`,
          reference: order.order_number,
          debit: Number(order.total_amount) || 0,
          credit: order.payment_status === 'paid' || order.payment_status === 'invoiced' ? Number(order.total_amount) || 0 : 0,
          balance: 0,
          details: { payment_status: order.payment_status }
        });
      }
    }

    // 4. Obtener transacciones de inventario (ventas)
    const { data: inventoryTx } = await adminSupabase
      .from('inventory_transactions')
      .select('id, inventory_id, quantity, created_at, transaction_type, reference_id')
      .eq('transaction_type', 'sale')
      .order('created_at', { ascending: true });

    if (inventoryTx) {
      for (const tx of inventoryTx) {
        // Esta es una simplificación - en producción habría que cruzar con patient_id
        // Por ahora solo contamos transacciones de pacientes específicos
      }
    }

    // Ordenar por fecha
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calcular balance running
    let currentBalance = 0;
    for (const entry of entries) {
      currentBalance += entry.debit - entry.credit;
      entry.balance = currentBalance;
    }

    const totalInvoiced = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalPaid = entries.reduce((sum, e) => sum + e.credit, 0);

    return {
      success: true,
      ledger: {
        patientId: patient.id,
        patientName: `${patient.first_name} ${patient.last_name}`,
        totalInvoiced,
        totalPaid,
        totalCredits: 0,
        pendingBalance: currentBalance,
        entries
      }
    };
  } catch (error) {
    console.error('Error al obtener ledger del paciente:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener ledger' 
    };
  }
}

// ============================================
// GENERAR RECLAMACIÓN DE SEGURO
// ============================================

export interface InsuranceClaimItem {
  cptCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  icdCodes: string[];
}

export interface InsuranceClaim {
  patientId: string;
  patientName: string;
  insuranceProvider: string;
  policyNumber: string;
  claimNumber: string;
  serviceDate: string;
  totalAmount: number;
  items: InsuranceClaimItem[];
  generatedAt: string;
}

export async function generateInsuranceClaim(
  invoiceId: string
): Promise<{ success: boolean; claim?: InsuranceClaim; error?: string }> {
  const adminSupabase = createAdminClient();

  try {
    // Obtener factura con datos del paciente
    const { data: invoice, error: invoiceError } = await adminSupabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        total_amount,
        items,
        created_at,
        issued_date,
        patients!inner(id, first_name, last_name, insurance_provider, insurance_policy_number)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: 'Factura no encontrada' };
    }

    const patient = invoice.patients?.[0] as Record<string, unknown> | undefined;
    
    if (!patient?.insurance_provider) {
      return { success: false, error: 'El paciente no tiene seguro asociado' };
    }

    // Generar número de reclamación
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
    const claimNumber = `CLM-${today}-${random}`;

    // Convertir items de factura a formato de reclamación
    const items: InsuranceClaimItem[] = [];
    const invoiceItems = invoice.items as InvoiceItemData[] || [];
    
    for (const item of invoiceItems) {
      items.push({
        cptCode: item.service_code || 'N/A',
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total,
        icdCodes: [] // ICD codes vendrían de medical_records si existen
      });
    }

    const claim: InsuranceClaim = {
      patientId: patient.id as string,
      patientName: `${patient.first_name} ${patient.last_name}`,
      insuranceProvider: patient.insurance_provider as string,
      policyNumber: patient.insurance_policy_number as string,
      claimNumber,
      serviceDate: invoice.issued_date,
      totalAmount: Number(invoice.total_amount),
      items,
      generatedAt: new Date().toISOString()
    };

    return {
      success: true,
      claim
    };
  } catch (error) {
    console.error('Error al generar reclamación de seguro:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al generar reclamación' 
    };
  }
}

// ============================================
// CRÉDITOS Y ANTICIPOS DE PACIENTES
// ============================================

export interface PatientCredit {
  id: string;
  patient_id: string;
  amount: number;
  balance: number;
  credit_type: 'deposit' | 'refund' | 'adjustment';
  description: string;
  reference?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export async function createPatientCredit(
  patientId: string,
  amount: number,
  creditType: 'deposit' | 'refund' | 'adjustment',
  description: string,
  reference?: string,
  expiresAt?: string
): Promise<{ success: boolean; credit?: PatientCredit; error?: string }> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    const { data, error } = await adminSupabase
      .from('patient_credits')
      .insert({
        patient_id: patientId,
        amount,
        balance: amount,
        credit_type: creditType,
        description,
        reference,
        expires_at: expiresAt || null,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear crédito:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/billing');
    
    return {
      success: true,
      credit: data as PatientCredit
    };
  } catch (error) {
    console.error('Error al crear crédito de paciente:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al crear crédito' 
    };
  }
}

export async function getPatientCredits(
  patientId: string
): Promise<{ success: boolean; credits?: PatientCredit[]; totalBalance?: number; error?: string }> {
  const adminSupabase = createAdminClient();

  try {
    const { data, error } = await adminSupabase
      .from('patient_credits')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener créditos:', error);
      return { success: false, error: error.message };
    }

    const credits = (data || []) as PatientCredit[];
    const totalBalance = credits.reduce((sum, c) => sum + c.balance, 0);

    return {
      success: true,
      credits,
      totalBalance
    };
  } catch (error) {
    console.error('Error al obtener créditos del paciente:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al obtener créditos' 
    };
  }
}

export async function applyCreditToInvoice(
  creditId: string,
  invoiceId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Obtener crédito
    const { data: credit, error: creditError } = await adminSupabase
      .from('patient_credits')
      .select('*')
      .eq('id', creditId)
      .eq('is_active', true)
      .single();

    if (creditError || !credit) {
      return { success: false, error: 'Crédito no encontrado' };
    }

    if (credit.balance < amount) {
      return { success: false, error: 'El crédito no tiene saldo suficiente' };
    }

    // Actualizar saldo del crédito
    const { error: updateCreditError } = await adminSupabase
      .from('patient_credits')
      .update({
        balance: credit.balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', creditId);

    if (updateCreditError) {
      return { success: false, error: updateCreditError.message };
    }

    // Desactivar crédito si saldo es 0
    if (credit.balance - amount <= 0) {
      await adminSupabase
        .from('patient_credits')
        .update({ is_active: false })
        .eq('id', creditId);
    }

    revalidatePath('/dashboard/billing');
    
    return { success: true };
  } catch (error) {
    console.error('Error al aplicar crédito:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al aplicar crédito' 
    };
  }
}

// ============================================
// PAGOS DIVIDIDOS
// ============================================

export interface SplitPayment {
  invoiceId: string;
  payments: Array<{
    method: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'INSURANCE';
    amount: number;
    reference?: string;
    creditId?: string;
  }>;
}

export async function processSplitPayment(
  paymentData: SplitPayment
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Obtener factura
    const { data: invoice, error: invoiceError } = await adminSupabase
      .from('invoices')
      .select('*')
      .eq('id', paymentData.invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: 'Factura no encontrada' };
    }

    // Calcular total de pagos
    const totalPayment = paymentData.payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = Number(invoice.total_amount) - Number(invoice.amount_paid || 0);

    if (totalPayment !== pendingAmount) {
      return { 
        success: false, 
        error: `El total de pagos (${totalPayment}) no coincide con el pendiente (${pendingAmount})` 
      };
    }

    // Generar referencia de pago combinada
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const paymentReference = `PAY-${today}-${random}`;

    // Procesar cada método de pago
    for (const payment of paymentData.payments) {
      // Si es crédito, aplicarlo
      if (payment.method === 'CREDIT' && payment.creditId) {
        await applyCreditToInvoice(payment.creditId, paymentData.invoiceId, payment.amount);
      }
    }

    // Actualizar factura
    const newAmountPaid = Number(invoice.amount_paid || 0) + totalPayment;
    const newStatus = newAmountPaid >= Number(invoice.total_amount) ? 'paid' : 'pending';

    const { error: updateError } = await adminSupabase
      .from('invoices')
      .update({
        status: newStatus,
        amount_paid: newAmountPaid,
        payment_method: 'SPLIT',
        payment_reference: paymentReference,
        paid_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentData.invoiceId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/dashboard/billing');
    revalidatePath(`/dashboard/billing/${paymentData.invoiceId}`);

    return {
      success: true,
      invoiceId: paymentData.invoiceId
    };
  } catch (error) {
    console.error('Error al procesar pago dividido:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al procesar pago' 
    };
  }
}
