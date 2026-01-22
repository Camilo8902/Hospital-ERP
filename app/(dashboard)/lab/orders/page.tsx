import { Suspense } from 'react';
import { getLabOrders } from '@/lib/actions/lab';
import LabOrdersList from '@/components/lab/LabOrdersList';

// Componente de carga para Suspense
function LoadingState() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded"></div>
      </div>

      {/* Filters skeleton */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <div className="h-10 flex-1 bg-gray-200 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="card">
        <div className="table-container">
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full"></div>
            <div className="h-5 w-48 bg-gray-200 rounded mx-auto mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

// Componente de página asíncrono (Next.js 13+)
export default async function LabOrdersPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { status, page } = resolvedSearchParams;

  // Construir filtros
  const filters: Record<string, string> = {};
  if (status && status !== 'all') {
    filters.status = status;
  }

  // Determinar página
  const pageNum = page ? parseInt(page, 10) : 1;
  const limit = 50;
  const offset = (pageNum - 1) * limit;

  // Obtener órdenes
  const orders = await getLabOrders(filters, limit);

  return (
    <Suspense fallback={<LoadingState />}>
      <LabOrdersList initialOrders={orders} />
    </Suspense>
  );
}

// Generar metadatos para la página
export async function generateMetadata() {
  return {
    title: 'Órdenes de Laboratorio - Medicore ERP',
    description: 'Gestión de órdenes y resultados de laboratorio',
  };
}
