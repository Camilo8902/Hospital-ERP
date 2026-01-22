import { getInventoryProducts, getCategories } from '@/lib/actions/pharmacy';
import InventoryList from '@/components/pharmacy/InventoryList';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const filter = typeof params.filter === 'string' ? params.filter : undefined;

  // Obtener datos iniciales
  const [products, categories] = await Promise.all([
    getInventoryProducts(search, category, filter === 'low_stock'),
    getCategories(),
  ]);

  return (
    <InventoryList
      initialProducts={products}
      categories={categories}
    />
  );
}
