'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Loader2, Calendar, Clock, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface AppointmentInfo {
  id: string;
  patient_id: string;
  patient_full_name: string;
  patient_dni: string;
  start_time: string;
  department_name: string;
  reason: string;
}

export default function NewPhysioSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo | null>(null);
  const [isInitialSession, setIsInitialSession] = useState(false);
  const [isReassessment, setIsReassessment] = useState(false);

  const [formData, setFormData] = useState({
    session_date: '',
    session_time: '',
    duration_minutes: '45',
    pain_level: 0,
    pain_location: '',
    body_region: '',
    muscle_group: '',
    muscle_strength_grade: 5,
    rom_affected: '',
    modality: '',
    techniques_applied: [] as string[],
    subjective: '',
    objective: '',
    analysis: '',
    plan: '',
  });

  const techniqueOptions = [
    'Masaje terapéutico',
    'Electroterapia TENS',
    'Electroterapia Ultrasound',
    'Ejercicio terapéutico',
    'Estiramientos',
    'Fortalecimiento',
    'Terapia manual',
    'Hidroterapia',
    'Tracción',
    'Cryoterapia',
    'Termoterapia',
    'Vendaje neuromuscular',
    'Punción seca',
    'Movilización articular',
    'Entrenamiento funcional',
  ];

  const modalityOptions = [
    'Modalidad 1',
    'Modalidad 2',
    'Modalidad 3',
  ];

  // Cargar información de la cita si viene de una cita
  useEffect(() => {
    const loadAppointmentData = async () => {
      const appointmentId = searchParams.get('appointment_id');
      if (appointmentId) {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_id,
            start_time,
            department_name,
            reason,
            patients!inner(full_name, dni)
          `)
          .eq('id', appointmentId)
          .single();

        if (!error && data) {
          setAppointmentInfo({
            id: data.id,
            patient_id: data.patient_id,
            patient_full_name: (data.patients as any)?.full_name || 'Unknown',
            patient_dni: (data.patients as any)?.dni || 'N/A',
            start_time: data.start_time,
            department_name: data.department_name,
            reason: data.reason,
          });

          // Pre-llenar fecha y hora de la cita
          const appointmentDate = new Date(data.start_time);
          setFormData(prev => ({
            ...prev,
            session_date: appointmentDate.toISOString().split('T')[0],
            session_time: appointmentDate.toTimeString().slice(0, 5),
          }));
        }
      }
    };

    loadAppointmentData();
  }, [searchParams, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleTechniqueToggle = (technique: string) => {
    setFormData(prev => ({
      ...prev,
      techniques_applied: prev.techniques_applied.includes(technique)
        ? prev.techniques_applied.filter(t => t !== technique)
        : [...prev.techniques_applied, technique],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Determinar el número de sesión
      let sessionNumber = 1;
      if (appointmentInfo?.patient_id) {
        const { count } = await supabase
          .from('physio_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', appointmentInfo.patient_id);

        sessionNumber = (count || 0) + 1;
      }

      // Crear la sesión de fisioterapia
      const { data: sessionData, error: sessionError } = await supabase
        .from('physio_sessions')
        .insert({
          appointment_id: appointmentInfo?.id || null,
          patient_id: appointmentInfo?.patient_id || null,
          therapist_id: user.id,
          session_date: formData.session_date,
          session_time: formData.session_time,
          duration_minutes: parseInt(formData.duration_minutes),
          is_initial_session: isInitialSession,
          is_reassessment: isReassessment,
          pain_level: formData.pain_level,
          pain_location: formData.pain_location,
          body_region: formData.body_region,
          muscle_group: formData.muscle_group,
          muscle_strength_grade: formData.muscle_strength_grade,
          rom_affected: formData.rom_affected,
          modality: formData.modality,
          techniques_applied: formData.techniques_applied,
          subjective: formData.subjective,
          objective: formData.objective,
          analysis: formData.analysis,
          plan: formData.plan,
          session_number: sessionNumber,
          status: 'completed', // La sesión se crea como completada directamente
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      // Si viene de una cita, actualizar la cita a completada
      if (appointmentInfo?.id && sessionData) {
        await supabase
          .from('appointments')
          .update({
            status: 'completed',
            physio_session_id: sessionData.id,
            physio_status: 'completed',
          })
          .eq('id', appointmentInfo.id);
      }

      // Redireccionar al dashboard de fisioterapia
      router.push('/dashboard/physiotherapy');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/physiotherapy"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Sesión de Fisioterapia</h1>
          <p className="text-gray-500 mt-1">Documentar una sesión de tratamiento fisioterapéutico</p>
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
        {/* Información de la Cita (si viene de una cita) */}
        {appointmentInfo && (
          <div className="card border-purple-200 bg-purple-50">
            <div className="card-header bg-purple-100">
              <h2 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Información de la Cita
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Paciente</p>
                  <p className="font-medium text-gray-900">{appointmentInfo.patient_full_name}</p>
                  <p className="text-sm text-gray-500">DNI: {appointmentInfo.patient_dni}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha y Hora</p>
                  <p className="font-medium text-gray-900">
                    {new Date(appointmentInfo.start_time).toLocaleDateString('es-ES')} - {new Date(appointmentInfo.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información de la Sesión */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Información de la Sesión</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Fecha de la Sesión *</label>
              <input
                type="date"
                name="session_date"
                value={formData.session_date}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Hora de la Sesión *</label>
              <input
                type="time"
                name="session_time"
                value={formData.session_time}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Duración (minutos)</label>
              <select
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                className="input"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
                <option value="90">90 minutos</option>
              </select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInitialSession}
                  onChange={(e) => setIsInitialSession(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Sesión Inicial (Evaluación)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isReassessment}
                  onChange={(e) => setIsReassessment(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Reevaluación</span>
              </label>
            </div>
          </div>
        </div>

        {/* Datos Clínicos */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Datos Clínicos</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Nivel de Dolor (EVA 0-10)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  name="pain_level"
                  min="0"
                  max="10"
                  value={formData.pain_level}
                  onChange={handleChange}
                  className="flex-1"
                />
                <span className={`w-10 h-10 flex items-center justify-center rounded-full font-bold ${
                  formData.pain_level >= 7 ? 'bg-red-500 text-white' :
                  formData.pain_level >= 4 ? 'bg-yellow-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {formData.pain_level}
                </span>
              </div>
            </div>
            <div>
              <label className="label mb-1.5">Ubicación del Dolor</label>
              <input
                type="text"
                name="pain_location"
                value={formData.pain_location}
                onChange={handleChange}
                className="input"
                placeholder="Ej. Lumbar, cervical, hombro derecho..."
              />
            </div>
            <div>
              <label className="label mb-1.5">Región Corporal Afectada</label>
              <input
                type="text"
                name="body_region"
                value={formData.body_region}
                onChange={handleChange}
                className="input"
                placeholder="Ej. Columna lumbar, extremidad superior..."
              />
            </div>
            <div>
              <label className="label mb-1.5">Grupo Muscular</label>
              <input
                type="text"
                name="muscle_group"
                value={formData.muscle_group}
                onChange={handleChange}
                className="input"
                placeholder="Ej. Deltoides, cuádriceps..."
              />
            </div>
            <div>
              <label className="label mb-1.5">Grado de Fuerza Muscular (0-5)</label>
              <select
                name="muscle_strength_grade"
                value={formData.muscle_strength_grade}
                onChange={handleChange}
                className="input"
              >
                <option value="0">0 - Parálisis total</option>
                <option value="1">1 - Contracción visible sin movimiento</option>
                <option value="2">2 - Movimiento con gravedad eliminada</option>
                <option value="3">3 - Movimiento contra gravedad</option>
                <option value="4">4 - Movimiento contra resistencia</option>
                <option value="5">5 - Fuerza normal</option>
              </select>
            </div>
            <div>
              <label className="label mb-1.5">Rango de Movimiento Afectado</label>
              <input
                type="text"
                name="rom_affected"
                value={formData.rom_affected}
                onChange={handleChange}
                className="input"
                placeholder="Ej. Flexión 90°, Extensión limitada..."
              />
            </div>
          </div>
        </div>

        {/* Técnicas Aplicadas */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Técnicas Aplicadas</h2>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap gap-2">
              {techniqueOptions.map((technique) => (
                <button
                  key={technique}
                  type="button"
                  onClick={() => handleTechniqueToggle(technique)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.techniques_applied.includes(technique)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {technique}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notas SOAP */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Notas SOAP</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label mb-1.5">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">S</span>
                  Subjetivo
                </span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Qué refiere el paciente: síntomas, dolor, evolución, limitaciones funcionales</p>
              <textarea
                name="subjective"
                value={formData.subjective}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="El paciente refiere..."
              />
            </div>

            <div>
              <label className="label mb-1.5">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">O</span>
                  Objetivo
                </span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Hallazgos clínicos objetivos: mediciones, pruebas, observación</p>
              <textarea
                name="objective"
                value={formData.objective}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Durante la evaluación se observó..."
              />
            </div>

            <div>
              <label className="label mb-1.5">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold">A</span>
                  Análisis
                </span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Interpretación clínica del fisioterapeuta</p>
              <textarea
                name="analysis"
                value={formData.analysis}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Basado en los hallazgos, el análisis indica..."
              />
            </div>

            <div>
              <label className="label mb-1.5">
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">P</span>
                  Plan
                </span>
              </label>
              <p className="text-xs text-gray-500 mb-2">Plan de tratamiento para próximas sesiones</p>
              <textarea
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Para la próxima sesión se计划a..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/physiotherapy" className="btn-secondary btn-md">
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
                <Save className="w-4 h-4 mr-2" />
                Guardar Sesión
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
