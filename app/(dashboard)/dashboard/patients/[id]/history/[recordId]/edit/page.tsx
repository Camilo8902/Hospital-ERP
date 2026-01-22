'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  FileText,
  Calendar,
  User,
  Activity,
  Heart,
  Thermometer,
  Stethoscope,
  ClipboardList,
  Pill,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';

interface Diagnosis {
  code: string;
  description: string;
  type: 'primary' | 'secondary' | 'rule_out' | 'final';
}

interface VitalSigns {
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature?: number;
  temperature_unit?: string;
  oxygen_saturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  pain_level?: number;
}

interface ICD10Code {
  code: string;
  description: string;
  category: string;
}

// Tipos para el formulario - SOLO campos que existen en la tabla
interface ConsultationFormData {
  chief_complaint: string;
  history_of_present_illness: string;
  physical_examination: string;
  vital_signs: VitalSigns;
  diagnosis: Diagnosis[];
  treatment_plan: string;
  recommendations: string;
  follow_up_required: boolean;
  follow_up_date: string;
  notes: string;
  private_notes: string;
}

const initialFormData: ConsultationFormData = {
  chief_complaint: '',
  history_of_present_illness: '',
  physical_examination: '',
  vital_signs: {
    blood_pressure_systolic: undefined,
    blood_pressure_diastolic: undefined,
    heart_rate: undefined,
    respiratory_rate: undefined,
    temperature: undefined,
    temperature_unit: 'C',
    oxygen_saturation: undefined,
    weight: undefined,
    height: undefined,
    pain_level: undefined,
  },
  diagnosis: [],
  treatment_plan: '',
  recommendations: '',
  follow_up_required: false,
  follow_up_date: '',
  notes: '',
  private_notes: '',
};

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  blood_type: string | null;
  allergies: string[] | null;
}

interface ClinicalRecord {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  physical_examination: string | null;
  vital_signs: any;
  diagnosis: any;
  treatment_plan: string | null;
  recommendations: string | null;
  notes: string | null;
  private_notes: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  created_at: string;
}

