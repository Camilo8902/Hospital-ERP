'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Plus,
  Edit,
  ChevronRight,
  Stethoscope,
  ClipboardList,
} from 'lucide-react';
import { formatDate, truncate, getInitials } from '@/lib/utils';

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
  visit_date: string;
  record_type: string;
  chief_complaint: string | null;
  diagnosis: any[] | null;
  treatment_plan: string | null;
  doctor_id: string | null;
  follow_up_required: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    specialty: string | null;
  } | null;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_type: string;
  status: string;
  start_time: string;
  end_time: string;
  reason: string | null;
}

export default function PatientHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<ClinicalRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showNewRecordModal, setShowNewRecordModal] = useState(false);

  // Cargar datos del paciente, su historial y citas
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar paciente
        const patientResponse = await fetch(`/api/patients/${patientId}`);
        if (!patientResponse.ok) {
          throw new Error('Error al cargar datos del paciente');
        }
        const patientData = await patientResponse.json();
        setPatient(patientData.patient);

        // Cargar historial clínico
        const historyResponse = await fetch(`/api/clinical-records/patient/${patientId}`);
        if (!historyResponse.ok) {
          throw new Error('Error al cargar historial clínico');
        }
        const historyData = await historyResponse.json();
        setRecords(historyData.records || []);

        // Cargar citas del paciente
        const appointmentsResponse = await fetch(`/api/appointments/patient/${patientId}`);
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          setAppointments(appointmentsData.appointments || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadData();
    }
  }, [patientId]);

  // Filtrar registros clínicos
  const filteredRecords = records.filter((record) => {
    // Filtro por tipo
    if (filterType !== 'all' && record.record_type !== filterType) {
      return false;
    }
    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesChiefComplaint = record.chief_complaint?.toLowerCase().includes(searchLower);
      const matchesDiagnosis = record.diagnosis?.some(
        (d) => d.description?.toLowerCase().includes(searchLower) || d.code?.toLowerCase().includes(searchLower)
      );
      const matchesDoctor = record.profiles?.full_name?.toLowerCase().includes(searchLower);
      return matchesChiefComplaint || matchesDiagnosis || matchesDoctor;
    }
    return true;
  });

  // Obtener estadísticas
  const stats = {
    total: records.length,
    withFollowUp: records.filter((r) => r.follow_up_required).length,
    lastVisit: records.length > 0 ? records[0].visit_date : null,
  };

  // Obtener citas pendientes para crear registros
  const pendingAppointments = appointments.filter(apt => 
    apt.status === 'in_progress' || apt.status === 'scheduled'
  );

  const handleCreateRecord = (appointmentId: string) => {
    router.push(`/dashboard/consultation/${appointmentId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-500">{error}</p>
        <Link href="/dashboard/patients" className="btn-primary mt-4">
          Volver a Pacientes
        </Link>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Paciente no encontrado</p>
        <Link href="/dashboard/patients" className="btn-primary mt-4">
          Volver a Pacientes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/patients/${patientId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historial Clínico</h1>
            <p className="text-gray-500 mt-1">
              {patient.first_name} {patient.last_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingAppointments.length > 0 ? (
            <div className="relative">
              <button
                onClick={() => setShowNewRecordModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Registro
              </button>
              {/* Modal de selección de cita */}
              {showNewRecordModal && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Seleccionar Cita</h3>
                    <p className="text-sm text-gray-500">Elige la cita para crear el registro</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {pendingAppointments.map((apt) => (
                      <button
                        key={apt.id}
                        onClick={() => {
                          handleCreateRecord(apt.id);
                          setShowNewRecordModal(false);
                        }}
                        className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-primary-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatDate(apt.start_time)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {apt.appointment_type === 'consultation' ? 'Consulta' : 'Seguimiento'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <button
                      onClick={() => setShowNewRecordModal(false)}
                      className="w-full btn-secondary text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/dashboard/appointments/new?patient_id=${patientId}`}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agendar Cita
            </Link>
          )}
        </div>
      </div>

      {/* Información del paciente */}
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
                <p className="text-sm text-gray-500">Edad</p>
                <p className="font-medium">
                  {patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '-'} años
                </p>
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

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Registros</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Requiere Seguimiento</p>
              <p className="text-2xl font-bold">{stats.withFollowUp}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Última Visita</p>
              <p className="text-2xl font-bold">
                {stats.lastVisit ? formatDate(stats.lastVisit) : 'Sin registros'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por motivo, diagnóstico o médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input w-48"
              >
                <option value="all">Todos los tipos</option>
                <option value="consultation">Consulta</option>
                <option value="progress_note">Nota de Progreso</option>
                <option value="procedure">Procedimiento</option>
                <option value="discharge">Alta</option>
                <option value="referral">Referencia</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de registros clínicos */}
      {filteredRecords.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay registros clínicos</h3>
            <p className="text-gray-500 mb-4">
              {records.length === 0
                ? 'Este paciente aún no tiene historial clínico registrado.'
                : 'No se encontraron registros con los filtros aplicados.'}
            </p>
            {pendingAppointments.length > 0 ? (
              <button
                onClick={() => setShowNewRecordModal(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear Primer Registro
              </button>
            ) : (
              <Link
                href={`/dashboard/appointments/new?patient_id=${patientId}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Agendar Primera Cita
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`badge ${
                        record.record_type === 'consultation' ? 'badge-primary' :
                        record.record_type === 'progress_note' ? 'badge-info' :
                        record.record_type === 'procedure' ? 'badge-warning' :
                        record.record_type === 'discharge' ? 'badge-success' :
                        record.record_type === 'referral' ? 'badge-secondary' :
                        record.record_type === 'lab_result' ? 'badge-danger' :
                        'badge-gray'
                      }`}>
                        {record.record_type === 'consultation' ? 'Consulta' :
                         record.record_type === 'progress_note' ? 'Nota de Progreso' :
                         record.record_type === 'procedure' ? 'Procedimiento' :
                         record.record_type === 'discharge' ? 'Alta Médica' :
                         record.record_type === 'referral' ? 'Referencia' :
                         record.record_type === 'lab_result' ? 'Resultado de Laboratorio' :
                         'Resultado de Imagen'}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(record.visit_date)}
                      </span>
                      {record.follow_up_required && (
                        <span className="badge badge-warning flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Seguimiento
                        </span>
                      )}
                    </div>

                    <h3 className="font-medium text-gray-900 mb-2">
                      {record.chief_complaint || 'Sin motivo de consulta registrado'}
                    </h3>

                    {/* Diagnósticos */}
                    {record.diagnosis && record.diagnosis.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">Diagnósticos:</p>
                        <div className="flex flex-wrap gap-2">
                          {record.diagnosis.map((dx: any, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-sm"
                            >
                              <AlertCircle className="w-3 h-3" />
                              {dx.code}: {truncate(dx.description || '', 40)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Médico */}
                    {record.profiles && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        <span>
                          Dr. {record.profiles.full_name}
                          {record.profiles.specialty && ` - ${record.profiles.specialty}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/patients/${patientId}/history/${record.id}/edit`}
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Link>
                    <Link
                      href={`/dashboard/patients/${patientId}/history/${record.id}`}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Ver
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
