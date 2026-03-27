import { useState, useEffect } from 'react';
import { FlaskConical, Plus, Calendar, CreditCard as Edit, Trash2, X } from 'lucide-react';
import { supabase, Product, ProductRecipe, ProductionBatch, RawMaterial } from '../lib/supabase';
import {
  buildProductionBatchConsumptionPlan,
  calculateProductionBatchCosts,
  getEstimatedRawMaterialUnitCost,
  getRecipeCostPer100Liters,
  getUnitsPerStandardBatch,
} from '../lib/productionModuleHelpers';

export default function ProductionModule() {
  const [view, setView] = useState<'recipes' | 'batches'>('recipes');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recipes, setRecipes] = useState<(ProductRecipe & { raw_materials?: { name: string; unit: string; current_cost: number } })[]>([]);
  const [batches, setBatches] = useState<(ProductionBatch & { products?: Product })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showEditRecipeModal, setShowEditRecipeModal] = useState(false);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<ProductRecipe | null>(null);
  const [availableMaterials, setAvailableMaterials] = useState<RawMaterial[]>([]);
  const [newIngredient, setNewIngredient] = useState({
    raw_material_id: '',
    quantity_per_100l: 0,
  });
  const [batchForm, setBatchForm] = useState({
    quantity_liters: 100,
    units_produced: 0,
    notes: '',
  });
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    product_id: '',
    format: '',
    product_type: 'concentrado' as 'concentrado' | 'sustrato' | 'rtu-gatillo',
    color: '',
    aroma: '',
    ph_target: '',
    production_unit_liters: 100,
    base_price: 0,
  });

  useEffect(() => {
    loadProducts();
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadRecipes(selectedProduct.id);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      if (data && data.length > 0) {
        setSelectedProduct(data[0]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_recipes')
        .select('*, raw_materials(name, unit, current_cost)')
        .eq('product_id', productId)
        .order('quantity_per_100l', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const loadBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('production_batches')
        .select('*, products(name, product_id, format)')
        .order('batch_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const loadAvailableMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableMaterials(data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  };

  const openEditRecipe = (recipe: ProductRecipe & { raw_materials?: { name: string; unit: string; current_cost: number } }) => {
    setEditingRecipe(recipe);
    setShowEditRecipeModal(true);
  };

  const updateRecipeQuantity = async (recipeId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('product_recipes')
        .update({ quantity_per_100l: newQuantity })
        .eq('id', recipeId);

      if (error) throw error;

      setShowEditRecipeModal(false);
      setEditingRecipe(null);
      if (selectedProduct) {
        loadRecipes(selectedProduct.id);
      }
      alert('Cantidad actualizada exitosamente');
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('Error al actualizar cantidad');
    }
  };

  const deleteRecipeIngredient = async (recipeId: string) => {
    if (!confirm('¿Estás seguro de eliminar este ingrediente de la fórmula?')) return;

    try {
      const { error } = await supabase
        .from('product_recipes')
        .delete()
        .eq('id', recipeId);

      if (error) throw error;

      if (selectedProduct) {
        loadRecipes(selectedProduct.id);
      }
      alert('Ingrediente eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting recipe ingredient:', error);
      alert('Error al eliminar ingrediente');
    }
  };

  const openAddIngredient = () => {
    loadAvailableMaterials();
    setShowAddIngredientModal(true);
  };

  const addIngredientToRecipe = async () => {
    if (!selectedProduct || !newIngredient.raw_material_id || newIngredient.quantity_per_100l <= 0) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const { error } = await supabase
        .from('product_recipes')
        .insert({
          product_id: selectedProduct.id,
          raw_material_id: newIngredient.raw_material_id,
          quantity_per_100l: newIngredient.quantity_per_100l,
        });

      if (error) throw error;

      setShowAddIngredientModal(false);
      setNewIngredient({ raw_material_id: '', quantity_per_100l: 0 });
      loadRecipes(selectedProduct.id);
      alert('Ingrediente agregado exitosamente');
    } catch (error) {
      console.error('Error adding ingredient:', error);
      alert('Error al agregar ingrediente');
    }
  };

  const createNewProduct = async () => {
    if (!newProductForm.name || !newProductForm.product_id || !newProductForm.format) {
      alert('Por favor completa los campos obligatorios: Nombre, Código y Formato');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProductForm.name,
          product_id: newProductForm.product_id,
          format: newProductForm.format,
          product_type: newProductForm.product_type,
          color: newProductForm.color || null,
          aroma: newProductForm.aroma || null,
          ph_target: newProductForm.ph_target ? parseFloat(newProductForm.ph_target) : null,
          production_unit_liters: newProductForm.production_unit_liters,
          base_price: newProductForm.base_price,
        })
        .select()
        .single();

      if (error) throw error;

      setShowNewProductModal(false);
      setNewProductForm({
        name: '',
        product_id: '',
        format: '',
        product_type: 'concentrado',
        color: '',
        aroma: '',
        ph_target: '',
        production_unit_liters: 100,
        base_price: 0,
      });
      await loadProducts();
      setSelectedProduct(data);
      alert('Producto creado exitosamente. Ahora puedes agregar ingredientes a la receta.');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error al crear producto. Verifica que el código no esté duplicado.');
    }
  };

  const deleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${productName}"? Esta acción no se puede deshacer y eliminará también su receta y lotes de producción.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

        if (selectedProduct?.id === productId) {
        setSelectedProduct(null);
        setRecipes([]);
      }

      await loadProducts();
      alert('Producto eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  };

  const calculateBatchCost = () => {
    if (!selectedProduct || recipes.length === 0) return 0;

    return calculateProductionBatchCosts(recipes, batchForm.quantity_liters, batchForm.units_produced).rawMaterialCost;
  };

  const createBatch = async () => {
    if (!selectedProduct) return;

    try {
      const costSummary = calculateProductionBatchCosts(
        recipes,
        batchForm.quantity_liters,
        batchForm.units_produced,
      );

      const batchNumber = `BATCH-${selectedProduct.product_id}-${Date.now()}`;
      const consumptionPlan = buildProductionBatchConsumptionPlan(recipes, batchForm.quantity_liters, batchNumber);

      const { error: batchError } = await supabase
        .from('production_batches')
        .insert({
          product_id: selectedProduct.id,
          batch_number: batchNumber,
          quantity_liters: batchForm.quantity_liters,
          units_produced: batchForm.units_produced,
          raw_material_cost: costSummary.rawMaterialCost,
          packaging_cost: costSummary.packagingCost,
          total_cost: costSummary.totalCost,
          cost_per_unit: costSummary.costPerUnit,
          notes: batchForm.notes,
        });

      if (batchError) throw batchError;

      for (const consumption of consumptionPlan) {
        const { data: currentMaterial, error: fetchError } = await supabase
          .from('raw_materials')
          .select('stock_quantity')
          .eq('id', consumption.rawMaterialId)
          .single();

        if (fetchError) throw fetchError;

        const newStock = currentMaterial.stock_quantity - consumption.quantityUsed;

        const { error: updateError } = await supabase
          .from('raw_materials')
          .update({ stock_quantity: newStock })
          .eq('id', consumption.rawMaterialId);

        if (updateError) throw updateError;

        await supabase
          .from('inventory_transactions')
          .insert({
            transaction_type: 'production_use',
            raw_material_id: consumption.rawMaterialId,
            quantity: -consumption.quantityUsed,
            notes: consumption.notes,
          });
      }

      setShowBatchModal(false);
      setBatchForm({ quantity_liters: 100, units_produced: 0, notes: '' });
      loadBatches();
      alert('Lote de producción creado exitosamente. Inventario actualizado.');
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Error al crear el lote de producción');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Producción</h2>
          <p className="text-slate-600 mt-1">Gestión de recetas y lotes de producción</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewProductModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Producto</span>
          </button>
          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Lote</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setView('recipes')}
              className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                view === 'recipes'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FlaskConical className="w-5 h-5" />
              <span className="font-medium">Recetas</span>
            </button>
            <button
              onClick={() => setView('batches')}
              className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                view === 'batches'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Historial de Lotes</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-slate-600 mt-4">Cargando datos de producción...</p>
          </div>
        ) : view === 'recipes' ? (
          <div className="p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Seleccionar Producto
              </label>
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  setSelectedProduct(product || null);
                }}
                className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.product_id})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="bg-slate-50 rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                    <div>
                      <p className="text-sm text-slate-600">Producto</p>
                      <p className="font-medium text-slate-900">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Formato</p>
                      <p className="font-medium text-slate-900">{selectedProduct.format}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Tipo</p>
                      <p className="font-medium text-slate-900">{selectedProduct.product_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Lote Estándar</p>
                      <p className="font-medium text-slate-900">{selectedProduct.production_unit_liters}L</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteProduct(selectedProduct.id, selectedProduct.name)}
                    className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Eliminar</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Receta Base (por 100 Litros)
              </h3>
              {selectedProduct && (
                <button
                  onClick={openAddIngredient}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Ingrediente</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Ingrediente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Costo Unitario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Costo Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {recipes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 mb-2">No hay ingredientes en esta receta</p>
                        <p className="text-sm text-slate-400 mb-4">Comienza agregando materias primas para crear la fórmula</p>
                        <button
                          onClick={openAddIngredient}
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Primer Ingrediente</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    recipes.map((recipe) => (
                    <tr key={recipe.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {recipe.raw_materials?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                        {recipe.quantity_per_100l} {recipe.raw_materials?.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                        {formatCurrency(recipe.raw_materials?.current_cost || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {formatCurrency((recipe.raw_materials?.current_cost || 0) * recipe.quantity_per_100l)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditRecipe(recipe)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Editar cantidad"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRecipeIngredient(recipe.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Eliminar ingrediente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )))}
                  {recipes.length > 0 && (() => {
                    const totalCost100L = getRecipeCostPer100Liters(recipes);
                    const format = selectedProduct?.format || '';
                    const unitsPerBatch = getUnitsPerStandardBatch(format);
                    const costPerUnit = getEstimatedRawMaterialUnitCost(recipes, format);

                    return (
                      <>
                        <tr className="bg-slate-50 font-semibold">
                          <td colSpan={3} className="px-6 py-4 text-right text-slate-900">
                            Costo Total (100L):
                          </td>
                          <td className="px-6 py-4 text-slate-900">
                            {formatCurrency(totalCost100L)}
                          </td>
                          <td></td>
                        </tr>
                        <tr className="bg-emerald-50 font-semibold">
                          <td colSpan={3} className="px-6 py-4 text-right text-emerald-900">
                            Unidades por Lote ({format}):
                          </td>
                          <td className="px-6 py-4 text-emerald-900">
                            {unitsPerBatch} unidades
                          </td>
                          <td></td>
                        </tr>
                        <tr className="bg-blue-50 font-semibold">
                          <td colSpan={3} className="px-6 py-4 text-right text-blue-900">
                            Costo MP Unitario:
                          </td>
                          <td className="px-6 py-4 text-blue-900">
                            {formatCurrency(costPerUnit)}
                          </td>
                          <td></td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Lote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Litros
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Unidades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Costo Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Costo/Unidad
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-600">
                      {batch.batch_number.split('-').pop()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{batch.products?.name}</div>
                      <div className="text-sm text-slate-500">{batch.products?.product_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      {new Date(batch.batch_date).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      {batch.quantity_liters}L
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900">
                      {batch.units_produced}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {formatCurrency(batch.total_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-emerald-600">
                      {formatCurrency(batch.cost_per_unit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showBatchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Crear Nuevo Lote</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Producto
                </label>
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProduct(product || null);
                  }}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cantidad (Litros)
                </label>
                <input
                  type="number"
                  value={batchForm.quantity_liters}
                  onChange={(e) => setBatchForm({ ...batchForm, quantity_liters: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Unidades Producidas
                </label>
                <input
                  type="number"
                  value={batchForm.units_produced}
                  onChange={(e) => setBatchForm({ ...batchForm, units_produced: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Costo Materias Primas:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(calculateBatchCost())}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600">Costo Empaque:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(batchForm.units_produced * 250)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Costo Total:</span>
                  <span className="text-emerald-600">{formatCurrency(calculateBatchCost() + (batchForm.units_produced * 250))}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowBatchModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createBatch}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Crear Lote
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditRecipeModal && editingRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Editar Cantidad</h3>
              <button
                onClick={() => {
                  setShowEditRecipeModal(false);
                  setEditingRecipe(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">Ingrediente</p>
                <p className="font-medium text-slate-900">{editingRecipe.raw_materials?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cantidad por 100L ({editingRecipe.raw_materials?.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingRecipe.quantity_per_100l}
                  id="editQuantity"
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditRecipeModal(false);
                  setEditingRecipe(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('editQuantity') as HTMLInputElement;
                  if (input) {
                    updateRecipeQuantity(editingRecipe.id, parseFloat(input.value));
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddIngredientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Agregar Ingrediente</h3>
              <button
                onClick={() => {
                  setShowAddIngredientModal(false);
                  setNewIngredient({ raw_material_id: '', quantity_per_100l: 0 });
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Materia Prima *
                </label>
                <select
                  value={newIngredient.raw_material_id}
                  onChange={(e) => setNewIngredient({ ...newIngredient, raw_material_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Seleccionar materia prima</option>
                  {availableMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cantidad por 100L *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newIngredient.quantity_per_100l}
                  onChange={(e) => setNewIngredient({ ...newIngredient, quantity_per_100l: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="0.00"
                />
                {newIngredient.raw_material_id && newIngredient.quantity_per_100l > 0 && (
                  <div className="mt-2 text-sm text-slate-600">
                    <span className="font-medium">Unidad: </span>
                    {availableMaterials.find(m => m.id === newIngredient.raw_material_id)?.unit}
                  </div>
                )}
              </div>

              {newIngredient.raw_material_id && newIngredient.quantity_per_100l > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-emerald-900 mb-1">
                    Costo estimado por 100L:
                  </p>
                  <p className="text-lg font-bold text-emerald-700">
                    {formatCurrency(
                      (availableMaterials.find(m => m.id === newIngredient.raw_material_id)?.current_cost || 0) *
                      newIngredient.quantity_per_100l
                    )}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Esta cantidad se usará como base para calcular los costos de producción.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddIngredientModal(false);
                  setNewIngredient({ raw_material_id: '', quantity_per_100l: 0 });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addIngredientToRecipe}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Crear Nuevo Producto</h3>
              <button
                onClick={() => {
                  setShowNewProductModal(false);
                  setNewProductForm({
                    name: '',
                    product_id: '',
                    format: '',
                    product_type: 'concentrado',
                    color: '',
                    aroma: '',
                    ph_target: '',
                    production_unit_liters: 100,
                    base_price: 0,
                  });
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Limpiador Multiusos Lavanda"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código del Producto *
                  </label>
                  <input
                    type="text"
                    value={newProductForm.product_id}
                    onChange={(e) => setNewProductForm({ ...newProductForm, product_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: CONC-LAV-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Formato *
                  </label>
                  <input
                    type="text"
                    value={newProductForm.format}
                    onChange={(e) => setNewProductForm({ ...newProductForm, format: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 500ml, 1L, RTU-500 cc, 5L"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Producto *
                  </label>
                  <select
                    value={newProductForm.product_type}
                    onChange={(e) => setNewProductForm({ ...newProductForm, product_type: e.target.value as 'concentrado' | 'sustrato' | 'rtu-gatillo' })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="concentrado">Concentrado</option>
                    <option value="sustrato">Sustrato</option>
                    <option value="rtu-gatillo">RTU-Gatillo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    value={newProductForm.color}
                    onChange={(e) => setNewProductForm({ ...newProductForm, color: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Morado, Transparente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Aroma
                  </label>
                  <input
                    type="text"
                    value={newProductForm.aroma}
                    onChange={(e) => setNewProductForm({ ...newProductForm, aroma: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Lavanda, Limón"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    pH Objetivo
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={newProductForm.ph_target}
                    onChange={(e) => setNewProductForm({ ...newProductForm, ph_target: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 7.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Unidad de Producción (Litros)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newProductForm.production_unit_liters}
                    onChange={(e) => setNewProductForm({ ...newProductForm, production_unit_liters: parseFloat(e.target.value) || 100 })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Precio Base
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProductForm.base_price}
                  onChange={(e) => setNewProductForm({ ...newProductForm, base_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Una vez creado el producto, podrás agregar los ingredientes para crear su receta.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowNewProductModal(false);
                  setNewProductForm({
                    name: '',
                    product_id: '',
                    format: '',
                    product_type: 'concentrado',
                    color: '',
                    aroma: '',
                    ph_target: '',
                    production_unit_liters: 100,
                    base_price: 0,
                  });
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createNewProduct}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
