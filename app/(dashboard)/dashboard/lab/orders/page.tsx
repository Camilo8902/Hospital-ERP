import { getLabOrders } from '@/lib/actions/lab';
import LabOrdersList from '@/components/lab/LabOrdersList';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

async function getOrders(status?: string) {
  return getLabOrders(status ? { status } : undefined, 100);
}

export default async function LabOrdersPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const orders = await getOrders(resolvedParams.status);

  return <LabOrdersList initialOrders={orders} />;
}
