import { createClient } from '@/lib/supabase/server';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Search, AlertTriangle, Package } from 'lucide-react';

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  const supabase = await createClient();
  const category = searchParams.category || 'all';
  const search = searchParams.search || '';

  // Construir consulta
  let query = supabase
    .from('inventory')
    .select('*')
    .eq('is_active', true)
    .order('name');

  // Filtro por categoría
  if (category !== 'all') {
    query = query.eq('category', category);
  }

  // Búsqueda
  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  const { data: inventory } = await query;

  // Estadísticas
  const stats = {
    total: inventory?.length || 0,
    lowStock: inventory?.filter(item => item.quantity <= item.min_stock).length || 0,
    medications: inventory?.filter(item => item.category === 'medication').length || 0,
    supplies: inventory?.filter(item => item.category === 'supplies').length || 0,
    totalValue: inventory?.reduce((acc, item) => acc + (item.quantity * item.unit_cost), 0) || 0,
  };

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'medication', label: 'Medicamentos' },
    { value: 'supplies', label: 'Insumos' },
    { value: 'equipment', label: 'Equipos' },
    { value: 'consumables', label: 'Consumibles' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500 mt-1">Gestión de inventario y farmacia</p>
        </div>
        <Link href="/dashboard/pharmacy/inventory/new" className="btn-primary btn-md">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-100" />
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-100" />
            <div>
              <p className="text-sm text-gray-500">Stock Bajo</p>
              <p className="text-xl font-bold text-red-600">{stats.lowStock}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-green-100" />
            <div>
              <p className="text-sm text-gray-500">Medicamentos</p>
              <p className="text-xl font-bold">{stats.medications}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-yellow-100" />
            <div>
              <p className="text-sm text-gray-500">Insumos</p>
              <p className="text-xl font-bold">{stats.supplies}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-100" />
            <div>
              <p className="text-sm text-gray-500">Valor Total</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <form>
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Buscar por nombre o SKU..."
                  className="input pl-10"
                />
              </form>
            </div>

            {/* Category filter */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {categories.map((cat) => (
                <Link
                  key={cat.value}
                  href={`/dashboard/pharmacy/inventory?category=${cat.value}&search=${search}`}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    category === cat.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inventory table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Precio Unitario</th>
                <th>Valor Total</th>
                <th>Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventory && inventory.length > 0 ? (
                inventory.map((item) => {
                  const isLowStock = item.quantity <= item.min_stock;
                  const isOutOfStock = item.quantity === 0;
                  const isExpiring = item.expiration_date && 
                    new Date(item.expiration_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                  return (
                    <tr key={item.id} className={isOutOfStock ? 'bg-red-50' : isLowStock ? 'bg-yellow-50' : ''}>
                      <td>
                        <span className="font-mono text-sm">{item.sku}</span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">{item.description}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          item.category === 'medication' ? 'badge-info' :
                          item.category === 'supplies' ? 'badge-warning' :
                          item.category === 'equipment' ? 'badge-success' :
                          'badge-gray'
                        }`}>
                          {item.category === 'medication' ? 'Medicamento' :
                           item.category === 'supplies' ? 'Insumo' :
                           item.category === 'equipment' ? 'Equipo' :
                           item.category}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : ''}`}>
                            {item.quantity}
                          </span>
                          {item.unit}
                          {isOutOfStock && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          {isLowStock && !isOutOfStock && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td>{item.min_stock}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>{formatCurrency(item.quantity * item.unit_price)}</td>
                      <td>
                        {item.expiration_date ? (
                          <span className={isExpiring ? 'text-red-600 font-medium' : ''}>
                            {formatDate(item.expiration_date)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/pharmacy/inventory/${item.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Ver
                          </Link>
                          <Link
                            href={`/dashboard/pharmacy/inventory/${item.id}/edit`}
                            className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                          >
                            Editar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-500">
                    {search || category !== 'all'
                      ? 'No se encontraron productos para los filtros seleccionados'
                      : 'No hay productos en el inventario'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
