'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, X, Search, Plus, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { PharmacyProduct } from '@/lib/actions/pharmacy';

interface PrescriptionFormProps {
  appointmentId?: string;
  patientId?: string;
  patientName?: string;
}

interface PrescriptionItem {
  id: string;
  productId: string;
  productName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

export default function PrescriptionForm({ 
  appointmentId, 
  patientId, 
  patientName 
}: PrescriptionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<PharmacyProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PharmacyProduct | null>(null);
  
  const [formData, setFormData] = useState({
    patientId: patientId || searchParams.get('patient_id') || '',
    appointmentId: appointmentId || searchParams.get('appointment_id') || '',
    notes: '',
  });

  const [items, setItems] = useState<PrescriptionItem[]>([{
    id: '1',
    productId: '',
    productName: '',
    dosage: '',
    frequency: 'Cada 8 horas',
    duration: '7 días',
    quantity: 0,
    instructions: '',
  }]);

  // Cargar productos al montar el componente
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/pharmacy/products/search');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Error al cargar productos:', err);
      }
    };
    loadProducts();
  }, []);

  // Filtrar productos para búsqueda
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 10);

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Si se selecciona un producto, actualizar quantity sugerida
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].quantity = 1;
      }
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      dosage: '',
      frequency: 'Cada 8 horas',
      duration: '7 días',
      quantity: 0,
      instructions: '',
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const selectProduct = (product: PharmacyProduct, itemIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].productId = product.id;
    newItems[itemIndex].productName = product.name;
    newItems[itemIndex].quantity = 1;
    setProducts(filteredProducts);
    setShowProductDropdown(false);
    setProductSearch('');
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validar que hay al menos un item con producto seleccionado
      const validItems = items.filter(item => item.productId && item.productName);
      
      if (validItems.length === 0) {
        throw new Error('Debes agregar al menos un medicamento a la receta');
      }

      // Validar quantities disponibles
      for (const item of validItems) {
        const product = products.find(p => p.id === item.productId);
        if (product && item.quantity > product.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.quantity}`);
        }
      }

      const response = await fetch('/api/pharmacy/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: formData.appointmentId,
          patient_id: formData.patientId,
          items: validItems.map(item => ({
            medication_id: item.productId,
            medication_name: item.productName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity_prescribed: item.quantity,
            instructions: item.instructions,
          })),
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear receta');
      }

      // Redireccionar según el origen
      if (formData.appointmentId) {
        router.push(`/dashboard/consultation/${formData.appointmentId}`);
      } else {
        router.push('/dashboard/pharmacy/prescriptions');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear receta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Receta Médica</h1>
          <p className="text-gray-500 mt-1">
            {patientName ? `Receta para ${patientName}` : 'Crear nueva receta médica'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Info (read-only) */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Información del Paciente</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID del Paciente
                </label>
                <input
                  type="text"
                  value={formData.patientId}
                  readOnly
                  className="input bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cita Asociada
                </label>
                <input
                  type="text"
                  value={formData.appointmentId || 'Sin citar'}
                  readOnly
                  className="input bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Prescription Items */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Medicamentos Recetados</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary btn-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Agregar Medicamento
            </button>
          </div>
          
          <div className="card-body space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="p-4 border border-gray-200 rounded-lg relative group">
                {/* Remove button - always visible, placed outside the product search area */}
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded z-10"
                    title="Eliminar medicamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                  {/* Product Search */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medicamento <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={item.productName || productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setShowProductDropdown(true);
                            handleItemChange(index, 'productName', e.target.value);
                          }}
                          onFocus={() => setShowProductDropdown(true)}
                          placeholder="Buscar medicamento..."
                          className="input pl-10"
                        />
                      </div>
                      
                      {/* Product Dropdown */}
                      {showProductDropdown && productSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map(product => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => selectProduct(product, index)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{product.name}</p>
                                    <p className="text-xs text-gray-500">{product.sku}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`text-sm font-medium ${
                                      product.quantity <= product.min_stock 
                                        ? 'text-yellow-600' 
                                        : product.quantity === 0 
                                          ? 'text-red-600'
                                          : 'text-green-600'
                                    }`}>
                                      Stock: {product.quantity}
                                    </p>
                                    <p className="text-xs text-gray-500">{product.unit}</p>
                                  </div>
                                </div>
                              </button>
                            ))
                          ) : (
                            <p className="px-4 py-3 text-sm text-gray-500">
                              No se encontraron medicamentos
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {item.productId && (
                      <p className="text-xs text-gray-500 mt-1">
                        SKU: {products.find(p => p.id === item.productId)?.sku}
                      </p>
                    )}
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosis <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                      className="input"
                      placeholder="Ej: 500mg, 1 tableta"
                      required
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      min="1"
                      className="input"
                      required
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frecuencia <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={item.frequency}
                      onChange={(e) => handleItemChange(index, 'frequency', e.target.value)}
                      className="input"
                      required
                    >
                      <option value="Cada 4 horas">Cada 4 horas</option>
                      <option value="Cada 6 horas">Cada 6 horas</option>
                      <option value="Cada 8 horas">Cada 8 horas</option>
                      <option value="Cada 12 horas">Cada 12 horas</option>
                      <option value="Una vez al día">Una vez al día</option>
                      <option value="Cada 24 horas">Cada 24 horas</option>
                      <option value="Cada 48 horas">Cada 48 horas</option>
                      <option value="Según necesidad">Según necesidad</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => handleItemChange(index, 'duration', e.target.value)}
                      className="input"
                      placeholder="Ej: 7 días, 2 semanas"
                      required
                    />
                  </div>

                  {/* Instructions */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instrucciones Especiales
                    </label>
                    <textarea
                      value={item.instructions}
                      onChange={(e) => handleItemChange(index, 'instructions', e.target.value)}
                      rows={2}
                      className="input"
                      placeholder="Ej: Tomar con alimentos, evitar alcohol, etc."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Notas Adicionales</h2>
          </div>
          <div className="card-body">
            <textarea
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="input"
              placeholder="Notas generales para la receta..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Emitir Receta'}
          </button>
        </div>
      </form>
    </div>
  );
}
