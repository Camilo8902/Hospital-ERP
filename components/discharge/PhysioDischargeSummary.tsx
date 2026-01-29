'use client';

import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  User,
  Activity,
  TrendingDown,
  Star
} from 'lucide-react';

interface DischargeSummaryData {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    dni: string;
    date_of_birth?: string;
  };
  plan: {
    id: string;
    start_date: string;
    end_date: string;
    diagnosis: string;
    treatment_type: string;
  };
  evaluation: {
    id: string;
    initial_vas: number;
    initial_rom_flexion?: number;
    initial_strength?: number;
    objectives: string[];
  };
  sessions: {
    total: number;
    attended: number;
    cancelled: number;
    missed: number;
  };
  finalAssessment: {
    final_vas: number;
    final_rom_flexion?: number;
    final_strength?: number;
    objectives_achieved: string[];
    objectives_not_achieved: string[];
  };
  recommendations: {
    home_exercises: string[];
    lifestyle_changes: string[];
    follow_up_required: boolean;
    follow_up_date?: string;
    warnings: string[];
  };
  physiotherapist: {
    name: string;
    license: string;
    signature_date: string;
  };
}

interface PhysioDischargeSummaryProps {
  data: DischargeSummaryData;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function PhysioDischargeSummary({ data, onPrint, onDownload }: PhysioDischargeSummaryProps) {
  const [showDetails, setShowDetails] = useState(true);

  // Calculate metrics
  const painImprovement = data.evaluation.initial_vas - data.finalAssessment.final_vas;
  const painImprovementPercent = Math.round((painImprovement / data.evaluation.initial_vas) * 100);
  const objectivesAchieved = data.finalAssessment.objectives_achieved.length;
  const objectivesTotal = data.evaluation.objectives.length;
  const objectivesPercent = Math.round((objectivesAchieved / objectivesTotal) * 100);
  const attendanceRate = Math.round((data.sessions.attended / data.sessions.total) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onPrint}
          className="btn-secondary flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
        <button
          onClick={onDownload}
          className="btn-primary flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
      </div>

      {/* Summary Document */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Resumen de Alta</h1>
              <p className="text-purple-100 mt-1">Tratamiento de Fisioterapia</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-100">Fecha de Alta</p>
              <p className="text-xl font-semibold">
                {new Date(data.physiotherapist.signature_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-purple-600" />
            Datos del Paciente
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="font-medium">{data.patient.first_name} {data.patient.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">DNI</p>
              <p className="font-medium">{data.patient.dni}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha Inicio</p>
              <p className="font-medium">{new Date(data.plan.start_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha Alta</p>
              <p className="font-medium">{new Date(data.physiotherapist.signature_date).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Treatment Summary */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-purple-600" />
            Resumen del Tratamiento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Diagnóstico Principal</p>
              <p className="font-medium">{data.plan.diagnosis}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Tipo de Tratamiento</p>
              <p className="font-medium">{data.plan.treatment_type}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Duración</p>
              <p className="font-medium">
                {Math.round(
                  (new Date(data.physiotherapist.signature_date).getTime() - 
                   new Date(data.plan.start_date).getTime()) / (1000 * 60 * 60 * 24)
                )} días
              </p>
            </div>
          </div>
        </div>

        {/* Session Statistics */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            Asistencia a Sesiones
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{data.sessions.attended}</p>
              <p className="text-sm text-green-700">Asistidas</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{data.sessions.cancelled}</p>
              <p className="text-sm text-yellow-700">Canceladas</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{data.sessions.missed}</p>
              <p className="text-sm text-red-700">No Asistidas</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{attendanceRate}%</p>
              <p className="text-sm text-purple-700">Tasa de Asistencia</p>
            </div>
          </div>
        </div>

        {/* Clinical Outcomes */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-purple-600" />
            Resultados Clínicos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Pain */}
            <div className="text-center">
              <div className="relative inline-block">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={painImprovement > 0 ? '#22c55e' : '#ef4444'}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(painImprovementPercent / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{painImprovementPercent}%</span>
                </div>
              </div>
              <p className="mt-2 font-medium">Reducción del Dolor</p>
              <p className="text-sm text-gray-500">
                {data.evaluation.initial_vas} → {data.finalAssessment.final_vas} (VAS)
              </p>
            </div>

            {/* Objectives */}
            <div className="text-center">
              <div className="relative inline-block">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#8b5cf6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(objectivesPercent / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{objectivesPercent}%</span>
                </div>
              </div>
              <p className="mt-2 font-medium">Objetivos Cumplidos</p>
              <p className="text-sm text-gray-500">
                {objectivesAchieved} de {objectivesTotal} objetivos
              </p>
            </div>

            {/* Satisfaction */}
            <div className="text-center">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 ${
                      star <= Math.round(objectivesPercent / 20)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 font-medium">Calificación General</p>
              <p className="text-sm text-gray-500">
                {objectivesPercent >= 80 ? 'Excelente' : 
                 objectivesPercent >= 60 ? 'Bueno' : 
                 objectivesPercent >= 40 ? 'Regular' : 'Necesita Mejora'}
              </p>
            </div>
          </div>

          {/* Objectives Detail */}
          {showDetails && (
            <div className="space-y-4 mt-6">
              <div>
                <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Objetivos Cumplidos
                </h3>
                <ul className="space-y-1">
                  {data.finalAssessment.objectives_achieved.map((obj, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
                        {i + 1}
                      </span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              {data.finalAssessment.objectives_not_achieved.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    Objetivos No Cumplidos
                  </h3>
                  <ul className="space-y-1">
                    {data.finalAssessment.objectives_not_achieved.map((obj, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">
                          {i + 1}
                        </span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recomendaciones Post-Alta
          </h2>
          
          <div className="space-y-4">
            {data.recommendations.home_exercises.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Ejercicios en Casa</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {data.recommendations.home_exercises.map((exercise, i) => (
                    <li key={i}>{exercise}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.recommendations.lifestyle_changes.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Cambios de Estilo de Vida</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {data.recommendations.lifestyle_changes.map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.recommendations.warnings.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">⚠️ Advertencias</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                  {data.recommendations.warnings.map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {data.recommendations.follow_up_required && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">📅 Seguimiento Requerido</h3>
                <p className="text-sm text-blue-700">
                  Se recomienda una cita de seguimiento para el{' '}
                  {data.recommendations.follow_up_date 
                    ? new Date(data.recommendations.follow_up_date).toLocaleDateString()
                    : 'próximo mes'}
                  .
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Signature */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                Fisioterapeuta: {data.physiotherapist.name}
              </p>
              <p className="text-sm text-gray-500">
                Cédula Profesional: {data.physiotherapist.license}
              </p>
            </div>
            <div className="text-right">
              <div className="border-b border-gray-400 w-48 h-12 mb-2"></div>
              <p className="text-xs text-gray-500">Firma y Sello</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
