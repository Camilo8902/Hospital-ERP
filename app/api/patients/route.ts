import { NextResponse } from 'next/server';
import { getPatients } from '@/lib/actions/patients';

export async function GET() {
  try {
    const patients = await getPatients();
    return NextResponse.json({ patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Error al obtener pacientes' },
      { status: 500 }
    );
  }
}
