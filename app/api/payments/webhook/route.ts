import { NextRequest, NextResponse } from 'next/server';
import { confirmInvoicePayment } from '@/lib/actions/payments';
import { headers } from 'next/headers';
import crypto from 'crypto';

// ============================================
// POST /api/payments/webhook
// Recibe y procesa eventos de Stripe para confirmar pagos de facturas
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Obtener el cuerpo de la solicitud
    const body = await request.json();
    
    // Obtener headers para verificar la firma del webhook
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    // Verificar firma del webhook (solo en producción)
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    const isDevelopment = process.env.NODE_ENV === 'development' || !webhookSecret;

    let eventId: string | null = null;
    let eventType: string | null = null;

    if (!isDevelopment && signature && webhookSecret) {
      // Verificar la firma de Stripe
      try {
        const sig = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(body))
          .digest('hex');

        const elements = signature.split(',');
        const timestamp = elements.find(e => e.startsWith('t='))?.slice(2);
        const v1Signature = elements.find(e => e.startsWith('v1='))?.slice(4);

        if (timestamp && v1Signature) {
          const signedPayload = `${timestamp}.${JSON.stringify(body)}`;
          const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(signedPayload)
            .digest('hex');

          if (v1Signature !== expectedSignature) {
            console.error('Firma de webhook inválida');
            return NextResponse.json(
              { error: 'Firma de webhook inválida' },
              { status: 400 }
            );
          }
        }
      } catch (sigError) {
        console.error('Error al verificar firma:', sigError);
      }
    }

    // Extraer información del evento
    eventId = body.id as string;
    eventType = body.type as string;

    if (!eventId || !eventType) {
      return NextResponse.json(
        { error: 'Evento inválido: falta id o type' },
        { status: 400 }
      );
    }

    console.log(`Recibido webhook de Stripe: ${eventType} (${eventId})`);

    // Procesar según el tipo de evento
    interface StripeEventData {
      object?: {
        id?: string;
        metadata?: Record<string, string>;
        charges?: {
          data?: Array<{ id: string }>;
        };
      };
    }

    const stripePayload = body as StripeEventData & { type: string };

    // Solo procesar eventos de pago exitoso
    if (eventType === 'payment_intent.succeeded') {
      const paymentIntent = stripePayload.object;
      const invoiceId = paymentIntent?.metadata?.invoice_id;
      const providerTransactionId = paymentIntent?.charges?.data?.[0]?.id || paymentIntent?.id;

      if (invoiceId) {
        const result = await confirmInvoicePayment(
          invoiceId,
          'STRIPE',
          providerTransactionId
        );

        if (!result.success) {
          console.error(`Error confirmando pago de factura ${invoiceId}:`, result.error);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
