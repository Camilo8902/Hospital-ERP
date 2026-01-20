import { NextRequest, NextResponse } from 'next/server';
import { getPaymentTransaction, cancelPendingPayment } from '@/lib/actions/payments';
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/server';
import type { PaymentStatusResponse } from '@/lib/types';

// ============================================
// GET /api/payments/transactions/[id]
// Obtiene una transacción por ID
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PaymentStatusResponse>> {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de transacción requerido' },
        { status: 400 }
      );
    }

    const transaction = await getPaymentTransaction(id);

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error('Error al obtener transacción:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/payments/transactions/[id]
// Cancela una transacción pendiente
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de transacción requerido' },
        { status: 400 }
      );
    }

    const result = await cancelPendingPayment(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al cancelar transacción:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
