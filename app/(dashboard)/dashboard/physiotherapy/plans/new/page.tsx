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
  const [equipment, setEquipment] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [equipmentParams, setEquipmentParams] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    patient_id: searchParams.get('patient_id') || '',
    evaluation_id: '',
    equipment_id: '',
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
    equipment_params: {} as Record<string, any>,
  });

  // Cargar pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, dni, phone')
        .order('last_name');
      
      if (data) {
        setPatients(data.map((p: any) => ({
          ...p,
          full_name: `${p.first_name} ${p.last_name}`
        })));
      }
    };
    fetchPatients();

    // Cargar equipos disponibles
    const fetchEquipment = async () => {
      const { data } = await supabase
        .from('physio_equipment')
        .select('id, name, brand, model, status, parameter_fields')
        .eq('is_active', true)
        .in('status', ['available', 'in_use'])
        .order('name');
      
      if (data) setEquipment(data);
    };
    fetchEquipment();
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
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : null) : value,
    }));

    // Si cambia el equipo, cargar sus parámetros
    if (name === 'equipment_id') {
      const selected = equipment.find((eq: any) => eq.id === value);
      setSelectedEquipment(selected || null);
      if (selected?.parameter_fields) {
        const params: Record<string, any> = {};
        (selected.parameter_fields as any[]).forEach((pf: any) => {
          params[pf.field_name] = pf.field_default_value || '';
        });
        setEquipmentParams(params);
        setFormData((prev: any) => ({ ...prev, equipment_params: params }));
      } else {
        setEquipmentParams({});
        setFormData((prev: any) => ({ ...prev, equipment_params: {} }));
      }
    }
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
        equipment_id: formData.equipment_id || null,
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
        equipment_params: formData.equipment_params || null,
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
                    <option key={evaluation.id} value={evaluation.id}>
                      {new Date(evaluation.created_at).toLocaleDateString()} - {evaluation.clinical_diagnosis?.substring(0, 50) || 'Sin diagnóstico'}
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
              <div className="md:col-span-2">
                <label className="label mb-1.5">Equipo a utilizar (opcional)</label>
                <select
                  name="equipment_id"
                  value={formData.equipment_id || ''}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Sin equipo específico...</option>
                  {equipment.map((eq: any) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} {eq.brand ? `- ${eq.brand}` : ''} {eq.model ? `(${eq.model})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mostrar parámetros del equipo seleccionado */}
            {selectedEquipment && selectedEquipment.parameter_fields && (selectedEquipment.parameter_fields as any[]).length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-3">
                  Parámetros de {selectedEquipment.name}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(selectedEquipment.parameter_fields as any[]).map((param: any) => (
                    <div key={param.field_name}>
                      <label className="label text-xs mb-1">
                        {param.field_label}
                        {param.field_unit && <span className="text-gray-400"> ({param.field_unit})</span>}
                      </label>
                      {param.field_type === 'number' && (
                        <input
                          type="number"
                          value={equipmentParams[param.field_name] || ''}
                          onChange={(e) => setEquipmentParams((prev: any) => ({
                            ...prev,
                            [param.field_name]: e.target.value ? parseFloat(e.target.value) : null
                          }))}
                          className="input text-sm"
                          min={param.field_min}
                          max={param.field_max}
                          step={param.field_step || 1}
                        />
                      )}
                      {param.field_type === 'text' && (
                        <input
                          type="text"
                          value={equipmentParams[param.field_name] || ''}
                          onChange={(e) => setEquipmentParams((prev: any) => ({
                            ...prev,
                            [param.field_name]: e.target.value
                          }))}
                          className="input text-sm"
                        />
                      )}
                      {param.field_type === 'select' && (
                        <select
                          value={equipmentParams[param.field_name] || ''}
                          onChange={(e) => setEquipmentParams((prev: any) => ({
                            ...prev,
                            [param.field_name]: e.target.value
                          }))}
                          className="input text-sm"
                        >
                          <option value="">Seleccionar...</option>
                          {param.field_options?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                      {param.field_type === 'range' && (
                        <div className="space-y-1">
                          <input
                            type="range"
                            value={equipmentParams[param.field_name] || param.field_min || 0}
                            onChange={(e) => setEquipmentParams((prev: any) => ({
                              ...prev,
                              [param.field_name]: parseFloat(e.target.value)
                            }))}
                            className="w-full"
                            min={param.field_min}
                            max={param.field_max}
                            step={param.field_step || 1}
                          />
                          <div className="text-xs text-center text-gray-600">
                            {equipmentParams[param.field_name] || param.field_min || 0}
                          </div>
                        </div>
                      )}
                      {param.field_type === 'boolean' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!equipmentParams[param.field_name]}
                            onChange={(e) => setEquipmentParams((prev: any) => ({
                              ...prev,
                              [param.field_name]: e.target.checked
                            }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Sí</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
