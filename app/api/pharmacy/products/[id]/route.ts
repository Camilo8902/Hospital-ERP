import { NextRequest, NextResponse } from 'next/server';
import { updateProduct, deleteProduct, getProductById } from '@/lib/actions/pharmacy';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await getProductById(id);

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const result = await updateProduct(id, {
      sku: body.sku,
      name: body.name,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
      unit: body.unit,
      quantity: body.quantity,
      min_stock: body.min_stock,
      max_stock: body.max_stock,
      unit_cost: body.unit_cost,
      unit_price: body.unit_price,
      supplier: body.supplier,
      manufacturer: body.manufacturer,
      expiration_date: body.expiration_date,
      batch_number: body.batch_number,
      storage_location: body.storage_location,
      requires_prescription: body.requires_prescription,
      is_active: body.is_active,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await deleteProduct(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    );
  }
}
