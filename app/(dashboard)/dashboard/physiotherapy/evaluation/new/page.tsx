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
  Activity,
  Heart,
  Scale,
  Target,
  Brain,
  Eye,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { VASScale, StrengthGrade } from '@/components/physio';

  const painTypes = [
    'Agudo', 'Crónico', 'Punzante', 'Sordo', 'Ardor', 'Hormigueo', 
    'Entumecimiento', 'Presión', 'Tensión', 'Otro'
  ];

  const painDurations = [
    'Menos de 1 semana', '1-4 semanas', '1-3 meses', '3-6 meses', 'Más de 6 meses'
  ];

  const bodyRegions = [
    { value: 'cervical', label: 'Cervical (Cuello)' },
    { value: 'shoulder', label: 'Hombro' },
    { value: 'elbow', label: 'Codo' },
    { value: 'wrist', label: 'Muñeca' },
    { value: 'hand', label: 'Mano' },
    { value: 'lumbar', label: 'Lumbar' },
    { value: 'thoracic', label: 'Torácica' },
    { value: 'hip', label: 'Cadera' },
    { value: 'knee', label: 'Rodilla' },
    { value: 'ankle', label: 'Tobillo' },
    { value: 'foot', label: 'Pie' },
    { value: 'other', label: 'Otra' },
  ];

