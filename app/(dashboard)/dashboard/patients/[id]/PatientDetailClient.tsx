'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, FileText, Pill, User, Phone, Mail, MapPin, Edit, Plus, Trash2, Loader2, TestTube, StickyNote, X, Save, Printer } from 'lucide-react';
import { formatDate, formatRelativeTime, getInitials, getAppointmentStatusColor, calculateAge } from '@/lib/utils';
import type { Patient, MedicalRecord, Appointment, UserRole, LabOrder, PatientNote } from '@/lib/types';
import { deletePatient, createPatientNote } from '@/lib/actions/patients';
import type { PrescriptionWithRelations } from '@/lib/actions/pharmacy';

interface PatientDetailClientProps {
  patient: Patient;
  medicalRecords: (MedicalRecord & { profiles?: { full_name: string; specialty?: string } })[];
  appointments: (Appointment & { departments?: { name: string }; rooms?: { room_number: string } })[];
  prescriptions: PrescriptionWithRelations[];
  labOrders: LabOrder[];
  patientNotes: PatientNote[];
  currentUserId: string;
  currentUserName: string;
  userRole: UserRole;
  canViewMedicalRecords: boolean;
  canEditRecords: boolean;
}

type TabType = 'overview' | 'records' | 'appointments' | 'prescriptions' | 'lab-results' | 'notes';

