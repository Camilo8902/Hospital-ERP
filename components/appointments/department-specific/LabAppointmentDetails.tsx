'use client';

import { FlaskConical, Clock, AlertCircle, Calendar } from 'lucide-react';
import { LaboratoryDepartmentData } from '@/lib/types/department-data';

interface LabAppointmentDetailsProps {
  data: Record<string, unknown>;
}

const SAMPLE_TYPE_LABELS: Record<string, string> = {
  blood: 'Sangre',
  urine: 'Orina',
  stool: 'Heces',
  tissue: 'Tejido',
  cerebrospinal_fluid: 'Líquido Cefalorraquídeo',
  synovial_fluid: 'Líquido Sinovial',
  sputum: 'Esputo',
  other: 'Otro',
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  routine: { label: 'Routine', color: 'bg-blue-100 text-blue-700' },
  urgent: { label: 'Urgente', color: 'bg-amber-100 text-amber-700' },
  stat: { label: 'STAT', color: 'bg-red-100 text-red-700' },
};

export default function LabAppointmentDetails({ data }: LabAppointmentDetailsProps) {
  const labData = data as LaboratoryDepartmentData;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
          <FlaskConical className="w-4 h-4 text-teal-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium">Tipo de Muestra</p>
          <p className="text-sm font-medium text-gray-900">
            {SAMPLE_TYPE_LABELS[labData.sampleType] || labData.sampleType}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${PRIORITY_LABELS[labData.priority]?.color}`}>
          {PRIORITY_LABELS[labData.priority]?.label}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <FlaskConical className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium">Pruebas Solicitadas</p>
          <p className="text-sm font-medium text-gray-900">{labData.tests?.length || 0} prueba(s)</p>
        </div>
      </div>

      {labData.tests && labData.tests.length > 0 && (
        <div className="ml-11">
          <div className="space-y-1">
            {labData.tests.slice(0, 3).map((test, index) => (
              <div key={test.testId || index} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {test.testName}
              </div>
            ))}
            {labData.tests.length > 3 && (
              <p className="text-xs text-gray-500 mt-1">+{labData.tests.length - 3} más...</p>
            )}
          </div>
        </div>
      )}

      {labData.requiresFasting && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Preparacion</p>
            <p className="text-sm font-medium text-gray-900">
              Requiere ayuno de {labData.fastingHours || 8} horas
            </p>
          </div>
        </div>
      )}

      {labData.preparationInstructions && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 uppercase font-medium mb-1">Instrucciones</p>
          <p className="text-sm text-amber-800">{labData.preparationInstructions}</p>
        </div>
      )}

      {labData.orderNumber && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Orden #</p>
            <p className="text-sm font-medium text-gray-900">{labData.orderNumber}</p>
          </div>
        </div>
      )}
    </div>
  );
}
