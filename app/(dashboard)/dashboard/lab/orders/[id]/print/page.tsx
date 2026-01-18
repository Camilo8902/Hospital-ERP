import { getLabOrderById } from '@/lib/actions/lab';
import { formatDate, formatDateTime } from '@/lib/utils';
import { notFound } from 'next/navigation';

interface PrintPageProps {
  params: Promise<{ id: string }>;
}

// Tipo para los parámetros basado en la estructura del JSON del usuario
interface LabParameterRow {
  id: string;
  test_id: string;
  name: string;
  code: string | null;
  unit: string | null;
  reference_min: string | null;
  reference_max: string | null;
  reference_text: string | null;
  method: string | null;
  sort_order: number;
  is_critical_below: string | null;
  is_critical_above: string | null;
  decimal_places: number;
  is_active: boolean;
  created_at: string;
}

// Tipo para los resultados de laboratorio
interface LabResult {
  id: string;
  order_detail_id: string;
  parameter_id: string | null;
  value_text: string | null;
  notes: string | null;
  created_at: string;
}

export default async function LabOrderPrintPage({ params }: PrintPageProps) {
  const { id } = await params;
  const order = await getLabOrderById(id);

  if (!order) {
    notFound();
  }

  // Obtener datos del paciente
  const patientName = order.patients 
    ? `${order.patients.first_name} ${order.patients.last_name}` 
    : 'Sin nombre';
  const patientPhone = order.patients?.phone || '-';
  const patientDocument = order.patients?.document_number || '-';
  const patientAge = order.patients?.birth_date 
    ? Math.floor((new Date().getTime() - new Date(order.patients.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : '-';

  // Obtener nombre del doctor
  const doctorName = order.profiles?.full_name || '-';

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white print:p-0">
      {/* Encabezado */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RESULTADOS DE LABORATORIO</h1>
            <p className="text-sm text-gray-600 mt-1">Centro Médico</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">Orden #{order.order_number}</p>
            <p className="text-sm text-gray-600">
              Fecha: {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Información del Paciente */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-700 border-b border-gray-300 pb-1 mb-3">
          INFORMACIÓN DEL PACIENTE
        </h2>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Nombre:</p>
            <p className="font-medium">{patientName}</p>
          </div>
          <div>
            <p className="text-gray-600">Documento:</p>
            <p className="font-medium">{patientDocument}</p>
          </div>
          <div>
            <p className="text-gray-600">Edad:</p>
            <p className="font-medium">{patientAge} años</p>
          </div>
          <div>
            <p className="text-gray-600">Teléfono:</p>
            <p className="font-medium">{patientPhone}</p>
          </div>
          <div>
            <p className="text-gray-600">Médico Solicitante:</p>
            <p className="font-medium">{doctorName}</p>
          </div>
          <div>
            <p className="text-gray-600">Fecha de Muestra:</p>
            <p className="font-medium">{formatDate(order.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Resultados de Pruebas */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-700 border-b border-gray-300 pb-1 mb-3">
          PRUEBAS REALIZADAS
        </h2>
        
        {order.lab_order_details && order.lab_order_details.length > 0 ? (
          <div className="space-y-6">
            {order.lab_order_details.map((detail) => {
              // Acceder a los datos del test
              const detailData = detail as unknown as Record<string, unknown>;
              const testsData = detailData.tests as Record<string, unknown> | undefined;
              const testName = (testsData?.name as string) || 'Prueba sin nombre';
              const testCode = (testsData?.code as string) || null;
              
              // Obtener parámetros
              const labParameters = testsData?.lab_parameters as LabParameterRow[] | undefined;
              const labResults = detailData.lab_results as LabResult[] | undefined;

              // Crear un mapa de resultados por parameter_id para fácil acceso
              const resultsMap = new Map<string, string>();
              if (labResults) {
                labResults.forEach(result => {
                  if (result.parameter_id && result.value_text) {
                    resultsMap.set(result.parameter_id, result.value_text);
                  }
                });
              }

              return (
                <div key={detail.id} className="border border-gray-300 rounded-lg p-4 break-inside-avoid">
                  <h3 className="font-bold text-gray-800 mb-3">
                    {testName}
                    {testCode && <span className="font-normal text-gray-500 ml-2">({testCode})</span>}
                  </h3>
                  
                  {labParameters && labParameters.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 font-semibold text-gray-700 w-1/3">Parámetro</th>
                          <th className="text-left py-2 font-semibold text-gray-700 w-1/6">Resultado</th>
                          <th className="text-left py-2 font-semibold text-gray-700 w-1/6">Unidad</th>
                          <th className="text-left py-2 font-semibold text-gray-700 w-1/3">Valor de Referencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labParameters
                          .filter(param => param.is_active)
                          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                          .map((param) => {
                            const resultValue = resultsMap.get(param.id) || '';
                            const isAbnormal = resultValue ? checkAbnormalValue(resultValue, param) : false;
                            const isCritical = resultValue ? checkCriticalValue(resultValue, param) : false;
                            
                            return (
                              <tr key={param.id} className="border-b border-gray-100 last:border-0">
                                <td className="py-2 font-medium text-gray-800">{param.name}</td>
                                <td className={`py-2 font-medium ${isCritical ? 'text-red-600 font-bold' : isAbnormal ? 'text-yellow-600' : 'text-gray-900'}`}>
                                  {resultValue || '-'}
                                  {isCritical && <span className="ml-1">***</span>}
                                  {isAbnormal && !isCritical && <span className="ml-1">*</span>}
                                </td>
                                <td className="py-2 text-gray-600">{param.unit || '-'}</td>
                                <td className="py-2 text-gray-600">
                                  {param.reference_text || (
                                    <>
                                      {param.reference_min || '-'} - {param.reference_max || '-'}
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 italic">No hay parámetros definidos</p>
                  )}
                  
                  {detailData.notes && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Observaciones:</span> {detailData.notes as string}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">No hay pruebas registradas</p>
        )}
      </div>

      {/* Notas Generales */}
      {order.notes && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 border-b border-gray-300 pb-1 mb-3">
            OBSERVACIONES GENERALES
          </h2>
          <p className="text-sm text-gray-700">{order.notes}</p>
        </div>
      )}

      {/* Notas sobre valores críticos */}
      <div className="mb-6 text-xs text-gray-500">
        <p>* Valor fuera del rango de referencia</p>
        <p>*** Valor crítico - Requiere atención médica inmediata</p>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-800 pt-4 mt-8">
        <div className="flex justify-between text-sm">
          <div>
            <p className="font-medium">Responsable del Laboratorio:</p>
            <p className="text-gray-600">{doctorName}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">Fecha de Impresión:</p>
            <p className="text-gray-600">{formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Este documento es un comprobante oficial de resultados de laboratorio.
        </p>
      </div>

      {/* Script para impresión automática */}
      <script dangerouslySetInnerHTML={{
        __html: `
          window.onload = function() {
            window.print();
          };
        `
      }} />
    </div>
  );
}

// Funciones auxiliares para verificar valores anormales y críticos
function checkAbnormalValue(value: string, param: LabParameterRow): boolean {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  
  const min = param.reference_min ? parseFloat(param.reference_min) : null;
  const max = param.reference_max ? parseFloat(param.reference_max) : null;
  
  if (min !== null && numValue < min) return true;
  if (max !== null && numValue > max) return true;
  
  return false;
}

function checkCriticalValue(value: string, param: LabParameterRow): boolean {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  
  const criticalMin = param.is_critical_below ? parseFloat(param.is_critical_below) : null;
  const criticalMax = param.is_critical_above ? parseFloat(param.is_critical_above) : null;
  
  if (criticalMin !== null && numValue < criticalMin) return true;
  if (criticalMax !== null && numValue > criticalMax) return true;
  
  return false;
}
