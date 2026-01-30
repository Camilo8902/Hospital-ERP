'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  FileText,
  TrendingUp,
  Target,
  Download,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function FinalizePhysioPlanPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const planId = params.id as string;
  
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<any>(null);

  const [formData, setFormData] = useState({
    final_vas: 0,
    sessions_completed: 0,
    sessions_attended: 0,
    final_assessment: '',
    objectives_achieved: '',
    objectives_not_achieved: '',
    final_recommendations: '',
    follow_up_required: false,
    follow_up_date: '',
    patient_satisfaction: 3,
    discharge_notes: '',
  });

  useEffect(() => {
    if (planId) fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('physio_treatment_plans')
        .select(`
          *,
          patients (id, first_name, last_name, dni, phone)
        `)
        .eq('id', planId)
        .single();

      if (error) throw error;
      
      // Cargar sesiones por separado
      const { data: sessions } = await supabase
        .from('physio_sessions')
        .select('*')
        .eq('treatment_plan_id', planId)
        .order('session_date', { ascending: false });
      
      const planWithSessions = { ...data, physio_sessions: sessions || [] };
      setPlan(planWithSessions);

      // Pre-llenar datos
      const completedSessions = sessions?.filter((s: any) => s.status === 'completed').length || 0;
      setFormData(prev => ({
        ...prev,
        sessions_completed: completedSessions,
        sessions_attended: completedSessions,
        final_vas: data.baseline_functional_score || 0,
      }));

      // Generar preview del resumen
      calculatePreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el plan');
    } finally {
      setLoading(false);
    }
  };

  const calculatePreview = (planData: any) => {
    const initialVas = planData.baseline_functional_score || 0;
    const completed = planData.physio_sessions?.filter((s: any) => s.status === 'completed').length || 0;
    
    setGeneratedSummary({
      initialVas,
      finalVas: formData.final_vas,
      sessionsCompleted: completed,
      painImprovement: initialVas > 0 && formData.final_vas > 0 
        ? Math.round(((initialVas - formData.final_vas) / initialVas) * 100)
        : 0,
    });
  };

  useEffect(() => {
    if (plan) {
      calculatePreview(plan);
    }
  }, [formData.final_vas, plan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? (value ? parseFloat(value) : 0) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const payload = {
        final_vas: formData.final_vas,
        sessions_completed: formData.sessions_completed,
        sessions_attended: formData.sessions_attended,
        final_assessment: formData.final_assessment,
        objectives_achieved: formData.objectives_achieved ? formData.objectives_achieved.split('\n').filter((o: string) => o.trim()) : [],
        objectives_not_achieved: formData.objectives_not_achieved ? formData.objectives_not_achieved.split('\n').filter((o: string) => o.trim()) : [],
        final_recommendations: formData.final_recommendations,
        follow_up_required: formData.follow_up_required,
        follow_up_date: formData.follow_up_required ? formData.follow_up_date : null,
        patient_satisfaction: formData.patient_satisfaction,
        discharge_notes: formData.discharge_notes,
      };

      const response = await fetch(`/api/physio/plans/${planId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setGeneratedSummary(result);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/physiotherapy/plans/${planId}`);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al culminar plan');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
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
      <div className="max-w-4xl mx-auto">
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

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Plan Culminado!</h2>
            <p className="text-gray-500 mb-4">El resumen de alta ha sido generado correctamente.</p>
            <div className="flex justify-center gap-4">
              <button onClick={handlePrint} className="btn-primary">
                <Download className="w-4 h-4 mr-2" />
                Descargar Resumen
              </button>
              <Link href={`/dashboard/physiotherapy/plans/${planId}`} className="btn-secondary">
                Ver Plan
              </Link>
            </div>
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
          <Link href={`/dashboard/physiotherapy/plans/${planId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Culminación de Tratamiento</h1>
            <p className="text-gray-500 mt-1">
              {plan.patients?.first_name} {plan.patients?.last_name} - {plan.diagnosis_description}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resumen de Progreso */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Resumen del Tratamiento
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Dolor Inicial (EVA)</p>
                <p className="text-2xl font-bold text-gray-900">{generatedSummary?.initialVas || 0}/10</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Dolor Final (EVA)</p>
                <p className="text-2xl font-bold text-purple-600">{formData.final_vas}/10</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Mejora del Dolor</p>
                <p className="text-2xl font-bold text-green-600">{generatedSummary?.painImprovement || 0}%</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">Sesiones Realizadas</p>
                <p className="text-2xl font-bold text-blue-600">{formData.sessions_completed}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5">Sesiones completadas</label>
                <input
                  type="number"
                  name="sessions_completed"
                  value={formData.sessions_completed}
                  onChange={handleChange}
                  className="input"
                  min="0"
                />
              </div>
              <div>
                <label className="label mb-1.5">Sesiones asistidas</label>
                <input
                  type="number"
                  name="sessions_attended"
                  value={formData.sessions_attended}
                  onChange={handleChange}
                  className="input"
                  min="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Evaluación Final */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Evaluación Final
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label mb-1.5">Valoración final del estado del paciente</label>
              <textarea
                name="final_assessment"
                value={formData.final_assessment}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Describe el estado actual del paciente tras el tratamiento..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5">Objetivos logrados (uno por línea)</label>
                <textarea
                  name="objectives_achieved"
                  value={formData.objectives_achieved}
                  onChange={handleChange}
                  className="input min-h-[100px]"
                  placeholder="1. Recuperación de movilidad completa..."
                />
              </div>
              <div>
                <label className="label mb-1.5">Objetivos no logrados (uno por línea)</label>
                <textarea
                  name="objectives_not_achieved"
                  value={formData.objectives_not_achieved}
                  onChange={handleChange}
                  className="input min-h-[100px]"
                  placeholder="1. Fortalecimiento al 100%..."
                />
              </div>
            </div>

            <div>
              <label className="label mb-1.5">Recomendaciones post-alta</label>
              <textarea
                name="final_recommendations"
                value={formData.final_recommendations}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Recomendaciones para el paciente tras el alta..."
              />
            </div>
          </div>
        </div>

        {/* Seguimiento y Satisfacción */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Seguimiento y Satisfacción
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="follow_up_required"
                    checked={formData.follow_up_required}
                    onChange={handleChange}
                    className="w-5 h-5 text-purple-600 rounded"
                  />
                  <span className="font-medium">Requiere seguimiento</span>
                </label>
              </div>
              {formData.follow_up_required && (
                <div>
                  <label className="label mb-1.5">Fecha de seguimiento propuesta</label>
                  <input
                    type="date"
                    name="follow_up_date"
                    value={formData.follow_up_date}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="label mb-1.5">Satisfacción del paciente</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, patient_satisfaction: score }))}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      formData.patient_satisfaction === score
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.patient_satisfaction === 1 ? 'Muy insatisfecho' :
                 formData.patient_satisfaction === 2 ? 'Insatisfecho' :
                 formData.patient_satisfaction === 3 ? 'Neutral' :
                 formData.patient_satisfaction === 4 ? 'Satisfecho' : 'Muy satisfecho'}
              </p>
            </div>

            <div className="mt-4">
              <label className="label mb-1.5">Notas de alta</label>
              <textarea
                name="discharge_notes"
                value={formData.discharge_notes}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Notas adicionales para el alta..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/physiotherapy/plans/${planId}`} className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Completar Alta
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
