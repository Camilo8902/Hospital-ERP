'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import type { PharmacyProduct } from '@/lib/actions/pharmacy';

interface InventoryFormProps {
  initialData?: PharmacyProduct;
  isEditing?: boolean;
}

const categories = [
  { value: 'medication', label: 'Medicamento' },
  { value: 'equipment', label: 'Equipo' },
  { value: 'supplies', label: 'Insumos' },
  { value: 'consumables', label: 'Consumibles' },
  { value: 'lab_supplies', label: 'Material de Laboratorio' },
  { value: 'office', label: 'Oficina' },
];

const presentationTypes = [
  { value: 'tableta', label: 'Tableta' },
  { value: 'capsula', label: 'Cápsula' },
  { value: 'jarabe', label: 'Jarabe' },
  { value: 'suspension', label: 'Suspensión' },
  { value: 'inyeccion', label: 'Inyección' },
  { value: 'crema', label: 'Crema' },
  { value: 'unguento', label: 'Ungüento' },
  { value: 'gotas', label: 'Gotas' },
  { value: 'aerosol', label: 'Aerosol' },
  { value: 'parche', label: 'Parche' },
  { value: 'supositorio', label: 'Supositorio' },
  { value: 'otro', label: 'Otro' },
];

const storageLocations = [
  { value: 'A-01-01', label: 'A-01-01 (Estante A, Nivel 1, Posición 1)' },
  { value: 'A-01-02', label: 'A-01-02 (Estante A, Nivel 1, Posición 2)' },
  { value: 'A-02-01', label: 'A-02-01 (Estante A, Nivel 2, Posición 1)' },
  { value: 'A-02-02', label: 'A-02-02 (Estante A, Nivel 2, Posición 2)' },
  { value: 'A-03-01', label: 'A-03-01 (Estante A, Nivel 3, Posición 1)' },
  { value: 'A-03-02', label: 'A-03-02 (Estante A, Nivel 3, Posición 2)' },
  { value: 'A-04-01', label: 'A-04-01 (Estante A, Nivel 4,)' },
  { value: 'A-04-02', label: 'A-04-02 (Estante A, Nivel 4, Posición 2)' },
  { value: 'B-01-01', label: 'B-01-01 (Estante B, Nivel 1, Posición 1)' },
  { value: 'B-02-01', label: 'B-02-01 (Estante B, Nivel 2, Posición 1)' },
  { value: 'B-03-01', label: 'B-03-01 (Estante B, Nivel 3, Posición 1)' },
  { value: 'B-04-01', label: 'B-04-01 (Estante B, Nivel 4, Posición 1)' },
  { value: 'REFRIGERADO', label: 'Refrigerado' },
  { value: 'CONTROLADO', label: 'Control Especial' },
];

export default function InventoryForm({ initialData, isEditing = false }: InventoryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointment_id');
  const patientId = searchParams.get('patient_id');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    sku: initialData?.sku || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'medication',
    subcategory: initialData?.subcategory || '',
    unit: initialData?.unit || 'unidad',
    quantity: initialData?.quantity?.toString() || '0',
    min_stock: initialData?.min_stock?.toString() || '10',
    max_stock: initialData?.max_stock?.toString() || '',
    unit_cost: initialData?.unit_cost?.toString() || '0',
    unit_price: initialData?.unit_price?.toString() || '0',
    supplier: initialData?.supplier || '',
    manufacturer: initialData?.manufacturer || '',
    expiration_date: initialData?.expiration_date || '',
    batch_number: initialData?.batch_number || '',
    storage_location: initialData?.storage_location || '',
    requires_prescription: initialData?.requires_prescription ?? false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        max_stock: formData.max_stock ? parseInt(formData.max_stock) : null,
        unit_cost: parseFloat(formData.unit_cost) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
        is_active: true,
      };

      const url = isEditing
        ? `/api/pharmacy/products/${initialData?.id}`
        : '/api/pharmacy/products';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al guardar producto');
      }

      router.push('/dashboard/pharmacy/inventory');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generar SKU automáticamente si no existe
  const generateSKU = () => {
    const prefix = formData.category === 'medication' ? 'MED' : 
                   formData.category === 'supplies' ? 'INS' : 'PROD';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, sku: `${prefix}-${random}` }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/pharmacy/inventory"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isEditing
              ? 'Actualiza la información del producto'
              : 'Agrega un nuevo medicamento o insumo al inventario'}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Información Básica</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="input flex-1"
                  placeholder="MED-001"
                />
                {!isEditing && (
                  <button
                    type="button"
                    onClick={generateSKU}
                    className="btn-secondary"
                  >
                    Generar
                  </button>
                )}
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input"
                placeholder="Paracetamol 500mg"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="input"
                placeholder="Descripción del producto..."
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="input"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategoría
              </label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                className="input"
                placeholder="Ej: Analgésico, Antibiótico..."
              />
            </div>

            {/* Requiere Receta */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="requires_prescription"
                  checked={formData.requires_prescription}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  Este producto requiere receta médica para su dispensación
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Inventario */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Inventario</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cantidad Actual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad Actual <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
                className="input"
                placeholder="0"
              />
            </div>

            {/* Unidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de Medida <span className="text-red-500">*</span>
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="unidad">Unidad</option>
                <option value="tableta">Tableta</option>
                <option value="capsula">Cápsula</option>
                <option value="frasco">Frasco</option>
                <option value="caja">Caja</option>
                <option value="paquete">Paquete</option>
                <option value="ml">Mililitro</option>
                <option value="l">Litro</option>
                <option value="g">Gramo</option>
                <option value="kg">Kilogramo</option>
              </select>
            </div>

            {/* Stock Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Mínimo <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="min_stock"
                value={formData.min_stock}
                onChange={handleChange}
                required
                min="0"
                className="input"
                placeholder="10"
              />
            </div>

            {/* Stock Máximo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Máximo
              </label>
              <input
                type="number"
                name="max_stock"
                value={formData.max_stock}
                onChange={handleChange}
                min="0"
                className="input"
                placeholder="Opcional"
              />
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación de Almacenamiento
              </label>
              <select
                name="storage_location"
                value={formData.storage_location}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar...</option>
                {storageLocations.map(loc => (
                  <option key={loc.value} value={loc.value}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Número de Lote */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Lote
              </label>
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleChange}
                className="input"
                placeholder="LOT-001"
              />
            </div>

            {/* Fecha de Vencimiento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                name="expiration_date"
                value={formData.expiration_date}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Precios y Proveedor */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Precios y Proveedor</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Costo Unitario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Unitario ($)
              </label>
              <input
                type="number"
                name="unit_cost"
                value={formData.unit_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
            </div>

            {/* Precio Unitario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Unitario ($)
              </label>
              <input
                type="number"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input"
                placeholder="0.00"
              />
            </div>

            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                className="input"
                placeholder="Nombre del proveedor"
              />
            </div>

            {/* Fabricante */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fabricante / Laboratorio
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                className="input"
                placeholder="Nombre del fabricante"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/pharmacy/inventory" className="btn-secondary">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Link>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
