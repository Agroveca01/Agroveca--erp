import { useState, useEffect } from 'react';
import { TrendingUp, Package, Target, AlertTriangle, TrendingDown, Calculator, Receipt, Truck, CheckCircle, BarChart3, Download } from 'lucide-react';
import { supabase, Product, BusinessConfig, SalesOrder, FormatCost, FixedCostsConfig } from '../lib/supabase';
import { calculateNetFromGross, formatVATPercentage } from '../lib/taxUtils';
import { generateProductDataSheet } from '../lib/pdfGenerator';
import ExpirationAlerts from './ExpirationAlerts';
import AnnouncementWall from './AnnouncementWall';
import DailyTasksBoard from './DailyTasksBoard';

interface ProductRealCost {
  product: Product;
  rawMaterialCost: number;
  containerCost: number;
  packagingCost: number;
  labelCost: number;
  shippingCost: number;
  totalProductionCost: number;
  basePriceGross: number;
  basePriceNet: number;
  basePriceVAT: number;
  shopifyCommissionGross: number;
  shopifyCommissionNet: number;
  realCost: number;
  netProfitNet: number;
  netMarginNet: number;
  distributorPriceGross: number;
  distributorPriceNet: number;
  distributorVAT: number;
  ctpProfitNetPerUnit: number;
  vatToReserve: number;
  unitsPerBatch: number;
}

interface WholesaleSimulation {
  [productId: string]: number;
}

type ViewMode = 'dashboard' | 'wholesale-simulator';

