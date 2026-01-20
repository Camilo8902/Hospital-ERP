'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getInvoiceById, cancelInvoice } from '@/lib/actions/payments';
import { ArrowLeft, Printer, Edit, Trash2, XCircle, CheckCircle, Clock, AlertCircle, FileText, Calculator, MoreVertical, DollarSign, CreditCard } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/lib/types';

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMobileOptions, setShowMobileOptions] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      const invoiceData = await getInvoiceById(invoiceId);
      if (invoiceData) {
        setInvoice(invoiceData as Invoice);
      } else {
        setError('Factura no encontrada');
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError('Error al cargar la factura');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!invoice) return;

    setIsCancelling(true);
    try {
      const result = await cancelInvoice(invoice.id);
      if (result.success) {
        setInvoice({ ...invoice, status: 'cancelled' });
        setShowCancelModal(false);
      } else {
        setError(result.error || 'Error al cancelar la factura');
      }
    } catch (err) {
      setError('Error al cancelar la factura');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5" />;
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'draft':
        return 'Borrador';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 mb-4">{error || 'Factura no encontrada'}</p>
          <button
            onClick={() => router.push('/dashboard/billing')}
            className="btn-primary w-full"
          >
            Volver a Facturas
          </button>
        </div>
      </div>
    );
  }

  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = invoice.tax_amount || 0;
  const total = subtotal + taxAmount - (invoice.discount_amount || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/billing')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="lg:block hidden">
                <h1 className="text-xl font-bold text-gray-900">Factura #{invoice.invoice_number}</h1>
                <p className="text-sm text-gray-500">Detalles de la factura</p>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              {invoice.status === 'pending' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="btn-secondary btn-md flex items-center gap-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Cancelar
                </button>
              )}
              <button
                onClick={() => router.push(`/dashboard/billing/${invoice.id}/edit`)}
                className="btn-secondary btn-md flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button className="btn-primary btn-md flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>

            {/* Mobile Actions Toggle */}
            <button
              onClick={() => setShowMobileOptions(!showMobileOptions)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Mobile Title & Options */}
          <div className="lg:hidden mt-2">
            <h1 className="text-lg font-bold text-gray-900">Factura #{invoice.invoice_number}</h1>
            
            {/* Mobile Actions Panel */}
            {showMobileOptions && (
              <div className="mt-3 pt-3 border-t space-y-2">
                {invoice.status === 'pending' && (
                  <button
                    onClick={() => {
                      setShowCancelModal(true);
                      setShowMobileOptions(false);
                    }}
                    className="w-full btn-secondary btn-md flex items-center justify-center gap-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancelar Factura
                  </button>
                )}
                <button
                  onClick={() => {
                    router.push(`/dashboard/billing/${invoice.id}/edit`);
                    setShowMobileOptions(false);
                  }}
                  className="w-full btn-secondary btn-md flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button className="w-full btn-primary btn-md flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Card */}
        <div className={`card border ${getStatusColor(invoice.status)}`}>
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(invoice.status)}
                <div>
                  <p className="font-semibold">{getStatusLabel(invoice.status)}</p>
                  <p className="text-sm opacity-80">
                    Creada el {formatDate(invoice.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Info */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Información del Paciente
            </h2>
            {invoice.patients && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Nombre</label>
                  <p className="font-medium text-gray-900">
                    {invoice.patients.first_name} {invoice.patients.last_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Teléfono</label>
                  <p className="font-medium text-gray-900">{invoice.patients.phone}</p>
                </div>
                {invoice.patients.insurance_provider && (
                  <div>
                    <label className="text-sm text-gray-500">Seguro</label>
                    <p className="font-medium text-gray-900">{invoice.patients.insurance_provider}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Items */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-gray-400" />
              Items de la Factura
            </h2>
            
            {/* Desktop Table */}
            <div className="hidden md:overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Descripción</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Cant.</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Precio</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="py-3 px-2">
                        <p className="font-medium text-gray-900">{item.description}</p>
                        {item.source_type && (
                          <p className="text-xs text-gray-500">
                            {item.source_type === 'lab_order' ? 'Orden de laboratorio' : 
                             item.source_type === 'inventory' ? 'Inventario' : 
                             item.source_type === 'prescription' ? 'Receta médica' : 'Manual'}
                          </p>
                        )}
                      </td>
                      <td className="text-center py-3 px-2 text-gray-600">{item.quantity}</td>
                      <td className="text-right py-3 px-2 text-gray-600">{formatCurrency(item.unit_price)}</td>
                      <td className="text-right py-3 px-2 font-medium text-gray-900">
                        {formatCurrency(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {invoice.items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="font-bold text-gray-900">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Cant. x {formatCurrency(item.unit_price)}</span>
                    {item.source_type && (
                      <span className="badge badge-gray text-xs">
                        {item.source_type === 'lab_order' ? 'Laboratorio' : 
                         item.source_type === 'inventory' ? 'Inventario' : 
                         item.source_type === 'prescription' ? 'Receta' : 'Manual'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>IVA ({invoice.subtotal > 0 ? Math.round((taxAmount / subtotal) * 100) : 0}%)</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  {invoice.discount_amount && invoice.discount_amount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Descuento</span>
                      <span className="text-green-600">-{formatCurrency(invoice.discount_amount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Fecha de Vencimiento</label>
                <p className="font-medium text-gray-900">{formatDate(invoice.due_date)}</p>
              </div>
              {invoice.notes && (
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-500">Notas</label>
                  <p className="font-medium text-gray-900">{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Cancelar Factura</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas cancelar esta factura? El estado cambiará a "Cancelada" y no podrá ser pagada.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 btn-secondary"
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelInvoice}
                disabled={isCancelling}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white"
              >
                {isCancelling ? 'Cancelando...' : 'Sí, cancelar factura'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
