'use client';

import { useState } from 'react';
import { 
  Calendar, Clock, User, MapPin, ChevronRight, Activity, FlaskConical, Scan, Stethoscope, Syringe
} from 'lucide-react';
import { DepartmentCode } from '@/lib/types/department-data';
import PhysioAppointmentDetails from './department-specific/PhysioAppointmentDetails';
import LabAppointmentDetails from './department-specific/LabAppointmentDetails';
import ImagingAppointmentDetails from './department-specific/ImagingAppointmentDetails';
import GeneralAppointmentDetails from './department-specific/GeneralAppointmentDetails';

interface AdaptiveAppointmentCardProps {
  appointment: any;
  onClick?: () => void;
  onStatusChange?: (status: string) => void;
  showActions?: boolean;
}

const DEPARTMENT_ICONS: Record<DepartmentCode, React.ComponentType<{ className?: string }>> = {
  'FT': Activity,
  'LAB': FlaskConical,
  'RAD': Scan,
  'MG': Stethoscope,
  'CG': Syringe,
  'CAR': Activity,
  'PED': User,
  'URG': Clock,
  'OFT': Scan,
  'PSI': User,
  'NUT': Activity,
  'FAR': FlaskConical,
  'DER': Activity,
  'GIN': Stethoscope,
  'FIS': Activity,
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  no_show: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

const WORKFLOW_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programada',
  checked_in: 'Esperando',
  in_consultation: 'En consulta',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No se presentó',
};

export default function AdaptiveAppointmentCard({
  appointment,
  onClick,
  showActions = true,
}: AdaptiveAppointmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const departmentCode = appointment.department_id as DepartmentCode;
  const Icon = DEPARTMENT_ICONS[departmentCode] || Calendar;
  const statusColors = STATUS_COLORS[appointment.status] || STATUS_COLORS.scheduled;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const renderDepartmentDetails = () => {
    const data = appointment.department_specific_data || {};
    
    switch (departmentCode) {
      case 'FT':
        return <PhysioAppointmentDetails data={data} />;
      case 'LAB':
        return <LabAppointmentDetails data={data} />;
      case 'RAD':
        return <ImagingAppointmentDetails data={data} />;
      case 'MG':
      case 'CG':
      case 'CAR':
      case 'PED':
        return <GeneralAppointmentDetails data={data} department={departmentCode} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`card cursor-pointer transition-all duration-200 ${onClick ? 'hover:shadow-md' : ''} ${statusColors.bg} ${statusColors.border}`}
      onClick={onClick}
    >
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-200">
              <Icon className="w-5 h-5 text-gray-700" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {appointment.patient_first_name} {appointment.patient_last_name}
                </h3>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors.bg} ${statusColors.text}`}>
                  {WORKFLOW_STATUS_LABELS[appointment.workflow_status] || appointment.status}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(appointment.start_time)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(appointment.start_time)}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {appointment.room_number || 'Sin asignar'}
                </span>
              </div>
            </div>
          </div>

          {showActions && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {renderDepartmentDetails()}
          </div>
        )}

        {appointment.reason && !isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-sm text-gray-600 line-clamp-1">
              <span className="font-medium">Motivo:</span> {appointment.reason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
