import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { supabase, AccountsPayable } from '../lib/supabase';

export default function AccountsPayableModule() {
  const [payables, setPayables] = useState<AccountsPayable[]>([]);

  useEffect(() => {
    loadPayables();
  }, []);

  const loadPayables = async () => {
    try {
      const { data } = await supabase
        .from('accounts_payable')
        .select('*, purchase_invoices(*, suppliers(*))')
        .order('due_date', { ascending: true });

      setPayables(data || []);
    } catch (error) {
      console.error('Error loading payables:', error);
    }
  };

  const markAsPaid = async (payableId: string) => {
    if (!confirm('¿Confirmar pago de esta factura?')) return;

    try {
      await supabase
        .from('accounts_payable')
        .update({
          status: 'paid',
          amount_paid: payables.find((p) => p.id === payableId)?.amount_due || 0,
        })
        .eq('id', payableId);

      const payable = payables.find((p) => p.id === payableId);
      if (payable) {
        await supabase
          .from('purchase_invoices')
          .update({ status: 'paid', paid_date: new Date().toISOString() })
          .eq('id', payable.invoice_id);

        await supabase.from('payment_records').insert([
          {
            payable_id: payableId,
            amount: payable.amount_due,
            payment_date: new Date().toISOString(),
            payment_method: 'Transferencia',
          },
        ]);
      }

      alert('Pago registrado exitosamente');
      loadPayables();
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Error al registrar el pago');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const pendingPayables = payables.filter((p) => p.status === 'pending');
  const totalDebt = pendingPayables.reduce((sum, p) => sum + p.amount_due, 0);
  const overduePayables = pendingPayables.filter((p) => getDaysUntilDue(p.due_date) < 0);
  const dueSoonPayables = pendingPayables.filter((p) => {
    const days = getDaysUntilDue(p.due_date);
    return days >= 0 && days <= 5;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Cuentas por Pagar</h2>
        <p className="text-[#10b981] mt-1 font-medium">Gestión de pagos a proveedores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-800 to-red-900 rounded-xl shadow-2xl border border-red-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-red-200 uppercase tracking-wider">Deuda Total</h3>
            <DollarSign className="w-6 h-6 text-red-300" />
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalDebt)}</p>
          <p className="text-sm text-red-200 mt-1">{pendingPayables.length} facturas</p>
        </div>

        <div className="bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl shadow-2xl border border-orange-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-orange-200 uppercase tracking-wider">Vencidas</h3>
            <AlertTriangle className="w-6 h-6 text-orange-300" />
          </div>
          <p className="text-3xl font-bold text-white">{overduePayables.length}</p>
          <p className="text-sm text-orange-200 mt-1">Acción inmediata</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-800 to-yellow-900 rounded-xl shadow-2xl border border-yellow-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-yellow-200 uppercase tracking-wider">Por Vencer</h3>
            <Clock className="w-6 h-6 text-yellow-300" />
          </div>
          <p className="text-3xl font-bold text-white">{dueSoonPayables.length}</p>
          <p className="text-sm text-yellow-200 mt-1">Próximos 5 días</p>
        </div>

        <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-xl shadow-2xl border border-green-700/50 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-green-200 uppercase tracking-wider">Vigentes</h3>
            <CheckCircle className="w-6 h-6 text-green-300" />
          </div>
          <p className="text-3xl font-bold text-white">
            {pendingPayables.length - overduePayables.length - dueSoonPayables.length}
          </p>
          <p className="text-sm text-green-200 mt-1">0-30 días</p>
        </div>
      </div>

      {dueSoonPayables.length > 0 && (
        <div className="bg-gradient-to-r from-red-700 to-red-600 rounded-xl shadow-2xl border-2 border-red-400 p-6 animate-pulse">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-xl font-bold text-white">Alertas de Vencimiento</h3>
              <p className="text-red-100 text-sm mt-1">
                {dueSoonPayables.length} facturas vencen en los próximos 5 días
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-red-900/30 to-orange-900/30">
          <h3 className="text-lg font-bold text-white">Calendario de Pagos Pendientes</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Vencimiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">N° Factura</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {pendingPayables.map((payable) => {
                const daysUntilDue = getDaysUntilDue(payable.due_date);
                const isOverdue = daysUntilDue < 0;
                const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 5;

                return (
                  <tr
                    key={payable.id}
                    className={`hover:bg-slate-50 ${isOverdue ? 'bg-red-50' : isDueSoon ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {new Date(payable.due_date).toLocaleDateString('es-CL')}
                          </div>
                          <div
                            className={`text-xs font-semibold ${
                              isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-green-600'
                            }`}
                          >
                            {isOverdue
                              ? `Vencida hace ${Math.abs(daysUntilDue)} días`
                              : `Vence en ${daysUntilDue} días`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {payable.purchase_invoices?.suppliers?.business_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-700">
                      {payable.purchase_invoices?.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-slate-900 text-lg">
                      {formatCurrency(payable.amount_due)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          isOverdue
                            ? 'bg-red-100 text-red-800'
                            : isDueSoon
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {isOverdue ? 'Vencida' : isDueSoon ? 'Por vencer' : 'Vigente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => markAsPaid(payable.id)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-semibold"
                      >
                        Marcar como Pagada
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
