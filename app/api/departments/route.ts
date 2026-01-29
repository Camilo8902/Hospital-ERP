import { NextResponse } from 'next/server';

// Departamentos estáticos basados en las rutas del dashboard
const DEPARTMENTS = [
  { id: 'physiotherapy', name: 'Fisioterapia' },
  { id: 'lab', name: 'Laboratorio' },
  { id: 'pharmacy', name: 'Farmacia' },
  { id: 'billing', name: 'Facturación' },
  { id: 'consultation', name: 'Consultorio' },
  { id: 'inventory', name: 'Inventario' },
  { id: 'records', name: 'Historias Clínicas' },
  { id: 'users', name: 'Gestión de Usuarios' },
];

export async function GET() {
  try {
    return NextResponse.json(DEPARTMENTS);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Error al obtener departamentos' },
      { status: 500 }
    );
  }
}
