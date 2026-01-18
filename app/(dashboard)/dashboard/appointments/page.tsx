import { getAppointments } from '@/lib/actions/appointments';
import AppointmentCard from './AppointmentCard';
import AppointmentListItem from './AppointmentListItem';
import CalendarFilter from './CalendarFilter';
import ViewToggle from './ViewToggle';
import SearchInput from './SearchInput';
import Link from 'next/link';
import { Plus, Calendar, Clock, CheckCircle2, XCircle, Play } from 'lucide-react';

// Forzar que siempre obtenga datos frescos (sin caché)
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
  
  // Verificar si es una fecha específica (formato YYYY-MM-DD)
  const specificDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const isSpecificDate = specificDateRegex.test(dateFilter);
  const specificDate = isSpecificDate ? dateFilter : undefined;

  // Usar el cliente admin para obtener citas
  const appointments = await getAppointments(dateFilter, status, specificDate);

  // Aplicar filtro de búsqueda si existe
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

  // Contadores para estadísticas
  const stats = {
    scheduled: filteredAppointments?.filter(a => a.status === 'scheduled').length || 0,
    in_progress: filteredAppointments?.filter(a => a.status === 'in_progress').length || 0,
    completed: filteredAppointments?.filter(a => a.status === 'completed').length || 0,
    cancelled: filteredAppointments?.filter(a => a.status === 'cancelled').length || 0,
    total: filteredAppointments?.length || 0,
  };

  const statusLabels: Record<string, string> = {
    scheduled: 'Programadas',
    in_progress: 'En Progreso',
    completed: 'Completadas',
    cancelled: 'Canceladas',
    no_show: 'No se presentó',
  };

  const dateLabels: Record<string, string> = {
    today: 'Hoy',
    week: 'Esta semana',
    upcoming: 'Próximas',
    all: 'Todas',
  };

  const formatSelectedDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citas Médicas</h1>
          <p className="text-gray-500 mt-1">Gestiona y visualiza todas las citas programadas</p>
        </div>
        <Link href="/dashboard/appointments/new" className="btn-primary btn-md">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Cita
        </Link>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              <p className="text-xs text-blue-600 font-medium">Total Citas</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              <Play className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.in_progress}</p>
              <p className="text-xs text-amber-600 font-medium">En Progreso</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              <p className="text-xs text-green-600 font-medium">Completadas</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.cancelled}</p>
              <p className="text-xs text-red-600 font-medium">Canceladas</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-700">{stats.scheduled}</p>
              <p className="text-xs text-primary-600 font-medium">Pendientes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Date filters */}
            <div className="flex flex-wrap gap-4">
              {/* Search input */}
              <SearchInput 
                currentView={view}
                currentDate={dateFilter}
                status={status}
              />

              {/* Date tabs */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Período</label>
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  {[
                    { value: 'today', label: 'Hoy' },
                    { value: 'week', label: 'Esta semana' },
                    { value: 'upcoming', label: 'Próximas' },
                    { value: 'all', label: 'Todas' },
                  ].map((filter) => (
                    <Link
                      key={filter.value}
                      href={`/dashboard/appointments?date=${filter.value}&status=${status}&view=${view}` + (searchTerm ? `&search=${searchTerm}` : '')}
                      className={`px-4 py-2 text-sm rounded-md transition-all ${
                        dateFilter === filter.value && !isSpecificDate
                          ? 'bg-white text-gray-900 shadow-sm font-medium'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {filter.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Calendar filter */}
              <CalendarFilter 
                currentDate={specificDate}
                currentFilter={dateFilter}
                status={status}
                searchTerm={searchTerm}
              />
            </div>

            {/* View Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Vista</label>
              <ViewToggle 
                currentView={view}
                currentDate={dateFilter}
                status={status}
                searchTerm={searchTerm}
              />
            </div>
          </div>

          {/* Status filters */}
          <div className="flex flex-col gap-2 mt-4">
            <label className="text-sm font-medium text-gray-700">Estado</label>
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
                  className={`px-4 py-2 text-sm rounded-md transition-all ${
                    status === filter.value
                      ? 'bg-white text-gray-900 shadow-sm font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Selected date info */}
          {isSpecificDate && (
            <div className="mt-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm text-primary-700">
                <strong>Mostrando citas para:</strong> {formatSelectedDate(specificDate)}
              </p>
            </div>
          )}

          {/* Search results info */}
          {searchTerm && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Resultados para:</strong> "{searchTerm}" ({filteredAppointments.length} citas encontradas)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Appointments display */}
      {filteredAppointments && filteredAppointments.length > 0 ? (
        <>
          {view === 'grid' ? (
            /* Vista de tarjetas */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments.map((appointment) => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment as any} 
                />
              ))}
            </div>
          ) : (
            /* Vista de lista */
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
        <div className="card p-16 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron resultados' : 'No hay citas'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchTerm 
              ? `No se encontraron citas que coincidan con "${searchTerm}".`
              : isSpecificDate
              ? `No hay citas programadas para el ${formatSelectedDate(specificDate)}.`
              : dateFilter === 'today'
              ? 'No hay citas programadas para el día de hoy.'
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
        <div className="card-body">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Guía de estados</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Programada - Cita pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-600">En Progreso - Cita en curso</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Completada - Cita finalizada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-600">Cancelada - Cita anulada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
