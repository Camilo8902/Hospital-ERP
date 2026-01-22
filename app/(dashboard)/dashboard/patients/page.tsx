import { Suspense } from 'react';
import { getPatients } from '@/lib/actions/patients';
import { formatDate, calculateAge, formatPhone, getInitials } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Search, Filter, Download, Users as UsersIcon, ChevronRight } from 'lucide-react';

// Componente de carga
function PatientsSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1');
  const pageSize = 10;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pacientes</h1>
          <Suspense fallback={<p className="text-gray-500 mt-1">Cargando...</p>}>
            <PatientsCount query={query} />
          </Suspense>
        </div>
        <Link href="/dashboard/patients/new" className="btn-primary btn-md w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Paciente
        </Link>
      </div>

      {/* Search and filters */}
      <div className="card">
        <div className="card-body py-3 sm:py-4">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <form>
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar pacientes..."
                  className="input pl-10 w-full"
                />
              </form>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary btn-sm flex-1 sm:flex-none justify-center">
                <Filter className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Filtros</span>
              </button>
              <button type="button" className="btn-secondary btn-sm flex-1 sm:flex-none justify-center">
                <Download className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Patients list */}
      <Suspense fallback={<PatientsSkeleton />}>
        <PatientsList query={query} page={page} pageSize={pageSize} />
      </Suspense>
    </div>
  );
}

// Componente para contar pacientes
async function PatientsCount({ query }: { query: string }) {
  try {
    const patients = await getPatients();
    const filtered = query
      ? patients.filter(p =>
          p.first_name.toLowerCase().includes(query.toLowerCase()) ||
          p.last_name.toLowerCase().includes(query.toLowerCase()) ||
          p.medical_record_number.toLowerCase().includes(query.toLowerCase()) ||
          p.phone.includes(query)
        )
      : patients;

    return <p className="text-gray-500 text-sm">{filtered.length} pacientes registrados</p>;
  } catch (error) {
    return <p className="text-gray-500 text-sm">0 pacientes registrados</p>;
  }
}

// Componente para lista de pacientes con vista responsiva
async function PatientsList({ query, page, pageSize }: { query: string; page: number; pageSize: number }) {
  try {
    const allPatients = await getPatients();
    
    const filteredPatients = query
      ? allPatients.filter(p =>
          p.first_name.toLowerCase().includes(query.toLowerCase()) ||
          p.last_name.toLowerCase().includes(query.toLowerCase()) ||
          p.medical_record_number.toLowerCase().includes(query.toLowerCase()) ||
          p.phone.includes(query)
        )
      : allPatients;

    const offset = (page - 1) * pageSize;
    const patients = filteredPatients.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(filteredPatients.length / pageSize);

    return (
      <div className="card">
        {/* Vista de tabla para desktop */}
        <div className="hidden lg:block table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>MRN</th>
                <th>Edad</th>
                <th>Teléfono</th>
                <th>Tipo Sangre</th>
                <th>Alergias</th>
                <th>Registrado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="flex items-center gap-3 hover:text-primary-600"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                          {getInitials(`${patient.first_name} ${patient.last_name}`)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{patient.email || 'Sin email'}</p>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span className="font-mono text-sm">{patient.medical_record_number}</span>
                    </td>
                    <td>{calculateAge(patient.dob)} años</td>
                    <td>{formatPhone(patient.phone)}</td>
                    <td>
                      <span className="badge badge-gray">
                        {patient.blood_type || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {patient.allergies && patient.allergies.length > 0 ? (
                        <span className="badge badge-warning">
                          {patient.allergies.length}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Ninguna</span>
                      )}
                    </td>
                    <td className="text-gray-500 text-sm">
                      {formatDate(patient.created_at)}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/patients/${patient.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/dashboard/patients/${patient.id}/edit`}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    {query ? (
                      <>
                        <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No se encontraron pacientes para "{query}"</p>
                      </>
                    ) : (
                      <>
                        <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>No hay pacientes registrados aún</p>
                        <Link href="/dashboard/patients/new" className="text-primary-600 hover:text-primary-700">
                          Registrar el primer paciente
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Vista de tarjetas para móvil */}
        <div className="lg:hidden">
          {patients.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {patients.map((patient) => (
                <Link
                  key={patient.id}
                  href={`/dashboard/patients/${patient.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium flex-shrink-0">
                    {getInitials(`${patient.first_name} ${patient.last_name}`)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {patient.first_name} {patient.last_name}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-gray-500">MRN: {patient.medical_record_number}</span>
                      <span className="badge badge-gray text-xs">{patient.blood_type || 'N/A'}</span>
                      {patient.allergies && patient.allergies.length > 0 && (
                        <span className="badge badge-warning text-xs">{patient.allergies.length} алергии</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {query ? (
                <>
                  <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No se encontraron pacientes para "{query}"</p>
                </>
              ) : (
                <>
                  <UsersIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay pacientes registrados</p>
                  <Link href="/dashboard/patients/new" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
                    Registrar el primer paciente
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer flex flex-col sm:flex-row items-center justify-between gap-3 py-3">
            <p className="text-sm text-gray-500 order-2 sm:order-1">
              {offset + 1}-{Math.min((offset + pageSize), filteredPatients.length)} de {filteredPatients.length}
            </p>
            <div className="flex gap-2 order-1 sm:order-2 w-full sm:w-auto">
              {page > 1 && (
                <Link
                  href={`/dashboard/patients?q=${query}&page=${page - 1}`}
                  className="btn-secondary btn-sm flex-1 sm:flex-none justify-center"
                >
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/patients?q=${query}&page=${page + 1}`}
                  className="btn-secondary btn-sm flex-1 sm:flex-none justify-center"
                >
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading patients:', error);
    return (
      <div className="card p-6 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-100 mb-4">
          <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar pacientes</h3>
        <p className="text-gray-500 text-sm">
          No se pudieron cargar los pacientes. Por favor, intenta de nuevo.
        </p>
      </div>
    );
  }
}
