import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_treatment_types')
      .select('*')
      .order('name');
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching treatment types:', error);
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
      .from('physio_treatment_types')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating treatment type:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_treatment_types')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating treatment type:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
