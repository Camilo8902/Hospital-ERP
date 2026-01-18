import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPrescriptionsByPatient } from '@/lib/actions/pharmacy';
import { getLabOrdersByPatient } from '@/lib/actions/lab';
import { getPatientById, getPatientNotes } from '@/lib/actions/patients';
import PatientHistoryPrintClient from './PatientHistoryPrintClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Utilidad para calcular edad
function calculateAge(dob: string | undefined): string {
  if (!dob) return 'No especificada';
  try {
    const date = new Date(dob);
    if (isNaN(date.getTime())) return 'No especificada';
    
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    
    if (age < 0 || age > 150) return 'No especificada';
    return `${age} años`;
  } catch {
    return 'No especificada';
  }
}

// Utilidad para obtener etiqueta de género
function getGenderLabel(gender: string | undefined): string {
  if (!gender) return 'No especificado';
  const labels: Record<string, string> = {
    'male': 'Masculino',
    'female': 'Femenino',
    'other': 'Otro',
    'prefer_not_to_say': 'Prefiere no decir',
  };
  return labels[gender] || gender;
}

export default async function PatientHistoryPrintPage({ params }: PageProps) {
  const { id } = await params;
  
  // Obtener paciente
  const patient = await getPatientById(id);
  if (!patient) {
    notFound();
  }

  const adminSupabase = createAdminClient();

  // Obtener historial clínico
  const { data: medicalRecords } = await adminSupabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', id)
    .order('visit_date', { ascending: false });

  // Enriquecer con datos del doctor
  const enrichedRecords = await enrichRecordsWithDoctors(medicalRecords || []);

  // Obtener citas
  const { data: appointments } = await adminSupabase
    .from('appointments')
    .select('*')
    .eq('patient_id', id)
    .order('start_time', { ascending: false })
    .limit(50);

  // Enriquecer citas con departamentos
  const enrichedAppointments = await enrichAppointmentsWithDetails(appointments || []);

  // Obtener recetas
  const prescriptions = await getPrescriptionsByPatient(id);

  // Obtener órdenes de laboratorio
  const labOrders = await getLabOrdersByPatient(id);

  // Obtener anotaciones
  const patientNotes = await getPatientNotes(id);

  return (
    <PatientHistoryPrintClient
      patient={patient}
      medicalRecords={enrichedRecords}
      appointments={enrichedAppointments}
      prescriptions={prescriptions}
      labOrders={labOrders}
      patientNotes={patientNotes}
    />
  );
}

// Función auxiliar para enriquecer registros médicos con datos del doctor
async function enrichRecordsWithDoctors(records: any[]) {
  if (records.length === 0) return [];
  
  const adminSupabase = createAdminClient();
  const doctorIds = Array.from(new Set(records.map(r => r.doctor_id).filter(Boolean)));
  
  let doctorMap: Record<string, { full_name: string; specialty: string | null }> = {};
  
  if (doctorIds.length > 0) {
    const { data: doctors } = await adminSupabase
      .from('profiles')
      .select('id, full_name, specialty')
      .in('id', doctorIds);
    
    if (doctors) {
      doctors.forEach(doctor => {
        doctorMap[doctor.id] = { full_name: doctor.full_name, specialty: doctor.specialty };
      });
    }
  }
  
  return records.map(record => ({
    ...record,
    profiles: record.doctor_id ? (doctorMap[record.doctor_id] || null) : null,
  }));
}

// Función auxiliar para enriquecer citas con detalles
async function enrichAppointmentsWithDetails(appointments: any[]) {
  if (appointments.length === 0) return [];
  
  const adminSupabase = createAdminClient();
  const departmentIds = Array.from(new Set(appointments.map(a => a.department_id).filter(Boolean)));
  
  let departmentMap: Record<string, { name: string }> = {};
  
  if (departmentIds.length > 0) {
    const { data: departments } = await adminSupabase
      .from('departments')
      .select('id, name')
      .in('id', departmentIds);
    
    if (departments) {
      departments.forEach(dept => {
        departmentMap[dept.id] = { name: dept.name };
      });
    }
  }
  
  return appointments.map(apt => ({
    ...apt,
    departments: apt.department_id ? (departmentMap[apt.department_id] || null) : null,
  }));
}
