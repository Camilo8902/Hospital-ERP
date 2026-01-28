'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Activity, 
  AlertCircle,
  Plus,
  Trash2,
  FlaskConical,
  Dumbbell,
  ChevronDown,
  X,
  Stethoscope,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { getPhysioAppointmentById } from '@/lib/actions/physiotherapy';

// Tipos de catálogo
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
}

interface Equipment {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  status: string;
}

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  body_region: string | null;
  difficulty_level: string | null;
  target_muscle_group: string[] | null;
}

// Tratamiento seleccionado con elementos hijos
interface SelectedTreatment {
  id: string;
  treatmentTypeId: string;
  treatmentTypeName: string;
  techniques: TreatmentElement[];
  equipment: TreatmentElement[];
  exercises: TreatmentElement[];
  notes: string;
}

// Elemento individual dentro de un tratamiento
interface TreatmentElement {
  id: string;
  elementType: 'technique' | 'equipment' | 'exercise';
  elementId: string;
  name: string;
  duration_minutes: number;
  parameters: Record<string, unknown>;
  results: Record<string, unknown>;
  notes: string;
}

// Información de la cita
interface AppointmentInfo {
  id: string;
  patient_id: string;
  patient_full_name: string;
  patient_dni: string;
  start_time: string;
  department_name: string;
  reason: string;
}

