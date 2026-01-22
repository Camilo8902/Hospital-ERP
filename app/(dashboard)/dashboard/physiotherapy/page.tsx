'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Activity, 
  Users, 
  Calendar, 
  TrendingDown,
  Plus,
  Clock,
  FileText,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface PhysioStats {
  activePatients: number;
  sessionsThisMonth: number;
  sessionsThisWeek: number;
  averagePainReduction: number;
}

interface PhysioRecord {
  id: string;
  patient_id: string;
  therapist_id: string;
  evaluation_date: string;
  chief_complaint: string;
  clinical_diagnosis: string;
  status: string;
  created_at: string;
  patients?: {
    id: string;
    full_name: string;
    dni: string;
    phone?: string;
  };
  therapists?: {
    id: string;
    full_name: string;
  };
}

export default function PhysiotherapyDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PhysioStats>({
    activePatients: 0,
    sessionsThisMonth: 0,
    sessionsThisWeek: 0,
    averagePainReduction: 0,
  });
  const [recentRecords, setRecentRecords] = useState<PhysioRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener estadísticas
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_physio_dashboard_stats');

      if (statsError) {
        console.error('Error fetching stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        setStats({
          activePatients: statsData[0].active_patients || 0,
          sessionsThisMonth: statsData[0].sessions_this_month || 0,
          sessionsThisWeek: statsData[0].sessions_this_week || 0,
          averagePainReduction: statsData[0].average_pain_reduction || 0,
        });
      }

      // Obtener registros recientes
      const { data: records, error: recordsError } = await supabase
        .from('physio_medical_records')
        .select(`
          id,
          patient_id,
          therapist_id,
          evaluation_date,
          chief_complaint,
          clinical_diagnosis,
          status,
          created_at,
          patients!inner(id, full_name, dni, phone),
          therapists!inner(id, full_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recordsError) {
        console.error('Error fetching records:', recordsError);
      } else if (records) {
        setRecentRecords(records as unknown as PhysioRecord[]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando dashboard de fisioterapia...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchData} className="btn-primary btn-md">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fisioterapia</h1>
          <p className="text-gray-500 mt-1">Gestión de pacientes y sesiones de fisioterapia</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn-secondary btn-md">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
          <Link href="/dashboard/physiotherapy/sessions/new" className="btn-primary btn-md">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Sesión
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pacientes Activos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activePatients}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sesiones Este Mes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.sessionsThisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sesiones Esta Semana</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.sessionsThisWeek}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reducción Dolor Promedio</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averagePainReduction.toFixed(1)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/dashboard/physiotherapy/sessions/new"
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Plus className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Nueva Sesión</h3>
              <p className="text-sm text-gray-500">Documentar sesión de tratamiento</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </div>
        </Link>

        <Link 
          href="/dashboard/patients"
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Buscar Paciente</h3>
              <p className="text-sm text-gray-500">Ver historial de fisioterapia</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </div>
        </Link>

        <Link 
          href="/dashboard/appointments"
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Citas de Fisioterapia</h3>
              <p className="text-sm text-gray-500">Ver citas programadas</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
          </div>
        </Link>
      </div>

      {/* Recent Records */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Registros Recientes
            </h2>
            <Link href="/dashboard/patients" className="text-sm text-purple-600 hover:text-purple-700">
              Ver todos
            </Link>
          </div>
        </div>
        <div className="card-body">
          {recentRecords.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay registros de fisioterapia aún</p>
              <Link 
                href="/dashboard/physiotherapy/sessions/new"
                className="text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block"
              >
                Crear primer registro
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Paciente</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Diagnóstico</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Fecha</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Estado</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 text-sm">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {(record.patients as any)?.full_name || 'Paciente desconocido'}
                          </p>
                          <p className="text-sm text-gray-500">
                            DNI: {(record.patients as any)?.dni || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-900 truncate max-w-xs">
                          {record.clinical_diagnosis || record.chief_complaint || 'Sin diagnóstico'}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-900">
                          {new Date(record.created_at).toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(record.created_at).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'active' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {record.status === 'active' ? 'Activo' : record.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link 
                          href={`/dashboard/patients/${record.patient_id}/history`}
                          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                          Ver historial
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
