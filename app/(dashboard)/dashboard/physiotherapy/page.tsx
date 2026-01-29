'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  Calendar,
  FileText,
  Users,
  Activity,
  ArrowRight,
  Clock,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

const moduleCards = [
  {
    title: 'Evaluaciones',
    description: 'Valoración inicial y seguimiento de pacientes',
    icon: Activity,
    href: '/dashboard/physiotherapy/evaluation',
    color: 'bg-purple-100 text-purple-600',
    stats: { label: 'Evaluaciones', key: 'evaluations_count' },
  },
  {
    title: 'Planes de Tratamiento',
    description: 'Gestión de planes de tratamiento',
    icon: FileText,
    href: '/dashboard/physiotherapy/plans',
    color: 'bg-blue-100 text-blue-600',
    stats: { label: 'Planes Activos', key: 'plans_count' },
  },
  {
    title: 'Sesiones',
    description: 'Registro de sesiones SOAP',
    icon: Clock,
    href: '/dashboard/physiotherapy/sessions',
    color: 'bg-green-100 text-green-600',
    stats: { label: 'Sesiones', key: 'sessions_count' },
  },
  {
    title: 'Derivaciones',
    description: 'Derivaciones desde otros departamentos',
    icon: ArrowRight,
    href: '/dashboard/physiotherapy/referrals',
    color: 'bg-orange-100 text-orange-600',
    stats: { label: 'Pendientes', key: 'referrals_count' },
  },
];

export default function PhysiotherapyDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    evaluations_count: 0,
    plans_count: 0,
    sessions_count: 0,
    referrals_count: 0,
    patients_this_month: 0,
    sessions_this_month: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    // Fetch evaluations count
    const { count: evaluationsCount } = await supabase
      .from('physio_medical_records')
      .select('*', { count: 'exact', head: true });

    // Fetch plans count
    const { count: plansCount } = await supabase
      .from('physio_treatment_plans')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Fetch sessions count
    const { count: sessionsCount } = await supabase
      .from('physio_sessions')
      .select('*', { count: 'exact', head: true });

    // Fetch pending referrals
    const { count: referralsCount } = await supabase
      .from('clinical_references')
      .select('*', { count: 'exact', head: true })
      .eq('target_department_id', 'physiotherapy')
      .eq('status', 'pending');

    setStats({
      evaluations_count: evaluationsCount || 0,
      plans_count: plansCount || 0,
      sessions_count: sessionsCount || 0,
      referrals_count: referralsCount || 0,
      patients_this_month: evaluationsCount || 0,
      sessions_this_month: sessionsCount || 0,
    });
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Módulo de Fisioterapia</h1>
          <p className="text-gray-500 mt-1">Gestión integral de tratamientos de fisioterapia</p>
        </div>
        <Link href="/dashboard/physiotherapy/evaluation/new" className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Evaluación
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Evaluaciones</p>
                <p className="text-2xl font-bold text-gray-900">{stats.evaluations_count}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Planes Activos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.plans_count}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sesiones Totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.sessions_count}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ArrowRight className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Derivaciones Pend.</p>
                <p className="text-2xl font-bold text-gray-900">{stats.referrals_count}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moduleCards.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{module.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {stats[module.stats.key as keyof typeof stats]}
                      </p>
                      <p className="text-xs text-gray-500">{module.stats.label}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/physiotherapy/evaluation/new"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Nueva Evaluación</p>
                <p className="text-sm text-gray-500">Valoración inicial del paciente</p>
              </div>
            </Link>

            <Link
              href="/dashboard/physiotherapy/plans/new"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Nuevo Plan</p>
                <p className="text-sm text-gray-500">Crear plan de tratamiento</p>
              </div>
            </Link>

            <Link
              href="/dashboard/physiotherapy/referrals/new"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="p-2 bg-orange-100 rounded-lg">
                <ArrowRight className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Nueva Derivación</p>
                <p className="text-sm text-gray-500">Derivar desde otro departamento</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-body">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Flujo de Trabajo Recomendado</h3>
              <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                <li>Recibir derivación o atender paciente</li>
                <li>Realizar evaluación inicial</li>
                <li>Crear plan de tratamiento</li>
                <li>Registrar sesiones SOAP</li>
                <li>Finalizar plan al completar tratamiento</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
