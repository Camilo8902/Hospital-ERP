import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/actions/pharmacy';

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
