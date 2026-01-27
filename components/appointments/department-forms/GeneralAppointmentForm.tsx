'use client';

import { useState, useEffect } from 'react';
import { DepartmentCode, BaseDepartmentData } from '@/lib/types/department-data';

interface GeneralAppointmentFormProps {
  data: Record<string, unknown>;
  department: DepartmentCode;
  onChange: (data: Record<string, unknown>) => void;
}

const VISIT_TYPES: Record<string, { value: string; label: string }[]> = {
  MG: [
    { value: 'new_patient', label: 'Nuevo Paciente' },
    { value: 'follow_up', label: 'Seguimiento' },
    { value: 'preventive', label: 'Preventivo' },
    { value: 'acute_illness', label: 'Enfermedad Aguda' },
    { value: 'chronic_disease', label: 'Enfermedad Crónica' },
  ],
  CG: [
    { value: 'minor', label: 'Cirugía Menor' },
    { value: 'major', label: 'Cirugía Mayor' },
    { value: 'ambulatory', label: 'Ambulatoria' },
    { value: 'emergency', label: 'Emergencia Quirúrgica' },
  ],
  CAR: [
    { value: 'ecg', label: 'ECG' },
    { value: 'echocardiogram', label: 'Ecocardiograma' },
    { value: 'stress_test', label: 'Prueba de Esfuerzo' },
    { value: 'holter', label: 'Holter' },
  ],
  PED: [
    { value: 'well_child_check', label: 'Control Niño Sano' },
    { value: 'vaccination', label: 'Vacunación' },
    { value: 'sick_visit', label: 'Enfermedad' },
    { value: 'developmental_screening', label: 'Desarrollo' },
  ],
  URG: [
    { value: 'resuscitation', label: 'Reanimación' },
    { value: 'emergency', label: 'Emergencia' },
    { value: 'urgent', label: 'Urgente' },
    { value: 'less_urgent', label: 'Menos Urgente' },
  ],
};

const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Leve' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'severe', label: 'Severa' },
];

const PRIORITIES = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'emergency', label: 'Emergencia' },
];

export default function GeneralAppointmentForm({ data, department, onChange }: GeneralAppointmentFormProps) {
  const deptData = data as BaseDepartmentData;
  const visitTypes = VISIT_TYPES[department] || VISIT_TYPES.MG;
  
  const [formData, setFormData] = useState<Record<string, unknown>>({
    visitType: visitTypes[0]?.value,
    priority: 'routine',
    ...deptData,
  });

  useEffect(() => {
    setFormData({ visitType: visitTypes[0]?.value, priority: 'routine', ...deptData });
  }, [deptData, visitTypes]);

  const updateField = (field: string, value: unknown) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label mb-2">Tipo de Visita/Cita *</label>
          <select
            value={formData.visitType as string || ''}
            onChange={(e) => updateField('visitType', e.target.value)}
            className="input"
          >
            {visitTypes.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-2">Prioridad</label>
          <select
            value={formData.priority as string || 'routine'}
            onChange={(e) => updateField('priority', e.target.value)}
            className="input"
          >
            {PRIORITIES.map((priority) => (
              <option key={priority.value} value={priority.value}>{priority.label}</option>
            ))}
          </select>
        </div>
      </div>

      {department === 'MG' && (
        <>
          <div>
            <label className="label mb-2">Motivo de Consulta</label>
            <input
              type="text"
              value={(formData.chiefComplaint as string) || ''}
              onChange={(e) => updateField('chiefComplaint', e.target.value)}
              className="input"
              placeholder="Ej: Dolor de cabeza, fiebre, chequeo anual..."
            />
          </div>

          <div>
            <label className="label mb-2">Severidad</label>
            <select
              value={formData.severity as string || ''}
              onChange={(e) => updateField('severity', e.target.value)}
              className="input"
            >
              <option value="">Seleccionar...</option>
              {SEVERITY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {department === 'URG' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Nivel de Triage (ESI)</h4>
          <p className="text-sm text-red-700">
            El nivel de triage será asignado por el personal de enfermería al arrival del paciente.
          </p>
        </div>
      )}

      <div>
        <label className="label mb-2">Notas Adicionales</label>
        <textarea
          value={(formData.notes as string) || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          className="input min-h-[80px]"
          placeholder="Notas específicas para esta cita..."
        />
      </div>
    </div>
  );
}