// Funciones API
async function fetchTreatmentTypes(): Promise<TreatmentType[]> {
  try {
    const res = await fetch('/api/physio-catalogs/treatment-types');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchTechniques(treatmentTypeId?: string): Promise<Technique[]> {
  try {
    const url = treatmentTypeId 
      ? `/api/physio-catalogs/techniques?treatment_type_id=${treatmentTypeId}`
      : '/api/physio-catalogs/techniques';
    const res = await fetch(url);
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
    const data = await res.json();
    return data.filter((e: Equipment) => e.status === 'available');
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

async function fetchPhysioAppointment(appointmentId: string) {
  const result = await getPhysioAppointmentById(appointmentId);
  if (result.success && result.data) {
    return { data: result.data, error: null };
  }
  return { data: null, error: result.error };
}

export default function NewPhysioSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo | null>(null);
  
  // Datos de catálogos
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  
  // Tratamientos seleccionados (jerárquicos)
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatment[]>([]);
  
  // Elementos disponibles para agregar (filtrados por tipo de tratamiento)
  const [availableTechniques, setAvailableTechniques] = useState<Technique[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  
  // UI State
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [selectedTreatmentType, setSelectedTreatmentType] = useState<TreatmentType | null>(null);
  const [activeTab, setActiveTab] = useState<'techniques' | 'equipment' | 'exercises'>('techniques');
  
  // Form data
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

  // Cargar datos de catálogos
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
        setEquipment(e);
        setExercises(ex);
      } catch (err) {
        console.error('Error loading catalogs:', err);
      } finally {
        setLoadingCatalogs(false);
      }
    }
    loadCatalogs();
  }, []);

  // Cargar datos de la cita
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

  // Abrir modal para agregar tipo de tratamiento
  const openTreatmentModal = () => {
    setShowTreatmentModal(true);
    setSelectedTreatmentType(null);
    setActiveTab('techniques');
  };

  // Seleccionar tipo de tratamiento y cargar elementos relacionados
  const selectTreatmentType = (tt: TreatmentType) => {
    setSelectedTreatmentType(tt);
    // Cargar técnicas filtradas por tipo de tratamiento
    fetchTechniques(tt.id).then(setAvailableTechniques);
    // Equipment y exercises no están filtrados por tipo de tratamiento
    setAvailableEquipment(equipment);
    setAvailableExercises(exercises);
  };

  // Agregar tipo de tratamiento a la sesión
  const addTreatmentType = () => {
    if (!selectedTreatmentType) return;
    
    const newTreatment: SelectedTreatment = {
      id: crypto.randomUUID(),
      treatmentTypeId: selectedTreatmentType.id,
      treatmentTypeName: selectedTreatmentType.name,
      techniques: [],
      equipment: [],
      exercises: [],
      notes: '',
    };
    
    setSelectedTreatments(prev => [...prev, newTreatment]);
    setShowTreatmentModal(false);
    setSelectedTreatmentType(null);
  };

  // Agregar técnica al tratamiento seleccionado
  const addTechnique = (technique: Technique, treatmentId: string) => {
    setSelectedTreatments(prev => prev.map(t => {
      if (t.id === treatmentId) {
        return {
          ...t,
          techniques: [...t.techniques, {
            id: crypto.randomUUID(),
            elementType: 'technique',
            elementId: technique.id,
            name: technique.name,
            duration_minutes: technique.default_duration_minutes || 15,
            parameters: {},
            results: {},
            notes: '',
          }]
        };
      }
      return t;
    }));
  };

  // Agregar equipo al tratamiento seleccionado
  const addEquipmentItem = (eq: Equipment, treatmentId: string) => {
    setSelectedTreatments(prev => prev.map(t => {
      if (t.id === treatmentId) {
        return {
          ...t,
          equipment: [...t.equipment, {
            id: crypto.randomUUID(),
            elementType: 'equipment',
            elementId: eq.id,
            name: `${eq.brand || ''} ${eq.model || ''}`.trim() || eq.name,
            duration_minutes: 10,
            parameters: {},
            results: {},
            notes: '',
          }]
        };
      }
      return t;
    }));
  };

  // Agregar ejercicio al tratamiento seleccionado
  const addExerciseItem = (ex: Exercise, treatmentId: string) => {
    setSelectedTreatments(prev => prev.map(t => {
      if (t.id === treatmentId) {
        return {
          ...t,
          exercises: [...t.exercises, {
            id: crypto.randomUUID(),
            elementType: 'exercise',
            elementId: ex.id,
            name: ex.name,
            duration_minutes: 15,
            parameters: {},
            results: {},
            notes: '',
          }]
        };
      }
      return t;
    }));
  };

  // Eliminar tipo de tratamiento
  const removeTreatment = (treatmentId: string) => {
    setSelectedTreatments(prev => prev.filter(t => t.id !== treatmentId));
  };

  // Eliminar elemento de un tratamiento
  const removeElement = (treatmentId: string, elementId: string, elementType: 'technique' | 'equipment' | 'exercise') => {
    setSelectedTreatments(prev => prev.map(t => {
      if (t.id === treatmentId) {
        return {
          ...t,
          [elementType === 'technique' ? 'techniques' : elementType === 'equipment' ? 'equipment' : 'exercises']: 
            t[elementType === 'technique' ? 'techniques' : elementType === 'equipment' ? 'equipment' : 'exercises'].filter(e => e.id !== elementId)
        };
      }
      return t;
    }));
  };

  // Actualizar notas de un tratamiento
  const updateTreatmentNotes = (treatmentId: string, notes: string) => {
    setSelectedTreatments(prev => prev.map(t => {
      if (t.id === treatmentId) {
        return { ...t, notes };
      }
      return t;
    }));
  };

  // Calcular duración total
  const calculateTotalDuration = () => {
    let total = 0;
    selectedTreatments.forEach(t => {
      t.techniques.forEach(el => total += el.duration_minutes);
      t.equipment.forEach(el => total += el.duration_minutes);
      t.exercises.forEach(el => total += el.duration_minutes);
    });
    return total > 0 ? total : parseInt(formData.duration_minutes);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const finalDuration = calculateTotalDuration();

      // Preparar datos para guardar
      const techniquesApplied: string[] = [];
      const exercisesApplied: string[] = [];
      const equipmentUsed: string[] = [];
      const treatmentsDetail: any[] = [];

      selectedTreatments.forEach(t => {
        treatmentsDetail.push({
          treatment_type_id: t.treatmentTypeId,
          treatment_type_name: t.treatmentTypeName,
          notes: t.notes,
          techniques: t.techniques.map(el => ({ id: el.elementId, name: el.name, duration: el.duration_minutes })),
          equipment: t.equipment.map(el => ({ id: el.elementId, name: el.name, duration: el.duration_minutes })),
          exercises: t.exercises.map(el => ({ id: el.elementId, name: el.name, duration: el.duration_minutes })),
        });
        
        t.techniques.forEach(el => techniquesApplied.push(el.name));
        t.equipment.forEach(el => equipmentUsed.push(el.name));
        t.exercises.forEach(el => exercisesApplied.push(el.name));
      });

      const { data: sessionData, error: sessionError } = await supabase
        .from('physio_sessions')
        .insert({
          appointment_id: appointmentInfo?.id || null,
          patient_id: appointmentInfo?.patient_id || null,
          therapist_id: user.id,
          session_date: formData.session_date,
          session_time: formData.session_time,
          duration_minutes: finalDuration,
          pain_level: formData.pain_level,
          pain_location: formData.pain_location,
          body_region: formData.body_region,
          muscle_group: formData.muscle_group,
          muscle_strength_grade: formData.muscle_strength_grade,
          rom_affected: formData.rom_affected,
          techniques_applied: techniquesApplied,
          exercises_applied: exercisesApplied,
          equipment_used: equipmentUsed,
          treatments_detail: treatmentsDetail,
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/physiotherapy" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Appointment Info Card */}
        <div className="card border-purple-200 bg-purple-50">
          <div className="card-header bg-purple-100">
            <h2 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              Información de la Cita
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Paciente</p>
                <p className="font-medium text-gray-900">{appointmentInfo?.patient_full_name || 'Sin cita seleccionada'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fecha y Hora</p>
                <p className="font-medium text-gray-900">
                  {appointmentInfo ? new Date(appointmentInfo.start_time).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Treatments Section */}
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Tratamientos Aplicados
            </h2>
            <button
              type="button"
              onClick={openTreatmentModal}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Tratamiento
            </button>
          </div>
          <div className="card-body">
            {selectedTreatments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay tratamientos agregados</p>
                <p className="text-sm">Haz clic en "Agregar Tratamiento" para comenzar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedTreatments.map((treatment) => (
                  <div key={treatment.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{treatment.treatmentTypeName}</h3>
                        <p className="text-sm text-gray-500">
                          {treatment.techniques.length + treatment.equipment.length + treatment.exercises.length} elementos
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTreatment(treatment.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Técnicas */}
                    {treatment.techniques.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Técnicas
                        </h4>
                        <div className="space-y-1">
                          {treatment.techniques.map((el) => (
                            <div key={el.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                              <span>{el.name} ({el.duration_minutes} min)</span>
                              <button
                                type="button"
                                onClick={() => removeElement(treatment.id, el.id, 'technique')}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Equipos */}
                    {treatment.equipment.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <FlaskConical className="w-4 h-4" /> Equipos
                        </h4>
                        <div className="space-y-1">
                          {treatment.equipment.map((el) => (
                            <div key={el.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                              <span>{el.name} ({el.duration_minutes} min)</span>
                              <button
                                type="button"
                                onClick={() => removeElement(treatment.id, el.id, 'equipment')}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Ejercicios */}
                    {treatment.exercises.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Dumbbell className="w-4 h-4" /> Ejercicios
                        </h4>
                        <div className="space-y-1">
                          {treatment.exercises.map((el) => (
                            <div key={el.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                              <span>{el.name} ({el.duration_minutes} min)</span>
                              <button
                                type="button"
                                onClick={() => removeElement(treatment.id, el.id, 'exercise')}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Notas del tratamiento */}
                    <div>
                      <label className="text-sm text-gray-600">Notas</label>
                      <textarea
                        value={treatment.notes}
                        onChange={(e) => updateTreatmentNotes(treatment.id, e.target.value)}
                        className="input mt-1"
                        rows={2}
                        placeholder="Observaciones específicas..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Session Info Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Información de la Sesión</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración Total (min)</label>
                <input
                  type="text"
                  value={calculateTotalDuration()}
                  className="input bg-gray-100"
                  disabled
                />
              </div>
            </div>

            {/* Evaluación del paciente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Dolor (0-10)</label>
                <input
                  type="range"
                  name="pain_level"
                  min="0"
                  max="10"
                  value={formData.pain_level}
                  onChange={handleChange}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600">{formData.pain_level}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Región Corporal</label>
                <input
                  type="text"
                  name="body_region"
                  value={formData.body_region}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: Lumbar, Cervical..."
                />
              </div>
            </div>

            {/* SOAP */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subjetivo (S)</label>
                <textarea
                  name="subjective"
                  value={formData.subjective}
                  onChange={handleChange}
                  className="input"
                  rows={3}
                  placeholder="Quejas del paciente, síntomas referidos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo (O)</label>
                <textarea
                  name="objective"
                  value={formData.objective}
                  onChange={handleChange}
                  className="input"
                  rows={3}
                  placeholder="Hallazgos clínicos, observación..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Análisis (A)</label>
                <textarea
                  name="analysis"
                  value={formData.analysis}
                  onChange={handleChange}
                  className="input"
                  rows={3}
                  placeholder="Diagnóstico fisioterapéutico, progresión..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan (P)</label>
                <textarea
                  name="plan"
                  value={formData.plan}
                  onChange={handleChange}
                  className="input"
                  rows={3}
                  placeholder="Próximas sesiones, ejercicios en casa..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/physiotherapy" className="btn btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Sesión
          </button>
        </div>
      </form>

      {/* Treatment Selection Modal */}
      {showTreatmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Agregar Tratamiento</h3>
              <button onClick={() => setShowTreatmentModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              {!selectedTreatmentType ? (
                // Paso 1: Seleccionar tipo de tratamiento
                <div>
                  <h4 className="font-medium mb-3">Selecciona un tipo de tratamiento:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {treatmentTypes.map((tt) => (
                      <button
                        key={tt.id}
                        onClick={() => selectTreatmentType(tt)}
                        className="p-4 border rounded-lg text-left hover:bg-purple-50 hover:border-purple-300 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{tt.name}</div>
                        {tt.description && (
                          <div className="text-sm text-gray-500 mt-1">{tt.description}</div>
                        )}
                        {tt.category && (
                          <div className="text-xs text-purple-600 mt-1">{tt.category}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Paso 2: Agregar elementos al tratamiento
                <div>
                  <button
                    onClick={() => setSelectedTreatmentType(null)}
                    className="text-sm text-purple-600 mb-3 flex items-center gap-1"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    Volver a tipos de tratamiento
                  </button>
                  
                  <h4 className="font-medium mb-3">
                    Agregar a: <span className="text-purple-600">{selectedTreatmentType.name}</span>
                  </h4>
                  
                  {/* Tabs para elementos */}
                  <div className="border-b mb-4">
                    <div className="flex gap-4">
                      {[
                        { id: 'techniques', label: 'Técnicas', icon: Activity },
                        { id: 'equipment', label: 'Equipos', icon: FlaskConical },
                        { id: 'exercises', label: 'Ejercicios', icon: Dumbbell },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center gap-2 py-2 px-1 border-b-2 text-sm ${
                            activeTab === tab.id
                              ? 'border-purple-600 text-purple-600'
                              : 'border-transparent text-gray-500'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Lista de elementos disponibles */}
                  <div className="max-h-64 overflow-y-auto">
                    {activeTab === 'techniques' && availableTechniques.map((t) => (
                      <div key={t.id} className="flex justify-between items-center p-3 border rounded mb-2 hover:bg-gray-50">
                        <div>
                          <div className="font-medium">{t.name}</div>
                          {t.description && (
                            <div className="text-sm text-gray-500">{t.description}</div>
                          )}
                          <div className="text-xs text-gray-400">{t.default_duration_minutes} min</div>
                        </div>
                        <button
                          onClick={() => {
                            const newTreatment = {
                              id: crypto.randomUUID(),
                              treatmentTypeId: selectedTreatmentType.id,
                              treatmentTypeName: selectedTreatmentType.name,
                              techniques: [],
                              equipment: [],
                              exercises: [],
                              notes: '',
                            };
                            // Agregar la técnica directamente
                            newTreatment.techniques.push({
                              id: crypto.randomUUID(),
                              elementType: 'technique' as const,
                              elementId: t.id,
                              name: t.name,
                              duration_minutes: t.default_duration_minutes || 15,
                              parameters: {},
                              results: {},
                              notes: '',
                            });
                            setSelectedTreatments(prev => [...prev, newTreatment]);
                            setShowTreatmentModal(false);
                          }}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Agregar
                        </button>
                      </div>
                    ))}
                    
                    {activeTab === 'equipment' && availableEquipment.map((e) => (
                      <div key={e.id} className="flex justify-between items-center p-3 border rounded mb-2 hover:bg-gray-50">
                        <div>
                          <div className="font-medium">{e.name}</div>
                          <div className="text-sm text-gray-500">{e.brand} {e.model}</div>
                        </div>
                        <button
                          onClick={() => {
                            const newTreatment = {
                              id: crypto.randomUUID(),
                              treatmentTypeId: selectedTreatmentType.id,
                              treatmentTypeName: selectedTreatmentType.name,
                              techniques: [],
                              equipment: [],
                              exercises: [],
                              notes: '',
                            };
                            newTreatment.equipment.push({
                              id: crypto.randomUUID(),
                              elementType: 'equipment' as const,
                              elementId: e.id,
                              name: `${e.brand || ''} ${e.model || ''}`.trim() || e.name,
                              duration_minutes: 10,
                              parameters: {},
                              results: {},
                              notes: '',
                            });
                            setSelectedTreatments(prev => [...prev, newTreatment]);
                            setShowTreatmentModal(false);
                          }}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Agregar
                        </button>
                      </div>
                    ))}
                    
                    {activeTab === 'exercises' && availableExercises.map((ex) => (
                      <div key={ex.id} className="flex justify-between items-center p-3 border rounded mb-2 hover:bg-gray-50">
                        <div>
                          <div className="font-medium">{ex.name}</div>
                          {ex.body_region && (
                            <div className="text-sm text-gray-500">{ex.body_region}</div>
                          )}
                          {ex.difficulty_level && (
                            <div className="text-xs text-gray-400">{ex.difficulty_level}</div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const newTreatment = {
                              id: crypto.randomUUID(),
                              treatmentTypeId: selectedTreatmentType.id,
                              treatmentTypeName: selectedTreatmentType.name,
                              techniques: [],
                              equipment: [],
                              exercises: [],
                              notes: '',
                            };
                            newTreatment.exercises.push({
                              id: crypto.randomUUID(),
                              elementType: 'exercise' as const,
                              elementId: ex.id,
                              name: ex.name,
                              duration_minutes: 15,
                              parameters: {},
                              results: {},
                              notes: '',
                            });
                            setSelectedTreatments(prev => [...prev, newTreatment]);
                            setShowTreatmentModal(false);
                          }}
                          className="btn btn-primary btn-sm flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
