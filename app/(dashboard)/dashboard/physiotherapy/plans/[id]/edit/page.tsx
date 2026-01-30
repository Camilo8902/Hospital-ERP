'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const planTypes = [
  { value: 'rehabilitation', label: 'Rehabilitación' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'preventive', label: 'Preventivo' },
  { value: 'performance', label: 'Rendimiento' },
];

export default function PhysioPlanEditPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const planId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    diagnosis_code: '',
    diagnosis_description: '',
    plan_type: 'rehabilitation',
    clinical_objective: '',
    start_date: '',
    expected_end_date: '',
    sessions_per_week: 3,
    total_sessions_prescribed: 10,
    notes: '',
  });

  useEffect(() => {
    if (planId) fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('physio_treatment_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          diagnosis_code: data.diagnosis_code || '',
          diagnosis_description: data.diagnosis_description || '',
          plan_type: data.plan_type || 'rehabilitation',
          clinical_objective: data.clinical_objective || '',
          start_date: data.start_date || '',
          expected_end_date: data.expected_end_date || '',
          sessions_per_week: data.sessions_per_week || 3,
          total_sessions_prescribed: data.total_sessions_prescribed || 10,
          notes: data.notes || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el plan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : 0) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('physio_treatment_plans')
        .update({
          diagnosis_code: formData.diagnosis_code,
          diagnosis_description: formData.diagnosis_description,
          plan_type: formData.plan_type,
          clinical_objective: formData.clinical_objective,
          start_date: formData.start_date,
          expected_end_date: formData.expected_end_date || null,
          sessions_per_week: formData.sessions_per_week,
          total_sessions_prescribed: formData.total_sessions_prescribed,
          notes: formData.notes || null,
        })
        .eq('id', planId);

      if (updateError) throw updateError;

      router.push(`/dashboard/physiotherapy/plans/${planId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
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

  if (error && !formData.diagnosis_description) {
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/physiotherapy/plans/${planId}`} className="btn-secondary btn-md">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Plan de Tratamiento</h1>
          <p className="text-gray-500 mt-1">Modifica los datos del plan de tratamiento</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          {/* Diagnóstico */}
          <div>
            <label className="label mb-1.5">Código de diagnóstico (ICD-10)</label>
            <input
              type="text"
              name="diagnosis_code"
              value={formData.diagnosis_code}
              onChange={handleChange}
              className="input"
              placeholder="Ej: M54.5"
            />
          </div>

          <div>
            <label className="label mb-1.5">Descripción del diagnóstico *</label>
            <textarea
              name="diagnosis_description"
              value={formData.diagnosis_description}
              onChange={handleChange}
              className="input min-h-[80px]"
              placeholder="Describe el diagnóstico del paciente..."
              required
            />
          </div>

          <div>
            <label className="label mb-1.5">Objetivo clínico</label>
            <textarea
              name="clinical_objective"
              value={formData.clinical_objective}
              onChange={handleChange}
              className="input min-h-[80px]"
              placeholder="Objetivo principal del tratamiento..."
            />
          </div>

          {/* Tipo de plan */}
          <div>
            <label className="label mb-1.5">Tipo de plan *</label>
            <select
              name="plan_type"
              value={formData.plan_type}
              onChange={handleChange}
              className="input"
              required
            >
              {planTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Fecha de inicio *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Fecha estimada de finalización</label>
              <input
                type="date"
                name="expected_end_date"
                value={formData.expected_end_date}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          {/* Sesiones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Sesiones por semana *</label>
              <input
                type="number"
                name="sessions_per_week"
                value={formData.sessions_per_week}
                onChange={handleChange}
                min="1"
                max="7"
                className="input"
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Total de sesiones prescritas *</label>
              <input
                type="number"
                name="total_sessions_prescribed"
                value={formData.total_sessions_prescribed}
                onChange={handleChange}
                min="1"
                max="100"
                className="input"
                required
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="label mb-1.5">Notas adicionales</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input min-h-[80px]"
              placeholder="Notas adicionales sobre el tratamiento..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Link href={`/dashboard/physiotherapy/plans/${planId}`} className="btn-secondary btn-md">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary btn-md"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
