import { Suspense } from 'react';
import { getPatients } from '@/lib/actions/patients';
import { formatDate, calculateAge, formatPhone, getInitials } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Search, Filter, Download, Users as UsersIcon } from 'lucide-react';

// Componente de carga
function PatientsSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="table-container">
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
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </td>
                <td><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                <td><div className="h-4 w-8 bg-gray-200 rounded"></div></td>
                <td><div className="h-4 w-24 bg-gray-200 rounded"></div></td>
                <td><div className="h-6 w-12 bg-gray-200 rounded"></div></td>
                <td><div className="h-6 w-16 bg-gray-200 rounded"></div></td>
                <td><div className="h-4 w-20 bg-gray-200 rounded"></div></td>
                <td><div className="h-6 w-12 bg-gray-200 rounded"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <Suspense fallback={<p className="text-gray-500 mt-1">Cargando...</p>}>
            <PatientsCount query={query} />
          </Suspense>
        </div>
        <Link href="/dashboard/patients/new" className="btn-primary btn-md">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Paciente
        </Link>
      </div>

      {/* Search and filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <form>
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar por nombre, MRN o teléfono..."
                  className="input pl-10"
                />
              </form>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary btn-md">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </button>
              <button type="button" className="btn-secondary btn-md">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Patients table */}
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

    return <p className="text-gray-500 mt-1">{filtered.length} pacientes registrados</p>;
  } catch (error) {
    return <p className="text-gray-500 mt-1">0 pacientes registrados</p>;
  }
}

// Componente para lista de pacientes
async function PatientsList({ query, page, pageSize }: { query: string; page: number; pageSize: number }) {
  try {
    const allPatients = await getPatients();
    
    // Filtrar pacientes
    const filteredPatients = query
      ? allPatients.filter(p =>
          p.first_name.toLowerCase().includes(query.toLowerCase()) ||
          p.last_name.toLowerCase().includes(query.toLowerCase()) ||
          p.medical_record_number.toLowerCase().includes(query.toLowerCase()) ||
          p.phone.includes(query)
        )
      : allPatients;

    // Paginar
    const offset = (page - 1) * pageSize;
    const patients = filteredPatients.slice(offset, offset + pageSize);
    const totalPages = Math.ceil(filteredPatients.length / pageSize);

    return (
      <div className="card">
        <div className="table-container">
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
                          {patient.allergies.length} alergias
                        </span>
                      ) : (
                        <span className="text-gray-400">Ninguna</span>
                      )}
                    </td>
                    <td className="text-gray-500">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {offset + 1} - {Math.min((offset + pageSize), filteredPatients.length)} de {filteredPatients.length}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/patients?q=${query}&page=${page - 1}`}
                  className="btn-secondary btn-sm"
                >
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/patients?q=${query}&page=${page + 1}`}
                  className="btn-secondary btn-sm"
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
      <div className="card p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <UsersIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar pacientes</h3>
        <p className="text-gray-500">
          No se pudieron cargar los pacientes. Por favor, intenta de nuevo.
        </p>
      </div>
    );
  }
}
