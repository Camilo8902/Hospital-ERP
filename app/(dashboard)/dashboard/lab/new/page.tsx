import { Suspense } from 'react';
import { getPatients } from '@/lib/actions/patients';
import LabOrderForm from '@/components/lab/LabOrderForm';

export const dynamic = 'force-dynamic';

async function getPatientsData() {
  return getPatients(undefined, 100);
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="card">
        <div className="card-body space-y-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export default async function NewLabOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ patient_id?: string; appointment_id?: string }>
}) {
  const patients = await getPatientsData();
  const params = await searchParams;
  
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LabOrderForm 
        patients={patients} 
        initialPatientId={params.patient_id || undefined} 
      />
    </Suspense>
  );
}
