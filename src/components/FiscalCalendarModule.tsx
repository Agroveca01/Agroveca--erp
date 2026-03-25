import { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, DollarSign, CheckCircle, Clock, TrendingUp, Receipt, Calculator } from 'lucide-react';
import { supabase, FiscalConfig, SalesOrder } from '../lib/supabase';
import { calculateNetFromGross } from '../lib/taxUtils';

export default function FiscalCalendarModule() {
  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [ppmPercentage, setPpmPercentage] = useState(1.0);
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);

  useEffect(() => {
    loadFiscalData();
  }, []);

  const loadFiscalData = async () => {
    try {
      const [configData, ordersData, purchasesData] = await Promise.all([
        supabase.from('fiscal_config').select('*').limit(1).maybeSingle(),
        supabase.from('sales_orders').select('*'),
        supabase.from('purchases').select('*'),
      ]);

      if (configData.data) {
        setFiscalConfig(configData.data);
        setPpmPercentage(configData.data.ppm_percentage);
      }
      setOrders(ordersData.data || []);
      setPurchases(purchasesData.data || []);
    } catch (error) {
      console.error('Error loading fiscal data:', error);
    }
  };

  const savePpmConfig = async () => {
    try {
      await supabase
        .from('fiscal_config')
        .update({ ppm_percentage: ppmPercentage })
        .eq('id', fiscalConfig?.id || '');

      alert('Configuración de PPM actualizada');
      loadFiscalData();
    } catch (error) {
      console.error('Error saving PPM config:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyOrders = orders.filter(order => {
    const orderDate = new Date(order.order_date);
    return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
  });

  const monthlyPurchases = purchases.filter(purchase => {
    const purchaseDate = new Date(purchase.purchase_date);
    return purchaseDate.getMonth() === thisMonth && purchaseDate.getFullYear() === thisYear;
  });

  const totalRevenueGross = monthlyOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const revenueBreakdown = calculateNetFromGross(totalRevenueGross);
  const totalRevenueNet = revenueBreakdown.net;
  const vatDebit = revenueBreakdown.vat;

  const totalVatCredit = monthlyPurchases.reduce((sum, purchase) => sum + purchase.vat_credit, 0);

  const netVatToPay = vatDebit - totalVatCredit;
  const ppmAmount = totalRevenueNet * (ppmPercentage / 100);
  const totalF29Reserve = netVatToPay + ppmAmount;

  const totalCashAvailable = totalRevenueGross;
  const realProfitAvailable = totalRevenueNet - totalF29Reserve;

  const today = new Date();
  const currentDay = today.getDate();
  const isF29AlertPeriod = currentDay >= 12 && currentDay <= 20;

  const withdrawalWarning = withdrawalAmount > realProfitAvailable;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Calendario Fiscal F29</h2>
          <p className="text-emerald-400 mt-1 font-medium">Gestión de IVA, PPM y Flujo de Caja</p>
        </div>
      </div>

      {isF29AlertPeriod && (
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-2xl border-2 border-orange-400 p-6 animate-pulse">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-white" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">ALERTA: Período de Pago F29</h3>
              <p className="text-orange-100 text-sm mt-1">
                Estás en el período del 12 al 20 del mes. Provisión para pago de F29:
              </p>
              <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalF29Reserve)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl shadow-2xl border border-blue-700/50 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wider">Saldo Total en Cuenta</h3>
            <DollarSign className="w-6 h-6 text-blue-300" />
          </div>
          <p className="text-4xl font-bold text-white mb-2">{formatCurrency(totalCashAvailable)}</p>
          <p className="text-xs text-blue-200">Ingresos Brutos (IVA incluido)</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-xl shadow-2xl border border-emerald-700/50 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-emerald-200 uppercase tracking-wider">Utilidad Disponible Real</h3>
            <TrendingUp className="w-6 h-6 text-emerald-300" />
          </div>
          <p className="text-4xl font-bold text-white mb-2">{formatCurrency(realProfitAvailable)}</p>
          <p className="text-xs text-emerald-200">Neto - Costos - Reserva Fiscal</p>
        </div>

        <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl shadow-2xl border border-red-700/50 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-red-200 uppercase tracking-wider">Reserva de Impuestos</h3>
            <Receipt className="w-6 h-6 text-red-300" />
          </div>
          <p className="text-4xl font-bold text-white mb-2">{formatCurrency(totalF29Reserve)}</p>
          <p className="text-xs text-red-200">IVA + PPM (Caja No Tocable)</p>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Calculator className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-bold text-white">Configuración de PPM</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Porcentaje de PPM (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={ppmPercentage}
              onChange={(e) => setPpmPercentage(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white font-semibold text-lg"
            />
            <p className="text-xs text-slate-400 mt-1">Valor sugerido: 1% sobre ventas netas</p>
          </div>

          <div className="flex items-end">
            <button
              onClick={savePpmConfig}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all font-semibold"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Receipt className="w-6 h-6 text-amber-400" />
          <h3 className="text-xl font-bold text-white">Cálculo de Reserva Total F29</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">IVA Débito (Ventas):</span>
              <span className="font-bold text-amber-400 text-xl">{formatCurrency(vatDebit)}</span>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">IVA Crédito (Compras):</span>
              <span className="font-bold text-green-400 text-xl">-{formatCurrency(totalVatCredit)}</span>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">IVA Neto a Pagar:</span>
              <span className="font-bold text-orange-400 text-xl">{formatCurrency(netVatToPay)}</span>
            </div>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">PPM ({ppmPercentage}% sobre {formatCurrency(totalRevenueNet)}):</span>
              <span className="font-bold text-purple-400 text-xl">{formatCurrency(ppmAmount)}</span>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-lg p-6 border-2 border-red-400">
            <div className="flex justify-between items-center">
              <span className="text-red-100 font-bold text-lg">TOTAL RESERVA F29:</span>
              <span className="font-bold text-white text-3xl">{formatCurrency(totalF29Reserve)}</span>
            </div>
            <p className="text-xs text-red-100 mt-2">
              (IVA Neto + PPM) = Dinero comprometido con el fisco
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-xl shadow-2xl border-2 border-blue-500/50 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Calendar className="w-6 h-6 text-blue-300" />
          <h3 className="text-xl font-bold text-white">Calendario de Pagos</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800/70 rounded-lg p-5 border-l-4 border-yellow-500">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-yellow-400" />
              <div>
                <h4 className="font-bold text-white">Día 10 del mes</h4>
                <p className="text-sm text-slate-300">Cierre de facturación y revisión de libros</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-lg p-5 border-l-4 border-red-500">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <h4 className="font-bold text-white">Día 20 del mes</h4>
                <p className="text-sm text-slate-300">Fecha límite pago F29 (IVA + PPM)</p>
                <p className="text-lg font-bold text-red-300 mt-1">
                  Monto a pagar: {formatCurrency(totalF29Reserve)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-xl shadow-2xl border-2 border-purple-500/50 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <DollarSign className="w-6 h-6 text-purple-300" />
          <h3 className="text-xl font-bold text-white">Simulador de Retiro de Utilidades</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Monto que deseas retirar
            </label>
            <input
              type="number"
              step="1000"
              min="0"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white font-semibold text-lg"
              placeholder="Ej: 500000"
            />
          </div>

          {withdrawalAmount > 0 && (
            <div className={`rounded-lg p-5 border-2 ${
              withdrawalWarning
                ? 'bg-red-900/50 border-red-500'
                : 'bg-green-900/50 border-green-500'
            }`}>
              <div className="flex items-start space-x-3">
                {withdrawalWarning ? (
                  <AlertTriangle className="w-8 h-8 text-red-300 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-300 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className={`font-bold text-lg ${withdrawalWarning ? 'text-red-200' : 'text-green-200'}`}>
                    {withdrawalWarning ? 'ADVERTENCIA: Retiro compromete impuestos' : 'Retiro seguro'}
                  </h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Utilidad disponible:</span>
                      <span className="font-semibold text-white">{formatCurrency(realProfitAvailable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Retiro solicitado:</span>
                      <span className="font-semibold text-white">-{formatCurrency(withdrawalAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-600 pt-2">
                      <span className={`font-bold ${withdrawalWarning ? 'text-red-300' : 'text-green-300'}`}>
                        Saldo después del retiro:
                      </span>
                      <span className={`font-bold text-xl ${withdrawalWarning ? 'text-red-300' : 'text-green-300'}`}>
                        {formatCurrency(realProfitAvailable - withdrawalAmount)}
                      </span>
                    </div>
                  </div>

                  {withdrawalWarning && (
                    <div className="mt-4 bg-red-800/50 rounded-lg p-3">
                      <p className="text-xs text-red-100">
                        Este retiro deja saldo insuficiente para cubrir los impuestos del mes ({formatCurrency(totalF29Reserve)}).
                        Reduce el monto del retiro o espera a recibir más ingresos.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-xl shadow-2xl border border-orange-700/50 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Receipt className="w-6 h-6 text-orange-400" />
          <h3 className="text-xl font-bold text-white">Resumen Ejecutivo - Caja No Tocable</h3>
        </div>

        <div className="bg-slate-800/70 rounded-lg p-6 border-2 border-orange-500">
          <div className="text-center">
            <p className="text-sm text-orange-200 mb-2">Dinero ya comprometido con el fisco</p>
            <p className="text-5xl font-bold text-orange-300 mb-4">{formatCurrency(totalF29Reserve)}</p>
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-600">
              <div>
                <p className="text-xs text-slate-400">IVA a pagar</p>
                <p className="text-lg font-bold text-amber-400">{formatCurrency(netVatToPay)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">PPM</p>
                <p className="text-lg font-bold text-purple-400">{formatCurrency(ppmAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-orange-800/30 rounded-lg p-3">
          <p className="text-xs text-orange-200">
            <strong>Importante:</strong> Este monto debe permanecer en tu cuenta bancaria hasta el día 20 del mes.
            No utilices este dinero para gastos operativos o retiros personales.
          </p>
        </div>
      </div>
    </div>
  );
}
