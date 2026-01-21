'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export interface DepartmentWithAccess {
  id: string;
  name: string;
  code: string;
  description?: string;
  location?: string;
  icon?: string;
  href: string;
}

export async function getDepartmentsForSidebar(
  userRole: string
): Promise<DepartmentWithAccess[]> {
  const adminSupabase = createAdminClient();
  
  // Definir qué roles tienen acceso a qué departamentos
  const roleDepartmentAccess: Record<string, string[]> = {
    admin: ['FT', 'RAD', 'CG', 'MG', 'FAR', 'LAB', 'PED', 'URG', 'CAR'],
    doctor: ['FT', 'RAD', 'CG', 'MG', 'PED', 'URG', 'CAR'],
    nurse: ['FT', 'RAD', 'CG', 'MG', 'PED', 'URG', 'CAR'],
    reception: ['FT', 'RAD', 'CG', 'MG', 'PED', 'URG', 'CAR'],
    pharmacy: ['FAR'],
    lab: ['LAB'],
    lab_admin: ['LAB'],
  };

  const allowedCodes = roleDepartmentAccess[userRole] || [];
  
  if (allowedCodes.length === 0) {
    return [];
  }

  // Mapear códigos a iconos y URLs
  const departmentConfig: Record<string, { icon: string; baseUrl: string }> = {
    FT: { icon: 'Activity', baseUrl: '/dashboard/physiotherapy' },
    RAD: { icon: 'Scan', baseUrl: '/dashboard/radiology' },
    CG: { icon: 'Stethoscope', baseUrl: '/dashboard/surgery' },
    MG: { icon: 'Stethoscope', baseUrl: '/dashboard/general' },
    FAR: { icon: 'Pill', baseUrl: '/dashboard/pharmacy' },
    LAB: { icon: 'FlaskConical', baseUrl: '/dashboard/lab' },
    PED: { icon: 'Baby', baseUrl: '/dashboard/pediatrics' },
    URG: { icon: 'Siren', baseUrl: '/dashboard/emergency' },
    CAR: { icon: 'Heart', baseUrl: '/dashboard/cardiology' },
  };

  // Obtener departamentos activos de la base de datos
  const { data: departments, error } = await adminSupabase
    .from('departments')
    .select('id, name, code, description, location')
    .eq('is_active', true)
    .in('code', allowedCodes)
    .order('name');

  if (error) {
    console.error('Error al obtener departamentos:', error);
    return [];
  }

  if (!departments || departments.length === 0) {
    return [];
  }

  // Transformar a formato del sidebar
  return departments.map((dept) => {
    const config = departmentConfig[dept.code] || { icon: 'Building', baseUrl: `/dashboard/departments/${dept.code}` };
    
    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      description: dept.description || null,
      location: dept.location || null,
      icon: config.icon,
      href: config.baseUrl,
    };
  });
}

export async function getAllActiveDepartments() {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('departments')
    .select('id, name, code, description, location, phone_extension, is_active')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error al obtener departamentos:', error);
    return [];
  }

  return data;
}
