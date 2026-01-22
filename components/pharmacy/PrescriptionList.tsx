'use client';

import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Check, 
  X, 
  AlertTriangle,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { PrescriptionWithRelations } from '@/lib/actions/pharmacy';

interface PrescriptionListProps {
  initialPrescriptions: PrescriptionWithRelations[];
  statuses: string[];
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
  partially_dispensed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Parcial' },
  dispensed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Dispensada' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelada' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Vencida' },
};

export default function PrescriptionList({ initialPrescriptions, statuses }: PrescriptionListProps) {
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;

  // Filtrar recetas
  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = 
      rx.medication_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patients?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patients?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || rx.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredPrescriptions.length / itemsPerPage);
  const paginatedPrescriptions = filteredPrescriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleDispense = async (prescriptionId: string) => {
    if (!confirm('¿Estás seguro de dispensar esta receta?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/pharmacy/prescriptions/${prescriptionId}/dispense`, {
        method: 'POST',
      });

      if (response.ok) {
        // Actualizar estado local
        setPrescriptions(prev => 
          prev.map(rx => 
            rx.id === prescriptionId 
              ? { ...rx, status: 'dispensed', quantity_dispensed: rx.quantity_prescribed, dispensed_date: new Date().toISOString() }
              : rx
          )
        );
      } else {
        const data = await response.json();
        alert(data.error || 'Error al dispensar receta');
      }
    } catch (error) {
      console.error('Error al dispensar:', error);
      alert('Error al dispensar receta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (prescriptionId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta receta?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/pharmacy/prescriptions/${prescriptionId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        // Actualizar estado local
        setPrescriptions(prev => 
          prev.map(rx => 
            rx.id === prescriptionId ? { ...rx, status: 'cancelled' } : rx
          )
        );
      } else {
        alert('Error al cancelar receta');
      }
    } catch (error) {
      console.error('Error al cancelar:', error);
      alert('Error al cancelar receta');
    } finally {
      setIsLoading(false);
    }
  };

  const canDispense = (rx: PrescriptionWithRelations) => {
    return rx.status === 'pending' || rx.status === 'partially_dispensed';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recetas Médicas</h1>
          <p className="text-gray-500 mt-1">Gestión y dispensación de recetas</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statuses.map(status => {
          const config = statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
          const count = prescriptions.filter(rx => rx.status === status).length;
          
          return (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`card p-4 text-left transition-all ${
                selectedStatus === status 
                  ? 'ring-2 ring-primary-500' 
                  : 'hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{config.label}</p>
                  <p className={`text-2xl font-bold ${config.text}`}>{count}</p>
                </div>
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <FileText className={`w-4 h-4 ${config.text}`} />
                </div>
              </div>
            </button>
          );
        })}
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
                placeholder="Buscar por paciente o medicamento..."
                className="input pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="input min-w-[150px]"
              >
                <option value="all">Todos los estados</option>
                {statuses.map(status => {
                  const config = statusColors[status] || { label: status };
                  return (
                    <option key={status} value={status}>
                      {config.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Prescriptions Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Medicamento</th>
                <th>Dosis</th>
                <th>Frecuencia</th>
                <th>Duración</th>
                <th>Cantidad</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPrescriptions.length > 0 ? (
                paginatedPrescriptions.map((rx) => {
                  const config = statusColors[rx.status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: rx.status };
                  
                  return (
                    <tr key={rx.id}>
                      <td>
                        <div>
                          <p className="font-medium">
                            {rx.patients?.first_name} {rx.patients?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{rx.patients?.phone}</p>
                        </div>
                      </td>
                      <td className="font-medium">{rx.medication_name}</td>
                      <td>{rx.dosage}</td>
                      <td>{rx.frequency}</td>
                      <td>{rx.duration}</td>
                      <td>
                        <div>
                          <span className="font-medium">{rx.quantity_prescribed}</span>
                          {rx.quantity_dispensed > 0 && (
                            <span className="text-xs text-gray-500 block">
                              ({rx.quantity_dispensed} dispensado)
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${config.bg} ${config.text}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="text-sm text-gray-500">
                        {formatDate(rx.created_at)}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedPrescription(rx)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          
                          {canDispense(rx) && (
                            <>
                              <button
                                onClick={() => handleDispense(rx.id)}
                                disabled={isLoading}
                                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                title="Dispensar"
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => handleCancel(rx.id)}
                                disabled={isLoading}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No se encontraron recetas</p>
                    <p className="text-sm mt-1">
                      {searchQuery || selectedStatus !== 'all'
                        ? 'Intenta con otros filtros de búsqueda'
                        : 'No hay recetas registradas'}
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
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPrescriptions.length)} de {filteredPrescriptions.length} recetas
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

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Detalle de Receta</h2>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Patient Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Paciente</h3>
                <div className="card p-4 bg-gray-50">
                  <p className="font-medium text-lg">
                    {selectedPrescription.patients?.first_name} {selectedPrescription.patients?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Tel: {selectedPrescription.patients?.phone}
                  </p>
                </div>
              </div>

              {/* Medication Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Medicamento Recetado</h3>
                <div className="card p-4 bg-gray-50">
                  <p className="font-medium text-lg">{selectedPrescription.medication_name}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Dosis</p>
                      <p className="font-medium">{selectedPrescription.dosage}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Frecuencia</p>
                      <p className="font-medium">{selectedPrescription.frequency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duración</p>
                      <p className="font-medium">{selectedPrescription.duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cantidad Recetada</p>
                      <p className="font-medium">{selectedPrescription.quantity_prescribed} unidades</p>
                    </div>
                  </div>
                  {selectedPrescription.instructions && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500">Instrucciones Especiales</p>
                      <p className="mt-1 text-sm">{selectedPrescription.instructions}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <span className={`badge ${
                    statusColors[selectedPrescription.status]?.bg || 'bg-gray-100'
                  } ${statusColors[selectedPrescription.status]?.text || 'text-gray-700'} mt-1`}>
                    {statusColors[selectedPrescription.status]?.label || selectedPrescription.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha de Emisión</p>
                  <p className="font-medium">{formatDateTime(selectedPrescription.created_at)}</p>
                </div>
              </div>

              {/* Prescription Number */}
              <div>
                <p className="text-xs text-gray-500">Número de Receta</p>
                <p className="font-mono font-medium">{selectedPrescription.id.substring(0, 8).toUpperCase()}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              {canDispense(selectedPrescription) && (
                <>
                  <button
                    onClick={() => {
                      handleCancel(selectedPrescription.id);
                      setSelectedPrescription(null);
                    }}
                    className="btn-danger"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      handleDispense(selectedPrescription.id);
                      setSelectedPrescription(null);
                    }}
                    className="btn-primary"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Dispensar
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedPrescription(null)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
