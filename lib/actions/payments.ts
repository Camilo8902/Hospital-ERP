'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from './users';
import type { 
  PaymentTransaction, 
  PaymentRefund, 
  CreatePaymentIntentDTO,
  ProcessRefundDTO,
  PaymentStats 
} from '@/lib/types';

// ============================================
// CONFIGURACIÓN DE STRIPE (Simulada para Fase 1)
// ============================================

// En producción, usar: import Stripe from 'stripe';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

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
// FUNCIONES AUXILIARES
// ============================================

/**
 * Convierte euros a céntimos
 */
function eurToCents(eurAmount: number): number {
  return Math.round(eurAmount * 100);
}

/**
 * Convierte céntimos a euros
 */
function centsToEur(centsAmount: number): number {
  return centsAmount / 100;
}

/**
 * Genera un número de referencia único para la transacción
 */
function generatePaymentReference(): string {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `PAY-${today}-${random}`;
}

/**
 * Mapea el tipo de método de pago al código de Stripe
 */
function mapPaymentMethodToStripe(method: string): string {
  switch (method) {
    case 'CARD':
      return 'card';
    case 'BIZUM':
      return 'card'; // Bizum se procesa como tarjeta a través de Stripe
    case 'SEPA_DEBIT':
      return 'sepa_debit';
    default:
      return 'card';
  }
}

// ============================================
// CREAR INTENCIÓN DE PAGO
// ============================================

export interface CreatePaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  transactionId?: string;
  providerPaymentIntentId?: string;
  error?: string;
}

/**
 * Crea una intención de pago en Stripe y registra la transacción en la base de datos
 * 
 * @param paymentData - Datos para crear el pago
 * @returns Resultado con el clientSecret para completar el pago en el cliente
 */
