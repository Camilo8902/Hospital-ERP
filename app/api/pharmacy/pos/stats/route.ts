import { NextResponse } from 'next/server';
import { getPOSStats } from '@/lib/actions/pharmacy';

export async function GET() {
  try {
    const stats = await getPOSStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error en API de estadísticas POS:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}