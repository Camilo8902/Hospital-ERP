import { NextResponse } from 'next/server';
import { processManualPayment } from '@/lib/actions/payments';
import { getCurrentUser } from '@/lib/actions/users';

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicie sesión.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { invoiceId, paymentMethod, amount, reference, notes } = body;

    // Validar datos requeridos
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'ID de factura requerido' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Método de pago requerido' },
        { status: 400 }
      );
    }

    // Validar método de pago
    const validPaymentMethods = ['CASH', 'CARD', 'TRANSFER'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Método de pago inválido' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Monto válido requerido' },
        { status: 400 }
      );
    }

    // Procesar el pago - el usuario se obtiene internamente
    const result = await processManualPayment({
      invoiceId,
      paymentMethod: paymentMethod as 'CASH' | 'CARD' | 'TRANSFER',
      amount: parseFloat(amount),
      reference,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al procesar el pago' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      invoiceId: result.invoiceId,
      invoiceNumber: result.invoiceNumber,
      message: 'Pago procesado exitosamente',
    });
  } catch (error) {
    console.error('Error en API de pago manual:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
