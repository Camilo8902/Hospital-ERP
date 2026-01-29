'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Building, FileText, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dni: number;
  medical_record_number?: string;
}

interface Department {
  id: string;
  name: string;
}

export default function NewReferralPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Search patient
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientResults, setShowPatientResults] = useState(false);
  
  // Departments
  const [departments, setDepartments] = useState<Department[]>([]);
  const [targetDepartment, setTargetDepartment] = useState('');
  
  // Form
  const [formData, setFormData] = useState({
    clinical_diagnosis: '',
    icd10_codes: '',
    reference_type: 'evaluation' as const,
    priority: 'routine' as const,
    notes: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch {
      // Silent fail - use empty array
    }
  };

  const searchPatients = async (query: string) => {
    setPatientSearch(query);
    if (query.length < 2) {
      setPatients([]);
      setShowPatientResults(false);
      return;
    }

    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        setShowPatientResults(true);
      }
    } catch {
      setError('Error al buscar pacientes');
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.first_name} ${patient.last_name} (DNI: ${patient.dni})`);
    setShowPatientResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Por favor selecciona un paciente');
      return;
    }
    if (!targetDepartment) {
      setError('Por favor selecciona un departamento de destino');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          target_department_id: targetDepartment,
          clinical_diagnosis: formData.clinical_diagnosis,
          icd10_codes: formData.icd10_codes.split(',').map(c => c.trim()).filter(Boolean),
          reference_type: formData.reference_type,
          priority: formData.priority,
          notes: formData.notes,
        }),
      });

      if (!res.ok) throw new Error('Error al crear derivación');

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear derivación');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Derivación Creada</h2>
            <p className="text-gray-500 mb-6">
              La derivación ha sido enviada exitosamente al departamento seleccionado.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard/referrals" className="btn-primary">
                Ver Derivaciones
              </Link>
              <button
                onClick={() => {
                  setSuccess(false);
                  setSelectedPatient(null);
                  setPatientSearch('');
                  setFormData({
                    clinical_diagnosis: '',
                    icd10_codes: '',
                    reference_type: 'evaluation',
                    priority: 'routine',
                    notes: '',
                  });
                }}
                className="btn-secondary"
              >
                Nueva Derivación
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/referrals" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Derivación</h1>
          <p className="text-gray-500 mt-1">Crear derivación clínica a otro departamento</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body space-y-6">
          {/* Patient Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paciente <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => searchPatients(e.target.value)}
                placeholder="Buscar por nombre o DNI..."
                className="input pl-10"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showPatientResults && patients.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => selectPatient(patient)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <p className="font-medium text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      DNI: {patient.dni} | MRN: {patient.medical_record_number || 'N/A'}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {selectedPatient && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                    <p className="text-sm text-green-600">
                      DNI: {selectedPatient.dni} | MRN: {selectedPatient.medical_record_number || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Target Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departamento de Destino <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                className="input pl-10"
                required
              >
                <option value="">Seleccionar departamento...</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Derivación
            </label>
            <select
              value={formData.reference_type}
              onChange={(e) => setFormData({ ...formData, reference_type: e.target.value as any })}
              className="input"
            >
              <option value="evaluation">Evaluación</option>
              <option value="treatment">Tratamiento</option>
              <option value="procedure">Procedimiento</option>
              <option value="consultation">Consulta</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="input"
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgente</option>
              <option value="emergency">Emergencia</option>
            </select>
          </div>

          {/* Clinical Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnóstico Clínico <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.clinical_diagnosis}
              onChange={(e) => setFormData({ ...formData, clinical_diagnosis: e.target.value })}
              placeholder="Describir el diagnóstico clínico..."
              className="input min-h-[100px]"
              required
            />
          </div>

          {/* ICD-10 Codes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Códigos ICD-10
            </label>
            <input
              type="text"
              value={formData.icd10_codes}
              onChange={(e) => setFormData({ ...formData, icd10_codes: e.target.value })}
              placeholder="Códigos separados por coma (ej: M54.5, M75.10)"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Códigos de clasificación internacional de enfermedades
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas Adicionales
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas o instrucciones adicionales..."
              className="input min-h-[80px]"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <Link href="/dashboard/referrals" className="btn-secondary flex-1 text-center">
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creando...' : 'Crear Derivación'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
