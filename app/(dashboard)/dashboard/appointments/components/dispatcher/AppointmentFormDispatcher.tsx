'use client';

import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy loading de los formularios por departamento
// Usamos el workaround de módulo intermedio para exports nombrados
const GeneralAppointmentForm = lazy(() => 
  import('../forms/GeneralAppointmentForm').then(module => ({ default: module.GeneralAppointmentForm }))
);
const PhysiotherapyForm = lazy(() => 
  import('../forms/PhysiotherapyForm').then(module => ({ default: module.PhysiotherapyForm }))
);

// Tipos para las props del Dispatcher
export interface AppointmentFormData {
  id?: string;
  patient_id: string;
  doctor_id?: string | null;
  department_id?: string | null;
  room_id?: string | null;
  appointment_type: string;
  status: string;
  start_time: string;
  end_time: string;
  reason?: string | null;
  notes?: string | null;
  workflow_status?: string;
  department_specific_data?: Record<string, unknown>;
  clinical_reference_type?: string | null;
  clinical_reference_id?: string | null;
  referring_department_id?: string | null;
  // Datos relacionados para mostrar
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    medical_record_number: string;
  };
  doctor?: {
    id: string;
    full_name: string;
    specialty?: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

interface PatientSelect {
  id: string;
  full_name: string;
  medical_record_number: string;
  email?: string;
  phone?: string;
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

export interface AppointmentFormDispatcherProps {
  mode: 'create' | 'edit';
  initialData?: AppointmentFormData;
  patients: PatientSelect[];
  departments: Department[];
  doctors: Doctor[];
  rooms: Room[];
  appointmentId?: string;
}

// Componente de carga mientras se lazy load
function FormLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <span className="ml-2 text-gray-500">Cargando formulario...</span>
    </div>
  );
}

// Función para obtener el código de departamento desde diferentes fuentes
function getDepartmentCode(
  appointmentType: string,
  departmentCode?: string
): string {
  // Mapear appointment_type a código de departamento
  const departmentMap: Record<string, string> = {
    physiotherapy: 'FT',
    consultation: 'MG',
    follow_up: 'MG',
    emergency: 'EM',
    procedure: 'MG',
    imaging: 'IMG',
    laboratory: 'LAB',
    surgery: 'CX',
  };

  if (departmentCode) return departmentCode;
  return departmentMap[appointmentType] || 'MG';
}

export function AppointmentFormDispatcher({
  mode,
  initialData,
  patients,
  departments,
  doctors,
  rooms,
  appointmentId,
}: AppointmentFormDispatcherProps) {
  // Determinar el tipo de formulario según el tipo de cita o departamento
  const appointmentType = initialData?.appointment_type || 'consultation';
  const departmentCode = getDepartmentCode(
    appointmentType,
    initialData?.department?.code
  );

  // Props comunes para todos los formularios
  const commonProps = {
    mode,
    initialData,
    patients,
    departments,
    doctors,
    rooms,
    appointmentId,
  };

  // Renderizar el formulario según el departamento
  const renderForm = () => {
    switch (departmentCode) {
      case 'FT': // Fisioterapia
        return (
          <Suspense fallback={<FormLoader />}>
            <PhysiotherapyForm {...commonProps} />
          </Suspense>
        );
      case 'MG': // Medicina General
      case 'EM': // Emergencia
      case 'CX': // Cirugía
      default: // Default a medicina general
        return (
          <Suspense fallback={<FormLoader />}>
            <GeneralAppointmentForm {...commonProps} />
          </Suspense>
        );
    }
  };

  return (
    <div className="animate-fade-in">
      {renderForm()}
    </div>
  );
}

// Componente para seleccionar tipo de departamento al crear (si no viene pre-seleccionado)
interface DepartmentSelectorProps {
  value: string;
  onChange: (departmentCode: string) => void;
  departments: Department[];
}

export function DepartmentSelector({
  value,
  onChange,
  departments,
}: DepartmentSelectorProps) {
  const departmentOptions = [
    { code: 'MG', name: 'Medicina General', icon: '🩺' },
    { code: 'FT', name: 'Fisioterapia', icon: '💪' },
    { code: 'LAB', name: 'Laboratorio', icon: '🧪' },
    { code: 'IMG', name: 'Imagenología', icon: '📷' },
    { code: 'EM', name: 'Emergencia', icon: '🚨' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {departmentOptions.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => onChange(option.code)}
          className={`p-4 rounded-xl border-2 transition-all text-left ${
            value === option.code
              ? 'border-primary-500 bg-primary-50 shadow-md'
              : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
          }`}
        >
          <span className="text-3xl mb-2 block">{option.icon}</span>
          <span className="font-semibold text-gray-900">{option.name}</span>
        </button>
      ))}
    </div>
  );
}
