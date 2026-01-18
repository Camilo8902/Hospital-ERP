import { getLabStats, getRecentLabOrders } from '@/lib/actions/lab';
import LabDashboard from '@/components/lab/LabDashboard';

export const dynamic = 'force-dynamic';

async function getData() {
  const [stats, recentOrders] = await Promise.all([
    getLabStats(),
    getRecentLabOrders(5),
  ]);

  return { stats, recentOrders };
}

export default async function LabPage() {
  const { stats, recentOrders } = await getData();

  return <LabDashboard initialStats={stats} recentOrders={recentOrders} />;
}
