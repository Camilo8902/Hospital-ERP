'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { createInvoice } from '@/lib/actions/payments';
import { ArrowLeft, Plus, Trash2, Save, FileText, Calendar, User, DollarSign, Calculator, AlertCircle, CheckCircle } from 'lucide-react';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  insurance_provider?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Set default due date to 30 days from now
  useEffect(() => {
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() + 30);
    setDueDate(dueDate.toISOString().split('T')[0]);
  }, []);

  // Fetch patients for search
  useEffect(() => {
    const fetchPatients = async () => {
      if (patientSearch.length < 2) {
        setPatients([]);
        return;
      }

      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name, phone, insurance_provider')
        .ilike('first_name', `%${patientSearch}%`)
        .or(`last_name.ilike.%${patientSearch}%,phone.ilike.%${patientSearch}%`)
        .limit(10);

      if (data) {
        setPatients(data);
        setShowPatientDropdown(true);
      }
    };

    const timer = setTimeout(fetchPatients, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, supabase]);

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

            <div className="relative">
              <label className="label mb-2">Buscar Paciente</label>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setSelectedPatient(null);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Nombre, apellido o teléfono..."
                className="input"
              />

              {showPatientDropdown && patients.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {patients.map((patient) => (
                    <button
                      key={patient.id}
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
                  ))}
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

        {/* Invoice Items */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                Items de la Factura
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="btn-secondary btn-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Agregar Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descripción del servicio"
                      className="input"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Cant."
                      className="input text-center"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      placeholder="Precio"
                      className="input text-right"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="w-28 py-2 text-right font-medium text-gray-900">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>IVA (%)</span>
                    <input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="input w-20 text-right"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Impuestos</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Descuento</span>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="input w-28 text-right"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label mb-2">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales..."
                  className="input resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="card bg-gray-50">
          <div className="card-body">
            <div className="flex items-center justify-between">
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
          className="btn-primary w-full py-4 text-lg font-semibold md:hidden flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Guardar Factura - {formatCurrency(totalAmount)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
