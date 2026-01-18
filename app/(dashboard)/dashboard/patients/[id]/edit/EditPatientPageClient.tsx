'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { updatePatient } from '@/lib/actions/patients';

interface Patient {
  id: string;
  medical_record_number: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  dob: string;
  gender: string | null;
  address: string | null;
  city: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  insurance_provider: string | null;
  insurance_policy_number: string | null;
  notes: string | null;
}

interface EditPatientPageProps {
  patient: Patient;
}

export default function EditPatientPage({ patient }: EditPatientPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: patient.first_name,
    last_name: patient.last_name,
    email: patient.email || '',
    phone: patient.phone,
    dob: patient.dob,
    gender: patient.gender || '',
    address: patient.address || '',
    city: patient.city || '',
    emergency_contact_name: patient.emergency_contact_name || '',
    emergency_contact_phone: patient.emergency_contact_phone || '',
    blood_type: patient.blood_type || '',
    allergies: patient.allergies?.join(', ') || '',
    insurance_provider: patient.insurance_provider || '',
    insurance_policy_number: patient.insurance_policy_number || '',
    notes: patient.notes || '',
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genderTypes = ['male', 'female', 'other', 'prefer_not_to_say'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('dob', formData.dob);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('emergency_contact_name', formData.emergency_contact_name);
      formDataToSend.append('emergency_contact_phone', formData.emergency_contact_phone);
      formDataToSend.append('blood_type', formData.blood_type);
      formDataToSend.append('allergies', formData.allergies);
      formDataToSend.append('insurance_provider', formData.insurance_provider);
      formDataToSend.append('insurance_policy_number', formData.insurance_policy_number);
      formDataToSend.append('notes', formData.notes);

      const result = await updatePatient(patient.id, formDataToSend);

      if (result.success) {
        router.push(`/dashboard/patients/${patient.id}`);
      } else {
        setError(result.error || 'Error al actualizar paciente');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/patients/${patient.id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Paciente</h1>
          <p className="text-gray-500 mt-1">MRN: {patient.medical_record_number}</p>
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
        {/* Información Personal */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Información Personal</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Nombre(s) *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Apellido(s) *</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Correo Electrónico</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="email@ejemplo.com"
              />
            </div>
            <div>
              <label className="label mb-1.5">Teléfono *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                placeholder="+52 555 123 4567"
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Fecha de Nacimiento *</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Género</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar...</option>
                {genderTypes.map(g => (
                  <option key={g} value={g}>
                    {g === 'male' ? 'Masculino' :
                     g === 'female' ? 'Femenino' :
                     g === 'other' ? 'Otro' : 'Prefiero no decir'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1.5">Ciudad</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label mb-1.5">Dirección</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input"
                placeholder="Calle, número, colonia"
              />
            </div>
          </div>
        </div>

        {/* Información Médica */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Información Médica</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Tipo de Sangre</label>
              <select
                name="blood_type"
                value={formData.blood_type}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar...</option>
                {bloodTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1.5">Alergias</label>
              <input
                type="text"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                className="input"
                placeholder="Penicilina, Aspirina (separadas por coma)"
              />
            </div>
          </div>
        </div>

        {/* Contacto de Emergencia */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Contacto de Emergencia</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Nombre del Contacto</label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label className="label mb-1.5">Teléfono del Contacto</label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Seguro */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Información de Seguro</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Proveedor de Seguro</label>
              <input
                type="text"
                name="insurance_provider"
                value={formData.insurance_provider}
                onChange={handleChange}
                className="input"
                placeholder="Seg Monterrey, GNP, etc."
              />
            </div>
            <div>
              <label className="label mb-1.5">Número de Póliza</label>
              <input
                type="text"
                name="insurance_policy_number"
                value={formData.insurance_policy_number}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Notas Adicionales</h2>
          </div>
          <div className="card-body">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input min-h-[100px]"
              placeholder="Notas adicionales sobre el paciente..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href={`/dashboard/patients/${patient.id}`} className="btn-secondary btn-md">
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
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
