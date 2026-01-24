'use client';

import { useState, useEffect } from 'react';
import { PhysiotherapyDepartmentData, PhysioSessionType, BodyRegion, TherapyTechnique } from '@/lib/types/department-data';

interface PhysioAppointmentFormProps {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const SESSION_TYPES: { value: PhysioSessionType; label: string }[] = [
  { value: 'initial_assessment', label: 'Evaluación Inicial' },
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'treatment', label: 'Tratamiento' },
  { value: 'reassessment', label: 'Reevaluación' },
  { value: 'electrotherapy', label: 'Electroterapia' },
  { value: 'hydrotherapy', label: 'Hidroterapia' },
  { value: 'manual_therapy', label: 'Terapia Manual' },
  { value: 'exercise_therapy', label: 'Ejercicio Terapéutico' },
];

const BODY_REGIONS: { value: BodyRegion; label: string }[] = [
  { value: 'cervical', label: 'Cervical' },
  { value: 'thoracic', label: 'Torácica' },
  { value: 'lumbar', label: 'Lumbar' },
  { value: 'sacral', label: 'Sacra' },
  { value: 'shoulder', label: 'Hombro' },
  { value: 'elbow', label: 'Codo' },
  { value: 'wrist', label: 'Muñeca' },
  { value: 'hand', label: 'Mano' },
  { value: 'hip', label: 'Cadera' },
  { value: 'knee', label: 'Rodilla' },
  { value: 'ankle', label: 'Tobillo' },
  { value: 'foot', label: 'Pie' },
  { value: 'whole_body', label: 'Cuerpo Entero' },
];

const TECHNIQUES: { value: TherapyTechnique; label: string }[] = [
  { value: 'massage', label: 'Masaje' },
  { value: 'mobilization', label: 'Movilización' },
  { value: 'manipulation', label: 'Manipulación' },
  { value: 'stretching', label: 'Estiramiento' },
  { value: 'strengthening', label: 'Fortalecimiento' },
  { value: 'pneumatic_compression', label: 'Compresión Neumática' },
  { value: 'electrotherapy', label: 'Electroterapia' },
  { value: 'ultrasound', label: 'Ultrasonido' },
  { value: 'laser', label: 'Láser' },
  { value: 'heat_therapy', label: 'Termoterapia' },
  { value: 'cold_therapy', label: 'Crioterapia' },
  { value: 'traction', label: 'Tracción' },
  { value: 'taping', label: 'Vendaje Funcional' },
  { value: 'myofascial_release', label: 'Liberación Miofascial' },
  { value: 'trigger_point', label: 'Puntos Gatillo' },
];

export default function PhysioAppointmentForm({ data, onChange }: PhysioAppointmentFormProps) {
  const physioData = data as PhysiotherapyDepartmentData;
  const [formData, setFormData] = useState<PhysiotherapyDepartmentData>({
    sessionType: 'treatment',
    bodyRegion: [],
    ...physioData,
  });

  useEffect(() => {
    setFormData({ sessionType: 'treatment', bodyRegion: [], ...physioData });
  }, [physioData]);

  const updateField = (field: keyof PhysiotherapyDepartmentData, value: unknown) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const toggleBodyRegion = (region: BodyRegion) => {
    const current = formData.bodyRegion || [];
    const updated = current.includes(region)
      ? current.filter(r => r !== region)
      : [...current, region];
    updateField('bodyRegion', updated);
  };

  const toggleTechnique = (technique: TherapyTechnique) => {
    const current = formData.techniques || [];
    const updated = current.includes(technique)
      ? current.filter(t => t !== technique)
      : [...current, technique];
    updateField('techniques', updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="label mb-2">Tipo de Sesión *</label>
        <select
          value={formData.sessionType}
          onChange={(e) => updateField('sessionType', e.target.value)}
          className="input"
        >
          {SESSION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label mb-2">Región(es) Corporal(es) *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BODY_REGIONS.map((region) => (
            <label
              key={region.value}
              className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                formData.bodyRegion?.includes(region.value)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.bodyRegion?.includes(region.value) || false}
                onChange={() => toggleBodyRegion(region.value)}
                className="sr-only"
              />
              <span className="text-sm">{region.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label mb-2">Nivel de Dolor (0-10)</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="10"
            value={formData.painLevel || 0}
            onChange={(e) => updateField('painLevel', parseInt(e.target.value))}
            className="flex-1"
          />
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-lg">
            {formData.painLevel || 0}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Sin dolor</span>
          <span>Dolor máximo</span>
        </div>
      </div>

      <div>
        <label className="label mb-2">Técnicas a Aplicar</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TECHNIQUES.map((technique) => (
            <label
              key={technique.value}
              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${
                formData.techniques?.includes(technique.value)
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.techniques?.includes(technique.value) || false}
                onChange={() => toggleTechnique(technique.value)}
                className="sr-only"
              />
              <span>{technique.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label mb-2">Número de Sesión</label>
          <input
            type="number"
            min="1"
            value={formData.sessionNumber || ''}
            onChange={(e) => updateField('sessionNumber', parseInt(e.target.value))}
            className="input"
            placeholder="Ej: 1, 2, 3..."
          />
        </div>
        <div>
          <label className="label mb-2">Duración Estimada (min)</label>
          <select
            value={formData.estimatedDuration || 45}
            onChange={(e) => updateField('estimatedDuration', parseInt(e.target.value))}
            className="input"
          >
            <option value="30">30 minutos</option>
            <option value="45">45 minutos</option>
            <option value="60">60 minutos</option>
            <option value="90">90 minutos</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label mb-2">Notas del Terapeuta</label>
        <textarea
          value={formData.therapistNotes || ''}
          onChange={(e) => updateField('therapistNotes', e.target.value)}
          className="input min-h-[80px]"
          placeholder="Observaciones específicas para esta sesión..."
        />
      </div>
    </div>
  );
}
