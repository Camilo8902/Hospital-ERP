'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Loader2, Calendar, Activity, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {
  PatientSelector,
  DoctorSelector,
  DateTimePicker,
} from '../shared';
import { AppointmentFormDispatcherProps } from '../dispatcher/AppointmentFormDispatcher';
import { getPatientPhysioContext } from '@/lib/actions/appointments/physiotherapy/linkToMedicalRecord';

// Opciones para el formulario de fisioterapia
const bodyRegions = [
  { value: 'cervical', label: 'Cervical (Cuello)', category: 'columna' },
  { value: 'shoulder', label: 'Hombro', category: 'miembro_superior' },
  { value: 'elbow', label: 'Codo', category: 'miembro_superior' },
  { value: 'wrist', label: 'Muñeca', category: 'miembro_superior' },
  { value: 'hand', label: 'Mano', category: 'miembro_superior' },
  { value: 'lumbar', label: 'Lumbar (Espalda baja)', category: 'columna' },
  { value: 'thoracic', label: 'Torácica', category: 'columna' },
  { value: 'hip', label: 'Cadera', category: 'miembro_inferior' },
  { value: 'knee', label: 'Rodilla', category: 'miembro_inferior' },
  { value: 'ankle', label: 'Tobillo', category: 'miembro_inferior' },
  { value: 'foot', label: 'Pie', category: 'miembro_inferior' },
  { value: 'other', label: 'Otra', category: 'otra' },
];

const therapyTypes = [
  { value: 'manual', label: 'Terapia Manual', icon: '👐' },
  { value: 'electro', label: 'Electroterapia', icon: '⚡' },
  { value: 'hydro', label: 'Hidroterapia', icon: '💧' },
  { value: 'exercise', label: 'Ejercicio Terapéutico', icon: '🏋️' },
  { value: 'combined', label: 'Tratamiento Combinado', icon: '🔄' },
];

const techniques = [
  'Masaje terapéutico', 'Movilización articular', 'Estiramiento', 
  'Fortalecimiento', 'Electroestimulación', 'Ultrasonido',
  'Laserterapia', 'Magnetoterapia', 'Tracción', 'Vendaje neuromuscular',
  'Crioterapia', 'Termoterapia', 'Punción seca', 'Técnicas de respiración'
];

// Función para convertir fecha local a formato UTC para Supabase
function toUTCDateTime(localDateTime: string): string {
  if (!localDateTime) return '';
  const date = new Date(localDateTime);
  return date.toISOString();
}

interface PhysioPatientContext {
  hasActiveRecord: boolean;
  medicalRecord?: {
    id: string;
    chief_complaint?: string;
    pain_location?: string;
    pain_scale_baseline?: number;
    clinical_diagnosis?: string;
    contraindications?: string[];
  };
  treatmentPlan?: {
    id: string;
    plan_type: string;
    total_sessions_prescribed: number;
    sessions_completed: number;
  };
  recentSessions: Array<{
    id: string;
    session_date: string;
    session_number?: number;
    techniques_applied?: string[];
    pain_level?: number;
  }>;
}

