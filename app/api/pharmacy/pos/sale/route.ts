import { NextResponse } from 'next/server';
import { processPOSale } from '@/lib/actions/pharmacy';
import { getCurrentUser } from '@/lib/actions/users';

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Por favor inicie sesión.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, paymentMethod, customerName, notes } = body;

    // Validar datos requeridos
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un producto' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Método de pago requerido' },
        { status: 400 }
      );
    }

    // Validar cada item
    for (const item of items) {
      if (!item.inventory_id || !item.quantity || !item.unit_price) {
        return NextResponse.json(
          { error: 'Datos de producto inválidos' },
          { status: 400 }
        );
      }

      if (item.quantity < 1) {
        return NextResponse.json(
          { error: 'La cantidad debe ser mayor a 0' },
          { status: 400 }
        );
      }

      if (item.unit_price < 0) {
        return NextResponse.json(
          { error: 'El precio no puede ser negativo' },
          { status: 400 }
        );
      }

      if (item.discount < 0 || item.discount > (item.unit_price * item.quantity)) {
        return NextResponse.json(
          { error: 'Descuento inválido' },
          { status: 400 }
        );
      }
    }

    // Validar método de pago
    const validPaymentMethods = ['CASH', 'CARD', 'TRANSFER', 'INSURANCE'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Método de pago inválido' },
        { status: 400 }
      );
    }

    // Procesar la venta
    const result = await processPOSale(
      items,
      paymentMethod as 'CASH' | 'CARD' | 'TRANSFER' | 'INSURANCE',
      customerName,
      notes,
      user
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al procesar la venta' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction_id: result.transaction_id,
      transaction_number: result.transaction_number,
      message: 'Venta procesada exitosamente',
    });
  } catch (error) {
    console.error('Error en API de venta POS:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}