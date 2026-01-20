import { NextResponse } from 'next/server';
import { getPOSProducts } from '@/lib/actions/pharmacy';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;

    const products = await getPOSProducts(query);

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error en API de productos POS:', error);
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}