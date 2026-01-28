import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_equipment')
      .select('*, physio_treatment_types(name)')
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_equipment')
      .insert(body)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
