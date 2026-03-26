import { describe, expect, it } from 'vitest';

import {
  getMedalDisplay,
  getOtherRankedParticipants,
  getWeeklyRange,
} from './weeklyKpiHelpers';

describe('weeklyKpiHelpers', () => {
  it('calculates the Monday-Sunday range for a given date', () => {
    expect(getWeeklyRange(new Date('2026-03-26T12:00:00.000Z'))).toEqual({
      weekStart: '2026-03-23',
      weekEnd: '2026-03-29',
    });
  });

  it('maps medal codes to emoji and gradient classes', () => {
    expect(getMedalDisplay('gold')).toEqual({
      emoji: '🥇',
      colorClass: 'from-amber-500 to-yellow-500',
    });
    expect(getMedalDisplay('silver')).toEqual({
      emoji: '🥈',
      colorClass: 'from-slate-400 to-slate-500',
    });
    expect(getMedalDisplay(null)).toEqual({
      emoji: '',
      colorClass: 'from-slate-600 to-slate-700',
    });
  });

  it('assigns display ranks to participants outside the top 3', () => {
    const kpis = Array.from({ length: 5 }, (_, index) => ({
      id: `k-${index + 1}`,
      user_id: `u-${index + 1}`,
      week_start: '2026-03-23',
      week_end: '2026-03-29',
      role: 'operario',
      tasks_assigned: 10,
      tasks_completed: 8,
      completion_rate: 80,
      units_produced: 0,
      units_target: 0,
      collections_amount: 0,
      invoices_processed: 0,
      ranking_score: 80 - index,
      medal: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : null,
      created_at: '2026-03-26T00:00:00.000Z',
    }));

    expect(getOtherRankedParticipants(kpis)).toMatchObject([
      { id: 'k-4', displayRank: 4 },
      { id: 'k-5', displayRank: 5 },
    ]);
  });
});
