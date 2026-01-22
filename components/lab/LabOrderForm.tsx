'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  User,
  Users,
  Loader2
} from 'lucide-react';
import type { LabTestCatalog, Patient } from '@/lib/types';
import { searchPatients } from '@/lib/actions/patients';

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
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAllPatientsModal, setShowAllPatientsModal] = useState(false);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoadingAllPatients, setIsLoadingAllPatients] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTests, setSelectedTests] = useState<LabTestCatalog[]>([]);
  const [priority, setPriority] = useState<'routine' | 'urgent'>('routine');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refs for click outside detection
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Obtener parámetros de la URL (desde la página de consulta)
  const appointmentId = searchParams.get('appointment_id');
  const urlPatientId = searchParams.get('patient_id');
  
  // Usar el patient_id de props o de URL
  const effectivePatientId = initialPatientId || urlPatientId;

  // Ref para evitar que el efecto se ejecute múltiples veces
  const initialized = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close modal when pressing Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowAllPatientsModal(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    // Evitar ejecución múltiple
    if (initialized.current) return;
    initialized.current = true;
    
    // Cargar catálogo de pruebas
    fetch('/api/lab/catalog')
      .then(res => res.json())
      .then(data => {
        setCatalog(data);
        const cats: string[] = Array.from(new Set(data.map((t: LabTestCatalog) => t.category?.name || 'Sin categoría')));
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

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const results = await searchPatients(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching patients:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Load all patients for modal
  const loadAllPatients = useCallback(async () => {
    setIsLoadingAllPatients(true);
    try {
      const response = await fetch('/api/patients');
      if (response.ok) {
        const data = await response.json();
        setAllPatients(data.patients || []);
        setShowAllPatientsModal(true);
      }
    } catch (error) {
      console.error('Error loading all patients:', error);
    } finally {
      setIsLoadingAllPatients(false);
    }
  }, []);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setShowAllPatientsModal(false);
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
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
    setSuccessMessage(null);

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
          appointment_id: appointmentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear orden');
      }

      setSuccessMessage('Orden creada exitosamente');
      
      // Redireccionar según el origen
      setTimeout(() => {
        if (appointmentId) {
          router.push(`/dashboard/consultation/${appointmentId}`);
        } else {
          router.push('/dashboard/lab/orders');
        }
      }, 1500);
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

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
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
          <div className="card-body space-y-4">
            {/* Selected Patient Info */}
            {selectedPatient ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Paciente seleccionado:</p>
                      <p className="text-lg font-bold text-green-900">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                      <p className="text-sm text-green-700">
                        {selectedPatient.phone} • {selectedPatient.medical_record_number || 'Sin MRN'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearPatient}
                    className="p-2 hover:bg-green-100 rounded-full transition-colors"
                    title="Cambiar paciente"
                  >
                    <X className="w-5 h-5 text-green-600" />
                  </button>
                </div>
              </div>
            ) : (
              /* Search Input - Only visible when no patient selected */
              <div ref={searchContainerRef} className="relative">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, teléfono o número de expediente..."
                      className="input pl-10 w-full"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => {
                        if (searchQuery.length >= 2) {
                          setShowDropdown(true);
                        }
                      }}
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500 animate-spin" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={loadAllPatients}
                    disabled={isLoadingAllPatients}
                    className="btn-secondary flex items-center justify-center gap-2 min-w-[44px] sm:min-w-auto px-4 py-2.5"
                  >
                    {isLoadingAllPatients ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Ver todos</span>
                  </button>
                </div>

                {/* Search Results Dropdown */}
                {showDropdown && searchQuery.length >= 2 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map(patient => (
                        <button
                          key={patient.id}
                          type="button"
                          onClick={() => handleSelectPatient(patient)}
                          className="w-full px-4 py-3 text-left border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {patient.phone} • {patient.medical_record_number || 'Sin MRN'}
                              </p>
                            </div>
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        </button>
                      ))
                    ) : isSearching ? (
                      <div className="px-4 py-3 text-center text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Buscando pacientes...</p>
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-center text-gray-500">
                        <p className="text-sm">No se encontraron pacientes</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Help text */}
                {searchQuery.length < 2 && !selectedPatient && (
                  <p className="text-sm text-gray-500 mt-2">
                    Escribe al menos 2 caracteres para buscar, o presiona "Ver todos" para listar todos los pacientes
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* All Patients Modal */}
        {showAllPatientsModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 sm:bg-black/60"
              onClick={() => setShowAllPatientsModal(false)}
            />
            
            {/* Modal Content */}
            <div 
              ref={modalRef}
              className="relative w-full max-w-2xl bg-white sm:rounded-xl shadow-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 flex-shrink-0">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  Seleccionar Paciente
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAllPatientsModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Search */}
              <div className="p-4 border-b bg-white sticky top-0 z-10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filtrar pacientes..."
                    className="input pl-10 w-full"
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      const filtered = patients.filter(p => 
                        `${p.first_name} ${p.last_name}`.toLowerCase().includes(query) ||
                        p.phone.includes(query) ||
                        (p.medical_record_number && p.medical_record_number.toLowerCase().includes(query))
                      );
                      setAllPatients(filtered);
                    }}
                    autoFocus
                  />
                </div>
              </div>

              {/* Modal Body - Patient List */}
              <div className="flex-1 overflow-auto p-2">
                {allPatients.length > 0 ? (
                  <div className="space-y-1">
                    {allPatients.map(patient => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handleSelectPatient(patient)}
                        className="w-full px-4 py-3 text-left rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {patient.phone} • {patient.medical_record_number || 'Sin MRN'}
                          </p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay pacientes disponibles</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-3 border-t bg-gray-50 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAllPatientsModal(false)}
                  className="btn-secondary w-full justify-center"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

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
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
          {appointmentId ? (
            <Link href={`/dashboard/consultation/${appointmentId}`} className="btn-secondary w-full sm:w-auto justify-center">
              Cancelar
            </Link>
          ) : (
            <Link href="/dashboard/lab" className="btn-secondary w-full sm:w-auto justify-center">
              Cancelar
            </Link>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !selectedPatient || selectedTests.length === 0}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
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
                <span className="sm:hidden">Crear Orden</span>
                <span className="hidden sm:inline">Crear Orden (${calculateTotal().toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
