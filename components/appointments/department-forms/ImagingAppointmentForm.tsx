'use client';

import { useState, useEffect } from 'react';
import { ImagingDepartmentData, ImagingType, BodyPart } from '@/lib/types/department-data';

interface ImagingAppointmentFormProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const IMAGING_TYPES: { value: ImagingType; label: string }[] = [
  { value: 'xray', label: 'Rayos X' },
  { value: 'ultrasound', label: 'Ultrasonido' },
  { value: 'ct', label: 'TAC (Scanner)' },
  { value: 'mri', label: 'RMN (Resonancia)' },
  { value: 'mammography', label: 'Mamografía' },
  { value: 'fluoroscopy', label: 'Fluoroscopía' },
  { value: 'angiography', label: 'Angiografía' },
  { value: 'bone_densitometry', label: 'Densitometría Ósea' },
  { value: 'pet_scan', label: 'PET Scan' },
];

const BODY_PARTS: { value: BodyPart; label: string }[] = [
  { value: 'head', label: 'Cabeza' },
  { value: 'neck', label: 'Cuello' },
  { value: 'chest', label: 'Tórax' },
  { value: 'abdomen', label: 'Abdomen' },
  { value: 'pelvis', label: 'Pelvis' },
  { value: 'spine', label: 'Columna' },
  { value: 'upper_extremity', label: 'Extremidad Superior' },
  { value: 'lower_extremity', label: 'Extremidad Inferior' },
  { value: 'whole_body', label: 'Cuerpo Entero' },
];

const CONTRAST_TYPES: { value: string; label: string }[] = [
  { value: 'none', label: 'Sin contraste' },
  { value: 'iodine', label: 'Contraste yodado' },
  { value: 'gadolinium', label: 'Gadolinio (RMN)' },
  { value: 'barium', label: 'Bario' },
];

export default function ImagingAppointmentForm({ data, onChange }: ImagingAppointmentFormProps) {
  const imgData = data as ImagingDepartmentData;
  const [formData, setFormData] = useState<ImagingDepartmentData>({
    imagingType: 'xray',
    bodyPart: 'chest',
    contrastRequired: false,
    ...imgData,
  });

  useEffect(() => {
    setFormData({ imagingType: 'xray', bodyPart: 'chest', contrastRequired: false, ...imgData });
  }, [imgData]);

  const updateField = (field: keyof ImagingDepartmentData, value: unknown) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label mb-2">Tipo de Estudio *</label>
          <select
            value={formData.imagingType}
            onChange={(e) => updateField('imagingType', e.target.value)}
            className="input"
          >
            {IMAGING_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-2">Región Anatómica *</label>
          <select
            value={formData.bodyPart}
            onChange={(e) => updateField('bodyPart', e.target.value)}
            className="input"
          >
            {BODY_PARTS.map((part) => (
              <option key={part.value} value={part.value}>{part.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label mb-2">Región Específica</label>
        <input
          type="text"
          value={formData.specificRegion || ''}
          onChange={(e) => updateField('specificRegion', e.target.value)}
          className="input"
          placeholder="Ej: Rodilla derecha, columna lumbar, tórax AP"
        />
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.contrastRequired || false}
            onChange={(e) => updateField('contrastRequired', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
          />
          <span className="font-medium">Requiere contraste</span>
        </label>

        {formData.contrastRequired && (
          <div className="mt-4 ml-8 grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-2">Tipo de contraste</label>
              <select
                value={formData.contrastType || 'iodine'}
                onChange={(e) => updateField('contrastType', e.target.value)}
                className="input"
              >
                {CONTRAST_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-2">Dosis (ml)</label>
              <input
                type="number"
                value={formData.contrastDose || ''}
                onChange={(e) => updateField('contrastDose', parseInt(e.target.value))}
                className="input"
                placeholder="100"
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.pregnancyRisk || false}
            onChange={(e) => updateField('pregnancyRisk', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
          />
          <span className="font-medium">⚠️ Posible embarazo (mujeres en edad fértil)</span>
        </label>
        
        {formData.pregnancyRisk && (
          <div className="mt-4 ml-8">
            <label className="label mb-2">Última menstruación</label>
            <input
              type="date"
              value={formData.lastMenstrualPeriod || ''}
              onChange={(e) => updateField('lastMenstrualPeriod', e.target.value)}
              className="input max-w-xs"
            />
          </div>
        )}
      </div>

      <div>
        <label className="label mb-2">Instrucciones Previas al Procedimiento</label>
        <textarea
          value={formData.preProcedureInstructions || ''}
          onChange={(e) => updateField('preProcedureInstructions', e.target.value)}
          className="input min-h-[80px]"
          placeholder="Ej: No comer 4h antes, suspender ciertos medicamentos, traer estudios previos, etc."
        />
      </div>
    </div>
  );
}
