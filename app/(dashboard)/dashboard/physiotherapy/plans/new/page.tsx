'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  User,
  FileText,
  Calendar,
  Target
} from 'lucide-react';
import Link from 'next/link';

const planTypes = [
  { value: 'rehabilitation', label: 'Rehabilitación', description: 'Recuperación de función tras lesión/cirugía' },
  { value: 'maintenance', label: 'Mantenimiento', description: 'Conservar función alcanzada' },
  { value: 'preventive', label: 'Preventivo', description: 'Prevención de lesiones' },
  { value: 'performance', label: 'Rendimiento', description: 'Optimización de rendimiento deportivo' },
];

export default function NewPhysioPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    patient_id: searchParams.get('patient_id') || '',
    evaluation_id: '',
    diagnosis_code: '',
    diagnosis_description: '',
    plan_type: 'rehabilitation' as const,
    clinical_objective: '',
    start_date: new Date().toISOString().split('T')[0],
    expected_end_date: '',
    sessions_per_week: 3,
    total_sessions_prescribed: 10,
    initial_assessment: '',
    baseline_rom: '',
    baseline_functional_score: 0 as number | null,
    notes: '',
  });

  // Cargar pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, dni, phone')
        .order('last_name');
      
      if (data) {
        setPatients(data.map(p => ({
          ...p,
          full_name: `${p.first_name} ${p.last_name}`
        })));
      }
    };
    fetchPatients();
  }, []);

  // Cargar evaluaciones del paciente seleccionado
  useEffect(() => {
    if (formData.patient_id) {
      const fetchEvaluations = async () => {
        const { data } = await supabase
          .from('physio_medical_records')
          .select('id, chief_complaint, clinical_diagnosis, created_at, pain_scale_baseline')
          .eq('patient_id', formData.patient_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        
        if (data) setEvaluations(data);
      };
      fetchEvaluations();
    } else {
      setEvaluations([]);
    }
  }, [formData.patient_id]);

  // Pre-llenar desde evaluación seleccionada
  useEffect(() => {
    if (formData.evaluation_id) {
      const evalId = formData.evaluation_id;
      const selectedEval = evaluations.find(e => e.id === evalId);
      if (selectedEval) {
        setFormData(prev => ({
          ...prev,
          clinical_objective: selectedEval.clinical_diagnosis || prev.clinical_objective,
        }));
      }
    }
  }, [formData.evaluation_id, evaluations]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : null) : value,
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

      const planData = {
        patient_id: formData.patient_id,
        evaluation_id: formData.evaluation_id || null,
        therapist_id: user.id,
        diagnosis_code: formData.diagnosis_code || null,
        diagnosis_description: formData.diagnosis_description,
        plan_type: formData.plan_type,
        clinical_objective: formData.clinical_objective,
        start_date: formData.start_date,
        expected_end_date: formData.expected_end_date || null,
        sessions_per_week: formData.sessions_per_week,
        total_sessions_prescribed: formData.total_sessions_prescribed,
        initial_assessment: formData.initial_assessment || null,
        baseline_rom: formData.baseline_rom || null,
        baseline_functional_score: formData.baseline_functional_score,
        status: 'active',
        notes: formData.notes || null,
      };

      const { data, error: insertError } = await supabase
        .from('physio_treatment_plans')
        .insert(planData)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/physiotherapy/plans/${data.id}`);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el plan');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Plan Creado!</h2>
            <p className="text-gray-500 mb-4">El plan de tratamiento se ha creado correctamente.</p>
            <p className="text-sm text-gray-400">Redirigiendo...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/physiotherapy/plans" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Plan de Tratamiento</h1>
          <p className="text-gray-500 mt-1">Crear plan de fisioterapia para paciente</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Datos del Paciente
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5">Paciente *</label>
                <select
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleChange}
                  className="input"
                  required
                >
                  <option value="">Seleccionar paciente...</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name} - DNI: {patient.dni}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label mb-1.5">Evaluación de referencia (opcional)</label>
                <select
                  name="evaluation_id"
                  value={formData.evaluation_id}
                  onChange={handleChange}
                  className="input"
                  disabled={!formData.patient_id}
                >
                  <option value="">Sin evaluación previa...</option>
                  {evaluations.map((evaluation) => (
                    <option key={eval.id} value={eval.id}>
                      {new Date(eval.created_at).toLocaleDateString()} - {eval.clinical_diagnosis?.substring(0, 50) || 'Sin diagnóstico'}
                    </option>
                  ))}
                </select>
                {!formData.patient_id && (
                  <p className="text-xs text-gray-400 mt-1">Primero selecciona un paciente</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Diagnóstico
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5">Código CIE-10</label>
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
                <label className="label mb-1.5">Tipo de Plan</label>
                <select
                  name="plan_type"
                  value={formData.plan_type}
                  onChange={handleChange}
                  className="input"
                >
                  {planTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label mb-1.5">Descripción del diagnóstico</label>
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
                placeholder="Objetivos terapéuticos principales..."
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Programación de Sesiones
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="label mb-1.5">Fecha de inicio</label>
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
                <label className="label mb-1.5">Fecha fin esperada</label>
                <input
                  type="date"
                  name="expected_end_date"
                  value={formData.expected_end_date}
                  onChange={handleChange}
                  className="input"
                />
              </div>
              <div>
                <label className="label mb-1.5">Sesiones por semana</label>
                <input
                  type="number"
                  name="sessions_per_week"
                  value={formData.sessions_per_week}
                  onChange={handleChange}
                  className="input"
                  min="1"
                  max="7"
                />
              </div>
              <div>
                <label className="label mb-1.5">Total de sesiones</label>
                <input
                  type="number"
                  name="total_sessions_prescribed"
                  value={formData.total_sessions_prescribed}
                  onChange={handleChange}
                  className="input"
                  min="1"
                />
              </div>
            </div>

            {/* Plan summary */}
            <div className="mt-4 p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800">
                <strong>Resumen:</strong> Plan de {formData.plan_type} con {formData.sessions_per_week} sesiones semanales, 
                total de {formData.total_sessions_prescribed} sesiones aproximadamente 
                {formData.expected_end_date 
                  ? ` hasta el ${new Date(formData.expected_end_date).toLocaleDateString()}`
                  : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Baseline */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Evaluación Inicial
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label mb-1.5">Valoración inicial</label>
              <textarea
                name="initial_assessment"
                value={formData.initial_assessment}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Observaciones de la valoración inicial..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5">ROM baseline</label>
                <input
                  type="text"
                  name="baseline_rom"
                  value={formData.baseline_rom}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: Flexión 90°"
                />
              </div>
              <div>
                <label className="label mb-1.5">Score funcional inicial (0-100)</label>
                <input
                  type="number"
                  name="baseline_functional_score"
                  value={formData.baseline_functional_score || ''}
                  onChange={handleChange}
                  className="input"
                  min="0"
                  max="100"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Notas adicionales</h2>
          </div>
          <div className="card-body">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input min-h-[80px]"
              placeholder="Notas adicionales del plan..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/physiotherapy/plans" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !formData.patient_id || !formData.diagnosis_description}
            className="btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Crear Plan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
