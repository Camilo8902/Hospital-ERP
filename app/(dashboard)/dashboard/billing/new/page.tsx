'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { createInvoice, getUnbilledItems, UnbilledItem } from '@/lib/actions/payments';
import { searchPatients, getPatients } from '@/lib/actions/patients';
import { ArrowLeft, Plus, Trash2, Save, FileText, Calendar, User, DollarSign, Calculator, AlertCircle, CheckCircle, Search, FlaskConical, ShoppingCart, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Patient } from '@/lib/types';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  source_type?: string;
  source_id?: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);
  
  const [unbilledItems, setUnbilledItems] = useState<UnbilledItem[]>([]);
  const [isLoadingUnbilled, setIsLoadingUnbilled] = useState(false);
  const [showUnbilledItems, setShowUnbilledItems] = useState(false);
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const patients = await getPatients();
        setAllPatients(patients);
      } catch (err) {
        console.error('Error loading patients:', err);
        setError('Error al cargar pacientes');
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();

    // Set default due date to 30 days from now
    const today = new Date();
    const dueDateDefault = new Date(today);
    dueDateDefault.setDate(dueDateDefault.getDate() + 30);
    setDueDate(dueDateDefault.toISOString().split('T')[0]);
  }, []);

  // Fetch patients for search using server action
  useEffect(() => {
    const fetchPatients = async () => {
      if (patientSearch.length < 2) {
        setSearchResults([]);
        setShowPatientDropdown(false);
        return;
      }

      setIsSearchingPatients(true);
      try {
        const results = await searchPatients(patientSearch);
        setSearchResults(results);
        setShowPatientDropdown(true);
      } catch (err) {
        console.error('Error searching patients:', err);
        setSearchResults([]);
      } finally {
        setIsSearchingPatients(false);
      }
    };

    const timer = setTimeout(fetchPatients, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Load unbilled items when patient is selected
  useEffect(() => {
    const loadUnbilledItems = async () => {
      if (!selectedPatient) {
        setUnbilledItems([]);
        return;
      }

      setIsLoadingUnbilled(true);
      try {
        const result = await getUnbilledItems(selectedPatient.id);
        if (result.success && result.items) {
          setUnbilledItems(result.items);
        }
      } catch (err) {
        console.error('Error loading unbilled items:', err);
      } finally {
        setIsLoadingUnbilled(false);
      }
    };

    loadUnbilledItems();
  }, [selectedPatient]);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const totalAmount = subtotal + taxAmount - discountAmount;

  // Add new item
  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item
  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Select patient
  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.first_name} ${patient.last_name}`);
    setShowPatientDropdown(false);
  };

  // Add item from unbilled sources
  const addUnbilledItem = (item: UnbilledItem) => {
    setItems([...items, {
      description: item.description,
      quantity: 1,
      unit_price: item.amount,
      source_type: item.type,
      source_id: item.id
    }]);
    // Remove from unbilled items
    setUnbilledItems(unbilledItems.filter(i => i.id !== item.id));
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setError('Por favor selecciona un paciente');
      return;
    }

    // Validate items
    const validItems = items.filter(item => item.description && item.quantity > 0 && item.unit_price > 0);
    if (validItems.length === 0) {
      setError('Por favor agrega al menos un item con descripción y precio válido');
      return;
    }

    if (totalAmount <= 0) {
      setError('El total de la factura debe ser mayor a 0');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await createInvoice({
        patientId: selectedPatient.id,
        items: validItems,
        taxRate: taxRate > 0 ? taxRate : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        dueDate,
        notes: notes || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Error al crear la factura');
      }

      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/billing/${result.invoice?.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la factura');
    } finally {
      setIsSaving(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Factura Creada!</h2>
          <p className="text-gray-500 mb-4">La factura se ha creado correctamente.</p>
          <p className="text-sm text-gray-400">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nueva Factura</h1>
                <p className="text-sm text-gray-500">Crear nueva factura para paciente</p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="btn-primary btn-md flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Factura
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Patient Selection */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Datos del Paciente
            </h2>

            <div ref={searchContainerRef} className="relative">
              <label className="label mb-2">Buscar Paciente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setSelectedPatient(null);
                    setShowPatientDropdown(true);
                  }}
                  onFocus={() => {
                    if (patientSearch.length >= 2) {
                      setShowPatientDropdown(true);
                    }
                  }}
                  placeholder="Nombre, apellido o teléfono..."
                  className="input pl-10 w-full"
                />
                {isSearchingPatients && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-500 animate-spin" />
                )}
              </div>

              {showPatientDropdown && patientSearch.length >= 2 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <p className="font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {patient.phone}
                          {patient.insurance_provider && ` • ${patient.insurance_provider}`}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-500">
                      <p className="text-sm">No se encontraron pacientes</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedPatient && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Paciente seleccionado</span>
                </div>
                <p className="text-gray-900 mt-1">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
                <p className="text-sm text-gray-600">{selectedPatient.phone}</p>
              </div>
            )}
          </div>
        </div>

        {/* Unbilled Items Section - INTEGRACIÓN CON OTROS MÓDULOS */}
        {selectedPatient && unbilledItems.length > 0 && (
          <div className="card border-blue-200 bg-blue-50">
            <div className="card-body">
              <button
                type="button"
                onClick={() => setShowUnbilledItems(!showUnbilledItems)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Items Pendientes de Facturar
                  </h2>
                  <span className="badge badge-primary">{unbilledItems.length}</span>
                </div>
                {showUnbilledItems ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {showUnbilledItems && (
                <>
                  <p className="text-sm text-gray-600 mt-2 mb-4">
                    Los siguientes servicios están pendientes de facturar para este paciente:
                  </p>

                  {isLoadingUnbilled ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="ml-2 text-gray-500">Cargando items...</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {unbilledItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                        >
                          <div className="flex items-center gap-3">
                            {item.type === 'lab_order' && (
                              <FlaskConical className="w-5 h-5 text-purple-500" />
                            )}
                            {item.type === 'inventory' && (
                              <ShoppingCart className="w-5 h-5 text-green-500" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{item.description}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(item.date).toLocaleDateString()}
                                {item.details && ` • ${item.details}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">
                              {formatCurrency(item.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => addUnbilledItem(item)}
                              className="btn-primary btn-sm flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Agregar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Invoice Items */}
        <div className="card">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Items de la Factura
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="btn-secondary btn-sm flex items-center gap-1 self-start"
              >
                <Plus className="w-4 h-4" />
                Agregar Item
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Descripción</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-500 w-20">Cant.</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500 w-28">Precio</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500 w-28">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Descripción del servicio"
                          className="input w-full"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="input text-center"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="input text-right"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="sm:hidden space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Descripción</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descripción del servicio"
                      className="input w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Cantidad</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="input w-full text-center"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Precio Unitario</label>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="input w-full text-right"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-500">Subtotal</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="w-full btn-secondary btn-sm text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar Item
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addItem}
                className="w-full btn-secondary btn-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Item
              </button>
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {/* IVA */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-gray-600">
                    <span className="text-sm">IVA (%)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="input w-20 text-center text-sm"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>
                  
                  {taxRate > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Impuestos</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  
                  {/* Descuento */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-gray-600">
                    <span className="text-sm">Descuento</span>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="input w-28 text-right text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Due Date and Notes */}
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="label mb-2">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  className="input resize-none w-full"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="card bg-gray-50">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Calculator className="w-5 h-5" />
                <span className="font-medium">Resumen de Factura</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total a cobrar</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button (Mobile) */}
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="btn-primary w-full py-4 text-lg font-semibold md:hidden flex items-center justify-center gap-2 sticky bottom-4 shadow-lg"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar - {formatCurrency(totalAmount)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
