'use client';

import { Scan, AlertTriangle, Calendar } from 'lucide-react';
import { ImagingDepartmentData } from '@/lib/types/department-data';

interface ImagingAppointmentDetailsProps {
  data: Record<string, unknown>;
}

const IMAGING_TYPE_LABELS: Record<string, string> = {
  xray: 'Rayos X',
  ultrasound: 'Ultrasonido',
  ct: 'TAC',
  mri: 'RMN',
  mammography: 'Mamografía',
  fluoroscopy: 'Fluoroscopía',
  angiography: 'Angiografía',
  bone_densitometry: 'Densitometría',
  pet_scan: 'PET Scan',
};

const BODY_PART_LABELS: Record<string, string> = {
  head: 'Cabeza',
  neck: 'Cuello',
  chest: 'Tórax',
  abdomen: 'Abdomen',
  pelvis: 'Pelvis',
  spine: 'Columna',
  upper_extremity: 'Extremidad Superior',
  lower_extremity: 'Extremidad Inferior',
  whole_body: 'Cuerpo Entero',
};

const CONTRAST_LABELS: Record<string, string> = {
  iodine: 'Yodo',
  gadolinium: 'Gadolinio',
  barium: 'Bario',
  none: 'Sin contraste',
};

export default function ImagingAppointmentDetails({ data }: ImagingAppointmentDetailsProps) {
  const imgData = data as ImagingDepartmentData;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Scan className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium">Tipo de Estudio</p>
          <p className="text-sm font-medium text-gray-900">
            {IMAGING_TYPE_LABELS[imgData.imagingType] || imgData.imagingType}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Scan className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium">Región</p>
          <p className="text-sm font-medium text-gray-900">
            {BODY_PART_LABELS[imgData.bodyPart] || imgData.bodyPart}
            {imgData.specificRegion && ` - ${imgData.specificRegion}`}
          </p>
        </div>
      </div>

      {imgData.contrastRequired && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Contraste</p>
            <p className="text-sm font-medium text-gray-900">
              {CONTRAST_LABELS[imgData.contrastType || 'none']}
              {imgData.contrastDose && ` (${imgData.contrastDose}ml)`}
            </p>
          </div>
        </div>
      )}

      {imgData.pregnancyRisk && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700 uppercase font-medium mb-1">⚠️ Riesgo de Embarazo</p>
          <p className="text-sm text-red-800">Posible embarazo. Verificar antes del procedimiento.</p>
        </div>
      )}

      {imgData.preProcedureInstructions && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 uppercase font-medium mb-1">Instrucciones Previas</p>
          <p className="text-sm text-blue-800">{imgData.preProcedureInstructions}</p>
        </div>
      )}

      {imgData.radiationDose && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Dosis de Radiación</p>
            <p className="text-sm font-medium text-gray-900">{imgData.radiationDose} mSv</p>
          </div>
        </div>
      )}

      {imgData.shotCount && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <Scan className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Placas/Shot</p>
            <p className="text-sm font-medium text-gray-900">{imgData.shotCount}</p>
          </div>
        </div>
      )}
    </div>
  );
}