export async function createPaymentIntent(
  paymentData: CreatePaymentIntentDTO
): Promise<CreatePaymentIntentResult> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  // Verificar que el usuario tiene permisos
  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Validar el monto (debe ser positivo)
    if (paymentData.amount <= 0) {
      return { success: false, error: 'El monto debe ser mayor a 0' };
    }

    // Generar referencia única
    const paymentReference = generatePaymentReference();

    // En producción, crear el PaymentIntent en Stripe:
    /*
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentData.amount,
      currency: paymentData.currency || 'eur',
      payment_method_types: [mapPaymentMethodToStripe(paymentData.paymentMethod)],
      metadata: {
        reference_type: paymentData.referenceType,
        reference_id: paymentData.referenceId,
        internal_reference: paymentReference,
      },
      description: paymentData.description || `Pago para ${paymentData.referenceType}`,
      receipt_email: paymentData.customerEmail,
      statement_descriptor: 'MEDICORE ERP',
      // Para SEPA Debit
      setup_future_usage: paymentData.paymentMethod === 'SEPA_DEBIT' ? 'off_session' : undefined,
    });
    */

    // Simular creación de PaymentIntent para desarrollo
    const mockPaymentIntent: StripePaymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      status: 'requires_payment_method',
      amount: paymentData.amount,
      currency: paymentData.currency || 'eur',
    };

    // Registrar la transacción en la base de datos
    const { data: transaction, error: txError } = await adminSupabase
      .from('payment_transactions')
      .insert({
        amount: paymentData.amount,
        currency: paymentData.currency || 'EUR',
        status: 'PENDING',
        payment_method: paymentData.paymentMethod,
        provider: 'STRIPE',
        provider_payment_intent_id: mockPaymentIntent.id,
        description: paymentData.description || `Pago para ${paymentData.referenceType}`,
        customer_email: paymentData.customerEmail,
        customer_name: paymentData.customerName,
        customer_phone: paymentData.customerPhone,
        reference_type: paymentData.referenceType,
        reference_id: paymentData.referenceId,
        metadata: {
          ...paymentData.metadata,
          operator_id: user.id,
          operator_email: user.email,
        },
      })
      .select()
      .single();

    if (txError) {
      console.error('Error al registrar transacción de pago:', txError);
      return { success: false, error: 'Error al registrar la transacción' };
    }

    // Actualizar la entidad relacionada (orden de laboratorio, consulta, etc.)
    if (paymentData.referenceType === 'LAB_ORDER') {
      await adminSupabase
        .from('lab_orders')
        .update({ is_paid: false }) // Se marcará como pagado cuando webhook confirme
        .eq('id', paymentData.referenceId);
    }

    revalidatePath('/dashboard/billing');
    revalidatePath('/dashboard/lab/orders');

    return {
      success: true,
      clientSecret: mockPaymentIntent.client_secret,
      transactionId: transaction.id,
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
// CONFIRMAR PAGO (DESDE WEBHOOK O CONFIRMACIÓN MANUAL)
// ============================================

export interface ConfirmPaymentResult {
  success: boolean;
  transaction?: PaymentTransaction;
  error?: string;
}

/**
 * Confirma un pago y actualiza el estado de la transacción
 * Este método es llamado principalmente desde el webhook de Stripe
 */
export async function confirmPayment(
  providerPaymentIntentId: string,
  status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING',
  additionalData?: {
    providerTransactionId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ConfirmPaymentResult> {
  const adminSupabase = createAdminClient();

  try {
    // Buscar la transacción por el ID de PaymentIntent de Stripe
    const { data: transaction, error: findError } = await adminSupabase
      .from('payment_transactions')
      .select('*')
      .eq('provider_payment_intent_id', providerPaymentIntentId)
      .single();

    if (findError || !transaction) {
      return { success: false, error: 'Transacción no encontrada' };
    }

    // Actualizar el estado de la transacción
    const updateData: Record<string, unknown> = {
      status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'SUCCEEDED') {
      updateData.completed_at = new Date().toISOString();
      updateData.provider_transaction_id = additionalData?.providerTransactionId || providerPaymentIntentId;
    }

    if (additionalData?.metadata) {
      updateData.metadata = {
        ...transaction.metadata,
        ...additionalData.metadata,
        confirmed_at: new Date().toISOString(),
      };
    }

    const { data: updatedTransaction, error: updateError } = await adminSupabase
      .from('payment_transactions')
      .update(updateData)
      .eq('id', transaction.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error al confirmar pago:', updateError);
      return { success: false, error: 'Error al actualizar la transacción' };
    }

    // Si el pago fue exitoso, marcar la entidad relacionada como pagada
    if (status === 'SUCCEEDED' && transaction.reference_type && transaction.reference_id) {
      const referenceType = transaction.reference_type;
      const referenceId = transaction.reference_id;

      switch (referenceType) {
        case 'LAB_ORDER':
          await adminSupabase
            .from('lab_orders')
            .update({ is_paid: true })
            .eq('id', referenceId);
          break;
          
        case 'CONSULTATION':
          // Actualizar estado de la cita/consulta si es necesario
          break;
          
        case 'INVOICE':
          await adminSupabase
            .from('invoices')
            .update({ 
              status: 'paid',
              amount_paid: transaction.amount,
              paid_date: new Date().toISOString().split('T')[0],
              payment_method: transaction.payment_method,
              payment_reference: transaction.id,
            })
            .eq('id', referenceId);
          break;
      }

      // Revalidar páginas relevantes
      revalidatePath('/dashboard/billing');
      revalidatePath('/dashboard/lab/orders');
    }

    return { success: true, transaction: updatedTransaction as PaymentTransaction };
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al confirmar el pago' 
    };
  }
}

// ============================================
// OBTENER TRANSACCIÓN POR ID
// ============================================

export async function getPaymentTransaction(
  transactionId: string
): Promise<PaymentTransaction | null> {
  const adminSupabase = createAdminClient();

  try {
    const { data, error } = await adminSupabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as PaymentTransaction;
  } catch (error) {
    console.error('Error al obtener transacción:', error);
    return null;
  }
}

// ============================================
// OBTENER TRANSACCIONES POR REFERENCIA
// ============================================

export async function getPaymentTransactionsByReference(
  referenceType: string,
  referenceId: string
): Promise<PaymentTransaction[]> {
  const adminSupabase = createAdminClient();

  try {
    const { data, error } = await adminSupabase
      .from('payment_transactions')
      .select('*')
      .eq('reference_type', referenceType)
      .eq('reference_id', referenceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener transacciones:', error);
      return [];
    }

    return (data || []) as PaymentTransaction[];
  } catch (error) {
    console.error('Error al obtener transacciones por referencia:', error);
    return [];
  }
}

// ============================================
// PROCESAR REEMBOLSO
// ============================================

export interface RefundPaymentResult {
  success: boolean;
  refund?: PaymentRefund;
  transaction?: PaymentTransaction;
  error?: string;
}

/**
 * Procesa un reembolso para una transacción
 */
export async function refundPayment(
  transactionId: string,
  refundData: ProcessRefundDTO
): Promise<RefundPaymentResult> {
  const adminSupabase = createAdminClient();
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  try {
    // Obtener la transacción original
    const { data: transaction, error: findError } = await adminSupabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (findError || !transaction) {
      return { success: false, error: 'Transacción no encontrada' };
    }

    // Verificar que la transacción puede ser reembolsada
    if (transaction.status !== 'SUCCEEDED') {
      return { success: false, error: 'La transacción no está completada' };
    }

    // Calcular el monto a reembolsar
    const refundAmount = refundData.amount 
      ? Math.min(refundData.amount, transaction.amount - transaction.refunded_amount)
      : transaction.amount - transaction.refunded_amount;

    if (refundAmount <= 0) {
      return { success: false, error: 'El monto de reembolso es inválido o ya se reembolsó completamente' };
    }

    // En producción, crear el reembolso en Stripe:
    /*
    const stripeRefund = await stripe.refunds.create({
      payment_intent: transaction.provider_payment_intent_id,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        transaction_id: transactionId,
        reason: refundData.reason,
      },
    });
    */

    // Simular reembolso
    const mockRefund: StripeRefund = {
      id: `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'succeeded',
      amount: refundAmount,
    };

    // Iniciar transacción de base de datos
    await adminSupabase.rpc('BEGIN_TRANSACTION');

    try {
      // Registrar el reembolso
      const { data: refund, error: refundError } = await adminSupabase
        .from('payment_refunds')
        .insert({
          transaction_id: transactionId,
          amount: refundAmount,
          currency: transaction.currency,
          status: 'SUCCEEDED',
          provider_refund_id: mockRefund.id,
          reason: refundData.reason,
          notes: refundData.notes,
          processed_by: user.id,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (refundError) {
        throw refundError;
      }

      // Actualizar el estado de la transacción
      const newRefundedAmount = transaction.refunded_amount + refundAmount;
      const newStatus = newRefundedAmount >= transaction.amount 
        ? 'REFUNDED' 
        : 'PARTIALLY_REFUNDED';

      const { data: updatedTransaction, error: updateError } = await adminSupabase
        .from('payment_transactions')
        .update({
          status: newStatus,
          refunded_amount: newRefundedAmount,
          refund_reason: refundData.reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Si está completamente reembolsada, actualizar la entidad relacionada
      if (newStatus === 'REFUNDED' && transaction.reference_type && transaction.reference_id) {
        switch (transaction.reference_type) {
          case 'LAB_ORDER':
            await adminSupabase
              .from('lab_orders')
              .update({ is_paid: false })
              .eq('id', transaction.reference_id);
            break;
          case 'INVOICE':
            await adminSupabase
              .from('invoices')
              .update({ 
                status: 'pending',
                amount_paid: 0,
                paid_date: null,
              })
              .eq('id', transaction.reference_id);
            break;
        }
      }

      await adminSupabase.rpc('COMMIT_TRANSACTION');

      revalidatePath('/dashboard/billing');
      revalidatePath('/dashboard/lab/orders');

      return {
        success: true,
        refund: refund as PaymentRefund,
        transaction: updatedTransaction as PaymentTransaction,
      };
    } catch (error) {
      await adminSupabase.rpc('ROLLBACK_TRANSACTION');
      throw error;
    }
  } catch (error) {
    console.error('Error al procesar reembolso:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al procesar el reembolso' 
    };
  }
}

// ============================================
// OBTENER ESTADÍSTICAS DE PAGOS
// ============================================

export async function getPaymentStats(
  startDate?: string,
  endDate?: string
): Promise<PaymentStats> {
  const adminSupabase = createAdminClient();

  try {
    let query = adminSupabase
      .from('payment_transactions')
      .select('status, payment_method, amount, refunded_amount');

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

    const transactions = data || [];
    
    // Calcular estadísticas
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(t => t.status === 'SUCCEEDED').length;
    const failedTransactions = transactions.filter(t => t.status === 'FAILED').length;
    const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalRefunded = transactions.reduce((sum, t) => sum + (t.refunded_amount || 0), 0);
    const averageTicket = totalAmount > 0 ? totalAmount / successfulTransactions : 0;

    // Estadísticas por método de pago
    const byPaymentMethod: Record<string, { count: number; amount: number }> = {
      CARD: { count: 0, amount: 0 },
      BIZUM: { count: 0, amount: 0 },
      SEPA_DEBIT: { count: 0, amount: 0 },
      PAYPAL: { count: 0, amount: 0 },
    };

    transactions.forEach(t => {
      if (t.status === 'SUCCEEDED') {
        const method = t.payment_method || 'CARD';
        if (byPaymentMethod[method]) {
          byPaymentMethod[method].count++;
          byPaymentMethod[method].amount += t.amount || 0;
        }
      }
    });

    return {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      totalAmount,
      totalRefunded,
      averageTicket,
      byPaymentMethod: byPaymentMethod as Record<string, { count: number; amount: number }>,
    };
  } catch (error) {
    console.error('Error al calcular estadísticas:', error);
    return getEmptyPaymentStats();
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
// OBTENER HISTORIAL DE TRANSACCIONES
// ============================================

export async function getPaymentHistory(
  filters?: {
    status?: string;
    paymentMethod?: string;
    referenceType?: string;
    startDate?: string;
    endDate?: string;
  },
  limit: number = 50,
  offset: number = 0
): Promise<{ transactions: PaymentTransaction[]; total: number }> {
  const adminSupabase = createAdminClient();

  try {
    let query = adminSupabase
      .from('payment_transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.paymentMethod) {
      query = query.eq('payment_method', filters.paymentMethod);
    }

    if (filters?.referenceType) {
      query = query.eq('reference_type', filters.referenceType);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error al obtener historial:', error);
      return { transactions: [], total: 0 };
    }

    return {
      transactions: (data || []) as PaymentTransaction[],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    return { transactions: [], total: 0 };
  }
}

// ============================================
// PROCESAR WEBHOOK DE STRIPE
// ============================================

export interface ProcessWebhookResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Procesa un evento de webhook recibido de Stripe
 */
export async function processStripeWebhook(
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<ProcessWebhookResult> {
  const adminSupabase = createAdminClient();

  try {
    // Verificar si el evento ya fue procesado
    const { data: existingEvent } = await adminSupabase
      .from('payment_webhook_events')
      .select('id')
      .eq('stripe_event_id', eventId)
      .single();

    if (existingEvent) {
      return { success: true, eventId, error: 'Evento ya procesado' };
    }

    // Registrar el evento
    const { data: webhookEvent, error: webhookError } = await adminSupabase
      .from('payment_webhook_events')
      .insert({
        stripe_event_id: eventId,
        event_type: eventType,
        payload: payload,
      })
      .select()
      .single();

    if (webhookError) {
      console.error('Error al registrar webhook:', webhookError);
      return { success: false, error: 'Error al registrar el evento' };
    }

    // Procesar según el tipo de evento
    let result: { success: boolean; error?: string } = { success: true };

    // Definir tipo para eventos de Stripe
    interface StripeEventPayload {
      data?: {
        object?: Record<string, unknown>;
        charges?: {
          data?: Array<{ id: string }>;
        };
      };
    }

    const stripePayload = payload as StripeEventPayload;

    switch (eventType) {
      case 'payment_intent.succeeded':
        const paymentIntent = stripePayload.data?.object;
        const piId = paymentIntent?.id as string | undefined;
        if (piId) {
          result = await confirmPayment(piId, 'SUCCEEDED', {
            providerTransactionId: stripePayload.data?.charges?.data?.[0]?.id as string | undefined,
          });
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = stripePayload.data?.object;
        const failedPiId = failedPaymentIntent?.id as string | undefined;
        if (failedPiId) {
          result = await confirmPayment(failedPiId, 'FAILED');
        }
        break;

      case 'charge.refunded':
        // Manejar reembolsos desde Stripe
        const charge = stripePayload.data?.object;
        const paymentIntentId = charge?.payment_intent as string | undefined;
        if (paymentIntentId) {
          await confirmPayment(paymentIntentId, 'SUCCEEDED'); // Actualizar monto reembolsado
        }
        break;

      case 'payment_intent.processing':
        const processingPaymentIntent = stripePayload.data?.object;
        const processingPiId = processingPaymentIntent?.id as string | undefined;
        if (processingPiId) {
          result = await confirmPayment(processingPiId, 'PROCESSING');
        }
        break;

      default:
        console.log(`Evento de Stripe no manejado: ${eventType}`);
    }

    // Actualizar estado del evento de webhook
    await adminSupabase
      .from('payment_webhook_events')
      .update({
        processed: result.success,
        processed_at: new Date().toISOString(),
        error_message: result.error,
      })
      .eq('id', webhookEvent.id);

    return { success: result.success, eventId };
  } catch (error) {
    console.error('Error al procesar webhook:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al procesar el webhook' 
    };
  }
}

// ============================================
// CANCELAR PAGO PENDIENTE
// ============================================

export async function cancelPendingPayment(
  transactionId: string
): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();

  try {
    const { data: transaction, error: findError } = await adminSupabase
      .from('payment_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (findError || !transaction) {
      return { success: false, error: 'Transacción no encontrada' };
    }

    if (transaction.status !== 'PENDING') {
      return { success: false, error: 'Solo se pueden cancelar pagos pendientes' };
    }

    // Cancelar en Stripe si existe PaymentIntent
    if (transaction.provider_payment_intent_id) {
      /*
      await stripe.paymentIntents.cancel(transaction.provider_payment_intent_id);
      */
    }

    // Actualizar estado
    const { error: updateError } = await adminSupabase
      .from('payment_transactions')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/dashboard/billing');
    return { success: true };
  } catch (error) {
    console.error('Error al cancelar pago:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error al cancelar el pago' 
    };
  }
}
