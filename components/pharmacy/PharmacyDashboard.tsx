'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Pill, 
  Plus,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { PharmacyStats, PrescriptionWithRelations, PharmacyProduct } from '@/lib/actions/pharmacy';

interface PharmacyDashboardProps {
  initialStats: PharmacyStats;
  pendingPrescriptions: PrescriptionWithRelations[];
  lowStockProducts: PharmacyProduct[];
}

export default function PharmacyDashboard({ 
  initialStats, 
  pendingPrescriptions,
  lowStockProducts 
}: PharmacyDashboardProps) {
  const [stats, setStats] = useState(initialStats);
  const [prescriptions, setPrescriptions] = useState(pendingPrescriptions);
  const [lowStock, setLowStock] = useState(lowStockProducts);
  const [isLoading, setIsLoading] = useState(false);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/pharmacy/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setPrescriptions(data.pendingPrescriptions);
        setLowStock(data.lowStockProducts);
      }
    } catch (error) {
      console.error('Error al actualizar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Farmacia</h1>
          <p className="text-gray-500 mt-1">Gestión de inventario y dispensación de medicamentos</p>
        </div>
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Productos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.lowStockProducts}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          {stats.lowStockProducts > 0 && (
            <Link 
              href="/dashboard/pharmacy/inventory?filter=low_stock" 
              className="text-xs text-yellow-600 hover:text-yellow-700 mt-2 inline-flex items-center gap-1"
            >
              Ver productos <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Recetas Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingPrescriptions}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          {stats.pendingPrescriptions > 0 && (
            <Link 
              href="/dashboard/pharmacy/prescriptions?status=pending" 
              className="text-xs text-orange-600 hover:text-orange-700 mt-2 inline-flex items-center gap-1"
            >
              Ver recetas <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Dispensadas Hoy</p>
              <p className="text-2xl font-bold text-green-600">{stats.dispensedToday}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alertas de productos por vencer */}
      {stats.expiringProducts > 0 && (
        <div className="card border-l-4 border-l-red-500">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Productos Próximos a Vencer</h3>
                <p className="text-sm text-gray-500">
                  Tienes {stats.expiringProducts} productos que vencerán en los próximos 30 días.
                </p>
              </div>
              <Link 
                href="/dashboard/pharmacy/inventory?filter=expiring" 
                className="btn-secondary btn-sm"
              >
                Ver Productos
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Valor del inventario */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Valor Total del Inventario</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.totalInventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Grid de 2 columnas: Recetas pendientes y Stock bajo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recetas Pendientes */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recetas Pendientes</h2>
            <Link href="/dashboard/pharmacy/prescriptions" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todas
            </Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Medicamento</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.length > 0 ? (
                  prescriptions.slice(0, 5).map((rx) => (
                    <tr key={rx.id}>
                      <td>
                        <div>
                          <p className="font-medium">
                            {rx.patients?.first_name} {rx.patients?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{rx.patients?.phone}</p>
                        </div>
                      </td>
                      <td className="font-medium">{rx.medication_name}</td>
                      <td className="text-sm text-gray-500">{formatDate(rx.created_at)}</td>
                      <td>
                        <Link 
                          href={`/dashboard/pharmacy/prescriptions?id=${rx.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      No hay recetas pendientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Productos con Stock Bajo */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Stock Bajo</h2>
            <Link href="/dashboard/pharmacy/inventory?filter=low_stock" className="text-sm text-primary-600 hover:text-primary-700">
              Ver todos
            </Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Stock Actual</th>
                  <th>Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length > 0 ? (
                  lowStock.slice(0, 5).map((product) => (
                    <tr key={product.id}>
                      <td className="font-medium">{product.name}</td>
                      <td className="text-sm text-gray-500">{product.sku}</td>
                      <td>
                        <span className="text-red-600 font-medium">{product.quantity}</span>
                      </td>
                      <td className="text-sm text-gray-500">{product.min_stock}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      No hay productos con stock bajo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/dashboard/pharmacy/inventory" 
          className="card p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Gestionar Inventario</h3>
              <p className="text-sm text-gray-500">Ver y editar productos</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/pharmacy/prescriptions" 
          className="card p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Pill className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Dispensar Recetas</h3>
              <p className="text-sm text-gray-500">Ver recetas pendientes</p>
            </div>
          </div>
        </Link>

        <Link 
          href="/dashboard/pharmacy/movements" 
          className="card p-4 hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Historial de Movimientos</h3>
              <p className="text-sm text-gray-500">Ver registro de movimientos</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
