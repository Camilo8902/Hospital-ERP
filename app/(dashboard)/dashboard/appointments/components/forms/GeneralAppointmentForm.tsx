'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Loader2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { 
  PatientSelector, 
  DoctorSelector, 
  DateTimePicker
} from '../shared';
import { 
  AppointmentFormDispatcherProps,
  DepartmentSelector 
} from '../dispatcher/AppointmentFormDispatcher';

// Tipo de paciente para el selector
interface PatientSelect {
  id: string;
  first_name: string;
  last_name: string;
  medical_record_number: string;
  email?: string;
  phone: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Doctor {
  id: string;
  full_name: string;
  specialty?: string;
  email?: string;
}

interface Room {
  id: string;
  room_number: string;
  room_type: string;
}

// Función para convertir fecha local a formato UTC para Supabase
function toUTCDateTime(localDateTime: string): string {
  if (!localDateTime) return '';
  const date = new Date(localDateTime);
  return date.toISOString();
}

// Tipo de cita disponible
const appointmentTypes = [
  { value: 'consultation', label: 'Consulta' },
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'emergency', label: 'Emergencia' },
  { value: 'procedure', label: 'Procedimiento' },
  { value: 'surgery', label: 'Cirugía' },
];

export function GeneralAppointmentForm({
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
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  const [formData, setFormData] = useState({
    patient_id: initialData?.patient_id || '',
    doctor_id: initialData?.doctor_id || '',
    department_id: initialData?.department_id || '',
    room_id: initialData?.room_id || '',
    appointment_type: initialData?.appointment_type || 'consultation',
    start_time: initialData?.start_time 
      ? new Date(initialData.start_time).toISOString().slice(0, 16) 
      : '',
    end_time: initialData?.end_time 
      ? new Date(initialData.end_time).toISOString().slice(0, 16) 
      : '',
    reason: initialData?.reason || '',
    notes: initialData?.notes || '',
  });

  // Filtrar habitaciones por tipo de cita
  const filteredRooms = rooms.filter((r) => {
    if (formData.appointment_type === 'imaging') return r.room_type === 'imaging';
    if (formData.appointment_type === 'laboratory') return r.room_type === 'laboratory';
    if (formData.appointment_type === 'surgery') return r.room_type === 'surgery';
    return ['consultation', 'emergency'].includes(r.room_type);
  });

  // En modo creación, mostrar selector de departamento primero
  if (mode === 'create' && !selectedDepartment) {
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
            <p className="text-gray-500 mt-1">Selecciona el tipo de departamento</p>
          </div>
        </div>

        {/* Selector de departamento */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Seleccionar Departamento
            </h2>
          </div>
          <div className="card-body">
            <DepartmentSelector
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              departments={departments}
            />
          </div>
        </div>
      </div>
    );
  }

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

      if (mode === 'create') {
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
            workflow_status: 'scheduled',
          })
          .select()
          .single();

        if (insertError) {
          throw new Error(insertError.message);
        }

        router.push('/dashboard/appointments');
      } else {
        // Modo edición
        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            patient_id: formData.patient_id,
            doctor_id: formData.doctor_id || null,
            department_id: formData.department_id || null,
            room_id: formData.room_id || null,
            appointment_type: formData.appointment_type,
            start_time: utcStartTime,
            end_time: utcEndTime,
            reason: formData.reason || null,
            notes: formData.notes || null,
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Nueva Cita' : 'Editar Cita'}
          </h1>
          <p className="text-gray-500 mt-1">
            {mode === 'create' 
              ? 'Agendar una nueva cita médica' 
              : 'Modificar los datos de la cita'}
          </p>
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
            <h2 className="text-lg font-semibold text-gray-900">
              Información de la Cita
            </h2>
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
                {appointmentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
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
            <DateTimePicker
              label="Fecha y Hora de Inicio *"
              value={formData.start_time}
              onChange={(value: string)  =>
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
          </div>
        </div>

        {/* Paciente */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Paciente</h2>
          </div>
          <div className="card-body">
            <PatientSelector
              patients={patients}
              value={formData.patient_id}
              onChange={handlePatientChange}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              ¿El paciente no existe?{' '}
              <Link
                href="/dashboard/patients/new"
                className="text-primary-600 hover:text-primary-700"
              >
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
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.full_name}
                    {d.specialty && ` - ${d.specialty}`}
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
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
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
                {filteredRooms.map((r) => (
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
            <h2 className="text-lg font-semibold text-gray-900">
              Notas Adicionales
            </h2>
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
                {mode === 'create' ? 'Agendar Cita' : 'Guardar Cambios'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
