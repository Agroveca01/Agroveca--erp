import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Settings, Save, AlertTriangle, CreditCard as Edit2, X } from 'lucide-react';
import { calculateEditableMetrics, EditableCostRow, getFormatCostsByProduct } from '../lib/costingHelpers';
import { supabase, Product, BusinessConfig, FixedCostsConfig, FormatCost } from '../lib/supabase';

interface ProductCostAnalysis {
  product: Product;
  rawMaterialCost: number;
  containerCost: number;
  packagingCost: number;
  labelCost: number;
  shippingCost: number;
  totalCost: number;
  basePrice: number;
  commission: number;
  netProfit: number;
  netMargin: number;
}

interface EditableRow {
  [key: string]: {
    rawMaterialCost: number;
    containerCost: number;
    packagingCost: number;
    labelCost: number;
    shippingCost: number;
    basePrice: number;
  };
}

export default function CostingModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<ProductCostAnalysis[]>([]);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [fixedCosts, setFixedCosts] = useState<FixedCostsConfig | null>(null);
  const [formatCosts, setFormatCosts] = useState<FormatCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCosts, setEditingCosts] = useState(false);
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editableData, setEditableData] = useState<EditableRow>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tempCosts, setTempCosts] = useState({
    container_cost: 450,
    packaging_cost: 500,
    label_cost: 150,
    shipping_cost: 750,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, configData, costsData, formatCostsData] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('business_config').select('*').limit(1).maybeSingle(),
        supabase.from('fixed_costs_config').select('*').limit(1).maybeSingle(),
        supabase.from('format_costs').select('*'),
      ]);

      if (productsData.error) throw productsData.error;
      if (configData.error) throw configData.error;
      if (costsData.error) throw costsData.error;
      if (formatCostsData.error) throw formatCostsData.error;

      const prods = productsData.data || [];
      const config = configData.data;
      const costs = costsData.data;
      const formats = formatCostsData.data || [];

      setProducts(prods);
      setBusinessConfig(config);
      setFixedCosts(costs);
      setFormatCosts(formats);

      if (costs) {
        setTempCosts({
          container_cost: costs.container_cost,
          packaging_cost: costs.packaging_cost,
          label_cost: costs.label_cost,
          shipping_cost: costs.shipping_cost,
        });
      }

      await calculateCostAnalysis(prods, config, costs, formats);
    } catch (error) {
      console.error('Error loading costing data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateCostAnalysis = async (
    prods: Product[],
    config: BusinessConfig | null,
    costs: FixedCostsConfig | null,
    formats: FormatCost[]
  ) => {
    const analysisPromises = prods.map(async (product) => {
      const { data: recipes } = await supabase
        .from('product_recipes')
        .select('*, raw_materials(current_cost)')
        .eq('product_id', product.id);

      const rawMaterialCostPer100L = (recipes || []).reduce((total, recipe) => {
        const cost = recipe.raw_materials?.current_cost || 0;
        return total + (cost * recipe.quantity_per_100l);
      }, 0);

      const unitsPerBatch = product.units_per_batch || 1;
      const rawMaterialCost = unitsPerBatch > 0 ? rawMaterialCostPer100L / unitsPerBatch : rawMaterialCostPer100L;

      const formatCostData = getFormatCostsByProduct(product, formats, costs);
      const containerCost = formatCostData.container;
      const labelCost = formatCostData.label;
      const packagingCost = costs?.packaging_cost || 500;
      const shippingCost = costs?.shipping_cost || 750;

      const totalCost = rawMaterialCost + containerCost + packagingCost + labelCost + shippingCost;
      const basePrice = product.base_price;
      const commission = config ? (basePrice * config.shopify_commission_pct / 100) : 0;
      const netProfit = basePrice - totalCost - commission;
      const netMargin = basePrice > 0 ? (netProfit / basePrice) * 100 : 0;

      return {
        product,
        rawMaterialCost,
        containerCost,
        packagingCost,
        labelCost,
        shippingCost,
        totalCost,
        basePrice,
        commission,
        netProfit,
        netMargin,
      };
    });

    const analysis = await Promise.all(analysisPromises);
    setCostAnalysis(analysis);
  };

  const handleSaveFixedCosts = async () => {
    try {
      if (!fixedCosts) return;

      const { error } = await supabase
        .from('fixed_costs_config')
        .update({
          container_cost: tempCosts.container_cost,
          packaging_cost: tempCosts.packaging_cost,
          label_cost: tempCosts.label_cost,
          shipping_cost: tempCosts.shipping_cost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', fixedCosts.id);

      if (error) throw error;

      setEditingCosts(false);
      await loadData();
    } catch (error) {
      console.error('Error saving fixed costs:', error);
      alert('Error al guardar los costos fijos');
    }
  };

  const startEditingRow = (productId: string, analysis: ProductCostAnalysis) => {
    setEditingRows(prev => new Set(prev).add(productId));
    setEditableData(prev => ({
      ...prev,
      [productId]: {
        rawMaterialCost: analysis.rawMaterialCost,
        containerCost: analysis.containerCost,
        packagingCost: analysis.packagingCost,
        labelCost: analysis.labelCost,
        shippingCost: analysis.shippingCost,
        basePrice: analysis.basePrice,
      }
    }));
  };

  const cancelEditingRow = (productId: string) => {
    setEditingRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
    setEditableData(prev => {
      const newData = { ...prev };
      delete newData[productId];
      return newData;
    });
  };

  const updateEditableField = (productId: string, field: keyof EditableRow[string], value: number) => {
    setEditableData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const calculateRealTimeMetrics = (productId: string, analysis: ProductCostAnalysis) => {
    if (!editingRows.has(productId)) {
      return {
        totalCost: analysis.totalCost,
        netProfit: analysis.netProfit,
        netMargin: analysis.netMargin,
        commission: analysis.commission,
      };
    }

    const data = editableData[productId];
    if (!data) return {
      totalCost: analysis.totalCost,
      netProfit: analysis.netProfit,
      netMargin: analysis.netMargin,
      commission: analysis.commission,
    };

    return calculateEditableMetrics(data as EditableCostRow, businessConfig);
  };

  const handleSaveAllChanges = async () => {
    try {
      const updatePromises = [];

      for (const [productId, data] of Object.entries(editableData)) {
        const product = products.find(p => p.id === productId);
        if (!product) continue;

        if (data.basePrice !== product.base_price) {
          updatePromises.push(
            supabase
              .from('products')
              .update({ base_price: data.basePrice })
              .eq('id', productId)
          );
        }

        const formatLower = product.format.toLowerCase();
        const matchingFormat = formatCosts.find(fc => {
          const fcNameLower = fc.format_name.toLowerCase();
          return formatLower.includes(fcNameLower.replace('cc', '').replace('rtu', '').trim());
        });

        if (matchingFormat && (data.containerCost !== matchingFormat.container_cost || data.labelCost !== matchingFormat.label_cost)) {
          updatePromises.push(
            supabase
              .from('format_costs')
              .update({
                container_cost: data.containerCost,
                label_cost: data.labelCost,
                updated_at: new Date().toISOString(),
              })
              .eq('id', matchingFormat.id)
          );
        }
      }

      if (editableData[Object.keys(editableData)[0]]) {
        const firstData = editableData[Object.keys(editableData)[0]];

        if (fixedCosts && (firstData.packagingCost !== fixedCosts.packaging_cost || firstData.shippingCost !== fixedCosts.shipping_cost)) {
          updatePromises.push(
            supabase
              .from('fixed_costs_config')
              .update({
                packaging_cost: firstData.packagingCost,
                shipping_cost: firstData.shippingCost,
                updated_at: new Date().toISOString(),
              })
              .eq('id', fixedCosts.id)
          );
        }
      }

      await Promise.all(updatePromises);

      setEditingRows(new Set());
      setEditableData({});
      setHasUnsavedChanges(false);
      await loadData();

      alert('Cambios guardados exitosamente. Los cambios se reflejarán en el módulo de Mayoristas.');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error al guardar los cambios');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 70) return 'text-emerald-600';
    if (margin >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMarginBgColor = (margin: number) => {
    if (margin >= 70) return 'bg-emerald-50';
    if (margin >= 50) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getMarginBorderColor = (margin: number) => {
    if (margin >= 70) return 'border-emerald-200';
    if (margin >= 50) return 'border-yellow-200';
    return 'border-red-200';
  };

  const getMarginLabel = (margin: number) => {
    if (margin >= 70) return 'Óptimo';
    if (margin >= 50) return 'Advertencia';
    return 'Crítico';
  };

  const averageMargin = costAnalysis.length > 0
    ? costAnalysis.reduce((sum, a) => sum + a.netMargin, 0) / costAnalysis.length
    : 0;

  const productsAbove70 = costAnalysis.filter(a => a.netMargin >= 70).length;
  const productsBetween50And70 = costAnalysis.filter(a => a.netMargin >= 50 && a.netMargin < 70).length;
  const productsBelow50 = costAnalysis.filter(a => a.netMargin < 50).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Finanzas y Costos</h2>
          <p className="text-slate-600 mt-1">Análisis de costos y rentabilidad por producto</p>
        </div>
        {hasUnsavedChanges && (
          <button
            onClick={handleSaveAllChanges}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg animate-pulse"
          >
            <Save className="w-5 h-5" />
            <span className="font-bold">Guardar Cambios</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="text-slate-600 mt-4">Calculando costos...</p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Costos Fijos por Unidad</h3>
                  <p className="text-sm text-slate-600">Configuración global aplicada a todos los productos</p>
                </div>
              </div>
              {!editingCosts ? (
                <button
                  onClick={() => setEditingCosts(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Editar</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingCosts(false);
                      if (fixedCosts) {
                        setTempCosts({
                          container_cost: fixedCosts.container_cost,
                          packaging_cost: fixedCosts.packaging_cost,
                          label_cost: fixedCosts.label_cost,
                          shipping_cost: fixedCosts.shipping_cost,
                        });
                      }
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveFixedCosts}
                    className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Envase (Botella + Gatillo/Tapa)
                </label>
                {editingCosts ? (
                  <input
                    type="number"
                    value={tempCosts.container_cost}
                    onChange={(e) => setTempCosts({ ...tempCosts, container_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-lg"
                  />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(tempCosts.container_cost)}</p>
                )}
              </div>

              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Empaque (Caja/Bolsa/Cinta)
                </label>
                {editingCosts ? (
                  <input
                    type="number"
                    value={tempCosts.packaging_cost}
                    onChange={(e) => setTempCosts({ ...tempCosts, packaging_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-lg"
                  />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(tempCosts.packaging_cost)}</p>
                )}
              </div>

              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Etiqueta (Resistente)
                </label>
                {editingCosts ? (
                  <input
                    type="number"
                    value={tempCosts.label_cost}
                    onChange={(e) => setTempCosts({ ...tempCosts, label_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-lg"
                  />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(tempCosts.label_cost)}</p>
                )}
              </div>

              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Envío (Logística)
                </label>
                {editingCosts ? (
                  <input
                    type="number"
                    value={tempCosts.shipping_cost}
                    onChange={(e) => setTempCosts({ ...tempCosts, shipping_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-semibold text-lg"
                  />
                ) : (
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(tempCosts.shipping_cost)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-500">Margen Promedio Neto</h3>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className={`text-3xl font-bold ${getMarginColor(averageMargin)}`}>
                {formatPercent(averageMargin)}
              </p>
            </div>

            <div className="bg-emerald-50 rounded-lg shadow-sm border border-emerald-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-emerald-700">Productos Óptimos</h3>
                <div className="text-emerald-600 font-bold">≥70%</div>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{productsAbove70}</p>
            </div>

            <div className="bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-700">Advertencia</h3>
                <div className="text-yellow-600 font-bold">50-69%</div>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{productsBetween50And70}</p>
            </div>

            <div className="bg-red-50 rounded-lg shadow-sm border border-red-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-red-700">Críticos</h3>
                <div className="text-red-600 font-bold">&lt;50%</div>
              </div>
              <p className="text-3xl font-bold text-red-600">{productsBelow50}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Desglose Completo de Costos por Producto</h3>
                  <p className="text-sm text-slate-600 mt-1">Tabla 100% editable - Haz clic en editar para modificar cualquier valor</p>
                </div>
                <div className="flex items-center space-x-2 bg-blue-100 px-3 py-2 rounded-lg border border-blue-300">
                  <Edit2 className="w-4 h-4 text-blue-700" />
                  <span className="text-sm font-medium text-blue-900">Celdas editables</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      MP Unit.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Envase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Empaque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Etiqueta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Envío
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Costo Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Precio Venta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Comisión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Utilidad Neta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Margen Neto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {costAnalysis.map((analysis) => {
                    const isEditing = editingRows.has(analysis.product.id);
                    const metrics = calculateRealTimeMetrics(analysis.product.id, analysis);
                    const displayData = isEditing ? editableData[analysis.product.id] : null;

                    return (
                      <tr key={analysis.product.id} className={`hover:bg-slate-50 ${getMarginBgColor(metrics.netMargin)} transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {!isEditing ? (
                            <button
                              onClick={() => startEditingRow(analysis.product.id, analysis)}
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>Editar</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => cancelEditingRow(analysis.product.id)}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancelar</span>
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: analysis.product.color || '#94a3b8' }}
                            />
                            <div>
                              <div className="font-medium text-slate-900">{analysis.product.name}</div>
                              <div className="text-sm text-slate-500">{analysis.product.format}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing && displayData ? (
                            <input
                              type="number"
                              value={displayData.rawMaterialCost}
                              onChange={(e) => updateEditableField(analysis.product.id, 'rawMaterialCost', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-blue-50"
                            />
                          ) : (
                            <span className="text-slate-900">{formatCurrency(analysis.rawMaterialCost)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing && displayData ? (
                            <input
                              type="number"
                              value={displayData.containerCost}
                              onChange={(e) => updateEditableField(analysis.product.id, 'containerCost', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-blue-50"
                            />
                          ) : (
                            <span className="text-slate-900">{formatCurrency(analysis.containerCost)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing && displayData ? (
                            <input
                              type="number"
                              value={displayData.packagingCost}
                              onChange={(e) => updateEditableField(analysis.product.id, 'packagingCost', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-blue-50"
                            />
                          ) : (
                            <span className="text-slate-900">{formatCurrency(analysis.packagingCost)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing && displayData ? (
                            <input
                              type="number"
                              value={displayData.labelCost}
                              onChange={(e) => updateEditableField(analysis.product.id, 'labelCost', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-blue-50"
                            />
                          ) : (
                            <span className="text-slate-900">{formatCurrency(analysis.labelCost)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing && displayData ? (
                            <input
                              type="number"
                              value={displayData.shippingCost}
                              onChange={(e) => updateEditableField(analysis.product.id, 'shippingCost', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-blue-50"
                            />
                          ) : (
                            <span className="text-slate-900">{formatCurrency(analysis.shippingCost)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                          {formatCurrency(metrics.totalCost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isEditing && displayData ? (
                            <input
                              type="number"
                              value={displayData.basePrice}
                              onChange={(e) => updateEditableField(analysis.product.id, 'basePrice', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 bg-blue-50 font-bold"
                            />
                          ) : (
                            <span className="font-bold text-slate-900">{formatCurrency(analysis.basePrice)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-red-600">
                          -{formatCurrency(metrics.commission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600">
                          {formatCurrency(metrics.netProfit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold text-lg ${getMarginColor(metrics.netMargin)}`}>
                              {formatPercent(metrics.netMargin)}
                            </span>
                            {metrics.netMargin < 50 && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          </div>
                          <div className={`text-xs font-medium mt-1 ${getMarginColor(metrics.netMargin)}`}>
                            {getMarginLabel(metrics.netMargin)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {hasUnsavedChanges && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <div>
                  <h4 className="font-bold text-amber-900">Cambios Sin Guardar</h4>
                  <p className="text-sm text-amber-700">Tienes modificaciones pendientes. No olvides guardar tus cambios.</p>
                </div>
              </div>
              <button
                onClick={handleSaveAllChanges}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg"
              >
                <Save className="w-5 h-5" />
                <span className="font-bold">Guardar Todos los Cambios</span>
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Ejemplos de Desglose Detallado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {costAnalysis.slice(0, 2).map((analysis) => (
                <div
                  key={analysis.product.id}
                  className={`rounded-lg p-5 border-2 ${getMarginBorderColor(analysis.netMargin)} ${getMarginBgColor(analysis.netMargin)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900 text-lg">{analysis.product.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getMarginColor(analysis.netMargin)}`}>
                      {getMarginLabel(analysis.netMargin)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="font-medium text-slate-900">Precio de Venta:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(analysis.basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Costo MP Unitario:</span>
                      <span className="text-red-600">-{formatCurrency(analysis.rawMaterialCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Envase (Botella+Gatillo):</span>
                      <span className="text-red-600">-{formatCurrency(analysis.containerCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Empaque (Caja/Bolsa):</span>
                      <span className="text-red-600">-{formatCurrency(analysis.packagingCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Etiqueta:</span>
                      <span className="text-red-600">-{formatCurrency(analysis.labelCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Envío/Logística:</span>
                      <span className="text-red-600">-{formatCurrency(analysis.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-300">
                      <span>Comisión Shopify ({businessConfig?.shopify_commission_pct}%):</span>
                      <span className="text-red-600">-{formatCurrency(analysis.commission)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t-2 border-slate-300 font-semibold">
                      <span className="text-slate-900">Utilidad Neta:</span>
                      <span className="text-emerald-600 text-lg">
                        {formatCurrency(analysis.netProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-900 font-medium">Margen Neto:</span>
                      <span className={`font-bold text-2xl ${getMarginColor(analysis.netMargin)}`}>
                        {formatPercent(analysis.netMargin)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Guía de Alertas de Margen</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-emerald-600 rounded-full"></div>
                  <span className="font-bold text-emerald-900">Margen Óptimo (≥70%)</span>
                </div>
                <p className="text-sm text-emerald-700">Productos con excelente rentabilidad. Continuar con estrategia actual.</p>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="font-bold text-yellow-900">Advertencia (50-69%)</span>
                </div>
                <p className="text-sm text-yellow-700">Margen aceptable pero mejorable. Revisar costos o ajustar precio.</p>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-bold text-red-900">Crítico (&lt;50%)</span>
                </div>
                <p className="text-sm text-red-700">Rentabilidad baja. Acción inmediata requerida para mejorar márgenes.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
