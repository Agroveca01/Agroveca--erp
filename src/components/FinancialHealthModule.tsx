import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, BarChart3, PieChart } from 'lucide-react';
import { supabase, AccountsPayable, AccountsReceivable, Customer, CustomerOrder, SalesOrder } from '../lib/supabase';

type TopCustomer = Customer & {
  orderCount: number;
  totalSpent: number;
  totalUnits: number;
  paymentScore: string | null;
};

export default function FinancialHealthModule() {
  const [payables, setPayables] = useState<AccountsPayable[]>([]);
  const [receivables, setReceivables] = useState<AccountsReceivable[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [payablesData, receivablesData, ordersData, customerOrdersData, customersData] = await Promise.all([
        supabase.from('accounts_payable').select('*').eq('status', 'pending'),
        supabase.from('accounts_receivable').select('*, customers(*)').eq('status', 'pending'),
        supabase.from('sales_orders').select('*'),
        supabase.from('customer_orders').select('*'),
        supabase.from('customers').select('*'),
      ]);

      setPayables(payablesData.data || []);
      setReceivables(receivablesData.data || []);
      setOrders(ordersData.data || []);
      setCustomerOrders(customerOrdersData.data || []);
      setCustomers(customersData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalPayables = payables.reduce((sum, p) => sum + p.amount_due, 0);
  const totalReceivables = receivables.reduce((sum, r) => sum + r.amount_due, 0);
  const liquidityRatio = totalPayables > 0 ? totalReceivables / totalPayables : 0;
  const netCashFlow = totalReceivables - totalPayables;

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyOrders = orders.filter((order) => {
    const orderDate = new Date(order.order_date);
    return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
  });

  const shopifyOrders = monthlyOrders.filter((o) => o.channel === 'shopify');
  const wholesaleOrders = monthlyOrders.filter((o) => o.channel === 'wholesale');

  const shopifyRevenue = shopifyOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const wholesaleRevenue = wholesaleOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalRevenue = shopifyRevenue + wholesaleRevenue;

  const shopifyPercentage = totalRevenue > 0 ? (shopifyRevenue / totalRevenue) * 100 : 0;
  const wholesalePercentage = totalRevenue > 0 ? (wholesaleRevenue / totalRevenue) * 100 : 0;

  const criticalReceivables = receivables.filter((r) => r.days_overdue > 30);

  const topCustomers: TopCustomer[] = customers
    .map((customer) => {
      const ordersForCustomer = customerOrders.filter((order) => order.customer_id === customer.id);
      const receivablesForCustomer = receivables.filter((receivable) => receivable.customer_id === customer.id);
      const totalSpent = ordersForCustomer.reduce((sum, order) => sum + order.total_amount, 0);
      const totalUnits = ordersForCustomer.reduce(
        (sum, order) =>
          sum + order.items.reduce((itemsSum, item) => itemsSum + (item.quantity || 0), 0),
        0
      );

      const paymentScore = receivablesForCustomer.length > 0
        ? receivablesForCustomer.sort((a, b) => b.created_at.localeCompare(a.created_at))[0].payment_score
        : null;

      return {
        ...customer,
        totalSpent,
        totalUnits,
        orderCount: ordersForCustomer.length,
        paymentScore,
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Salud Financiera y Liquidez</h2>
        <p className="text-[#10b981] mt-1 font-medium">Dashboard ejecutivo de flujo de caja proyectado</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-xl shadow-2xl border border-green-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-green-200 uppercase tracking-wider">Por Cobrar</h3>
            <TrendingUp className="w-6 h-6 text-green-300" />
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalReceivables)}</p>
          <p className="text-sm text-green-200 mt-1">{receivables.length} facturas</p>
        </div>

        <div className="bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-2xl border border-red-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-red-200 uppercase tracking-wider">Por Pagar</h3>
            <TrendingDown className="w-6 h-6 text-red-300" />
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalPayables)}</p>
          <p className="text-sm text-red-200 mt-1">{payables.length} facturas</p>
        </div>

        <div className={`bg-gradient-to-br rounded-xl shadow-2xl border p-6 ${
          liquidityRatio >= 1
            ? 'from-[#10b981]/80 to-[#10b981]/90 border-[#10b981]/50'
            : 'from-orange-800 to-orange-900 border-orange-700/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ratio Liquidez</h3>
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">{liquidityRatio.toFixed(2)}</p>
          <p className={`text-sm mt-1 ${liquidityRatio >= 1 ? 'text-emerald-200' : 'text-orange-200'}`}>
            {liquidityRatio >= 1 ? 'Autofinanciado' : 'Déficit'}
          </p>
        </div>

        <div className={`bg-gradient-to-br rounded-xl shadow-2xl border p-6 ${
          netCashFlow >= 0
            ? 'from-blue-800 to-blue-900 border-blue-700/50'
            : 'from-purple-800 to-purple-900 border-purple-700/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Flujo Neto</h3>
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(Math.abs(netCashFlow))}</p>
          <p className={`text-sm mt-1 ${netCashFlow >= 0 ? 'text-blue-200' : 'text-purple-200'}`}>
            {netCashFlow >= 0 ? 'Superávit' : 'Déficit'}
          </p>
        </div>
      </div>

      {netCashFlow < 0 && (
        <div className="bg-gradient-to-r from-orange-700 to-red-600 rounded-xl shadow-2xl border-2 border-orange-400 p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Alerta de Descalce de Caja</h3>
              <p className="text-orange-100 text-sm mt-1">
                Las cuentas por pagar exceden las cuentas por cobrar. Déficit: {formatCurrency(Math.abs(netCashFlow))}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <PieChart className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Participación de Ventas</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Shopify (Minorista)</span>
                <span className="text-sm font-bold text-[#10b981]">{shopifyPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4">
                <div
                  className="bg-[#10b981] h-4 rounded-full transition-all"
                  style={{ width: `${shopifyPercentage}%` }}
                ></div>
              </div>
              <div className="text-right mt-1">
                <span className="text-xs text-slate-400">{formatCurrency(shopifyRevenue)}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Distribuidores (Mayorista)</span>
                <span className="text-sm font-bold text-blue-400">{wholesalePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all"
                  style={{ width: `${wholesalePercentage}%` }}
                ></div>
              </div>
              <div className="text-right mt-1">
                <span className="text-xs text-slate-400">{formatCurrency(wholesaleRevenue)}</span>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">Total del Mes</span>
                <span className="text-xl font-bold text-cyan-400">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Top 5 Distribuidores</h3>
          </div>

          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div key={customer.id} className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white">{customer.name}</div>
                      <div className="text-xs text-slate-400">{customer.orderCount} órdenes</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[#10b981]">{formatCurrency(customer.totalSpent)}</div>
                    <div className="text-xs text-slate-400">{customer.totalUnits} unidades</div>
                  </div>
                </div>
                {customer.paymentScore && (
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.paymentScore === 'A' ? 'bg-green-100 text-green-800' :
                      customer.paymentScore === 'B' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Score: {customer.paymentScore}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-white mb-6">Análisis de Antigüedad de Cuentas por Cobrar</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-900/30 rounded-lg p-5 border-2 border-green-500/50">
            <h4 className="font-bold text-green-200 mb-2">Vigentes (0 días)</h4>
            <p className="text-3xl font-bold text-green-400">
              {receivables.filter((r) => r.days_overdue === 0).length}
            </p>
            <p className="text-sm text-green-300 mt-1">
              {formatCurrency(
                receivables.filter((r) => r.days_overdue === 0).reduce((sum, r) => sum + r.amount_due, 0)
              )}
            </p>
          </div>

          <div className="bg-yellow-900/30 rounded-lg p-5 border-2 border-yellow-500/50">
            <h4 className="font-bold text-yellow-200 mb-2">Atraso 1-15 días</h4>
            <p className="text-3xl font-bold text-yellow-400">
              {receivables.filter((r) => r.days_overdue > 0 && r.days_overdue <= 15).length}
            </p>
            <p className="text-sm text-yellow-300 mt-1">
              {formatCurrency(
                receivables
                  .filter((r) => r.days_overdue > 0 && r.days_overdue <= 15)
                  .reduce((sum, r) => sum + r.amount_due, 0)
              )}
            </p>
          </div>

          <div className="bg-red-900/30 rounded-lg p-5 border-2 border-red-500/50">
            <h4 className="font-bold text-red-200 mb-2">Crítico (+30 días)</h4>
            <p className="text-3xl font-bold text-red-400">{criticalReceivables.length}</p>
            <p className="text-sm text-red-300 mt-1">
              {formatCurrency(criticalReceivables.reduce((sum, r) => sum + r.amount_due, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
