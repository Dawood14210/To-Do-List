import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isToday,
  startOfWeek,
} from 'date-fns';
import type { Habit, Task } from '../types';
import { WEEK_OPTIONS, dayKey } from './calendar';
import { isOverdue } from './tasks';

/** How many tasks the dashboard "next up" list shows. */
export const UPCOMING_LIMIT = 5;
/** Days in the little streak strip on the dashboard. */
export const STREAK_DAYS = 7;

export interface DayActivity {
  /** "2026-10-13" */
  key: string;
  date: Date;
  /** "Mon" */
  label: string;
  /** Completions on that day: finished tasks + habit check-ins. */
  count: number;
  isToday: boolean;
}

export interface TodayProgress {
  total: number;
  done: number;
  open: number;
  pct: number;
}

export interface DashboardStats {
  today: TodayProgress;
  overdue: number;
  /** Completions (tasks + habit check-ins) since Monday. */
  completedThisWeek: number;
  /** Consecutive days with at least one completion. */
  streak: number;
  /** Last 7 days ending today, oldest first. */
  streakDays: DayActivity[];
  /** Monday → Sunday of the current week. */
  week: DayActivity[];
  /** Up to `UPCOMING_LIMIT` unfinished tasks with a future due date. */
  upcoming: Task[];
}

/**
 * Completions logged on a day: tasks whose `completedAt` lands on it, plus
 * habit check-ins. Both count toward the streak and the weekly chart.
 */
function completionsOn(tasks: Task[], habits: Habit[], key: string): number {
  let count = 0;
  for (const task of tasks) {
    if (task.done && task.completedAt && dayKey(new Date(task.completedAt)) === key) count += 1;
  }
  for (const habit of habits) {
    if (habit.completedDates.includes(key)) count += 1;
  }
  return count;
}

function toDayActivity(
  tasks: Task[],
  habits: Habit[],
  date: Date
): DayActivity {
  return {
    key: dayKey(date),
    date,
    label: format(date, 'EEE'),
    count: completionsOn(tasks, habits, dayKey(date)),
    isToday: isToday(date),
  };
}

/**
 * Consecutive days with at least one completion, ending today. A day that is
 * still in progress (today, nothing finished yet) doesn't break the streak —
 * counting starts from yesterday instead.
 */
export function currentStreak(tasks: Task[], habits: Habit[], now: Date = new Date()): number {
  let cursor = now;
  if (completionsOn(tasks, habits, dayKey(cursor)) === 0) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  // Guard against absurd loops on very old seeded data.
  while (streak < 3650 && completionsOn(tasks, habits, dayKey(cursor)) > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Everything the dashboard cards, chart and list need, in one pass. */
export function buildDashboardStats(
  tasks: Task[],
  habits: Habit[],
  now: Date = new Date()
): DashboardStats {
  const todayKey = dayKey(now);
  const dueToday = tasks.filter((task) => task.dueAt && dayKey(new Date(task.dueAt)) === todayKey);
  const done = dueToday.filter((task) => task.done).length;
  const total = dueToday.length;

  const week = eachDayOfInterval({
    start: startOfWeek(now, WEEK_OPTIONS),
    end: endOfWeek(now, WEEK_OPTIONS),
  }).map((date) => toDayActivity(tasks, habits, date));

  const streakDays = eachDayOfInterval({
    start: addDays(now, -(STREAK_DAYS - 1)),
    end: now,
  }).map((date) => toDayActivity(tasks, habits, date));

  const upcoming = tasks
    .filter((task) => !task.done && task.dueAt && new Date(task.dueAt).getTime() > now.getTime())
    .sort(
      (a, b) =>
        new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime() || a.order - b.order
    )
    .slice(0, UPCOMING_LIMIT);

  return {
    today: {
      total,
      done,
      open: total - done,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
    },
    overdue: tasks.filter((task) => isOverdue(task, now)).length,
    completedThisWeek: week.reduce((sum, day) => sum + day.count, 0),
    streak: currentStreak(tasks, habits, now),
    streakDays,
    week,
    upcoming,
  };
}

/** Highest bar in the weekly chart — at least 1 so empty weeks don't divide by 0. */
export function weeklyPeak(days: DayActivity[]): number {
  return Math.max(1, ...days.map((day) => day.count));
}
