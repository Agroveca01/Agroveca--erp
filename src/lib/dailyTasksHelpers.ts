import { DailyTask, TaskCompletion } from './supabase';

export const getTodayIsoDate = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

export const formatBoardDate = (date = new Date()) => {
  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const buildCompletionSet = (completions: Pick<TaskCompletion, 'task_id'>[]): Set<string> => {
  return new Set(completions.map((completion) => completion.task_id));
};

export const markTaskCompleted = (completions: Set<string>, taskId: string): Set<string> => {
  const next = new Set(completions);
  next.add(taskId);
  return next;
};

export const isDailyBoardEmpty = (criticalTasks: DailyTask[], normalTasks: DailyTask[]) => {
  return criticalTasks.length === 0 && normalTasks.length === 0;
};
