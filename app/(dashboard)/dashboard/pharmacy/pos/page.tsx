'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  CreditCard, 
  Banknote, 
  Receipt, 
  ArrowLeft,
  Package,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Barcode
} from 'lucide-react';
import type { PharmacyProduct } from '@/lib/actions/pharmacy';
import type { POSStats } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

// Tipo para items del carrito
interface CartItem {
  product: PharmacyProduct;
  quantity: number;
  discount: number;
}

type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

export default function POSTerminalPage() {
  // Estados principales
  const [products, setProducts] = useState<PharmacyProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados de UI
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [stats, setStats] = useState<POSStats>({
    totalSalesToday: 0,
    transactionCountToday: 0,
    averageTicket: 0,
    topSellingProducts: [],
  });

  // Cargar productos iniciales
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/pharmacy/pos/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('/api/pharmacy/pos/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadStats();
  }, [loadProducts, loadStats]);

  // Buscar productos con debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/pharmacy/pos/products?q=${encodeURIComponent(searchQuery)}`);
          if (response.ok) {
            const data = await response.json();
            setProducts(data);
          }
        } catch (err) {
          console.error('Error al buscar productos:', err);
        } finally {
          setIsLoading(false);
        }
      } else if (searchQuery.length === 0) {
        loadProducts();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, loadProducts]);

  // Agregar producto al carrito
  const addToCart = (product: PharmacyProduct) => {
    setError(null);
    
    if (product.quantity <= 0) {
      setError(`No hay stock disponible de ${product.name}`);
      return;
    }

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      
      if (existingIndex >= 0) {
        // El producto ya está en el carrito
        const updatedCart = [...prevCart];
        const currentQty = updatedCart[existingIndex].quantity;
        
        if (currentQty >= product.quantity) {
          setError(`Stock máximo alcanzado para ${product.name}. Disponible: ${product.quantity}`);
          return prevCart;
        }
        
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: currentQty + 1
        };
        return updatedCart;
      } else {
        // Nuevo producto
        return [...prevCart, { product, quantity: 1, discount: 0 }];
      }
    });
  };

  // Actualizar cantidad en el carrito
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          if (newQuantity > item.product.quantity) {
            setError(`Stock insuficiente. Disponible: ${item.product.quantity}`);
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  // Eliminar item del carrito
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  // Aplicar descuento a un item
  const applyDiscount = (productId: string, discountAmount: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const maxDiscount = (item.product.unit_price * item.quantity);
          const validDiscount = Math.min(Math.max(0, discountAmount), maxDiscount);
          return { ...item, discount: validDiscount };
        }
        return item;
      });
    });
  };

  // Calcular totales
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      return sum + (item.product.unit_price * item.quantity) - item.discount;
    }, 0);
  };

  const calculateDiscount = () => {
    return cart.reduce((sum, item) => sum + item.discount, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.16; // 16% IVA
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const calculateChange = () => {
    if (selectedPaymentMethod !== 'CASH' || !cashReceived) return 0;
    const total = calculateTotal();
    const received = parseFloat(cashReceived);
    return Math.max(0, received - total);
  };

  // Procesar venta
  const processSale = async () => {
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const items = cart.map(item => ({
        inventory_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.unit_price,
        discount: item.discount,
      }));

      const response = await fetch('/api/pharmacy/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          paymentMethod: selectedPaymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la venta');
      }

      setLastTransaction({
        ...data,
        items: cart,
        totals: {
          subtotal: calculateSubtotal(),
          discount: calculateDiscount(),
          tax: calculateTax(),
          total: calculateTotal(),
        },
      });
      
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      setCart([]);
      setCashReceived('');
      loadProducts();
      loadStats();
      
      setSuccessMessage(`Venta procesada: ${data.transaction_number}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  // Imprimir ticket
  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/dashboard/pharmacy" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </a>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Punto de Venta - Farmacia</h1>
            <p className="text-sm text-gray-500">Terminal de ventas rápido</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500">Ventas hoy:</span>
              <span className="ml-2 font-semibold text-green-600">
                ${stats.totalSalesToday.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Transacciones:</span>
              <span className="ml-2 font-semibold">{stats.transactionCountToday}</span>
            </div>
            <div>
              <span className="text-gray-500">Ticket promedio:</span>
              <span className="ml-2 font-semibold">
                ${stats.averageTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded">
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mx-4 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="ml-auto p-1 hover:bg-green-100 rounded">
            <X className="w-4 h-4 text-green-500" />
          </button>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Panel izquierdo: Catálogo de productos */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col">
          {/* Buscador */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, SKU o código de barras..."
                className="input pl-10 pr-12 text-lg py-3"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Barcode className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Grid de productos */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No se encontraron productos</p>
                <p className="text-sm mt-1">Try with a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.quantity <= 0}
                    className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${
                      product.quantity <= 0 
                        ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' 
                        : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary-600" />
                      </div>
                      {product.quantity <= product.min_stock && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                          Stock bajo
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">
                        ${product.unit_price.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Stock: {product.quantity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho: Carrito */}
        <div className="w-96 bg-white border-l flex flex-col shadow-lg">
          {/* Header del carrito */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Carrito de Venta
              </h2>
              <button
                onClick={() => setCart([])}
                disabled={cart.length === 0}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Vaciar
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">{cart.length} artículo{cart.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Items del carrito */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>El carrito está vacío</p>
                <p className="text-sm mt-1">Agrega productos para comenzar</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                      <p className="text-xs text-gray-500">
                        ${item.product.unit_price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Controles de cantidad */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.quantity}
                        className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ${((item.product.unit_price * item.quantity) - item.discount).toFixed(2)}
                    </span>
                  </div>

                  {/* Descuento */}
                  {item.discount > 0 && (
                    <div className="mt-2 text-xs text-green-600">
                      Descuento: -${item.discount.toFixed(2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Totales y botón de pago */}
          <div className="border-t p-4 bg-gray-50">
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Descuento</span>
                <span>-${calculateDiscount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IVA (16%)</span>
                <span>${calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0 || isProcessing}
              className="btn-primary w-full py-4 text-lg font-semibold flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Procesando...
                </span>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Cobrar ${calculateTotal().toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Método de Pago</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Total a pagar */}
            <div className="text-center mb-6 p-4 bg-primary-50 rounded-xl">
              <p className="text-sm text-gray-600">Total a pagar</p>
              <p className="text-3xl font-bold text-primary-600">
                ${calculateTotal().toFixed(2)}
              </p>
            </div>

            {/* Opciones de pago */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                onClick={() => setSelectedPaymentMethod('CASH')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  selectedPaymentMethod === 'CASH'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className="w-8 h-8 text-green-600" />
                <span className="text-sm font-medium">Efectivo</span>
              </button>
              
              <button
                onClick={() => setSelectedPaymentMethod('CARD')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  selectedPaymentMethod === 'CARD'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-8 h-8 text-blue-600" />
                <span className="text-sm font-medium">Tarjeta</span>
              </button>
              
              <button
                onClick={() => setSelectedPaymentMethod('TRANSFER')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  selectedPaymentMethod === 'TRANSFER'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Calculator className="w-8 h-8 text-purple-600" />
                <span className="text-sm font-medium">Transferencia</span>
              </button>
            </div>

            {/* Efectivo: mostrar campo para efectivo recibido */}
            {selectedPaymentMethod === 'CASH' && (
              <div className="mb-6">
                <label className="label mb-2">Efectivo recibido</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="input text-xl text-center font-bold"
                  step="0.01"
                  min="0"
                />
                {cashReceived && parseFloat(cashReceived) >= calculateTotal() && (
                  <p className="text-center mt-2 text-green-600 font-medium">
                    Cambio: ${calculateChange().toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Botón de procesar */}
            <button
              onClick={processSale}
              disabled={isProcessing || (selectedPaymentMethod === 'CASH' && (!cashReceived || parseFloat(cashReceived) < calculateTotal()))}
              className="btn-primary w-full py-4 text-lg font-semibold"
            >
              {isProcessing ? 'Procesando...' : `Confirmar ${selectedPaymentMethod === 'CASH' ? 'Pago en Efectivo' : 'Pago con Tarjeta'}`}
            </button>
          </div>
        </div>
      )}

      {/* Modal de ticket */}
      {showReceiptModal && lastTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Venta Completada</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Ticket */}
            <div className="bg-white border rounded-lg p-4 mb-6 text-sm" id="receipt">
              <div className="text-center border-b pb-4 mb-4">
                <h4 className="font-bold text-lg">FARMACIA</h4>
                <p className="text-gray-500">Ticket de Venta</p>
              </div>
              
              <div className="space-y-2 mb-4">
                <p><span className="text-gray-500">Folio:</span> {lastTransaction.transaction_number}</p>
                <p><span className="text-gray-500">Fecha:</span> {formatDateTime(lastTransaction.created_at)}</p>
              </div>

              <div className="border-t border-b py-4 space-y-2">
                {lastTransaction.items.map((item: CartItem, index: number) => (
                  <div key={index} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-gray-500 text-xs">
                        ${item.product.unit_price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium">
                      ${((item.product.unit_price * item.quantity) - item.discount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${lastTransaction.totals.subtotal.toFixed(2)}</span>
                </div>
                {lastTransaction.totals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-${lastTransaction.totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">IVA</span>
                  <span>${lastTransaction.totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${lastTransaction.totals.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-gray-500 text-xs">
                <p>¡Gracias por su compra!</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  printReceipt();
                }}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                Imprimir
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="btn-primary flex-1"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos para impresión */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt, #receipt * {
            visibility: visible;
          }
          #receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
          }
        }
      `}</style>
    </div>
  );
}