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
  Barcode,
  Smartphone,
  RotateCcw
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
  const [isMobile, setIsMobile] = useState(false);
  const [showCartOnMobile, setShowCartOnMobile] = useState(false);

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

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Funciones helper para formato de moneda
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      {/* Panel izquierdo: Catálogo de productos (visible en móvil cuando no se muestra el carrito) */}
      {(!isMobile || !showCartOnMobile) && (
        <div className="flex-1 flex flex-col lg:h-screen lg:overflow-hidden">
          {/* Header */}
          <div className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <a href="/dashboard/pharmacy" className="p-2 hover:bg-gray-100 rounded-lg lg:hidden">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </a>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Punto de Venta</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Farmacia</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Botón para mostrar carrito en móvil */}
              {isMobile && cart.length > 0 && (
                <button
                  onClick={() => setShowCartOnMobile(true)}
                  className="lg:hidden btn-primary py-2 px-3 flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span className="text-sm">{cart.length}</span>
                </button>
              )}
              {/* Stats en desktop */}
              <div className="hidden lg:flex items-center gap-4 text-xs">
                <div className="bg-green-50 px-3 py-1 rounded-lg">
                  <span className="text-green-600 font-medium">${formatCurrency(stats.totalSalesToday)}</span>
                  <span className="text-gray-500 ml-1">hoy</span>
                </div>
                <div className="bg-blue-50 px-3 py-1 rounded-lg">
                  <span className="text-blue-600 font-medium">{stats.transactionCountToday}</span>
                  <span className="text-gray-500 ml-1">transacciones</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensajes de estado */}
          {error && (
            <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm flex-1">{error}</span>
              <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mx-4 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-green-700 text-sm flex-1">{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)} className="p-1 hover:bg-green-100 rounded">
                <X className="w-4 h-4 text-green-500" />
              </button>
            </div>
          )}

          {/* Buscador */}
          <div className="p-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar producto..."
                className="input pl-10 pr-12 text-base py-3 w-full rounded-xl"
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Barcode className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Grid de productos */}
          <div className="flex-1 overflow-auto p-4 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={product.quantity <= 0}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      product.quantity <= 0 
                        ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' 
                        : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-md active:scale-95'
                    }`}
                  >
                    {product.quantity <= product.min_stock && (
                      <span className="absolute top-2 right-2 text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                        Stock bajo
                      </span>
                    )}
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-50 mb-3">
                      <Package className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-primary-600">
                        ${formatCurrency(product.unit_price)}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {product.quantity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel derecho: Carrito (sidebar en desktop, modal en móvil) */}
      {(!isMobile || showCartOnMobile) && (
        <div className={`
          ${isMobile 
            ? 'fixed inset-0 bg-black/50 z-50 lg:static lg:bg-transparent' 
            : 'w-96 bg-white border-l flex-col shadow-lg hidden lg:flex'
          }
        `}>
          {/* Overlay para cerrar en móvil */}
          {isMobile && (
            <div 
              className="absolute inset-0 bg-black/50 lg:hidden" 
              onClick={() => setShowCartOnMobile(false)}
            />
          )}
          
          {/* Contenido del carrito */}
          <div className={`
            bg-white h-full flex flex-col
            ${isMobile 
              ? 'absolute right-0 top-0 w-full max-w-sm shadow-2xl rounded-l-2xl' 
              : 'lg:h-screen lg:overflow-hidden'
            }
          `}>
            {/* Header del carrito */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Carrito
                </h2>
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                  {cart.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                    title="Vaciar carrito"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                {isMobile && (
                  <button
                    onClick={() => setShowCartOnMobile(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Items del carrito */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Receipt className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="font-medium">Carrito vacío</p>
                  <p className="text-sm mt-1">Agrega productos para comenzar</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 pr-2">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.product.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          ${formatCurrency(item.product.unit_price)} x {item.quantity}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Controles de cantidad */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.quantity}
                          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${formatCurrency((item.product.unit_price * item.quantity) - item.discount)}
                      </span>
                    </div>

                    {/* Descuento */}
                    {item.discount > 0 && (
                      <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        Descuento: -${formatCurrency(item.discount)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Totales y botón de pago */}
            <div className="border-t bg-gray-50 p-4 space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>${formatCurrency(calculateSubtotal())}</span>
                </div>
                {calculateDiscount() > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-${formatCurrency(calculateDiscount())}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>IVA (16%)</span>
                  <span>${formatCurrency(calculateTax())}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-primary-600">${formatCurrency(calculateTotal())}</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0 || isProcessing}
                className="btn-primary w-full py-3.5 text-base font-semibold flex items-center justify-center gap-2 rounded-xl"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Procesando...
                  </span>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Cobrar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Método de Pago</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Total a pagar */}
            <div className="p-6 text-center bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <p className="text-sm opacity-90">Total a pagar</p>
              <p className="text-4xl font-bold mt-1">${formatCurrency(calculateTotal())}</p>
            </div>

            {/* Opciones de pago */}
            <div className="p-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedPaymentMethod('CASH')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  selectedPaymentMethod === 'CASH'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium">Efectivo</span>
              </button>
              
              <button
                onClick={() => setSelectedPaymentMethod('CARD')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  selectedPaymentMethod === 'CARD'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Tarjeta</span>
              </button>
              
              <button
                onClick={() => setSelectedPaymentMethod('TRANSFER')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  selectedPaymentMethod === 'TRANSFER'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium">Transferencia</span>
              </button>
            </div>

            {/* Efectivo: mostrar campo para efectivo recibido */}
            {selectedPaymentMethod === 'CASH' && (
              <div className="p-4 border-t">
                <label className="label mb-2 block text-center">Efectivo recibido</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0.00"
                  className="input text-2xl text-center font-bold py-4"
                  step="0.01"
                  min="0"
                  autoFocus
                />
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[20, 50, 100, 200].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        const total = calculateTotal();
                        const multiples = Math.ceil(total / amount);
                        setCashReceived((multiples * amount).toString());
                      }}
                      className="py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                {cashReceived && parseFloat(cashReceived) >= calculateTotal() && (
                  <div className="mt-4 p-3 bg-green-50 rounded-xl text-center">
                    <p className="text-sm text-green-600">Cambio</p>
                    <p className="text-2xl font-bold text-green-700">${formatCurrency(calculateChange())}</p>
                  </div>
                )}
              </div>
            )}

            {/* Botón de procesar */}
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={processSale}
                disabled={isProcessing || (selectedPaymentMethod === 'CASH' && (!cashReceived || parseFloat(cashReceived) < calculateTotal()))}
                className="btn-primary w-full py-4 text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Procesando...
                  </span>
                ) : (
                  `Confirmar ${selectedPaymentMethod === 'CASH' ? 'Pago en Efectivo' : 'Pago'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de ticket */}
      {showReceiptModal && lastTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-gray-900">Venta Completada</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Ticket */}
            <div className="p-6 text-sm" id="receipt">
              <div className="text-center border-b pb-4 mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="font-bold text-lg">FARMACIA</h4>
                <p className="text-gray-500">Ticket de Venta</p>
              </div>
              
              <div className="space-y-2 mb-4 text-sm">
                <p><span className="text-gray-500">Folio:</span> <span className="font-medium">{lastTransaction.transaction_number}</span></p>
                <p><span className="text-gray-500">Fecha:</span> {formatDateTime(lastTransaction.created_at)}</p>
              </div>

              <div className="border-t border-b py-4 space-y-3">
                {lastTransaction.items.map((item: CartItem, index: number) => (
                  <div key={index} className="flex justify-between">
                    <div className="flex-1 pr-4">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-gray-500 text-xs">
                        ${formatCurrency(item.product.unit_price)} x {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium text-sm">
                      ${formatCurrency((item.product.unit_price * item.quantity) - item.discount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>${formatCurrency(lastTransaction.totals.subtotal)}</span>
                </div>
                {lastTransaction.totals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-${formatCurrency(lastTransaction.totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">IVA</span>
                  <span>${formatCurrency(lastTransaction.totals.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary-600">${formatCurrency(lastTransaction.totals.total)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-gray-500">
                <p>¡Gracias por su compra!</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="p-4 border-t space-y-2">
              <button
                onClick={printReceipt}
                className="btn-secondary w-full py-3 flex items-center justify-center gap-2 rounded-xl"
              >
                <Receipt className="w-5 h-5" />
                Imprimir Ticket
              </button>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setShowCartOnMobile(false);
                }}
                className="btn-primary w-full py-3 rounded-xl"
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
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
