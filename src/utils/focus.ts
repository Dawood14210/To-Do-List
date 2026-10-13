import { isToday } from 'date-fns';
import type { FocusSession } from '../types';

export const MIN_SESSION_MINUTES = 1;
export const MAX_SESSION_MINUTES = 180;

/** Keep a duration sane: whole minutes inside 1…180. */
export function clampMinutes(value: number, fallback = 25): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(MAX_SESSION_MINUTES, Math.max(MIN_SESSION_MINUTES, Math.round(value)));
}

export function minutesToMs(minutes: number): number {
  return Math.max(0, minutes * 60_000);
}

/**
 * Remaining milliseconds for a timestamp-based timer. `endsAt` is an absolute
 * epoch time, so the value stays correct no matter how long the tab slept —
 * nothing here depends on how often the interval happens to fire.
 */
export function remainingMs(endsAt: number | null, now: number, frozenMs: number): number {
  if (endsAt === null) return Math.max(0, frozenMs);
  return Math.max(0, endsAt - now);
}

/** "25:00" or "1:05:30" for the big chunky clock. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

/** "45m" / "1h 15m" for summary lines. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export interface TaskSessions {
  count: number;
  minutes: number;
}

/** Completed sessions logged against one task. */
export function taskSessionStats(sessions: FocusSession[], taskId: string): TaskSessions {
  let count = 0;
  let minutes = 0;
  for (const session of sessions) {
    if (session.taskId === taskId) {
      count += 1;
      minutes += session.minutes;
    }
  }
  return { count, minutes };
}

/** Sessions per task id — the "count completed sessions per task" source. */
export function sessionsByTask(sessions: FocusSession[]): Map<string, TaskSessions> {
  const map = new Map<string, TaskSessions>();
  for (const session of sessions) {
    if (!session.taskId) continue;
    const entry = map.get(session.taskId) ?? { count: 0, minutes: 0 };
    entry.count += 1;
    entry.minutes += session.minutes;
    map.set(session.taskId, entry);
  }
  return map;
}

export interface FocusTotals {
  todayCount: number;
  todayMinutes: number;
  totalCount: number;
  totalMinutes: number;
}

export function focusTotals(sessions: FocusSession[]): FocusTotals {
  let todayCount = 0;
  let todayMinutes = 0;
  let totalMinutes = 0;

  for (const session of sessions) {
    totalMinutes += session.minutes;
    if (isToday(new Date(session.completedAt))) {
      todayCount += 1;
      todayMinutes += session.minutes;
    }
  }

  return {
    todayCount,
    todayMinutes,
    totalCount: sessions.length,
    totalMinutes,
  };
}
