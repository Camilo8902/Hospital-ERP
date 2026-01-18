import { NextRequest, NextResponse } from 'next/server';
import { getLabOrderById } from '@/lib/actions/lab';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const order = await getLabOrderById(id);

  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  return NextResponse.json(order);
}
