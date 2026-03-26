import { DailyTask, SystemAnnouncement, WeeklyKPI } from './supabase';

export const countUnreadAnnouncements = (
  announcements: SystemAnnouncement[],
  reads: Set<string>,
): number => {
  return announcements.filter((announcement) => !reads.has(announcement.id)).length;
};

export const calculateTaskCompletionRate = (
  tasks: DailyTask[],
  completions: Set<string>,
): { completedTasks: number; totalTasks: number; completionRate: number } => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => completions.has(task.id)).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return { completedTasks, totalTasks, completionRate };
};

export const splitTasksByCriticality = (
  tasks: DailyTask[],
  completions: Set<string>,
): { criticalTasks: DailyTask[]; normalTasks: DailyTask[] } => {
  const criticalTasks = tasks.filter((task) => task.is_critical && !completions.has(task.id));
  const normalTasks = tasks.filter((task) => !task.is_critical);

  return { criticalTasks, normalTasks };
};

export const getTopPerformers = (kpis: WeeklyKPI[]): WeeklyKPI[] => {
  return kpis.slice(0, 3);
};

export const getUserRankingPosition = (kpis: WeeklyKPI[], userId?: string): number => {
  if (!userId) return 0;

  const index = kpis.findIndex((kpi) => kpi.user_id === userId);
  return index >= 0 ? index + 1 : 0;
};
