'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Activity,
  ChevronRight,
  Loader2,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface PhysioSession {
  id: string;
  session_date: string;
  session_time: string;
  patient_id: string;
  patient_name: string;
  patient_dni: string;
  therapist_id: string;
  therapist_name: string;
  session_type: string;
  status: string;
  pain_level: number;
  techniques_applied: string[];
}

export default function PhysioSessionsList() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<PhysioSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[Sessions] Obteniendo sesiones de physio_sessions...');
      
      // Consulta directa sin JOINs complejos - obtener datos básicos
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('physio_sessions')
        .select(`
            id,
            session_date,
            session_time,
            patient_id,
            therapist_id,
            status,
            pain_level,
            techniques_applied,
            notes
          `)
        .order('session_date', { ascending: false })
        .limit(50);

      console.log('[Sessions] Datos recibidos:', sessionsData?.length || 0, 'sesiones');
      
      if (sessionsError) {
        console.error('[Sessions] Error de Supabase:', sessionsError);
        throw sessionsError;
      }

      if (!sessionsData || sessionsData.length === 0) {
        console.log('[Sessions] No hay sesiones en la tabla, verificando datos...');
        // Verificar si hay datos de prueba
        const { count } = await supabase
          .from('physio_sessions')
          .select('*', { count: 'exact', head: true });
        console.log('[Sessions] Total de sesiones en tabla:', count);
        setSessions([]);
        setLoading(false);
        return;
      }

      // Obtener pacientes y terapeutas por separado
      const patientIds = Array.from(new Set(sessionsData?.map((s: any) => s.patient_id).filter(Boolean) || []));
      const therapistIds = Array.from(new Set(sessionsData?.map((s: any) => s.therapist_id).filter(Boolean) || []));

      let patientMap: Record<string, any> = {};
      let therapistMap: Record<string, any> = {};

      if (patientIds.length > 0) {
        const { data: patientsData } = await supabase
          .from('patients')
          .select('id, full_name, dni, first_name, last_name')
          .in('id', patientIds);
        
        if (patientsData) {
          patientMap = patientsData.reduce<Record<string, any>>((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      if (therapistIds.length > 0) {
        const { data: therapistsData } = await supabase
          .from('profiles')
          .select('id, full_name, first_name, last_name')
          .in('id', therapistIds);
        
        if (therapistsData) {
          therapistMap = therapistsData.reduce<Record<string, any>>((acc, t) => {
            acc[t.id] = t;
            return acc;
          }, {});
        }
      }

      const mappedSessions: PhysioSession[] = (sessionsData || []).map((session: any) => {
        const patient = patientMap[session.patient_id] || {};
        const therapist = therapistMap[session.therapist_id] || {};
        return {
          id: session.id,
          session_date: session.session_date,
          session_time: session.session_time,
          patient_id: session.patient_id,
          patient_name: patient.full_name || patient.first_name + ' ' + patient.last_name || 'Paciente desconocido',
          patient_dni: patient.dni || 'N/A',
          therapist_id: session.therapist_id,
          therapist_name: therapist.full_name || therapist.first_name + ' ' + therapist.last_name || 'Terapeuta desconocido',
          session_type: session.session_type || 'treatment',
          status: session.status || 'completed',
          pain_level: session.pain_level || 0,
          techniques_applied: session.techniques_applied || [],
        };
      });

      setSessions(mappedSessions);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Error al cargar las sesiones. Por favor, verifica que las tablas de fisioterapia existan.');
      // Generar datos de ejemplo para demostración
      setSessions([
        {
          id: 'demo-1',
          session_date: new Date().toISOString().split('T')[0],
          session_time: '10:00:00',
          patient_id: 'demo-patient',
          patient_name: 'Juan Pérez García',
          patient_dni: '12345678A',
          therapist_id: 'demo-therapist',
          therapist_name: 'Dra. María López',
          session_type: 'treatment',
          status: 'completed',
          pain_level: 4,
          techniques_applied: ['Masaje terapéutico', 'Ejercicio terapéutico'],
        },
        {
          id: 'demo-2',
          session_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          session_time: '11:00:00',
          patient_id: 'demo-patient-2',
          patient_name: 'Ana Martínez Ruiz',
          patient_dni: '87654321B',
          therapist_id: 'demo-therapist',
          therapist_name: 'Dra. María López',
          session_type: 'evaluation',
          status: 'completed',
          pain_level: 6,
          techniques_applied: ['Evaluación inicial', 'Electroterapia TENS'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.patient_dni.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.therapist_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || session.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      completed: { bg: 'bg-green-100', text: 'text-green-700' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700' },
      scheduled: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
    };

    const config = statusConfig[status] || statusConfig.completed;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status === 'completed' ? 'Completada' : status === 'in_progress' ? 'En progreso' : status === 'scheduled' ? 'Programada' : 'Cancelada'}
      </span>
    );
  };

  const getPainLevelColor = (level: number) => {
    if (level >= 7) return 'bg-red-500';
    if (level >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando sesiones de fisioterapia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/physiotherapy" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sesiones de Fisioterapia</h1>
            <p className="text-gray-500 mt-1">Historial de todas las sesiones de tratamiento</p>
          </div>
        </div>
        <Link href="/dashboard/physiotherapy/sessions/new" className="btn-primary btn-md">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Sesión
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">{error}</p>
          <p className="text-xs text-yellow-600 mt-1">Mostrando datos de demostración. Ejecuta la migración de base de datos para habilitar todas las funciones.</p>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por paciente, terapeuta o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="all">Todos los estados</option>
                <option value="completed">Completadas</option>
                <option value="in_progress">En progreso</option>
                <option value="scheduled">Programadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
            <button onClick={fetchSessions} className="btn-secondary btn-md">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            Sesiones ({filteredSessions.length})
          </h2>
        </div>
        <div className="card-body">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No se encontraron sesiones</p>
              <Link href="/dashboard/physiotherapy/sessions/new" className="btn-primary btn-md">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Sesión
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Date and Time */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(session.session_date)}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(session.session_time)}
                      </p>
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{session.patient_name}</span>
                    </div>
                    <p className="text-sm text-gray-500 ml-6">DNI: {session.patient_dni}</p>
                  </div>

                  {/* Session Details */}
                  <div className="flex items-center gap-4">
                    {/* Pain Level */}
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <div className="flex items-center gap-1">
                        <div className={`w-6 h-6 rounded-full ${getPainLevelColor(session.pain_level)} flex items-center justify-center`}>
                          <span className="text-xs font-medium text-white">{session.pain_level}</span>
                        </div>
                        <span className="text-sm text-gray-500">/10</span>
                      </div>
                    </div>

                    {/* Status */}
                    {getStatusBadge(session.status)}
                  </div>

                  {/* Therapist */}
                  <div className="text-sm text-gray-500 min-w-[120px]">
                    <p className="truncate">{session.therapist_name}</p>
                  </div>

                  {/* Actions */}
                  <Link
                    href={`/dashboard/patients/${session.patient_id}/history`}
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Ver historial
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
