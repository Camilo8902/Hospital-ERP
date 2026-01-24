'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, User, X } from 'lucide-react';

// Formato flexible que acepta tanto first_name/last_name como full_name
interface PatientSelect {
  id: string;
  first_name?: string;
  last_name?: string;
  full_name?: string; // Alternativa cuando viene concatenado
  medical_record_number: string;
  email?: string;
  phone?: string;
}

interface PatientSelectorProps {
  patients: PatientSelect[];
  value: string;
  onChange: (id: string, patient?: PatientSelect) => void;
  required?: boolean;
  disabled?: boolean;
}

// Utilidad para obtener el nombre completo
function getPatientName(patient: PatientSelect): string {
  if (patient.full_name) return patient.full_name;
  return `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
}

export function PatientSelector({
  patients,
  value,
  onChange,
  required = false,
  disabled = false,
}: PatientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSelect | undefined>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Encontrar el paciente seleccionado cuando cambia el valor
  useEffect(() => {
    if (value && patients.length > 0) {
      const patient = patients.find((p) => p.id === value);
      if (patient) {
        setSelectedPatient(patient);
        setSearchTerm(getPatientName(patient));
      }
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

  const getFilteredPatients = useCallback(() => {
    if (!searchTerm.trim()) return patients;
    const searchLower = searchTerm.toLowerCase();
    return patients.filter(
      (patient) =>
        getPatientName(patient).toLowerCase().includes(searchLower) ||
        patient.medical_record_number.toLowerCase().includes(searchLower) ||
        (patient.phone || '').includes(searchLower)
    );
  }, [patients, searchTerm]);

  const handleSelect = (patient: PatientSelect) => {
    onChange(patient.id, patient);
    setSearchTerm(getPatientName(patient));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearchTerm('');
    setSelectedPatient(undefined);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (!e.target.value) {
      handleClear();
    }
  };

  const filteredPatients = getFilteredPatients();

  return (
    <div ref={wrapperRef} className="relative">
      <label className="label mb-1.5">
        Buscar Paciente {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          placeholder="Buscar por nombre, expediente o teléfono..."
          className="input pl-10 pr-10"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Dropdown de resultados */}
      {isOpen && searchTerm && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => handleSelect(patient)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
              >
                <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">
                    {getPatientName(patient)}
                  </div>
                  <div className="text-sm text-gray-500">MRN: {patient.medical_record_number}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">No se encontraron pacientes</div>
          )}
        </div>
      )}

      {/* Paciente seleccionado */}
      {selectedPatient && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <User className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            {getPatientName(selectedPatient)}
          </span>
          <span className="text-sm text-green-600">(MRN: {selectedPatient.medical_record_number})</span>
        </div>
      )}
    </div>
  );
}
