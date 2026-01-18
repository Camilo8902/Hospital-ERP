import { NextRequest, NextResponse } from 'next/server';
import { cancelPrescription } from '@/lib/actions/pharmacy';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result = await cancelPrescription(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al cancelar receta:', error);
    return NextResponse.json(
      { error: 'Error al cancelar receta' },
      { status: 500 }
    );
  }
}
