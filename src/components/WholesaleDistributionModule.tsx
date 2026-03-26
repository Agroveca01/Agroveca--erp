import { useState, useEffect } from 'react';
import { Package, TrendingUp, DollarSign, Target, Truck, Calculator, AlertTriangle, FileText, CheckCircle, Receipt } from 'lucide-react';
import { supabase, Product, FormatCost, FixedCostsConfig } from '../lib/supabase';
import { calculateNetFromGross, IVA_RATE, formatVATPercentage } from '../lib/taxUtils';

interface ProductCostBreakdown {
  product: Product;
  rawMaterialCost: number;
  containerCost: number;
  packagingCost: number;
  labelCost: number;
  totalCost: number;
  pvpGross: number;
  pvpNet: number;
  pvpVAT: number;
  distributorPriceGross: number;
  distributorPriceNet: number;
  distributorVAT: number;
  ctpProfitNet: number;
}

interface QuotationItem {
  product: Product;
  quantity: number;
  pvpGross: number;
  pvpNet: number;
  pvpVAT: number;
  discount: number;
  netPriceGross: number;
  netPriceNet: number;
  netPriceVAT: number;
  subtotalGross: number;
  subtotalNet: number;
  subtotalVAT: number;
}

interface Quotation {
  items: QuotationItem[];
  subtotalGross: number;
  subtotalNet: number;
  subtotalVAT: number;
  shippingCost: number;
  totalGross: number;
  totalNet: number;
  totalVAT: number;
  totalCtpProfitNet: number;
  totalCostsNet: number;
}

