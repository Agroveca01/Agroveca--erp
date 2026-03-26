import { useState, useEffect, useCallback } from 'react';
import { Award, TrendingUp, Users, Download, Calendar } from 'lucide-react';
import { getTopPerformers, getUserRankingPosition } from '../lib/dashboardHelpers';
import { supabase, WeeklyKPI, ActivityLog } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function WeeklyKPIModule() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<WeeklyKPI[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const loadData = useCallback(async () => {
    try {
      const weekStart = getWeekStart(new Date());
      const weekEnd = getWeekEnd(new Date());

      const [kpisData, activitiesData] = await Promise.all([
        supabase
          .from('weekly_kpis')
          .select('*, user_profiles(*)')
          .eq('week_start', weekStart)
          .order('ranking_score', { ascending: false }),
        supabase
          .from('activity_logs')
          .select('*, user_profiles(*)')
          .gte('created_at', weekStart)
          .lte('created_at', weekEnd)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      setKpis(kpisData.data || []);
      setActivities(activitiesData.data || []);
    } catch (error) {
      console.error('Error loading KPIs:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const getWeekEnd = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? 0 : 7);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };

  const getMedalEmoji = (medal: string | null) => {
    switch (medal) {
      case 'gold':
        return '🥇';
      case 'silver':
        return '🥈';
      case 'bronze':
        return '🥉';
      default:
        return '';
    }
  };

  const getMedalColor = (medal: string | null) => {
    switch (medal) {
      case 'gold':
        return 'from-amber-500 to-yellow-500';
      case 'silver':
        return 'from-slate-400 to-slate-500';
      case 'bronze':
        return 'from-orange-600 to-orange-700';
      default:
        return 'from-slate-600 to-slate-700';
    }
  };

  const myKPI = kpis.find((k) => k.user_id === user?.id);
  const topPerformers = getTopPerformers(kpis);

  const generateReport = () => {
    alert('Funcionalidad de exportación de PDF en desarrollo');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Monitor de Rendimiento Semanal</h2>
          <p className="text-emerald-400 mt-1 font-medium">
            Semana del {getWeekStart(new Date())} al {getWeekEnd(new Date())}
          </p>
        </div>
        <button
          onClick={generateReport}
          className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
        >
          <Download className="w-5 h-5" />
          <span>Exportar Reporte PDF</span>
        </button>
      </div>

      {myKPI && (
        <div className={`bg-gradient-to-br ${getMedalColor(myKPI.medal)} rounded-xl shadow-2xl border-2 border-white/20 p-6`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-white" />
              <div>
                <h3 className="text-2xl font-bold text-white">Tu Rendimiento</h3>
                <p className="text-white/80 text-sm">{myKPI.user_profiles?.full_name}</p>
              </div>
            </div>
            {myKPI.medal && (
              <div className="text-6xl">{getMedalEmoji(myKPI.medal)}</div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-sm text-white/80 mb-1">Tareas Completadas</div>
              <div className="text-3xl font-bold text-white">
                {myKPI.tasks_completed}/{myKPI.tasks_assigned}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-sm text-white/80 mb-1">Tasa de Cumplimiento</div>
              <div className="text-3xl font-bold text-white">{myKPI.completion_rate.toFixed(1)}%</div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-sm text-white/80 mb-1">Score de Ranking</div>
              <div className="text-3xl font-bold text-white">{myKPI.ranking_score.toFixed(0)}</div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-sm text-white/80 mb-1">Posición</div>
              <div className="text-3xl font-bold text-white">
                #{getUserRankingPosition(kpis, user?.id)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-amber-400" />
          <h3 className="text-xl font-bold text-white">Ranking de Cumplimiento</h3>
        </div>

        <div className="space-y-4">
          {topPerformers.map((kpi) => (
            <div
              key={kpi.id}
              className={`bg-gradient-to-r ${getMedalColor(kpi.medal)} rounded-xl p-6 border-2 border-white/10`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-5xl">{getMedalEmoji(kpi.medal)}</div>
                  <div>
                    <div className="text-2xl font-bold text-white mb-1">
                      {kpi.user_profiles?.full_name || 'Usuario'}
                    </div>
                    <div className="text-white/80 text-sm capitalize">{kpi.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-white mb-1">{kpi.completion_rate.toFixed(0)}%</div>
                  <div className="text-white/80 text-sm">
                    {kpi.tasks_completed}/{kpi.tasks_assigned} tareas
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-xs text-white/80">Unidades Producidas</div>
                  <div className="text-lg font-bold text-white">{kpi.units_produced}</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-xs text-white/80">Cobranzas</div>
                  <div className="text-lg font-bold text-white">
                    {new Intl.NumberFormat('es-CL', {
                      style: 'currency',
                      currency: 'CLP',
                      minimumFractionDigits: 0,
                    }).format(kpi.collections_amount)}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                  <div className="text-xs text-white/80">Facturas</div>
                  <div className="text-lg font-bold text-white">{kpi.invoices_processed}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {kpis.length > 3 && (
          <div className="mt-6">
            <h4 className="font-bold text-slate-300 mb-3">Otros Participantes</h4>
            <div className="space-y-2">
              {kpis.slice(3).map((kpi, index) => (
                <div key={kpi.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 4}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{kpi.user_profiles?.full_name}</div>
                        <div className="text-xs text-slate-400 capitalize">{kpi.role}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cyan-400">{kpi.completion_rate.toFixed(0)}%</div>
                      <div className="text-xs text-slate-400">
                        {kpi.tasks_completed}/{kpi.tasks_assigned}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h3 className="text-xl font-bold text-white">Actividad Reciente del Equipo</h3>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {activities.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No hay actividad registrada esta semana</p>
            </div>
          )}

          {activities.map((activity) => (
            <div key={activity.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-white">{activity.user_profiles?.full_name}</div>
                  <div className="text-sm text-slate-300 mt-1">{activity.description}</div>
                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(activity.created_at).toLocaleString('es-CL')}
                  </div>
                </div>
                <span className="px-2 py-1 bg-cyan-900/50 text-cyan-400 text-xs font-semibold rounded-full capitalize">
                  {activity.activity_type.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
