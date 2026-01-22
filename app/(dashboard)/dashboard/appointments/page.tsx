import { getAppointments } from '@/lib/actions/appointments';
import AppointmentCard from './AppointmentCard';
import AppointmentListItem from './AppointmentListItem';
import CalendarFilter from './CalendarFilter';
import ViewToggle from './ViewToggle';
import SearchInput from './SearchInput';
import Link from 'next/link';
import { Plus, Calendar, Clock, CheckCircle2, XCircle, Play } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: { status?: string; date?: string; view?: string; search?: string };
}) {
  const status = searchParams.status || 'all';
  const dateFilter = searchParams.date || 'upcoming';
  const view = searchParams.view || 'grid';
  const searchTerm = searchParams.search || '';
  
  const specificDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isSpecificDate = specificDateRegex.test(dateFilter);
  const specificDate = isSpecificDate ? dateFilter : undefined;

  const appointments = await getAppointments(dateFilter, status, specificDate);

  let filteredAppointments = appointments;
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    filteredAppointments = appointments.filter(apt => {
      const patientName = `${apt.patient_first_name || ''} ${apt.patient_last_name || ''}`.toLowerCase();
      const doctorName = (apt.doctor_full_name || '').toLowerCase();
      const reason = (apt.reason || '').toLowerCase();
      const departmentName = (apt.department_name || '').toLowerCase();
      const roomNumber = (apt.room_number || '').toLowerCase();
      const appointmentType = (apt.appointment_type || '').toLowerCase();
      
      return (
        patientName.includes(searchLower) ||
        doctorName.includes(searchLower) ||
        reason.includes(searchLower) ||
        departmentName.includes(searchLower) ||
        roomNumber.includes(searchLower) ||
        appointmentType.includes(searchLower)
      );
    });
  }

  const stats = {
    scheduled: filteredAppointments?.filter(a => a.status === 'scheduled').length || 0,
    in_progress: filteredAppointments?.filter(a => a.status === 'in_progress').length || 0,
    completed: filteredAppointments?.filter(a => a.status === 'completed').length || 0,
    cancelled: filteredAppointments?.filter(a => a.status === 'cancelled').length || 0,
    total: filteredAppointments?.length || 0,
  };

  const formatSelectedDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const statCards = [
    { key: 'total', icon: Calendar, color: 'blue', label: 'Total' },
    { key: 'in_progress', icon: Play, color: 'amber', label: 'En Progreso' },
    { key: 'completed', icon: CheckCircle2, color: 'green', label: 'Completadas' },
    { key: 'cancelled', icon: XCircle, color: 'red', label: 'Canceladas' },
    { key: 'scheduled', icon: Clock, color: 'primary', label: 'Pendientes' },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    primary: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-primary-200' },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Citas Médicas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestiona y visualiza todas las citas</p>
        </div>
        <Link href="/dashboard/appointments/new" className="btn-primary btn-md w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Link>
      </div>

      {/* Stats overview - Grid responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colors = colorClasses[stat.color];
          return (
            <div key={stat.key} className={`card p-3 sm:p-4 ${colors.bg} ${colors.border}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-${stat.color}-500 flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xl sm:text-2xl font-bold ${colors.text}`}>{stats[stat.key as keyof typeof stats]}</p>
                  <p className={`text-xs ${colors.text} font-medium truncate`}>{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body py-3 sm:py-4">
          <div className="space-y-3">
            {/* Search */}
            <SearchInput 
              currentView={view}
              currentDate={dateFilter}
              status={status}
            />

            {/* Date tabs */}
            <div className="flex overflow-x-auto gap-1 bg-gray-100 p-1 rounded-lg scrollbar-thin">
              {[
                { value: 'today', label: 'Hoy' },
                { value: 'week', label: 'Esta semana' },
                { value: 'upcoming', label: 'Próximas' },
                { value: 'all', label: 'Todas' },
              ].map((filter) => (
                <Link
                  key={filter.value}
                  href={`/dashboard/appointments?date=${filter.value}&status=${status}&view=${view}` + (searchTerm ? `&search=${searchTerm}` : '')}
                  className={`px-3 py-2 text-xs sm:text-sm rounded-md transition-all whitespace-nowrap ${
                    dateFilter === filter.value && !isSpecificDate
                      ? 'bg-white text-gray-900 shadow-sm font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            {/* Status filters */}
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'scheduled', label: 'Programadas' },
                { value: 'in_progress', label: 'En proceso' },
                { value: 'completed', label: 'Completadas' },
                { value: 'cancelled', label: 'Canceladas' },
              ].map((filter) => (
                <Link
                  key={filter.value}
                  href={`/dashboard/appointments?date=${dateFilter}&status=${filter.value}&view=${view}` + (searchTerm ? `&search=${searchTerm}` : '')}
                  className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all ${
                    status === filter.value
                      ? 'bg-white text-gray-900 shadow-sm font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter.label}
                </Link>
              ))}
            </div>

            {/* Selected date info */}
            {isSpecificDate && (
              <div className="p-2.5 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-700">
                  <strong>Mostrando para:</strong> {formatSelectedDate(specificDate)}
                </p>
              </div>
            )}

            {/* Search results info */}
            {searchTerm && (
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Resultados para:</strong> "{searchTerm}" ({filteredAppointments.length} citas)
                </p>
              </div>
            )}

            {/* Calendar and View toggle row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center sm:justify-between pt-2">
              <CalendarFilter 
                currentDate={specificDate}
                currentFilter={dateFilter}
                status={status}
                searchTerm={searchTerm}
              />
              <ViewToggle 
                currentView={view}
                currentDate={dateFilter}
                status={status}
                searchTerm={searchTerm}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Appointments display */}
      {filteredAppointments && filteredAppointments.length > 0 ? (
        <>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment as any} 
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((appointment) => (
                <AppointmentListItem 
                  key={appointment.id} 
                  appointment={appointment as any} 
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="card p-8 sm:p-16 text-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron resultados' : 'No hay citas'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm sm:text-base">
            {searchTerm 
              ? `No se encontraron citas que coincidan con "${searchTerm}".`
              : isSpecificDate
              ? `No hay citas para el ${formatSelectedDate(specificDate)}.`
              : dateFilter === 'today'
              ? 'No hay citas para hoy.'
              : 'No se encontraron citas con los filtros seleccionados.'}
          </p>
          {searchTerm ? (
            <Link 
              href={`/dashboard/appointments?date=${dateFilter}&status=${status}&view=${view}`}
              className="btn-secondary btn-md inline-flex"
            >
              Limpiar búsqueda
            </Link>
          ) : (
            <Link href="/dashboard/appointments/new" className="btn-primary btn-md inline-flex">
              <Plus className="w-4 h-4 mr-2" />
              Agendar Nueva Cita
            </Link>
          )}
        </div>
      )}

      {/* Quick legend */}
      <div className="card">
        <div className="card-body py-3">
          <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Guía de estados</h4>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {[
              { color: 'bg-blue-500', label: 'Programada' },
              { color: 'bg-amber-500', label: 'En Progreso' },
              { color: 'bg-green-500', label: 'Completada' },
              { color: 'bg-red-500', label: 'Cancelada' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 sm:gap-2">
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${item.color}`} />
                <span className="text-xs sm:text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
