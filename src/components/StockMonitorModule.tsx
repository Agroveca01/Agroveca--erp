import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Package, ShoppingBag, Copy } from 'lucide-react';
import { supabase, PackagingInventory } from '../lib/supabase';

export default function StockMonitorModule() {
  const [inventory, setInventory] = useState<PackagingInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetUnits, setTargetUnits] = useState(300);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('packaging_inventory')
        .select('*')
        .order('item_type, format');

      if (error) throw error;

      setInventory(data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const criticalItems = inventory.filter((item) => item.current_stock < item.min_stock_alert);
  const lowStockItems = inventory.filter(
    (item) => item.current_stock >= item.min_stock_alert && item.current_stock < item.optimal_stock
  );

  const getStockStatus = (item: PackagingInventory) => {
    if (item.current_stock < item.min_stock_alert) return 'critical';
    if (item.current_stock < item.optimal_stock) return 'low';
    return 'ok';
  };

  const getStatusColor = (status: string) => {
    if (status === 'critical') return 'bg-red-100 text-red-800 border-red-300';
    if (status === 'low') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'critical') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (status === 'low') return <Bell className="w-5 h-5 text-yellow-600" />;
    return <Package className="w-5 h-5 text-green-600" />;
  };

  const calculateNeededStock = () => {
    return inventory.map((item) => {
      const deficit = Math.max(0, targetUnits - item.current_stock);
      const totalCost = deficit * item.unit_cost_net * 1.19;
      return { ...item, deficit, totalCost };
    });
  };

  const neededStock = calculateNeededStock();
  const totalReplenishmentCost = neededStock.reduce((sum, item) => sum + item.totalCost, 0);

  const blockingItems = criticalItems.filter((item) => item.current_stock === 0);

  const generatePurchaseList = () => {
    const list = neededStock
      .filter((item) => item.deficit > 0)
      .map((item) => `${item.item_name} ${item.format || ''}: ${item.deficit} unidades`)
      .join('\n');

    navigator.clipboard.writeText(list);
    alert('Lista de compras copiada al portapapeles');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Monitor de Stock Crítico</h2>
          <p className="text-emerald-400 mt-1 font-medium">Alertas de reposición y gestión de inventario</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-2xl border border-red-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-red-200 uppercase tracking-wider">Stock Crítico</h3>
            <AlertTriangle className="w-6 h-6 text-red-300" />
          </div>
          <p className="text-4xl font-bold text-white">{criticalItems.length}</p>
          <p className="text-sm text-red-200 mt-1">Insumos bajo mínimo</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-xl shadow-2xl border border-yellow-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-yellow-200 uppercase tracking-wider">Stock Bajo</h3>
            <Bell className="w-6 h-6 text-yellow-300" />
          </div>
          <p className="text-4xl font-bold text-white">{lowStockItems.length}</p>
          <p className="text-sm text-yellow-200 mt-1">Requieren atención</p>
        </div>

        <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl shadow-2xl border border-blue-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider">Costo Reposición</h3>
            <ShoppingBag className="w-6 h-6 text-blue-300" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalReplenishmentCost)}</p>
          <p className="text-sm text-blue-200 mt-1">Para meta de {targetUnits} u.</p>
        </div>

        <div className="bg-gradient-to-br from-purple-800 to-purple-900 rounded-xl shadow-2xl border border-purple-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-purple-200 uppercase tracking-wider">Bloqueantes</h3>
            <AlertTriangle className="w-6 h-6 text-purple-300" />
          </div>
          <p className="text-4xl font-bold text-white">{blockingItems.length}</p>
          <p className="text-sm text-purple-200 mt-1">Stock = 0</p>
        </div>
      </div>

      {blockingItems.length > 0 && (
        <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-xl shadow-2xl border-2 border-red-400 p-6 animate-pulse">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-white flex-shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-white">PRODUCCIÓN BLOQUEADA</h3>
              <p className="text-red-100 text-sm mt-1">
                Los siguientes insumos están en stock 0 y bloquean la producción:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {blockingItems.map((item) => (
                  <span key={item.id} className="px-3 py-1 bg-red-900 text-white rounded-full text-sm font-bold">
                    {item.item_name} {item.format}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Cálculo de Necesidades de Compra</h3>
          <div className="flex items-center space-x-3">
            <label className="text-sm text-slate-300">Meta mensual:</label>
            <input
              type="number"
              value={targetUnits}
              onChange={(e) => setTargetUnits(parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white font-semibold"
            />
            <span className="text-sm text-slate-300">unidades</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-300 uppercase">Insumo</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase">Stock Actual</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase">Meta</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase">Déficit</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-300 uppercase">Costo Bruto</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-300 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {neededStock.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id} className={status === 'critical' ? 'bg-red-50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {item.item_name} {item.format}
                      </div>
                      <div className="text-xs text-slate-500">{item.item_type}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {item.current_stock}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{targetUnits}</td>
                    <td className="px-4 py-3 text-right">
                      {item.deficit > 0 ? (
                        <span className="font-bold text-red-600">{item.deficit}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {item.deficit > 0 ? formatCurrency(item.totalCost) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full border ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        <span className="text-xs font-semibold uppercase">{status}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-slate-400">Total a invertir para alcanzar meta:</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(totalReplenishmentCost)}</p>
          </div>
          <button
            onClick={generatePurchaseList}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold"
          >
            <Copy className="w-5 h-5" />
            <span>Copiar Lista de Compras</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-900/30 to-indigo-900/30">
          <h3 className="text-lg font-bold text-white">Inventario Completo de Insumos</h3>
          <p className="text-sm text-purple-400 mt-1">Estado actual del stock</p>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="text-slate-600 mt-4">Cargando inventario...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Insumo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Stock Actual</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Mínimo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Óptimo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {inventory.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className={status === 'critical' ? 'bg-red-50' : 'hover:bg-slate-50'}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {item.item_name} {item.format}
                        </div>
                        <div className="text-xs text-slate-500">{item.item_type}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-2xl font-bold ${status === 'critical' ? 'text-red-600' : status === 'low' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {item.current_stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-600">{item.min_stock_alert}</td>
                      <td className="px-6 py-4 text-right text-sm text-slate-600">{item.optimal_stock}</td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full border ${getStatusColor(status)}`}>
                          {getStatusIcon(status)}
                          <span className="text-xs font-semibold uppercase">{status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {status !== 'ok' && (
                          <a
                            href="#purchases"
                            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold"
                          >
                            Comprar
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
