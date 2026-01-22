'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewRecordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patient_id');

  useEffect(() => {
    if (patientId) {
      // Redirigir a la página de historial del paciente donde está el modal de selección
      router.push(`/dashboard/patients/${patientId}/history`);
    } else {
      // Si no hay patient_id, redirigir a la lista de pacientes
      router.push('/dashboard/patients');
    }
  }, [patientId, router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
}
