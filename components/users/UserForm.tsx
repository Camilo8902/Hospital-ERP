'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser, updateUser, UserRole, UserProfile } from '@/lib/actions/users';
import { AlertTriangle, ArrowLeft, Save } from 'lucide-react';

interface UserFormProps {
  user?: UserProfile;
  isEditing?: boolean;
}

const roleOptions = [
  { value: 'admin', label: 'Administrador', description: 'Acceso completo al sistema' },
  { value: 'doctor', label: 'Médico', description: 'Historia clínica, citas, recetas' },
  { value: 'nurse', label: 'Enfermero/a', description: 'Vista de pacientes, citas' },
  { value: 'reception', label: 'Recepción', description: 'Gestión de pacientes y citas' },
  { value: 'pharmacy', label: 'Farmacia', description: 'Inventario y dispensación' },
];

export default function UserForm({ user, isEditing = false }: UserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      let result;

      if (isEditing && user) {
        result = await updateUser(user.id, formData);
      } else {
        result = await createUser(formData);
      }

      if (result.success) {
        router.push('/dashboard/users');
        router.refresh();
      } else {
        setError(result.error || 'Error al guardar usuario');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label htmlFor="full_name" className="label mb-1.5">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            defaultValue={user?.full_name || ''}
            className="input"
            placeholder="Juan Pérez García"
            required
            disabled={loading}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label mb-1.5">
            Correo Electrónico <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={user?.email || ''}
            className="input"
            placeholder="juan.perez@medicore.com"
            required
            disabled={loading || isEditing}
            {...(isEditing ? {} : { pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}' })}
          />
          {isEditing && (
            <p className="mt-1 text-xs text-gray-500">
              El email no se puede modificar después de crear el usuario
            </p>
          )}
        </div>

        {/* Password - Only for new users */}
        {!isEditing && (
          <div>
            <label htmlFor="password" className="label mb-1.5">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="input"
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              disabled={loading}
            />
          </div>
        )}

        {/* Role */}
        <div>
          <label htmlFor="role" className="label mb-1.5">
            Rol <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            name="role"
            defaultValue={user?.role || 'reception'}
            className="input"
            required
            disabled={loading}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {roleOptions.find((o) => o.value === (user?.role || 'reception'))?.description}
          </p>
        </div>

        {/* Status - Only for editing */}
        {isEditing && (
          <div>
            <label className="label mb-1.5">Estado</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  value="true"
                  defaultChecked={user?.is_active !== false}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">Activo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  value="false"
                  defaultChecked={user?.is_active === false}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">Inactivo</span>
              </label>
            </div>
          </div>
        )}

        {/* Specialty */}
        <div>
          <label htmlFor="specialty" className="label mb-1.5">
            Especialidad
          </label>
          <input
            type="text"
            id="specialty"
            name="specialty"
            defaultValue={user?.specialty || ''}
            className="input"
            placeholder="Cardiología, Medicina General, etc."
            disabled={loading}
          />
        </div>

        {/* License Number */}
        <div>
          <label htmlFor="license_number" className="label mb-1.5">
            Número de Cédula
          </label>
          <input
            type="text"
            id="license_number"
            name="license_number"
            defaultValue={user?.license_number || ''}
            className="input"
            placeholder="12345678"
            disabled={loading}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="label mb-1.5">
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={user?.phone || ''}
            className="input max-w-xs"
            placeholder="+52 555 123 4567"
            disabled={loading}
          />
        </div>
      </div>

      {/* Role descriptions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Descripción de Roles</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {roleOptions.map((option) => (
            <div key={option.value} className="text-sm">
              <span className="font-medium text-gray-700">{option.label}:</span>{' '}
              <span className="text-gray-500">{option.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Guardando...
            </span>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
