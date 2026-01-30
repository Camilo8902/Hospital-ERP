'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  Edit, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Plus,
  FileText,
  TrendingUp,
  Target,
  Play
} from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  indicated: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  indicated: 'Indicado',
  in_progress: 'En Proceso',
  completed: 'Culminado',
  paused: 'Pausado',
  cancelled: 'Cancelado',
};

export default function PhysioPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const planId = params.id as string;
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (planId) fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('physio_treatment_plans')
        .select(`
          *,
          patients (id, first_name, last_name, dni, phone, date_of_birth),
          therapists (id, full_name, specialty, email),
          physio_sessions (*)
        `)
        .eq('id', planId)
        .single();

      if (error) throw error;
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el plan');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('physio_treatment_plans')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'completed' ? { actual_end_date: new Date().toISOString().split('T')[0] } : {})
        })
        .eq('id', planId);

      if (error) throw error;
      setPlan((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar estado');
    } finally {
      setUpdating(false);
    }
  };

  const getProgress = () => {
    if (!plan?.total_sessions_prescribed || plan.total_sessions_prescribed === 0) return 0;
    const completed = plan.sessions_completed || plan.physio_sessions?.length || 0;
    return Math.round((completed / plan.total_sessions_prescribed) * 100);
  };

  const sessionsCompleted = plan?.physio_sessions?.length || 0;
  const progress = getProgress();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando plan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-500 mb-4">{error || 'Plan no encontrado'}</p>
            <Link href="/dashboard/physiotherapy/plans" className="btn-primary">
              Volver a Planes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/physiotherapy/plans" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Plan de Tratamiento</h1>
            <p className="text-gray-500 mt-1">
              {plan.patients?.first_name} {plan.patients?.last_name} - {plan.diagnosis_description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[plan.status]}`}>
            {statusLabels[plan.status] || plan.status}
          </span>
          <Link href={`/dashboard/physiotherapy/plans/${plan.id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Progreso</p>
                <p className="text-xl font-bold text-gray-900">{progress}%</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sesiones Realizadas</p>
                <p className="text-xl font-bold text-gray-900">{sessionsCompleted} / {plan.total_sessions_prescribed || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sesiones/Semana</p>
                <p className="text-xl font-bold text-gray-900">{plan.sessions_per_week || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Score Baseline</p>
                <p className="text-xl font-bold text-gray-900">{plan.baseline_functional_score || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Datos del Paciente
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre completo</p>
                  <p className="font-medium">{plan.patients?.first_name} {plan.patients?.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">DNI</p>
                  <p className="font-medium">{plan.patients?.dni || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{plan.patients?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de nacimiento</p>
                  <p className="font-medium">
                    {plan.patients?.date_of_birth 
                      ? new Date(plan.patients.date_of_birth).toLocaleDateString() 
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Sesiones del Plan
              </h2>
              <Link 
                href={`/dashboard/physiotherapy/sessions/new?plan_id=${plan.id}&patient_id=${plan.patient_id}`}
                className="btn-primary btn-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Sesión
              </Link>
            </div>
            <div className="card-body p-0">
              {plan.physio_sessions && plan.physio_sessions.length > 0 ? (
                <div className="divide-y">
                  {plan.physio_sessions
                    .sort((a: any, b: any) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
                    .map((session: any) => (
                      <div key={session.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-medium">
                                #{session.session_number || session.physio_sessions?.indexOf(session) + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {new Date(session.session_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                {session.session_time} - {session.duration_minutes} min
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              session.status === 'completed' ? 'bg-green-100 text-green-800' :
                              session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {session.status || 'pendiente'}
                            </span>
                            <Link 
                              href={`/dashboard/physiotherapy/sessions/${session.id}`}
                              className="text-purple-600 hover:text-purple-800 text-sm"
                            >
                              Ver detalle
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No hay sesiones registradas</p>
                  <Link 
                    href={`/dashboard/physiotherapy/sessions/new?plan_id=${plan.id}&patient_id=${plan.patient_id}`}
                    className="btn-primary mt-3"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Crear primera sesión
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Plan Details */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Detalles del Plan</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <p className="text-sm text-gray-500">Tipo de Plan</p>
                <p className="font-medium capitalize">{plan.plan_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Diagnóstico</p>
                <p className="font-medium">{plan.diagnosis_description || 'N/A'}</p>
              </div>
              {plan.diagnosis_code && (
                <div>
                  <p className="text-sm text-gray-500">Código CIE-10</p>
                  <p className="font-medium">{plan.diagnosis_code}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Fecha de inicio</p>
                <p className="font-medium">
                  {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              {plan.expected_end_date && (
                <div>
                  <p className="text-sm text-gray-500">Fin esperado</p>
                  <p className="font-medium">
                    {new Date(plan.expected_end_date).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Terapeuta</p>
                <p className="font-medium">{plan.therapists?.full_name || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Clinical Objective */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Objetivo Clínico</h2>
            </div>
            <div className="card-body">
              <p className="text-gray-700">{plan.clinical_objective || 'Sin objetivo definido'}</p>
            </div>
          </div>

          {/* Iniciar Plan - Cuando está Indicado */}
          {plan.status === 'indicated' && (
            <div className="card border-blue-200 bg-blue-50">
              <div className="card-header bg-blue-100">
                <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Iniciar Tratamiento
                </h2>
              </div>
              <div className="card-body">
                <p className="text-sm text-blue-800 mb-4">
                  Este plan está indicado pero no ha comenzado.\n                    {!plan.physio_sessions || plan.physio_sessions.length === 0 ? (
                      <span className="block mt-2">Aún no hay sesiones registradas.</span>
                    ) : (
                      <span className="block mt-2">{plan.physio_sessions.length} sesión(es) registrada(s).</span>
                    )}
                </p>
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={updating}
                  className="btn-primary w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Plan de Tratamiento
                </button>
              </div>
            </div>
          )}

          {/* Actions - Cuando está En Proceso */}
          {plan.status === 'in_progress' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Acciones</h2>
              </div>
              <div className="card-body space-y-2">
                <button
                  onClick={() => handleStatusChange('completed')}
                  disabled={updating || progress < 100}
                  className="btn-primary w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completar Plan
                </button>
                <button
                  onClick={() => handleStatusChange('paused')}
                  disabled={updating}
                  className="btn-secondary w-full"
                >
                  Pausar Plan
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de cancelar este plan?')) {
                      handleStatusChange('cancelled');
                    }
                  }}
                  disabled={updating}
                  className="btn-danger w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
