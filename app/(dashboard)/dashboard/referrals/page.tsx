'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Building,
  FileText,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Referral {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_dni: number;
  medical_record_number: string;
  clinical_diagnosis: string;
  icd10_codes: string[];
  priority: 'routine' | 'urgent' | 'emergency';
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  referring_department_name: string;
  target_department_name: string;
  referring_doctor_name: string;
  created_at: string;
  notes?: string;
}

export default function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReferrals();
  }, [filter]);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      let url = '/api/referrals';
      if (filter !== 'all') {
        url += `?status=${filter}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar derivaciones');
      
      const data = await res.json();
      setReferrals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/referrals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      
      if (!res.ok) throw new Error(`Error al ${action === 'accept' ? 'aceptar' : 'rechazar'}`);
      
      // Refresh list
      fetchReferrals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    }
  };

  const filteredReferrals = referrals.filter(ref => 
    ref.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.clinical_diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.patient_dni?.toString().includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      routine: 'bg-gray-100 text-gray-700',
      urgent: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800',
    };
    
    const labels: Record<string, string> = {
      routine: 'Routine',
      urgent: 'Urgente',
      emergency: 'Emergencia',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || styles.routine}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Derivaciones Clínicas</h1>
          <p className="text-gray-500 mt-1">Gestión de derivaciones entre departamentos</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por paciente, diagnóstico o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'accepted', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'Todas' : 
                   f === 'pending' ? 'Pendientes' :
                   f === 'accepted' ? 'Aceptadas' : 'Completadas'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{referrals.length}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {referrals.filter(r => r.status === 'pending').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Aceptadas</p>
            <p className="text-2xl font-bold text-green-600">
              {referrals.filter(r => r.status === 'accepted').length}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Urgentes</p>
            <p className="text-2xl font-bold text-red-600">
              {referrals.filter(r => r.priority === 'emergency' || r.priority === 'urgent').length}
            </p>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      {loading ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <Clock className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-500">Cargando derivaciones...</p>
          </div>
        </div>
      ) : filteredReferrals.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay derivaciones para mostrar</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Paciente</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Diagnóstico</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Origen → Destino</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Prioridad</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{referral.patient_name}</p>
                          <p className="text-sm text-gray-500">DNI: {referral.patient_dni} | MRN: {referral.medical_record_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{referral.clinical_diagnosis}</p>
                      <p className="text-xs text-gray-500">
                        {referral.icd10_codes?.join(', ') || 'Sin código ICD-10'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">{referral.referring_department_name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">→ {referral.target_department_name}</p>
                        </div>
                      </div>
                      {referral.referring_doctor_name && (
                        <p className="text-xs text-gray-400 mt-1">Dr. {referral.referring_doctor_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getPriorityBadge(referral.priority)}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(referral.status)}
                    </td>
                    <td className="px-4 py-3">
                      {referral.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(referral.id, 'accept')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Aceptar"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleAction(referral.id, 'reject')}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Rechazar"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      {referral.status === 'accepted' && (
                        <Link
                          href={`/dashboard/physiotherapy/evaluation/new?patient_id=${referral.patient_id}&referral_id=${referral.id}`}
                          className="text-sm text-purple-600 hover:underline"
                        >
                          Ir a Evaluación →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
