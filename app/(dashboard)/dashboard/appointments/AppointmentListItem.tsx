'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  User, 
  MapPin, 
  Stethoscope, 
  CheckCircle2,
  XCircle,
  Play,
  MoreVertical,
  AlertCircle,
  FileText,
  Pill
} from 'lucide-react';
import { updateAppointmentStatus, deleteAppointment } from '@/lib/actions/appointments';

interface AppointmentListItemProps {
  appointment: {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    appointment_type: string;
    reason: string | null;
    patient_id: string;
    patient_first_name?: string | null;
    patient_last_name?: string | null;
    patient_phone?: string | null;
    doctor_full_name?: string | null;
    doctor_specialty?: string | null;
    department_name?: string | null;
    room_number?: string | null;
  };
}

const statusConfig: Record<string, { 
  label: string; 
  color: string; 
  bg: string; 
  border: string;
  icon: React.ReactNode;
}> = {
  scheduled: {
    label: 'Programada',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Clock className="w-4 h-4" />,
  },
  in_progress: {
    label: 'En Progreso',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <Play className="w-4 h-4" />,
  },
  completed: {
    label: 'Completada',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  cancelled: {
    label: 'Cancelada',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: <XCircle className="w-4 h-4" />,
  },
  no_show: {
    label: 'No se presentó',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: <AlertCircle className="w-4 h-4" />,
  },
};

const typeLabels: Record<string, string> = {
  consultation: 'Consulta',
  follow_up: 'Seguimiento',
  emergency: 'Emergencia',
  procedure: 'Procedimiento',
  imaging: 'Imagenología',
  laboratory: 'Laboratorio',
  surgery: 'Cirugía',
};

// Función para formatear fecha/hora en zona horaria local
function formatLocalDateTime(isoString: string): { date: string; time: string } {
  const date = new Date(isoString);
  
  const timeStr = date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  const dateStr = date.toLocaleDateString('es-ES', { 
    weekday: 'short',
    day: 'numeric', 
    month: 'short'
  });
  
  return { date: dateStr, time: timeStr };
}

export default function AppointmentListItem({ appointment }: AppointmentListItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showActions, setShowActions] = useState(false);

  const status = statusConfig[appointment.status] || statusConfig.scheduled;
  const patientName = `${appointment.patient_first_name || ''} ${appointment.patient_last_name || ''}`.trim();
  const { date: dateStr, time: timeStr } = formatLocalDateTime(appointment.start_time);
  const typeLabel = typeLabels[appointment.appointment_type] || appointment.appointment_type;

  const handleStatusChange = async (newStatus: string) => {
    startTransition(async () => {
      await updateAppointmentStatus(appointment.id, newStatus);
      router.refresh();
      setShowActions(false);
    });
  };

  const handleCancel = async () => {
    if (confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      startTransition(async () => {
        await updateAppointmentStatus(appointment.id, 'cancelled');
        router.refresh();
        setShowActions(false);
      });
    }
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar esta cita? Esta acción no se puede deshacer.')) {
      startTransition(async () => {
        const result = await deleteAppointment(appointment.id);
        if (!result.success) {
          alert('Error al eliminar: ' + result.error);
        }
        router.refresh();
        setShowActions(false);
      });
    }
  };

  const canStart = appointment.status === 'scheduled';
  const canComplete = appointment.status === 'in_progress';
  const canCancel = !['completed', 'cancelled'].includes(appointment.status);

  return (
    <div className={`card overflow-hidden hover:shadow-md transition-all duration-200 border-l-4 ${status.border}`}>
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Hora */}
          <div className="flex-shrink-0 w-20 text-center">
            <div className="text-lg font-bold text-gray-900">{timeStr}</div>
            <div className="text-xs text-gray-500">{dateStr}</div>
          </div>

          {/* Divider */}
          <div className="w-px h-16 bg-gray-200"></div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {patientName || 'Paciente sin nombre'}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                {status.label}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                {typeLabel}
              </span>
              
              {appointment.doctor_full_name && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Dr. {appointment.doctor_full_name}
                </span>
              )}
              
              {(appointment.department_name || appointment.room_number) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {appointment.department_name}
                  {appointment.room_number && ` • ${appointment.room_number}`}
                </span>
              )}
            </div>

            {appointment.reason && (
              <p className="text-xs text-gray-500 mt-1 truncate">{appointment.reason}</p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-1">
              <Link
                href={`/dashboard/appointments/${appointment.id}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ver detalle"
              >
                <FileText className="w-4 h-4 text-gray-500" />
              </Link>
              <Link
                href={`/dashboard/pharmacy/prescriptions/new?appointment_id=${appointment.id}&patient_id=${appointment.patient_id}`}
                className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                title="Crear receta"
              >
                <Pill className="w-4 h-4 text-primary-600" />
              </Link>
              
              <div className="relative ml-1">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="btn-secondary btn-sm px-2"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showActions && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                    {canStart && (
                      <button onClick={() => handleStatusChange('in_progress')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                        <Play className="w-4 h-4 text-blue-500" /> Iniciar cita
                      </button>
                    )}
                    {canComplete && (
                      <button onClick={() => handleStatusChange('completed')} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> Completar
                      </button>
                    )}
                    {canCancel && (
                      <>
                        <button onClick={handleCancel} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                          <XCircle className="w-4 h-4" /> Cancelar cita
                        </button>
                        <hr className="my-1" />
                        <button onClick={handleDelete} className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                          <XCircle className="w-4 h-4" /> Eliminar
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
