import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getLabOrderById } from '@/lib/actions/lab';
import LabOrderResultsClient from './LabOrderResultsClient';

// Componente de carga para Suspense
function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-8 w-32 bg-gray-200 rounded-full"></div>
      </div>

      {/* Patient info skeleton */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 w-40 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 w-32 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-28 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 w-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tests skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded"></div>
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Componente de página asíncrono (Next.js 13+)
export default async function LabOrderResultsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Validar que el ID sea un UUID válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Obtener la orden con todos los detalles y parámetros
  const order = await getLabOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <LabOrderResultsClient initialOrder={order} />
    </Suspense>
  );
}

// Generar metadatos para la página
export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const order = await getLabOrderById(id);
  
  if (!order) {
    return {
      title: 'Orden no encontrada - Medicore ERP',
    };
  }

  return {
    title: `Orden ${order.order_number} - Resultados de Laboratorio - Medicore ERP`,
    description: `Gestión de resultados para la orden ${order.order_number} del paciente ${order.patients?.first_name} ${order.patients?.last_name}`,
  };
}
