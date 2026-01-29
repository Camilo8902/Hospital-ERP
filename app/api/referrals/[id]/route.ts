import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH - Aceptar o rechazar derivación
export async function PATCH(request: NextRequest) {
  try {
    const adminSupabase = createAdminClient();
    const body = await request.json();
    
    const { id, action, notes } = body; // action: 'accept' | 'reject' | 'complete'
    
    if (!id || !action) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: id, action' },
        { status: 400 }
      );
    }
    
    const newStatus = action === 'accept' ? 'accepted' : 
                      action === 'reject' ? 'cancelled' : 
                      action === 'complete' ? 'completed' : 'pending';
    
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    const { data, error } = await adminSupabase
      .from('clinical_references')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating referral:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // Si se acepta, crear cita automáticamente en el departamento destino
    if (action === 'accept' && data) {
      // Crear cita de evaluación en el departamento destino
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 1); // Cita para mañana
      
      const { error: appointmentError } = await adminSupabase
        .from('appointments')
        .insert({
          patient_id: data.patient_id,
          department_id: data.target_department_id,
          appointment_type: 'consultation',
          status: 'scheduled',
          start_time: appointmentDate.toISOString(),
          end_time: new Date(appointmentDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hora después
          reason: `Evaluación derivada: ${data.clinical_diagnosis}`,
          clinical_reference_id: data.id,
          referring_department_id: data.referring_department_id,
        });
      
      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError);
      }
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json({ error: 'Error al actualizar derivación' }, { status: 500 });
  }
}
