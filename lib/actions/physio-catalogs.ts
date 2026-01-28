'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// ============================================
// TIPOS DE TRATAMIENTO
// ============================================

export interface PhysioTreatmentType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  icon_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTreatmentTypes(): Promise<PhysioTreatmentType[]> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('physio_treatment_types')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching treatment types:', error);
    return [];
  }
  
  return data as PhysioTreatmentType[];
}

export async function createTreatmentType(input: {
  code: string;
  name: string;
  description?: string;
  category?: string;
}): Promise<{ success: boolean; data?: PhysioTreatmentType; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_treatment_types')
      .insert({
        code: input.code,
        name: input.name,
        description: input.description,
        category: input.category,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true, data: data as PhysioTreatmentType };
  } catch (error) {
    console.error('Error creating treatment type:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function updateTreatmentType(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    category: string;
    is_active: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('physio_treatment_types')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true };
  } catch (error) {
    console.error('Error updating treatment type:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function deleteTreatmentType(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('physio_treatment_types')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true };
  } catch (error) {
    console.error('Error deleting treatment type:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// TÉCNICAS
// ============================================

export interface PhysioTechnique {
  id: string;
  treatment_type_id: string;
  code: string;
  name: string;
  description: string | null;
  parameters_schema: Record<string, unknown> | null;
  results_schema: Record<string, unknown> | null;
  default_duration_minutes: number | null;
  contraindications: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  treatment_types?: { name: string };
}

export async function getTechniques(treatmentTypeId?: string): Promise<PhysioTechnique[]> {
  const adminSupabase = createAdminClient();
  
  let query = adminSupabase
    .from('physio_techniques')
    .select('*, treatment_types(name)')
    .order('name');
  
  if (treatmentTypeId) {
    query = query.eq('treatment_type_id', treatmentTypeId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching techniques:', error);
    return [];
  }
  
  return data as PhysioTechnique[];
}

export async function createTechnique(input: {
  treatment_type_id: string;
  code: string;
  name: string;
  description?: string;
  parameters_schema?: Record<string, unknown>;
  results_schema?: Record<string, unknown>;
  default_duration_minutes?: number;
  contraindications?: string[];
}): Promise<{ success: boolean; data?: PhysioTechnique; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_techniques')
      .insert({
        treatment_type_id: input.treatment_type_id,
        code: input.code,
        name: input.name,
        description: input.description,
        parameters_schema: input.parameters_schema,
        results_schema: input.results_schema,
        default_duration_minutes: input.default_duration_minutes,
        contraindications: input.contraindications,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true, data: data as PhysioTechnique };
  } catch (error) {
    console.error('Error creating technique:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function updateTechnique(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    parameters_schema: Record<string, unknown>;
    results_schema: Record<string, unknown>;
    default_duration_minutes: number;
    contraindications: string[];
    is_active: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('physio_techniques')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true };
  } catch (error) {
    console.error('Error updating technique:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function deleteTechnique(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('physio_techniques')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true };
  } catch (error) {
    console.error('Error deleting technique:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// EQUIPOS
// ============================================

export interface PhysioEquipment {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  treatment_type_id: string | null;
  specifications: Record<string, unknown> | null;
  parameters_template: Record<string, unknown> | null;
  location: string | null;
  status: string;
  purchase_date: string | null;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  treatment_types?: { name: string };
}

export async function getEquipment(status?: string): Promise<PhysioEquipment[]> {
  const adminSupabase = createAdminClient();
  
  let query = adminSupabase
    .from('physio_equipment')
    .select('*, treatment_types(name)')
    .order('name');
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching equipment:', error);
    return [];
  }
  
  return data as PhysioEquipment[];
}

export async function createEquipment(input: {
  code: string;
  name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  treatment_type_id?: string;
  specifications?: Record<string, unknown>;
  parameters_template?: Record<string, unknown>;
  location?: string;
  status?: string;
  purchase_date?: string;
  next_maintenance_date?: string;
}): Promise<{ success: boolean; data?: PhysioEquipment; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_equipment')
      .insert({
        code: input.code,
        name: input.name,
        brand: input.brand,
        model: input.model,
        serial_number: input.serial_number,
        treatment_type_id: input.treatment_type_id,
        specifications: input.specifications,
        parameters_template: input.parameters_template,
        location: input.location,
        status: input.status || 'available',
        purchase_date: input.purchase_date,
        next_maintenance_date: input.next_maintenance_date,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true, data: data as PhysioEquipment };
  } catch (error) {
    console.error('Error creating equipment:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function updateEquipment(
  id: string,
  input: Partial<{
    name: string;
    brand: string;
    model: string;
    location: string;
    status: string;
    next_maintenance_date: string;
    is_active: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('physio_equipment')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true };
  } catch (error) {
    console.error('Error updating equipment:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function deleteEquipment(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('physio_equipment')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true };
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// EJERCICIOS
// ============================================

export interface PhysioExercise {
  id: string;
  code: string;
  name: string;
  description: string | null;
  target_muscle_group: string[] | null;
  body_region: string | null;
  difficulty_level: string | null;
  instructions: string | null;
  video_url: string | null;
  image_url: string | null;
  parameters_template: Record<string, unknown> | null;
  contraindications: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getExercises(filters?: {
  bodyRegion?: string;
  difficultyLevel?: string;
  muscleGroup?: string;
}): Promise<PhysioExercise[]> {
  const adminSupabase = createAdminClient();
  
  let query = adminSupabase
    .from('physio_exercises')
    .select('*')
    .order('name');
  
  if (filters?.bodyRegion) {
    query = query.eq('body_region', filters.bodyRegion);
  }
  if (filters?.difficultyLevel) {
    query = query.eq('difficulty_level', filters.difficultyLevel);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }
  
  return data as PhysioExercise[];
}

export async function createExercise(input: {
  code: string;
  name: string;
  description?: string;
  target_muscle_group?: string[];
  body_region?: string;
  difficulty_level?: string;
  instructions?: string;
  video_url?: string;
  image_url?: string;
  parameters_template?: Record<string, unknown>;
  contraindications?: string[];
}): Promise<{ success: boolean; data?: PhysioExercise; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_exercises')
      .insert({
        code: input.code,
        name: input.name,
        description: input.description,
        target_muscle_group: input.target_muscle_group,
        body_region: input.body_region,
        difficulty_level: input.difficulty_level,
        instructions: input.instructions,
        video_url: input.video_url,
        image_url: input.image_url,
        parameters_template: input.parameters_template,
        contraindications: input.contraindications,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true, data: data as PhysioExercise };
  } catch (error) {
    console.error('Error creating exercise:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function updateExercise(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    target_muscle_group: string[];
    body_region: string;
    difficulty_level: string;
    instructions: string;
    video_url: string;
    image_url: string;
    contraindications: string[];
    is_active: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('physio_exercises')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true };
  } catch (error) {
    console.error('Error updating exercise:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

export async function deleteExercise(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase
      .from('physio_exercises')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true };
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================
// PROTOCOLOS
// ============================================

export interface PhysioProtocol {
  id: string;
  code: string;
  name: string;
  description: string | null;
  diagnosis_code: string | null;
  treatment_type_id: string | null;
  exercises: Record<string, unknown> | null;
  sessions_count: number | null;
  frequency_per_week: number | null;
  duration_per_session_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getProtocols(): Promise<PhysioProtocol[]> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('physio_protocols')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching protocols:', error);
    return [];
  }
  
  return data as PhysioProtocol[];
}

export async function createProtocol(input: {
  code: string;
  name: string;
  description?: string;
  diagnosis_code?: string;
  treatment_type_id?: string;
  exercises?: Record<string, unknown>;
  sessions_count?: number;
  frequency_per_week?: number;
  duration_per_session_minutes?: number;
}): Promise<{ success: boolean; data?: PhysioProtocol; error?: string }> {
  try {
    const adminSupabase = createAdminClient();
    
    const { data, error } = await adminSupabase
      .from('physio_protocols')
      .insert({
        code: input.code,
        name: input.name,
        description: input.description,
        diagnosis_code: input.diagnosis_code,
        treatment_type_id: input.treatment_type_id,
        exercises: input.exercises,
        sessions_count: input.sessions_count,
        frequency_per_week: input.frequency_per_week,
        duration_per_session_minutes: input.duration_per_session_minutes,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/physiotherapy/catalogs');
    return { success: true, data: data as PhysioProtocol };
  } catch (error) {
    console.error('Error creating protocol:', error);
    return { success: false, error: 'Error inesperado' };
  }
}
