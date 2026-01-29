'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, 
  Search, 
  Filter,
  ArrowRight,
  User,
  Building,
  Calendar,
  ChevronRight,
  Eye,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const priorityColors: Record<string, string> = {
  routine: 'bg-gray-100 text-gray-800',
  urgent: 'bg-orange-100 text-orange-800',
  emergency: 'bg-red-100 text-red-800',
};

export default function PhysiotherapyReferralsPage() {
  const supabase = createClient();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter]);

  const fetchReferrals = async () => {
    setLoading(true);
    let query = supabase
      .from('clinical_references')
      .select(`
        *,
        patients (id, first_name, last_name, dni),
        referring_departments (id, name),
        target_departments (id, name)
      `, { count: 'exact' })
      .eq('target_department_id', 'physiotherapy') // Solo derivaciones a fisioterapia
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query;

    if (!error && data) {
      setReferrals(data);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const handleAccept = async (id: string) => {
    const { error } = await supabase
      .from('clinical_references')
      .update({ status: 'accepted' })
      .eq('id', id);

    if (!error) {
      fetchReferrals();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('clinical_references')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (!error) {
      fetchReferrals();
    }
  };

  const filteredReferrals = referrals.filter((ref: any) => {
    const patientName = ref.patients 
      ? `${ref.patients.first_name} ${ref.patients.last_name}`.toLowerCase() 
      : '';
    return patientName.includes(searchTerm.toLowerCase()) ||
           ref.clinical_diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Derivaciones a Fisioterapia</h1>
          <p className="text-gray-500 mt-1">Gestión de derivaciones desde otros departamentos</p>
        </div>
        <Link href="/dashboard/physiotherapy/referrals/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Derivación
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
                <option value="pending">Pendiente</option>
                <option value="accepted">Aceptada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Total Derivaciones</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {referrals.filter((r: any) => r.status === 'pending').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Aceptadas</p>
            <p className="text-2xl font-bold text-green-600">
              {referrals.filter((r: any) => r.status === 'accepted').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Urgentes</p>
            <p className="text-2xl font-bold text-orange-600">
              {referrals.filter((r: any) => r.priority === 'urgent' || r.priority === 'emergency').length}
            </p>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Cargando...</p>
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay derivaciones</p>
              <Link href="/dashboard/physiotherapy/referrals/new" className="btn-primary mt-4">
                Crear derivación
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {filteredReferrals.map((ref: any) => (
                <div key={ref.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {ref.patients 
                              ? `${ref.patients.first_name} ${ref.patients.last_name}`
                              : 'Paciente desconocido'}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[ref.priority]}`}>
                            {ref.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {ref.clinical_diagnosis || 'Sin diagnóstico'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* From Department */}
                      <div className="hidden md:flex items-center gap-1 text-sm text-gray-500">
                        <Building className="w-4 h-4" />
                        {ref.referring_departments?.name || 'N/A'}
                      </div>

                      {/* Date */}
                      <div className="hidden md:flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(ref.created_at).toLocaleDateString()}
                      </div>

                      {/* Status */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ref.status]}`}>
                        {statusLabels[ref.status] || ref.status}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {ref.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleAccept(ref.id)}
                              className="p-2 hover:bg-green-100 rounded-lg text-green-600"
                              title="Aceptar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleReject(ref.id)}
                              className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                              title="Rechazar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Reference Type */}
                  <div className="mt-2 ml-14 flex gap-4 text-sm">
                    <span>
                      <strong>Tipo:</strong> {ref.reference_type}
                    </span>
                    {ref.icd10_codes && ref.icd10_codes.length > 0 && (
                      <span>
                        <strong>CIE-10:</strong> {ref.icd10_codes.join(', ')}
                      </span>
                    )}
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
