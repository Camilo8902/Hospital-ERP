import { NextRequest, NextResponse } from 'next/server';
import { createProduct, searchProducts } from '@/lib/actions/pharmacy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    const products = await searchProducts(query, limit);

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error al buscar productos:', error);
    return NextResponse.json(
      { error: 'Error al buscar productos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await createProduct({
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
      is_active: body.is_active ?? true,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error al crear producto:', error);
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    );
  }
}
