import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, Users, ShoppingCart, AlertCircle, Package, ShieldAlert } from 'lucide-react';
import { calculateFactoryCost, getVolumeDiscount, VOLUME_DISCOUNTS } from '../lib/pricingHelpers';
import { supabase, Product, FixedCostsConfig } from '../lib/supabase';

interface PricingAnalysis {
  product: Product;
  rawMaterialCost: number;
  containerCost: number;
  packagingCost: number;
  labelCost: number;
  factoryCost: number;
  baseDistributorPrice: number;
  distributorPriceWithDiscount: number;
  finalMarginPercent: number;
  marginWarning: boolean;
  suggestedPVP: number;
  recommendedPVP70: number;
  currentShopifyPrice: number;
  priceDifference: number;
  priceDifferencePercent: number;
  ourMargin: number;
  distributorMargin: number;
  totalProfit: number;
}


export default function PricingSimulatorModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pricingAnalysis, setPricingAnalysis] = useState<PricingAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [ourMarginTarget, setOurMarginTarget] = useState(50);
  const [distributorMarginTarget, setDistributorMarginTarget] = useState(35);
  const [orderQuantity, setOrderQuantity] = useState(500);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const calculatePricingAnalysis = useCallback(async (
    prods: Product[],
    costs: FixedCostsConfig | null
  ) => {
    const volumeDiscount = getVolumeDiscount(orderQuantity);

    const analysisPromises = prods.map(async (product) => {
      const { data: recipes } = await supabase
        .from('product_recipes')
        .select('*, raw_materials(current_cost)')
        .eq('product_id', product.id);

      const rawMaterialCostPer100L = (recipes || []).reduce((total, recipe) => {
        const cost = recipe.raw_materials?.current_cost || 0;
        return total + (cost * recipe.quantity_per_100l);
      }, 0);

      const { rawMaterialCost, containerCost, labelCost, packagingCost, factoryCost } = calculateFactoryCost(
        product,
        costs,
        rawMaterialCostPer100L,
      );

      const baseDistributorPrice = factoryCost / (1 - ourMarginTarget / 100);

      const distributorPriceWithDiscount = baseDistributorPrice * (1 - volumeDiscount.discountPercent / 100);

      const finalMarginPercent = ((distributorPriceWithDiscount - factoryCost) / distributorPriceWithDiscount) * 100;
      const marginWarning = finalMarginPercent < 40;

      const suggestedPVP = distributorPriceWithDiscount / (1 - distributorMarginTarget / 100);

      const recommendedPVP70 = factoryCost / (1 - 0.70);

      const currentShopifyPrice = product.base_price;
      const priceDifference = suggestedPVP - currentShopifyPrice;
      const priceDifferencePercent = currentShopifyPrice > 0
        ? (priceDifference / currentShopifyPrice) * 100
        : 0;

      const ourMargin = ((baseDistributorPrice - factoryCost) / baseDistributorPrice) * 100;
      const distributorMargin = ((suggestedPVP - distributorPriceWithDiscount) / suggestedPVP) * 100;

      const totalProfit = (distributorPriceWithDiscount - factoryCost) * orderQuantity;

      return {
        product,
        rawMaterialCost,
        containerCost,
        packagingCost,
        labelCost,
        factoryCost,
        baseDistributorPrice,
        distributorPriceWithDiscount,
        finalMarginPercent,
        marginWarning,
        suggestedPVP,
        recommendedPVP70,
        currentShopifyPrice,
        priceDifference,
        priceDifferencePercent,
        ourMargin,
        distributorMargin,
        totalProfit,
      };
    });

    const analysis = await Promise.all(analysisPromises);
    setPricingAnalysis(analysis);
  }, [distributorMarginTarget, orderQuantity, ourMarginTarget]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, costsData] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('fixed_costs_config').select('*').limit(1).maybeSingle(),
      ]);

      if (productsData.error) throw productsData.error;
      if (costsData.error) throw costsData.error;

      const prods = productsData.data || [];
      const costs = costsData.data;

      setProducts(prods);

      if (prods.length > 0 && !selectedProduct) {
        setSelectedProduct(prods[0].id);
      }

      await calculatePricingAnalysis(prods, costs);
    } catch (error) {
      console.error('Error loading pricing data:', error);
    } finally {
      setLoading(false);
    }
  }, [calculatePricingAnalysis, selectedProduct]);

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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const currentDiscount = getVolumeDiscount(orderQuantity);
  const selectedAnalysis = pricingAnalysis.find(a => a.product.id === selectedProduct);
  const productsWithMarginWarning = pricingAnalysis.filter(a => a.marginWarning).length;

  const averageFactoryCost = pricingAnalysis.length > 0
    ? pricingAnalysis.reduce((sum, a) => sum + a.factoryCost, 0) / pricingAnalysis.length
    : 0;

  const averageSuggestedPVP = pricingAnalysis.length > 0
    ? pricingAnalysis.reduce((sum, a) => sum + a.suggestedPVP, 0) / pricingAnalysis.length
    : 0;

  const productsMisaligned = pricingAnalysis.filter(a => Math.abs(a.priceDifferencePercent) > 10).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Simulador de Precios y Distribución</h2>
          <p className="text-slate-600 mt-1">Cálculo de precios en cascada con descuentos por volumen</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="text-slate-600 mt-4">Calculando precios...</p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg shadow-sm border border-cyan-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Configuración de Márgenes y Volumen</h3>
              <p className="text-sm text-slate-600">Ajusta los márgenes y cantidad del pedido para simular diferentes escenarios</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Nuestro Margen (Venta a Distribuidor)</span>
                  </div>
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="20"
                    max="70"
                    step="5"
                    value={ourMarginTarget}
                    onChange={(e) => setOurMarginTarget(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="text-2xl font-bold text-emerald-600 w-20 text-right">
                    {ourMarginTarget}%
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Margen sobre nuestro costo de fabricación
                </p>
              </div>

              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Margen del Distribuidor (PVP)</span>
                  </div>
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="20"
                    max="50"
                    step="5"
                    value={distributorMarginTarget}
                    onChange={(e) => setDistributorMarginTarget(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="text-2xl font-bold text-blue-600 w-20 text-right">
                    {distributorMarginTarget}%
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Margen del distribuidor sobre su precio de venta
                </p>
              </div>

              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-violet-600" />
                    <span>Cantidad del Pedido (unidades)</span>
                  </div>
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-violet-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                  />
                  <div className="text-2xl font-bold text-violet-600 w-20 text-right">
                    {orderQuantity}
                  </div>
                </div>
                <div className="mt-2 bg-violet-50 rounded px-3 py-2 border border-violet-200">
                  <p className="text-xs font-bold text-violet-900">{currentDiscount.name} - {currentDiscount.discountPercent}% desc.</p>
                  <p className="text-xs text-violet-700">{currentDiscount.description}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-500">Nivel de Volumen</h3>
                <Package className="w-5 h-5 text-violet-600" />
              </div>
              <p className="text-3xl font-bold text-violet-600">
                {currentDiscount.name}
              </p>
              <p className="text-xs text-slate-500 mt-1">{currentDiscount.discountPercent}% descuento</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-500">Costo Fab. Prom.</h3>
                <DollarSign className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {formatCurrency(averageFactoryCost)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-500">PVP Sugerido Prom.</h3>
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrency(averageSuggestedPVP)}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-500">Requieren Ajuste</h3>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-600">
                {productsMisaligned}
              </p>
            </div>

            {productsWithMarginWarning > 0 && (
              <div className="bg-red-50 rounded-lg shadow-sm border-2 border-red-300 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-red-700">Margen Bajo</h3>
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {productsWithMarginWarning}
                </p>
                <p className="text-xs text-red-700 mt-1 font-medium">Margen &lt; 40%</p>
              </div>
            )}
          </div>

          {selectedAnalysis && (
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg shadow-lg border-2 border-violet-300 p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900 mb-1">Análisis Detallado por Volumen</h3>
                <p className="text-sm text-slate-600">Selecciona un producto para ver el impacto del volumen en precios y utilidades</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Producto Seleccionado:</label>
                <select
                  value={selectedProduct || ''}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 bg-white text-slate-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.format}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border-2 border-slate-200">
                  <div className="text-xs font-medium text-slate-500 uppercase mb-2">Costo Fabricación (C1)</div>
                  <div className="text-2xl font-bold text-slate-900">{formatCurrency(selectedAnalysis.factoryCost)}</div>
                  <div className="text-xs text-slate-500 mt-1">Por unidad</div>
                </div>

                <div className="bg-emerald-50 rounded-lg p-4 border-2 border-emerald-200">
                  <div className="text-xs font-medium text-emerald-700 uppercase mb-2">Precio Distribuidor Base</div>
                  <div className="text-2xl font-bold text-emerald-700">{formatCurrency(selectedAnalysis.baseDistributorPrice)}</div>
                  <div className="text-xs text-emerald-600 mt-1">Sin descuento</div>
                </div>

                <div className="bg-violet-50 rounded-lg p-4 border-2 border-violet-200">
                  <div className="text-xs font-medium text-violet-700 uppercase mb-2">Precio con Desc. {currentDiscount.discountPercent}%</div>
                  <div className="text-2xl font-bold text-violet-700">{formatCurrency(selectedAnalysis.distributorPriceWithDiscount)}</div>
                  <div className="text-xs text-violet-600 mt-1">Nivel {currentDiscount.name}</div>
                </div>

                <div className={`rounded-lg p-4 border-2 ${selectedAnalysis.marginWarning ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-200'}`}>
                  <div className={`text-xs font-medium uppercase mb-2 ${selectedAnalysis.marginWarning ? 'text-red-700' : 'text-blue-700'}`}>
                    PVP Sugerido
                  </div>
                  <div className={`text-2xl font-bold ${selectedAnalysis.marginWarning ? 'text-red-700' : 'text-blue-700'}`}>
                    {formatCurrency(selectedAnalysis.suggestedPVP)}
                  </div>
                  <div className={`text-xs mt-1 ${selectedAnalysis.marginWarning ? 'text-red-600' : 'text-blue-600'}`}>
                    Al público final
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-sm font-medium text-slate-700 mb-2">Tu Margen Final</div>
                  <div className={`text-3xl font-bold ${selectedAnalysis.marginWarning ? 'text-red-600' : 'text-emerald-600'}`}>
                    {formatPercent(selectedAnalysis.finalMarginPercent)}
                  </div>
                  {selectedAnalysis.marginWarning && (
                    <div className="mt-2 flex items-center space-x-2 text-red-600">
                      <ShieldAlert className="w-4 h-4" />
                      <span className="text-xs font-bold">Margen bajo del 40%</span>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="text-sm font-medium text-slate-700 mb-2">Utilidad por Unidad</div>
                  <div className="text-3xl font-bold text-slate-900">
                    {formatCurrency(selectedAnalysis.distributorPriceWithDiscount - selectedAnalysis.factoryCost)}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg p-4 border-2 border-emerald-300">
                  <div className="text-sm font-bold text-emerald-900 mb-2">Utilidad Total ({orderQuantity} un.)</div>
                  <div className="text-3xl font-bold text-emerald-700">
                    {formatCurrency(selectedAnalysis.totalProfit)}
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-white rounded-lg p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3">Comparativa de Escenarios de Volumen</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {VOLUME_DISCOUNTS.map((discount) => {
                    const discountedPrice = selectedAnalysis.baseDistributorPrice * (1 - discount.discountPercent / 100);
                    const margin = ((discountedPrice - selectedAnalysis.factoryCost) / discountedPrice) * 100;
                    const profit = (discountedPrice - selectedAnalysis.factoryCost) * discount.minQuantity;
                    const isWarning = margin < 40;
                    const isActive = currentDiscount.level === discount.level;

                    return (
                      <div
                        key={discount.level}
                        className={`rounded-lg p-4 border-2 ${
                          isActive
                            ? 'bg-violet-50 border-violet-400 shadow-md'
                            : isWarning
                              ? 'bg-red-50 border-red-200'
                              : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-bold ${isActive ? 'text-violet-900' : 'text-slate-900'}`}>
                            {discount.name}
                          </span>
                          {isWarning && <ShieldAlert className="w-4 h-4 text-red-600" />}
                        </div>
                        <div className="text-xs text-slate-600 mb-2">{discount.minQuantity}+ unidades</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Descuento:</span>
                            <span className="font-semibold">{discount.discountPercent}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Precio:</span>
                            <span className="font-semibold">{formatCurrency(discountedPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Margen:</span>
                            <span className={`font-semibold ${isWarning ? 'text-red-600' : 'text-emerald-600'}`}>
                              {formatPercent(margin)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200">
                            <span className="text-slate-600">Utilidad:</span>
                            <span className="font-bold text-slate-900">{formatCurrency(profit)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Simulación de Precios por Producto</h3>
              <p className="text-sm text-slate-600 mt-1">
                Análisis con {orderQuantity} unidades - Descuento {currentDiscount.discountPercent}% ({currentDiscount.name})
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Formato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      C1 Fabricación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Precio Base Dist.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Precio c/Desc.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Margen Final
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      PVP Sugerido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      PVP Recomendado (70%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Utilidad Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {pricingAnalysis.map((analysis) => (
                    <tr
                      key={analysis.product.id}
                      className={`hover:bg-slate-50 cursor-pointer ${
                        selectedProduct === analysis.product.id ? 'bg-violet-50' : ''
                      } ${
                        analysis.marginWarning ? 'bg-red-50' : ''
                      }`}
                      onClick={() => setSelectedProduct(analysis.product.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{ backgroundColor: analysis.product.color || '#94a3b8' }}
                          />
                          <div className="font-medium text-slate-900">{analysis.product.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-700">{analysis.product.format}</div>
                        <div className="text-xs text-slate-500">
                          Envase: {formatCurrency(analysis.containerCost)} | Etiq: {formatCurrency(analysis.labelCost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{formatCurrency(analysis.factoryCost)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-700">{formatCurrency(analysis.baseDistributorPrice)}</div>
                        <div className="text-xs text-slate-500">Margen {formatPercent(analysis.ourMargin)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-violet-700">{formatCurrency(analysis.distributorPriceWithDiscount)}</div>
                        <div className="text-xs text-violet-600">-{currentDiscount.discountPercent}% desc.</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-bold text-lg ${analysis.marginWarning ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatPercent(analysis.finalMarginPercent)}
                        </div>
                        {analysis.marginWarning && (
                          <div className="flex items-center space-x-1 text-red-600">
                            <ShieldAlert className="w-3 h-3" />
                            <span className="text-xs font-bold">Bajo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-blue-700">{formatCurrency(analysis.suggestedPVP)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-amber-700 text-lg">{formatCurrency(analysis.recommendedPVP70)}</div>
                        <div className="text-xs text-amber-600">70% margen directo</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-emerald-700 text-lg">{formatCurrency(analysis.totalProfit)}</div>
                        <div className="text-xs text-slate-500">{orderQuantity} unidades</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Información del Sistema de Precios</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-violet-600" />
                  <span>Matriz de Costos por Formato</span>
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="font-medium text-slate-700">100 cc:</span>
                    <span className="text-slate-900">Envase $350 | Etiqueta $80</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="font-medium text-slate-700">200 cc:</span>
                    <span className="text-slate-900">Envase $450 | Etiqueta $100</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-medium text-slate-700">500 cc RTU:</span>
                    <span className="text-slate-900">Envase $550 | Etiqueta $150</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-3 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Escala de Descuentos por Volumen</span>
                </h4>
                <div className="space-y-2 text-sm">
                  {VOLUME_DISCOUNTS.map((discount) => (
                    <div key={discount.level} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="font-medium text-slate-700">
                        {discount.name} ({discount.minQuantity}+ un.):
                      </span>
                      <span className="text-slate-900 font-bold">{discount.discountPercent}% desc.</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-5 border-2 border-red-200">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-900 mb-2">Protección de Margen</h4>
                  <p className="text-sm text-red-800">
                    El sistema alerta cuando el margen de fábrica (después de descuentos por volumen) baja del <strong>40%</strong>.
                    Esto asegura que mantengas rentabilidad incluso con descuentos agresivos para volúmenes altos.
                  </p>
                  {productsWithMarginWarning > 0 && (
                    <p className="text-sm text-red-900 font-bold mt-2">
                      Actualmente {productsWithMarginWarning} producto(s) tienen margen bajo del 40% con el volumen de {orderQuantity} unidades.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
