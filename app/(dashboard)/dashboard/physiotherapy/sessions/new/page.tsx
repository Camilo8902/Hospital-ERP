'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calendar, 
  Clock, 
  Activity, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Trash2,
  FlaskConical,
  Dumbbell,
  Settings,
  ChevronDown,
  X,
  Stethoscope
} from 'lucide-react';
import Link from 'next/link';
import { getPhysioAppointmentById } from '@/lib/actions/physiotherapy';

// Types for catalogs
interface TreatmentType {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

interface Technique {
  id: string;
  name: string;
  description: string | null;
  treatment_type_id: string;
  physio_treatment_types?: { name: string };
  default_duration_minutes: number | null;
  parameters_schema: Record<string, unknown> | null;
}

interface Equipment {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  status: string;
  specifications: Record<string, unknown> | null;
}

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  body_region: string | null;
  difficulty_level: string | null;
  target_muscle_group: string[] | null;
}

// Selected treatment with parameters
interface SelectedTreatment {
  type: 'treatment_type' | 'technique' | 'equipment' | 'exercise';
  id: string;
  name: string;
  duration_minutes: number;
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
  notes: string;
}

// Función helper del lado del cliente para obtener cita de fisioterapia
async function fetchPhysioAppointment(appointmentId: string) {
  const result = await getPhysioAppointmentById(appointmentId);
  if (result.success && result.data) {
    return { data: result.data, error: null };
  }
  return { data: null, error: result.error };
}

