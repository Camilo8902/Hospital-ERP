'use client';

import { useTransition } from 'react';
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
  AlertCircle,
  FileText,
  Pill,
  Eye
} from 'lucide-react';
import { updateAppointmentStatus } from '@/lib/actions/appointments';

interface AppointmentCardProps {
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

// Función para formatear fecha/hora en zona horaria local del usuario
function formatLocalDateTime(isoString: string): { date: string; time: string } {
  const date = new Date(isoString);
  
  // Usar la zona horaria del navegador del usuario
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

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const status = statusConfig[appointment.status] || statusConfig.scheduled;
  const patientName = `${appointment.patient_first_name || ''} ${appointment.patient_last_name || ''}`.trim();
  
  // Formatear fecha y hora en zona horaria local
  const { date: dateStr, time: timeStr } = formatLocalDateTime(appointment.start_time);

  const handleCancel = async () => {
    if (confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      startTransition(async () => {
        await updateAppointmentStatus(appointment.id, 'cancelled');
        router.refresh();
      });
    }
  };

  return (
    <div className={`card overflow-hidden hover:shadow-lg transition-all duration-300 border ${status.border}`}>
      {/* Status bar */}
      <div className={`${status.bg} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={status.color}>{status.icon}</span>
          <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
        </div>
        <span className="text-xs text-gray-500 font-medium uppercase">
          {typeLabels[appointment.appointment_type] || appointment.appointment_type}
        </span>
      </div>

      <div className="p-4">
        {/* Time and Date - Single row */}
        <div className="w-full h-11 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
          <span className="text-base font-semibold text-primary-700">
            {timeStr} • {dateStr}
          </span>
        </div>

        {/* Patient Info */}
        <h3 className="font-semibold text-gray-900 text-lg mb-1">
          {patientName || 'Paciente sin nombre'}
        </h3>
        {appointment.reason && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-1">{appointment.reason}</p>
        )}

        {/* Details */}
        <div className="space-y-1.5 mb-4">
          {appointment.doctor_full_name && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Stethoscope className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="font-medium">Dr. {appointment.doctor_full_name}</span>
              {appointment.doctor_specialty && (
                <span className="text-gray-400">• {appointment.doctor_specialty}</span>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>
              {appointment.department_name || 'Sin asignar'}
              {appointment.room_number && ` • ${appointment.room_number}`}
            </span>
          </div>

          {appointment.patient_phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span>{appointment.patient_phone}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="relative">
          <div className="flex gap-2 flex-wrap">
            {/* Ver Detalle Button - Visible for ALL statuses */}
            <Link
              href={`/dashboard/appointments/${appointment.id}`}
              className="btn-secondary btn-sm flex items-center gap-1"
            >
              <FileText className="w-4 h-4" />
              Ver Detalle
            </Link>

            {/* Status-based Action Button */}
            {appointment.status === 'scheduled' && (
              <button
                onClick={() => {
                  startTransition(async () => {
                    await updateAppointmentStatus(appointment.id, 'in_progress');
                    router.push(`/dashboard/consultation/${appointment.id}`);
                  });
                }}
                disabled={isPending}
                className="flex-1 btn-primary btn-sm justify-center"
              >
                {isPending ? '...' : <><Play className="w-4 h-4 mr-1" />Iniciar Consulta</>}
              </button>
            )}

            {appointment.status === 'in_progress' && (
              <Link
                href={`/dashboard/consultation/${appointment.id}`}
                className="flex-1 btn-primary btn-sm justify-center flex items-center gap-1"
              >
                <Play className="w-4 h-4 mr-1" />
                Continuar Consulta
              </Link>
            )}

            {appointment.status === 'completed' && (
              <Link
                href={`/dashboard/consultation/${appointment.id}`}
                className="flex-1 btn-primary btn-sm justify-center flex items-center gap-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Ver Historia
              </Link>
            )}

            {/* Receta Button - Available for in_progress and completed */}
            {(appointment.status === 'in_progress' || appointment.status === 'completed') && (
              <Link
                href={`/dashboard/pharmacy/prescriptions/new?appointment_id=${appointment.id}&patient_id=${appointment.patient_id}`}
                className="btn-primary btn-sm flex items-center gap-1"
              >
                <Pill className="w-4 h-4" />
                Receta
              </Link>
            )}

            {/* Cancel option for scheduled and in_progress */}
            {(appointment.status === 'scheduled' || appointment.status === 'in_progress') && (
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="btn-danger btn-sm flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Cancelar
              </button>
            )}
          </div>

          {/* Completed/Cancelled state */}
          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
            <div className="mt-3 p-2 rounded-lg text-center text-sm font-medium">
              {appointment.status === 'completed' ? (
                <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full">✓ Cita completada</span>
              ) : (
                <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full">✗ Cita cancelada</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
