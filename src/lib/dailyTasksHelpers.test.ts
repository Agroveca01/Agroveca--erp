import { describe, expect, it } from 'vitest';

import {
  buildCompletionSet,
  formatBoardDate,
  getTodayIsoDate,
  isDailyBoardEmpty,
  markTaskCompleted,
} from './dailyTasksHelpers';

describe('dailyTasksHelpers', () => {
  it('returns the ISO date for today references', () => {
    expect(getTodayIsoDate(new Date('2026-03-26T12:00:00.000Z'))).toBe('2026-03-26');
  });

  it('builds and updates completion sets safely', () => {
    const completions = buildCompletionSet([
      { task_id: 't-1' },
      { task_id: 't-2' },
    ]);

    expect(Array.from(completions)).toEqual(['t-1', 't-2']);
    expect(Array.from(markTaskCompleted(completions, 't-3'))).toEqual(['t-1', 't-2', 't-3']);
    expect(Array.from(completions)).toEqual(['t-1', 't-2']);
  });

  it('formats the board date and detects empty states', () => {
    expect(formatBoardDate(new Date('2026-03-26T12:00:00.000Z'))).toContain('2026');
    expect(isDailyBoardEmpty([], [])).toBe(true);
    expect(
      isDailyBoardEmpty(
        [
          {
            id: 't-1',
            task_name: 'Revisar stock',
            description: null,
            assigned_role: 'operario',
            priority: 'high',
            is_critical: true,
            is_recurring: false,
            task_date: '2026-03-26',
            created_by: null,
            created_at: '2026-03-26T00:00:00.000Z',
          },
        ],
        [],
      ),
    ).toBe(false);
  });
});
