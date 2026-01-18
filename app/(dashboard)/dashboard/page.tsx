import { formatDate, formatRelativeTime, getRoleLabel } from '@/lib/utils';
import {
  Users,
  Calendar,
  Pill,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats, getTodayAppointments, getRecentPatients } from '@/lib/actions/dashboard';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  // Usar cliente admin para obtener estadísticas
  const stats = await getDashboardStats();
  const todayAppointmentsList = await getTodayAppointments();
  const recentPatients = await getRecentPatients();

  // Determinar qué tarjetas mostrar según el rol
  const role = profile?.role || 'reception';
  const roleLabel = getRoleLabel(role);

  const statsCards = [
    {
      title: 'Pacientes Totales',
      value: stats.totalPatients,
      icon: Users,
      color: 'primary',
      href: '/dashboard/patients',
      roles: ['admin', 'doctor', 'nurse', 'reception'],
    },
    {
      title: 'Citas Hoy',
      value: stats.todayAppointments,
      icon: Calendar,
      color: 'success',
      href: '/dashboard/appointments',
      roles: ['admin', 'doctor', 'nurse', 'reception'],
    },
    {
      title: 'Recetas Pendientes',
      value: stats.pendingPrescriptions,
      icon: Pill,
      color: 'warning',
      href: '/dashboard/pharmacy',
      roles: ['admin', 'pharmacy', 'doctor'],
    },
    {
      title: 'Stock Bajo',
      value: stats.lowStockItems,
      icon: AlertCircle,
      color: 'danger',
      href: '/dashboard/inventory',
      roles: ['admin', 'pharmacy'],
    },
  ].filter(card => card.roles.includes(role));

  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">¡Bienvenido, {profile?.full_name || 'Usuario'}!</h1>
        <p className="text-primary-100 mt-1">
          {getRoleLabel(role)} • {formatDate(new Date().toISOString(), "EEEE d 'de' MMMM 'de' yyyy")}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Citas de Hoy</h2>
            <Link href="/dashboard/appointments" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todas
            </Link>
          </div>
          <div className="card-body">
            {todayAppointmentsList && todayAppointmentsList.length > 0 ? (
              <div className="space-y-3">
                {todayAppointmentsList.map((appointment) => {
                  const apt = appointment as {
                    id: string;
                    start_time: string;
                    status: string;
                    reason?: string;
                    patient_first_name?: string;
                    patient_last_name?: string;
                    doctor_full_name?: string;
                  };
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-12 text-center">
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(apt.start_time).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                          {apt.patient_first_name} {apt.patient_last_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{apt.reason}</p>
                      </div>
                      <span className={`badge ${
                        apt.status === 'completed' ? 'badge-success' :
                        apt.status === 'in_progress' ? 'badge-warning' :
                        apt.status === 'cancelled' ? 'badge-danger' :
                        'badge-info'
                      }`}>
                        {apt.status === 'in_progress' ? 'En proceso' : apt.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay citas programadas para hoy</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent patients */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pacientes Recientes</h2>
            <Link href="/dashboard/patients" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todos
            </Link>
          </div>
          <div className="card-body">
            {recentPatients && recentPatients.length > 0 ? (
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/dashboard/patients/${patient.id}`}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                      {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        MRN: {patient.medical_record_number}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(patient.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay pacientes registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      {(role === 'admin' || role === 'reception') && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/dashboard/patients/new"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Users className="w-8 h-8 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Nuevo Paciente</span>
              </Link>
              <Link
                href="/dashboard/appointments/new"
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Calendar className="w-8 h-8 text-primary-600" />
                <span className="text-sm font-medium text-gray-700">Agendar Cita</span>
              </Link>
              {(role === 'admin' || role === 'pharmacy') && (
                <Link
                  href="/dashboard/inventory"
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Pill className="w-8 h-8 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">Ver Inventario</span>
                </Link>
              )}
              {role === 'admin' && (
                <Link
                  href="/dashboard/billing"
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Activity className="w-8 h-8 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">Facturación</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
