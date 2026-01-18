'use client';

import { useState } from 'react';
import { updateUserPassword } from '@/lib/actions/users';
import { AlertTriangle, Key, Eye, EyeOff, Save } from 'lucide-react';

interface PasswordUpdateFormProps {
  userId: string;
  userName: string;
}

export default function PasswordUpdateForm({ userId, userName }: PasswordUpdateFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validar longitud mínima
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const result = await updateUserPassword(userId, password);

      if (result.success) {
        setSuccess('Contraseña actualizada exitosamente');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Error al actualizar contraseña');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Actualizar la contraseña para el usuario: <span className="font-medium">{userName}</span>
        </p>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Success message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Éxito</p>
                <p className="text-sm text-green-600">{success}</p>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label htmlFor="new_password" className="label mb-1.5">
              Nueva Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative max-w-md">
              <input
                type={showPassword ? 'text' : 'password'}
                id="new_password"
                name="new_password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm_password" className="label mb-1.5">
              Confirmar Contraseña <span className="text-red-500">*</span>
            </label>
            <div className="relative max-w-md">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm_password"
                name="confirm_password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pr-10"
                placeholder="Repite la contraseña"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">Las contraseñas no coinciden</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setPassword('');
                setConfirmPassword('');
                setError(null);
                setSuccess(null);
              }}
              className="btn-secondary"
              disabled={loading}
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={loading || password.length < 6}
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
                  Actualizando...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Actualizar Contraseña
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
