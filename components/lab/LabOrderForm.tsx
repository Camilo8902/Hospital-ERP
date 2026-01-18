'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Search,
  Plus,
  X,
  FlaskConical,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react';
import type { LabTestCatalog, Patient } from '@/lib/types';

interface LabOrderFormProps {
  patients: Patient[];
  initialPatientId?: string | null;
}

export default function LabOrderForm({ patients, initialPatientId }: LabOrderFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [catalog, setCatalog] = useState<LabTestCatalog[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTests, setSelectedTests] = useState<LabTestCatalog[]>([]);
  const [priority, setPriority] = useState<'routine' | 'urgent'>('routine');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener parámetros de la URL (desde la página de consulta)
  const appointmentId = searchParams.get('appointment_id');
  const urlPatientId = searchParams.get('patient_id');
  
  // Usar el patient_id de props o de URL
  const effectivePatientId = initialPatientId || urlPatientId;
  
  // Ref para evitar que el efecto se ejecute múltiples veces
  const initialized = useRef(false);

  useEffect(() => {
    // Evitar ejecución múltiple
    if (initialized.current) return;
    initialized.current = true;
    
    // Cargar catálogo de pruebas
    fetch('/api/lab/catalog')
      .then(res => res.json())
      .then(data => {
        setCatalog(data);
        const cats = Array.from(new Set(data.map((t: LabTestCatalog) => t.category?.name || 'Sin categoría')));
        setCategories(cats.sort());
      })
      .catch(err => console.error('Error cargando catálogo:', err));

    // Si viene patient_id, seleccionar automáticamente
    if (effectivePatientId && patients.length > 0) {
      const patient = patients.find(p => p.id === effectivePatientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, []); // Empty dependency array = solo ejecutar una vez

  // Effect separado para seleccionar paciente cuando llegan los datos
  useEffect(() => {
    if (effectivePatientId && patients.length > 0 && !selectedPatient) {
      const patient = patients.find(p => p.id === effectivePatientId);
      if (patient) {
        setSelectedPatient(patient);
      } else {
        // Fallback: buscar directamente el paciente si no está en la lista
        fetchPatientDirectly(effectivePatientId);
      }
    }
  }, [effectivePatientId, patients, selectedPatient]);

  // Función para buscar paciente directamente si no está en la lista
  const fetchPatientDirectly = async (patientId: string) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.patient) {
          setSelectedPatient(data.patient);
        }
      }
    } catch (err) {
      console.error('Error fetching patient:', err);
    }
  };

  const filteredTests = catalog.filter(test => {
    const matchesSearch = 
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || test.category?.name === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const addTest = (test: LabTestCatalog) => {
    if (!selectedTests.find(t => t.id === test.id)) {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const removeTest = (testId: string) => {
    setSelectedTests(selectedTests.filter(t => t.id !== testId));
  };

  const calculateTotal = () => {
    return selectedTests.reduce((sum, test) => sum + (test.price || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedPatient) {
      setError('Por favor selecciona un paciente');
      return;
    }

    if (selectedTests.length === 0) {
      setError('Por favor selecciona al menos una prueba');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/lab/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          priority,
          notes,
          test_ids: selectedTests.map(t => t.id),
          appointment_id: appointmentId, // Enlazar con la consulta
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear orden');
      }

      // Redireccionar según el origen
      if (appointmentId) {
        router.push(`/dashboard/consultation/${appointmentId}`);
      } else {
        router.push('/dashboard/lab/orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear orden');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {appointmentId ? (
          <Link href={`/dashboard/consultation/${appointmentId}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
        ) : (
          <Link href="/dashboard/lab" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Orden de Laboratorio</h1>
          <p className="text-gray-500">
            {appointmentId 
              ? 'Orden emitida desde consulta médica' 
              : 'Crear nueva orden de pruebas de laboratorio'}
          </p>
        </div>
      </div>

      {/* Context Info - When coming from consultation */}
      {appointmentId && selectedPatient && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Orden para:</p>
            <p className="font-bold text-blue-900">{selectedPatient.first_name} {selectedPatient.last_name}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">1. Seleccionar Paciente</h2>
          </div>
          <div className="card-body">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                className="input pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Simple filter - in real app would use autocomplete
                }}
              />
            </div>

            {/* Patient List */}
            <div className="mt-4 max-h-60 overflow-auto border border-gray-200 rounded-lg">
              {patients
                .filter(p => 
                  !searchQuery || 
                  `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.phone.includes(searchQuery)
                )
                .slice(0, 10)
                .map(patient => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full px-4 py-3 text-left border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                      selectedPatient?.id === patient.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{patient.phone}</p>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </button>
                ))}
            </div>

            {selectedPatient && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Paciente seleccionado:</p>
                <p className="text-lg font-bold text-green-800">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
                <p className="text-sm text-green-700">{selectedPatient.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Test Selection */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">2. Seleccionar Pruebas</h2>
          </div>
          <div className="card-body">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Tests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-auto">
              {filteredTests.map(test => {
                const isSelected = selectedTests.find(t => t.id === test.id);
                return (
                  <div
                    key={test.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                    onClick={() => isSelected ? removeTest(test.id) : addTest(test)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FlaskConical className="w-4 h-4 text-gray-400" />
                          <p className="font-medium text-sm">{test.code}</p>
                        </div>
                        <p className="font-medium text-gray-900 mt-1">{test.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{test.category?.name || 'Sin categoría'}</p>
                        <p className="text-sm font-bold text-primary-600 mt-2">
                          ${test.price?.toFixed(2)}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Tests Summary */}
            {selectedTests.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">Pruebas seleccionadas ({selectedTests.length})</p>
                  <p className="font-bold text-lg text-primary-600">
                    ${calculateTotal().toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTests.map(test => (
                    <span
                      key={test.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-sm border border-gray-200"
                    >
                      {test.code}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTest(test.id);
                        }}
                        className="p-0.5 hover:bg-gray-100 rounded-full"
                      >
                        <X className="w-3 h-3 text-gray-500" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Options */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">3. Opciones Adicionales</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label mb-1.5">Prioridad</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="routine"
                    checked={priority === 'routine'}
                    onChange={() => setPriority('routine')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span>Rutina</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="urgent"
                    checked={priority === 'urgent'}
                    onChange={() => setPriority('urgent')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-red-600 font-medium">Urgente</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="label mb-1.5">Notas / Instrucciones</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="input"
                placeholder="Notas especiales para el laboratorio..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          {appointmentId ? (
            <Link href={`/dashboard/consultation/${appointmentId}`} className="btn-secondary">
              Cancelar
            </Link>
          ) : (
            <Link href="/dashboard/lab" className="btn-secondary">
              Cancelar
            </Link>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !selectedPatient || selectedTests.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Crear Orden (${calculateTotal().toFixed(2)})
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
