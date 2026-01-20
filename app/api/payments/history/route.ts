import { NextRequest, NextResponse } from 'next/server';
import { getPaymentHistory } from '@/lib/actions/payments';
import { getCurrentUser, getCurrentProfile } from '@/lib/supabase/server';
import type { PaymentTransaction } from '@/lib/types';

// ============================================
// GET /api/payments/history
// Obtiene el historial de transacciones con filtros
// ============================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ 
  success: boolean; 
  transactions?: PaymentTransaction[]; 
  total?: number;
  error?: string;
}>> {
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
        { success: false, error: 'No tiene permisos para ver el historial' },
        { status: 403 }
      );
    }

    // Obtener parámetros de query
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    const referenceType = searchParams.get('referenceType') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validar parámetros
    if (limit > 100) {
      return NextResponse.json(
        { success: false, error: 'El límite máximo es 100' },
        { status: 400 }
      );
    }

    // Obtener historial
    const result = await getPaymentHistory(
      { status, paymentMethod, referenceType, startDate, endDate },
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      transactions: result.transactions,
      total: result.total,
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
