'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FlaskConical, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Plus,
  FileText,
  RefreshCw,
  ArrowRight,
  TestTube
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { LabStats, LabOrder } from '@/lib/types';

interface LabDashboardProps {
  initialStats: LabStats;
  recentOrders: LabOrder[];
}

export default function LabDashboard({ initialStats, recentOrders }: LabDashboardProps) {
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState(recentOrders);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/lab/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error al actualizar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      samples_collected: { color: 'bg-blue-100 text-blue-800', label: 'Muestras Tomadas' },
      processing: { color: 'bg-purple-100 text-purple-800', label: 'Procesando' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completado' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado' },
    };
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    return <span className={`badge ${config.color}`}>{config.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Laboratorio</h1>
          <p className="text-gray-500 mt-1">Gestión de pruebas y resultados de laboratorio</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <Link href="/dashboard/lab/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nueva Orden
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Órdenes Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En Proceso</p>
              <p className="text-2xl font-bold text-blue-600">{stats.processingOrders}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <TestTube className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completadas Hoy</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Urgentes</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgentOrders}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          {stats.urgentOrders > 0 && (
            <p className="text-xs text-red-600 mt-2">Requieren atención inmediata</p>
          )}
        </div>
      </div>

      {/* Income Stats */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Ingresos del Día</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/dashboard/lab/orders" 
          className="card p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Ver Órdenes</h3>
              <p className="text-sm text-gray-500">Gestionar todas las órdenes</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/lab/catalog" 
          className="card p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Catálogo de Pruebas</h3>
              <p className="text-sm text-gray-500">Administrar pruebas disponibles</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/lab/orders?status=pending" 
          className="card p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Órdenes Pendientes</h3>
              <p className="text-sm text-gray-500">Revisar órdenes por procesar</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Órdenes Recientes</h2>
          <Link href="/dashboard/lab/orders" className="text-sm text-primary-600 hover:text-primary-700">
            Ver todas
          </Link>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Paciente</th>
                <th>Pruebas</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-sm">{order.order_number}</td>
                    <td>
                      <div>
                        <p className="font-medium">
                          {order.patients?.first_name} {order.patients?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{order.patients?.phone}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const details = order.lab_order_details || [];
                          if (details.length === 0) {
                            return <span className="text-sm text-gray-400">0 prueba(s)</span>;
                          }
                          return details.slice(0, 2).map((detail: any) => (
                            <span 
                              key={detail.id} 
                              className="badge badge-gray text-xs"
                              title={detail.tests?.name || 'Prueba'}
                            >
                              {detail.tests?.name 
                                ? (detail.tests.name.length > 15 
                                    ? detail.tests.name.substring(0, 15) + '...' 
                                    : detail.tests.name)
                                : 'Sin nombre'}
                            </span>
                          ));
                        })()}
                        {order.lab_order_details && order.lab_order_details.length > 2 && (
                          <span className="badge bg-gray-200 text-gray-600 text-xs">
                            +{order.lab_order_details.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td className="text-sm text-gray-500">{formatDate(order.created_at)}</td>
                    <td>
                      <Link 
                        href={`/dashboard/lab/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                      >
                        Ver <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-500">
                    No hay órdenes recientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
