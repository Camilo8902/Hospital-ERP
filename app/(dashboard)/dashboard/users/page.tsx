import { Suspense } from 'react';
import { getUsers } from '@/lib/actions/users';
import UserList from '@/components/users/UserList';
import { Plus, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';

// Componente de carga para la lista
function UserListSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Especialidad
              </th>
              <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="text-right py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 w-48 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex justify-end gap-2">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administración de Usuarios</h1>
          <p className="text-gray-500 mt-1">
            Gestiona los usuarios y sus roles en el sistema
          </p>
        </div>
        <Link
          href="/dashboard/users/create"
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UsersIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Usuarios</p>
              <Suspense fallback={<p className="text-2xl font-bold text-gray-900">-</p>}>
                <UsersCount />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <Suspense fallback={<UserListSkeleton />}>
        <UsersList />
      </Suspense>
    </div>
  );
}

// Componente para contar usuarios
async function UsersCount() {
  try {
    const users = await getUsers();
    return <p className="text-2xl font-bold text-gray-900">{users.length}</p>;
  } catch {
    return <p className="text-2xl font-bold text-gray-900">0</p>;
  }
}

// Componente para lista de usuarios
async function UsersList() {
  try {
    const users = await getUsers();
    return <UserList users={users} />;
  } catch (error) {
    return (
      <div className="card p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <UsersIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar usuarios</h3>
        <p className="text-gray-500">
          No se pudieron cargar los usuarios. Por favor, verifica tu conexión e intenta de nuevo.
        </p>
      </div>
    );
  }
}
