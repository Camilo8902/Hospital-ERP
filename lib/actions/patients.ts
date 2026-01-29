'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import type { Patient } from '@/lib/types';

// Obtener todos los pacientes
export async function getPatients(): Promise<Patient[]> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener pacientes:', error);
    throw new Error('Error al obtener pacientes');
  }

  return data as Patient[];
}

// Obtener un paciente por ID
export async function getPatientById(id: string): Promise<Patient | null> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error al obtener paciente:', error);
    return null;
  }

  return data as Patient;
}

// Crear un nuevo paciente
export async function createPatient(formData: FormData): Promise<{ success: boolean; error?: string; patientId?: string }> {
  const adminSupabase = createAdminClient();
  
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const dni = formData.get('dni') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const dob = formData.get('dob') as string;
  const gender = formData.get('gender') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const emergencyContactName = formData.get('emergency_contact_name') as string;
  const emergencyContactPhone = formData.get('emergency_contact_phone') as string;
  const bloodType = formData.get('blood_type') as string;
  const allergies = formData.get('allergies') as string;
  const insuranceProvider = formData.get('insurance_provider') as string;
  const insurancePolicyNumber = formData.get('insurance_policy_number') as string;
  const notes = formData.get('notes') as string;

  // Validaciones
  if (!firstName || !lastName || !dni || !phone || !dob) {
    return { success: false, error: 'Por favor completa todos los campos requeridos (incluido DNI)' };
  }

  try {
    // Procesar alergias como array
    const allergiesArray = allergies
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    const { data, error: insertError } = await adminSupabase
      .from('patients')
      .insert({
        dni: parseInt(dni) || null,
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone,
        dob: dob,
        gender: gender || null,
        address: address || null,
        city: city || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        blood_type: bloodType || null,
        allergies: allergiesArray.length > 0 ? allergiesArray : null,
        insurance_provider: insuranceProvider || null,
        insurance_policy_number: insurancePolicyNumber || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error al crear paciente:', insertError);
      return { success: false, error: insertError.message };
    }

    if (!data) {
      return { success: false, error: 'Error al crear paciente' };
    }

    revalidatePath('/dashboard/patients');
    return { success: true, patientId: data.id };

  } catch (error) {
    console.error('Error inesperado al crear paciente:', error);
    return { success: false, error: 'Ocurrio un error inesperado' };
  }
}

// Actualizar un paciente
export async function updatePatient(
  id: string, 
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();
  
  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const dob = formData.get('dob') as string;
  const gender = formData.get('gender') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const emergencyContactName = formData.get('emergency_contact_name') as string;
  const emergencyContactPhone = formData.get('emergency_contact_phone') as string;
  const bloodType = formData.get('blood_type') as string;
  const allergies = formData.get('allergies') as string;
  const insuranceProvider = formData.get('insurance_provider') as string;
  const insurancePolicyNumber = formData.get('insurance_policy_number') as string;
  const notes = formData.get('notes') as string;

  if (!firstName || !lastName || !phone || !dob) {
    return { success: false, error: 'Por favor completa todos los campos requeridos' };
  }

  try {
    // Procesar alergias como array
    const allergiesArray = allergies
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    const { error: updateError } = await adminSupabase
      .from('patients')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone,
        dob: dob,
        gender: gender || null,
        address: address || null,
        city: city || null,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        blood_type: bloodType || null,
        allergies: allergiesArray.length > 0 ? allergiesArray : null,
        insurance_provider: insuranceProvider || null,
        insurance_policy_number: insurancePolicyNumber || null,
        notes: notes || null,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error al actualizar paciente:', updateError);
      return { success: false, error: updateError.message };
    }

    // Invalidar todas las paginas relacionadas con este paciente
    revalidatePath('/dashboard/patients');
    revalidatePath(`/dashboard/patients/${id}`);
    revalidatePath(`/dashboard/patients/${id}/edit`);
    return { success: true };

  } catch (error) {
    console.error('Error inesperado al crear anotacion:', error);
    return { success: false, error: 'Ocurrio un error inesperado' };
  }
}

// Eliminar un paciente
export async function deletePatient(id: string): Promise<{ success: boolean; error?: string }> {
  const adminSupabase = createAdminClient();
  
  try {
    const { error: deleteError } = await adminSupabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error al eliminar paciente:', deleteError);
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/dashboard/patients');
    return { success: true };

  } catch (error) {
    console.error('Error inesperado al eliminar paciente:', error);
    return { success: false, error: 'Ocurrio un error inesperado' };
  }
}

// Obtener todos los pacientes para dropdowns (sin paginacion)
export async function getAllPatientsForSelect(): Promise<{ id: string; full_name: string; medical_record_number: string }[]> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('patients')
    .select('id, first_name, last_name, medical_record_number')
    .order('last_name', { ascending: true });

  if (error) {
    console.error('Error al obtener pacientes:', error);
    return [];
  }

  return data.map(p => ({
    id: p.id,
    full_name: `${p.first_name} ${p.last_name}`,
    medical_record_number: p.medical_record_number
  }));
}

// Buscar pacientes por término de búsqueda
export async function searchPatients(searchTerm: string): Promise<Patient[]> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('patients')
    .select('*')
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,medical_record_number.ilike.%${searchTerm}%`)
    .order('last_name', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error al buscar pacientes:', error);
    return [];
  }

  return data as Patient[];
}

// ============================================
// ANOTACIONES DE PACIENTES
// ============================================

export interface PatientNote {
  id: string;
  patient_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

// Obtener anotaciones de un paciente
export async function getPatientNotes(patientId: string): Promise<PatientNote[]> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('patient_notes')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener anotaciones:', error);
    return [];
  }

  return data as PatientNote[];
}

// Crear una nueva anotacion
export async function createPatientNote(
  patientId: string,
  authorId: string,
  authorName: string,
  content: string
): Promise<{ success: boolean; error?: string; note?: PatientNote }> {
  const adminSupabase = createAdminClient();
  
  try {
    const { data, error } = await adminSupabase
      .from('patient_notes')
      .insert({
        patient_id: patientId,
        author_id: authorId,
        author_name: authorName,
        content: content.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear anotacion:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/dashboard/patients/${patientId}`);
    return { success: true, note: data as PatientNote };

  } catch (error) {
    console.error('Error inesperado al crear anotacion:', error);
    return { success: false, error: 'Ocurrio un error inesperado' };
  }
}