export default function PatientDetailClient({
  patient,
  medicalRecords,
  appointments,
  prescriptions,
  labOrders,
  patientNotes,
  currentUserId,
  currentUserName,
  userRole,
  canViewMedicalRecords,
  canEditRecords,
}: PatientDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [notes, setNotes] = useState(patientNotes);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al paciente "${patient.first_name} ${patient.last_name}"? Esta acción no se puede deshacer y también eliminará todos sus registros clínicos, citas y recetas.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePatient(patient.id);
      if (result.success) {
        router.push('/dashboard/patients');
      } else {
        alert(result.error || 'Error al eliminar el paciente');
      }
    } catch (error) {
      alert('Error inesperado al eliminar el paciente');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) {
      alert('Por favor ingresa una anotación');
      return;
    }

    setIsSavingNote(true);
    try {
      const result = await createPatientNote(
        patient.id,
        currentUserId,
        currentUserName,
        newNoteContent
      );

      if (result.success && result.note) {
        setNotes([result.note, ...notes]);
        setNewNoteContent('');
        setIsAddingNote(false);
        router.refresh();
      } else {
        alert(result.error || 'Error al guardar la anotación');
      }
    } catch (error) {
      console.error('Error guardando anotación:', error);
      alert('Error inesperado al guardar la anotación');
    } finally {
      setIsSavingNote(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Información', icon: <User className="w-4 h-4" /> },
    { id: 'records', label: 'Historia Clínica', icon: <FileText className="w-4 h-4" /> },
    { id: 'appointments', label: 'Citas', icon: <Calendar className="w-4 h-4" /> },
    { id: 'prescriptions', label: 'Recetas', icon: <Pill className="w-4 h-4" /> },
    { id: 'lab-results', label: 'Resultados Lab', icon: <TestTube className="w-4 h-4" /> },
    { id: 'notes', label: 'Anotaciones', icon: <StickyNote className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/patients"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
              {getInitials(`${patient.first_name} ${patient.last_name}`)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">MRN: {patient.medical_record_number}</span>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">
                  {calculateAge(patient.dob)} años • {patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : patient.gender}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canEditRecords && (
            <Link href={`/dashboard/patients/${patient.id}/edit`} className="btn-secondary btn-md">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          )}
          {userRole === 'admin' && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-danger btn-md"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </>
              )}
            </button>
          )}
          {(userRole === 'admin' || userRole === 'doctor' || userRole === 'reception') && (
            <Link href={`/dashboard/appointments/new?patient_id=${patient.id}`} className="btn-primary btn-md">
              <Plus className="w-4 h-4 mr-2" />
              Agendar Cita
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact info */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Información de Contacto</h2>
              </div>
              <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">{patient.phone}</p>
                  </div>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{patient.email}</p>
                    </div>
                  </div>
                )}
                {patient.address && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="font-medium">{patient.address}{patient.city && `, ${patient.city}`}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Medical info */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Información Médica</h2>
              </div>
              <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Tipo de Sangre</p>
                  <p className="font-medium text-lg">{patient.blood_type || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                  <p className="font-medium">{formatDate(patient.dob)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Alergias</p>
                  {patient.allergies && patient.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {patient.allergies.map((allergy, i) => (
                        <span key={i} className="badge badge-danger">{allergy}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">Ninguna registrada</p>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency contact */}
            {patient.emergency_contact_name && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Contacto de Emergencia</h2>
                </div>
                <div className="card-body">
                  <p className="font-medium">{patient.emergency_contact_name}</p>
                  {patient.emergency_contact_phone && (
                    <p className="text-gray-500">{patient.emergency_contact_phone}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Insurance */}
            {patient.insurance_provider && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Seguro</h2>
                </div>
                <div className="card-body">
                  <p className="font-medium">{patient.insurance_provider}</p>
                  {patient.insurance_policy_number && (
                    <p className="text-sm text-gray-500">Póliza: {patient.insurance_policy_number}</p>
                  )}
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
              </div>
              <div className="card-body space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Visitas</span>
                  <span className="font-medium">{medicalRecords.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Citas</span>
                  <span className="font-medium">{appointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recetas</span>
                  <span className="font-medium">{prescriptions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Labs</span>
                  <span className="font-medium">{labOrders.length}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {patient.notes && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-lg font-semibold text-gray-900">Notas</h2>
                </div>
                <div className="card-body">
                  <p className="text-sm text-gray-600">{patient.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Botón para imprimir historia clínica */}
          <div className="flex justify-end print:hidden">
            <button
              onClick={() => window.open(`/patients/${patient.id}/print`, '_blank')}
              className="btn-primary btn-md flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir Historia Clínica
            </button>
          </div>

          {!canViewMedicalRecords ? (
            <div className="card p-8 text-center">
              <p className="text-gray-500">No tienes permiso para ver el historial clínico.</p>
            </div>
          ) : medicalRecords.length > 0 ? (
            medicalRecords.map((record) => (
              <div key={record.id} className="card">
                <div className="card-header flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${
                        record.record_type === 'consultation' ? 'badge-info' :
                        record.record_type === 'procedure' ? 'badge-warning' :
                        record.record_type === 'discharge' ? 'badge-success' :
                        'badge-gray'
                      }`}>
                        {record.record_type === 'consultation' ? 'Consulta' :
                         record.record_type === 'procedure' ? 'Procedimiento' :
                         record.record_type === 'discharge' ? 'Alta' :
                         record.record_type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(record.visit_date)}
                      </span>
                    </div>
                    {record.profiles && (
                      <p className="text-sm text-gray-600 mt-1">
                        Dr. {record.profiles.full_name}
                        {record.profiles.specialty && ` - ${record.profiles.specialty}`}
                      </p>
                    )}
                  </div>
                  {canEditRecords && (
                    <Link
                      href={`/dashboard/patients/${patient.id}/history/${record.id}/edit`}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Editar
                    </Link>
                  )}
                </div>
                <div className="card-body">
                  {record.chief_complaint && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">Motivo de consulta</p>
                      <p className="text-gray-600">{record.chief_complaint}</p>
                    </div>
                  )}
                  {record.diagnosis && record.diagnosis.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">Diagnóstico</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {record.diagnosis.map((d, i) => (
                          <span key={i} className="badge badge-gray">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {record.treatment_plan && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Plan de tratamiento</p>
                      <p className="text-gray-600">{record.treatment_plan}</p>
                    </div>
                  )}
                  {record.vital_signs && Object.keys(record.vital_signs).length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">Signos vitales</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {record.vital_signs.blood_pressure && (
                          <div>
                            <p className="text-gray-500">Presión arterial</p>
                            <p className="font-medium">{record.vital_signs.blood_pressure}</p>
                          </div>
                        )}
                        {record.vital_signs.heart_rate && (
                          <div>
                            <p className="text-gray-500">Frecuencia cardíaca</p>
                            <p className="font-medium">{record.vital_signs.heart_rate} ppm</p>
                          </div>
                        )}
                        {record.vital_signs.temperature && (
                          <div>
                            <p className="text-gray-500">Temperatura</p>
                            <p className="font-medium">{record.vital_signs.temperature}°C</p>
                          </div>
                        )}
                        {record.vital_signs.weight && (
                          <div>
                            <p className="text-gray-500">Peso</p>
                            <p className="font-medium">{record.vital_signs.weight} kg</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500">No hay registros clínicos para este paciente</p>
              {canEditRecords && (
                <Link href={`/dashboard/patients/${patient.id}/history`} className="btn-primary btn-md mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Registro
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Tipo</th>
                  <th>Departamento</th>
                  <th>Estado</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length > 0 ? (
                  appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td>
                        <p className="font-medium">{formatDate(apt.start_time, "dd/MM/yyyy")}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(apt.start_time).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td>
                        <span className="badge badge-gray">
                          {apt.appointment_type === 'consultation' ? 'Consulta' :
                           apt.appointment_type === 'follow_up' ? 'Seguimiento' :
                           apt.appointment_type === 'emergency' ? 'Emergencia' :
                           apt.appointment_type}
                        </span>
                      </td>
                      <td>{apt.departments?.name || 'N/A'}</td>
                      <td>
                        <span className={`badge ${getAppointmentStatusColor(apt.status)}`}>
                          {apt.status === 'in_progress' ? 'En proceso' : apt.status}
                        </span>
                      </td>
                      <td className="max-w-xs truncate">{apt.reason || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No hay citas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Dosis</th>
                  <th>Frecuencia</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.length > 0 ? (
                  prescriptions.map((rx) => (
                    <tr key={rx.id}>
                      <td className="font-medium">{rx.medication_name}</td>
                      <td>{rx.dosage}</td>
                      <td>{rx.frequency}</td>
                      <td>{rx.duration}</td>
                      <td>
                        <span className={`badge ${
                          rx.status === 'dispensed' ? 'badge-success' :
                          rx.status === 'pending' ? 'badge-warning' :
                          rx.status === 'partially_dispensed' ? 'badge-info' :
                          'badge-gray'
                        }`}>
                          {rx.status === 'dispensed' ? 'Dispensado' :
                           rx.status === 'pending' ? 'Pendiente' :
                           rx.status === 'partially_dispensed' ? 'Parcial' :
                           rx.status}
                        </span>
                      </td>
                      <td>{formatDate(rx.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No hay recetas registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'lab-results' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Fecha</th>
                  <th>Pruebas</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {labOrders.length > 0 ? (
                  labOrders.map((order) => {
                    const testCount = order.lab_order_details?.length || 0;
                    const testNames = order.lab_order_details
                      ?.map((d: any) => d.tests?.name || d.custom_name || 'Prueba personalizada')
                      .slice(0, 2)
                      .join(', ');
                    
                    return (
                      <tr key={order.id}>
                        <td>
                          <p className="font-medium">{order.order_number}</p>
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>
                          <div>
                            <p className="font-medium">{testNames}{testCount > 2 && ` +${testCount - 2} más`}</p>
                            <p className="text-sm text-gray-500">{testCount} prueba{testCount !== 1 ? 's' : ''}</p>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            order.status === 'completed' ? 'badge-success' :
                            order.status === 'processing' ? 'badge-info' :
                            order.status === 'samples_collected' ? 'badge-warning' :
                            order.status === 'cancelled' ? 'badge-danger' :
                            'badge-gray'
                          }`}>
                            {order.status === 'completed' ? 'Completado' :
                             order.status === 'processing' ? 'En proceso' :
                             order.status === 'samples_collected' ? 'Muestras tomadas' :
                             order.status === 'cancelled' ? 'Cancelado' :
                             order.status === 'pending' ? 'Pendiente' : order.status}
                          </span>
                        </td>
                        <td>
                          {order.profiles?.full_name || order.completed_by ? 'Sí' : '-'}
                        </td>
                        <td>
                          <Link
                            href={`/dashboard/lab/orders/${order.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Ver Detalle
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      <TestTube className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No hay resultados de laboratorio para este paciente</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          {/* Header de la sección */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Anotaciones</h2>
            {!isAddingNote && (
              <button
                onClick={() => setIsAddingNote(true)}
                className="btn-primary btn-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Anotación
              </button>
            )}
          </div>

          {/* Formulario para nueva anotación */}
          {isAddingNote && (
            <div className="card border-primary-200 bg-primary-50">
              <div className="card-body">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">Nueva Anotación</h3>
                  <button
                    onClick={() => {
                      setIsAddingNote(false);
                      setNewNoteContent('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Escribe tu anotación aquí..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[120px] resize-y"
                  disabled={isSavingNote}
                />
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => {
                      setIsAddingNote(false);
                      setNewNoteContent('');
                    }}
                    className="btn-secondary btn-md"
                    disabled={isSavingNote}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="btn-primary btn-md flex items-center gap-2"
                    disabled={isSavingNote || !newNoteContent.trim()}
                  >
                    {isSavingNote ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de anotaciones */}
          <div className="space-y-3">
            {notes.length > 0 ? (
              notes.map((note) => (
                <div key={note.id} className="card">
                  <div className="card-body">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{note.author_name}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(note.created_at, 'dd/MM/yyyy')} a las {new Date(note.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-8 text-center">
                <StickyNote className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No hay anotaciones registradas para este paciente</p>
                <p className="text-sm text-gray-400 mt-1">Haz clic en "Nueva Anotación" para agregar la primera</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SECCIÓN DE IMPRESIÓN - OCULTA EN PANTALLA */}
      {/* ============================================ */}
      <div className="hidden print:block print-only-content">
        
        {/* Encabezado de la Historia Clínica */}
        <div className="print-header">
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wide">Historia Clínica</h1>
              <p className="text-sm text-gray-600">Médicore ERP - Sistema de Gestión Hospitalaria</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">Fecha de impresión: {formatDate(new Date().toISOString(), 'dd/MM/yyyy')}</p>
              <p className="text-gray-500">Hora: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </div>

        {/* Datos del Paciente */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3 uppercase">Datos del Paciente</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-1 font-medium w-32">Nombre:</td>
                <td className="py-1">{patient.first_name} {patient.last_name}</td>
                <td className="py-1 font-medium w-32">Fecha Nac.:</td>
                <td className="py-1">{formatDate(patient.dob)} ({calculateAge(patient.dob)} años)</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-1 font-medium">Sexo:</td>
                <td className="py-1">{patient.gender === 'male' ? 'Masculino' : patient.gender === 'female' ? 'Femenino' : patient.gender}</td>
                <td className="py-1 font-medium">MRN:</td>
                <td className="py-1">{patient.medical_record_number}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-1 font-medium">Teléfono:</td>
                <td className="py-1">{patient.phone}</td>
                <td className="py-1 font-medium">Email:</td>
                <td className="py-1">{patient.email || 'No registrado'}</td>
              </tr>
              {patient.insurance_provider && (
                <tr className="border-b border-gray-200">
                  <td className="py-1 font-medium">Seguro:</td>
                  <td className="py-1">{patient.insurance_provider} {patient.insurance_policy_number && `- Póliza: ${patient.insurance_policy_number}`}</td>
                  <td className="py-1 font-medium">Tipo Sangre:</td>
                  <td className="py-1">{patient.blood_type || 'No registrado'}</td>
                </tr>
              )}
              {patient.emergency_contact_name && (
                <tr className="border-b border-gray-200">
                  <td className="py-1 font-medium">Contacto Emerg.:</td>
                  <td className="py-1">{patient.emergency_contact_name} {patient.emergency_contact_phone && `- ${patient.emergency_contact_phone}`}</td>
                  <td className="py-1"></td>
                  <td className="py-1"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Alergias */}
        {patient.allergies && patient.allergies.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-bold border-b border-gray-300 pb-1 mb-2 uppercase bg-gray-100 p-2">Alergias</h3>
            <p className="text-sm">
              {patient.allergies.map((allergy, i) => (
                <span key={i} className="inline-block bg-gray-200 px-2 py-1 rounded mr-2 mb-1">{allergy}</span>
              ))}
            </p>
          </div>
        )}

        {/* Historia Clínica */}
        {medicalRecords.length > 0 && (
          <div className="mb-6 break-inside-avoid">
            <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3 uppercase">Registro Clínico</h2>
            {medicalRecords.map((record) => (
              <div key={record.id} className="mb-4 border border-gray-300 rounded p-3 break-inside-avoid">
                <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
                  <div>
                    <span className="font-bold">
                      {record.record_type === 'consultation' ? 'CONSULTA' :
                       record.record_type === 'procedure' ? 'PROCEDIMIENTO' :
                       record.record_type === 'discharge' ? 'ALTA MÉDICA' :
                       record.record_type?.toUpperCase()}
                    </span>
                    <span className="text-gray-600 ml-2">- {formatDate(record.visit_date)}</span>
                  </div>
                  <div className="text-gray-600">
                    Dr. {record.profiles?.full_name || 'No especificado'}
                    {record.profiles?.specialty && ` (${record.profiles.specialty})`}
                  </div>
                </div>
                {record.chief_complaint && (
                  <p className="text-sm mb-2"><span className="font-medium">Motivo:</span> {record.chief_complaint}</p>
                )}
                {record.diagnosis && record.diagnosis.length > 0 && (
                  <p className="text-sm mb-2">
                    <span className="font-medium">Diagnóstico:</span> {record.diagnosis.join(', ')}
                  </p>
                )}
                {record.treatment_plan && (
                  <p className="text-sm mb-2"><span className="font-medium">Plan de Tratamiento:</span> {record.treatment_plan}</p>
                )}
                {record.notes && (
                  <p className="text-sm"><span className="font-medium">Notas:</span> {record.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recetas Médicas */}
        {prescriptions.length > 0 && (
          <div className="mb-6 break-inside-avoid">
            <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3 uppercase">Recetas Médicas</h2>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Fecha</th>
                  <th className="border border-gray-300 p-2 text-left">Medicamento</th>
                  <th className="border border-gray-300 p-2 text-left">Dosis</th>
                  <th className="border border-gray-300 p-2 text-left">Frecuencia</th>
                  <th className="border border-gray-300 p-2 text-left">Duración</th>
                  <th className="border border-gray-300 p-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="border-b border-gray-200">
                    <td className="border border-gray-300 p-2">{formatDate(rx.created_at)}</td>
                    <td className="border border-gray-300 p-2 font-medium">{rx.medication_name}</td>
                    <td className="border border-gray-300 p-2">{rx.dosage}</td>
                    <td className="border border-gray-300 p-2">{rx.frequency}</td>
                    <td className="border border-gray-300 p-2">{rx.duration}</td>
                    <td className="border border-gray-300 p-2">
                      {rx.status === 'dispensed' ? 'Dispensado' :
                       rx.status === 'pending' ? 'Pendiente' :
                       rx.status === 'partially_dispensed' ? 'Parcial' :
                       rx.status === 'cancelled' ? 'Cancelado' :
                       rx.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Resultados de Laboratorio */}
        {labOrders.length > 0 && (
          <div className="mb-6 break-inside-avoid">
            <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3 uppercase">Resultados de Laboratorio</h2>
            {labOrders.map((order) => (
              <div key={order.id} className="mb-4 border border-gray-300 rounded p-3 break-inside-avoid">
                <div className="flex justify-between border-b border-gray-200 pb-2 mb-2">
                  <span className="font-bold">Orden: {order.order_number}</span>
                  <span className="text-gray-600">{formatDate(order.created_at)}</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium mb-1">Pruebas:</p>
                  <ul className="list-disc list-inside ml-2">
                    {order.lab_order_details?.map((detail: any) => (
                      <li key={detail.id}>
                        {detail.tests?.name || detail.custom_name || 'Prueba personalizada'}
                        <span className="text-gray-500 ml-2">
                          ({detail.tests?.category?.name || 'Sin categoría'})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'samples_collected' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status === 'completed' ? 'COMPLETADO' :
                     order.status === 'processing' ? 'EN PROCESO' :
                     order.status === 'samples_collected' ? 'MUESTRAS TOMADAS' :
                     order.status === 'pending' ? 'PENDIENTE' :
                     order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Anotaciones */}
        {notes.length > 0 && (
          <div className="mb-6 break-inside-avoid">
            <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3 uppercase">Anotaciones</h2>
            {notes.map((note) => (
              <div key={note.id} className="mb-3 border-l-4 border-blue-500 pl-3 py-1 break-inside-avoid">
                <p className="text-sm font-medium">{note.author_name}</p>
                <p className="text-xs text-gray-500 mb-1">
                  {formatDate(note.created_at, 'dd/MM/yyyy')} a las {new Date(note.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm">{note.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Citas */}
        {appointments.length > 0 && (
          <div className="mb-6 break-inside-avoid">
            <h2 className="text-lg font-bold border-b border-gray-400 pb-1 mb-3 uppercase">Historial de Citas</h2>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Fecha</th>
                  <th className="border border-gray-300 p-2 text-left">Tipo</th>
                  <th className="border border-gray-300 p-2 text-left">Departamento</th>
                  <th className="border border-gray-300 p-2 text-left">Estado</th>
                  <th className="border border-gray-300 p-2 text-left">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-gray-200">
                    <td className="border border-gray-300 p-2">{formatDate(apt.start_time)}</td>
                    <td className="border border-gray-300 p-2">
                      {apt.appointment_type === 'consultation' ? 'Consulta' :
                       apt.appointment_type === 'follow_up' ? 'Seguimiento' :
                       apt.appointment_type === 'emergency' ? 'Emergencia' :
                       apt.appointment_type}
                    </td>
                    <td className="border border-gray-300 p-2">{apt.departments?.name || 'N/A'}</td>
                    <td className="border border-gray-300 p-2">
                      {apt.status === 'completed' ? 'Completada' :
                       apt.status === 'in_progress' ? 'En Progreso' :
                       apt.status === 'cancelled' ? 'Cancelada' :
                       apt.status === 'no_show' ? 'No Asistió' :
                       apt.status}
                    </td>
                    <td className="border border-gray-300 p-2 max-w-xs truncate">{apt.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pie de página */}
        <div className="mt-8 pt-4 border-t border-gray-400 text-xs text-gray-500">
          <div className="flex justify-between">
            <p>Registro Médico Confidencial - Generated by Médicore ERP</p>
            <p>Página 1</p>
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: letter;
          }
          
          body {
            background: white !important;
          }
          
          .print-only-content {
            display: block !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            background: white;
            z-index: 9999;
          }
          
          .print-hide, 
          .print\:hidden {
            display: none !important;
          }
          
          .print-block {
            display: block !important;
          }
          
          /* Ocultar todo lo que no sea la sección de impresión */
          body > *:not(.print-only-content) {
            display: none !important;
          }
          
          /* Estilos para tablas */
          table {
            page-break-inside: avoid;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          thead {
            display: table-header-group;
          }
          
          tfoot {
            display: table-footer-group;
          }
          
          /* Evitar saltos dentro de elementos */
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          /* Encabezados de sección */
          h2 {
            page-break-before: auto;
            margin-top: 1.5em;
          }
          
          /* Links - mostrar URL entre paréntesis */
          a[href^="http"]::after {
            content: " (" attr(href) ")";
            display: none;
          }
        }
        
        @media screen {
          .print-only-content {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