export default function EditClinicalRecordPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  const recordId = params.recordId as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [record, setRecord] = useState<ClinicalRecord | null>(null);
  const [icdCodes, setIcdCodes] = useState<ICD10Code[]>([]);
  const [icdSearch, setIcdSearch] = useState('');
  const [showIcdDropdown, setShowIcdDropdown] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState({
    chiefComplaint: true,
    physicalExam: false,
    vitalSigns: true,
    diagnosis: true,
    treatment: true,
    notes: false,
  });
  
  const [formData, setFormData] = useState<ConsultationFormData>(initialFormData);
  
  // Cargar datos del paciente y el registro
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar paciente
        const patientResponse = await fetch(`/api/patients/${patientId}`);
        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatient(patientData.patient);
        }
        
        // Cargar historial del paciente para encontrar el registro
        const historyResponse = await fetch(`/api/clinical-records/patient/${patientId}`);
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          const foundRecord = historyData.records?.find((r: ClinicalRecord) => r.id === recordId);
          
          if (foundRecord) {
            const rec = foundRecord as ClinicalRecord;
            setRecord(rec);
            
            // Cargar datos existentes al formulario
            setFormData(prev => ({
              ...prev,
              chief_complaint: rec.chief_complaint || '',
              history_of_present_illness: rec.history_of_present_illness || '',
              physical_examination: rec.physical_examination || '',
              treatment_plan: rec.treatment_plan || '',
              recommendations: rec.recommendations || '',
              notes: rec.notes || '',
              private_notes: rec.private_notes || '',
              follow_up_required: rec.follow_up_required || false,
              follow_up_date: rec.follow_up_date || '',
              vital_signs: rec.vital_signs ? {
                ...prev.vital_signs,
                ...rec.vital_signs,
              } : prev.vital_signs,
              diagnosis: rec.diagnosis || [],
            }));
          }
        }
      } catch (err) {
        console.error('Error cargando datos:', err);
        setError('Error al cargar datos del registro');
      }
    };
    
    if (patientId && recordId) {
      loadData();
    }
  }, [patientId, recordId]);
  
  // Buscar códigos ICD-10
  useEffect(() => {
    const searchICD = async () => {
      if (icdSearch.length >= 2) {
        const response = await fetch(`/api/clinical-records/icd10?q=${encodeURIComponent(icdSearch)}`);
        if (response.ok) {
          const data = await response.json();
          setIcdCodes(data.codes);
          setShowIcdDropdown(true);
        }
      } else {
        setIcdCodes([]);
        setShowIcdDropdown(false);
      }
    };
    
    const timeout = setTimeout(searchICD, 300);
    return () => clearTimeout(timeout);
  }, [icdSearch]);
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  const addDiagnosis = (icdCode: ICD10Code) => {
    const newDiagnosis: Diagnosis = {
      code: icdCode.code,
      description: icdCode.description,
      type: 'primary',
    };
    setFormData(prev => ({
      ...prev,
      diagnosis: [...prev.diagnosis, newDiagnosis],
    }));
    setIcdSearch('');
    setShowIcdDropdown(false);
  };
  
  const removeDiagnosis = (index: number) => {
    setFormData(prev => ({
      ...prev,
      diagnosis: prev.diagnosis.filter((_, i) => i !== index),
    }));
  };
  
  const updateVitalSign = (field: keyof VitalSigns, value: any) => {
    setFormData(prev => ({
      ...prev,
      vital_signs: {
        ...prev.vital_signs,
        [field]: value,
      },
    }));
    
    // Calcular BMI
    if (field === 'weight' || field === 'height') {
      const weight = field === 'weight' ? value : formData.vital_signs.weight;
      const height = field === 'height' ? value : formData.vital_signs.height;
      if (weight && height && weight > 0 && height > 0) {
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        setFormData(prev => ({
          ...prev,
          vital_signs: {
            ...prev.vital_signs,
            bmi: Math.round(bmi * 10) / 10,
          },
        }));
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/clinical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recordId,
          ...formData,
          patient_id: patientId,
          icd_codes: formData.diagnosis.map(d => d.code),
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar');
      }
      
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };
  
  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/patients/${patientId}/history`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Historia Clínica</h1>
            <p className="text-gray-500 mt-1">
              {patient.first_name} {patient.last_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Guardado a las {lastSaved}
            </span>
          )}
        </div>
      </div>
      
      {/* Info del paciente */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
              {getInitials(`${patient.first_name} ${patient.last_name}`)}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                <p className="font-medium">{formatDate(patient.dob)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tipo de Sangre</p>
                <p className="font-medium">{patient.blood_type || 'No registrado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Alergias</p>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies && patient.allergies.length > 0 ? (
                    patient.allergies.map((allergy, i) => (
                      <span key={i} className="badge badge-danger">{allergy}</span>
                    ))
                  ) : (
                    <span className="text-gray-400">Ninguna</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Signos Vitales */}
        <div className="card">
          <button
            type="button"
            onClick={() => toggleSection('vitalSigns')}
            className="card-header w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Signos Vitales</h2>
            </div>
            {expandedSections.vitalSigns ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.vitalSigns && (
            <div className="card-body">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Presión Arterial (mmHg)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.vital_signs.blood_pressure_systolic || ''}
                      onChange={(e) => updateVitalSign('blood_pressure_systolic', parseInt(e.target.value) || undefined)}
                      placeholder="Sistólica"
                      className="input w-28"
                    />
                    <span className="text-gray-400">/</span>
                    <input
                      type="number"
                      value={formData.vital_signs.blood_pressure_diastolic || ''}
                      onChange={(e) => updateVitalSign('blood_pressure_diastolic', parseInt(e.target.value) || undefined)}
                      placeholder="Diastólica"
                      className="input w-28"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Heart className="w-4 h-4 inline mr-1" />
                    FC (ppm)
                  </label>
                  <input
                    type="number"
                    value={formData.vital_signs.heart_rate || ''}
                    onChange={(e) => updateVitalSign('heart_rate', parseInt(e.target.value) || undefined)}
                    placeholder="70-100"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Activity className="w-4 h-4 inline mr-1" />
                    FR (rpm)
                  </label>
                  <input
                    type="number"
                    value={formData.vital_signs.respiratory_rate || ''}
                    onChange={(e) => updateVitalSign('respiratory_rate', parseInt(e.target.value) || undefined)}
                    placeholder="12-20"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Thermometer className="w-4 h-4 inline mr-1" />
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vital_signs.temperature || ''}
                    onChange={(e) => updateVitalSign('temperature', parseFloat(e.target.value) || undefined)}
                    placeholder="36.5"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    O₂ Sat (%)
                  </label>
                  <input
                    type="number"
                    value={formData.vital_signs.oxygen_saturation || ''}
                    onChange={(e) => updateVitalSign('oxygen_saturation', parseInt(e.target.value) || undefined)}
                    placeholder="95-100"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Activity className="w-4 h-4 inline mr-1" />
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vital_signs.weight || ''}
                    onChange={(e) => updateVitalSign('weight', parseFloat(e.target.value) || undefined)}
                    placeholder="70.5"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.vital_signs.height || ''}
                    onChange={(e) => updateVitalSign('height', parseInt(e.target.value) || undefined)}
                    placeholder="170"
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                  <input
                    type="text"
                    value={formData.vital_signs.bmi || ''}
                    readOnly
                    className="input bg-gray-50"
                    placeholder="Calculado"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dolor (0-10)</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.vital_signs.pain_level || 0}
                    onChange={(e) => updateVitalSign('pain_level', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{formData.vital_signs.pain_level || 0}</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Motivo de Consulta */}
        <div className="card">
          <button
            type="button"
            onClick={() => toggleSection('chiefComplaint')}
            className="card-header w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Motivo de Consulta</h2>
            </div>
            {expandedSections.chiefComplaint ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.chiefComplaint && (
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo de consulta
                </label>
                <input
                  type="text"
                  value={formData.chief_complaint}
                  onChange={(e) => setFormData(prev => ({ ...prev, chief_complaint: e.target.value }))}
                  placeholder="Ej: Dolor de cabeza desde hace 3 días"
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Historia de la enfermedad actual
                </label>
                <textarea
                  value={formData.history_of_present_illness}
                  onChange={(e) => setFormData(prev => ({ ...prev, history_of_present_illness: e.target.value }))}
                  rows={5}
                  placeholder="Describa detalladamente la evolución del síntoma..."
                  className="input"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Exploración Física */}
        <div className="card">
          <button
            type="button"
            onClick={() => toggleSection('physicalExam')}
            className="card-header w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Exploración Física</h2>
            </div>
            {expandedSections.physicalExam ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.physicalExam && (
            <div className="card-body">
              <textarea
                value={formData.physical_examination}
                onChange={(e) => setFormData(prev => ({ ...prev, physical_examination: e.target.value }))}
                rows={6}
                placeholder="Describa los hallazgos de la exploración física..."
                className="input"
              />
            </div>
          )}
        </div>
        
        {/* Diagnóstico */}
        <div className="card">
          <button
            type="button"
            onClick={() => toggleSection('diagnosis')}
            className="card-header w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Diagnóstico</h2>
            </div>
            {expandedSections.diagnosis ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.diagnosis && (
            <div className="card-body space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar código ICD-10</label>
                <input
                  type="text"
                  value={icdSearch}
                  onChange={(e) => setIcdSearch(e.target.value)}
                  onFocus={() => setShowIcdDropdown(true)}
                  placeholder="Buscar por código o descripción"
                  className="input"
                />
                
                {showIcdDropdown && icdCodes.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {icdCodes.map((code) => (
                      <button
                        key={code.code}
                        type="button"
                        onClick={() => addDiagnosis(code)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{code.code}</p>
                            <p className="text-sm text-gray-500">{code.description}</p>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {formData.diagnosis.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Diagnósticos agregados</label>
                  {formData.diagnosis.map((dx, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={dx.type}
                        onChange={(e) => {
                          const updated = [...formData.diagnosis];
                          updated[index] = { ...dx, type: e.target.value as Diagnosis['type'] };
                          setFormData(prev => ({ ...prev, diagnosis: updated }));
                        }}
                        className="input w-36"
                      >
                        <option value="primary">Primario</option>
                        <option value="secondary">Secundario</option>
                        <option value="rule_out">Rule Out</option>
                        <option value="final">Final</option>
                      </select>
                      
                      <div className="flex-1">
                        <p className="font-medium">{dx.code}</p>
                        <p className="text-sm text-gray-500">{dx.description}</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeDiagnosis(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas de evaluación</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Notas adicionales sobre la evaluación clínica..."
                  className="input"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Plan de Tratamiento */}
        <div className="card">
          <button
            type="button"
            onClick={() => toggleSection('treatment')}
            className="card-header w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Plan de Tratamiento</h2>
            </div>
            {expandedSections.treatment ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.treatment && (
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan de tratamiento</label>
                <textarea
                  value={formData.treatment_plan}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatment_plan: e.target.value }))}
                  rows={4}
                  placeholder="Describa el plan de tratamiento..."
                  className="input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recomendaciones al paciente</label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                  rows={3}
                  placeholder="Instrucciones para el paciente..."
                  className="input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="follow_up_required"
                    checked={formData.follow_up_required}
                    onChange={(e) => setFormData(prev => ({ ...prev, follow_up_required: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600"
                  />
                  <label htmlFor="follow_up_required" className="text-sm font-medium text-gray-700">
                    Requiere seguimiento
                  </label>
                </div>
                
                {formData.follow_up_required && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de seguimiento</label>
                    <input
                      type="date"
                      value={formData.follow_up_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                      className="input"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Notas Privadas */}
        <div className="card">
          <button
            type="button"
            onClick={() => toggleSection('notes')}
            className="card-header w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900">Notas Privadas</h2>
            </div>
            {expandedSections.notes ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.notes && (
            <div className="card-body">
              <p className="text-sm text-gray-500 mb-2">Estas notas solo son visibles para doctores</p>
              <textarea
                value={formData.private_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, private_notes: e.target.value }))}
                rows={3}
                placeholder="Notas internas, observaciones..."
                className="input bg-amber-50 border-amber-200"
              />
            </div>
          )}
        </div>
        
        {/* Acciones */}
        <div className="flex justify-between items-center">
          <Link
            href={`/dashboard/patients/${patientId}/history`}
            className="btn-secondary"
          >
            Cancelar
          </Link>
          
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
