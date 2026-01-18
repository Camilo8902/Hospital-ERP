import { createClient } from '@/lib/supabase/server';
import { formatDate, formatCurrency, getInvoiceStatusColor } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Search, FileText, DollarSign } from 'lucide-react';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = await createClient();
  const status = searchParams.status || 'all';

  // Construir consulta
  let query = supabase
    .from('invoices')
    .select(`
      *,
      patients (first_name, last_name, phone, insurance_provider)
    `)
    .order('created_at', { ascending: false });

  // Filtro por estado
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: invoices } = await query;

  // Estadísticas
  const stats = {
    total: invoices?.length || 0,
    pending: invoices?.filter(i => i.status === 'pending').length || 0,
    paid: invoices?.filter(i => i.status === 'paid').length || 0,
    overdue: invoices?.filter(i => i.status === 'overdue').length || 0,
    totalAmount: invoices?.reduce((acc, inv) => acc + inv.total_amount, 0) || 0,
    paidAmount: invoices?.filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.amount_paid, 0) || 0,
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    paid: 'Pagada',
    overdue: 'Vencida',
    cancelled: 'Cancelada',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-500 mt-1">Gestión de facturas y pagos</p>
        </div>
        <Link href="/dashboard/billing/new" className="btn-primary btn-md">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Factura
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-100" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pagadas</p>
              <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-100" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vencidas</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-100" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Cobrado</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.paidAmount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-100" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { value: 'all', label: 'Todas' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'paid', label: 'Pagadas' },
              { value: 'overdue', label: 'Vencidas' },
            ].map((filter) => (
              <Link
                key={filter.value}
                href={`/dashboard/billing?status=${filter.value}`}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  status === filter.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Factura</th>
                <th>Paciente</th>
                <th>Seguro</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Fecha Vencimiento</th>
                <th>Emitida</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices && invoices.length > 0 ? (
                invoices.map((invoice) => {
                  const isOverdue = invoice.status === 'pending' && 
                    new Date(invoice.due_date) < new Date();

                  return (
                    <tr key={invoice.id} className={isOverdue ? 'bg-red-50' : ''}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-mono font-medium">{invoice.invoice_number}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">
                            {invoice.patients?.first_name} {invoice.patients?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{invoice.patients?.phone}</p>
                        </div>
                      </td>
                      <td>
                        {invoice.patients?.insurance_provider ? (
                          <span className="badge badge-gray">
                            {invoice.patients.insurance_provider}
                          </span>
                        ) : (
                          <span className="text-gray-400">Particular</span>
                        )}
                      </td>
                      <td>
                        <div>
                          <p className="font-semibold">{formatCurrency(invoice.total_amount)}</p>
                          {invoice.amount_paid > 0 && (
                            <p className="text-xs text-green-600">
                              Pagado: {formatCurrency(invoice.amount_paid)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getInvoiceStatusColor(invoice.status)}`}>
                          {isOverdue ? 'Vencida' : statusLabels[invoice.status] || invoice.status}
                        </span>
                      </td>
                      <td className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {formatDate(invoice.due_date)}
                      </td>
                      <td>{formatDate(invoice.issued_date)}</td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/billing/${invoice.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            Ver
                          </Link>
                          {invoice.status === 'pending' && (
                            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                              Cobrar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    {status !== 'all'
                      ? 'No se encontraron facturas con el estado seleccionado'
                      : 'No hay facturas registradas'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Resumen Financiero</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Total en Facturas</span>
              <span className="font-medium">{formatCurrency(stats.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Cobrado</span>
              <span className="font-medium text-green-600">{formatCurrency(stats.paidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Por Cobrar</span>
              <span className="font-medium text-yellow-600">
                {formatCurrency(stats.totalAmount - stats.paidAmount)}
              </span>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Acciones Rápidas</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/billing/new" className="btn-primary btn-sm">
              <Plus className="w-4 h-4 mr-1" />
              Nueva Factura
            </Link>
            <button className="btn-secondary btn-sm">
              <FileText className="w-4 h-4 mr-1" />
              Exportar Reporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
