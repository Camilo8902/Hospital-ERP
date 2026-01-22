import { NextRequest, NextResponse } from 'next/server';
import { dispensePrescription } from '@/lib/actions/pharmacy';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Obtener el contenido de la solicitud
    const contentType = request.headers.get('content-type');
    let quantity = undefined;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const bodyText = await request.text();
        if (bodyText && bodyText.trim()) {
          const body = JSON.parse(bodyText);
          quantity = body.quantity;
        }
      } catch (parseError) {
        console.error('Error al parsear JSON:', parseError);
        // Continuar sin quantity, la función usará el valor por defecto
      }
    }

    const result = await dispensePrescription(id, quantity);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al dispensar receta:', error);
    return NextResponse.json(
      { error: 'Error al dispensar receta' },
      { status: 500 }
    );
  }
}
