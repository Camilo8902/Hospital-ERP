import { NextResponse } from 'next/server';
import { getLabStats } from '@/lib/actions/lab';

export async function GET() {
  try {
    const stats = await getLabStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error en GET /api/lab/stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
