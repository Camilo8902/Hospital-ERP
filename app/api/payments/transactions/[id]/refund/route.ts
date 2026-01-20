import { NextRequest, NextResponse } from 'next/server';
import { refundPayment } from '@/lib/actions/payments';
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/server';
import type { ProcessRefundDTO, ProcessRefundResponse } from '@/lib/types';

// ============================================
// POST /api/payments/transactions/[id]/refund
// Procesa un reembolso para una transacción
// ============================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ProcessRefundResponse>> {
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

    // Verificar que el usuario tiene permisos de administrador
    const profile = await getCurrentProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'billing')) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para procesar reembolsos' },
        { status: 403 }
      );
    }

    // Parsear el cuerpo de la solicitud
    const body: ProcessRefundDTO = await request.json();

    if (!body.reason) {
      return NextResponse.json(
        { success: false, error: 'La razón del reembolso es requerida' },
        { status: 400 }
      );
    }

    // Procesar el reembolso
    const result = await refundPayment(id, body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      refund: result.refund,
    });
  } catch (error) {
    console.error('Error al procesar reembolso:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