export default function NewPhysioEvaluationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingConsent, setUploadingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(searchParams.get('patient_id'));
  const [patients, setPatients] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  // Definición de validaciones de campos
  const fieldValidations: Record<string, { min: number; max: number; field: string }> = {
    vas_score: { min: 0, max: 10, field: 'VAS (0-10)' },
    oswestry_score: { min: 0, max: 100, field: 'Oswestry (0-100)' },
    dash_score: { min: 0, max: 100, field: 'DASH (0-100)' },
    womac_score: { min: 0, max: 96, field: 'WOMAC (0-96)' },
    roland_morris_score: { min: 0, max: 24, field: 'Roland-Morris (0-24)' },
    pain_scale_baseline: { min: 0, max: 10, field: 'Dolor basal (0-10)' },
    sessions_per_week: { min: 1, max: 7, field: 'Sesiones por semana (1-7)' },
    total_sessions_prescribed: { min: 1, max: 100, field: 'Total sesiones (1-100)' },
    baseline_functional_score: { min: 0, max: 100, field: 'Score funcional (0-100)' },
    muscle_strength_grade: { min: 0, max: 5, field: 'Grado de fuerza (0-5)' },
  };
  
  const [formData, setFormData] = useState({
    // Datos del paciente
    patient_id: '',
    
    // Motivo de consulta
    chief_complaint: '',
    pain_location: '',
    pain_duration: '',
    pain_type: '',
    pain_scale_baseline: 0,
    pain_characteristics: '',
    aggravating_factors: '',
    relieving_factors: '',
    
    // Antecedentes
    surgical_history: '',
    traumatic_history: '',
    medical_history: '',
    family_history: '',
    allergies: '',
    contraindications: '',
    
    // Exploración física
    postural_evaluation: '',
    physical_examination: '',
    neurological_screening: '',
    special_tests: '',
    
    // Mediciones
    rom_measurements: [] as any[],
    strength_grade: [] as any[],
    
    // Escalas funcionales
    vas_score: 0,
    oswestry_score: undefined as number | undefined,
    dash_score: undefined as number | undefined,
    womac_score: undefined as number | undefined,
    roland_morris_score: undefined as number | undefined,
    
    // Diagnóstico y plan
    clinical_diagnosis: '',
    icd10_codes: '',
    functional_limitations: '',
    short_term_goals: '',
    long_term_goals: '',
    patient_expectations: '',
    
    // Consentimiento
    informed_consent_signed: false,
    informed_consent_file_url: '',
    informed_consent_file_name: '',
    
    // Notas
    notes: '',

    // Configuración de plan de tratamiento (nueva funcionalidad)
    activate_treatment_plan: false,
    plan_type: 'rehabilitation' as const,
    sessions_per_week: 3,
    total_sessions_prescribed: 10,
    expected_end_date: '',
    baseline_rom: '',
    baseline_functional_score: null as number | null,
  });

  // Cargar pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, dni, phone')
        .order('last_name');
      
      if (data) {
        // Transformar para tener full_name computado
        const patientsWithFullName = data.map(p => ({
          ...p,
          full_name: `${p.first_name} ${p.last_name}`
        }));
        setPatients(patientsWithFullName);
      }
    };
    
    fetchPatients();
  }, []);

  // Pre-llenar paciente si viene de la selección
  useEffect(() => {
    if (searchParams.get('patient_id')) {
      setFormData(prev => ({ ...prev, patient_id: searchParams.get('patient_id')! }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const numValue = type === 'number' ? (value ? parseFloat(value) : undefined) : value;
    
    // Validar rango si existe validación para este campo
    if (type === 'number' && fieldValidations[name] && typeof numValue === "number") {
      const validation = fieldValidations[name];
      if (numValue < validation.min || numValue > validation.max) {
        setValidationErrors(prev => ({
          ...prev,
          [name]: `${validation.field}: Debe estar entre ${validation.min} y ${validation.max}`
        }));
      } else {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else if (type === 'number') {
      // Limpiar error si el campo está vacío o no tiene validación
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue,
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const addROMMeasurement = () => {
    setFormData(prev => ({
      ...prev,
      rom_measurements: [...prev.rom_measurements, { joint: null, movement: null, right_side: null, left_side: null, normal: null }],
    }));
  };

  const updateROMMeasurement = (index: number, field: string, value: string) => {
    const updated = [...formData.rom_measurements];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, rom_measurements: updated }));
  };

  const removeROMMeasurement = (index: number) => {
    const updated = formData.rom_measurements.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, rom_measurements: updated }));
  };

  const addStrengthGrade = () => {
    setFormData(prev => ({
      ...prev,
      strength_grade: [...prev.strength_grade, { muscle_group: null, right_side: null, left_side: null }],
    }));
  };

  const updateStrengthGrade = (index: number, field: string, value: any) => {
    const updated = [...formData.strength_grade];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, strength_grade: updated }));
  };

  const removeStrengthGrade = (index: number) => {
    const updated = formData.strength_grade.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, strength_grade: updated }));
  };

  // Subir archivo del consentimiento informado
  const handleConsentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingConsent(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `consent-files/${fileName}`;

      // Subir archivo a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('consent-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública (o signed URL para bucket privado)
      const { data: { publicUrl } } = supabase.storage
        .from('consent-files')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        informed_consent_file_url: publicUrl,
        informed_consent_file_name: file.name,
        informed_consent_signed: true // Auto-firmar cuando se sube el archivo
      }));
    } catch (error) {
      console.error('Error al subir archivo:', error);
      setError('Error al subir el archivo del consentimiento');
    } finally {
      setUploadingConsent(false);
    }
  };

  // Eliminar archivo del consentimiento
  const handleRemoveConsentFile = () => {
    setFormData(prev => ({
      ...prev,
      informed_consent_file_url: '',
      informed_consent_file_name: '',
      informed_consent_signed: false
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
  // Log para debug
console.log('Enviando datos:', {
  rom_measurements: formData.rom_measurements,
  strength_grade: formData.strength_grade
    });
      // Crear el registro médico de fisioterapia
      const { data: record, error: insertError } = await supabase
        .from('physio_medical_records')
        .insert({
          patient_id: formData.patient_id,
          therapist_id: user.id,
          chief_complaint: formData.chief_complaint,
          pain_location: formData.pain_location,
          pain_duration: formData.pain_duration,
          pain_type: formData.pain_type,
          pain_scale_baseline: formData.pain_scale_baseline,
          pain_characteristics: formData.pain_characteristics,
          surgical_history: formData.surgical_history,
          traumatic_history: formData.traumatic_history,
          medical_history: formData.medical_history,
          family_history: formData.family_history,
          allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : [],
          contraindications: formData.contraindications,
          postural_evaluation: formData.postural_evaluation,
          physical_examination: formData.physical_examination,
          neurological_screening: formData.neurological_screening,
          special_tests: formData.special_tests,
          rom_measurements: formData.rom_measurements,
          strength_grade: formData.strength_grade,
          vas_score: formData.vas_score,
          oswestry_score: formData.oswestry_score,
          dash_score: formData.dash_score,
          womac_score: formData.womac_score,
          roland_morris_score: formData.roland_morris_score,
          clinical_diagnosis: formData.clinical_diagnosis,
          icd10_codes: formData.icd10_codes ? formData.icd10_codes.split(',').map(c => c.trim()) : [],
          functional_limitations: formData.functional_limitations,
          short_term_goals: formData.short_term_goals ? formData.short_term_goals.split('\n').filter(g => g.trim()) : [],
          long_term_goals: formData.long_term_goals ? formData.long_term_goals.split('\n').filter(g => g.trim()) : [],
          patient_expectations: formData.patient_expectations,
          informed_consent_signed: formData.informed_consent_signed,
          informed_consent_date: formData.informed_consent_signed ? new Date().toISOString() : null,
          informed_consent_file_url: formData.informed_consent_file_url || null,
          informed_consent_file_name: formData.informed_consent_file_name || null,
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // 2. Si está activado, crear el plan de tratamiento
      let planId = null;
      if (formData.activate_treatment_plan) {
        try {
          const planData = {
            patient_id: formData.patient_id,
            medical_record_id: record.id,  // Vincular a la evaluación
            therapist_id: user.id,
            diagnosis_code: formData.icd10_codes?.split(',')[0]?.trim() || null,
            diagnosis_description: formData.clinical_diagnosis,
            plan_type: formData.plan_type,
            clinical_objective: formData.clinical_diagnosis,
            start_date: new Date().toISOString().split('T')[0],
            expected_end_date: formData.expected_end_date || null,
            sessions_per_week: formData.sessions_per_week,
            total_sessions_prescribed: formData.total_sessions_prescribed,
            sessions_completed: 0,
            baseline_rom: formData.baseline_rom || null,
            baseline_functional_score: formData.baseline_functional_score,
            status: 'indicated',  // Estado inicial: INDICADO
            notes: formData.notes || null,
          };

          const { data: plan, error: planError } = await supabase
            .from('physio_treatment_plans')
            .insert(planData)
            .select()
            .single();

          if (planError) {
            console.error('Error al crear plan:', planError);
          } else {
            planId = plan.id;
          }
        } catch (planErr) {
          console.error('Error creando plan:', planErr);
        }
      }

      setSuccess(true);
      
      // Redireccionar después de 2 segundos
      setTimeout(() => {
        if (planId) {
          router.push(`/dashboard/physiotherapy/plans/${planId}`);
        } else {
          router.push(`/dashboard/physiotherapy/evaluation/${record.id}`);
        }
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la evaluación');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { number: 1, title: 'Datos del Paciente', icon: User },
    { number: 2, title: 'Motivo de Consulta', icon: Activity },
    { number: 3, title: 'Antecedentes', icon: Heart },
    { number: 4, title: 'Exploración Física', icon: Eye },
    { number: 5, title: 'Diagnóstico y Plan', icon: Target },
  ];

  if (success) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Evaluación Guardada!</h2>
            <p className="text-gray-500 mb-4">La evaluación inicial de fisioterapia se ha guardado correctamente.</p>
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
        <Link
          href="/dashboard/physiotherapy"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluación Inicial de Fisioterapia</h1>
          <p className="text-gray-500 mt-1">Primera evaluación clínica del paciente</p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.number === currentStep;
              const isCompleted = step.number < currentStep;
              
              return (
                <div key={step.number} className="flex items-center">
                  <button
                    onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                    className={`flex items-center gap-2 ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
                    disabled={!isCompleted}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-purple-600 text-white' :
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`hidden sm:block text-sm ${isActive ? 'font-medium text-purple-600' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={`w-12 sm:w-24 h-1 mx-2 ${step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Datos del Paciente */}
        {currentStep === 1 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Datos del Paciente
              </h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
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
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!formData.patient_id}
                  className="btn-primary btn-md"
                >
                  Siguiente: Motivo de Consulta →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Motivo de Consulta */}
        {currentStep === 2 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Motivo de Consulta
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label mb-1.5">Motivo de consulta principal *</label>
                <textarea
                  name="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Describe el motivo de consulta del paciente..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label mb-1.5">Ubicación del dolor</label>
                  <select
                    name="pain_location"
                    value={formData.pain_location}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Seleccionar región...</option>
                    {bodyRegions.map((region) => (
                      <option key={region.value} value={region.value}>{region.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label mb-1.5">Duración del dolor</label>
                  <select
                    name="pain_duration"
                    value={formData.pain_duration}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Seleccionar...</option>
                    {painDurations.map((duration) => (
                      <option key={duration} value={duration}>{duration}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label mb-1.5">Tipo de dolor</label>
                  <select
                    name="pain_type"
                    value={formData.pain_type}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Seleccionar...</option>
                    {painTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <VASScale
                value={formData.pain_scale_baseline}
                onChange={(value) => setFormData(prev => ({ ...prev, pain_scale_baseline: value }))}
                label="Nivel de dolor inicial"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5">Factores que agravan el dolor</label>
                  <textarea
                    name="aggravating_factors"
                    value={formData.aggravating_factors}
                    onChange={handleChange}
                    className="input min-h-[80px]"
                    placeholder="Ej: Movimiento, bipedestación prolongada..."
                  />
                </div>
                <div>
                  <label className="label mb-1.5">Factores que alivian el dolor</label>
                  <textarea
                    name="relieving_factors"
                    value={formData.relieving_factors}
                    onChange={handleChange}
                    className="input min-h-[80px]"
                    placeholder="Ej: Reposo, calor, analgésicos..."
                  />
                </div>
              </div>

              <div>
                <label className="label mb-1.5">Características adicionales del dolor</label>
                <textarea
                  name="pain_characteristics"
                  value={formData.pain_characteristics}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Describe las características del dolor (irradiación, horario, etc.)..."
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary btn-md"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn-primary btn-md"
                >
                  Siguiente: Antecedentes →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Antecedentes */}
        {currentStep === 3 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-purple-600" />
                Antecedentes Clínicos
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5">Antecedentes quirúrgicos</label>
                  <textarea
                    name="surgical_history"
                    value={formData.surgical_history}
                    onChange={handleChange}
                    className="input min-h-[100px]"
                    placeholder="Cirugías previas, fechas y complicaciones..."
                  />
                </div>
                <div>
                  <label className="label mb-1.5">Antecedentes traumáticos</label>
                  <textarea
                    name="traumatic_history"
                    value={formData.traumatic_history}
                    onChange={handleChange}
                    className="input min-h-[100px]"
                    placeholder="Fracturas, luxaciones, esguinces..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5">Antecedentes médicos</label>
                  <textarea
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleChange}
                    className="input min-h-[100px]"
                    placeholder="Enfermedades crónicas, tratamientos actuales..."
                  />
                </div>
                <div>
                  <label className="label mb-1.5">Antecedentes familiares</label>
                  <textarea
                    name="family_history"
                    value={formData.family_history}
                    onChange={handleChange}
                    className="input min-h-[100px]"
                    placeholder="Enfermedades hereditarias o familiares relevantes..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5">Alergias</label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    className="input"
                    placeholder="Separar con comas"
                  />
                </div>
                <div>
                  <label className="label mb-1.5">Contraindicaciones</label>
                  <textarea
                    name="contraindications"
                    value={formData.contraindications}
                    onChange={handleChange}
                    className="input min-h-[80px]"
                    placeholder="Contraindicaciones para el tratamiento..."
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn-secondary btn-md"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="btn-primary btn-md"
                >
                  Siguiente: Exploración Física →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Exploración Física */}
        {currentStep === 4 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-purple-600" />
                Exploración Física
              </h2>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label className="label mb-1.5">Evaluación postural</label>
                <textarea
                  name="postural_evaluation"
                  value={formData.postural_evaluation}
                  onChange={handleChange}
                  className="input min-h-[100px]"
                  placeholder="Describe la postura del paciente (frontal, lateral, posterior)..."
                />
              </div>

              <div>
                <label className="label mb-1.5">Exploración física general</label>
                <textarea
                  name="physical_examination"
                  value={formData.physical_examination}
                  onChange={handleChange}
                  className="input min-h-[100px]"
                  placeholder="Inspección, palpación, movilidad activa y pasiva..."
                />
              </div>

              {/* Mediciones ROM */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Rangos de Movimiento (ROM)</h3>
                  <button
                    type="button"
                    onClick={addROMMeasurement}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    + Agregar medición
                  </button>
                </div>
                
                {formData.rom_measurements.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No hay mediciones registradas</p>
                ) : (
                  <div className="space-y-3">
                    {formData.rom_measurements.map((measurement, index) => (
                      <div key={index} className="flex items-center gap-2 flex-wrap">
                        <select
                          value={measurement.joint}
                          onChange={(e) => updateROMMeasurement(index, 'joint', e.target.value)}
                          className="input w-32"
                        >
                          <option value="">Articulación</option>
                          {bodyRegions.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={measurement.movement}
                          onChange={(e) => updateROMMeasurement(index, 'movement', e.target.value)}
                          className="input w-32"
                          placeholder="Movimiento"
                        />
                        <input
                          type="number"
                          value={measurement.right_side}
                          onChange={(e) => updateROMMeasurement(index, 'right_side', e.target.value)}
                          className="input w-20"
                          placeholder="D"
                        />
                        <input
                          type="number"
                          value={measurement.left_side}
                          onChange={(e) => updateROMMeasurement(index, 'left_side', e.target.value)}
                          className="input w-20"
                          placeholder="I"
                        />
                        <input
                          type="number"
                          value={measurement.normal}
                          onChange={(e) => updateROMMeasurement(index, 'normal', e.target.value)}
                          className="input w-20"
                          placeholder="Normal"
                        />
                        <button
                          type="button"
                          onClick={() => removeROMMeasurement(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fuerza muscular */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Fuerza Muscular (Oxford Scale)</h3>
                  <button
                    type="button"
                    onClick={addStrengthGrade}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    + Agregar grupo muscular
                  </button>
                </div>
                
                {formData.strength_grade.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No hay registros de fuerza</p>
                ) : (
                  <div className="space-y-4">
                    {formData.strength_grade.map((grade, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <input
                            type="text"
                            value={grade.muscle_group}
                            onChange={(e) => updateStrengthGrade(index, 'muscle_group', e.target.value)}
                            className="input flex-1"
                            placeholder="Grupo muscular"
                          />
                          <button
                            type="button"
                            onClick={() => removeStrengthGrade(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                        <StrengthGrade
                          value={grade.right_side || 0}
                          onChange={(value) => updateStrengthGrade(index, 'right_side', value)}
                          label="Derecho"
                          side="right"
                        />
                        <div className="mt-2">
                          <StrengthGrade
                            value={grade.left_side || 0}
                            onChange={(value) => updateStrengthGrade(index, 'left_side', value)}
                            label="Izquierdo"
                            side="left"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5">Screening neurológico</label>
                  <textarea
                    name="neurological_screening"
                    value={formData.neurological_screening}
                    onChange={handleChange}
                    className="input min-h-[80px]"
                    placeholder="Reflejos, sensibilidad, fuerza segmentaria..."
                  />
                </div>
                <div>
                  <label className="label mb-1.5">Pruebas especiales</label>
                  <textarea
                    name="special_tests"
                    value={formData.special_tests}
                    onChange={handleChange}
                    className="input min-h-[80px]"
                    placeholder="Tests ortopédicos y especiales realizados..."
                  />
                </div>
              </div>

              {/* Escalas funcionales */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-4">Escalas de Evaluación Funcional</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="label mb-1.5">VAS (0-10)</label>
                    <input
                      type="number"
                      name="vas_score"
                      min="0"
                      max="10"
                      value={formData.vas_score || ''}
                      onChange={handleChange}
                      className={`input ${validationErrors.vas_score ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.vas_score && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.vas_score}</p>
                    )}
                  </div>
                  <div>
                    <label className="label mb-1.5">Oswestry (0-100)</label>
                    <input
                      type="number"
                      name="oswestry_score"
                      min="0"
                      max="100"
                      value={formData.oswestry_score || ''}
                      onChange={handleChange}
                      className={`input ${validationErrors.oswestry_score ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.oswestry_score && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.oswestry_score}</p>
                    )}
                  </div>
                  <div>
                    <label className="label mb-1.5">DASH (0-100)</label>
                    <input
                      type="number"
                      name="dash_score"
                      min="0"
                      max="100"
                      value={formData.dash_score || ''}
                      onChange={handleChange}
                      className={`input ${validationErrors.dash_score ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.dash_score && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.dash_score}</p>
                    )}
                  </div>
                  <div>
                    <label className="label mb-1.5">Roland-Morris (0-24)</label>
                    <input
                      type="number"
                      name="roland_morris_score"
                      min="0"
                      max="24"
                      value={formData.roland_morris_score || ''}
                      onChange={handleChange}
                      className={`input ${validationErrors.roland_morris_score ? 'border-red-500' : ''}`}
                    />
                    {validationErrors.roland_morris_score && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.roland_morris_score}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="btn-secondary btn-md"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="btn-primary btn-md"
                >
                  Siguiente: Diagnóstico y Plan →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Diagnóstico y Plan */}
        {currentStep === 5 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Diagnóstico y Plan de Tratamiento
              </h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label mb-1.5">Diagnóstico clínico *</label>
                <textarea
                  name="clinical_diagnosis"
                  value={formData.clinical_diagnosis}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Diagnóstico clínico del paciente..."
                  required
                />
              </div>

              <div>
                <label className="label mb-1.5">Códigos ICD-10</label>
                <input
                  type="text"
                  name="icd10_codes"
                  value={formData.icd10_codes}
                  onChange={handleChange}
                  className="input"
                  placeholder="Separar con comas (ej: M54.5, M75.10)"
                />
              </div>

              <div>
                <label className="label mb-1.5">Limitaciones funcionales</label>
                <textarea
                  name="functional_limitations"
                  value={formData.functional_limitations}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Describe las limitaciones funcionales del paciente..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1.5">Objetivos a corto plazo</label>
                  <textarea
                    name="short_term_goals"
                    value={formData.short_term_goals}
                    onChange={handleChange}
                    className="input min-h-[120px]"
                    placeholder="Objetivos para las primeras 2-4 semanas..."
                  />
                </div>
                <div>
                  <label className="label mb-1.5">Objetivos a largo plazo</label>
                  <textarea
                    name="long_term_goals"
                    value={formData.long_term_goals}
                    onChange={handleChange}
                    className="input min-h-[120px]"
                    placeholder="Objetivos para el alta o mantenimiento..."
                  />
                </div>
              </div>

              <div>
                <label className="label mb-1.5">Expectativas del paciente</label>
                <textarea
                  name="patient_expectations"
                  value={formData.patient_expectations}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Expectativas y metas que desea alcanzar el paciente..."
                />
              </div>

              <div>
                <label className="label mb-1.5">Notas adicionales</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="input min-h-[80px]"
                  placeholder="Notas adicionales relevantes..."
                />
              </div>

              {/* Nueva sección: Activar Plan de Tratamiento */}
              <div className="border rounded-lg p-4 bg-blue-50 space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.activate_treatment_plan}
                    onChange={(e) => handleCheckboxChange('activate_treatment_plan', e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Crear Plan de Tratamiento</p>
                    <p className="text-sm text-gray-500">
                      Al activar esta opción, se creará automáticamente un plan de tratamiento 
                      con los datos de esta evaluación.
                    </p>
                  </div>
                </div>

                {/* Configuración del plan (solo si está activado) */}
                {formData.activate_treatment_plan && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="label mb-1.5">Tipo de Plan *</label>
                      <select
                        name="plan_type"
                        value={formData.plan_type}
                        onChange={handleChange}
                        className="input"
                      >
                        <option value="rehabilitation">Rehabilitación</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="preventive">Preventivo</option>
                        <option value="performance">Rendimiento</option>
                      </select>
                    </div>
                    
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
                    
                    <div className="md:col-span-2">
                      <label className="label mb-1.5">Objetivo clínico principal</label>
                      <textarea
                        name="clinical_objective"
                        value={formData.clinical_diagnosis}
                        onChange={handleChange}
                        className="input min-h-[80px]"
                        placeholder="Objetivo principal del tratamiento (se pre-llena con el diagnóstico)..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Se pre-llena automáticamente con el diagnóstico clínico.
                      </p>
                    </div>
                    
                    <div>
                      <label className="label mb-1.5">ROM basal (opcional)</label>
                      <input
                        type="text"
                        name="baseline_rom"
                        value={formData.baseline_rom}
                        onChange={handleChange}
                        className="input"
                        placeholder="Ej: Flexión 90°, Extensión 0°"
                      />
                    </div>
                    
                    <div>
                      <label className="label mb-1.5">Score funcional inicial</label>
                      <input
                        type="number"
                        name="baseline_functional_score"
                        value={formData.baseline_functional_score || ''}
                        onChange={handleChange}
                        className="input"
                        placeholder="0-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Consentimiento informado */}
              <div className="border rounded-lg p-4 bg-purple-50 space-y-4">
                <div>
                  <p className="font-medium text-gray-900 mb-2">Consentimiento informado</p>
                  <p className="text-sm text-gray-500">
                    El paciente debe leer y firmar el consentimiento informado para el tratamiento de fisioterapia.
                    Adjunte el documento escaneado con la firma del paciente.
                  </p>
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.informed_consent_signed}
                    onChange={(e) => handleCheckboxChange('informed_consent_signed', e.target.checked)}
                    className="mt-1 w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Consentimiento informado firmado</p>
                    <p className="text-sm text-gray-500">
                      El paciente ha leído y firmado el consentimiento informado para el tratamiento de fisioterapia.
                      Se debe conservar el documento físico o digital firmado.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="btn-secondary btn-md"
                >
                  ← Anterior
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="btn-secondary btn-md"
                  >
                    Reiniciar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.informed_consent_signed}
                    className="btn-primary btn-md"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar Evaluación
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}


