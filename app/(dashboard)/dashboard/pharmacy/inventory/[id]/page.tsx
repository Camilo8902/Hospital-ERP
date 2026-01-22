import { getProductById } from '@/lib/actions/pharmacy';
import InventoryForm from '@/components/pharmacy/InventoryForm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <InventoryForm initialData={product} isEditing={true} />;
}
