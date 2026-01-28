import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_equipment')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_equipment')
      .update(body)
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminSupabase = createAdminClient();
    
    // Eliminar campos de relaciones que no existen en la tabla
    const { physio_treatment_types, description, ...cleanBody } = body;
    
    // Eliminar campos undefined o null que pueden causar problemas
    const sanitizedBody = Object.fromEntries(
      Object.entries(cleanBody).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    );
    
    const { data, error } = await adminSupabase
      .from('physio_equipment')
      .insert(sanitizedBody)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
