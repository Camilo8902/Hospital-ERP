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
  items: Array<{
    id?: string;
    description: string;
    service_code?: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  due_date: string;
  issued_date: string;
  paid_date: string | null;
  created_at: string;
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

    return data as Invoice;
  } catch (error) {
    console.error('Error al obtener factura:', error);
    return null;
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
// CANCELAR FACTURA
// ============================================

export async function cancelInvoice(
  invoiceId: string
): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();

  try {
    const { error: updateError } = await adminSupabase
      .from('invoices')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/dashboard/billing');
    revalidatePath(`/dashboard/billing/${invoiceId}`);

    return { success: true };
  } catch (error) {
    console.error('Error al cancelar factura:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al cancelar la factura' 
    };
  }
}

// ============================================
// OBTENER ITEMS NO FACTURADOS (PARA INTEGRACIÓN)
// ============================================

export interface UnbilledItem {
  id: string;
  type: 'lab_order' | 'appointment' | 'pos_sale' | 'manual';
  description: string;
  date: string;
  amount: number;
  details?: string;
}

export async function getUnbilledItems(
  patientId: string
): Promise<{ success: boolean; items?: UnbilledItem[]; error?: string }> {
  const adminSupabase = createAdminClient();

  try {
    const unbilledItems: UnbilledItem[] = [];

    // 1. Buscar órdenes de laboratorio no pagadas
    const { data: labOrders, error: labError } = await adminSupabase
      .from('lab_orders')
      .select('id, order_number, total_amount, created_at, payment_status')
      .eq('patient_id', patientId)
      .neq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    if (labError) {
      console.error('Error al obtener órdenes de laboratorio:', labError);
    } else if (labOrders) {
      labOrders.forEach(order => {
        unbilledItems.push({
          id: order.id,
          type: 'lab_order',
          description: `Orden de Laboratorio #${order.order_number}`,
          date: order.created_at,
          amount: Number(order.total_amount) || 0,
          details: `Estado de pago: ${order.payment_status}`
        });
      });
    }

    // 2. Buscar citas médicas no facturadas
    // Descomentar cuando se agregue el campo billing_status a appointments
    /*
    const { data: appointments, error: apptError } = await adminSupabase
      .from('appointments')
      .select('id, appointment_date, total_amount, status')
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .is('billing_status', null)
      .order('appointment_date', { ascending: false });

    if (apptError) {
      console.error('Error al obtener citas:', apptError);
    } else if (appointments) {
      appointments.forEach(appt => {
        unbilledItems.push({
          id: appt.id,
          type: 'appointment',
          description: `Consulta Médica`,
          date: appt.appointment_date,
          amount: Number(appt.total_amount) || 0,
          details: `Fecha: ${appt.appointment_date}`
        });
      });
    }
    */

    // 3. Buscar ventas de POS no asociadas a factura
    const { data: posSales, error: posError } = await adminSupabase
      .from('pos_sales')
      .select('id, sale_number, total_amount, created_at')
      .eq('patient_id', patientId)
      .is('invoice_id', null)
      .order('created_at', { ascending: false });

    if (posError) {
      console.error('Error al obtener ventas POS:', posError);
    } else if (posSales) {
      posSales.forEach(sale => {
        unbilledItems.push({
          id: sale.id,
          type: 'pos_sale',
          description: `Venta Farmacia #${sale.sale_number}`,
          date: sale.created_at,
          amount: Number(sale.total_amount) || 0,
          details: `Venta en mostrador`
        });
      });
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
