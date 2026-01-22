import InventoryForm from '@/components/pharmacy/InventoryForm';

export const metadata = {
  title: 'Nuevo Producto - Farmacia',
  description: 'Agregar nuevo producto al inventario de farmacia',
};

export default function NewProductPage() {
  return <InventoryForm isEditing={false} />;
}
