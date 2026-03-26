import { WeeklyKPI } from './supabase';

export interface WeeklyRange {
  weekStart: string;
  weekEnd: string;
}

export interface MedalDisplay {
  emoji: string;
  colorClass: string;
}

export interface RankedParticipant extends WeeklyKPI {
  displayRank: number;
}

export const getWeeklyRange = (date: Date): WeeklyRange => {
  const startDate = new Date(date);
  const startDay = startDate.getDay();
  const startDiff = startDate.getDate() - startDay + (startDay === 0 ? -6 : 1);
  const weekStart = new Date(startDate.setDate(startDiff)).toISOString().split('T')[0];

  const endDate = new Date(date);
  const endDay = endDate.getDay();
  const endDiff = endDate.getDate() - endDay + (endDay === 0 ? 0 : 7);
  const weekEnd = new Date(endDate.setDate(endDiff)).toISOString().split('T')[0];

  return { weekStart, weekEnd };
};

export const getMedalDisplay = (medal: string | null): MedalDisplay => {
  switch (medal) {
    case 'gold':
      return { emoji: '🥇', colorClass: 'from-amber-500 to-yellow-500' };
    case 'silver':
      return { emoji: '🥈', colorClass: 'from-slate-400 to-slate-500' };
    case 'bronze':
      return { emoji: '🥉', colorClass: 'from-orange-600 to-orange-700' };
    default:
      return { emoji: '', colorClass: 'from-slate-600 to-slate-700' };
  }
};

export const getOtherRankedParticipants = (kpis: WeeklyKPI[]): RankedParticipant[] => {
  return kpis.slice(3).map((kpi, index) => ({
    ...kpi,
    displayRank: index + 4,
  }));
};
