import { notFound } from 'next/navigation';
import { formatDate, calculateAge, formatPhone, getInitials } from '@/lib/utils';
import PatientDetailClient from './PatientDetailClient';
import { UserRole } from '@/lib/types';
import { getPatientById, getPatientNotes } from '@/lib/actions/patients';
import { getPrescriptionsByPatient } from '@/lib/actions/pharmacy';
import { getLabOrdersByPatient } from '@/lib/actions/lab';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PatientDetailPage({ params }: PatientDetailPageProps) {
  const { id } = await params;
  
  // Usar el cliente regular para obtener el usuario actual (para verificar rol)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Usar el cliente admin para obtener el paciente (evita problemas RLS)
  const patient = await getPatientById(id);

  if (!patient) {
    notFound();
  }

  // Usar el cliente admin para todas las consultas de datos (evita errores 403 por RLS)
  const adminSupabase = createAdminClient();

  // Obtener historial clínico - usando cliente admin
  const { data: medicalRecords } = await adminSupabase
    .from('medical_records')
    .select('*')
    .eq('patient_id', id)
    .order('visit_date', { ascending: false });

  // Obtener citas - usando cliente admin
  const { data: appointments } = await adminSupabase
    .from('appointments')
    .select('*')
    .eq('patient_id', id)
    .order('start_time', { ascending: false })
    .limit(10);

  // Usar la función de pharmacy actions para obtener recetas
  const prescriptions = await getPrescriptionsByPatient(id);

  // Obtener órdenes de laboratorio del paciente
  const labOrders = await getLabOrdersByPatient(id);

  // Obtener anotaciones del paciente
  const patientNotes = await getPatientNotes(id);

  // Obtener perfil del usuario actual para verificar rol y nombre
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  // Obtener perfil del usuario actual para verificar rol y nombre
  const { data: currentProfile } = await adminSupabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user?.id)
    .single();

  const userRole = (currentProfile?.role || 'reception') as UserRole;
  const currentUserName = currentProfile?.full_name || 'Usuario desconocido';
  const canViewMedicalRecords = ['admin', 'doctor', 'nurse'].includes(userRole);
  const canEditRecords = ['admin', 'doctor'].includes(userRole);

  // Enriquecer medicalRecords con datos del doctor
  const enrichedRecords = await enrichMedicalRecordsWithDoctors(medicalRecords || []);
  
  // Enriquecer appointments con datos de departamentos y habitaciones
  const enrichedAppointments = await enrichAppointmentsWithDetails(appointments || []);

  return (
    <PatientDetailClient
      patient={patient}
      medicalRecords={enrichedRecords}
      appointments={enrichedAppointments}
      prescriptions={prescriptions}
      labOrders={labOrders}
      patientNotes={patientNotes}
      currentUserId={user?.id || ''}
      currentUserName={currentUserName}
      userRole={userRole}
      canViewMedicalRecords={canViewMedicalRecords}
      canEditRecords={canEditRecords}
    />
  );
}

// Función auxiliar para enriquecer registros médicos con datos del doctor
async function enrichMedicalRecordsWithDoctors(records: any[]) {
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
  const roomIds = Array.from(new Set(appointments.map(a => a.room_id).filter(Boolean)));
  
  let departmentMap: Record<string, { name: string }> = {};
  let roomMap: Record<string, { room_number: string }> = {};
  
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
  
  if (roomIds.length > 0) {
    const { data: rooms } = await adminSupabase
      .from('rooms')
      .select('id, room_number')
      .in('id', roomIds);
    
    if (rooms) {
      rooms.forEach(room => {
        roomMap[room.id] = { room_number: room.room_number };
      });
    }
  }
  
  return appointments.map(apt => ({
    ...apt,
    departments: apt.department_id ? (departmentMap[apt.department_id] || null) : null,
    rooms: apt.room_id ? (roomMap[apt.room_id] || null) : null,
  }));
}
