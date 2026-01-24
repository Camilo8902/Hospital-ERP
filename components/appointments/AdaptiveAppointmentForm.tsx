'use client';

import { useEffect, useState } from 'react';
import { DepartmentCode } from '@/lib/types/department-data';
import PhysioAppointmentForm from './department-forms/PhysioAppointmentForm';
import LabAppointmentForm from './department-forms/LabAppointmentForm';
import ImagingAppointmentForm from './department-forms/ImagingAppointmentForm';
import GeneralAppointmentForm from './department-forms/GeneralAppointmentForm';

interface AdaptiveAppointmentFormProps {
  departmentId?: string;
  departmentCode?: DepartmentCode;
  onDataChange: (data: Record<string, unknown>) => void;
  initialData?: Record<string, unknown>;
}

export default function AdaptiveAppointmentForm({
  departmentCode,
  onDataChange,
  initialData = {},
}: AdaptiveAppointmentFormProps) {
  const [departmentData, setDepartmentData] = useState<Record<string, unknown>>(initialData);
  const [selectedCode, setSelectedCode] = useState<DepartmentCode | undefined>(departmentCode);

  useEffect(() => {
    setDepartmentData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (departmentCode) {
      setSelectedCode(departmentCode);
    }
  }, [departmentCode]);

  const handleDataChange = (newData: Record<string, unknown>) => {
    const updated = { ...departmentData, ...newData };
    setDepartmentData(updated);
    onDataChange(updated);
  };

  const renderForm = () => {
    if (!selectedCode) {
      return (
        <div className="p-6 text-center text-gray-500">
          <p>Seleccione un departamento para ver el formulario específico</p>
        </div>
      );
    }

    switch (selectedCode) {
      case 'FT':
        return <PhysioAppointmentForm data={departmentData} onChange={handleDataChange} />;
      case 'LAB':
        return <LabAppointmentForm data={departmentData} onChange={handleDataChange} />;
      case 'RAD':
        return <ImagingAppointmentForm data={departmentData} onChange={handleDataChange} />;
      case 'MG':
      case 'CG':
      case 'CAR':
      case 'PED':
      case 'URG':
      case 'OFT':
      case 'PSI':
      case 'NUT':
        return <GeneralAppointmentForm data={departmentData} department={selectedCode} onChange={handleDataChange} />;
      default:
        return (
          <div className="p-6 text-center text-gray-500">
            <p>Formulario para {selectedCode} no disponible aún</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Datos Específicos del Departamento</h3>
        </div>
        <div className="card-body">
          {renderForm()}
        </div>
      </div>
    </div>
  );
}
