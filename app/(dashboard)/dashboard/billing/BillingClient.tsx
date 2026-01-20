'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDate, formatCurrency, getInvoiceStatusColor } from '@/lib/utils';
import { getInvoices, processManualPayment } from '@/lib/actions/payments';
import Link from 'next/link';
import { Plus, Search, FileText, DollarSign, X, CreditCard, Banknote, Smartphone, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

// ============================================
// TIPOS BASADOS EN EL ESQUEMA SQL
// ============================================

interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  appointment_id: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  payment_method: string | null;
  payment_reference: string | null;
  items: Array<{
    id?: string;
    description: string;
    service_code?: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  due_date: string;
  issued_date: string;
  paid_date: string | null;
  created_at: string;
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    medical_record_number?: string;
    email?: string;
    phone: string;
    insurance_provider?: string | null;
  };
}

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

// ============================================
// MODAL DE PAGO
// ============================================

interface PaymentModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: () => void;
}

function PaymentModal({ invoice, onClose, onSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pendingAmount = invoice ? invoice.total_amount - (invoice.amount_paid || 0) : 0;

  useEffect(() => {
    if (invoice) {
      setAmount(pendingAmount.toFixed(2));
    }
  }, [invoice, pendingAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await processManualPayment({
        invoiceId: invoice.id,
        paymentMethod,
        amount: parseFloat(amount),
        reference: reference || undefined,
        notes: notes || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Error al procesar el pago');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!invoice) return null;

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h3>
          <p className="text-gray-500 mb-4">
            Factura {invoice.invoice_number} ha sido pagada correctamente.
          </p>
          <p className="text-sm text-gray-400">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-bold text-gray-900">Procesar Pago</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Invoice Info */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <span className="font-mono font-medium">{invoice.invoice_number}</span>
          </div>
          <p className="text-sm text-gray-600">
            {invoice.patients?.first_name} {invoice.patients?.last_name}
          </p>
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-500">Total Factura</span>
            <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Pagado</span>
            <span className="text-sm font-medium text-green-600">{formatCurrency(invoice.amount_paid || 0)}</span>
          </div>
          <div className="border-t border-gray-200 mt-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Pendiente</span>
              <span className="text-lg font-bold text-primary-600">{formatCurrency(pendingAmount)}</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm flex-1">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Payment Method Selection */}
          <div>
            <label className="label mb-2 block">Método de Pago</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className="w-5 h-5 text-green-600" />
                <span className="text-xs font-medium">Efectivo</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-medium">Tarjeta</span>
              </button>
              
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-5 h-5 text-purple-600" />
                <span className="text-xs font-medium">Transferencia</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="label mb-2 block">Monto a Pagar</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="input text-2xl text-center font-bold py-4"
              step="0.01"
              min="0"
              max={pendingAmount}
              required
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              Máximo: {formatCurrency(pendingAmount)}
            </p>
          </div>

          {/* Reference (for card/transfer) */}
          {paymentMethod !== 'CASH' && (
            <div>
              <label className="label mb-2 block">
                {paymentMethod === 'CARD' ? 'Últimos 4 dígitos de tarjeta' : 'Referencia de transferencia'}
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={paymentMethod === 'CARD' ? '****' : 'Referencia'}
                className="input"
                maxLength={paymentMethod === 'CARD' ? 4 : 50}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label mb-2 block">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones..."
              className="input resize-none"
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || parseFloat(amount) <= 0 || parseFloat(amount) > pendingAmount}
            className="btn-primary w-full py-4 text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Procesando...
              </span>
            ) : (
              `Confirmar Pago - ${formatCurrency(parseFloat(amount) || 0)}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL DE FACTURACIÓN
// ============================================

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [status, setStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getInvoices({
        status: status !== 'all' ? status : undefined,
      }, 100, 0);

      let filteredInvoices = result.invoices;

      // Filter by search query on client side for now
      if (searchQuery) {
        filteredInvoices = filteredInvoices.filter(
          (inv) => inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setInvoices(filteredInvoices);
      setTotalCount(result.total);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [status, searchQuery]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'pending').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((acc, inv) => acc + inv.total_amount, 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((acc, inv) => acc + inv.amount_paid, 0),
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
              <button
                key={filter.value}
                onClick={() => setStatus(filter.value)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  status === filter.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="card-body py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por número de factura..."
              className="input pl-10 w-full"
            />
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
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                      <span className="text-gray-500">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No se encontraron facturas
                  </td>
                </tr>
              ) : (
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
                            <button
                              onClick={() => setSelectedInvoice(invoice)}
                              className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                            >
                              <DollarSign className="w-4 h-4" />
                              Cobrar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
            <button className="btn-secondary btn-sm" onClick={fetchInvoices}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSuccess={() => {
            setSelectedInvoice(null);
            fetchInvoices();
          }}
        />
      )}
    </div>
  );
}
