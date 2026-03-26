import { describe, expect, it } from 'vitest';

import {
  calculateTaskCompletionRate,
  countUnreadAnnouncements,
  getTopPerformers,
  getUserRankingPosition,
  splitTasksByCriticality,
} from './dashboardHelpers';

const buildUserProfile = (id: string, fullName: string) => ({
  id,
  user_id: id,
  email: `${id}@example.com`,
  full_name: fullName,
  role: 'admin' as const,
  phone: null,
  is_active: true,
  created_at: '2026-03-26T00:00:00.000Z',
  updated_at: '2026-03-26T00:00:00.000Z',
});

describe('dashboardHelpers', () => {
  it('counts unread announcements against the read set', () => {
    expect(
      countUnreadAnnouncements(
        [
          {
            id: 'a1',
            title: 'Aviso 1',
            message: 'mensaje',
            urgency: 'informative',
            target_role: null,
            created_by: null,
            created_at: '2026-03-26T00:00:00.000Z',
            expires_at: null,
            is_active: true,
          },
          {
            id: 'a2',
            title: 'Aviso 2',
            message: 'mensaje',
            urgency: 'urgent',
            target_role: 'admin',
            created_by: 'u1',
            created_at: '2026-03-26T00:00:00.000Z',
            expires_at: null,
            is_active: true,
          },
        ],
        new Set(['a1']),
      ),
    ).toBe(1);
  });

  it('calculates task completion metrics and critical split', () => {
    const tasks = [
      {
        id: 't1',
        task_name: 'Critica',
        description: null,
        assigned_role: 'operario',
        priority: 'high',
        is_critical: true,
        is_recurring: false,
        task_date: '2026-03-26',
        created_by: null,
        created_at: '2026-03-26T00:00:00.000Z',
      },
      {
        id: 't2',
        task_name: 'Normal',
        description: null,
        assigned_role: 'operario',
        priority: 'medium',
        is_critical: false,
        is_recurring: false,
        task_date: '2026-03-26',
        created_by: null,
        created_at: '2026-03-26T00:00:00.000Z',
      },
    ];

    const completions = new Set(['t2']);

    expect(calculateTaskCompletionRate(tasks, completions)).toEqual({
      completedTasks: 1,
      totalTasks: 2,
      completionRate: 50,
    });

    expect(splitTasksByCriticality(tasks, completions)).toEqual({
      criticalTasks: [tasks[0]],
      normalTasks: [tasks[1]],
    });
  });

  it('returns top performers and user position from KPI data', () => {
    const kpis = [
      {
        id: 'k1',
        user_id: 'u1',
        week_start: '2026-03-23',
        week_end: '2026-03-29',
        role: 'admin',
        tasks_assigned: 10,
        tasks_completed: 9,
        completion_rate: 90,
        units_produced: 0,
        units_target: 0,
        collections_amount: 1000,
        invoices_processed: 1,
        ranking_score: 95,
        medal: 'gold',
        created_at: '2026-03-26T00:00:00.000Z',
        user_profiles: buildUserProfile('u1', 'Uno'),
      },
      {
        id: 'k2',
        user_id: 'u2',
        week_start: '2026-03-23',
        week_end: '2026-03-29',
        role: 'operario',
        tasks_assigned: 10,
        tasks_completed: 8,
        completion_rate: 80,
        units_produced: 5,
        units_target: 6,
        collections_amount: 0,
        invoices_processed: 0,
        ranking_score: 85,
        medal: 'silver',
        created_at: '2026-03-26T00:00:00.000Z',
        user_profiles: buildUserProfile('u2', 'Dos'),
      },
      {
        id: 'k3',
        user_id: 'u3',
        week_start: '2026-03-23',
        week_end: '2026-03-29',
        role: 'vendedor',
        tasks_assigned: 10,
        tasks_completed: 7,
        completion_rate: 70,
        units_produced: 0,
        units_target: 0,
        collections_amount: 500,
        invoices_processed: 2,
        ranking_score: 75,
        medal: 'bronze',
        created_at: '2026-03-26T00:00:00.000Z',
        user_profiles: buildUserProfile('u3', 'Tres'),
      },
      {
        id: 'k4',
        user_id: 'u4',
        week_start: '2026-03-23',
        week_end: '2026-03-29',
        role: 'operario',
        tasks_assigned: 10,
        tasks_completed: 6,
        completion_rate: 60,
        units_produced: 3,
        units_target: 5,
        collections_amount: 0,
        invoices_processed: 0,
        ranking_score: 65,
        medal: null,
        created_at: '2026-03-26T00:00:00.000Z',
        user_profiles: buildUserProfile('u4', 'Cuatro'),
      },
    ];

    expect(getTopPerformers(kpis)).toEqual(kpis.slice(0, 3));
    expect(getUserRankingPosition(kpis, 'u3')).toBe(3);
    expect(getUserRankingPosition(kpis, 'missing')).toBe(0);
  });
});
