'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  FlaskConical,
  X,
  Save,
  Loader2
} from 'lucide-react';
import type { LabTestCatalog, LabTestParameter } from '@/lib/types';

interface LabCatalogPageProps {
  initialCatalog: LabTestCatalog[];
}

interface TestFormData {
  code: string;
  name: string;
  description: string;
  category: string;
  sample_type: string;
  price: string;
  duration_hours: string;
  instructions: string;
  preparation_required: string;
  is_active: boolean;
}

const SAMPLE_TYPES = [
  { value: 'blood', label: 'Sangre' },
  { value: 'urine', label: 'Orina' },
  { value: 'stool', label: 'Heces' },
  { value: 'sputum', label: 'Esputo' },
  { value: 'tissue', label: 'Tejido' },
  { value: 'fluid', label: 'Fluido' },
  { value: 'other', label: 'Otro' },
];

const CATEGORIES = [
  'Hematología',
  'Química Clínica',
  'Urología',
  'Inmunología',
  'Microbiología',
  'Serología',
  'Endocrinología',
  'Coagulación',
  'Gasometría',
  'Electrolitos',
  'Marcadores Cardíacos',
  'Marcadores Tumorales',
  'Parasitología',
  'Toxicología',
  'Vitaminas',
];

export default function LabCatalogPage({ initialCatalog }: LabCatalogPageProps) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTestCatalog | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TestFormData>({
    code: '',
    name: '',
    description: '',
    category: '',
    sample_type: 'blood',
    price: '',
    duration_hours: '24',
    instructions: '',
    preparation_required: '',
    is_active: true,
  });

  useEffect(() => {
    // Load categories from API
    fetch('/api/lab/catalog?categories=true')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Error cargando categorías:', err));
  }, []);

  const filteredCatalog = catalog.filter(test => {
    const matchesSearch = 
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || test.category?.name === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta prueba?')) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/lab/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCatalog(catalog.filter(t => t.id !== id));
        setSuccess('Prueba eliminada correctamente');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al eliminar la prueba');
      }
    } catch (err) {
      setError('Error de conexión al eliminar');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (test?: LabTestCatalog | null) => {
    if (test) {
      setEditingTest(test);
      setEditingCategoryId(test.category_id || null);
      setFormData({
        code: test.code || '',
        name: test.name || '',
        description: test.description || '',
        category: test.category?.name || '',
        sample_type: test.sample_type || 'blood',
        price: test.price?.toString() || '',
        duration_hours: test.duration_hours?.toString() || '24',
        instructions: test.instructions || '',
        preparation_required: test.preparation_required || '',
        is_active: test.is_active ?? true,
      });
    } else {
      setEditingTest(null);
      setEditingCategoryId(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        category: '',
        sample_type: 'blood',
        price: '',
        duration_hours: '24',
        instructions: '',
        preparation_required: '',
        is_active: true,
      });
    }
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.code || !formData.name || !formData.category || !formData.sample_type || !formData.price) {
        setError('Por favor completa todos los campos requeridos');
        setSubmitting(false);
        return;
      }

      let categoryId = editingCategoryId;

      if (!editingTest && !categoryId) {
        const categoryObj = categories.find(c => c.name === formData.category);
        
        if (!categoryObj) {
          setError('Por favor selecciona una categoría válida. Categorías cargadas: ' + categories.length);
          setSubmitting(false);
          return;
        }
        categoryId = categoryObj.id;
      }

      // Verify categoryId is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!categoryId || !uuidRegex.test(categoryId)) {
        setError('Error: El ID de categoría no es válido. Por favor selecciona una categoría de la lista.');
        setSubmitting(false);
        return;
      }

      const testData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        category_id: categoryId,
        sample_type: formData.sample_type,
        price: parseFloat(formData.price),
        duration_hours: parseInt(formData.duration_hours) || 24,
        instructions: formData.instructions?.trim() || null,
        preparation_required: formData.preparation_required?.trim() || null,
        is_active: formData.is_active,
      };

      console.log('Submitting test data:', JSON.stringify(testData, null, 2));

      const action = editingTest ? 'update' : 'create';
      const requestData = editingTest 
        ? { action, id: editingTest.id, ...testData }
        : { action, ...testData };
        
      const response = await fetch('/api/lab/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowModal(false);
        setSuccess(editingTest ? 'Prueba actualizada correctamente' : 'Prueba creada correctamente');
        setTimeout(() => setSuccess(null), 3000);
        
        // Refresh catalog
        const catalogResponse = await fetch('/api/lab/catalog');
        const updatedCatalog = await catalogResponse.json();
        setCatalog(updatedCatalog);
      } else {
        setError(data.error || 'Error al guardar la prueba');
      }
    } catch (err) {
      setError('Error de conexión al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const generateCode = () => {
    const prefix = formData.category ? formData.category.substring(0, 4).toUpperCase() : 'TEST';
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData({ ...formData, code: `${prefix}-${random}` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/lab" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catálogo de Pruebas</h1>
            <p className="text-gray-500 mt-1">Administrar pruebas de laboratorio disponibles</p>
          </div>
        </div>
        <button
          onClick={() => openModal(null)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Prueba
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total Pruebas</p>
          <p className="text-2xl font-bold text-gray-900">{catalog.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Categorías</p>
          <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Pruebas Activas</p>
          <p className="text-2xl font-bold text-green-600">
            {catalog.filter(t => t.is_active).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="input pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
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
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === cat.name
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCatalog.map(test => (
          <div key={test.id} className="card hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{test.code}</p>
                    <p className="font-semibold text-gray-900">{test.name}</p>
                  </div>
                </div>
                <span className={`badge ${test.is_active ? 'badge-success' : 'badge-gray'}`}>
                  {test.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                {test.description || 'Sin descripción'}
              </p>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Categoría</p>
                  <p className="text-sm font-medium">{test.category?.name || 'Sin categoría'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Precio</p>
                  <p className="text-sm font-bold text-primary-600">${test.price?.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => openModal(test)}
                  className="flex-1 btn-secondary btn-sm flex items-center justify-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(test.id)}
                  disabled={loading}
                  className="btn-danger btn-sm px-2"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCatalog.length === 0 && (
        <div className="card p-12 text-center text-gray-500">
          <FlaskConical className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No se encontraron pruebas</p>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {editingTest ? 'Editar Prueba' : 'Nueva Prueba'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Código */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input flex-1"
                    placeholder="Ej: HEMO-001"
                    required
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="btn-secondary"
                  >
                    Generar
                  </button>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Prueba *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="Ej: Hemograma Completo"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Descripción de la prueba..."
                />
              </div>

              {/* Categoría y Tipo de Muestra */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input w-full"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Muestra *
                  </label>
                  <select
                    value={formData.sample_type}
                    onChange={(e) => setFormData({ ...formData, sample_type: e.target.value })}
                    className="input w-full"
                    required
                  >
                    {SAMPLE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Precio y Duración */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input w-full"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiempo (horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                    className="input w-full"
                    placeholder="24"
                  />
                </div>
              </div>

              {/* Instrucciones y Preparación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instrucciones para el Paciente
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Instrucciones previas a la prueba..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preparación Requerida
                </label>
                <textarea
                  value={formData.preparation_required}
                  onChange={(e) => setFormData({ ...formData, preparation_required: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Ej: Ayuno de 8 horas..."
                />
              </div>

              {/* Activo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Prueba activa (visible para uso)
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingTest ? 'Actualizar' : 'Crear'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { CheckCircle, AlertCircle } from 'lucide-react';
