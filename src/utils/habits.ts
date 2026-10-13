import { addDays, format, isToday } from 'date-fns';
import type { Habit } from '../types';
import { fromDayKey } from './calendar';
import { toISODate } from './dates';

/* ------------------------------------------------------------------ */
/* Day windows                                                         */
/* ------------------------------------------------------------------ */

/** The last `count` days, oldest first, ending today (inclusive). */
export function lastNDays(count: number, now: Date = new Date()): Date[] {
  const days: Date[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(addDays(now, -offset));
  }
  return days;
}

/** Narrow weekday initial for the grid header: "M", "T", … */
export function weekdayInitial(date: Date): string {
  return format(date, 'EEEEE');
}

/** Small date stamp under each grid cell: "13". */
export function dayNumber(date: Date): string {
  return format(date, 'd');
}

export function isCheckedOn(habit: Habit, key: string): boolean {
  return habit.completedDates.includes(key);
}

/** How many of the given days are checked off. */
export function checkedCount(habit: Habit, days: Date[]): number {
  return days.reduce((total, day) => (isCheckedOn(habit, toISODate(day)) ? total + 1 : total), 0);
}

/* ------------------------------------------------------------------ */
/* Streaks                                                             */
/* ------------------------------------------------------------------ */

export interface HabitStreaks {
  /** Consecutive days ending today (or yesterday while today is still open). */
  current: number;
  /** Longest run ever recorded for this habit. */
  best: number;
  /** Total check-ins. */
  total: number;
}

const MAX_STREAK_GUARD = 3650;

/**
 * Streak maths for one habit. A day that isn't finished yet (today, unchecked)
 * never breaks a run — counting simply starts from yesterday.
 */
export function habitStreaks(completedDates: string[], now: Date = new Date()): HabitStreaks {
  const unique = [...new Set(completedDates)].filter(Boolean).sort();
  if (unique.length === 0) return { current: 0, best: 0, total: 0 };

  const set = new Set(unique);

  let cursor = now;
  if (!set.has(toISODate(cursor))) cursor = addDays(cursor, -1);

  let current = 0;
  while (current < MAX_STREAK_GUARD && set.has(toISODate(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  // Longest run anywhere in the history (DST-safe: compare midnight-to-midnight).
  let best = 1;
  let run = 1;
  for (let index = 1; index < unique.length; index += 1) {
    const previous = fromDayKey(unique[index - 1]).getTime();
    const day = fromDayKey(unique[index]).getTime();
    const gapDays = Math.round((day - previous) / 86_400_000);
    run = gapDays === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  return { current, best: Math.max(best, current), total: unique.length };
}

/** Habit + its streaks, ready for rendering. */
export function withStreaks(habit: Habit, now: Date = new Date()): Habit & { streaks: HabitStreaks } {
  return { ...habit, streaks: habitStreaks(habit.completedDates, now) };
}

/** Habits sorted by longest current streak (used for the page trophy line). */
export function bestStreak(habits: Habit[], now: Date = new Date()): number {
  return habits.reduce(
    (best, habit) => Math.max(best, habitStreaks(habit.completedDates, now).current),
    0
  );
}

export { isToday };
