import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('profiles')
      .select('id, email, full_name, role, specialty, license_number, phone, avatar_url, is_active, created_at, updated_at')
      .eq('id', resolvedParams.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en GET /api/users/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}
