'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  ChevronDown,
  X,
  Check,
  AlertCircle,
  Dumbbell,
  FlaskConical,
  Stethoscope,
  Activity,
  FileText,
  Settings
} from 'lucide-react';

// Types
interface TreatmentType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
}

interface Technique {
  id: string;
  code: string;
  name: string;
  description: string | null;
  treatment_type_id: string;
  treatment_types?: { name: string };
  default_duration_minutes: number | null;
  is_active: boolean;
}

interface Equipment {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  model: string | null;
  status: string;
  location: string | null;
  treatment_types?: { name: string };
  parameter_fields?: EquipmentParameterField[];
}

interface EquipmentParameterField {
  id?: string;
  field_name: string;
  field_label: string;
  field_description: string;
  field_type: 'number' | 'text' | 'select' | 'range' | 'boolean';
  field_unit: string;
  field_default_value: string;
  field_min: number;
  field_max: number;
  field_step: number;
  field_options: { value: string; label: string }[];
  field_required: boolean;
  field_order: number;
}

interface Exercise {
  id: string;
  code: string;
  name: string;
  description: string | null;
  body_region: string | null;
  difficulty_level: string | null;
  target_muscle_group: string[] | null;
}

// API functions
async function fetchTreatmentTypes(): Promise<TreatmentType[]> {
  try {
    const res = await fetch('/api/physio-catalogs/treatment-types');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchTechniques(treatmentTypeId?: string): Promise<Technique[]> {
  try {
    const url = treatmentTypeId 
      ? `/api/physio-catalogs/techniques?treatment_type_id=${treatmentTypeId}`
      : '/api/physio-catalogs/techniques';
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchEquipment(): Promise<Equipment[]> {
  try {
    const res = await fetch('/api/physio-catalogs/equipment');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchExercises(): Promise<Exercise[]> {
  try {
    const res = await fetch('/api/physio-catalogs/exercises');
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default function PhysioCatalogsPage() {
  const [activeTab, setActiveTab] = useState<'treatments' | 'techniques' | 'equipment' | 'exercises'>('treatments');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TreatmentType | Technique | Equipment | Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Modal form state
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [tt, t, e, ex] = await Promise.all([
        fetchTreatmentTypes(),
        fetchTechniques(),
        fetchEquipment(),
        fetchExercises()
      ]);
      setTreatmentTypes(tt);
      setTechniques(t);
      setEquipment(e);
      setExercises(ex);
    } catch (err) {
      setError('Error al cargar los catálogos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: 'treatments', label: 'Tipos de Tratamiento', icon: Stethoscope },
    { id: 'techniques', label: 'Técnicas', icon: Activity },
    { id: 'equipment', label: 'Equipos', icon: FlaskConical },
    { id: 'exercises', label: 'Ejercicios', icon: Dumbbell },
  ];

  const filteredTreatmentTypes = treatmentTypes.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTechniques = techniques.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEquipment = (equipment || []).filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.body_region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (item?: TreatmentType | Technique | Equipment | Exercise) => {
    if (item) {
      setEditingItem(item);
      setFormData(item as unknown as Record<string, unknown>);
    } else {
      setEditingItem(null);
      setFormData({});
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  // Funciones para campos parametrizables
  const addParameterField = () => {
    const params = (formData.parameter_fields as EquipmentParameterField[]) || [];
    setFormData({
      ...formData,
      parameter_fields: [
        ...params,
        {
          field_name: '',
          field_label: '',
          field_description: '',
          field_type: 'number',
          field_unit: '',
          field_default_value: '',
          field_min: 0,
          field_max: 100,
          field_step: 1,
          field_options: [],
          field_required: false,
          field_order: params.length,
        },
      ],
    });
  };

  const removeParameterField = (index: number) => {
    const params = (formData.parameter_fields as EquipmentParameterField[]) || [];
    setFormData({
      ...formData,
      parameter_fields: params.filter((_: any, i: number) => i !== index),
    });
  };

  const updateParameterField = (index: number, field: string, value: any) => {
    const params = (formData.parameter_fields as EquipmentParameterField[]) || [];
    const updated = [...params];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({
      ...formData,
      parameter_fields: updated,
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      let success = false;
      let errorMessage = '';
      
      if (activeTab === 'treatments') {
        const endpoint = editingItem ? `/api/physio-catalogs/treatment-types?id=${editingItem.id}` : '/api/physio-catalogs/treatment-types';
        const method = editingItem ? 'PUT' : 'POST';
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errorData = await res.json();
          errorMessage = errorData.error || 'Error desconocido';
        } else {
          success = true;
        }
      } else if (activeTab === 'techniques') {
        const endpoint = editingItem ? `/api/physio-catalogs/techniques?id=${editingItem.id}` : '/api/physio-catalogs/techniques';
        const method = editingItem ? 'PUT' : 'POST';
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errorData = await res.json();
          errorMessage = errorData.error || 'Error desconocido';
        } else {
          success = true;
        }
      } else if (activeTab === 'equipment') {
        const endpoint = editingItem ? `/api/physio-catalogs/equipment?id=${editingItem.id}` : '/api/physio-catalogs/equipment';
        const method = editingItem ? 'PUT' : 'POST';
        
        // Normalizar datos del equipo
        const equipmentData = {
          code: formData.code || null,
          name: formData.name || 'Equipo sin nombre',
          brand: formData.brand || null,
          model: formData.model || null,
          serial_number: formData.serial_number || null,
          location: formData.location || null,
          status: formData.status || 'available',
          treatment_type_id: formData.treatment_type_id || null,
          purchase_date: formData.purchase_date || null,
          last_maintenance_date: formData.last_maintenance_date || null,
          next_maintenance_date: formData.next_maintenance_date || null,
          is_active: formData.is_active !== false,
          parameter_fields: (formData.parameter_fields as EquipmentParameterField[]) || null,
        };
        
        console.log('Guardando equipo:', equipmentData);
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(equipmentData),
        });
        if (!res.ok) {
          const errorData = await res.json();
          errorMessage = errorData.error || 'Error desconocido';
          console.error('Error guardando equipo:', errorData);
        } else {
          success = true;
        }
      } else if (activeTab === 'exercises') {
        const endpoint = editingItem ? `/api/physio-catalogs/exercises?id=${editingItem.id}` : '/api/physio-catalogs/exercises';
        const method = editingItem ? 'PUT' : 'POST';
        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errorData = await res.json();
          errorMessage = errorData.error || 'Error desconocido';
        } else {
          success = true;
        }
      }
      
      if (success) {
        await loadData();
        handleCloseModal();
      } else {
        setError('Error al guardar: ' + errorMessage);
      }
    } catch (err) {
      setError('Error al guardar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      console.error('Error saving:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogos de Fisioterapia</h1>
          <p className="text-gray-500 mt-1">Administra tratamientos, técnicas, equipos y ejercicios</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo {activeTab === 'treatments' ? 'Tratamiento' : activeTab === 'techniques' ? 'Técnica' : activeTab === 'equipment' ? 'Equipo' : 'Ejercicio'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={`Buscar ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Content */}
      <div className="card">
        {activeTab === 'treatments' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTreatmentTypes.map((treatment) => (
                  <tr key={treatment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{treatment.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{treatment.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{treatment.category || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${treatment.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {treatment.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenModal(treatment)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'techniques' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de Tratamiento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración (min)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTechniques.map((technique) => {
                  // Buscar el nombre del tipo de tratamiento localmente
                  const treatmentType = treatmentTypes.find(tt => tt.id === technique.treatment_type_id);
                  return (
                    <tr key={technique.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{technique.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{technique.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{treatmentType?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{technique.default_duration_minutes || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${technique.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {technique.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenModal(technique)}
                          className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca/Modelo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEquipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{eq.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{eq.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {eq.brand && eq.model ? `${eq.brand} ${eq.model}` : eq.brand || eq.model || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{eq.location || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        eq.status === 'available' ? 'badge-success' :
                        eq.status === 'in_use' ? 'badge-warning' :
                        eq.status === 'maintenance' ? 'badge-info' :
                        'badge-danger'
                      }`}>
                        {eq.status === 'available' ? 'Disponible' :
                         eq.status === 'in_use' ? 'En uso' :
                         eq.status === 'maintenance' ? 'Mantenimiento' :
                         'Fuera de servicio'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenModal(eq)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'exercises' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Región Corporal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo Muscular</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dificultad</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExercises.map((exercise) => (
                  <tr key={exercise.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{exercise.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{exercise.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{exercise.body_region || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {exercise.target_muscle_group?.join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        exercise.difficulty_level === 'beginner' ? 'badge-success' :
                        exercise.difficulty_level === 'intermediate' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {exercise.difficulty_level === 'beginner' ? 'Básico' :
                         exercise.difficulty_level === 'intermediate' ? 'Intermedio' :
                         'Avanzado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenModal(exercise)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {((activeTab === 'treatments' && filteredTreatmentTypes.length === 0) ||
          (activeTab === 'techniques' && filteredTechniques.length === 0) ||
          (activeTab === 'equipment' && filteredEquipment.length === 0) ||
          (activeTab === 'exercises' && filteredExercises.length === 0)) && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No hay registros encontrados</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingItem ? 'Editar' : 'Nuevo'} {activeTab === 'treatments' ? 'Tratamiento' : activeTab === 'techniques' ? 'Técnica' : activeTab === 'equipment' ? 'Equipo' : 'Ejercicio'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Form fields based on tab */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Código *</label>
                  <input
                    type="text"
                    value={(formData.code as string) || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input"
                    placeholder="Código único"
                  />
                </div>
                <div>
                  <label className="label">Nombre *</label>
                  <input
                    type="text"
                    value={(formData.name as string) || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Nombre"
                  />
                </div>
              </div>

              <div>
                <label className="label">Descripción</label>
                <textarea
                  value={(formData.description as string) || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Descripción detallada"
                />
              </div>

              {activeTab === 'treatments' && (
                <div>
                  <label className="label">Categoría</label>
                  <select
                    value={(formData.category as string) || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="thermal">Térmico</option>
                    <option value="electrical">Eléctrico</option>
                    <option value="mechanical">Mecánico</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              )}

              {activeTab === 'techniques' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Tipo de Tratamiento *</label>
                      <select
                        value={(formData.treatment_type_id as string) || ''}
                        onChange={(e) => setFormData({ ...formData, treatment_type_id: e.target.value })}
                        className="input"
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {treatmentTypes.map((tt) => (
                          <option key={tt.id} value={tt.id}>{tt.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Duración por Defecto (min)</label>
                      <input
                        type="number"
                        value={(formData.default_duration_minutes as number) || 15}
                        onChange={(e) => setFormData({ ...formData, default_duration_minutes: parseInt(e.target.value) || 15 })}
                        className="input"
                        min="1"
                        max="120"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={(formData.is_active as boolean) !== false}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label htmlFor="is_active">Técnica activa</label>
                  </div>
                </>
              )}

              {activeTab === 'equipment' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Número de Serie</label>
                      <input
                        type="text"
                        value={(formData.serial_number as string) || ''}
                        onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                        className="input"
                        placeholder="Número de serie"
                      />
                    </div>
                    <div>
                      <label className="label">Código Interno</label>
                      <input
                        type="text"
                        value={(formData.code as string) || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="input"
                        placeholder="Código interno"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Nombre del Equipo *</label>
                      <input
                        type="text"
                        value={(formData.name as string) || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                        placeholder="Nombre del equipo"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Tipo de Tratamiento</label>
                      <select
                        value={(formData.treatment_type_id as string) || ''}
                        onChange={(e) => setFormData({ ...formData, treatment_type_id: e.target.value })}
                        className="input"
                      >
                        <option value="">Ninguno</option>
                        {(treatmentTypes || []).map((tt) => (
                          <option key={tt.id} value={tt.id}>{tt.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Marca</label>
                      <input
                        type="text"
                        value={(formData.brand as string) || ''}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="input"
                        placeholder="Marca"
                      />
                    </div>
                    <div>
                      <label className="label">Modelo</label>
                      <input
                        type="text"
                        value={(formData.model as string) || ''}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="input"
                        placeholder="Modelo"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Ubicación</label>
                      <input
                        type="text"
                        value={(formData.location as string) || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="input"
                        placeholder="Ubicación"
                      />
                    </div>
                    <div>
                      <label className="label">Estado</label>
                      <select
                        value={(formData.status as string) || 'available'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="input"
                      >
                        <option value="available">Disponible</option>
                        <option value="in_use">En uso</option>
                        <option value="maintenance">Mantenimiento</option>
                        <option value="out_of_service">Fuera de servicio</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">Fecha de Compra</label>
                      <input
                        type="date"
                        value={(formData.purchase_date as string) || ''}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Último Mantenimiento</label>
                      <input
                        type="date"
                        value={(formData.last_maintenance_date as string) || ''}
                        onChange={(e) => setFormData({ ...formData, last_maintenance_date: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Próximo Mantenimiento</label>
                      <input
                        type="date"
                        value={(formData.next_maintenance_date as string) || ''}
                        onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                  
                  {/* Campos Parametrizables */}
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-semibold text-gray-900">Campos Parametrizables</h3>
                      <button
                        type="button"
                        onClick={addParameterField}
                        className="btn btn-secondary text-sm flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar Campo
                      </button>
                    </div>
                    
                    {(!formData.parameter_fields || (formData.parameter_fields as EquipmentParameterField[]).length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No hay campos configurados. Agrega campos para definir los parámetros que se mostrarán al usar este equipo en sesiones.
                      </p>
                    )}
                    
                    {(formData.parameter_fields as EquipmentParameterField[]).map((param, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg mb-3">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Campo {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeParameterField(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label text-xs">Nombre del campo *</label>
                            <input
                              type="text"
                              value={param.field_name}
                              onChange={(e) => updateParameterField(index, 'field_name', e.target.value)}
                              className="input text-sm"
                              placeholder="snake_case: intensity"
                            />
                          </div>
                          <div>
                            <label className="label text-xs">Label *</label>
                            <input
                              type="text"
                              value={param.field_label}
                              onChange={(e) => updateParameterField(index, 'field_label', e.target.value)}
                              className="input text-sm"
                              placeholder="Intensidad"
                            />
                          </div>
                          <div>
                            <label className="label text-xs">Tipo</label>
                            <select
                              value={param.field_type}
                              onChange={(e) => updateParameterField(index, 'field_type', e.target.value)}
                              className="input text-sm"
                            >
                              <option value="number">Número</option>
                              <option value="text">Texto</option>
                              <option value="select">Selección</option>
                              <option value="range">Rango</option>
                              <option value="boolean">Sí/No</option>
                            </select>
                          </div>
                          <div>
                            <label className="label text-xs">Unidad</label>
                            <input
                              type="text"
                              value={param.field_unit}
                              onChange={(e) => updateParameterField(index, 'field_unit', e.target.value)}
                              className="input text-sm"
                              placeholder="mA, Hz, min"
                            />
                          </div>
                          {(param.field_type === 'number' || param.field_type === 'range') && (
                            <>
                              <div>
                                <label className="label text-xs">Mínimo</label>
                                <input
                                  type="number"
                                  value={param.field_min}
                                  onChange={(e) => updateParameterField(index, 'field_min', parseFloat(e.target.value))}
                                  className="input text-sm"
                                />
                              </div>
                              <div>
                                <label className="label text-xs">Máximo</label>
                                <input
                                  type="number"
                                  value={param.field_max}
                                  onChange={(e) => updateParameterField(index, 'field_max', parseFloat(e.target.value))}
                                  className="input text-sm"
                                />
                              </div>
                            </>
                          )}
                          {param.field_type === 'select' && (
                            <div className="col-span-2">
                              <label className="label text-xs">Opciones (value,label)</label>
                              <textarea
                                value={param.field_options.map((o: any) => `${o.value},${o.label}`).join(';')}
                                onChange={(e) => {
                                  const opts = e.target.value.split(';').map((o: string) => {
                                    const [v, l] = o.split(',');
                                    return { value: v?.trim() || '', label: l?.trim() || '' };
                                  }).filter((o: any) => o.value && o.label);
                                  updateParameterField(index, 'field_options', opts);
                                }}
                                className="input text-sm"
                                placeholder="continuo,Continuo;pulsado,Pulsado"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={(formData.is_active as boolean) !== false}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <label htmlFor="is_active">Equipo activo</label>
                  </div>
                </>
              )}

              {activeTab === 'exercises' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Región Corporal</label>
                      <select
                        value={(formData.body_region as string) || ''}
                        onChange={(e) => setFormData({ ...formData, body_region: e.target.value })}
                        className="input"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="cervical">Cervical</option>
                        <option value="lumbar">Lumbar</option>
                        <option value="shoulder">Hombro</option>
                        <option value="knee">Rodilla</option>
                        <option value="hip">Cadera</option>
                        <option value="ankle">Tobillo</option>
                        <option value="elbow">Codo</option>
                        <option value="wrist">Muñeca</option>
                        <option value="full_body">Cuerpo completo</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Dificultad</label>
                      <select
                        value={(formData.difficulty_level as string) || ''}
                        onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                        className="input"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="beginner">Básico</option>
                        <option value="intermediate">Intermedio</option>
                        <option value="advanced">Avanzado</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <button onClick={handleCloseModal} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={handleSave} className="btn btn-primary flex items-center gap-2">
                <Check className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