export default function WholesaleDistributionModule() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productCosts, setProductCosts] = useState<ProductCostBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const [quotationItems, setQuotationItems] = useState<{ [key: string]: number }>({});
  const [editableShippingCost, setEditableShippingCost] = useState(5000);
  const [shippingZone, setShippingZone] = useState('');
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [moqError, setMoqError] = useState<string | null>(null);

  const DISTRIBUTOR_DISCOUNT = 0.40;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateQuotation();
  }, [quotationItems, editableShippingCost, productCosts]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, formatCostsData, fixedCostsData] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('format_costs').select('*'),
        supabase.from('fixed_costs_config').select('*').limit(1).maybeSingle(),
      ]);

      if (productsData.error) throw productsData.error;
      if (formatCostsData.error) throw formatCostsData.error;
      if (fixedCostsData.error) throw fixedCostsData.error;

      const prods = productsData.data || [];
      const formats = formatCostsData.data || [];
      const costs = fixedCostsData.data;

      setProducts(prods);

      await calculateProductCosts(prods, formats, costs);
    } catch (error) {
      console.error('Error loading wholesale data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFormatCostsByProduct = (product: Product, formats: FormatCost[], fallbackCosts: FixedCostsConfig | null): { container: number; label: number } => {
    const formatLower = product.format.toLowerCase();

    for (const fc of formats) {
      const fcNameLower = fc.format_name.toLowerCase();
      if (formatLower.includes(fcNameLower.replace('cc', '').replace('rtu', '').trim())) {
        return { container: fc.container_cost, label: fc.label_cost };
      }
    }

    return {
      container: fallbackCosts?.container_cost || 450,
      label: fallbackCosts?.label_cost || 150
    };
  };

  const calculateProductCosts = async (prods: Product[], formats: FormatCost[], costs: FixedCostsConfig | null) => {
    const costsPromises = prods.map(async (product) => {
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

      const totalCost = rawMaterialCost + containerCost + packagingCost + labelCost;

      const pvpGross = product.base_price;
      const pvpBreakdown = calculateNetFromGross(pvpGross);

      const distributorPriceGross = pvpGross * (1 - DISTRIBUTOR_DISCOUNT);
      const distributorBreakdown = calculateNetFromGross(distributorPriceGross);

      const ctpProfitNet = distributorBreakdown.net - totalCost;

      return {
        product,
        rawMaterialCost,
        containerCost,
        packagingCost,
        labelCost,
        totalCost,
        pvpGross,
        pvpNet: pvpBreakdown.net,
        pvpVAT: pvpBreakdown.vat,
        distributorPriceGross,
        distributorPriceNet: distributorBreakdown.net,
        distributorVAT: distributorBreakdown.vat,
        ctpProfitNet,
      };
    });

    const costs_breakdown = await Promise.all(costsPromises);
    setProductCosts(costs_breakdown);
  };

  const getProductMOQ = (product: Product): number => {
    const formatLower = product.format.toLowerCase();

    if (formatLower.includes('rtu') && formatLower.includes('500')) {
      return 12;
    }

    if (formatLower.includes('100') || formatLower.includes('200')) {
      return 12;
    }

    return 12;
  };

  const validateMOQ = (): string | null => {
    for (const [productId, quantity] of Object.entries(quotationItems)) {
      if (quantity > 0) {
        const product = products.find(p => p.id === productId);
        if (product) {
          const moq = getProductMOQ(product);
          if (quantity < moq) {
            return `${product.name} requiere un mínimo de ${moq} unidades. Actualmente: ${quantity} unidades.`;
          }
        }
      }
    }
    return null;
  };

  const calculateQuotation = () => {
    const items: QuotationItem[] = [];
    let subtotalGross = 0;
    let subtotalNet = 0;
    let subtotalVAT = 0;
    let totalCtpProfitNet = 0;
    let totalCostsNet = 0;

    for (const [productId, quantity] of Object.entries(quotationItems)) {
      if (quantity > 0) {
        const costBreakdown = productCosts.find(pc => pc.product.id === productId);
        if (costBreakdown) {
          const discount = costBreakdown.pvpGross * DISTRIBUTOR_DISCOUNT;
          const netPriceGross = costBreakdown.distributorPriceGross;
          const netPriceBreakdown = calculateNetFromGross(netPriceGross);

          const itemSubtotalGross = netPriceGross * quantity;
          const itemSubtotalNet = netPriceBreakdown.net * quantity;
          const itemSubtotalVAT = netPriceBreakdown.vat * quantity;

          items.push({
            product: costBreakdown.product,
            quantity,
            pvpGross: costBreakdown.pvpGross,
            pvpNet: costBreakdown.pvpNet,
            pvpVAT: costBreakdown.pvpVAT,
            discount,
            netPriceGross,
            netPriceNet: netPriceBreakdown.net,
            netPriceVAT: netPriceBreakdown.vat,
            subtotalGross: itemSubtotalGross,
            subtotalNet: itemSubtotalNet,
            subtotalVAT: itemSubtotalVAT,
          });

          subtotalGross += itemSubtotalGross;
          subtotalNet += itemSubtotalNet;
          subtotalVAT += itemSubtotalVAT;
          totalCtpProfitNet += costBreakdown.ctpProfitNet * quantity;
          totalCostsNet += costBreakdown.totalCost * quantity;
        }
      }
    }

    if (items.length > 0) {
      const totalGross = subtotalGross + editableShippingCost;
      const totalNet = subtotalNet + (editableShippingCost / (1 + IVA_RATE));
      const totalVAT = totalGross - totalNet;
      const finalCtpProfit = totalCtpProfitNet - (editableShippingCost / (1 + IVA_RATE));

      setQuotation({
        items,
        subtotalGross,
        subtotalNet,
        subtotalVAT,
        shippingCost: editableShippingCost,
        totalGross,
        totalNet,
        totalVAT,
        totalCtpProfitNet: finalCtpProfit,
        totalCostsNet,
      });
    } else {
      setQuotation(null);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuotationItems(prev => ({
      ...prev,
      [productId]: Math.max(0, quantity)
    }));
  };

  const handleGenerateQuotation = () => {
    const error = validateMOQ();
    if (error) {
      setMoqError(error);
      return;
    }
    setMoqError(null);
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
          <h2 className="text-2xl font-bold text-slate-900">Ventas Mayoristas (Fuera de Shopify)</h2>
          <p className="text-slate-600 mt-1">Cotizaciones con descuento 40% fijo - Valores Netos + IVA {formatVATPercentage()}</p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#10b981]"></div>
          <p className="text-slate-600 mt-4">Cargando catálogo mayorista...</p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-sm border border-blue-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calculator className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-900">Reglas de Cotización</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-900">Descuento Fijo</h4>
                </div>
                <p className="text-3xl font-bold text-blue-700">40%</p>
                <p className="text-xs text-slate-600 mt-1">Sobre PVP Shopify</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-slate-900">MOQ Mínimo</h4>
                </div>
                <p className="text-3xl font-bold text-amber-700">12 un.</p>
                <p className="text-xs text-slate-600 mt-1">RTU-500cc y Concentrados</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  <h4 className="font-bold text-slate-900">IVA {formatVATPercentage()}</h4>
                </div>
                <p className="text-xs text-slate-600 mt-1">Desglosado en factura</p>
                <p className="text-xs text-slate-600">Formato legal</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#10b981]/10 to-cyan-50">
              <h3 className="text-lg font-semibold text-slate-900">Catálogo de Productos para Distribuidores</h3>
              <p className="text-sm text-slate-600 mt-1">Precios mostrados incluyen desglose de IVA</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      MOQ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      PVP Bruto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Descuento 40%
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Precio Dist. Bruto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Precio Neto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      IVA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Utilidad CTP Neta/un.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {productCosts.map((pc) => {
                    const moq = getProductMOQ(pc.product);
                    const quantity = quotationItems[pc.product.id] || 0;
                    const meetsMinimum = quantity === 0 || quantity >= moq;

                    return (
                      <tr key={pc.product.id} className={`hover:bg-slate-50 ${!meetsMinimum ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-3"
                              style={{ backgroundColor: pc.product.color || '#94a3b8' }}
                            />
                            <div>
                              <div className="font-medium text-slate-900">{pc.product.name}</div>
                              <div className="text-xs text-slate-500">{pc.product.format}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            {moq} un.
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-slate-500 line-through text-sm">{formatCurrency(pc.pvpGross)}</div>
                          <div className="text-xs text-slate-400">Neto: {formatCurrency(pc.pvpNet)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-red-600 font-bold">-{formatCurrency(pc.pvpGross * DISTRIBUTOR_DISCOUNT)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-[#10b981]">{formatCurrency(pc.distributorPriceGross)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-blue-700">{formatCurrency(pc.distributorPriceNet)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600">{formatCurrency(pc.distributorVAT)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`font-bold ${pc.ctpProfitNet > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(pc.ctpProfitNet)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(pc.product.id, parseInt(e.target.value) || 0)}
                            className={`w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                              !meetsMinimum ? 'border-red-400 bg-red-50' : 'border-slate-300'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-sm border border-amber-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Truck className="w-6 h-6 text-amber-600" />
              <h3 className="text-lg font-semibold text-slate-900">Configuración de Envío</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Zona Geográfica (Opcional)
                </label>
                <input
                  type="text"
                  value={shippingZone}
                  onChange={(e) => setShippingZone(e.target.value)}
                  placeholder="Ej: Santiago Centro, Valparaíso, Concepción"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Costo de Envío Mayorista (Bruto)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={editableShippingCost}
                  onChange={(e) => setEditableShippingCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-bold text-lg bg-amber-50"
                />
                <p className="text-xs text-slate-600 mt-1">
                  Incluye IVA - Neto: {formatCurrency(editableShippingCost / (1 + IVA_RATE))}
                </p>
              </div>
            </div>
          </div>

          {moqError && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-red-900 mb-1">No se puede generar la cotización</h4>
                <p className="text-sm text-red-800">{moqError}</p>
              </div>
            </div>
          )}

          {quotation && (
            <>
              <div className="bg-white rounded-lg shadow-lg border-2 border-[#10b981]/50 overflow-hidden">
                <div className="px-6 py-4 bg-[#10b981] text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6" />
                      <h3 className="text-xl font-bold">Cotización Mayorista - Formato Factura Legal</h3>
                    </div>
                    <button
                      onClick={handleGenerateQuotation}
                      className="flex items-center space-x-2 bg-white text-[#10b981] px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors font-bold"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Validar MOQ</span>
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b-2 border-slate-300">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Producto</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">PVP Bruto</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Desc. 40%</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Precio Neto</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">IVA</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Total Bruto</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Cantidad</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 uppercase">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {quotation.items.map((item) => (
                          <tr key={item.product.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: item.product.color || '#94a3b8' }}
                                />
                                <div>
                                  <div className="font-medium text-slate-900">{item.product.name}</div>
                                  <div className="text-xs text-slate-500">{item.product.format}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500 line-through text-sm">
                              {formatCurrency(item.pvpGross)}
                            </td>
                            <td className="px-4 py-3 text-right text-red-600 font-bold text-sm">
                              -{formatCurrency(item.discount)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-blue-700">
                              {formatCurrency(item.netPriceNet)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {formatCurrency(item.netPriceVAT)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-[#10b981]">
                              {formatCurrency(item.netPriceGross)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 text-lg">
                              {formatCurrency(item.subtotalGross)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={7} className="px-4 py-3 text-right font-bold text-slate-700">
                            Subtotal Neto:
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-blue-700 text-lg">
                            {formatCurrency(quotation.subtotalNet)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={7} className="px-4 py-3 text-right font-bold text-slate-700">
                            IVA ({formatVATPercentage()}):
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700 text-lg">
                            {formatCurrency(quotation.subtotalVAT)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={7} className="px-4 py-3 text-right font-bold text-slate-700">
                            Subtotal Bruto:
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900 text-lg">
                            {formatCurrency(quotation.subtotalGross)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={7} className="px-4 py-3 text-right font-bold text-slate-700">
                            Envío {shippingZone && `(${shippingZone})`}:
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-amber-700 text-lg">
                            {formatCurrency(quotation.shippingCost)}
                          </td>
                        </tr>
                        <tr className="bg-emerald-50">
                          <td colSpan={7} className="px-4 py-4 text-right font-bold text-emerald-900 text-lg uppercase">
                            Total a Pagar (Bruto):
                          </td>
                          <td className="px-4 py-4 text-right font-bold text-[#10b981] text-2xl">
                            {formatCurrency(quotation.totalGross)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center space-x-2">
                      <Receipt className="w-5 h-5" />
                      <span>Desglose Tributario</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white rounded p-3 border border-blue-200">
                        <div className="text-xs text-slate-600 mb-1">Total Neto</div>
                        <div className="text-xl font-bold text-blue-700">{formatCurrency(quotation.totalNet)}</div>
                      </div>
                      <div className="bg-white rounded p-3 border border-blue-200">
                        <div className="text-xs text-slate-600 mb-1">IVA Total ({formatVATPercentage()})</div>
                        <div className="text-xl font-bold text-slate-700">{formatCurrency(quotation.totalVAT)}</div>
                      </div>
                      <div className="bg-white rounded p-3 border border-emerald-200">
                        <div className="text-xs text-[#10b981] mb-1 font-bold">Total Bruto</div>
                        <div className="text-xl font-bold text-[#10b981]">{formatCurrency(quotation.totalGross)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-lg border-2 border-green-300 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DollarSign className="w-7 h-7 text-green-600" />
                  <h3 className="text-xl font-bold text-slate-900">Resumen de Rentabilidad CTP (Valores Netos)</h3>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                  Utilidad líquida calculada sobre valores netos, después de descontar todos los costos
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg p-5 border-2 border-blue-200">
                    <div className="text-xs font-medium text-blue-700 uppercase mb-2">Total Costos Netos</div>
                    <div className="text-sm text-slate-600 mb-2">MP + Envase + Empaque + Etiqueta</div>
                    <div className="text-2xl font-bold text-blue-700">{formatCurrency(quotation.totalCostsNet)}</div>
                  </div>

                  <div className="bg-white rounded-lg p-5 border-2 border-amber-200">
                    <div className="text-xs font-medium text-amber-700 uppercase mb-2">Costo de Envío Neto</div>
                    <div className="text-sm text-slate-600 mb-2">{shippingZone || 'Zona por definir'}</div>
                    <div className="text-2xl font-bold text-amber-700">
                      {formatCurrency(editableShippingCost / (1 + IVA_RATE))}
                    </div>
                    <div className="text-xs text-amber-600 mt-1">
                      + IVA: {formatCurrency(editableShippingCost - (editableShippingCost / (1 + IVA_RATE)))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-5 border-2 border-green-400">
                    <div className="text-xs font-medium text-green-900 uppercase mb-2 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Utilidad Líquida CTP Neta</span>
                    </div>
                    <div className="text-sm text-green-700 mb-2">Ganancia sobre valores netos</div>
                    <div className="text-3xl font-bold text-green-700">{formatCurrency(quotation.totalCtpProfitNet)}</div>
                  </div>
                </div>

                <div className="mt-6 bg-white rounded-lg p-5 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-3">Desglose Detallado (Valores Netos)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">Ingresos Totales Netos:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(quotation.subtotalNet)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">(-) Costos de Insumos (Netos):</span>
                      <span className="font-bold text-red-600">-{formatCurrency(quotation.totalCostsNet)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-200">
                      <span className="text-slate-600">(-) Costo de Envío/Flete (Neto):</span>
                      <span className="font-bold text-red-600">
                        -{formatCurrency(editableShippingCost / (1 + IVA_RATE))}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 bg-green-50 rounded px-3 border-2 border-green-300">
                      <span className="font-bold text-green-900 text-base">(=) Utilidad Líquida CTP (Neta):</span>
                      <span className="font-bold text-green-700 text-xl">{formatCurrency(quotation.totalCtpProfitNet)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <Calculator className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <p className="font-bold mb-2">Ventaja del IVA Crédito:</p>
                      <p>
                        Los costos de insumos (envases, etiquetas, empaque) te permiten recuperar el IVA como crédito fiscal.
                        Esta utilidad neta ya considera que puedes descontar el IVA pagado en tus compras del IVA cobrado en tus ventas.
                        Tu obligación tributaria real es solo por la diferencia (IVA Débito - IVA Crédito).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
