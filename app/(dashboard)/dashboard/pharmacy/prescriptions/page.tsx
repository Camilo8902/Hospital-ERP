import { getPrescriptions } from '@/lib/actions/pharmacy';
import PrescriptionList from '@/components/pharmacy/PrescriptionList';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PrescriptionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const search = typeof params.search === 'string' ? params.search : undefined;

  // Obtener recetas
  const prescriptions = await getPrescriptions(status, undefined, search);

  // Extraer estados únicos para los filtros
  const statuses = ['pending', 'partially_dispensed', 'dispensed', 'cancelled', 'expired'];

  return (
    <PrescriptionList
      initialPrescriptions={prescriptions}
      statuses={statuses}
    />
  );
}
