import { useState, useEffect, useCallback } from 'react';
import { CheckSquare, Square, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { calculateTaskCompletionRate, splitTasksByCriticality } from '../lib/dashboardHelpers';
import {
  buildCompletionSet,
  formatBoardDate,
  getTodayIsoDate,
  isDailyBoardEmpty,
  markTaskCompleted,
} from '../lib/dailyTasksHelpers';
import { supabase, DailyTask } from '../lib/supabase';
import { useAuth } from '../contexts/useAuth';

export default function DailyTasksBoard() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());

  const loadTasks = useCallback(async () => {
    try {
      const today = getTodayIsoDate();

      const [tasksData, completionsData] = await Promise.all([
        supabase
          .from('daily_tasks')
          .select('*')
          .eq('assigned_role', profile?.role || '')
          .gte('task_date', today)
          .order('is_critical', { ascending: false })
          .order('priority', { ascending: false }),
        supabase
          .from('task_completions')
          .select('task_id')
          .eq('completed_by', user?.id || '')
          .eq('completion_date', today),
      ]);

      setTasks(tasksData.data || []);
      setCompletions(buildCompletionSet(completionsData.data || []));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [profile?.role, user?.id]);

  useEffect(() => {
    if (user && profile) {
      loadTasks();
    }
  }, [user, profile, loadTasks]);

  const toggleTask = async (taskId: string) => {
    if (completions.has(taskId)) return;

    try {
      await supabase.from('task_completions').insert([
        {
          task_id: taskId,
          completed_by: user?.id,
          completion_date: getTodayIsoDate(),
        },
      ]);

      setCompletions(markTaskCompleted(completions, taskId));
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const { completedTasks, totalTasks, completionRate } = calculateTaskCompletionRate(tasks, completions);
  const { criticalTasks, normalTasks } = splitTasksByCriticality(tasks, completions);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Tablero de Pendientes Diarios</h3>
          <p className="text-slate-400 text-sm mt-1">
            {formatBoardDate()}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-3xl font-bold text-cyan-400">{completionRate}%</div>
            <div className="text-xs text-slate-400">Cumplimiento</div>
          </div>
          <TrendingUp className="w-8 h-8 text-[#10b981]" />
        </div>
      </div>

      <div className="mb-6 bg-slate-800/50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-300">Progreso del día</span>
          <span className="font-bold text-white">
            {completedTasks} / {totalTasks} tareas
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              completionRate >= 80
                ? 'bg-[#10b981]'
                : completionRate >= 50
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  : 'bg-gradient-to-r from-red-500 to-orange-500'
            }`}
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {criticalTasks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h4 className="font-bold text-red-400">Tareas Críticas ({criticalTasks.length})</h4>
          </div>
          <div className="space-y-2">
            {criticalTasks.map((task) => (
              <div
                key={task.id}
                className="bg-red-900/30 border-2 border-red-500/50 rounded-lg p-4 animate-pulse"
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start space-x-3 w-full text-left group"
                >
                  <div className="mt-0.5">
                    {completions.has(task.id) ? (
                      <CheckSquare className="w-5 h-5 text-green-400" />
                    ) : (
                      <Square className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold ${completions.has(task.id) ? 'text-green-400 line-through' : 'text-white'}`}>
                      {task.task_name}
                    </div>
                    {task.description && (
                      <div className="text-sm text-red-200 mt-1">{task.description}</div>
                    )}
                  </div>
                  <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                    URGENTE
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h4 className="font-bold text-white">Tareas del Día</h4>
        </div>
        <div className="space-y-2">
          {isDailyBoardEmpty(criticalTasks, normalTasks) && (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No hay tareas pendientes</p>
            </div>
          )}

          {normalTasks.map((task) => {
            const isCompleted = completions.has(task.id);
            return (
              <div
                key={task.id}
                className={`bg-slate-800/50 border rounded-lg p-4 transition-all ${
                  isCompleted ? 'border-green-500/50 opacity-60' : 'border-slate-700 hover:border-cyan-500/50'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className="flex items-start space-x-3 w-full text-left group"
                  disabled={isCompleted}
                >
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckSquare className="w-5 h-5 text-green-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${isCompleted ? 'text-green-400 line-through' : 'text-white'}`}>
                      {task.task_name}
                    </div>
                    {task.description && (
                      <div className="text-sm text-slate-400 mt-1">{task.description}</div>
                    )}
                  </div>
                  {isCompleted && (
                    <span className="text-xs text-green-400 font-semibold">Completada</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {completionRate === 100 && totalTasks > 0 && (
        <div className="mt-6 bg-[#10b981] rounded-xl p-6 text-center">
          <CheckSquare className="w-12 h-12 text-white mx-auto mb-3" />
          <h4 className="text-2xl font-bold text-white mb-2">¡Excelente Trabajo!</h4>
          <p className="text-green-100">Has completado todas las tareas del día</p>
        </div>
      )}
    </div>
  );
}
