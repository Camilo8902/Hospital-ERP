'use client';

import { Activity, Target, Zap, Clock } from 'lucide-react';
import { PhysiotherapyDepartmentData } from '@/lib/types/department-data';

interface PhysioAppointmentDetailsProps {
  data: Record<string, unknown>;
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  initial_assessment: 'Evaluación Inicial',
  follow_up: 'Seguimiento',
  treatment: 'Tratamiento',
  reassessment: 'Reevaluación',
  electrotherapy: 'Electroterapia',
  hydrotherapy: 'Hidroterapia',
  manual_therapy: 'Terapia Manual',
  exercise_therapy: 'Ejercicio Terapéutico',
};

const BODY_REGION_LABELS: Record<string, string> = {
  cervical: 'Cervical',
  thoracic: 'Torácica',
  lumbar: 'Lumbar',
  sacral: 'Sacra',
  shoulder: 'Hombro',
  elbow: 'Codo',
  wrist: 'Muñeca',
  hand: 'Mano',
  hip: 'Cadera',
  knee: 'Rodilla',
  ankle: 'Tobillo',
  foot: 'Pie',
  whole_body: 'Cuerpo Entero',
};

const TECHNIQUE_LABELS: Record<string, string> = {
  massage: 'Masaje',
  mobilization: 'Movilización',
  manipulation: 'Manipulación',
  stretching: 'Estiramiento',
  strengthening: 'Fortalecimiento',
  pneumatic_compression: 'Compresión Neumática',
  electrotherapy: 'Electroterapia',
  ultrasound: 'Ultrasonido',
  laser: 'Láser',
  heat_therapy: 'Termoterapia',
  cold_therapy: 'Crioterapia',
  traction: 'Tracción',
  taping: 'Vendaje Funcional',
  myofascial_release: 'Liberación Miofascial',
  trigger_point: 'Puntos Gatillo',
};

export default function PhysioAppointmentDetails({ data }: PhysioAppointmentDetailsProps) {
  const physioData = data as PhysiotherapyDepartmentData;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <Target className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium">Tipo de Sesión</p>
          <p className="text-sm font-medium text-gray-900">
            {SESSION_TYPE_LABELS[physioData.sessionType] || physioData.sessionType}
          </p>
        </div>
      </div>

      {physioData.bodyRegion && physioData.bodyRegion.length > 0 && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Región(es)</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {physioData.bodyRegion.map((region) => (
                <span key={region} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {BODY_REGION_LABELS[region] || region}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {physioData.painLevel !== undefined && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Zap className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Nivel de Dolor</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 transition-all" style={{ width: `${(physioData.painLevel / 10) * 100}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-900">{physioData.painLevel}/10</span>
            </div>
          </div>
        </div>
      )}

      {physioData.techniques && physioData.techniques.length > 0 && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <Activity className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Técnicas</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {physioData.techniques.map((technique) => (
                <span key={technique} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                  {TECHNIQUE_LABELS[technique] || technique}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {physioData.sessionNumber && (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Sesión #</p>
            <p className="text-sm font-medium text-gray-900">{physioData.sessionNumber}</p>
          </div>
        </div>
      )}

      {physioData.therapistNotes && (
        <div className="mt-3 p-3 bg-white/50 rounded-lg">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Notas del Terapeuta</p>
          <p className="text-sm text-gray-700">{physioData.therapistNotes}</p>
        </div>
      )}

      {(physioData.vasScore || physioData.dashScore || physioData.oswestryScore) && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {physioData.vasScore !== undefined && (
            <div className="p-2 bg-white/50 rounded-lg text-center">
              <p className="text-xs text-gray-500">VAS</p>
              <p className="text-lg font-bold text-gray-900">{physioData.vasScore}</p>
            </div>
          )}
          {physioData.dashScore !== undefined && (
            <div className="p-2 bg-white/50 rounded-lg text-center">
              <p className="text-xs text-gray-500">DASH</p>
              <p className="text-lg font-bold text-gray-900">{physioData.dashScore}</p>
            </div>
          )}
          {physioData.oswestryScore !== undefined && (
            <div className="p-2 bg-white/50 rounded-lg text-center">
              <p className="text-xs text-gray-500">Oswestry</p>
              <p className="text-lg font-bold text-gray-900">{physioData.oswestryScore}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
