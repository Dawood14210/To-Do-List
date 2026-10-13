import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import type { Category, Task } from '../types';
import { isOverdue } from './tasks';
import { toISODate } from './dates';

/* ------------------------------------------------------------------ */
/* Views + ranges                                                      */
/* ------------------------------------------------------------------ */

export const CALENDAR_VIEWS = ['month', 'week', 'agenda'] as const;
export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export const VIEW_LABELS: Record<CalendarView, string> = {
  month: 'Month',
  week: 'Week',
  agenda: 'Agenda',
};

/** Weeks start on Monday (ISO). */
export const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Number of days the agenda view looks ahead from its anchor. */
export const AGENDA_DAYS = 30;

/** Default due time (17:00) used when a task without a due date is placed on a day. */
export const DEFAULT_DUE_TIME = '17:00';

/** All day cells of the month grid — padded to whole Mon→Sun weeks. */
export function buildMonthGrid(anchor: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(anchor), WEEK_OPTIONS),
    end: endOfWeek(endOfMonth(anchor), WEEK_OPTIONS),
  });
}

/** The seven days of the week containing `anchor`. */
export function buildWeek(anchor: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(anchor, WEEK_OPTIONS),
    end: endOfWeek(anchor, WEEK_OPTIONS),
  });
}

export function agendaRange(anchor: Date): { start: Date; end: Date } {
  const start = startOfDay(anchor);
  return { start, end: addDays(start, AGENDA_DAYS - 1) };
}

/** Move the anchor one period in the given direction (month / week / 7 days). */
export function shiftAnchor(view: CalendarView, anchor: Date, direction: 1 | -1): Date {
  if (view === 'month') return addMonths(anchor, direction);
  if (view === 'week') return addWeeks(anchor, direction);
  return addDays(anchor, direction * 7);
}

/** Chunky label for the period currently on screen. */
export function periodLabel(view: CalendarView, anchor: Date): string {
  if (view === 'month') return format(anchor, 'MMMM yyyy');
  if (view === 'week') {
    const days = buildWeek(anchor);
    return `${format(days[0], 'd MMM')} – ${format(days[6], 'd MMM yyyy')}`;
  }
  const { start, end } = agendaRange(anchor);
  return `${format(start, 'd MMM')} – ${format(end, 'd MMM yyyy')}`;
}

/** Compact period label for narrow screens ("Oct 2026", "12 – 18 Oct"). */
export function shortPeriodLabel(view: CalendarView, anchor: Date): string {
  if (view === 'month') return format(anchor, 'MMM yyyy');
  if (view === 'week') {
    const days = buildWeek(anchor);
    return `${format(days[0], 'd MMM')} – ${format(days[6], 'd MMM')}`;
  }
  const { start, end } = agendaRange(anchor);
  return `${format(start, 'd MMM')} – ${format(end, 'd MMM')}`;
}

/* ------------------------------------------------------------------ */
/* Tasks ↔ days                                                        */
/* ------------------------------------------------------------------ */

/** Stable key for a calendar day: "2026-10-13". */
export function dayKey(date: Date): string {
  return toISODate(date);
}

/** Parse a "yyyy-MM-dd" key back into a local Date (midnight). */
export function fromDayKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function taskDayKey(task: Task): string | null {
  return task.dueAt ? toISODate(new Date(task.dueAt)) : null;
}

/** Chronological within a day; undated last, ties broken by manual order. */
export function sortDayTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const at = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bt = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    return at - bt || a.order - b.order;
  });
}

/** Bucket every scheduled task by its "yyyy-MM-dd" day. */
export function groupTasksByDay(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = taskDayKey(task);
    if (!key) continue;
    const bucket = map.get(key);
    if (bucket) bucket.push(task);
    else map.set(key, [task]);
  }
  for (const [key, bucket] of map) map.set(key, sortDayTasks(bucket));
  return map;
}

/**
 * Re-date a task, keeping its time of day. Tasks without a due date get the
 * default 17:00 slot so they land somewhere visible on the grid.
 */
export function moveDueToDay(dueAt: string | null, key: string): string {
  let hour = 17;
  let minute = 0;

  if (dueAt) {
    const current = new Date(dueAt);
    hour = current.getHours();
    minute = current.getMinutes();
  } else {
    [hour, minute] = DEFAULT_DUE_TIME.split(':').map(Number);
  }

  const day = fromDayKey(key);
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hour,
    minute,
    0,
    0
  ).toISOString();
}

export function isOverdueOnDay(task: Task, key: string, now: Date = new Date()): boolean {
  return isOverdue(task, now) && taskDayKey(task) === key;
}

/* ------------------------------------------------------------------ */
/* Drag & drop ids                                                     */
/* ------------------------------------------------------------------ */

const DROP_PREFIX = 'day:';

/** Droppable id for a day cell: "day:2026-10-13". */
export function dropId(key: string): string {
  return `${DROP_PREFIX}${key}`;
}

/** Read the day key back out of a droppable id (null when it isn't one). */
export function dayFromDropId(id: string | number | undefined | null): string | null {
  if (typeof id !== 'string' || !id.startsWith(DROP_PREFIX)) return null;
  return id.slice(DROP_PREFIX.length);
}

export function countOverdue(tasks: Task[], now: Date = new Date()): number {
  return tasks.reduce((total, task) => (isOverdue(task, now) ? total + 1 : total), 0);
}

/* ------------------------------------------------------------------ */
/* Presentational helpers                                              */
/* ------------------------------------------------------------------ */

/** Dot / accent colour for a category (uncategorised = ink, inverted in dark). */
export function categoryDotClass(category?: Category): string {
  return category?.color ?? 'bg-ink dark:bg-white';
}

/** "TODAY" / "TUE 14 OCT" — short day header used by the agenda + panel. */
export function friendlyDayLabel(date: Date, now: Date = new Date()): string {
  const key = dayKey(date);
  if (key === dayKey(now)) return 'Today';
  if (key === dayKey(addDays(now, 1))) return 'Tomorrow';
  if (key === dayKey(addDays(now, -1))) return 'Yesterday';
  return format(date, 'EEE d MMM');
}

/** Compact time stamp for a task ("6:30am"), or '' when undated. */
export function shortTime(dueAt: string | null): string {
  if (!dueAt) return '';
  return format(new Date(dueAt), 'h:mmaaa').replace(':00', '').toLowerCase();
}
