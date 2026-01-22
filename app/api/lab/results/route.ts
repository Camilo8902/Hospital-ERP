import { NextRequest, NextResponse } from 'next/server';
import { saveLabResult } from '@/lib/actions/lab';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // La API espera: order_detail_id, parameter_id (puede ser null), value, notes
    // La función saveLabResult espera: order_detail_id, parameter_id, value, notes
    
    if (!body.order_detail_id || body.value === undefined) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: order_detail_id y value son obligatorios' },
        { status: 400 }
      );
    }
    
    const result = await saveLabResult({
      order_detail_id: body.order_detail_id,
      parameter_id: body.parameter_id || null,
      value: body.value,
      notes: body.notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en POST /api/lab/results:', error);
    return NextResponse.json(
      { error: 'Error al guardar resultado' },
      { status: 500 }
    );
  }
}