// API functions
async function fetchTechniques(): Promise<Technique[]> {
  try {
    const res = await fetch('/api/physio-catalogs/techniques');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchEquipment(): Promise<Equipment[]> {
  try {
    const res = await fetch('/api/physio-catalogs/equipment');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchTreatmentTypes(): Promise<TreatmentType[]> {
  try {
    const res = await fetch('/api/physio-catalogs/treatment-types');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchExercises(): Promise<Exercise[]> {
  try {
    const res = await fetch('/api/physio-catalogs/exercises');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

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
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo | null>(null);
  const [isInitialSession, setIsInitialSession] = useState(false);
  const [isReassessment, setIsReassessment] = useState(false);
  
  // Catalog data
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // Selected treatments
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatment[]>([]);
  
  // UI state
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentType, setTreatmentType] = useState<'treatment_type' | 'technique' | 'equipment' | 'exercise'>('treatment_type');

  interface FormData {
  session_date: string;
  session_time: string;
  duration_minutes: string;
  pain_level: number;
  pain_location: string;
  body_region: string;
  muscle_group: string;
  muscle_strength_grade: number;
  rom_affected: string;
  subjective: string;
  objective: string;
  analysis: string;
  plan: string;
}

const [formData, setFormData] = useState<FormData>({
    session_date: '',
    session_time: '',
    duration_minutes: '45',
    pain_level: 0,
    pain_location: '',
    body_region: '',
    muscle_group: '',
    muscle_strength_grade: 5,
    rom_affected: '',
    subjective: '',
    objective: '',
    analysis: '',
    plan: '',
  });

  // Load catalog data
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const [tt, t, e, ex] = await Promise.all([
          fetchTreatmentTypes(),
          fetchTechniques(),
          fetchEquipment(),
          fetchExercises()
        ]);
        setTreatmentTypes(tt);
        setTechniques(t);
        setEquipment(e.filter(item => item.status === 'available'));
        setExercises(ex);
      } catch (err) {
        console.error('Error loading catalogs:', err);
      } finally {
        setLoadingCatalogs(false);
      }
    }
    loadCatalogs();
  }, []);

  // Load appointment data
  useEffect(() => {
    const loadAppointmentData = async () => {
      const appointmentId = searchParams.get('appointment_id');
      if (appointmentId) {
        const { data: appointmentData, error } = await fetchPhysioAppointment(appointmentId);
        if (!error && appointmentData) {
          setAppointmentInfo(appointmentData);
          const appointmentDate = new Date(appointmentData.start_time);
          setFormData(prev => ({
            ...prev,
            session_date: appointmentDate.toISOString().split('T')[0],
            session_time: appointmentDate.toTimeString().slice(0, 5),
          }));
        }
      }
    };
    loadAppointmentData();
  }, [searchParams]);

  const handleChange = (e: any) => {
    const { name, value, type } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const addTreatment = (item: Technique | Equipment | Exercise, type: 'technique' | 'equipment' | 'exercise') => {
    let duration = 15;
    let name = '';
    
    if (type === 'technique' || type === 'exercise') {
      const t = item as Technique;
      duration = t.default_duration_minutes || 15;
      name = t.name;
    } else {
      const e = item as Equipment;
      duration = 10;
      name = `${e.brand || ''} ${e.model || ''}`.trim() || e.name;
    }
    
    const newTreatment: SelectedTreatment = {
      type,
      id: item.id,
      name,
      duration_minutes: duration,
      parameters: {},
      results: {},
      notes: '',
    };
    
    setSelectedTreatments((prev: SelectedTreatment[]) => [...prev, newTreatment]);
    setShowTreatmentModal(false);
  };

  const removeTreatment = (index: number) => {
    setSelectedTreatments((prev: SelectedTreatment[]) => prev.filter((_, i) => i !== index));
  };

  const updateTreatment = (index: number, updates: Partial<SelectedTreatment>) => {
    setSelectedTreatments((prev: SelectedTreatment[]) => prev.map((t: SelectedTreatment, i: number) => 
      i === index ? { ...t, ...updates } : t
    ));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Calculate total duration from treatments
      const totalTreatmentDuration = selectedTreatments.reduce((sum: number, t: SelectedTreatment) => sum + t.duration_minutes, 0);
      const finalDuration = totalTreatmentDuration > 0 ? totalTreatmentDuration : parseInt(formData.duration_minutes);

      // Create session with treatments as JSON
      const { data: sessionData, error: sessionError } = await supabase
        .from('physio_sessions')
        .insert({
          appointment_id: appointmentInfo?.id || null,
          patient_id: appointmentInfo?.patient_id || null,
          therapist_id: user.id,
          session_date: formData.session_date,
          session_time: formData.session_time,
          duration_minutes: finalDuration,
          is_initial_session: isInitialSession,
          is_reassessment: isReassessment,
          pain_level: formData.pain_level,
          pain_location: formData.pain_location,
          body_region: formData.body_region,
          muscle_group: formData.muscle_group,
          muscle_strength_grade: formData.muscle_strength_grade,
          rom_affected: formData.rom_affected,
          techniques_applied: selectedTreatments.filter((t: SelectedTreatment) => t.type === 'technique').map((t: SelectedTreatment) => t.name),
          exercises_applied: selectedTreatments.filter((t: SelectedTreatment) => t.type === 'exercise').map((t: SelectedTreatment) => t.name),
          equipment_used: selectedTreatments.filter((t: SelectedTreatment) => t.type === 'equipment').map((t: SelectedTreatment) => t.name),
          treatments_detail: selectedTreatments,
          subjective: formData.subjective,
          objective: formData.objective,
          analysis: formData.analysis,
          plan: formData.plan,
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (appointmentInfo?.id && sessionData) {
        await supabase
          .from('appointments')
          .update({
            status: 'completed',
            physio_session_id: sessionData.id,
          })
          .eq('id', appointmentInfo.id);
      }

      router.push('/dashboard/physiotherapy');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la sesión');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCatalogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando catálogos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
          <p className="text-gray-500 mt-1">Documentar una sesión con tratamientos, equipos y ejercicios</p>
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
        {/* Appointment Info */}
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

        {/* Session Info */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Información de la Sesión</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label mb-1.5">Fecha *</label>
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
              <label className="label mb-1.5">Hora *</label>
              <input
                type="time"
                name="session_time"
                value={formData.session_time}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInitialSession}
                  onChange={(e) => setIsInitialSession(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700">Sesión Inicial</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isReassessment}
                  onChange={(e) => setIsReassessment(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700">Reevaluación</span>
              </label>
            </div>
          </div>
        </div>

        {/* Clinical Data */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Evaluación Clínica</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label mb-1.5">Nivel de Dolor (EVA 0-10)</label>
              <div className="flex items-center gap-3">
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
                placeholder="Ej. Lumbar, cervical..."
              />
            </div>
            <div>
              <label className="label mb-1.5">Región Corporal</label>
              <select
                name="body_region"
                value={formData.body_region}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar...</option>
                <option value="cervical">Cervical</option>
                <option value="lumbar">Lumbar</option>
                <option value="shoulder">Hombro</option>
                <option value="knee">Rodilla</option>
                <option value="hip">Cadera</option>
                <option value="ankle">Tobillo</option>
                <option value="elbow">Codo</option>
                <option value="wrist">Muñeca</option>
              </select>
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
              <label className="label mb-1.5">Fuerza Muscular (0-5)</label>
              <select
                name="muscle_strength_grade"
                value={formData.muscle_strength_grade}
                onChange={handleChange}
                className="input"
              >
                <option value="0">0 - Parálisis</option>
                <option value="1">1 - Contracción</option>
                <option value="2">2 - Gravedad eliminada</option>
                <option value="3">3 - Contra gravedad</option>
                <option value="4">4 - Resistencia</option>
                <option value="5">5 - Normal</option>
              </select>
            </div>
            <div>
              <label className="label mb-1.5">ROM Afectado</label>
              <input
                type="text"
                name="rom_affected"
                value={formData.rom_affected}
                onChange={handleChange}
                className="input"
                placeholder="Ej. Flexión 90°..."
              />
            </div>
          </div>
        </div>

        {/* Treatments Applied */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Tratamientos Aplicados
            </h2>
            <button
              type="button"
              onClick={() => setShowTreatmentModal(true)}
              className="btn btn-primary btn-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Agregar Tratamiento
            </button>
          </div>
          <div className="card-body">
            {selectedTreatments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No hay tratamientos agregados</p>
                <p className="text-sm">Agrega técnicas, equipos o ejercicios utilizados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedTreatments.map((treatment, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      treatment.type === 'technique' ? 'bg-blue-100 text-blue-600' :
                      treatment.type === 'equipment' ? 'bg-green-100 text-green-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {treatment.type === 'technique' ? <Activity className="w-5 h-5" /> :
                       treatment.type === 'equipment' ? <FlaskConical className="w-5 h-5" /> :
                       <Dumbbell className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{treatment.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{treatment.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={treatment.duration_minutes}
                            onChange={(e) => updateTreatment(index, { duration_minutes: parseInt(e.target.value) || 0 })}
                            className="input w-20 text-center text-sm"
                            min="1"
                          />
                          <span className="text-sm text-gray-500">min</span>
                          <button
                            type="button"
                            onClick={() => removeTreatment(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={treatment.notes}
                        onChange={(e) => updateTreatment(index, { notes: e.target.value })}
                        className="input mt-2 text-sm"
                        placeholder="Notas del tratamiento..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SOAP Notes */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Notas SOAP</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">S</span>
                Subjetivo
              </label>
              <textarea
                name="subjective"
                value={formData.subjective}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Qué refiere el paciente..."
              />
            </div>
            <div>
              <label className="label mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">O</span>
                Objetivo
              </label>
              <textarea
                name="objective"
                value={formData.objective}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Hallazgos objetivos..."
              />
            </div>
            <div>
              <label className="label mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold">A</span>
                Análisis
              </label>
              <textarea
                name="analysis"
                value={formData.analysis}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Interpretación clínica..."
              />
            </div>
            <div>
              <label className="label mb-1.5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">P</span>
                Plan
              </label>
              <textarea
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Plan de tratamiento..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/physiotherapy" className="btn btn-secondary">
            Cancelar
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Sesión
          </button>
        </div>
      </form>

      {/* Treatment Modal */}
      {showTreatmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Agregar Tratamiento</h2>
              <button onClick={() => setShowTreatmentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {/* Treatment Type Tabs */}
              <div className="flex gap-2 mb-4">
                {[
                  { id: 'technique', label: 'Técnicas', icon: Activity },
                  { id: 'equipment', label: 'Equipos', icon: FlaskConical },
                  { id: 'exercise', label: 'Ejercicios', icon: Dumbbell },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setTreatmentType(type.id as 'technique' | 'equipment' | 'exercise')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      treatmentType === type.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Treatment List */}
              <div className="space-y-2">
                {treatmentType === 'technique' && techniques.map((technique) => (
                  <button
                    key={technique.id}
                    type="button"
                    onClick={() => addTreatment(technique, 'technique')}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-gray-900">{technique.name}</p>
                    <p className="text-sm text-gray-500">{technique.physio_treatment_types?.name}</p>
                  </button>
                ))}
                {treatmentType === 'equipment' && equipment.map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => addTreatment(eq, 'equipment')}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-gray-900">{eq.name}</p>
                    <p className="text-sm text-gray-500">{eq.brand} {eq.model}</p>
                  </button>
                ))}
                {treatmentType === 'exercise' && exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => addTreatment(exercise, 'exercise')}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-gray-900">{exercise.name}</p>
                    <p className="text-sm text-gray-500">
                      {exercise.body_region} • {exercise.difficulty_level}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
