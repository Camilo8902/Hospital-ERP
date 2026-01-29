'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Edit, 
  Printer, 
  Calendar, 
  User,
  Activity,
  Heart,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface PhysioEvaluation {
  id: string;
  patient_id: string;
  therapist_id: string;
  chief_complaint: string;
  pain_location: string;
  pain_duration: string;
  pain_type: string;
  pain_scale_baseline: number;
  pain_characteristics: string;
  surgical_history: string;
  traumatic_history: string;
  medical_history: string;
  family_history: string;
  allergies: string[];
  contraindications: string[];
  postural_evaluation: string;
  physical_examination: string;
  neurological_screening: string;
  special_tests: string;
  rom_measurements: any[];
  strength_grade: any[];
  vas_score: number;
  oswestry_score: number;
  dash_score: number;
  womac_score: number;
  roland_morris_score: number;
  clinical_diagnosis: string;
  functional_limitations: string;
  short_term_goals: string[];
  long_term_goals: string[];
  patient_expectations: string;
  informed_consent_signed: boolean;
  informed_consent_date: string;
  status: string;
  created_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    dni: number;
    phone: string;
  };
}

export default function PhysioEvaluationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const evaluationId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<PhysioEvaluation | null>(null);

  useEffect(() => {
    fetchEvaluation();
  }, [evaluationId]);

  const fetchEvaluation = async () => {
    try {
      const { data, error } = await supabase
        .from('physio_medical_records')
        .select(`
          *,
          patient:patients!patient_id (
            id,
            first_name,
            last_name,
            dni,
            phone
          )
        `)
        .eq('id', evaluationId)
        .single();

      if (error) throw error;
      setEvaluation(data);
    } catch (err) {
      console.error('Error fetching evaluation:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar la evaluación');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando evaluación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-500 mb-4">{error || 'Evaluación no encontrada'}</p>
            <Link href="/dashboard/physiotherapy" className="btn-primary">
              Volver a Fisioterapia
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/physiotherapy" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Evaluación de Fisioterapia</h1>
            <p className="text-gray-500 mt-1">ID: {evaluation.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <Link href={`/dashboard/physiotherapy/evaluation/${evaluation.id}/edit`} className="btn-primary flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          evaluation.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {evaluation.status === 'active' ? 'Activo' : evaluation.status}
        </span>
        {evaluation.informed_consent_signed && (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Consentimiento OK
          </span>
        )}
      </div>

      {/* Patient Info */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Datos del Paciente
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nombre</p>
              <p className="font-medium">{evaluation.patient?.first_name} {evaluation.patient?.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">DNI</p>
              <p className="font-medium">{evaluation.patient?.dni}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium">{evaluation.patient?.phone || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Complaint */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Motivo de Consulta
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Dolor (0-10)</p>
              <p className="font-medium text-lg">{evaluation.pain_scale_baseline}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ubicación</p>
              <p className="font-medium">{evaluation.pain_location || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duración</p>
              <p className="font-medium">{evaluation.pain_duration || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tipo</p>
              <p className="font-medium">{evaluation.pain_type || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Descripción</p>
            <p className="text-gray-900">{evaluation.chief_complaint}</p>
          </div>
          {evaluation.pain_characteristics && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-1">Características adicionales</p>
              <p className="text-gray-900">{evaluation.pain_characteristics}</p>
            </div>
          )}
        </div>
      </div>

      {/* Medical History */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-purple-600" />
            Antecedentes
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Quirúrgicos</p>
              <p className="text-gray-900">{evaluation.surgical_history || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Traumáticos</p>
              <p className="text-gray-900">{evaluation.traumatic_history || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Médicos</p>
              <p className="text-gray-900">{evaluation.medical_history || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Familiares</p>
              <p className="text-gray-900">{evaluation.family_history || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Alergias</p>
              <p className="text-gray-900">
                {evaluation.allergies 
                  ? (Array.isArray(evaluation.allergies) 
                      ? evaluation.allergies.join(', ') 
                      : JSON.stringify(evaluation.allergies))
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Contraindicaciones</p>
              <p className="text-gray-900">
                {evaluation.contraindications 
                  ? (Array.isArray(evaluation.contraindications) 
                      ? evaluation.contraindications.join(', ') 
                      : JSON.stringify(evaluation.contraindications))
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Exam */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Exploración Física
          </h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Evaluación postural</p>
            <p className="text-gray-900">{evaluation.postural_evaluation || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Exploración física</p>
            <p className="text-gray-900">{evaluation.physical_examination || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Screening neurológico</p>
            <p className="text-gray-900">{evaluation.neurological_screening || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Tests especiales</p>
            <p className="text-gray-900">{evaluation.special_tests || '-'}</p>
          </div>
        </div>
      </div>

      {/* ROM Measurements */}
      {Array.isArray(evaluation.rom_measurements) && evaluation.rom_measurements.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Rango de Movimiento</h2>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Articulación</th>
                  <th className="px-4 py-2 text-left">Movimiento</th>
                  <th className="px-4 py-2 text-left">Derecha</th>
                  <th className="px-4 py-2 text-left">Izquierda</th>
                  <th className="px-4 py-2 text-left">Normal</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.rom_measurements.map((rom: any, index: number) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{rom.joint || '-'}</td>
                    <td className="px-4 py-2">{rom.movement || '-'}</td>
                    <td className="px-4 py-2">{rom.right_side || '-'}</td>
                    <td className="px-4 py-2">{rom.left_side || '-'}</td>
                    <td className="px-4 py-2">{rom.normal || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strength Grade */}
      {Array.isArray(evaluation.strength_grade) && evaluation.strength_grade.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Fuerza Muscular</h2>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Grupo Muscular</th>
                  <th className="px-4 py-2 text-left">Derecha</th>
                  <th className="px-4 py-2 text-left">Izquierda</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.strength_grade.map((sg: any, index: number) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{sg.muscle_group || '-'}</td>
                    <td className="px-4 py-2">{sg.right_side ?? '-'}</td>
                    <td className="px-4 py-2">{sg.left_side ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Diagnosis */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Diagnóstico y Plan</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Diagnóstico clínico</p>
            <p className="text-gray-900 font-medium">{evaluation.clinical_diagnosis || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Limitaciones funcionales</p>
            <p className="text-gray-900">{evaluation.functional_limitations || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Objetivos a corto plazo</p>
            <ul className="list-disc list-inside text-gray-900">
              {Array.isArray(evaluation.short_term_goals) && evaluation.short_term_goals.length ? (
                evaluation.short_term_goals.map((goal: string, i: number) => (
                  <li key={i}>{goal}</li>
                ))
              ) : (
                <li>-</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Objetivos a largo plazo</p>
            <ul className="list-disc list-inside text-gray-900">
              {Array.isArray(evaluation.long_term_goals) && evaluation.long_term_goals.length ? (
                evaluation.long_term_goals.map((goal: string, i: number) => (
                  <li key={i}>{goal}</li>
                ))
              ) : (
                <li>-</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Expectativas del paciente</p>
            <p className="text-gray-900">{evaluation.patient_expectations || '-'}</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
            <div>
              <p className="font-medium text-gray-700">Creado</p>
              <p>{formatDate(evaluation.created_at)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Consentimiento informado</p>
              <p>{evaluation.informed_consent_signed ? formatDate(evaluation.informed_consent_date) : 'No firmado'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Estado</p>
              <p className="capitalize">{evaluation.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
