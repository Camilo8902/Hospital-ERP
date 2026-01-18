import { getAppointmentById } from '@/lib/actions/appointments';
import { getPatientById } from '@/lib/actions/patients';
import PrescriptionForm from '@/components/pharmacy/PrescriptionForm';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NewPrescriptionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const appointmentId = typeof params.appointment_id === 'string' ? params.appointment_id : null;
  const patientId = typeof params.patient_id === 'string' ? params.patient_id : null;

  let patientName = '';

  if (patientId) {
    // Buscar información del paciente usando cliente admin
    const adminSupabase = createAdminClient();
    const { data: patient } = await adminSupabase
      .from('patients')
      .select('first_name, last_name')
      .eq('id', patientId)
      .single();

    if (patient) {
      patientName = `${patient.first_name} ${patient.last_name}`;
    }
  } else if (appointmentId) {
    // Buscar información del paciente a través de la cita
    const appointment = await getAppointmentById(appointmentId);
    
    if (!appointment) {
      notFound();
    }

    // Obtener nombre del paciente usando cliente admin
    const adminSupabase = createAdminClient();
    const { data: patient } = await adminSupabase
      .from('patients')
      .select('first_name, last_name')
      .eq('id', appointment.patient_id)
      .single();

    if (patient) {
      patientName = `${patient.first_name} ${patient.last_name}`;
    }
  }

  return (
    <PrescriptionForm
      appointmentId={appointmentId || undefined}
      patientId={patientId || undefined}
      patientName={patientName || undefined}
    />
  );
}
