'use client';

import { useState, useEffect } from 'react';
import { LaboratoryDepartmentData, LabSampleType, LabPriority } from '@/lib/types/department-data';

interface LabAppointmentFormProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const SAMPLE_TYPES: { value: LabSampleType; label: string }[] = [
  { value: 'blood', label: 'Sangre' },
  { value: 'urine', label: 'Orina' },
  { value: 'stool', label: 'Heces' },
  { value: 'tissue', label: 'Tejido' },
  { value: 'cerebrospinal_fluid', label: 'Líquido Cefalorraquídeo' },
  { value: 'synovial_fluid', label: 'Líquido Sinovial' },
  { value: 'sputum', label: 'Esputo' },
  { value: 'other', label: 'Otro' },
];

const PRIORITIES: { value: LabPriority; label: string }[] = [
  { value: 'routine', label: 'Routine (Normal)' },
  { value: 'urgent', label: 'Urgente (24-48h)' },
  { value: 'stat', label: 'STAT (Inmediato)' },
];

export default function LabAppointmentForm({ data, onChange }: LabAppointmentFormProps) {
  const labData = data as LaboratoryDepartmentData;
  const [formData, setFormData] = useState<LaboratoryDepartmentData>({
    ...labData,
    sampleType: labData.sampleType || 'blood',
    tests: labData.tests || [],
    priority: labData.priority || 'routine',
  });

  useEffect(() => {
    setFormData({ ...labData });
  }, [labData]);

  const updateField = (field: keyof LaboratoryDepartmentData, value: unknown) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const addTest = () => {
    const currentTests = formData.tests || [];
    const newTest = { testId: '', testName: '' };
    updateField('tests', [...currentTests, newTest]);
  };

  const updateTest = (index: number, field: string, value: string) => {
    const currentTests = [...(formData.tests || [])];
    currentTests[index] = { ...currentTests[index], [field]: value };
    updateField('tests', currentTests);
  };

  const removeTest = (index: number) => {
    const currentTests = [...(formData.tests || [])];
    currentTests.splice(index, 1);
    updateField('tests', currentTests);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label mb-2">Tipo de Muestra *</label>
          <select
            value={formData.sampleType}
            onChange={(e) => updateField('sampleType', e.target.value)}
            className="input"
          >
            {SAMPLE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-2">Prioridad *</label>
          <select
            value={formData.priority}
            onChange={(e) => updateField('priority', e.target.value)}
            className="input"
          >
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Pruebas Solicitadas</label>
          <button type="button" onClick={addTest} className="btn-secondary btn-sm">
            + Agregar Prueba
          </button>
        </div>
        
        {(formData.tests || []).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
            No hay pruebas agregadas. Haz clic en "Agregar Prueba" para comenzar.
          </p>
        ) : (
          <div className="space-y-3">
            {(formData.tests || []).map((test, index) => (
              <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={test.testId}
                    onChange={(e) => updateTest(index, 'testId', e.target.value)}
                    className="input"
                    placeholder="ID de prueba"
                  />
                  <input
                    type="text"
                    value={test.testName}
                    onChange={(e) => updateTest(index, 'testName', e.target.value)}
                    className="input"
                    placeholder="Nombre de la prueba"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeTest(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label mb-2">¿Requiere ayuno?</label>
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="fasting"
                checked={formData.requiresFasting === true}
                onChange={() => updateField('requiresFasting', true)}
              />
              <span className="text-sm">Sí</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="fasting"
                checked={formData.requiresFasting !== true}
                onChange={() => updateField('requiresFasting', false)}
              />
              <span className="text-sm">No</span>
            </label>
          </div>
        </div>
        
        {formData.requiresFasting && (
          <div>
            <label className="label mb-2">Horas de ayuno</label>
            <input
              type="number"
              value={formData.fastingHours || 8}
              onChange={(e) => updateField('fastingHours', parseInt(e.target.value))}
              className="input"
              min="4"
              max="24"
            />
          </div>
        )}
      </div>

      <div>
        <label className="label mb-2">Instrucciones de Preparación</label>
        <textarea
          value={formData.preparationInstructions || ''}
          onChange={(e) => updateField('preparationInstructions', e.target.value)}
          className="input min-h-[80px]"
          placeholder="Ej: No comer alimentos grasos 24h antes, tomar agua normalmente, etc."
        />
      </div>
    </div>
  );
}
