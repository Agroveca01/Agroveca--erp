import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, DollarSign, BarChart3, PieChart } from 'lucide-react';
import { supabase, AccountsPayable, AccountsReceivable, Customer, CustomerOrder, SalesOrder } from '../lib/supabase';
import {
  getCustomerRankBadge,
  getLiquidityTone,
  getLiquiditySummary,
  getMonthlyCompletedOrders,
  getNetCashFlowTone,
  getPaymentScoreBadge,
  getReceivablesAgingSummary,
  getRevenueChannels,
  getTopCustomers,
} from '../lib/financialHealthHelpers';

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

  const { totalPayables, totalReceivables, liquidityRatio, netCashFlow } = getLiquiditySummary(payables, receivables);
  const monthlyOrders = getMonthlyCompletedOrders(orders);
  const { totalRevenue, revenueChannels } = getRevenueChannels(monthlyOrders);
  const topCustomers = getTopCustomers(customers, customerOrders, receivables);
  const receivablesAging = getReceivablesAgingSummary(receivables);
  const liquidityTone = getLiquidityTone(totalPayables, liquidityRatio);
  const netCashFlowTone = getNetCashFlowTone(netCashFlow);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Salud Financiera y Liquidez</h2>
        <p className="text-[#10b981] mt-1 font-medium">Dashboard ejecutivo de flujo de caja proyectado</p>
      </div>

      <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4">
        <p className="text-sm text-slate-300">
          Base actual del dashboard: cuentas por pagar y por cobrar en estado pendiente, ventas completadas del mes en
          `sales_orders` y pedidos CRM no cancelados en `customer_orders`.
        </p>
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

        <div className={`bg-gradient-to-br rounded-xl shadow-2xl border p-6 ${liquidityTone.cardClass}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ratio Liquidez</h3>
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">{liquidityRatio.toFixed(2)}</p>
          <p className={`text-sm mt-1 ${liquidityTone.textClass}`}>
            {liquidityTone.label}
          </p>
        </div>

        <div className={`bg-gradient-to-br rounded-xl shadow-2xl border p-6 ${netCashFlowTone.cardClass}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Flujo Neto</h3>
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(Math.abs(netCashFlow))}</p>
          <p className={`text-sm mt-1 ${netCashFlowTone.textClass}`}>
            {netCashFlowTone.label}
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
              {revenueChannels.map((channel) => (
                <div key={channel.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-300">{channel.label}</span>
                    <span className={`text-sm font-bold ${channel.amountClass}`}>{channel.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-4">
                    <div
                      className={`${channel.barClass} h-4 rounded-full transition-all`}
                      style={{ width: `${channel.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-xs text-slate-400">{formatCurrency(channel.revenue)}</span>
                  </div>
                </div>
              ))}

              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">Ventas completadas del mes</span>
                  <span className="text-xl font-bold text-cyan-400">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Top 5 Clientes con Historial</h3>
          </div>

          <div className="space-y-3">
            {topCustomers.length === 0 && (
              <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-400">
                Todavía no hay suficientes pedidos CRM o cuentas por cobrar para mostrar un ranking confiable.
              </div>
            )}

              {topCustomers.map((customer, index) => {
                const rankBadge = getCustomerRankBadge(index);

                return <div key={customer.id} className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${rankBadge.className}`}>
                      {rankBadge.label}
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
                {customer.paymentScore && (() => {
                  const paymentScoreBadge = getPaymentScoreBadge(customer.paymentScore);

                  return (
                    <div className="mt-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentScoreBadge.className}`}>
                        {paymentScoreBadge.label}
                      </span>
                    </div>
                  );
                })()}
              </div>
                })}
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
        <h3 className="text-xl font-bold text-white mb-6">Análisis de Antigüedad de Cuentas por Cobrar</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-900/30 rounded-lg p-5 border-2 border-green-500/50">
                <h4 className="font-bold text-green-200 mb-2">Vigentes (0 días)</h4>
                <p className="text-3xl font-bold text-green-400">{receivablesAging.current.count}</p>
                <p className="text-sm text-green-300 mt-1">{formatCurrency(receivablesAging.current.totalAmount)}</p>
              </div>

              <div className="bg-yellow-900/30 rounded-lg p-5 border-2 border-yellow-500/50">
                <h4 className="font-bold text-yellow-200 mb-2">Atraso 1-15 días</h4>
                <p className="text-3xl font-bold text-yellow-400">{receivablesAging.overdue1to15.count}</p>
                <p className="text-sm text-yellow-300 mt-1">{formatCurrency(receivablesAging.overdue1to15.totalAmount)}</p>
              </div>

              <div className="bg-red-900/30 rounded-lg p-5 border-2 border-red-500/50">
                <h4 className="font-bold text-red-200 mb-2">Crítico (+30 días)</h4>
                <p className="text-3xl font-bold text-red-400">{receivablesAging.critical.count}</p>
                <p className="text-sm text-red-300 mt-1">{formatCurrency(receivablesAging.critical.totalAmount)}</p>
              </div>
        </div>
      </div>
    </div>
  );
}
