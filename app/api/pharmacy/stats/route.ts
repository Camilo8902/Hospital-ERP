import { NextRequest, NextResponse } from 'next/server';
import { getPharmacyStats, getPrescriptions, getLowStockProducts } from '@/lib/actions/pharmacy';

export async function GET() {
  try {
    const [stats, pendingPrescriptions, lowStockProducts] = await Promise.all([
      getPharmacyStats(),
      getPrescriptions('pending'),
      getLowStockProducts(),
    ]);

    return NextResponse.json({
      stats,
      pendingPrescriptions,
      lowStockProducts,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
