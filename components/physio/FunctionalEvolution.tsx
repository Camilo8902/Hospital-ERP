'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, Calendar } from 'lucide-react';

interface SessionData {
  id: string;
  session_number: number;
  session_date: string;
  vas_pain?: number;
  rom_flexion?: number;
  rom_extension?: number;
  strength_grade?: number;
  notes?: string;
}

interface FunctionalEvolutionProps {
  sessions: SessionData[];
  currentSessionId?: string;
}

export function FunctionalEvolution({ sessions, currentSessionId }: FunctionalEvolutionProps) {
  // Sort sessions by date
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => 
      new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );
  }, [sessions]);

  // Calculate improvements
  const stats = useMemo(() => {
    if (sortedSessions.length < 2) return null;

    const first = sortedSessions[0];
    const last = sortedSessions[sortedSessions.length - 1];
    const previous = sortedSessions.length > 1 
      ? sortedSessions[sortedSessions.length - 2] 
      : null;

    // Pain improvement
    const painChange = first.vas_pain && last.vas_pain 
      ? first.vas_pain - last.vas_pain 
      : 0;
    const painImprovement = painChange > 0;

    // ROM improvement (using flexion as example)
    const romChange = first.rom_flexion && last.rom_flexion
      ? last.rom_flexion - first.rom_flexion
      : 0;
    const romImprovement = romChange > 0;

    // Strength improvement
    const strengthChange = first.strength_grade && last.strength_grade
      ? last.strength_grade - first.strength_grade
      : 0;
    const strengthImprovement = strengthChange > 0;

    // Session count
    const sessionsCompleted = sortedSessions.length;

    return {
      first,
      last,
      previous,
      painChange,
      painImprovement,
      romChange,
      romImprovement,
      strengthChange,
      strengthImprovement,
      sessionsCompleted,
    };
  }, [sortedSessions]);

  if (!stats) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Se necesitan al menos 2 sesiones para mostrar evolución</p>
        </div>
      </div>
    );
  }

  const getTrendIcon = (isPositive: boolean, change: number) => {
    if (change === 0) return <Minus className="w-5 h-5 text-gray-400" />;
    return isPositive 
      ? <TrendingUp className="w-5 h-5 text-green-500" /> 
      : <TrendingDown className="w-5 h-5 text-red-500" />;
  };

  const getTrendColor = (isPositive: boolean, change: number) => {
    if (change === 0) return 'text-gray-500';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-500">Sesiones Completadas</p>
            <p className="text-2xl font-bold text-gray-900">{stats.sessionsCompleted}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dolor (VAS)</p>
                <p className={`text-xl font-bold ${getTrendColor(stats.painImprovement, stats.painChange)}`}>
                  {stats.last.vas_pain || '-'} → {stats.first.vas_pain || '-'}
                </p>
              </div>
              {getTrendIcon(stats.painImprovement, stats.painChange)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {stats.painChange > 0 ? `Mejora de ${stats.painChange} puntos` : stats.painChange < 0 ? `Empeoramiento de ${Math.abs(stats.painChange)} puntos` : 'Sin cambios'}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">ROM Flexión</p>
                <p className={`text-xl font-bold ${getTrendColor(stats.romImprovement, stats.romChange)}`}>
                  {stats.last.rom_flexion || 0}° → {stats.first.rom_flexion || 0}°
                </p>
              </div>
              {getTrendIcon(stats.romImprovement, stats.romChange)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {stats.romChange > 0 ? `Mejora de ${stats.romChange}°` : stats.romChange < 0 ? `Pérdida de ${Math.abs(stats.romChange)}°` : 'Sin cambios'}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Fuerza Muscular</p>
                <p className={`text-xl font-bold ${getTrendColor(stats.strengthImprovement, stats.strengthChange)}`}>
                  {stats.last.strength_grade || 0} → {stats.first.strength_grade || 0}
                </p>
              </div>
              {getTrendIcon(stats.strengthImprovement, stats.strengthChange)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {stats.strengthChange > 0 ? `Mejora de ${stats.strengthChange} grados` : stats.strengthChange < 0 ? `Pérdida de ${Math.abs(stats.strengthChange)} grados` : 'Sin cambios'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Progreso de Sesiones</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {sortedSessions.map((session, index) => (
              <div 
                key={session.id}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  session.id === currentSessionId 
                    ? 'bg-purple-50 border border-purple-200' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-medium text-sm">
                  {session.session_number}
                </div>
                <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>{new Date(session.session_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Dolor:</span>
                    <span className={`font-medium ${
                      session.vas_pain && session.vas_pain <= 3 ? 'text-green-600' :
                      session.vas_pain && session.vas_pain <= 6 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {session.vas_pain || '-'}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">ROM:</span>
                    <span className="font-medium">{session.rom_flexion || 0}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Fuerza:</span>
                    <span className={`font-medium ${
                      session.strength_grade && session.strength_grade >= 4 ? 'text-green-600' :
                      session.strength_grade && session.strength_grade >= 3 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {session.strength_grade || 0}/5
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <h3 className="font-semibold text-blue-900 mb-2">Análisis de Progreso</h3>
          <ul className="space-y-2 text-sm text-blue-700">
            {stats.painImprovement && stats.painChange > 2 && (
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Excelente reducción del dolor ({stats.painChange} puntos)
              </li>
            )}
            {!stats.painImprovement && stats.painChange < -2 && (
              <li className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                El dolor ha aumentado, considerar ajustar el tratamiento
              </li>
            )}
            {stats.romImprovement && stats.romChange > 10 && (
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Mejora significativa en el rango de movimiento ({stats.romChange}°)
              </li>
            )}
            {stats.strengthImprovement && stats.strengthChange >= 1 && (
              <li className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Recuperación de fuerza muscular ({stats.strengthChange} grado(s))
              </li>
            )}
            {stats.sessionsCompleted >= 5 && !stats.painImprovement && !stats.romImprovement && !stats.strengthImprovement && (
              <li className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                Sin mejora significativa después de 5 sesiones, evaluar cambio de estrategia
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
