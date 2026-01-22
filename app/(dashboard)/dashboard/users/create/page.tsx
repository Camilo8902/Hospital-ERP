import UserForm from '@/components/users/UserForm';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Crear Usuario - MediCore ERP',
  description: 'Crear nuevo usuario en MediCore ERP',
};

export default function CreateUserPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Crear Nuevo Usuario</h1>
          <p className="text-gray-500 mt-1">
            Ingresa los datos del nuevo usuario del sistema
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Informacion Importante</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>El usuario recibira un email de confirmacion si el SMTP esta configurado</li>
              <li>La contrasena debe tener al menos 6 caracteres</li>
              <li>El rol determina las funciones que podra realizar el usuario</li>
              <li>Puedes activar o desactivar usuarios despues de crearlos</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Datos del Usuario</h2>
          <p className="text-sm text-gray-500 mt-1">
            Completa todos los campos marcados con asterisco (*)
          </p>
        </div>
        <div className="card-body">
          <UserForm />
        </div>
      </div>
    </div>
  );
}
