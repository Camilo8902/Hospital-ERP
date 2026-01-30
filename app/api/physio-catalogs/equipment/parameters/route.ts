import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/physio-catalogs/equipment/parameters - Listar parámetros de un equipo
export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const equipmentId = searchParams.get('equipment_id');
    const fieldType = searchParams.get('type');
    const requiredOnly = searchParams.get('required') === 'true';
    
    if (!equipmentId) {
      return NextResponse.json({ error: 'equipment_id requerido' }, { status: 400 });
    }
    
    let query = adminSupabase
      .from('physio_equipment_parameter_fields')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('field_order');
    
    if (fieldType) {
      query = query.eq('field_type', fieldType);
    }
    if (requiredOnly) {
      query = query.eq('field_required', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }
    
    // Parsear field_options de JSON string a array
    const parsedData = (data || []).map(field => ({
      ...field,
      field_options: field.field_options ? JSON.parse(field.field_options) : null,
    }));
    
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error fetching parameter fields:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/physio-catalogs/equipment/parameters - Crear campo parameter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminSupabase = createAdminClient();
    
    const {
      equipment_id,
      field_name,
      field_label,
      field_description,
      field_type,
      field_unit,
      field_default_value,
      field_min,
      field_max,
      field_step,
      field_options,
      field_required,
      field_order,
      field_visible,
    } = body;
    
    // Validaciones básicas
    if (!equipment_id || !field_name || !field_label || !field_type) {
      return NextResponse.json(
        { error: 'equipment_id, field_name, field_label y field_type son requeridos' },
        { status: 400 }
      );
    }
    
    // Validar tipo de campo
    const validTypes = ['number', 'text', 'select', 'range', 'boolean'];
    if (!validTypes.includes(field_type)) {
      return NextResponse.json(
        { error: `Tipo de campo inválido. Debe ser uno de: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Para select, field_options es requerido
    if (field_type === 'select' && (!field_options || !Array.isArray(field_options))) {
      return NextResponse.json(
        { error: 'Para tipo select, field_options es requerido' },
        { status: 400 }
      );
    }
    
    const paramData = {
      equipment_id,
      field_name,
      field_label,
      field_description: field_description || null,
      field_type,
      field_unit: field_unit || null,
      field_default_value: field_default_value || null,
      field_min: field_min !== undefined ? field_min : null,
      field_max: field_max !== undefined ? field_max : null,
      field_step: field_step || 1,
      field_options: field_options ? JSON.stringify(field_options) : null,
      field_required: field_required || false,
      field_order: field_order || 0,
      field_visible: field_visible !== false,
    };
    
    const { data, error } = await adminSupabase
      .from('physio_equipment_parameter_fields')
      .insert(paramData)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 400 });
    }
    
    // Parsear field_options para la respuesta
    const response = {
      ...data,
      field_options: data.field_options ? JSON.parse(data.field_options) : null,
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating parameter field:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/physio-catalogs/equipment/parameters - Actualizar campo parameter
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    const adminSupabase = createAdminClient();
    
    const {
      field_name,
      field_label,
      field_description,
      field_type,
      field_unit,
      field_default_value,
      field_min,
      field_max,
      field_step,
      field_options,
      field_required,
      field_order,
      field_visible,
    } = body;
    
    // Validar tipo de campo si se proporciona
    if (field_type) {
      const validTypes = ['number', 'text', 'select', 'range', 'boolean'];
      if (!validTypes.includes(field_type)) {
        return NextResponse.json(
          { error: `Tipo de campo inválido. Debe ser uno de: ${validTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }
    
    const updateData: Record<string, any> = {};
    
    if (field_name !== undefined) updateData.field_name = field_name;
    if (field_label !== undefined) updateData.field_label = field_label;
    if (field_description !== undefined) updateData.field_description = field_description;
    if (field_type !== undefined) updateData.field_type = field_type;
    if (field_unit !== undefined) updateData.field_unit = field_unit;
    if (field_default_value !== undefined) updateData.field_default_value = field_default_value;
    if (field_min !== undefined) updateData.field_min = field_min;
    if (field_max !== undefined) updateData.field_max = field_max;
    if (field_step !== undefined) updateData.field_step = field_step;
    if (field_options !== undefined) updateData.field_options = field_options ? JSON.stringify(field_options) : null;
    if (field_required !== undefined) updateData.field_required = field_required;
    if (field_order !== undefined) updateData.field_order = field_order;
    if (field_visible !== undefined) updateData.field_visible = field_visible;
    
    const { error } = await adminSupabase
      .from('physio_equipment_parameter_fields')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error updating parameter field:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/physio-catalogs/equipment/parameters - Eliminar campo parameter
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('physio_equipment_parameter_fields')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting parameter field:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
