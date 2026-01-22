import { NextRequest, NextResponse } from 'next/server';
import { getInvoiceById, cancelInvoice } from '@/lib/actions/payments';
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/server';

// ============================================
// GET /api/payments/transactions/[id]
// Obtiene una factura por ID (antes: transacción de pago)
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: boolean; invoice?: unknown; error?: string }>> {
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
        { success: false, error: 'ID de factura requerido' },
        { status: 400 }
      );
    }

    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/payments/transactions/[id]
// Cancela una factura (antes: transacción pendiente)
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

    // Verificar permisos de administrador
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden cancelar facturas' },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de factura requerido' },
        { status: 400 }
      );
    }

    const result = await cancelInvoice(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al cancelar factura:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
