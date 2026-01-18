'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  Filter,
  Calendar,
  Upload,
  FileText,
  X,
  Save,
  ArrowDownToLine,
  History,
  ExternalLink,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { PharmacyProduct, InventoryMovement } from '@/lib/actions/pharmacy';

interface InventoryListProps {
  initialProducts: PharmacyProduct[];
  categories: string[];
}

export default function InventoryList({ initialProducts, categories }: InventoryListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [sortByExpiration, setSortByExpiration] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PharmacyProduct | null>(null);
  const [entryQuantity, setEntryQuantity] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [entryFile, setEntryFile] = useState<File | null>(null);
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);
  const [entrySuccess, setEntrySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para el historial de movimientos
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<PharmacyProduct | null>(null);
  const [historyMovements, setHistoryMovements] = useState<InventoryMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const itemsPerPage = 15;

  // Filtrar productos
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesLowStock = !showLowStockOnly || product.quantity <= product.min_stock;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Ordenar productos
  let sortedProducts = [...filteredProducts];
  if (sortByExpiration) {
    sortedProducts.sort((a, b) => {
      // Primero productos sin fecha de vencimiento
      if (!a.expiration_date && !b.expiration_date) return 0;
      if (!a.expiration_date) return 1;
      if (!b.expiration_date) return -1;
      
      // Luego por fecha de vencimiento (próximos a vencer primero)
      return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
    });
  }

  // Paginación
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const getStockStatus = (product: PharmacyProduct) => {
    if (product.quantity === 0) {
      return { label: 'Agotado', color: 'bg-red-100 text-red-700' };
    }
    if (product.quantity <= product.min_stock) {
      return { label: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-700' };
    }
    if (product.quantity >= (product.max_stock || product.min_stock * 3)) {
      return { label: 'Alto Stock', color: 'bg-green-100 text-green-700' };
    }
    return { label: 'Normal', color: 'bg-gray-100 text-gray-700' };
  };

  const isExpiringSoon = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expirationDate: string | null) => {
    if (!expirationDate) return false;
    return new Date(expirationDate) < new Date();
  };

  const getDaysUntilExpiry = (expirationDate: string | null) => {
    if (!expirationDate) return null;
    const expDate = new Date(expirationDate);
    const today = new Date();
    return Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; label: string }> = {
      // Categorías en inglés (como están en la base de datos)
      medication: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Medicamentos' },
      supplies: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Insumos' },
      equipment: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Equipos' },
      hygiene: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', label: 'Higiene' },
      // Categorías en español
      medicamentos: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Medicamentos' },
      medicamentos_fabricados: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'Medicamentos Fabricados' },
      insumos: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Insumos' },
      equipos: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Equipos' },
      articulos_higiene: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', label: 'Artículos de Higiene' },
      // Subcategorías comunes
      analgesicos: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Analgésicos' },
      antibioticos: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Antibióticos' },
      antiinflamatorios: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'Antiinflamatorios' },
      antipireticos: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Antipiréticos' },
      antihistaminicos: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', label: 'Antihistamínicos' },
      vitaminas: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Vitaminas' },
      suplementos: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', label: 'Suplementos' },
      guantes: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', label: 'Guantes' },
      jeringas: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', label: 'Jeringas' },
      gasas: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Gasas' },
      vendajes: { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200', label: 'Vendajes' },
      termometros: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'Termómetros' },
      tensimetros: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Tensiómetros' },
      algodon: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', label: 'Algodón' },
    };

    const normalizedCategory = category.toLowerCase().trim();
    const categoryData = colors[normalizedCategory];
    
    if (categoryData) {
      return { bg: categoryData.bg, text: categoryData.text, label: categoryData.label };
    }
    
    // Si no existe, retornar color por defecto con el nombre capitalizado
    return { 
      bg: 'bg-gray-100', 
      text: 'text-gray-700', 
      label: category.charAt(0).toUpperCase() + category.slice(1) 
    };
  };

  const openEntryModal = (product: PharmacyProduct) => {
    setSelectedProduct(product);
    setEntryQuantity('');
    setEntryNotes('');
    setEntryFile(null);
    setEntryError(null);
    setEntrySuccess(false);
    setShowEntryModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEntryFile(file);
    }
  };

  const handleRemoveFile = () => {
    setEntryFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !entryQuantity) return;

    setEntryLoading(true);
    setEntryError(null);

    try {
      const formData = new FormData();
      formData.append('product_id', selectedProduct.id);
      formData.append('quantity', entryQuantity);
      formData.append('notes', entryNotes);
      if (entryFile) {
        formData.append('file', entryFile);
      }

      const response = await fetch('/api/pharmacy/inventory/entry', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al registrar entrada');
      }

      setEntrySuccess(true);
      setTimeout(() => {
        setShowEntryModal(false);
        // Aquí se recargarían los productos
      }, 2000);
    } catch (err) {
      setEntryError(err instanceof Error ? err.message : 'Error al registrar entrada');
    } finally {
      setEntryLoading(false);
    }
  };

  // Función para abrir el historial de movimientos
  const openHistoryModal = async (product: PharmacyProduct) => {
    setSelectedProductForHistory(product);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryMovements([]);

    try {
      const response = await fetch(
        `/api/pharmacy/movements?productId=${product.id}&limit=50`
      );

      if (response.ok) {
        const data = await response.json();
        setHistoryMovements(data);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Función para eliminar un producto
  const handleDeleteProduct = async (productId: string) => {
    setDeletingProduct(productId);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/pharmacy/inventory/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar el producto');
      }

      // Actualizar el estado local eliminando el producto de la lista
      setProducts(prev => prev.filter(p => p.id !== productId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error al eliminar el producto');
    } finally {
      setDeletingProduct(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Farmacia</h1>
          <p className="text-gray-500 mt-1">Gestión de medicamentos e insumos</p>
        </div>
        <Link href="/dashboard/pharmacy/inventory/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Buscar por nombre, SKU o descripción..."
                className="input pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="input min-w-[150px]"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Low Stock Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => {
                  setShowLowStockOnly(e.target.checked);
                  setSortByExpiration(false);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Solo stock bajo</span>
              {products.filter(p => p.quantity <= p.min_stock).length > 0 && (
                <span className="badge badge-yellow">
                  {products.filter(p => p.quantity <= p.min_stock).length}
                </span>
              )}
            </label>

            {/* Expiration Sort Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sortByExpiration}
                onChange={(e) => {
                  setSortByExpiration(e.target.checked);
                  setShowLowStockOnly(false);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Próximos a vencer
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Mínimo</th>
                <th>Ubicación</th>
                <th>Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => {
                  const expired = isExpired(product.expiration_date);
                  const expiringSoon = !expired && isExpiringSoon(product.expiration_date);
                  const daysUntilExpiry = getDaysUntilExpiry(product.expiration_date);
                  
                  return (
                    <tr key={product.id} className={expired ? 'bg-red-50' : ''}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 max-w-[200px] truncate">
                              {product.description || 'Sin descripción'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{product.sku}</td>
                      <td>
                        {(() => {
                          const colors = getCategoryColor(product.category);
                          return (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                              {colors.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${product.quantity === 0 ? 'text-red-600' : product.quantity <= product.min_stock ? 'text-yellow-600' : 'text-green-600'}`}>
                            {product.quantity}
                          </span>
                          <span className="text-xs text-gray-500">{product.unit}</span>
                          {product.quantity <= product.min_stock && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="text-sm text-gray-500">{product.min_stock}</td>
                      <td className="text-sm text-gray-500">
                        {product.storage_location || '-'}
                      </td>
                      <td>
                        {product.expiration_date ? (
                          <div className={`text-sm ${expired ? 'text-red-600 font-medium' : expiringSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
                            {formatDate(product.expiration_date)}
                            {expired && (
                              <span className="block text-xs text-red-500">Vencido</span>
                            )}
                            {expiringSoon && daysUntilExpiry !== null && (
                              <span className="block text-xs text-yellow-500">
                                {daysUntilExpiry} días
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEntryModal(product)}
                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                            title="Entrada de producto"
                          >
                            <ArrowDownToLine className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={() => openHistoryModal(product)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver historial de movimientos"
                          >
                            <History className="w-4 h-4 text-blue-500" />
                          </button>
                          <Link
                            href={`/dashboard/pharmacy/inventory/${product.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </Link>
                          <button
                            onClick={() => setShowDeleteConfirm(product.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No se encontraron productos</p>
                    <p className="text-sm mt-1">
                      {searchQuery || selectedCategory !== 'all' || showLowStockOnly || sortByExpiration
                        ? 'Intenta con otros filtros de búsqueda'
                        : 'Agrega tu primer producto para comenzar'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedProducts.length)} de {sortedProducts.length} productos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 py-1 text-sm font-medium">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Eliminación</h3>
            <p className="text-gray-500 mb-6">
              ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{deleteError}</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setDeleteError(null);
                }}
                className="btn-secondary"
                disabled={deletingProduct !== null}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
                className="btn-danger flex items-center gap-2"
                disabled={deletingProduct !== null}
              >
                {deletingProduct === showDeleteConfirm ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Entry Modal */}
      {showEntryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Entrada de Producto</h3>
              <button
                onClick={() => setShowEntryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <Package className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-500">
                    SKU: {selectedProduct.sku} | Stock actual: {selectedProduct.quantity} {selectedProduct.unit}
                  </p>
                </div>
              </div>
            </div>

            {entrySuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Save className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Entrada Registrada</h4>
                <p className="text-gray-500">
                  La entrada de producto ha sido registrada exitosamente.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitEntry} className="space-y-4">
                {entryError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{entryError}</p>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label htmlFor="quantity" className="label mb-1.5">
                    Cantidad a ingresar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    value={entryQuantity}
                    onChange={(e) => setEntryQuantity(e.target.value)}
                    min="1"
                    required
                    className="input"
                    placeholder="Ingresa la cantidad"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="label mb-1.5">
                    Notas / Referencia
                  </label>
                  <textarea
                    id="notes"
                    value={entryNotes}
                    onChange={(e) => setEntryNotes(e.target.value)}
                    rows={3}
                    className="input"
                    placeholder="Notas sobre la entrada (proveedor, factura, etc.)"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="label mb-1.5">Archivo Adjunto (Opcional)</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                    {entryFile ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{entryFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(entryFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="text-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Haz clic para adjuntar archivo
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Vale de entrada, factura, remisión, etc.
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEntryModal(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={entryLoading || !entryQuantity}
                    className="btn-primary"
                  >
                    {entryLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Guardando...
                      </span>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Registrar Entrada
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedProductForHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Historial de Movimientos</h3>
                <p className="text-sm text-gray-500">{selectedProductForHistory.name}</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Movements Table */}
            <div className="flex-1 overflow-auto">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : historyMovements.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Anterior</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Nuevo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyMovements.map((movement) => {
                      const isEntry = movement.transaction_type === 'in' || movement.transaction_type === 'return';
                      
                      return (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(movement.created_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isEntry 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {isEntry ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              )}
                              {movement.transaction_type === 'in' ? 'Entrada' :
                               movement.transaction_type === 'out' ? 'Salida' :
                               movement.transaction_type === 'adjustment' ? 'Ajuste' :
                               movement.transaction_type === 'return' ? 'Devolución' :
                               movement.transaction_type === 'disposal' ? 'Desecho' :
                               movement.transaction_type === 'prescription_dispense' ? 'Dispensado' : 'Transferencia'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <span className={isEntry ? 'text-green-600' : 'text-red-600'}>
                              {isEntry ? '+' : '-'}{movement.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {movement.previous_quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {movement.new_quantity}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                            {movement.notes || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {movement.documents && movement.documents.length > 0 ? (
                              <a
                                href={movement.documents[0].file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800"
                              >
                                <FileText className="w-4 h-4" />
                                <span className="text-xs">{movement.documents[0].file_name}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {movement.profile?.full_name || 'Sistema'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay movimientos registrados para este producto</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
