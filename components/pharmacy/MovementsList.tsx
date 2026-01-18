'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Package,
  FileText
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { InventoryMovement } from '@/lib/actions/pharmacy';

interface MovementsListProps {
  initialMovements: InventoryMovement[];
}

const transactionTypeConfig: Record<string, { 
  label: string; 
  icon: 'in' | 'out' | 'adjustment' | 'other';
  color: string;
}> = {
  in: { label: 'Entrada', icon: 'in', color: 'bg-green-100 text-green-700' },
  out: { label: 'Salida', icon: 'out', color: 'bg-red-100 text-red-700' },
  adjustment: { label: 'Ajuste', icon: 'adjustment', color: 'bg-blue-100 text-blue-700' },
  transfer: { label: 'Transferencia', icon: 'other', color: 'bg-purple-100 text-purple-700' },
  return: { label: 'Devolución', icon: 'in', color: 'bg-green-100 text-green-700' },
  disposal: { label: 'Descarte', icon: 'out', color: 'bg-red-100 text-red-700' },
  prescription_dispense: { label: 'Dispensación', icon: 'out', color: 'bg-orange-100 text-orange-700' },
};

export default function MovementsList({ initialMovements }: MovementsListProps) {
  const [movements, setMovements] = useState(initialMovements);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filtrar movimientos
  const filteredMovements = movements.filter(movement => {
    const matchesSearch = 
      movement.inventory?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.inventory?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || movement.transaction_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Paginación
  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const getTransactionIcon = (type: string) => {
    const config = transactionTypeConfig[type];
    if (!config) return <RefreshCw className="w-4 h-4" />;

    switch (config.icon) {
      case 'in':
        return <ArrowUpCircle className="w-4 h-4" />;
      case 'out':
        return <ArrowDownCircle className="w-4 h-4" />;
      default:
        return <RefreshCw className="w-4 h-4" />;
    }
  };

  const getQuantityChange = (movement: InventoryMovement) => {
    if (movement.transaction_type === 'adjustment') {
      return (
        <span className="font-medium">
          {movement.previous_quantity} → {movement.new_quantity}
        </span>
      );
    }
    
    const change = movement.new_quantity - movement.previous_quantity;
    const isPositive = change >= 0;
    
    return (
      <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{movement.quantity} ({movement.previous_quantity} → {movement.new_quantity})
      </span>
    );
  };

  // Estadísticas rápidas
  const stats = {
    total: movements.length,
    entradas: movements.filter(m => m.transaction_type === 'in' || m.transaction_type === 'return').length,
    salidas: movements.filter(m => ['out', 'disposal', 'prescription_dispense'].includes(m.transaction_type)).length,
    ajustes: movements.filter(m => m.transaction_type === 'adjustment').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de Movimientos</h1>
          <p className="text-gray-500 mt-1">Registro de movimientos de inventario</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Movimientos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Entradas</p>
          <p className="text-2xl font-bold text-green-600">{stats.entradas}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Salidas</p>
          <p className="text-2xl font-bold text-red-600">{stats.salidas}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Ajustes</p>
          <p className="text-2xl font-bold text-blue-600">{stats.ajustes}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar por producto o usuario..."
                className="input pl-10"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="input min-w-[180px]"
              >
                <option value="all">Todos los tipos</option>
                {Object.entries(transactionTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cambio</th>
                <th>Referencia</th>
                <th>Usuario</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.length > 0 ? (
                paginatedMovements.map((movement) => {
                  const config = transactionTypeConfig[movement.transaction_type] || {
                    label: movement.transaction_type,
                    icon: 'other',
                    color: 'bg-gray-100 text-gray-700'
                  };
                  
                  return (
                    <tr key={movement.id}>
                      <td className="text-sm">
                        <div>
                          <p className="font-medium">{formatDateTime(movement.created_at).split(' ')[0]}</p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(movement.created_at).split(' ')[1]}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{movement.inventory?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-500 font-mono">{movement.inventory?.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          {getTransactionIcon(movement.transaction_type)}
                          {config.label}
                        </span>
                      </td>
                      <td>
                        {getQuantityChange(movement)}
                      </td>
                      <td>
                        {movement.reference_type ? (
                          <div className="flex items-center gap-1 text-sm">
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600">
                              {movement.reference_type === 'prescription' ? 'Receta' : movement.reference_type}
                            </span>
                            {movement.reference_id && (
                              <span className="text-gray-400">
                                #{movement.reference_id.substring(0, 6)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="text-sm">
                        {movement.profile?.full_name || 'Sistema'}
                      </td>
                      <td className="text-sm text-gray-500 max-w-[200px] truncate">
                        {movement.notes || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No se encontraron movimientos</p>
                    <p className="text-sm mt-1">
                      {searchQuery || selectedType !== 'all'
                        ? 'Intenta con otros filtros de búsqueda'
                        : 'Los movimientos de inventario aparecerán aquí'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredMovements.length)} de {filteredMovements.length} movimientos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 py-1 text-sm font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
