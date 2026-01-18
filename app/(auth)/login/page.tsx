import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - MediCore ERP',
  description: 'Inicia sesión en MediCore ERP',
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MediCore ERP</h1>
          <p className="mt-2 text-gray-600">Sistema de Gestión Hospitalaria</p>
        </div>

        {/* Formulario de Login */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Iniciar Sesión</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>
          <div className="card-body">
            <LoginForm />
          </div>
        </div>

        {/* Información de acceso */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Credenciales de prueba:</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p><span className="font-semibold">Admin:</span> admin@medicore.com / admin123</p>
            <p><span className="font-semibold">Médico:</span> doctor@medicore.com / doctor123</p>
            <p><span className="font-semibold">Recepción:</span> recepcion@medicore.com / recepcion123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
