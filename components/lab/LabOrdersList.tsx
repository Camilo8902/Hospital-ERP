'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { LabOrder, LabOrderStatus } from '@/lib/types';

interface LabOrdersListProps {
  initialOrders: LabOrder[];
}

const statusOptions: { value: string; label: string; color: string }[] = [
  { value: 'all', label: 'Todos', color: '' },
  { value: 'pending', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'samples_collected', label: 'Muestras Tomadas', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'Procesando', color: 'bg-purple-100 text-purple-800' },
  { value: 'completed', label: 'Completado', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

export default function LabOrdersList({ initialOrders }: LabOrdersListProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtrar órdenes
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patients?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.patients?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: LabOrderStatus) => {
    const config = statusOptions.find(s => s.value === status);
    return (
      <span className={`badge ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent') {
      return <span className="badge bg-red-100 text-red-800">Urgente</span>;
    }
    return null;
  };

  // Contar pruebas correctamente
  const getTestsCount = (order: LabOrder): number => {
    if (order.lab_order_details && Array.isArray(order.lab_order_details) && order.lab_order_details.length > 0) {
      return order.lab_order_details.length;
    }
    return 0;
  };

  // Obtener nombres de pruebas para mostrar
  const getTestsNames = (order: LabOrder): Array<{id: string, name: string}> => {
    if (!order.lab_order_details || !Array.isArray(order.lab_order_details)) {
      return [];
    }
    
    return order.lab_order_details
      .map((d) => {
        // Acceder correctamente a los datos anidados
        const detailData = d as unknown as Record<string, unknown>;
        const testsData = detailData.tests as Record<string, unknown> | undefined;
        return {
          id: d.id,
          name: (testsData?.name as string) || 'Sin nombre'
        };
      })
      .filter(test => test.name && test.name !== 'Sin nombre');
  };

  const handleDeleteClick = (orderId: string) => {
    setDeleteConfirm(orderId);
  };

  const confirmDelete = async (orderId: string) => {
    setDeletingId(orderId);
    setDeleteConfirm(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/lab/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la orden');
      }

      // Remove from local state
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setSuccessMessage('Orden eliminada correctamente');
    } catch (error) {
      console.error('Error eliminando orden:', error);
      setSuccessMessage('Error al eliminar la orden');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Órdenes de Laboratorio</h1>
          <p className="text-gray-500 mt-1">Gestión de órdenes y resultados</p>
        </div>
        <Link href="/dashboard/lab/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Orden
        </Link>
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por número o paciente..."
                className="input pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="input min-w-[180px]"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Results count */}
            <div className="text-sm text-gray-500 ml-auto">
              {filteredOrders.length} orden(es) encontrada(s)
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className={`p-4 border rounded-lg ${
          successMessage.includes('Error') 
            ? 'bg-red-50 border-red-200' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {successMessage.includes('Error') ? (
                <X className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <p className={successMessage.includes('Error') ? 'text-red-800' : 'text-green-800'}>
                {successMessage}
              </p>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirm)}
                className="btn-danger"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Paciente</th>
                <th>Pruebas</th>
                <th>Doctor</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const testsNames = getTestsNames(order);
                  const testsCount = getTestsCount(order);
                  
                  return (
                    <tr key={order.id} className={order.priority === 'urgent' ? 'bg-red-50' : ''}>
                      <td className="font-mono text-sm font-medium">{order.order_number}</td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.patients?.first_name} {order.patients?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{order.patients?.phone}</p>
                        </div>
                      </td>
                      <td>
                        <div className="max-w-xs">
                          {testsCount > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {testsNames.slice(0, 3).map((test) => (
                                <span 
                                  key={test.id} 
                                  className="badge badge-gray text-xs"
                                  title={test.name}
                                >
                                  {test.name.length > 20 ? test.name.substring(0, 20) + '...' : test.name}
                                </span>
                              ))}
                              {testsCount > 3 && (
                                <span className="badge bg-gray-200 text-gray-600 text-xs">
                                  +{testsCount - 3} más
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Sin pruebas</span>
                          )}
                        </div>
                      </td>
                      <td className="text-sm text-gray-500">
                        {order.profiles?.full_name || '-'}
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>{getPriorityBadge(order.priority)}</td>
                      <td className="text-sm text-gray-500">{formatDate(order.created_at)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/lab/orders/${order.id}`}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </Link>
                          {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <Link
                              href={`/dashboard/lab/orders/${order.id}/edit`}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar orden"
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteClick(order.id)}
                            disabled={deletingId === order.id}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar orden"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                          {order.status === 'completed' && (
                            <Link
                              href={`/dashboard/lab/orders/${order.id}`}
                              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                              title="Ver e Imprimir Resultados"
                            >
                              <Eye className="w-4 h-4 text-green-500" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 mb-4 text-gray-300" />
                      <p>No se encontraron órdenes</p>
                      <p className="text-sm mt-1">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Intenta con otros filtros de búsqueda'
                          : 'Crea una nueva orden para comenzar'}
                      </p>
                    </div>
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
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} de {filteredOrders.length} órdenes
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
