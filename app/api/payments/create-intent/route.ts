import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent, CreatePaymentIntentDTO } from '@/lib/actions/payments';
import { getCurrentUser } from '@/lib/supabase/server';

interface CreatePaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  transactionId?: string;
  providerPaymentIntentId?: string;
  error?: string;
}

// ============================================
// POST /api/payments/create-intent
// Crea una intención de pago en Stripe
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<CreatePaymentIntentResponse>> {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Parsear el cuerpo de la solicitud
    const body = await request.json();

    // Validaciones básicas
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'El monto es requerido y debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!body.referenceType || !body.referenceId) {
      return NextResponse.json(
        { success: false, error: 'La referencia (tipo e ID) es requerida' },
        { status: 400 }
      );
    }

    // Validar tipo de referencia
    const validReferenceTypes = ['INVOICE', 'LAB_ORDER'];
    if (!validReferenceTypes.includes(body.referenceType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de referencia inválido' },
        { status: 400 }
      );
    }

    // Crear la intención de pago
    const paymentData: CreatePaymentIntentDTO = {
      amount: body.amount,
      currency: body.currency,
      paymentMethod: body.paymentMethod,
      description: body.description,
      customerEmail: body.customerEmail,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      metadata: body.metadata,
    };

    const result = await createPaymentIntent(paymentData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      transactionId: result.transactionId!,
      providerPaymentIntentId: result.providerPaymentIntentId,
    });
  } catch (error) {
    console.error('Error en create-intent:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
