'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Loader2, Calendar, Search, User, X } from 'lucide-react';
import Link from 'next/link';

interface PatientSelect {
  id: string;
  full_name: string;
  medical_record_number: string;
}

interface Department {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  full_name: string;
  specialty: string;
}

interface Room {
  id: string;
  room_number: string;
  room_type: string;
}

interface NewAppointmentFormProps {
  patients: PatientSelect[];
  departments: Department[];
  doctors: Doctor[];
  rooms: Room[];
}

// Función para convertir fecha local a formato UTC para Supabase
function toUTCDateTime(localDateTime: string): string {
  if (!localDateTime) return '';
  const date = new Date(localDateTime);
  return date.toISOString();
}

// Componente de búsqueda de pacientes con autocompletado
function PatientSearchInput({
  patients,
  value,
  onChange
}: {
  patients: PatientSelect[];
  value: string;
  onChange: (id: string, patient?: PatientSelect) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSelect | undefined>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Encontrar el paciente seleccionado cuando cambia el valor
  useEffect(() => {
    if (value && patients.length > 0) {
      const patient = patients.find(p => p.id === value);
      setSelectedPatient(patient);
      setSearchTerm(patient?.full_name || '');
    } else {
      setSelectedPatient(undefined);
      setSearchTerm('');
    }
  }, [value, patients]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.full_name.toLowerCase().includes(searchLower) ||
      patient.medical_record_number.toLowerCase().includes(searchLower)
    );
  });

  const handleSelect = (patient: PatientSelect) => {
    onChange(patient.id, patient);
    setSearchTerm(patient.full_name);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setSelectedPatient(undefined);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="label mb-1.5">Buscar Paciente *</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            if (!e.target.value) {
              handleClear();
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar por nombre o número de expediente..."
          className="input pl-10 pr-10"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredPatients.length > 0 ? (
            filteredPatients.map(patient => (
              <button
                key={patient.id}
                type="button"
                onClick={() => handleSelect(patient)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
              >
                <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">{patient.full_name}</div>
                  <div className="text-sm text-gray-500">MRN: {patient.medical_record_number}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">
              No se encontraron pacientes
            </div>
          )}
        </div>
      )}

      {/* Paciente seleccionado */}
      {selectedPatient && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <User className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            {selectedPatient.full_name}
          </span>
          <span className="text-sm text-green-600">
            (MRN: {selectedPatient.medical_record_number})
          </span>
        </div>
      )}
    </div>
  );
}

export default function NewAppointmentForm({
  patients,
  departments,
  doctors,
  rooms,
}: NewAppointmentFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patient_id: searchParams.get('patient_id') || '',
    doctor_id: '',
    department_id: '',
    room_id: '',
    appointment_type: 'consultation',
    start_time: '',
    end_time: '',
    reason: '',
    notes: '',
  });

  const appointmentTypes = [
    { value: 'consultation', label: 'Consulta' },
    { value: 'follow_up', label: 'Seguimiento' },
    { value: 'emergency', label: 'Emergencia' },
    { value: 'procedure', label: 'Procedimiento' },
    { value: 'imaging', label: 'Imagenología' },
    { value: 'laboratory', label: 'Laboratorio' },
    { value: 'surgery', label: 'Cirugía' },
  ];

  // Filtrar habitaciones por tipo
  const filteredRooms = rooms.filter(r => {
    if (formData.appointment_type === 'imaging') return r.room_type === 'imaging';
    if (formData.appointment_type === 'laboratory') return r.room_type === 'laboratory';
    if (formData.appointment_type === 'surgery') return r.room_type === 'surgery';
    return ['consultation', 'emergency'].includes(r.room_type);
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePatientChange = (patientId: string, patient?: PatientSelect) => {
    setFormData(prev => ({ ...prev, patient_id: patientId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar que se haya seleccionado un paciente
      if (!formData.patient_id) {
        throw new Error('Debe seleccionar un paciente');
      }

      // Convertir las fechas a UTC antes de enviar
      const utcStartTime = toUTCDateTime(formData.start_time);
      const utcEndTime = toUTCDateTime(formData.end_time);

      const { data, error: insertError } = await supabase
        .from('appointments')
        .insert({
          patient_id: formData.patient_id,
          doctor_id: formData.doctor_id || null,
          department_id: formData.department_id || null,
          room_id: formData.room_id || null,
          appointment_type: formData.appointment_type,
          start_time: utcStartTime,
          end_time: utcEndTime,
          reason: formData.reason || null,
          notes: formData.notes || null,
          status: 'scheduled',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      router.push('/dashboard/appointments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agendar cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/appointments"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Cita</h1>
          <p className="text-gray-500 mt-1">Agendar una nueva cita médica</p>
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
        {/* Información de la Cita */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Información de la Cita</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Tipo de Cita *</label>
              <select
                name="appointment_type"
                value={formData.appointment_type}
                onChange={handleChange}
                className="input"
                required
              >
                {appointmentTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1.5">Fecha y Hora de Inicio *</label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Fecha y Hora de Fin *</label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div>
              <label className="label mb-1.5">Motivo de la Cita</label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="input"
                placeholder="Ej. Dolor de cabeza, chequeo anual..."
              />
            </div>
          </div>
        </div>

        {/* Paciente */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Paciente</h2>
          </div>
          <div className="card-body">
            <PatientSearchInput
              patients={patients}
              value={formData.patient_id}
              onChange={handlePatientChange}
            />
            <p className="text-xs text-gray-500 mt-2">
              ¿El paciente no existe?{' '}
              <Link href="/dashboard/patients/new" className="text-primary-600 hover:text-primary-700">
                Registrar nuevo paciente
              </Link>
            </p>
          </div>
        </div>

        {/* Asignación */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Asignación</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label mb-1.5">Médico</label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar médico (opcional)</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.full_name} {d.specialty && `- ${d.specialty}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1.5">Departamento</label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar departamento...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1.5">Habitación/Sala</label>
              <select
                name="room_id"
                value={formData.room_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar habitación...</option>
                {filteredRooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.room_number} ({r.room_type})
                  </option>
                ))}
              </select>
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
              placeholder="Notas adicionales sobre la cita..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/dashboard/appointments" className="btn-secondary btn-md">
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
                Agendar Cita
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
