import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Plus, CreditCard as Edit, Trash2, Package2, Beaker, X, Search } from 'lucide-react';
import { filterProducts, filterRawMaterials, isLowStockMaterial } from '../lib/inventoryHelpers';
import {
  DEFAULT_PRODUCT_FORM,
  DEFAULT_RAW_MATERIAL_FORM,
  getInventorySearchSummary,
  getInventorySummary,
  mapProductToForm,
  mapRawMaterialToForm,
} from '../lib/inventoryModuleHelpers';
import { Product, ProductType, RawMaterial, RawMaterialCategory, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

export default function InventoryModule() {
  const { isOperator } = useAuth();
  const [view, setView] = useState<'raw' | 'finished'>('raw');
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RawMaterial | Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rawMaterialForm, setRawMaterialForm] = useState(DEFAULT_RAW_MATERIAL_FORM);
  const [productForm, setProductForm] = useState(DEFAULT_PRODUCT_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (view === 'raw') {
        const { data, error } = await supabase
          .from('raw_materials')
          .select('*')
          .order('name');

        if (error) throw error;
        setRawMaterials(data || []);
      } else {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');

        if (error) throw error;
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      chemical: 'bg-blue-100 text-blue-700',
      natural: 'bg-green-100 text-green-700',
      base: 'bg-slate-100 text-slate-700',
      fragrance: 'bg-pink-100 text-pink-700',
      colorant: 'bg-purple-100 text-purple-700',
      substrate_component: 'bg-amber-100 text-amber-700',
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  };

  const filteredRawMaterials = filterRawMaterials(rawMaterials, searchTerm);

  const filteredProducts = filterProducts(products, searchTerm);

  const addRawMaterial = async () => {
    try {
      if (!rawMaterialForm.name) {
        alert('Por favor ingrese el nombre del material');
        return;
      }

      const { error } = await supabase
        .from('raw_materials')
        .insert({
          name: rawMaterialForm.name,
          category: rawMaterialForm.category,
          unit: rawMaterialForm.unit,
          stock_quantity: rawMaterialForm.stock_quantity,
          min_stock_alert: rawMaterialForm.min_stock_alert,
          current_cost: rawMaterialForm.current_cost,
        });

      if (error) throw error;

      setShowAddModal(false);
      setRawMaterialForm(DEFAULT_RAW_MATERIAL_FORM);
      loadData();
      alert('Materia prima agregada exitosamente');
    } catch (error) {
      console.error('Error adding raw material:', error);
      alert('Error al agregar materia prima');
    }
  };

  const addProduct = async () => {
    try {
      if (!productForm.product_id || !productForm.name) {
        alert('Por favor complete todos los campos requeridos');
        return;
      }

      const { error } = await supabase
        .from('products')
        .insert({
          product_id: productForm.product_id,
          name: productForm.name,
          product_type: productForm.product_type,
          format: productForm.format,
          color: productForm.color,
          base_price: productForm.base_price,
        });

      if (error) throw error;

      setShowAddModal(false);
      setProductForm(DEFAULT_PRODUCT_FORM);
      loadData();
      alert('Producto agregado exitosamente');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al agregar producto');
    }
  };

  const openEditRawMaterial = (material: RawMaterial) => {
    setEditingItem(material);
    setRawMaterialForm(mapRawMaterialToForm(material));
    setShowEditModal(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingItem(product);
    setProductForm(mapProductToForm(product));
    setShowEditModal(true);
  };

  const { totalRawMaterialValue, inventoryItemCount, lowStockCount } = getInventorySummary(rawMaterials, products, view);
  const searchSummary = getInventorySearchSummary(view, filteredRawMaterials.length, filteredProducts.length);

  const updateRawMaterial = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('raw_materials')
        .update({
          name: rawMaterialForm.name,
          category: rawMaterialForm.category,
          unit: rawMaterialForm.unit,
          stock_quantity: rawMaterialForm.stock_quantity,
          min_stock_alert: rawMaterialForm.min_stock_alert,
          current_cost: rawMaterialForm.current_cost,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      await supabase.rpc('recalculate_all_product_costs');

      setShowEditModal(false);
      setEditingItem(null);
      setRawMaterialForm(DEFAULT_RAW_MATERIAL_FORM);
      loadData();
      alert('Materia prima actualizada. Costos de productos recalculados automáticamente.');
    } catch (error) {
      console.error('Error updating raw material:', error);
      alert('Error al actualizar materia prima');
    }
  };

  const updateProduct = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: productForm.name,
          product_type: productForm.product_type,
          format: productForm.format,
          color: productForm.color,
          base_price: productForm.base_price,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingItem(null);
      setProductForm(DEFAULT_PRODUCT_FORM);
      loadData();
      alert('Producto actualizado exitosamente');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error al actualizar producto');
    }
  };

  const deleteRawMaterial = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este material? Esto puede afectar las fórmulas de productos existentes.')) return;

    try {
      const { error } = await supabase
        .from('raw_materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
      alert('Material eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Error al eliminar material');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadData();
      alert('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar producto');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Inventario</h2>
          <p className="text-slate-600 mt-1">Gestión de materias primas y productos terminados</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Agregar</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setView('raw')}
              className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                view === 'raw'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Beaker className="w-5 h-5" />
              <span className="font-medium">Materias Primas</span>
            </button>
            <button
              onClick={() => setView('finished')}
              className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                view === 'finished'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package2 className="w-5 h-5" />
              <span className="font-medium">Productos Terminados</span>
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-slate-200">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm"
              placeholder={view === 'raw' ? 'Buscar materias primas...' : 'Buscar productos...'}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-slate-600">
              {searchSummary.message}
            </p>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-slate-600 mt-4">Cargando inventario...</p>
          </div>
        ) : view === 'raw' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stock
                  </th>
                  {!isOperator && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Costo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Valor Total
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredRawMaterials.length === 0 ? (
                  <tr>
                    <td colSpan={isOperator ? 4 : 6} className="px-6 py-8 text-center text-slate-500">
                      {searchTerm ? 'No se encontraron materias primas con ese criterio de búsqueda' : 'No hay materias primas registradas'}
                    </td>
                  </tr>
                ) : (
                  filteredRawMaterials.map((material) => (
                  <tr key={material.id} className={isLowStockMaterial(material) ? 'bg-red-50' : 'hover:bg-slate-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isLowStockMaterial(material) && (
                          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                        )}
                        <span className="font-medium text-slate-900">{material.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(material.category)}`}>
                        {material.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      {material.stock_quantity.toFixed(2)} {material.unit}
                    </td>
                    {!isOperator && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                          {formatCurrency(material.current_cost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                          {formatCurrency(material.current_cost * material.stock_quantity)}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditRawMaterial(material)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Editar materia prima"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteRawMaterial(material.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Eliminar materia prima"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Formato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Precio Base
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      {searchTerm ? 'No se encontraron productos con ese criterio de búsqueda' : 'No hay productos registrados'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: product.color || '#94a3b8' }}
                        />
                        <span className="font-medium text-slate-900">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {product.product_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.product_type === 'concentrado'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {product.product_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      {product.format}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {formatCurrency(product.base_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditProduct(product)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Editar producto"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isOperator && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Valor Total Materias Primas</h3>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalRawMaterialValue)}
            </p>
          </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Items en Inventario</h3>
          <p className="text-2xl font-bold text-slate-900">
            {inventoryItemCount}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Alertas de Stock Bajo</h3>
          <p className="text-2xl font-bold text-red-600">
            {lowStockCount}
          </p>
        </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">
              {view === 'raw' ? 'Agregar Materia Prima' : 'Agregar Producto Terminado'}
            </h3>

            {view === 'raw' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={rawMaterialForm.name}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Nombre del material"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={rawMaterialForm.category}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, category: e.target.value as RawMaterialCategory })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="chemical">Chemical</option>
                    <option value="natural">Natural</option>
                    <option value="base">Base</option>
                    <option value="fragrance">Fragrance</option>
                    <option value="colorant">Colorant</option>
                    <option value="substrate_component">Substrate Component</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unidad
                    </label>
                    <select
                      value={rawMaterialForm.unit}
                      onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, unit: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="units">units</option>
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rawMaterialForm.stock_quantity}
                      onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, stock_quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Alerta Stock Mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rawMaterialForm.min_stock_alert}
                      onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, min_stock_alert: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  {!isOperator && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Costo Actual (CLP)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rawMaterialForm.current_cost}
                        onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, current_cost: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                {!isOperator && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Valor Total Inventario:</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(rawMaterialForm.current_cost * rawMaterialForm.stock_quantity)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código de Producto *
                  </label>
                  <input
                    type="text"
                    value={productForm.product_id}
                    onChange={(e) => setProductForm({ ...productForm, product_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="SKU-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Nombre del producto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tipo
                    </label>
                    <select
                    value={productForm.product_type}
                    onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value as ProductType })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="concentrado">Concentrado</option>
                    <option value="sustrato">Sustrato</option>
                    <option value="rtu-gatillo">RTU Gatillo</option>
                  </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Formato
                    </label>
                    <input
                      type="text"
                      value={productForm.format}
                      onChange={(e) => setProductForm({ ...productForm, format: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="500ml, 1L, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Color
                    </label>
                    <input
                      type="color"
                      value={productForm.color}
                      onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                      className="w-full h-10 px-2 py-1 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Precio Base (CLP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.base_price}
                      onChange={(e) => setProductForm({ ...productForm, base_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Precio Base:</span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(productForm.base_price)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setRawMaterialForm(DEFAULT_RAW_MATERIAL_FORM);
                  setProductForm(DEFAULT_PRODUCT_FORM);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={view === 'raw' ? addRawMaterial : addProduct}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {view === 'raw' ? 'Editar Materia Prima' : 'Editar Producto Terminado'}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {view === 'raw' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={rawMaterialForm.name}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Nombre del material"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={rawMaterialForm.category}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, category: e.target.value as RawMaterialCategory })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="chemical">Chemical</option>
                    <option value="natural">Natural</option>
                    <option value="base">Base</option>
                    <option value="fragrance">Fragrance</option>
                    <option value="colorant">Colorant</option>
                    <option value="substrate_component">Substrate Component</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unidad
                    </label>
                    <select
                      value={rawMaterialForm.unit}
                      onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, unit: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="kg">kg</option>
                      <option value="L">L</option>
                      <option value="units">units</option>
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={rawMaterialForm.stock_quantity}
                      onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, stock_quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Alerta de Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rawMaterialForm.min_stock_alert}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, min_stock_alert: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Costo por {rawMaterialForm.unit} (CLP)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rawMaterialForm.current_cost}
                    onChange={(e) => setRawMaterialForm({ ...rawMaterialForm, current_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Importante:</strong> Al cambiar el costo, todos los productos que usan este material se recalcularán automáticamente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código de Producto
                  </label>
                  <input
                    type="text"
                    value={productForm.product_id}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Nombre del producto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tipo
                    </label>
                  <select
                    value={productForm.product_type}
                    onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value as ProductType })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="concentrado">Concentrado</option>
                    <option value="sustrato">Sustrato</option>
                    <option value="rtu-gatillo">RTU Gatillo</option>
                  </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Formato
                    </label>
                    <input
                      type="text"
                      value={productForm.format}
                      onChange={(e) => setProductForm({ ...productForm, format: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="500ml, 1L, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Color
                    </label>
                    <input
                      type="color"
                      value={productForm.color}
                      onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                      className="w-full h-10 px-2 py-1 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Precio Base (CLP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.base_price}
                      onChange={(e) => setProductForm({ ...productForm, base_price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={view === 'raw' ? updateRawMaterial : updateProduct}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