export default function DashboardModule() {
  const [products, setProducts] = useState<ProductRealCost[]>([]);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSimulator, setShowSimulator] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  const DISTRIBUTOR_DISCOUNT = 0.40;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [productsData, configData, ordersData, formatCostsData, fixedCostsData] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('business_config').select('*').limit(1).maybeSingle(),
        supabase.from('sales_orders').select('*').order('order_date', { ascending: false }),
        supabase.from('format_costs').select('*'),
        supabase.from('fixed_costs_config').select('*').limit(1).maybeSingle(),
      ]);

      if (productsData.error) throw productsData.error;
      if (configData.error) throw configData.error;
      if (ordersData.error) throw ordersData.error;
      if (formatCostsData.error) throw formatCostsData.error;
      if (fixedCostsData.error) throw fixedCostsData.error;

      const config = configData.data;
      const formats = formatCostsData.data || [];
      const costs = fixedCostsData.data;
      setBusinessConfig(config);
      setOrders(ordersData.data || []);

      const productsWithCosts = await Promise.all(
        (productsData.data || []).map(async (product) => {
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

          const totalProductionCost = rawMaterialCost + containerCost + packagingCost + labelCost;

          const basePriceGross = product.base_price;
          const basePriceBreakdown = calculateNetFromGross(basePriceGross);
          const basePriceNet = basePriceBreakdown.net;
          const basePriceVAT = basePriceBreakdown.vat;

          const shopifyCommissionNet = basePriceNet * 0.05;
          const shopifyCommissionGross = shopifyCommissionNet * 1.19;

          const realCost = totalProductionCost + shopifyCommissionNet + shippingCost;
          const netProfitNet = basePriceNet - realCost;
          const netMarginNet = basePriceNet > 0 ? (netProfitNet / basePriceNet) * 100 : 0;

          const distributorPriceGross = basePriceGross * (1 - DISTRIBUTOR_DISCOUNT);
          const distributorBreakdown = calculateNetFromGross(distributorPriceGross);
          const distributorPriceNet = distributorBreakdown.net;
          const distributorVAT = distributorBreakdown.vat;

          const ctpProfitNetPerUnit = distributorPriceNet - totalProductionCost;

          const vatToReserve = basePriceVAT;

          return {
            product,
            rawMaterialCost,
            containerCost,
            packagingCost,
            labelCost,
            shippingCost,
            totalProductionCost,
            basePriceGross,
            basePriceNet,
            basePriceVAT,
            shopifyCommissionGross,
            shopifyCommissionNet,
            realCost,
            netProfitNet,
            netMarginNet,
            distributorPriceGross,
            distributorPriceNet,
            distributorVAT,
            ctpProfitNetPerUnit,
            vatToReserve,
            unitsPerBatch,
          };
        })
      );

      setProducts(productsWithCosts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
    if (margin >= 70) return 'text-[#10b981]';
    if (margin >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyOrders = orders.filter(order => {
    const orderDate = new Date(order.order_date);
    return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
  });

  const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const monthlyRevenueBreakdown = calculateNetFromGross(monthlyRevenue);

  const averageMargin = products.length > 0
    ? products.reduce((sum, p) => sum + p.netMarginNet, 0) / products.length
    : 0;

  const totalVATDebit = monthlyRevenueBreakdown.vat;

  if (viewMode === 'wholesale-simulator') {
    return (
      <WholesaleDistributorView
        products={products}
        onBack={() => setViewMode('dashboard')}
        loading={loading}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight">Dashboard Financiero</h2>
          <p className="text-[#10b981] mt-2 font-medium text-lg">Gestión de IVA y Distribución Mayorista</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode('wholesale-simulator')}
            className="btn-warning flex items-center space-x-2"
          >
            <Truck className="w-5 h-5" />
            <span>Simulador Distribuidores</span>
          </button>
          <button
            onClick={() => setShowSimulator(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Calculator className="w-5 h-5" />
            <span>Simulador Shopify</span>
          </button>
        </div>
      </div>

      <ExpirationAlerts />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnnouncementWall />
        <DailyTasksBoard />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card glass-card-hover rounded-2xl p-6 gradient-emerald">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Ingresos del Mes</h3>
            <div className="bg-[#10b981]/30 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-300" />
            </div>
          </div>
          <p className="text-4xl font-bold text-white mb-3">
            {formatCurrency(monthlyRevenue)}
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Neto:</span>
              <span className="font-bold text-emerald-300">{formatCurrency(monthlyRevenueBreakdown.net)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">IVA:</span>
              <span className="font-bold text-amber-400">{formatCurrency(monthlyRevenueBreakdown.vat)}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <p className="text-sm text-slate-300 font-medium">{monthlyOrders.length} ventas este mes</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6 gradient-amber">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider">IVA Débito Mes</h3>
            <div className="bg-amber-500/30 p-3 rounded-xl shadow-lg shadow-amber-500/20">
              <Receipt className="w-6 h-6 text-amber-300" />
            </div>
          </div>
          <p className="text-4xl font-bold text-amber-100 mb-3">
            {formatCurrency(totalVATDebit)}
          </p>
          <p className="text-sm text-amber-300 font-medium mt-2">
            {formatVATPercentage()} sobre ventas
          </p>
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <p className="text-xs text-amber-200">IVA a declarar (estimado)</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#10b981] uppercase tracking-wider">Margen Promedio</h3>
            <div className="bg-[#10b981]/30 p-3 rounded-xl">
              <Target className="w-6 h-6 text-[#10b981]" />
            </div>
          </div>
          <p className={`text-4xl font-bold mb-3 ${getMarginColor(averageMargin)}`}>
            {formatPercent(averageMargin)}
          </p>
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <p className="text-sm text-slate-400">sobre valores netos</p>
          </div>
        </div>

        <div className="glass-card glass-card-hover rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Productos</h3>
            <div className="bg-slate-700/50 p-3 rounded-xl shadow-lg">
              <Package className="w-6 h-6 text-slate-300" />
            </div>
          </div>
          <p className="text-4xl font-bold text-white mb-3">{products.length}</p>
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <p className="text-sm text-slate-400">en catálogo activo</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-[#10b981]/30">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-[#10b981] p-4 rounded-xl">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Resumen Fiscal - IVA {formatVATPercentage()}</h3>
            <p className="text-[#10b981] text-sm font-medium mt-1">Proyección basada en ventas del mes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-semibold">IVA Débito (Cobrado)</div>
            <div className="text-3xl font-bold text-amber-400">{formatCurrency(totalVATDebit)}</div>
            <div className="text-xs text-slate-400 mt-2">De {formatCurrency(monthlyRevenue)} en ventas</div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-semibold">IVA Crédito (Recuperable)</div>
            <div className="text-3xl font-bold text-[#10b981]">Según Compras</div>
            <div className="text-xs text-slate-400 mt-2">IVA de envases, etiquetas, MP</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-5 border border-orange-500/50 shadow-lg shadow-orange-500/20">
            <div className="text-xs text-orange-100 uppercase tracking-wider mb-3 font-bold">Obligación Tributaria</div>
            <div className="text-3xl font-bold text-white">{formatCurrency(totalVATDebit)}</div>
            <div className="text-xs text-orange-100 mt-2">IVA Débito - IVA Crédito</div>
          </div>
        </div>

        <div className="mt-6 glass-card rounded-xl p-4 border border-[#10b981]/20">
          <p className="text-sm text-slate-300 leading-relaxed">
            <strong className="text-[#10b981]">Nota:</strong> El IVA Crédito recuperable depende del IVA pagado en tus compras de insumos (envases, etiquetas, materias primas).
            Tu obligación real es solo la diferencia entre lo que cobraste (IVA Débito) y lo que pagaste (IVA Crédito).
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-8 py-5 border-b border-slate-700/50 bg-gradient-to-r from-emerald-900/30 to-emerald-800/20">
          <h3 className="text-xl font-bold text-white">Rentabilidad por Producto (Canal Shopify)</h3>
          <p className="text-sm text-[#10b981] mt-2 font-medium">Precio Venta incluye IVA - Comisión Shopify 5% sobre Neto</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-[#10b981] border-t-transparent"></div>
            <p className="text-slate-400 mt-4 font-medium">Cargando datos...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    PVP Bruto (c/IVA)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    PVP Neto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    IVA a Reservar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Costo Neto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Comisión (5%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Utilidad Neta Real
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Margen Neto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Ficha Técnica
                  </th>
                </tr>
              </thead>
              <tbody className="glass-card divide-y divide-slate-700">
                {products.map((item) => (
                  <tr key={item.product.id} className="hover:bg-slate-800/70">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: item.product.color || '#94a3b8' }}
                        />
                        <div>
                          <div className="font-medium text-white">{item.product.name}</div>
                          <div className="text-sm text-slate-300">{item.product.format}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-white">
                      {formatCurrency(item.basePriceGross)}
                      <div className="text-xs text-slate-300 mt-1">IVA incluido</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-blue-300">
                      {formatCurrency(item.basePriceNet)}
                      <div className="text-xs text-slate-300 mt-1">{formatCurrency(item.basePriceGross)} / 1.19</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-amber-300">
                      {formatCurrency(item.vatToReserve)}
                      <div className="text-xs text-amber-200 mt-1">Débito Fiscal</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      <div className="text-xs text-slate-300">MP: {formatCurrency(item.rawMaterialCost)}</div>
                      <div className="text-xs text-slate-300">Env+Emp+Eti: {formatCurrency(item.containerCost + item.packagingCost + item.labelCost)}</div>
                      <div className="text-xs text-slate-300">Envío: {formatCurrency(item.shippingCost)}</div>
                      <div className="font-semibold text-red-300">{formatCurrency(item.realCost - item.shopifyCommissionNet)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-red-300">
                      -{formatCurrency(item.shopifyCommissionNet)}
                      <div className="text-xs text-slate-300 mt-1">5% del Neto</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-300">
                      {formatCurrency(item.netProfitNet)}
                      <div className="text-xs text-slate-300 mt-1">Neto - Costos - Comisión</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold ${getMarginColor(item.netMarginNet)}`}>
                        {formatPercent(item.netMarginNet)}
                      </span>
                      {item.netMarginNet < 50 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AlertTriangle className="w-3 h-3 text-red-300" />
                          <span className="text-xs text-red-300">Crítico</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => generateProductDataSheet(item.product)}
                        className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-semibold"
                        title="Descargar Ficha Técnica"
                      >
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg shadow-sm border border-emerald-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-900">Productos Más Rentables</h3>
              <p className="text-sm text-emerald-700">Por margen neto (sobre valores netos)</p>
            </div>
          </div>
          <div className="space-y-3">
            {products
              .sort((a, b) => b.netMarginNet - a.netMarginNet)
              .slice(0, 3)
              .map((item) => (
                <div key={item.product.id} className="glass-card rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">{item.product.name}</p>
                      <p className="text-sm text-slate-300">
                        Utilidad Neta: {formatCurrency(item.netProfitNet)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getMarginColor(item.netMarginNet)}`}>
                        {formatPercent(item.netMarginNet)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-sm border border-red-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-red-600 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Productos Menos Rentables</h3>
              <p className="text-sm text-red-700">Requieren atención inmediata</p>
            </div>
          </div>
          <div className="space-y-3">
            {products
              .sort((a, b) => a.netMarginNet - b.netMarginNet)
              .slice(0, 3)
              .map((item) => (
                <div key={item.product.id} className="glass-card rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-white">{item.product.name}</p>
                      <p className="text-sm text-slate-300">
                        Utilidad Neta: {formatCurrency(item.netProfitNet)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getMarginColor(item.netMarginNet)}`}>
                        {formatPercent(item.netMarginNet)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {showSimulator && businessConfig && (
        <SalesSimulator
          products={products}
          config={businessConfig}
          onClose={() => setShowSimulator(false)}
        />
      )}
    </div>
  );
}

interface SalesSimulatorProps {
  products: ProductRealCost[];
  config: BusinessConfig;
  onClose: () => void;
}

function SalesSimulator({ products, config, onClose }: SalesSimulatorProps) {
  const [adsInvestment, setAdsInvestment] = useState(config.meta_ads_budget);
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.product.id || '');
  const [estimatedSales, setEstimatedSales] = useState(config.target_monthly_sales);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const selectedProductData = products.find(p => p.product.id === selectedProduct);
  const totalRevenueGross = selectedProductData ? selectedProductData.basePriceGross * estimatedSales : 0;
  const totalRevenueNet = selectedProductData ? selectedProductData.basePriceNet * estimatedSales : 0;
  const totalVATDebit = totalRevenueGross - totalRevenueNet;
  const totalCosts = selectedProductData ? selectedProductData.realCost * estimatedSales : 0;
  const grossProfit = totalRevenueNet - totalCosts;
  const netProfit = grossProfit - adsInvestment;
  const roi = adsInvestment > 0 ? ((netProfit / adsInvestment) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">Simulador de Ventas Shopify</h3>
            <p className="text-slate-300 mt-1">Proyección con inversión en Meta Ads (valores netos)</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Inversión en Meta Ads
            </label>
            <input
              type="number"
              value={adsInvestment}
              onChange={(e) => setAdsInvestment(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-slate-600 bg-slate-900/80 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
            />
            <p className="text-sm text-slate-300 mt-1">
              Inversión actual: {formatCurrency(adsInvestment)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Producto a Simular
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-3 border border-slate-600 bg-slate-900/80 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            >
              {products.map((item) => (
                <option key={item.product.id} value={item.product.id}>
                  {item.product.name} - Margen Neto: {item.netMarginNet.toFixed(1)}%
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Ventas Estimadas (unidades)
            </label>
            <input
              type="number"
              value={estimatedSales}
              onChange={(e) => setEstimatedSales(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-slate-600 bg-slate-900/80 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
            />
            <p className="text-sm text-slate-300 mt-1">
              Meta mensual: {config.target_monthly_sales} unidades
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 space-y-4">
            <h4 className="text-lg font-semibold text-blue-900">Proyección Financiera (Valores Netos)</h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-lg p-4 shadow-sm border-2 border-blue-200">
                <p className="text-sm text-slate-300 mb-1">Ingresos Brutos</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenueGross)}</p>
                <p className="text-xs text-slate-300 mt-1">IVA incluido</p>
              </div>

              <div className="glass-card rounded-lg p-4 shadow-sm border-2 border-green-200">
                <p className="text-sm text-green-300 mb-1 font-bold">Ingresos Netos</p>
                <p className="text-2xl font-bold text-green-300">{formatCurrency(totalRevenueNet)}</p>
                <p className="text-xs text-green-200 mt-1">Sin IVA</p>
              </div>

              <div className="glass-card rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-300 mb-1">IVA Débito Total</p>
                <p className="text-2xl font-bold text-amber-300">{formatCurrency(totalVATDebit)}</p>
              </div>

              <div className="glass-card rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-300 mb-1">Costos Netos</p>
                <p className="text-2xl font-bold text-red-300">{formatCurrency(totalCosts)}</p>
              </div>

              <div className="glass-card rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-300 mb-1">Utilidad Bruta (Neta)</p>
                <p className="text-2xl font-bold text-emerald-300">{formatCurrency(grossProfit)}</p>
              </div>

              <div className="glass-card rounded-lg p-4 shadow-sm">
                <p className="text-sm text-slate-300 mb-1">Inversión Ads</p>
                <p className="text-2xl font-bold text-orange-300">{formatCurrency(adsInvestment)}</p>
              </div>
            </div>

            <div className="bg-[#10b981] rounded-lg p-6 shadow-lg">
              <p className="text-emerald-50 text-sm mb-2">Utilidad Neta Final</p>
              <p className="text-4xl font-bold text-white mb-3">{formatCurrency(netProfit)}</p>
              <div className="flex items-center space-x-2">
                {roi > 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-100" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-300" />
                )}
                <p className="text-emerald-50">
                  ROI: <span className="font-bold">{roi.toFixed(1)}%</span>
                </p>
              </div>
            </div>

            <div className="glass-card rounded-lg p-4 shadow-sm">
              <p className="text-sm text-slate-300 mb-2">Desglose por Unidad</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-300">PVP Bruto:</span>
                  <span className="font-medium text-white ml-2">
                    {formatCurrency(selectedProductData?.basePriceGross || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-300">PVP Neto:</span>
                  <span className="font-medium text-blue-300 ml-2">
                    {formatCurrency(selectedProductData?.basePriceNet || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-300">Costo Neto:</span>
                  <span className="font-medium text-white ml-2">
                    {formatCurrency(selectedProductData?.realCost || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-300">Utilidad/unidad:</span>
                  <span className="font-medium text-emerald-600 ml-2">
                    {formatCurrency(selectedProductData?.netProfitNet || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-300">Margen neto:</span>
                  <span className="font-medium text-emerald-600 ml-2">
                    {selectedProductData?.netMarginNet.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
          >
            Cerrar Simulador
          </button>
        </div>
      </div>
    </div>
  );
}

interface WholesaleDistributorViewProps {
  products: ProductRealCost[];
  onBack: () => void;
  loading: boolean;
}

function WholesaleDistributorView({ products, onBack, loading }: WholesaleDistributorViewProps) {
  const [quantities, setQuantities] = useState<WholesaleSimulation>({});
  const [shippingCost, setShippingCost] = useState(5000);
  const [shippingZone, setShippingZone] = useState('');
  const [moqError, setMoqError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const validateMOQ = (): boolean => {
    const rtuProducts = products.filter(p => p.product.format.toLowerCase().includes('rtu') && p.product.format.toLowerCase().includes('500'));
    const concentrateProducts = products.filter(p => {
      const fmt = p.product.format.toLowerCase();
      return (fmt.includes('100') || fmt.includes('200')) && !fmt.includes('rtu');
    });

    const rtuTotal = rtuProducts.reduce((sum, p) => sum + (quantities[p.product.id] || 0), 0);
    const concentrateTotal = concentrateProducts.reduce((sum, p) => sum + (quantities[p.product.id] || 0), 0);

    if (rtuTotal > 0 && rtuTotal < 12) {
      setMoqError('RTU-500cc: Mínimo 12 unidades en total. Actualmente: ' + rtuTotal);
      return false;
    }

    if (concentrateTotal > 0 && concentrateTotal < 12) {
      setMoqError('Concentrados (100cc/200cc): Mínimo 12 unidades en total. Actualmente: ' + concentrateTotal);
      return false;
    }

    setMoqError(null);
    return true;
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(0, quantity) }));
  };

  let subtotalGross = 0;
  let subtotalNet = 0;
  let subtotalVAT = 0;
  let totalCtpProfitNet = 0;
  let totalCostsNet = 0;

  const selectedProducts = products.filter(p => (quantities[p.product.id] || 0) > 0);

  selectedProducts.forEach(p => {
    const qty = quantities[p.product.id] || 0;
    const itemGross = p.distributorPriceGross * qty;
    const itemNet = p.distributorPriceNet * qty;
    const itemVAT = p.distributorVAT * qty;

    subtotalGross += itemGross;
    subtotalNet += itemNet;
    subtotalVAT += itemVAT;
    totalCtpProfitNet += p.ctpProfitNetPerUnit * qty;
    totalCostsNet += p.totalProductionCost * qty;
  });

  const shippingNetBreakdown = calculateNetFromGross(shippingCost);
  const totalGross = subtotalGross + shippingCost;
  const finalCtpProfit = totalCtpProfitNet - shippingNetBreakdown.net;

  const totalUnitsSelected = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  const shopifyComparison = selectedProducts.reduce((acc, p) => {
    const qty = quantities[p.product.id] || 0;
    acc.revenue += p.basePriceNet * qty;
    acc.profit += p.netProfitNet * qty;
    return acc;
  }, { revenue: 0, profit: 0 });

  const wholesaleProfit = totalCtpProfitNet;
  const profitDifference = wholesaleProfit - shopifyComparison.profit;
  const profitDifferencePercent = shopifyComparison.profit > 0
    ? ((profitDifference / shopifyComparison.profit) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Simulador de Distribuidores</h2>
          <p className="text-amber-400 mt-1 font-medium">12 RTU + 12 Concentrados - Sin Comisión Shopify</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 bg-slate-700 text-white px-5 py-3 rounded-xl hover:bg-slate-600 transition-all duration-300 font-semibold"
        >
          ← Volver al Dashboard
        </button>
      </div>

      <div className="bg-blue-900/30 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-blue-500/50 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-blue-500 p-2 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Reglas de Cotización Mayorista</h3>
            <p className="text-blue-300 text-sm">Descuento 40% - Sin Comisión - Validación MOQ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Descuento</div>
            <div className="text-2xl font-bold text-amber-400">40%</div>
            <div className="text-xs text-slate-400 mt-1">Sobre PVP Shopify</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">MOQ RTU-500cc</div>
            <div className="text-2xl font-bold text-[#10b981]">≥ 12</div>
            <div className="text-xs text-slate-400 mt-1">Unidades en total</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">MOQ Concentrados</div>
            <div className="text-2xl font-bold text-[#10b981]">≥ 12</div>
            <div className="text-xs text-slate-400 mt-1">100cc/200cc en total</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">Comisión Shopify</div>
            <div className="text-2xl font-bold text-green-400">0%</div>
            <div className="text-xs text-slate-400 mt-1">Venta directa</div>
          </div>
        </div>
      </div>

      {moqError && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-900 mb-1">Validación MOQ Fallida</h4>
            <p className="text-sm text-red-800">{moqError}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-slate-900/50 rounded-xl">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="text-slate-400 mt-4">Cargando productos...</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-amber-900/30 to-orange-900/30">
            <h3 className="text-lg font-bold text-white">Catálogo de Productos - Canal Distribuidor</h3>
            <p className="text-sm text-amber-400 mt-1">Precios Netos sin Comisión - IVA desglosado</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Producto</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase">PVP Shopify</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase">Precio Dist. Neto</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase">IVA (19%)</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase">Total Bruto</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="glass-card divide-y divide-slate-700">
                {products.map((p) => {
                  const qty = quantities[p.product.id] || 0;
                  const subtotal = p.distributorPriceGross * qty;

                  return (
                    <tr key={p.product.id} className="hover:bg-slate-800/70">
                      <td className="px-6 py-3">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: p.product.color || '#94a3b8' }} />
                          <div>
                            <div className="font-medium text-white">{p.product.name}</div>
                            <div className="text-xs text-slate-300">{p.product.format}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right text-slate-300 line-through text-sm">
                        {formatCurrency(p.basePriceGross)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-blue-300">
                        {formatCurrency(p.distributorPriceNet)}
                        <div className="text-xs text-slate-300 mt-1">-40% del PVP Neto</div>
                      </td>
                      <td className="px-6 py-3 text-right text-sm text-amber-300 font-semibold">
                        {formatCurrency(p.distributorVAT)}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-300">
                        {formatCurrency(p.distributorPriceGross)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={qty}
                          onChange={(e) => handleQuantityChange(p.product.id, parseInt(e.target.value) || 0)}
                          className="w-24 px-3 py-2 border border-slate-600 bg-slate-900/80 text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-center font-semibold"
                        />
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-white">
                        {qty > 0 ? formatCurrency(subtotal) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-amber-900/30 backdrop-blur-sm rounded-xl shadow-2xl border border-amber-700/50 p-6">
        <h4 className="font-bold text-amber-200 mb-4 text-lg flex items-center space-x-2">
          <Truck className="w-5 h-5" />
          <span>Gestión de Flete Mayorista</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-amber-200 mb-2">Zona Geográfica</label>
            <input
              type="text"
              value={shippingZone}
              onChange={(e) => setShippingZone(e.target.value)}
              placeholder="Ej: Santiago Centro, Valparaíso, Concepción"
              className="w-full px-4 py-2 border border-amber-400 rounded-lg bg-slate-800 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-200 mb-2">Costo de Envío Mayorista (Bruto)</label>
            <input
              type="number"
              value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-amber-300 rounded-lg font-bold bg-slate-800 text-white"
            />
            <p className="text-xs text-amber-300 mt-1">Neto: {formatCurrency(shippingNetBreakdown.net)} | IVA: {formatCurrency(shippingNetBreakdown.vat)}</p>
          </div>
        </div>
      </div>

      {selectedProducts.length > 0 && (
        <>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-slate-600 p-6">
            <h4 className="font-bold text-white mb-4 text-xl">Resumen de Cotización</h4>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-600 text-slate-300">
                <span>Subtotal Neto:</span>
                <span className="font-bold text-blue-400 text-lg">{formatCurrency(subtotalNet)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-600 text-slate-300">
                <span>IVA ({formatVATPercentage()}):</span>
                <span className="font-bold text-amber-400 text-lg">{formatCurrency(subtotalVAT)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-600 text-slate-300">
                <span>Subtotal Bruto:</span>
                <span className="font-bold text-white text-lg">{formatCurrency(subtotalGross)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-600 text-slate-300">
                <span>Envío {shippingZone && `(${shippingZone})`}:</span>
                <span className="font-bold text-amber-400 text-lg">{formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between py-4 bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 rounded-lg px-4 border-2 border-[#10b981]">
                <span className="font-bold text-emerald-100 text-xl">Total a Pagar (Bruto):</span>
                <span className="font-bold text-emerald-300 text-3xl">{formatCurrency(totalGross)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-green-500/50 p-6">
            <h4 className="font-bold text-green-200 mb-4 text-xl flex items-center space-x-2">
              <BarChart3 className="w-6 h-6" />
              <span>Utilidad Técnica CTP - Comparativa por Canal</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-800/70 rounded-lg p-5 border-2 border-amber-500/50">
                <div className="text-sm text-amber-300 uppercase tracking-wider mb-3 font-bold">Canal Mayorista (Actual)</div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Ingresos Netos:</span>
                    <span className="font-bold text-blue-300">{formatCurrency(subtotalNet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costos Producción:</span>
                    <span className="font-bold text-red-400">-{formatCurrency(totalCostsNet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío Neto:</span>
                    <span className="font-bold text-red-400">-{formatCurrency(shippingNetBreakdown.net)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comisión Shopify:</span>
                    <span className="font-bold text-green-400">$0</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-500/50">
                    <span className="font-bold text-amber-200">Utilidad Neta:</span>
                    <span className="font-bold text-amber-300 text-xl">{formatCurrency(finalCtpProfit)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-600 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Unidades vendidas:</span>
                    <span className="font-semibold">{totalUnitsSelected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilidad por unidad:</span>
                    <span className="font-semibold">{formatCurrency(totalUnitsSelected > 0 ? finalCtpProfit / totalUnitsSelected : 0)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/70 rounded-lg p-5 border-2 border-blue-500/50">
                <div className="text-sm text-blue-300 uppercase tracking-wider mb-3 font-bold">Canal Shopify (Comparación)</div>
                <div className="space-y-2 text-sm text-slate-300">
                  <div className="flex justify-between">
                    <span>Ingresos Netos:</span>
                    <span className="font-bold text-blue-300">{formatCurrency(shopifyComparison.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costos Producción:</span>
                    <span className="font-bold text-red-400">-{formatCurrency(totalCostsNet)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío Unitario:</span>
                    <span className="font-bold text-red-400">-Incluido en costo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Comisión Shopify (5%):</span>
                    <span className="font-bold text-red-400">-{formatCurrency(shopifyComparison.revenue * 0.05)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-500/50">
                    <span className="font-bold text-blue-200">Utilidad Neta:</span>
                    <span className="font-bold text-blue-300 text-xl">{formatCurrency(shopifyComparison.profit)}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-600 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Unidades vendidas:</span>
                    <span className="font-semibold">{totalUnitsSelected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utilidad por unidad:</span>
                    <span className="font-semibold">{formatCurrency(totalUnitsSelected > 0 ? shopifyComparison.profit / totalUnitsSelected : 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${profitDifference >= 0 ? 'bg-green-800/50 border-green-500' : 'bg-red-800/50 border-red-500'} rounded-lg p-5 border-2`}>
              <div className="text-center">
                <div className="text-sm text-slate-300 mb-2">Diferencia de Utilidad (Mayorista vs Shopify)</div>
                <div className={`text-4xl font-bold ${profitDifference >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {profitDifference >= 0 ? '+' : ''}{formatCurrency(profitDifference)}
                </div>
                <div className={`text-lg mt-2 ${profitDifference >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profitDifference >= 0 ? '+' : ''}{profitDifferencePercent.toFixed(1)}% vs Shopify
                </div>
                <div className="text-xs text-slate-400 mt-3">
                  {profitDifference >= 0
                    ? 'El canal mayorista genera más utilidad neta que vender por Shopify las mismas unidades'
                    : 'El canal Shopify genera más utilidad neta unitaria, pero mayorista ofrece volumen sin comisión'
                  }
                </div>
              </div>
            </div>

            <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="text-xs text-slate-400 space-y-1">
                <p><strong className="text-slate-300">Nota:</strong> Esta comparativa muestra la rentabilidad por cada canal de venta.</p>
                <p>• <strong>Canal Mayorista:</strong> Sin comisión Shopify, pero con flete mayorista deducido del lote completo.</p>
                <p>• <strong>Canal Shopify:</strong> Incluye comisión 5% sobre neto + envío individual por unidad.</p>
                <p>• La utilidad técnica CTP muestra cuánto rinde realmente cada formato tras todos los costos.</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => {
                if (validateMOQ()) {
                  alert('✅ Cotización válida. MOQ cumplido. Puedes proceder con la venta.');
                }
              }}
              className="flex-1 px-6 py-4 bg-[#10b981] text-white rounded-xl hover:bg-[#059669] transition-all duration-300 font-bold text-lg shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-6 h-6" />
                <span>Validar Cotización</span>
              </div>
            </button>
            <button
              onClick={onBack}
              className="px-6 py-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all duration-300 font-semibold"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
