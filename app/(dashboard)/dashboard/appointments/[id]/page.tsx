'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  FileText,
  Pill,
  Edit,
  AlertTriangle,
  Eye,
  Plus,
} from 'lucide-react';
import { formatDate, formatDateTime, formatTime } from '@/lib/utils';
import type { Appointment, Patient, Prescription } from '@/lib/types';

interface ClinicalRecord {
  id: string;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  physical_examination: string | null;
  diagnosis: any[] | null;
  treatment_plan: string | null;
  recommendations: string | null;
  notes: string | null;
  follow_up_required: boolean;
  follow_up_date: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    specialty: string | null;
  } | null;
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const appointmentId = params.id as string;
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [clinicalRecord, setClinicalRecord] = useState<ClinicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointmentData = async () => {
      if (!appointmentId) {
        console.log('[DEBUG] No hay appointmentId, saliendo');
        return;
      }

      console.log('[DEBUG] Iniciando fetch para appointmentId:', appointmentId);
      setLoading(true);

      try {
        // Usar la API que usa el cliente admin
        const response = await fetch(`/api/clinical-records/appointments/${appointmentId}`);
        
        console.log('[DEBUG] Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('[DEBUG] Error en response:', errorData);
          throw new Error(errorData.error || 'Error al cargar datos de la cita');
        }
        
        const data = await response.json();
        
        console.log('[DEBUG] Datos recibidos:');
        console.log('- appointment:', data.appointment?.id);
        console.log('- patient:', data.patient?.first_name, data.patient?.last_name);
        console.log('- clinicalRecord:', data.clinicalRecord?.id);
        console.log('- prescriptions count:', data.prescriptions?.length || 0);
        console.log('- prescriptions:', JSON.stringify(data.prescriptions, null, 2));
        
        setAppointment(data.appointment);
        setPatient(data.patient);
        setClinicalRecord(data.clinicalRecord);
        setPrescriptions(data.prescriptions || []);
      } catch (err) {
        console.error('[DEBUG] Error cargando datos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
        console.log('[DEBUG] Loading terminado');
      }
    };

    console.log('[DEBUG] useEffect ejecutándose, appointmentId:', appointmentId);
    fetchAppointmentData();
  }, [appointmentId]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      scheduled: { label: 'Programada', color: 'bg-blue-100 text-blue-700' },
      in_progress: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-700' },
      completed: { label: 'Completada', color: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
      no_show: { label: 'No Asistió', color: 'bg-gray-100 text-gray-700' },
    };

    const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
    return <span className={`badge ${config.color}`}>{config.label}</span>;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      consultation: 'Consulta',
      follow_up: 'Seguimiento',
      emergency: 'Emergencia',
      procedure: 'Procedimiento',
      imaging: 'Imagen',
      laboratory: 'Laboratorio',
      surgery: 'Cirugía',
    };
    return types[type] || type;
  };

  // Debug: Mostrar estado actual
  console.log('[RENDER] prescriptions.length:', prescriptions.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Cita no encontrada</p>
        <Link href="/dashboard/appointments" className="btn-primary mt-4">
          Volver a Citas
        </Link>
      </div>
    );
  }

  // Determinar texto y acción del botón de receta
  const hasPrescription = prescriptions.length > 0;
  console.log('[RENDER] hasPrescription:', hasPrescription);
  const prescriptionButtonText = hasPrescription ? 'Ver Recetas' : 'Generar Receta';
  const prescriptionButtonAction = hasPrescription 
    ? `/dashboard/pharmacy/prescriptions?appointment_id=${appointmentId}`
    : `/dashboard/pharmacy/prescriptions/new?appointment_id=${appointmentId}&patient_id=${appointment.patient_id}`;

  // Determinar texto y acción del botón de historia clínica
  const hasClinicalRecord = !!clinicalRecord;
  const clinicalRecordButtonText = hasClinicalRecord ? 'Ver Historia Clínica' : 'Generar Historia Clínica';
  const clinicalRecordButtonAction = hasClinicalRecord 
    ? (patient ? `/dashboard/patients/${patient.id}/history/${clinicalRecord.id}` : '#')
    : `/dashboard/consultation/${appointmentId}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/appointments"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalle de Cita</h1>
            <p className="text-gray-500 mt-1">
              {formatDate(appointment.start_time)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(appointment.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Details */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Información de la Cita</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tipo de Cita</p>
                  <p className="font-medium">{getTypeLabel(appointment.appointment_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  {getStatusBadge(appointment.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha y Hora</p>
                  <p className="font-medium">{formatDateTime(appointment.start_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hora de Fin</p>
                  <p className="font-medium">{formatTime(appointment.end_time)}</p>
                </div>
                {appointment.reason && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Motivo</p>
                    <p className="font-medium">{appointment.reason}</p>
                  </div>
                )}
                {appointment.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Notas</p>
                    <p className="text-gray-700">{appointment.notes}</p>
                  </div>
                )}
                {clinicalRecord?.follow_up_required && clinicalRecord?.follow_up_date && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Seguimiento Programado
                    </p>
                    <p className="font-medium text-amber-700">
                      {formatDate(clinicalRecord.follow_up_date)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Info */}
          {patient && (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Información del Paciente</h2>
                <Link
                  href={`/dashboard/patients/${patient.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Ver historial completo
                </Link>
              </div>
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <p className="text-gray-500">
                      MRN: {patient.medical_record_number}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium">{patient.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                        <p className="font-medium">{formatDate(patient.dob)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tipo de Sangre</p>
                        <p className="font-medium">{patient.blood_type || 'No registrado'}</p>
                      </div>
                      {patient.allergies && patient.allergies.length > 0 && (
                        <div className="col-span-full">
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            Alergias
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {patient.allergies.map((allergy, idx) => (
                              <span key={idx} className="badge badge-red">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Record Summary */}
          {clinicalRecord && (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Historia Clínica</h2>
                {patient && (
                  <Link
                    href={`/dashboard/patients/${patient.id}/history/${clinicalRecord.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Completa
                  </Link>
                )}
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {clinicalRecord.chief_complaint && (
                    <div>
                      <p className="text-sm text-gray-500">Motivo de Consulta</p>
                      <p className="text-gray-900">{clinicalRecord.chief_complaint}</p>
                    </div>
                  )}
                  
                  {clinicalRecord.diagnosis && clinicalRecord.diagnosis.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Diagnósticos</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {clinicalRecord.diagnosis.map((dx: any, idx: number) => (
                          <span key={idx} className="badge badge-danger">
                            {dx.code}: {dx.description}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {clinicalRecord.treatment_plan && (
                    <div>
                      <p className="text-sm text-gray-500">Plan de Tratamiento</p>
                      <p className="text-gray-900">{clinicalRecord.treatment_plan}</p>
                    </div>
                  )}

                  {clinicalRecord.physical_examination && (
                    <div>
                      <p className="text-sm text-gray-500">Exploración Física</p>
                      <p className="text-gray-900">{clinicalRecord.physical_examination}</p>
                    </div>
                  )}

                  {clinicalRecord.profiles && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-100">
                      <User className="w-4 h-4" />
                      <span>
                        Dr. {clinicalRecord.profiles.full_name}
                        {clinicalRecord.profiles.specialty && ` - ${clinicalRecord.profiles.specialty}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prescriptions */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recetas Médicas</h2>
              <Link
                href={prescriptionButtonAction}
                className="btn-primary btn-sm flex items-center gap-1"
              >
                {hasPrescription ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Ver Recetas ({prescriptions.length})
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Nueva Receta
                  </>
                )}
              </Link>
            </div>
            <div className="card-body">
              {prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{rx.medication_name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {rx.dosage} - {rx.frequency} - {rx.duration}
                          </p>
                          <p className="text-sm text-gray-500">
                            Cantidad: {rx.quantity_prescribed} | Status: {rx.status}
                          </p>
                        </div>
                        <span className={`badge ${
                          rx.status === 'dispensed' ? 'badge-green' :
                          rx.status === 'pending' ? 'badge-yellow' :
                          rx.status === 'cancelled' ? 'badge-red' :
                          'badge-gray'
                        }`}>
                          {rx.status === 'dispensed' ? 'Dispensada' :
                           rx.status === 'pending' ? 'Pendiente' :
                           rx.status === 'cancelled' ? 'Cancelada' : rx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Pill className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p>No hay recetas para esta cita</p>
                  <Link
                    href={`/dashboard/pharmacy/prescriptions/new?appointment_id=${appointmentId}&patient_id=${appointment.patient_id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm mt-2 inline-block"
                  >
                    Crear primera receta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Acciones</h2>
            </div>
            <div className="card-body space-y-2">
              <Link
                href={prescriptionButtonAction}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Pill className="w-4 h-4" />
                {prescriptionButtonText}
              </Link>
              <Link
                href={clinicalRecordButtonAction}
                className={`w-full flex items-center justify-center gap-2 ${
                  hasClinicalRecord ? 'btn-secondary' : 'btn-secondary'
                }`}
              >
                <FileText className="w-4 h-4" />
                {clinicalRecordButtonText}
              </Link>
            </div>
          </div>

          {/* Quick Info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
            </div>
            <div className="card-body space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Recetas</span>
                <span className="font-medium">{prescriptions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Dispensadas</span>
                <span className="font-medium text-green-600">
                  {prescriptions.filter(rx => rx.status === 'dispensed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Pendientes</span>
                <span className="font-medium text-yellow-600">
                  {prescriptions.filter(rx => rx.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Historia Clínica</span>
                <span className={`font-medium ${hasClinicalRecord ? 'text-green-600' : 'text-gray-400'}`}>
                  {hasClinicalRecord ? 'Completada' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
