'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface ProgressAlertProps {
  patientId: string;
  planId: string;
  sessionsCompleted: number;
  sessionsAttended: number;
  lastPainLevel?: number;
  initialPainLevel?: number;
  onReviewPlan?: () => void;
  onContinue?: () => void;
  thresholdSessions?: number; // Default: 5
  noImprovementThreshold?: number; // Default: 3
}

interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ProgressAlert({
  patientId,
  planId,
  sessionsCompleted,
  sessionsAttended,
  lastPainLevel,
  initialPainLevel,
  onReviewPlan,
  onContinue,
  thresholdSessions = 5,
  noImprovementThreshold = 3,
}: ProgressAlertProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const newAlerts: Alert[] = [];

    // Calculate attendance rate
    const attendanceRate = sessionsCompleted > 0 
      ? (sessionsAttended / sessionsCompleted) * 100 
      : 100;

    // Alert 1: Low attendance rate
    if (attendanceRate < 80) {
      newAlerts.push({
        id: 'attendance',
        type: 'warning',
        title: 'Baja Asistencia',
        message: `El paciente ha asistido solo al ${Math.round(attendanceRate)}% de las sesiones programadas.`,
        action: {
          label: 'Contactar Paciente',
          onClick: () => console.log('Contact patient'),
        },
      });
    }

    // Alert 2: No improvement after N sessions
    if (initialPainLevel !== undefined && lastPainLevel !== undefined) {
      const painChange = initialPainLevel - lastPainLevel;
      
      if (sessionsCompleted >= noImprovementThreshold && painChange <= 0) {
        newAlerts.push({
          id: 'no-improvement',
          type: 'danger',
          title: 'Sin Mejora Significativa',
          message: `Después de ${sessionsCompleted} sesiones, no se observa mejora en el nivel de dolor. Considerar reevaluar el plan de tratamiento.`,
          action: onReviewPlan ? {
            label: 'Revisar Plan',
            onClick: onReviewPlan,
          } : undefined,
        });
      } else if (sessionsCompleted >= noImprovementThreshold && painChange > 0 && painChange < 2) {
        newAlerts.push({
          id: 'slow-progress',
          type: 'warning',
          title: 'Progreso Lento',
          message: `La mejora es menor a 2 puntos en la escala VAS después de ${sessionsCompleted} sesiones.`,
          action: onReviewPlan ? {
            label: 'Evaluar Ajuste',
            onClick: onReviewPlan,
          } : undefined,
        });
      }
    }

    // Alert 3: Approaching treatment completion
    if (sessionsCompleted === thresholdSessions - 1) {
      newAlerts.push({
        id: 'near-completion',
        type: 'info',
        title: 'Cerca del Límite de Sesiones',
        message: `El paciente está próximo a completar ${thresholdSessions} sesiones. Evaluar si necesita continuar el tratamiento.`,
        action: onReviewPlan ? {
          label: 'Evaluar Continuidad',
          onClick: onReviewPlan,
        } : undefined,
      });
    }

    // Alert 4: Excellent progress
    if (initialPainLevel !== undefined && lastPainLevel !== undefined) {
      const painReduction = ((initialPainLevel - lastPainLevel) / initialPainLevel) * 100;
      
      if (painReduction >= 50 && sessionsCompleted >= 3) {
        newAlerts.push({
          id: 'excellent-progress',
          type: 'success',
          title: 'Excelente Progreso',
          message: `El paciente ha reducido su dolor en un ${Math.round(painReduction)}%. Considerar planificar el alta.`,
          action: onContinue ? {
            label: 'Planificar Alta',
            onClick: onContinue,
          } : undefined,
        });
      }
    }

    // Alert 5: Plan about to expire (if there's a planned end date)
    if (sessionsCompleted >= sessionsAttended && sessionsAttended > 0) {
      newAlerts.push({
        id: 'sessions-exhausted',
        type: 'warning',
        title: 'Sesiones Agotadas',
        message: 'El paciente ha completado todas las sesiones programadas.',
        action: onReviewPlan ? {
          label: 'Programar Más Sesiones',
          onClick: onReviewPlan,
        } : undefined,
      });
    }

    setAlerts(newAlerts);
  }, [
    sessionsCompleted,
    sessionsAttended,
    initialPainLevel,
    lastPainLevel,
    onReviewPlan,
    onContinue,
    thresholdSessions,
    noImprovementThreshold,
    patientId,
    planId,
  ]);

  if (alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'danger':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertColors = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border ${getAlertColors(alert.type)}`}
        >
          <div className="flex items-start gap-3">
            {getAlertIcon(alert.type)}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{alert.title}</h4>
                <span className="text-xs opacity-75">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm mt-1">{alert.message}</p>
              {alert.action && (
                <button
                  onClick={alert.action.onClick}
                  className={`mt-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    alert.type === 'danger'
                      ? 'bg-red-100 hover:bg-red-200 text-red-700'
                      : alert.type === 'success'
                      ? 'bg-green-100 hover:bg-green-200 text-green-700'
                      : alert.type === 'warning'
                      ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                  }`}
                >
                  {alert.action.label}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact version for dashboard cards
export function ProgressAlertBadge({
  sessionsCompleted,
  sessionsAttended,
  initialPainLevel,
  lastPainLevel,
}: {
  sessionsCompleted: number;
  sessionsAttended: number;
  initialPainLevel?: number;
  lastPainLevel?: number;
}) {
  const attendanceRate = sessionsCompleted > 0 
    ? (sessionsAttended / sessionsCompleted) * 100 
    : 100;
  
  const painChange = (initialPainLevel ?? 0) - (lastPainLevel ?? 0);
  
  let status: 'good' | 'warning' | 'danger' = 'good';
  let message = '';

  if (attendanceRate < 80) {
    status = 'warning';
    message = 'Baja asistencia';
  } else if (initialPainLevel !== undefined && lastPainLevel !== undefined) {
    if (sessionsCompleted >= 3 && painChange <= 0) {
      status = 'danger';
      message = 'Sin mejora';
    } else if (sessionsCompleted >= 3 && painChange < 2) {
      status = 'warning';
      message = 'Progreso lento';
    }
  }

  if (status === 'good' && message === '') {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
      status === 'good'
        ? 'bg-green-100 text-green-700'
        : status === 'warning'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700'
    }`}>
      {status === 'warning' ? (
        <Clock className="w-3 h-3" />
      ) : (
        <AlertTriangle className="w-3 h-3" />
      )}
      {message}
    </div>
  );
}
