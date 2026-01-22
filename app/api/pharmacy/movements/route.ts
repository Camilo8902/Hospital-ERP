import { NextRequest, NextResponse } from 'next/server';
import { getInventoryMovements } from '@/lib/actions/pharmacy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const transactionType = searchParams.get('transactionType') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const movements = await getInventoryMovements(
      productId,
      startDate,
      endDate,
      transactionType,
      limit
    );

    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    return NextResponse.json(
      { error: 'Error al obtener movimientos' },
      { status: 500 }
    );
  }
}
