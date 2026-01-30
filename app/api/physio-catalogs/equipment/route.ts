import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/physio-catalogs/equipment - Listar equipos con sus parámetros
export async function GET(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const treatmentTypeId = searchParams.get('treatment_type_id');
    const availableOnly = searchParams.get('available') === 'true';
    
    let query = adminSupabase
      .from('physio_equipment_with_params')
      .select('*')
      .order('name');
    
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('equipment_type', type);
    if (treatmentTypeId) query = query.eq('treatment_type_id', treatmentTypeId);
    if (availableOnly) query = query.eq('status', 'available');
    
    const { data, error } = await query;
    
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

// POST /api/physio-catalogs/equipment - Crear equipo con campos configurables
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminSupabase = createAdminClient();
    
    // Extraer campos de equipo y campos configurables
    const { 
      physio_treatment_types, 
      description, 
      parameter_fields,
      treatment_type_id,
      ...equipmentData 
    } = body;
    
    // Sanitizar el body
    const sanitizedBody = Object.fromEntries(
      Object.entries(equipmentData).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    );
    
    // Crear el equipo
    const { data: equipment, error: equipmentError } = await adminSupabase
      .from('physio_equipment')
      .insert(sanitizedBody)
      .select()
      .single();
    
    if (equipmentError) {
      console.error('Supabase insert error:', equipmentError);
      return NextResponse.json({ error: equipmentError.message, details: equipmentError }, { status: 400 });
    }
    
    // Crear los campos configurables si existen
    let createdParams = null;
    if (parameter_fields && Array.isArray(parameter_fields) && parameter_fields.length > 0) {
      const paramFieldsToInsert = parameter_fields.map((field: any) => ({
        equipment_id: equipment.id,
        field_name: field.field_name,
        field_label: field.field_label,
        field_type: field.field_type || 'number',
        field_unit: field.field_unit,
        field_default_value: field.field_default_value,
        field_min: field.field_min,
        field_max: field.field_max,
        field_step: field.field_step || 1,
        field_options: field.field_options ? JSON.stringify(field.field_options) : null,
        field_required: field.field_required || false,
        field_order: field.field_order || 0,
        field_description: field.field_description,
      }));
      
      const { data: params, error: paramsError } = await adminSupabase
        .from('physio_equipment_parameter_fields')
        .insert(paramFieldsToInsert)
        .select();
      
      if (paramsError) {
        console.error('Error inserting parameter fields:', paramsError);
        // No fallar la creación del equipo por esto
      } else {
        createdParams = params;
      }
    }
    
    return NextResponse.json({ 
      ...equipment, 
      parameter_fields: createdParams 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/physio-catalogs/equipment - Actualizar equipo
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    const adminSupabase = createAdminClient();
    
    // Extraer campos de equipo y campos configurables
    const { 
      physio_treatment_types, 
      description, 
      parameter_fields,
      treatment_type_id,
      ...equipmentData 
    } = body;
    
    // Sanitizar el body
    const sanitizedBody = Object.fromEntries(
      Object.entries(equipmentData).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    );
    
    // Actualizar el equipo
    const { error: equipmentError } = await adminSupabase
      .from('physio_equipment')
      .update(sanitizedBody)
      .eq('id', id);
    
    if (equipmentError) {
      return NextResponse.json({ error: equipmentError.message }, { status: 400 });
    }
    
    // Actualizar los campos configurables si existen
    if (parameter_fields && Array.isArray(parameter_fields)) {
      // Eliminar campos existentes
      await adminSupabase
        .from('physio_equipment_parameter_fields')
        .delete()
        .eq('equipment_id', id);
      
      // Insertar los nuevos campos
      if (parameter_fields.length > 0) {
        const paramFieldsToInsert = parameter_fields.map((field: any) => ({
          equipment_id: id,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type || 'number',
          field_unit: field.field_unit,
          field_default_value: field.field_default_value,
          field_min: field.field_min,
          field_max: field.field_max,
          field_step: field.field_step || 1,
          field_options: field.field_options ? JSON.stringify(field.field_options) : null,
          field_required: field.field_required || false,
          field_order: field.field_order || 0,
          field_description: field.field_description,
        }));
        
        await adminSupabase
          .from('physio_equipment_parameter_fields')
          .insert(paramFieldsToInsert);
      }
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/physio-catalogs/equipment - Eliminar equipo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }
    
    const adminSupabase = createAdminClient();
    
    // Los campos configurables se eliminan automáticamente por CASCADE
    const { error } = await adminSupabase
      .from('physio_equipment')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
