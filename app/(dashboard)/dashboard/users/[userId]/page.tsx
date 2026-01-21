import { notFound } from 'next/navigation';
import { getUserById } from '@/lib/actions/users';
import UserForm from '@/components/users/UserForm';
import PasswordUpdateForm from '@/components/users/PasswordUpdateForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: { userId: string };
}

export async function generateMetadata({ params }: PageProps) {
  const user = await getUserById(params.userId);
  return {
    title: user ? `Editar ${user.full_name} - MediCore ERP` : 'Editar Usuario - MediCore ERP',
  };
}

export default async function EditUserPage({ params }: PageProps) {
  const user = await getUserById(params.userId);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/users"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Usuario</h1>
          <p className="text-gray-500 mt-1">
            Modifica los datos del usuario: {user.full_name}
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-lg font-medium text-primary-700">
              {user.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{user.full_name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="ml-auto">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              user.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {user.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Datos del Usuario</h2>
          <p className="text-sm text-gray-500 mt-1">
            Modifica los campos necesarios
          </p>
        </div>
        <div className="card-body">
          <UserForm user={user} isEditing={true} />
        </div>
      </div>

      <PasswordUpdateForm userId={user.id} userName={user.full_name} />
    </div>
  );
}
