'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserProfile, 
  deleteUser, 
  toggleUserStatus 
} from '@/lib/actions/users';
import { 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';

interface UserListProps {
  users: UserProfile[];
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  doctor: 'Médico',
  nurse: 'Enfermero/a',
  reception: 'Recepción',
  pharmacy: 'Farmacia',
};

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  doctor: 'bg-blue-100 text-blue-800',
  nurse: 'bg-green-100 text-green-800',
  reception: 'bg-yellow-100 text-yellow-800',
  pharmacy: 'bg-orange-100 text-orange-800',
};

export default function UserList({ users }: UserListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const result = await deleteUser(id);
      
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'Error al eliminar usuario');
      }
    } catch (err) {
      setError('Error inesperado al eliminar usuario');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    setError(null);

    try {
      const result = await toggleUserStatus(id, !currentStatus);
      
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'Error al cambiar estado');
      }
    } catch (err) {
      setError('Error inesperado al cambiar estado');
    } finally {
      setTogglingId(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <UserCheck className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios registrados</h3>
        <p className="text-gray-500 mb-4">Comienza creando tu primer usuario</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
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
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                    {roleLabels[user.role] || user.role}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <p className="text-sm text-gray-900">{user.specialty || '-'}</p>
                </td>
                <td className="py-4 px-6">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.is_active)}
                    disabled={togglingId === user.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    } ${togglingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {user.is_active ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        Activo
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        Inactivo
                      </>
                    )}
                  </button>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/users/${user.id}`)}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Editar usuario"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.full_name)}
                      disabled={deletingId === user.id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with count */}
      <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
        <p className="text-sm text-gray-600">
          Total de usuarios: <span className="font-medium">{users.length}</span>
        </p>
      </div>
    </div>
  );
}
