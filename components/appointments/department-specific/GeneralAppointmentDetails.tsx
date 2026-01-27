'use client';

import { Stethoscope, AlertCircle } from 'lucide-react';
import { DepartmentCode } from '@/lib/types/department-data';

interface GeneralAppointmentDetailsProps {
  data: Record<string, unknown>;
  department: DepartmentCode;
}

const DEPARTMENT_NAMES: Record<DepartmentCode, string> = {
  'MG': 'Medicina General',
  'CG': 'Cirugía',
  'CAR': 'Cardiología',
  'PED': 'Pediatría',
  'URG': 'Urgencias',
  'OFT': 'Oftalmología',
  'PSI': 'Psicología',
  'NUT': 'Nutrición',
  'FAR': 'Farmacia',
  'DER': 'Dermatología',
  'GIN': 'Ginecología',
  'FIS': 'Fisiatría',
  'FT': 'Fisioterapia',
  'LAB': 'Laboratorio',
  'RAD': 'Radiología',
};

export default function GeneralAppointmentDetails({ data, department }: GeneralAppointmentDetailsProps) {
  const deptData = data as Record<string, unknown>;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
          <Stethoscope className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium">Departamento</p>
          <p className="text-sm font-medium text-gray-900">{DEPARTMENT_NAMES[department] || department}</p>
        </div>
      </div>

      {(deptData.visitType as string) && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Tipo de Visita</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {String(deptData.visitType).replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      )}

      {(deptData.chiefComplaint as string) && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Motivo de Consulta</p>
          <p className="text-sm text-gray-700">{String(deptData.chiefComplaint)}</p>
        </div>
      )}

      {(deptData.severity as string) && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Severidad</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{String(deptData.severity)}</p>
          </div>
        </div>
      )}

      {(deptData.priority as string) && (
        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
          deptData.priority === 'emergency' ? 'bg-red-100 text-red-700' :
          deptData.priority === 'urgent' ? 'bg-amber-100 text-amber-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {String(deptData.priority).toUpperCase()}
        </div>
      )}
    </div>
  );
}
