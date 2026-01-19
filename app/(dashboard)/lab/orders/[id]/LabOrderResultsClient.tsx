'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  X,
  TestTube,
  Beaker
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { LabOrder, LabTestCatalog, LabTestParameter, LabOrderResult, LabOrderDetail } from '@/lib/types';
import { 
  getTestParameters, 
  isValueAbnormal, 
  isValueCritical, 
  getReferenceRangeText,
  getParameterSortOrder,
  ExtendedLabTestCatalog
} from '@/components/lab/labParameterUtils';

interface LabOrderDetailWithTest extends Omit<LabOrderDetail, 'tests' | 'lab_results'> {
  tests?: LabTestCatalog;
  lab_results?: LabOrderResult[];
}

interface LabOrderResultsPageProps {
  initialOrder: LabOrder;
}

export default function LabOrderResultsPage({ initialOrder }: LabOrderResultsPageProps) {
  const [order, setOrder] = useState<LabOrder>(initialOrder);
  const [activeTab, setActiveTab] = useState<'results' | 'info'>('results');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Estado local para los valores de los inputs
  const [results, setResults] = useState<Record<string, Record<string, string>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  
  // Ref para rastrear si ya se inicializó el estado
  const isInitialized = useRef(false);

  // Inicializar estado solo una vez con los datos iniciales
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const newResults: Record<string, Record<string, string>> = {};
    const newNotes: Record<string, string> = {};

    if (order.lab_order_details && Array.isArray(order.lab_order_details)) {
      order.lab_order_details.forEach((detail: LabOrderDetailWithTest) => {
        if (detail.lab_results && Array.isArray(detail.lab_results)) {
          detail.lab_results.forEach((result) => {
            if (!newResults[detail.id]) {
              newResults[detail.id] = {};
            }
            if (result.parameter_id) {
              newResults[detail.id][result.parameter_id] = result.value_text || '';
            } else {
              newResults[detail.id]['default'] = result.value_text || '';
            }
            if (result.notes) {
              newNotes[detail.id] = result.notes;
            }
          });
        }
      });
    }

    setResults(newResults);
    setNotes(newNotes);
  }, [order.lab_order_details, order]);

  // Manejar cambio en el valor de un resultado
  const handleResultChange = (detailId: string, parameterId: string | undefined, value: string) => {
    setResults(prev => {
      const newResults = { ...prev };
      if (!newResults[detailId]) {
        newResults[detailId] = {};
      }
      newResults[detailId][parameterId || 'default'] = value;
      return newResults;
    });
  };

  // Manejar cambio en las notas de un detalle
  const handleNoteChange = (detailId: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [detailId]: value
    }));
  };

  // Obtener badge de estado
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pendiente' },
      samples_collected: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: TestTube, label: 'Muestras Tomadas' },
      processing: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Beaker, label: 'Procesando' },
      completed: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Completado' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', icon: X, label: 'Cancelado' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  // Verificar si el valor es crítico
  const isCriticalValue = (parameter: LabTestParameter, value: string): boolean => {
    return isValueCritical(parameter, value);
  };

  // Obtener detalles de la orden
  const getDetails = (): LabOrderDetailWithTest[] => {
    if (order.lab_order_details && Array.isArray(order.lab_order_details)) {
      return order.lab_order_details as unknown as LabOrderDetailWithTest[];
    }
    return [];
  };

  // Guardar todos los resultados
  const saveAllResults = async () => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const details = getDetails();
      console.log('Detalles encontrados:', details.length);
      console.log('Resultados actuales:', results);
      
      let hasError = false;
      let savedCount = 0;
      let totalToSave = 0;

      for (const detail of details) {
        console.log('Procesando detalle:', detail.id, 'Test:', detail.tests?.name);
        
        const test = detail.tests;
        if (!test) {
          console.warn('No se encontró test para el detalle:', detail.id);
          continue;
        }

        const detailResults = results[detail.id] || {};
        const detailNotes = notes[detail.id] || '';
        const parameters = test.lab_parameters || test.parameters || [];
        console.log('Parámetros del test:', parameters.length);

        if (parameters.length > 0) {
          // La prueba tiene parámetros definidos
          for (const param of parameters) {
            const value = detailResults[param.id];
            totalToSave++;
            console.log('Guardando parámetro:', param.name, 'Valor:', value);
            
            if (value && value.trim()) {
              const response = await fetch('/api/lab/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  order_detail_id: detail.id,
                  parameter_id: param.id,
                  value: value.trim(),
                  notes: detailNotes,
                }),
              });

              if (!response.ok) {
                hasError = true;
                const errorData = await response.json();
                console.error(`Error guardando parámetro ${param.name}:`, errorData);
              } else {
                savedCount++;
              }
            }
          }
        } else {
          // La prueba no tiene parámetros específicos, guardar como resultado general
          const defaultValue = detailResults['default'];
          totalToSave++;
          console.log('Guardando resultado general:', defaultValue);
          
          if (defaultValue && defaultValue.trim()) {
            const response = await fetch('/api/lab/results', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_detail_id: detail.id,
                parameter_id: null,
                value: defaultValue.trim(),
                notes: detailNotes,
              }),
            });

            if (!response.ok) {
              hasError = true;
              const errorData = await response.json();
              console.error('Error guardando resultado general:', errorData);
            } else {
              savedCount++;
            }
          }
        }
      }

      console.log('Resumen guardado:', savedCount, '/', totalToSave);

      if (hasError) {
        setErrorMessage(`Error al guardar algunos resultados (${savedCount}/${totalToSave})`);
        setSuccessMessage(null);
      } else if (savedCount > 0) {
        setSuccessMessage(`Resultados guardados correctamente (${savedCount}/${totalToSave})`);
        setErrorMessage(null);
        if (order.status === 'pending' || order.status === 'samples_collected') {
          setOrder(prev => ({ ...prev, status: 'processing' }));
        }
      } else {
        setSuccessMessage('No hay valores para guardar');
        setErrorMessage(null);
      }
    } catch (error) {
      console.error('Error guardando resultados:', error);
      setErrorMessage('Error al guardar los resultados');
      setSuccessMessage(null);
    } finally {
      setSaving(false);
    }
  };

  // Completar la orden
  const completeOrder = async () => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/lab/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setOrder(prev => ({ 
          ...prev, 
          status: 'completed' as const, 
          completed_at: new Date().toISOString() 
        }));
        setSuccessMessage('Orden completada correctamente');
        setErrorMessage(null);
      } else {
        setErrorMessage(data.error || 'Error al completar la orden');
        setSuccessMessage(null);
      }
    } catch (error) {
      console.error('Error completando orden:', error);
      setErrorMessage('Error al completar la orden');
      setSuccessMessage(null);
    } finally {
      setSaving(false);
    }
  };

  const details = getDetails();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/lab/orders" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orden {order.order_number}</h1>
            <p className="text-gray-500">Gestión de pruebas y resultados</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(order.status)}
          {order.status === 'completed' && (
            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = `/api/lab/orders/${order.id}/print`;
                link.download = `resultados-laboratorio-${order.order_number}.pdf`;
                link.target = '_blank';
                link.click();
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </button>
          )}
        </div>
      </div>

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mensaje de error */}
      {errorMessage && (
        <div className="p-4 border rounded-lg bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{errorMessage}</p>
            </div>
            <button 
              onClick={() => setErrorMessage(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tarjeta de información del paciente */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Paciente</p>
              <p className="font-medium text-lg">
                {order.patients?.first_name} {order.patients?.last_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium">{order.patients?.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Doctor Solicitante</p>
              <p className="font-medium">{order.profiles?.full_name || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha de Orden</p>
              <p className="font-medium">{formatDateTime(order.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Prioridad</p>
              <p className={`font-medium ${order.priority === 'urgent' ? 'text-red-600' : 'text-gray-900'}`}>
                {order.priority === 'urgent' ? 'Urgente' : 'Normal'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Notas</p>
              <p className="font-medium">{order.notes || 'Sin notas'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'results'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Resultados de Pruebas
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Información General
        </button>
      </div>

      {/* Pestaña de Resultados */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {details.length > 0 ? (
            details.map((detailItem) => {
              const test = detailItem.tests;
              if (!test) return null;
              
              console.log('[Frontend] Test:', test.name, 'lab_parameters:', test.lab_parameters || test.parameters);
              
              const parameters = getTestParameters(test as ExtendedLabTestCatalog);

              return (
                <div key={detailItem.id} className="card">
                  <div className="card-header">
                    <div>
                      <h3 className="font-semibold text-gray-900">{test.name}</h3>
                      <p className="text-sm text-gray-500">
                        {test.category?.name || 'Sin categoría'} • Código: {test.code || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="card-body">
                    {parameters.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parameters
                          .sort((a, b) => getParameterSortOrder(a) - getParameterSortOrder(b))
                          .map((param) => {
                            const currentValue = results[detailItem.id]?.[param.id] || '';
                            const isAbnormal = isValueAbnormal(param, currentValue);
                            const isCritical = isCriticalValue(param, currentValue);
                            
                            return (
                              <div 
                                key={param.id} 
                                className={`p-4 rounded-lg border ${
                                  isCritical 
                                    ? 'bg-red-50 border-red-200' 
                                    : isAbnormal 
                                      ? 'bg-yellow-50 border-yellow-200' 
                                      : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-medium text-gray-700">
                                    {param.name}
                                    {param.code && (
                                      <span className="text-xs text-gray-400 ml-2">({param.code})</span>
                                    )}
                                  </label>
                                  {param.unit && (
                                    <span className="text-xs text-gray-500 font-medium bg-gray-200 px-2 py-0.5 rounded">
                                      {param.unit}
                                    </span>
                                  )}
                                </div>
                                <input
                                  type="text"
                                  value={currentValue}
                                  onChange={(e) => handleResultChange(detailItem.id, param.id, e.target.value)}
                                  disabled={order.status === 'completed'}
                                  placeholder={`Ingrese valor`}
                                  className={`input w-full ${
                                    isCritical 
                                      ? 'border-red-500 focus:ring-red-500' 
                                      : isAbnormal 
                                        ? 'border-yellow-500 focus:ring-yellow-500' 
                                        : ''
                                  }`}
                                />
                                {getReferenceRangeText(param) && (
                                  <p className="text-xs text-gray-500 mt-1.5">
                                    <span className="font-medium">Rango referencia:</span>{' '}
                                    {getReferenceRangeText(param)}
                                    {param.unit && ` ${param.unit}`}
                                  </p>
                                )}
                                {isCritical && (
                                  <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Valor crítico - Requiere atención
                                  </p>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p className="mb-2">Esta prueba no tiene parámetros definidos</p>
                        <input
                          type="text"
                          value={results[detailItem.id]?.['default'] || ''}
                          onChange={(e) => handleResultChange(detailItem.id, undefined, e.target.value)}
                          disabled={order.status === 'completed'}
                          placeholder="Ingrese el resultado..."
                          className="input max-w-md mx-auto"
                        />
                      </div>
                    )}

                    {/* Notas para esta prueba */}
                    <div className="mt-4">
                      <label className="label mb-1.5">Notas y Observaciones</label>
                      <textarea
                        value={notes[detailItem.id] || ''}
                        onChange={(e) => handleNoteChange(detailItem.id, e.target.value)}
                        disabled={order.status === 'completed'}
                        rows={2}
                        className="input"
                        placeholder="Observaciones clínicas, notas técnicas o comentarios..."
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card p-12 text-center text-gray-500">
              <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No hay pruebas asociadas</p>
              <p className="text-sm mt-1">Esta orden no tiene pruebas de laboratorio asignadas</p>
            </div>
          )}

          {/* Botones de acción */}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className="flex justify-end gap-3">
              <button
                onClick={saveAllResults}
                disabled={saving}
                className="btn-secondary flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Resultados'}
              </button>
              <button
                onClick={completeOrder}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {saving ? 'Completando...' : 'Completar Orden'}
              </button>
            </div>
          )}
          
          {/* Información sobre completitud */}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <p className="text-sm text-gray-500 text-center">
              Para completar la orden, todos los parámetros deben tener valores ingresados.
            </p>
          )}
        </div>
      )}

      {/* Pestaña de Información General */}
      {activeTab === 'info' && (
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold text-gray-900 mb-4">Información Detallada</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Código de Orden</p>
                  <p className="font-medium">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-medium">${order.total_amount?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado de Pago</p>
                  <p className={`font-medium ${order.is_paid ? 'text-green-600' : 'text-yellow-600'}`}>
                    {order.is_paid ? 'Pagado' : 'Pendiente de Pago'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completada</p>
                  <p className="font-medium">
                    {order.completed_at ? formatDateTime(order.completed_at) : 'No'}
                  </p>
                </div>
              </div>
              
              {/* Lista de pruebas */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Pruebas Asociadas</h4>
                <div className="space-y-2">
                  {details.map((detailItem) => {
                    const test = detailItem.tests;
                    if (!test) return null;
                    return (
                      <div key={detailItem.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{test.name}</span>
                        <span className="text-sm text-gray-500">{test.category?.name || 'Sin categoría'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
