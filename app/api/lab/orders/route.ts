import { NextRequest, NextResponse } from 'next/server';
import { getLabOrders, getLabOrderById, createLabOrder } from '@/lib/actions/lab';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status') || undefined;
    const patientId = searchParams.get('patientId') || undefined;
    const doctorId = searchParams.get('doctorId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (id) {
      const order = await getLabOrderById(id);
      if (!order) {
        return NextResponse.json(
          { error: 'Orden no encontrada' },
          { status: 404 }
        );
      }
      return NextResponse.json(order);
    }

    const orders = await getLabOrders(
      { status, patientId, doctorId, startDate, endDate, search },
      limit
    );

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error en GET /api/lab/orders:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await createLabOrder({
      patient_id: body.patient_id,
      doctor_id: body.doctor_id,
      appointment_id: body.appointment_id,
      priority: body.priority,
      notes: body.notes,
      test_ids: body.test_ids,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, orderId: result.orderId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/lab/orders:', error);
    return NextResponse.json(
      { error: 'Error al crear orden' },
      { status: 500 }
    );
  }
}