export function PhysiotherapyForm({
  mode,
  initialData,
  patients,
  departments,
  doctors,
  rooms,
  appointmentId,
}: AppointmentFormDispatcherProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientContext, setPatientContext] = useState<PhysioPatientContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // Datos específicos de fisioterapia del JSONB
  const physioData = initialData?.department_specific_data as
    | {
        bodyRegion?: string;
        painLevel?: number;
        therapyType?: string;
        requiresInitialAssessment?: boolean;
        sessionNumber?: number;
        treatmentPlanId?: string;
        techniques?: string[];
        therapistNotes?: string;
      }
    | undefined;

  const [formData, setFormData] = useState({
    patient_id: initialData?.patient_id || '',
    doctor_id: initialData?.doctor_id || '',
    department_id: initialData?.department_id || '',
    room_id: initialData?.room_id || '',
    appointment_type: 'physiotherapy',
    start_time: initialData?.start_time
      ? new Date(initialData.start_time).toISOString().slice(0, 16)
      : '',
    end_time: initialData?.end_time
      ? new Date(initialData.end_time).toISOString().slice(0, 16)
      : '',
    reason: initialData?.reason || '',
    notes: initialData?.notes || '',
    // Datos específicos de fisioterapia
    body_region: physioData?.bodyRegion || '',
    pain_level: physioData?.painLevel?.toString() || '0',
    therapy_type: physioData?.therapyType || '',
    requires_initial_assessment: physioData?.requiresInitialAssessment || false,
    session_number: physioData?.sessionNumber?.toString() || '',
    treatment_plan_id: physioData?.treatmentPlanId || '',
    techniques: physioData?.techniques || [] as string[],
    therapist_notes: physioData?.therapistNotes || '',
  });

  // Cargar contexto de fisioterapia cuando se selecciona un paciente
  const loadPatientContext = useCallback(async (patientId: string) => {
    if (!patientId) {
      setPatientContext(null);
      return;
    }

    setLoadingContext(true);
    try {
      const result = await getPatientPhysioContext(patientId);
      if (result.success && result.data) {
        const { medicalRecord, treatmentPlan, recentSessions } = result.data;
        
        // Auto-completar número de sesión si hay un plan activo
        if (treatmentPlan && !formData.session_number) {
          const nextSession = (treatmentPlan.sessions_completed || 0) + 1;
          setFormData(prev => ({
            ...prev,
            session_number: nextSession.toString(),
            treatment_plan_id: treatmentPlan.id
          }));
        }

        setPatientContext({
          hasActiveRecord: !!medicalRecord,
          medicalRecord: medicalRecord ? {
            id: medicalRecord.id,
            chief_complaint: medicalRecord.chief_complaint || undefined,
            pain_location: medicalRecord.pain_location || undefined,
            pain_scale_baseline: medicalRecord.pain_scale_baseline || undefined,
            clinical_diagnosis: medicalRecord.clinical_diagnosis || undefined,
            contraindications: medicalRecord.contraindications || undefined
          } : undefined,
          treatmentPlan: treatmentPlan ? {
            id: treatmentPlan.id,
            plan_type: treatmentPlan.plan_type,
            total_sessions_prescribed: treatmentPlan.total_sessions_prescribed || 0,
            sessions_completed: treatmentPlan.sessions_completed || 0
          } : undefined,
          recentSessions: recentSessions || []
        });
      }
    } catch (err) {
      console.error('Error loading patient context:', err);
    } finally {
      setLoadingContext(false);
    }
  }, [formData.session_number, formData.treatment_plan_id]);

  // Efecto para cargar contexto cuando cambia el patient_id
  useEffect(() => {
    if (mode === 'create' && formData.patient_id) {
      loadPatientContext(formData.patient_id);
    } else if (mode === 'edit' && initialData?.patient_id) {
      loadPatientContext(initialData.patient_id);
    }
  }, [formData.patient_id, initialData?.patient_id, mode, loadPatientContext]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.patient_id) {
        throw new Error('Debe seleccionar un paciente');
      }

      const utcStartTime = toUTCDateTime(formData.start_time);
      const utcEndTime = toUTCDateTime(formData.end_time);

      // Construir el JSONB con datos específicos de fisioterapia
      const departmentSpecificData = {
        bodyRegion: formData.body_region,
        painLevel: parseInt(formData.pain_level) || 0,
        therapyType: formData.therapy_type,
        requiresInitialAssessment: formData.requires_initial_assessment,
        sessionNumber: formData.session_number ? parseInt(formData.session_number) : null,
        treatmentPlanId: formData.treatment_plan_id || null,
        techniques: formData.techniques,
        therapistNotes: formData.therapist_notes,
      };

      if (mode === 'create') {
        const { data, error: insertError } = await supabase
          .from('appointments')
          .insert({
            patient_id: formData.patient_id,
            doctor_id: formData.doctor_id || null,
            department_id: formData.department_id || null,
            room_id: formData.room_id || null,
            appointment_type: 'physiotherapy',
            start_time: utcStartTime,
            end_time: utcEndTime,
            reason: formData.reason || null,
            notes: formData.notes || null,
            status: 'scheduled',
            workflow_status: 'scheduled',
            department_specific_data: departmentSpecificData,
            clinical_reference_type: formData.treatment_plan_id ? 'treatment_plan' : null,
            clinical_reference_id: formData.treatment_plan_id || null,
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        router.push('/dashboard/appointments');
      } else {
        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            patient_id: formData.patient_id,
            doctor_id: formData.doctor_id || null,
            department_id: formData.department_id || null,
            room_id: formData.room_id || null,
            appointment_type: 'physiotherapy',
            start_time: utcStartTime,
            end_time: utcEndTime,
            reason: formData.reason || null,
            notes: formData.notes || null,
            department_specific_data: departmentSpecificData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointmentId);

        if (updateError) {
          throw new Error(updateError.message);
        }

        router.push(`/dashboard/appointments/${appointmentId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cita');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientChange = (patientId: string) => {
    setFormData((prev) => ({ ...prev, patient_id: patientId }));
  };

  const handleTechniqueToggle = (technique: string) => {
    setFormData((prev) => ({
      ...prev,
      techniques: prev.techniques.includes(technique)
        ? prev.techniques.filter((t) => t !== technique)
        : [...prev.techniques, technique],
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Filtrar fisioterapeutas (doctores con specialty relacionada)
  const physiotherapists = doctors.filter(
    (d) => d.specialty?.toLowerCase().includes('physio') || 
           d.specialty?.toLowerCase().includes('fisio') ||
           d.specialty?.toLowerCase().includes('rehab')
  );

  // Filtrar salas de tratamiento de fisioterapia
  const treatmentRooms = rooms.filter(
    (r) => r.room_type === 'treatment' || r.room_type === 'physio'
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/appointments"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Activity className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Nueva Cita de Fisioterapia' : 'Editar Cita'}
            </h1>
            <p className="text-gray-500 mt-1">
              {mode === 'create'
                ? 'Agendar una sesión de fisioterapia'
                : 'Modificar datos de la sesión'}
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos del Paciente */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">1</span>
              Selección de Paciente
            </h2>
          </div>
          <div className="card-body">
            <PatientSelector
              patients={patients}
              value={formData.patient_id}
              onChange={handlePatientChange}
              required
            />

            {/* Contexto del paciente de fisioterapia */}
            {formData.patient_id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {loadingContext ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cargando contexto clínico...</span>
                  </div>
                ) : patientContext ? (
                  <div className="space-y-3">
                    {/* Alerta de contraindicaciones */}
                    {patientContext.medicalRecord?.contraindications && 
                     patientContext.medicalRecord.contraindications.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">Contraindicaciones:</p>
                          <p className="text-sm text-amber-700">
                            {patientContext.medicalRecord.contraindications.join(', ')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Diagnóstico clínico */}
                    {patientContext.medicalRecord?.clinical_diagnosis && (
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Diagnóstico:</p>
                          <p className="text-sm text-gray-600">
                            {patientContext.medicalRecord.clinical_diagnosis}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Plan de tratamiento */}
                    {patientContext.treatmentPlan && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Plan de Tratamiento: {patientContext.treatmentPlan.plan_type}
                          </p>
                          <p className="text-sm text-gray-600">
                            Sesiones: {patientContext.treatmentPlan.sessions_completed} / {patientContext.treatmentPlan.total_sessions_prescribed}
                          </p>
                          <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-full bg-teal-500 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  (patientContext.treatmentPlan.sessions_completed / 
                                   patientContext.treatmentPlan.total_sessions_prescribed) * 100,
                                  100
                                )}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sesiones recientes */}
                    {patientContext.recentSessions.length > 0 && (
                      <div className="text-sm text-gray-500">
                        Última sesión: {new Date(patientContext.recentSessions[0].session_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No hay registro médico de fisioterapia activo para este paciente
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Datos Específicos de Fisioterapia */}
        <div className="card border-teal-200 bg-teal-50/30">
          <div className="card-header bg-teal-100 border-teal-200">
            <h2 className="text-lg font-semibold text-teal-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-teal-200 flex items-center justify-center text-sm">2</span>
              Datos de Fisioterapia
            </h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Región corporal */}
            <div className="md:col-span-2">
              <label className="label mb-2">Región Corporal a Tratar *</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {bodyRegions.map((region) => (
                  <button
                    key={region.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, body_region: region.value }))}
                    className={`p-2 text-sm rounded-lg border-2 transition-all ${
                      formData.body_region === region.value
                        ? 'border-teal-500 bg-teal-100 text-teal-800'
                        : 'border-gray-200 hover:border-teal-300 text-gray-700'
                    }`}
                  >
                    {region.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nivel de dolor */}
            <div>
              <label className="label mb-2">Nivel de Dolor Actual (0-10)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  name="pain_level"
                  min="0"
                  max="10"
                  value={formData.pain_level}
                  onChange={handleChange}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <span className="text-3xl font-bold text-gray-900 w-14 text-center bg-white rounded-lg py-2 shadow-sm">
                  {formData.pain_level}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                <span>Sin dolor</span>
                <span>Dolor moderado</span>
                <span>Dolor máximo</span>
              </div>
            </div>

            {/* Tipo de terapia */}
            <div>
              <label className="label mb-2">Modalidad de Terapia</label>
              <div className="grid grid-cols-1 gap-2">
                {therapyTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, therapy_type: type.value }))}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      formData.therapy_type === type.value
                        ? 'border-teal-500 bg-teal-100'
                        : 'border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span className="font-medium text-gray-700">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Evaluación inicial */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="requires_initial_assessment"
                id="requires_initial_assessment"
                checked={formData.requires_initial_assessment}
                onChange={handleChange}
                className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <label
                htmlFor="requires_initial_assessment"
                className="ml-3 text-gray-700"
              >
                <span className="font-medium">Es evaluación inicial</span>
                <p className="text-sm text-gray-500">Primera sesión de valoración del paciente</p>
              </label>
            </div>

            {/* Número de sesión */}
            <div>
              <label className="label mb-2">Número de Sesión</label>
              <input
                type="number"
                name="session_number"
                value={formData.session_number}
                onChange={handleChange}
                className="input"
                placeholder="Ej. 1, 2, 3..."
                min="1"
              />
              {patientContext?.treatmentPlan && (
                <p className="text-xs text-gray-500 mt-1">
                  Próxima sesión del plan: {patientContext.treatmentPlan.sessions_completed + 1}
                </p>
              )}
            </div>

            {/* Técnicas a aplicar */}
            <div className="md:col-span-2">
              <label className="label mb-2">Técnicas a Aplicar</label>
              <div className="flex flex-wrap gap-2">
                {techniques.map((technique) => (
                  <button
                    key={technique}
                    type="button"
                    onClick={() => handleTechniqueToggle(technique)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      formData.techniques.includes(technique)
                        ? 'bg-teal-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {technique}
                  </button>
                ))}
              </div>
              {formData.techniques.length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Seleccionadas: {formData.techniques.join(', ')}
                </p>
              )}
            </div>

            {/* Notas del terapeuta */}
            <div className="md:col-span-2">
              <label className="label mb-2">Notas del Terapeuta</label>
              <textarea
                name="therapist_notes"
                value={formData.therapist_notes}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Observaciones específicas para esta sesión, hallazgos importantes, respuesta del paciente..."
              />
            </div>
          </div>
        </div>

        {/* Programación de la Cita */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">3</span>
              Programación de la Cita
            </h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
            <DateTimePicker
              label="Fecha y Hora de Inicio *"
              value={formData.start_time}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, start_time: value }))
              }
              required
            />
            <DateTimePicker
              label="Fecha y Hora de Fin *"
              value={formData.end_time}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, end_time: value }))
              }
              required
            />
            <div className="md:col-span-2">
              <label className="label mb-2">Motivo de la Cita</label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="input"
                placeholder="Ej. Rehabilitación post-operatoria, Dolor crónico lumbar..."
              />
            </div>
          </div>
        </div>

        {/* Asignación */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">4</span>
              Asignación
            </h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label mb-2">Fisioterapeuta Asignado</label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar fisioterapeuta...</option>
                {physiotherapists.map((d) => (
                  <option key={d.id} value={d.id}>
                    Ft. {d.full_name}
                    {d.specialty && ` - ${d.specialty}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-2">Sala de Tratamiento</label>
              <select
                name="room_id"
                value={formData.room_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar sala...</option>
                {treatmentRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_number}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notas Generales */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Notas Adicionales</h2>
          </div>
          <div className="card-body">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input min-h-[80px]"
              placeholder="Notas generales sobre la cita..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href={
              mode === 'create'
                ? '/dashboard/appointments'
                : `/dashboard/appointments/${appointmentId}`
            }
            className="btn-secondary btn-md"
          >
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn-primary btn-md">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Agendar Sesión' : 'Guardar Cambios'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
