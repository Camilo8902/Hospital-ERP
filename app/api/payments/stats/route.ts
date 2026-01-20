import { NextRequest, NextResponse } from 'next/server';
import { getPaymentStats } from '@/lib/actions/payments';
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/server';
import type { PaymentStats } from '@/lib/types';

// ============================================
// GET /api/payments/stats
// Obtiene estadísticas de pagos
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ success: boolean; stats?: PaymentStats; error?: string }>> {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar permisos
    const profile = await getCurrentProfile();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'billing' && profile.role !== 'reception')) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para ver estadísticas' },
        { status: 403 }
      );
    }

    // Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Obtener estadísticas
    const stats = await getPaymentStats(startDate, endDate);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
