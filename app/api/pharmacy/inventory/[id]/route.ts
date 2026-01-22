import { deleteProduct } from '@/lib/actions/pharmacy';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de producto es requerido' },
        { status: 400 }
      );
    }

    const result = await deleteProduct(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al eliminar el producto' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
