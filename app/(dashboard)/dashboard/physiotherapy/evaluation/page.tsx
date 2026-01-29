'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, 
  Search, 
  Filter,
  FileText,
  User,
  Calendar,
  ChevronRight,
  Eye,
  Edit
} from 'lucide-react';

export default function PhysiotherapyEvaluationsPage() {
  const supabase = createClient();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchEvaluations();
  }, [statusFilter]);

  const fetchEvaluations = async () => {
    setLoading(true);
    let query = supabase
      .from('physio_medical_records')
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
      setEvaluations(data);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const filteredEvaluations = evaluations.filter((ev: any) => {
    const patientName = ev.patients 
      ? `${ev.patients.first_name} ${ev.patients.last_name}`.toLowerCase() 
      : '';
    return patientName.includes(searchTerm.toLowerCase()) ||
           ev.chief_complaint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           ev.clinical_diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Evaluaciones de Fisioterapia</h1>
          <p className="text-gray-500 mt-1">Historial de evaluaciones iniciales</p>
        </div>
        <Link href="/dashboard/physiotherapy/evaluation/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Evaluación
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
                placeholder="Buscar por paciente, motivo..."
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
                <option value="">Todos</option>
                <option value="active">Activo</option>
                <option value="completed">Completado</option>
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
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Activos</p>
            <p className="text-2xl font-bold text-green-600">
              {evaluations.filter((e: any) => e.status === 'active').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Completados</p>
            <p className="text-2xl font-bold text-blue-600">
              {evaluations.filter((e: any) => e.status === 'completed').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Este Mes</p>
            <p className="text-2xl font-bold text-purple-600">
              {evaluations.filter((e: any) => {
                const date = new Date(e.created_at);
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Cargando...</p>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay evaluaciones</p>
              <Link href="/dashboard/physiotherapy/evaluation/new" className="btn-primary mt-4">
                Crear evaluación
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {filteredEvaluations.map((ev: any) => (
                <div key={ev.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {ev.patients ? `${ev.patients.first_name} ${ev.patients.last_name}` : 'Sin paciente'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {ev.chief_complaint || 'Sin motivo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ev.status === 'active' ? 'bg-green-100 text-green-800' :
                        ev.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ev.status || 'N/A'}
                      </span>
                      <Link href={`/dashboard/physiotherapy/evaluation/${ev.id}`} className="p-2 hover:bg-gray-100 rounded-lg">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </Link>
                      <Link href={`/dashboard/physiotherapy/evaluation/${ev.id}/edit`} className="p-2 hover:bg-gray-100 rounded-lg">
                        <Edit className="w-4 h-4 text-gray-600" />
                      </Link>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
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
