'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar,
  User,
  Clock,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  active: 'Activo',
  completed: 'Completado',
  paused: 'Pausado',
  cancelled: 'Cancelado',
};

export default function PhysioPlansPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchPlans();
  }, [statusFilter]);

  const fetchPlans = async () => {
    setLoading(true);
    let query = supabase
      .from('physio_treatment_plans')
      .select(`
        *,
        patients (id, first_name, last_name, dni)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query;

    if (!error && data) {
      setPlans(data);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const filteredPlans = plans.filter((plan: any) => {
    const patientName = plan.patients 
      ? `${plan.patients.first_name} ${plan.patients.last_name}`.toLowerCase() 
      : '';
    return patientName.includes(searchTerm.toLowerCase()) ||
           plan.diagnosis_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           plan.id.includes(searchTerm);
  });

  const getProgress = (plan: any) => {
    if (!plan.total_sessions_prescribed || plan.total_sessions_prescribed === 0) return 0;
    const completed = plan.sessions_completed || 0;
    return Math.round((completed / plan.total_sessions_prescribed) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planes de Tratamiento</h1>
          <p className="text-gray-500 mt-1">Gestiona los planes de fisioterapia</p>
        </div>
        <Link href="/dashboard/physiotherapy/plans/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Plan
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por paciente, diagnóstico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-40"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="completed">Completado</option>
                <option value="paused">Pausado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Total Planes</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Activos</p>
            <p className="text-2xl font-bold text-green-600">
              {plans.filter((p: any) => p.status === 'active').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Completados</p>
            <p className="text-2xl font-bold text-blue-600">
              {plans.filter((p: any) => p.status === 'completed').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">En Pausa</p>
            <p className="text-2xl font-bold text-yellow-600">
              {plans.filter((p: any) => p.status === 'paused').length}
            </p>
          </div>
        </div>
      </div>

      {/* Plans List */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Cargando planes...</p>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron planes</p>
              <Link href="/dashboard/physiotherapy/plans/new" className="btn-primary mt-4">
                Crear primer plan
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {filteredPlans.map((plan: any) => (
                <div key={plan.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {plan.patients 
                              ? `${plan.patients.first_name} ${plan.patients.last_name}`
                              : 'Paciente no encontrado'}
                          </h3>
                          <span className="text-sm text-gray-400">
                            DNI: {plan.patients?.dni || 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {plan.diagnosis_description || 'Sin diagnóstico'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Progress */}
                      <div className="hidden md:block w-32">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progreso</span>
                          <span>{getProgress(plan)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${getProgress(plan)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {plan.sessions_completed || 0} / {plan.total_sessions_prescribed || 0} sesiones
                        </p>
                      </div>

                      {/* Status */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[plan.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[plan.status] || plan.status}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/dashboard/physiotherapy/plans/${plan.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Link>
                        <Link 
                          href={`/dashboard/physiotherapy/plans/${plan.id}/edit`}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 mt-3 ml-14 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Inicio: {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : 'N/A'}
                    </span>
                    {plan.expected_end_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Fin esperado: {new Date(plan.expected_end_date).toLocaleDateString()}
                      </span>
                    )}
                    <span>
                      {plan.sessions_per_week || 0} sesiones/semana
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
