'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  User,
  Building,
  FileText
} from 'lucide-react';
import Link from 'next/link';

const referenceTypes = [
  { value: 'evaluation', label: 'Evaluación' },
  { value: 'treatment', label: 'Tratamiento' },
  { value: 'procedure', label: 'Procedimiento' },
  { value: 'consultation', label: 'Consulta' },
];

const priorities = [
  { value: 'routine', label: 'Rutinaria' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'emergency', label: 'Emergencia' },
];

export default function NewPhysioReferralPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    patient_id: '',
    referring_department_id: '',
    target_department_id: 'physiotherapy',
    reference_type: 'treatment',
    clinical_diagnosis: '',
    icd10_codes: '',
    priority: 'routine',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch patients
    const { data: patientsData } = await supabase
      .from('patients')
      .select('id, first_name, last_name, dni, phone')
      .order('last_name');
    
    if (patientsData) {
      setPatients(patientsData.map(p => ({
        ...p,
        full_name: `${p.first_name} ${p.last_name}`
      })));
    }

    // Fetch departments
    const { data: deptsData } = await supabase
      .from('departments')
      .select('id, name')
      .order('name');

    if (deptsData) {
      setDepartments(deptsData);
    }

    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      const referralData = {
        patient_id: formData.patient_id,
        referring_doctor_id: user.id,
        referring_department_id: formData.referring_department_id || null,
        target_department_id: formData.target_department_id,
        reference_type: formData.reference_type,
        clinical_diagnosis: formData.clinical_diagnosis,
        icd10_codes: formData.icd10_codes ? formData.icd10_codes.split(',').map(c => c.trim()).filter(Boolean) : [],
        priority: formData.priority,
        notes: formData.notes,
        status: 'pending',
      };

      const { data, error: insertError } = await supabase
        .from('clinical_references')
        .insert(referralData)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/physiotherapy/referrals');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear derivación');
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Derivación Creada!</h2>
            <p className="text-gray-500 mb-4">La derivación se ha enviado correctamente.</p>
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
        <Link href="/dashboard/physiotherapy/referrals" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Derivación</h1>
          <p className="text-gray-500 mt-1">Derivar paciente a fisioterapia</p>
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
                  disabled={loading}
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
                <label className="label mb-1.5">Departamento de origen</label>
                <select
                  name="referring_department_id"
                  value={formData.referring_department_id}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Seleccionar...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Información Clínica
            </h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label mb-1.5">Tipo de derivación</label>
                <select
                  name="reference_type"
                  value={formData.reference_type}
                  onChange={handleChange}
                  className="input"
                >
                  {referenceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label mb-1.5">Prioridad</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="input"
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label mb-1.5">Códigos CIE-10 (separados por coma)</label>
                <input
                  type="text"
                  name="icd10_codes"
                  value={formData.icd10_codes}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: M54.5, M75.0"
                />
              </div>
            </div>

            <div>
              <label className="label mb-1.5">Diagnóstico clínico *</label>
              <textarea
                name="clinical_diagnosis"
                value={formData.clinical_diagnosis}
                onChange={handleChange}
                className="input min-h-[100px]"
                placeholder="Describe el diagnóstico que motiva la derivación..."
                required
              />
            </div>

            <div>
              <label className="label mb-1.5">Notas adicionales</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input min-h-[80px]"
                placeholder="Notas o instrucciones especiales..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/physiotherapy/referrals" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !formData.patient_id || !formData.clinical_diagnosis}
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
                Crear Derivación
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
