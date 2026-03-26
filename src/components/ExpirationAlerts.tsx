import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BatchAlert {
  id: string;
  batch_number: string;
  production_date: string;
  expiration_date: string;
  shelf_life_months: number;
  alert_threshold_months: number;
  product_name: string;
  product_id: string;
  product_type: string;
  age_days: number;
  days_until_expiration: number;
  status: 'good' | 'warning' | 'expired' | 'no_expiration';
}

export default function ExpirationAlerts() {
  const [alerts, setAlerts] = useState<BatchAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'warning' | 'expired'>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('batch_expiration_alerts')
        .select('*')
        .order('days_until_expiration', { ascending: true });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading expiration alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  const warningCount = alerts.filter(a => a.status === 'warning').length;
  const expiredCount = alerts.filter(a => a.status === 'expired').length;
  const filterOptions: Array<{ value: 'all' | 'warning' | 'expired'; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'warning', label: 'Advertencia' },
    { value: 'expired', label: 'Vencidos' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 animate-pulse';
      case 'expired':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <p className="text-slate-400 mt-4">Cargando alertas...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-2 rounded-lg shadow-lg shadow-yellow-500/30">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Alertas de Caducidad</h3>
              <p className="text-sm text-slate-400">Lotes con biológicos (Trichodermas)</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1">
              <span className="text-red-400 font-bold">{expiredCount}</span>
              <span className="text-red-300 text-sm ml-1">vencidos</span>
            </div>
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-3 py-1">
              <span className="text-yellow-400 font-bold">{warningCount}</span>
              <span className="text-yellow-300 text-sm ml-1">por vencer</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-800/30">
        <div className="flex space-x-2">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                filter === option.value
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50 border-b border-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Lote
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Producción
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Vencimiento
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Días Restantes
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Edad
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  <p className="text-slate-400">No hay alertas para mostrar</p>
                </td>
              </tr>
            ) : (
              filteredAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(alert.status)}
                      <span className={`px-2 py-1 text-xs font-bold rounded border ${getStatusBadge(alert.status)}`}>
                        {alert.status === 'good' ? 'Bueno' : alert.status === 'warning' ? 'Advertencia' : 'Vencido'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm text-slate-300">
                      {alert.batch_number.split('-').pop()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-white">{alert.product_name}</div>
                      <div className="text-sm text-slate-400">{alert.product_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {formatDate(alert.production_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {formatDate(alert.expiration_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-bold text-lg ${
                      alert.days_until_expiration <= 0 ? 'text-red-400' :
                      alert.days_until_expiration <= 30 ? 'text-yellow-400' :
                      'text-emerald-400'
                    }`}>
                      {alert.days_until_expiration > 0 ? alert.days_until_expiration : 0} días
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                    {Math.floor(alert.age_days / 30)} meses
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {warningCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-t border-yellow-500/20">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-medium">
                Atención: {warningCount} lote{warningCount !== 1 ? 's' : ''} cerca de su fecha de caducidad
              </p>
              <p className="text-yellow-300/70 text-sm mt-1">
                Los biológicos (Trichodermas) tienen una vida útil de 12 meses. Se recomienda usar estos lotes antes de que expiren.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
