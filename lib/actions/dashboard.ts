'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingPrescriptions: number;
  lowStockItems: number;
}

export interface AppointmentListItem {
  id: string;
  start_time: string;
  status: string;
  reason: string | null;
  appointment_type: string;
  patient_first_name?: string;
  patient_last_name?: string;
  doctor_full_name?: string;
}

export interface PatientListItem {
  id: string;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const adminSupabase = createAdminClient();
  
  // Obtener conteo de pacientes
  const { count: totalPatients } = await adminSupabase
    .from('patients')
    .select('*', { count: 'exact', head: true });

  // Obtener citas de hoy (usando UTC para consistencia)
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowUTC = new Date(todayUTC);
  tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

  const { count: todayAppointments } = await adminSupabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('start_time', todayUTC.toISOString())
    .lt('start_time', tomorrowUTC.toISOString());

  // Obtener recetas pendientes
  const { count: pendingPrescriptions } = await adminSupabase
    .from('prescriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Obtener items con stock bajo
  const { count: lowStockItems } = await adminSupabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .lte('quantity', 10);

  return {
    totalPatients: totalPatients || 0,
    todayAppointments: todayAppointments || 0,
    pendingPrescriptions: pendingPrescriptions || 0,
    lowStockItems: lowStockItems || 0,
  };
}

export async function getTodayAppointments(): Promise<AppointmentListItem[]> {
  const adminSupabase = createAdminClient();
  
  // Obtener citas de hoy (usando UTC para consistencia)
  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowUTC = new Date(todayUTC);
  tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);

  // Primero obtener las citas
  const { data: appointments, error } = await adminSupabase
    .from('appointments')
    .select('id, start_time, status, reason, doctor_id, patient_id')
    .gte('start_time', todayUTC.toISOString())
    .lt('start_time', tomorrowUTC.toISOString())
    .order('start_time', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }

  if (!appointments || appointments.length === 0) {
    return [];
  }

  // Obtener patient_ids y doctor_ids únicos
  const patientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))];
  const doctorIds = [...new Set(appointments.map(a => a.doctor_id).filter(Boolean))];

  // Obtener pacientes
  const { data: patients } = patientIds.length > 0
    ? await adminSupabase
        .from('patients')
        .select('id, first_name, last_name')
        .in('id', patientIds)
    : { data: [], error: null };

  // Obtener doctores
  const { data: doctors } = doctorIds.length > 0
    ? await adminSupabase
        .from('profiles')
        .select('id, full_name')
        .in('id', doctorIds)
    : { data: [], error: null };

  // Crear mapas
  const patientMap = new Map(patients?.map(p => [p.id, p]) || []);
  const doctorMap = new Map(doctors?.map(d => [d.id, d]) || []);

  // Combinar datos
  return appointments.map(apt => {
    const patient = patientMap.get(apt.patient_id);
    const doctor = doctorMap.get(apt.doctor_id);

    return {
      id: apt.id,
      start_time: apt.start_time,
      status: apt.status,
      reason: apt.reason,
      appointment_type: apt.appointment_type,
      patient_first_name: patient?.first_name || null,
      patient_last_name: patient?.last_name || null,
      doctor_full_name: doctor?.full_name || null,
    };
  });
}

export async function getRecentPatients(): Promise<PatientListItem[]> {
  const adminSupabase = createAdminClient();
  
  const { data, error } = await adminSupabase
    .from('patients')
    .select('id, medical_record_number, first_name, last_name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching recent patients:', error);
    return [];
  }

  return data as PatientListItem[];
}
