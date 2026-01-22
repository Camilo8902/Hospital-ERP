import { notFound } from 'next/navigation';
import { getPatientById } from '@/lib/actions/patients';
import EditPatientPageClient from './EditPatientPageClient';

// Forzar que siempre obtenga datos frescos (sin caché)
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatientById(id);
  
  return {
    title: patient ? `Editar ${patient.first_name} ${patient.last_name} - MediCore ERP` : 'Editar Paciente - MediCore ERP',
  };
}

export default async function EditPatientPageWrapper({ params }: PageProps) {
  const { id } = await params;
  const patient = await getPatientById(id);

  if (!patient) {
    notFound();
  }

  return <EditPatientPageClient patient={patient} />;
}
