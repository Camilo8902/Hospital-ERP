import { formatDate, getRoleLabel } from '@/lib/utils';
import {
  Users,
  Calendar,
  Pill,
  AlertCircle,
  Activity,
  FlaskConical,
  Clock,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getDashboardStats, getTodayAppointments, getRecentPatients } from '@/lib/actions/dashboard';
import { getTodayPendingLabOrders } from '@/lib/actions/lab';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  const stats = await getDashboardStats();
  const todayAppointmentsList = await getTodayAppointments();
  const recentPatients = await getRecentPatients();
  const pendingLabOrders = await getTodayPendingLabOrders();

  const role = profile?.role || 'reception';

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
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold">¡Bienvenido, {profile?.full_name || 'Usuario'}!</h1>
        <p className="text-primary-100 mt-1 text-sm sm:text-base">
          {getRoleLabel(role)} • {formatDate(new Date().toISOString(), "EEEE d 'de' MMMM 'de' yyyy")}
        </p>
      </div>

      {/* Stats cards - Grid responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statsCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="card p-4 sm:p-6 hover:shadow-md transition-shadow touch-manipulation"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">{stat.title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's appointments */}
        <div className="card">
          <div className="card-header flex items-center justify-between py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Citas de Hoy</h2>
            <Link href="/dashboard/appointments" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Ver todas
            </Link>
          </div>
          <div className="card-body py-2 sm:py-4">
            {todayAppointmentsList && todayAppointmentsList.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {todayAppointmentsList.map((appointment) => {
                  const apt = appointment as {
                    id: string;
                    start_time: string;
                    status: string;
                    reason?: string;
                    patient_first_name?: string;
                    patient_last_name?: string;
                  };
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-10 sm:w-12 text-center flex-shrink-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {new Date(apt.start_time).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {apt.patient_first_name} {apt.patient_last_name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{apt.reason}</p>
                      </div>
                      <span className={`badge flex-shrink-0 text-xs ${
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
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay citas programadas para hoy</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Lab Orders */}
        <div className="card">
          <div className="card-header flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Exámenes Pendientes</h2>
            </div>
            <Link href="/dashboard/lab/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Ver todas
            </Link>
          </div>
          <div className="card-body py-2 sm:py-4">
            {pendingLabOrders && pendingLabOrders.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {pendingLabOrders.slice(0, 5).map((order) => {
                  const labOrder = order as {
                    id: string;
                    order_number: string;
                    status: string;
                    priority: string;
                    created_at: string;
                    patients?: {
                      first_name?: string;
                      last_name?: string;
                      medical_record_number?: string;
                    };
                    lab_order_details?: Array<{
                      id: string;
                      tests?: {
                        code?: string;
                        name?: string;
                      };
                    }>;
                  };
                  
                  const patientName = labOrder.patients 
                    ? `${labOrder.patients.first_name || ''} ${labOrder.patients.last_name || ''}`
                    : 'Paciente desconocido';
                  
                  const testCodes = labOrder.lab_order_details
                    ?.map(d => d.tests?.code)
                    .filter(Boolean)
                    .join(', ') || 'Sin pruebas';

                  return (
                    <Link
                      key={labOrder.id}
                      href={`/dashboard/lab/orders/${labOrder.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors touch-manipulation"
                    >
                      <div className={'w-10 h-10 sm:w-12 rounded-full flex items-center justify-center flex-shrink-0 ' + (labOrder.priority === 'urgent' ? 'bg-red-100' : 'bg-purple-100')}>
                        <FlaskConical className={'w-5 h-5 ' + (labOrder.priority === 'urgent' ? 'text-red-600' : 'text-purple-600')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {patientName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {testCodes}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {labOrder.priority === 'urgent' && (
                          <span className="badge badge-danger text-xs">Urgente</span>
                        )}
                        <span className={'badge text-xs ' + (labOrder.status === 'in_progress' ? 'badge-warning' : 'badge-info')}>
                          {labOrder.status === 'in_progress' ? 'En proceso' : 'Pendiente'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </Link>
                  );
                })}
                {pendingLabOrders.length > 5 && (
                  <Link 
                    href="/dashboard/lab/orders?status=pending"
                    className="block text-center py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Ver {pendingLabOrders.length - 5} más...
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <FlaskConical className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay exámenes pendientes para hoy</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent patients */}
        <div className="card">
          <div className="card-header flex items-center justify-between py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Pacientes Recientes</h2>
            <Link href="/dashboard/patients" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Ver todos
            </Link>
          </div>
          <div className="card-body py-2 sm:py-4">
            {recentPatients && recentPatients.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/dashboard/patients/${patient.id}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm flex-shrink-0">
                      {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        MRN: {patient.medical_record_number}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(patient.created_at).toLocaleDateString('es-MX')}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay pacientes registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent patients - Separate card below grid */}
      <div className="card">
        <div className="card-header flex items-center justify-between py-3 sm:py-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Pacientes Recientes</h2>
          <Link href="/dashboard/patients" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todos
          </Link>
        </div>
        <div className="card-body py-2 sm:py-4">
          {recentPatients && recentPatients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentPatients.slice(0, 6).map((patient) => (
                <Link
                  key={patient.id}
                  href={`/dashboard/patients/${patient.id}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm flex-shrink-0">
                    {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      MRN: {patient.medical_record_number}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(patient.created_at).toLocaleDateString('es-MX')}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No hay pacientes registrados</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      {(role === 'admin' || role === 'reception') && (
        <div className="card">
          <div className="card-header py-3 sm:py-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
          </div>
          <div className="card-body py-2 sm:py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <Link
                href="/dashboard/patients/new"
                className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
              >
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Nuevo Paciente</span>
              </Link>
              <Link
                href="/dashboard/appointments/new"
                className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
              >
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Agendar Cita</span>
              </Link>
              {(role === 'admin' || role === 'pharmacy') && (
                <Link
                  href="/dashboard/inventory"
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                >
                  <Pill className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Ver Inventario</span>
                </Link>
              )}
              {role === 'admin' && (
                <Link
                  href="/dashboard/billing"
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                >
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">Facturación</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
