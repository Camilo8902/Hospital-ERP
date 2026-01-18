import { getLabOrderById } from '@/lib/actions/lab';
import LabOrderDetail from '@/components/lab/LabOrderDetail';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getOrder(id: string) {
  const order = await getLabOrderById(id);
  return order;
}

export default async function LabOrderDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const order = await getOrder(resolvedParams.id);

  if (!order) {
    notFound();
  }

  return <LabOrderDetail initialOrder={order} />;
}
