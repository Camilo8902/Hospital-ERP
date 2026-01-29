'use client';

import { useState } from 'react';
import { Search, User, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getPatientByDni } from '@/lib/actions/patients';
import type { Patient } from '@/lib/types';

interface PatientSearchByDniProps {
  onPatientFound?: (patient: Patient) => void;
  showRegisterButton?: boolean;
}

export default function PatientSearchByDni({ 
  onPatientFound,
  showRegisterButton = true 
}: PatientSearchByDniProps) {
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim()) return;

    setLoading(true);
    setError(null);
    setPatient(null);
    setNotFound(false);

    try {
      const foundPatient = await getPatientByDni(dni);
      
      if (foundPatient) {
        setPatient(foundPatient);
        if (onPatientFound) {
          onPatientFound(foundPatient);
        }
      } else {
        setNotFound(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar paciente');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setDni('');
    setPatient(null);
    setNotFound(false);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Formulario de búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            placeholder="Buscar por DNI / Cédula..."
            className="input pl-10"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !dni.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Buscando...
            </>
          ) : (
            'Buscar'
          )}
        </button>
        {patient && (
          <button
            type="button"
            onClick={clearSearch}
            className="btn-secondary"
          >
            Limpiar
          </button>
        )}
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Paciente no encontrado */}
      {notFound && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-700">
                No se encontró ningún paciente con DNI: {dni}
              </p>
            </div>
            {showRegisterButton && (
              <Link href="/dashboard/patients/new" className="btn-primary btn-sm">
                Registrar Nuevo Paciente
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Paciente encontrado */}
      {patient && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {patient.first_name} {patient.last_name}
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                <p><span className="font-medium">DNI:</span> {patient.dni}</p>
                <p><span className="font-medium">MRN:</span> {patient.medical_record_number}</p>
                <p><span className="font-medium">Teléfono:</span> {patient.phone}</p>
                <p><span className="font-medium">Fecha Nac.:</span> {patient.dob}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Link 
                  href={`/dashboard/patients/${patient.id}`}
                  className="btn-primary btn-sm"
                >
                  Ver Historia Clínica
                </Link>
                <Link 
                  href={`/dashboard/patients/${patient.id}/edit`}
                  className="btn-secondary btn-sm"
                >
                  Editar Datos
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
