import { NextRequest, NextResponse } from 'next/server';
import { getLabOrderById, updateLabOrderStatus, verifyAllResults, deleteLabOrder } from '@/lib/actions/lab';
import type { LabOrderStatus } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const order = await getLabOrderById(resolvedParams.id);

    if (!order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error en GET /api/lab/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener orden' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('[PATCH /api/lab/orders] ID:', resolvedParams.id);
    
    const body = await request.json();
    const { action } = body;
    console.log('[PATCH /api/lab/orders] Action:', action);

    if (action === 'complete') {
      // Verify all results and complete the order
      console.log('[PATCH /api/lab/orders] Verificando resultados...');
      const verifyResult = await verifyAllResults(resolvedParams.id);
      console.log('[PATCH /api/lab/orders] Verificación resultado:', verifyResult);
      
      if (!verifyResult.success) {
        console.log('[PATCH /api/lab/orders] Verificación fallida, retornando error 400');
        return NextResponse.json(
          { error: verifyResult.error },
          { status: 400 }
        );
      }
      
      console.log('[PATCH /api/lab/orders] Verificación exitosa, actualizando estado...');
      // Update the order status to completed, including the user who completed it
      const updateResult = await updateLabOrderStatus(
        resolvedParams.id,
        'completed' as LabOrderStatus,
        undefined, // reason
        body.completedBy // usuario que completa la orden
      );
      console.log('[PATCH /api/lab/orders] Update resultado:', updateResult);
      
      if (!updateResult.success) {
        console.log('[PATCH /api/lab/orders] Update fallido, retornando error 400');
        return NextResponse.json(
          { error: updateResult.error },
          { status: 400 }
        );
      }
      
      console.log('[PATCH /api/lab/orders] Orden completada exitosamente');
      return NextResponse.json({ success: true });
    }

    if (action === 'status') {
      const result = await updateLabOrderStatus(
        resolvedParams.id,
        body.status,
        body.reason
      );
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error en PATCH /api/lab/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const result = await deleteLabOrder(resolvedParams.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/lab/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar orden' },
      { status: 500 }
    );
  }
}
