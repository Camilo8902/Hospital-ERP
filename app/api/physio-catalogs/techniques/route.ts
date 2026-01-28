import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const treatment_type_id = searchParams.get('treatment_type_id');
    
    const adminSupabase = createAdminClient();
    
    let query = adminSupabase
      .from('physio_techniques')
      .select('*, physio_treatment_types(name)')
      .order('name');
    
    if (treatment_type_id) {
      query = query.eq('treatment_type_id', treatment_type_id);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching techniques:', error);
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
      .from('physio_techniques')
      .update(body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating technique:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_techniques')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating technique:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
