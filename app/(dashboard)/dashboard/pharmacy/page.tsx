import { getPharmacyStats, getPrescriptions, getLowStockProducts } from '@/lib/actions/pharmacy';
import PharmacyDashboard from '@/components/pharmacy/PharmacyDashboard';

export const dynamic = 'force-dynamic';

export default async function PharmacyPage() {
  // Obtener datos iniciales
  const [stats, pendingPrescriptions, lowStockProducts] = await Promise.all([
    getPharmacyStats(),
    getPrescriptions('pending'),
    getLowStockProducts(),
  ]);

  return (
    <PharmacyDashboard
      initialStats={stats}
      pendingPrescriptions={pendingPrescriptions}
      lowStockProducts={lowStockProducts}
    />
  );
}
