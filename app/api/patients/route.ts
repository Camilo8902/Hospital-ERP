import { NextResponse } from 'next/server';
import { getPatients, searchPatients } from '@/lib/actions/patients';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let patients;
    if (search && search.length >= 2) {
      patients = await searchPatients(search);
    } else {
      patients = await getPatients();
    }
    
    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Error al obtener pacientes' },
      { status: 500 }
    );
  }
}
