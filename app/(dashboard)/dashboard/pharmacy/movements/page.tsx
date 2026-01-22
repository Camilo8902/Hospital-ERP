import { getInventoryMovements } from '@/lib/actions/pharmacy';
import MovementsList from '@/components/pharmacy/MovementsList';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MovementsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const productId = typeof params.product_id === 'string' ? params.product_id : undefined;
  const startDate = typeof params.start_date === 'string' ? params.start_date : undefined;
  const endDate = typeof params.end_date === 'string' ? params.end_date : undefined;
  const transactionType = typeof params.type === 'string' ? params.type : undefined;

  // Obtener movimientos
  const movements = await getInventoryMovements(
    productId,
    startDate,
    endDate,
    transactionType
  );

  return (
    <MovementsList initialMovements={movements} />
  );
}
