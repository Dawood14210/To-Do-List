import { addDays, addMonths, addWeeks, format, isSameDay, isToday, isTomorrow, isYesterday } from 'date-fns';
import type { Category, Priority, Repeat, SortKey, StatusFilter, Task } from '../types';

/* ------------------------------------------------------------------ */
/* Priority                                                            */
/* ------------------------------------------------------------------ */

export const PRIORITY_META: Record<
  Priority,
  { label: string; long: string; color: string; sticker: 'mint' | 'orange' | 'pink'; rank: number }
> = {
  low: { label: 'LOW', long: 'Low', color: 'bg-mint', sticker: 'mint', rank: 2 },
  medium: { label: 'MED', long: 'Medium', color: 'bg-orange', sticker: 'orange', rank: 1 },
  high: { label: 'HIGH', long: 'High', color: 'bg-pink', sticker: 'pink', rank: 0 },
};

export const REPEAT_LABELS: Record<Repeat, string> = {
  none: 'NONE',
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
};

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export function isOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.done || !task.dueAt) return false;
  return new Date(task.dueAt).getTime() < now.getTime();
}

export type DueTone = 'overdue' | 'today' | 'tomorrow' | 'other' | 'none';

/** Human chip label + tone for a task's due date/time. */
export function dueMeta(task: Task): { label: string; tone: DueTone } {
  if (!task.dueAt) return { label: '', tone: 'none' };
  const date = new Date(task.dueAt);
  const time = format(date, 'h:mm a');
  const overdue = isOverdue(task);

  if (overdue && isYesterday(date)) return { label: `YESTERDAY · ${time}`, tone: 'overdue' };
  if (overdue) return { label: `${format(date, 'd MMM')} · ${time}`, tone: 'overdue' };
  if (isToday(date)) return { label: `TODAY · ${time}`, tone: 'today' };
  if (isTomorrow(date)) return { label: `TOMORROW · ${time}`, tone: 'tomorrow' };
  return { label: `${format(date, 'EEE d MMM')} · ${time}`, tone: 'other' };
}

/** Advance a recurring task's due date by one period until it is in the future. */
export function nextDueDate(dueAt: string | null, repeat: Repeat, from: Date = new Date()): string | null {
  if (repeat === 'none') return dueAt;
  const step =
    repeat === 'daily'
      ? (d: Date) => addDays(d, 1)
      : repeat === 'weekly'
        ? (d: Date) => addWeeks(d, 1)
        : (d: Date) => addMonths(d, 1);

  let next = dueAt ? new Date(dueAt) : new Date(from);
  let guard = 0;
  do {
    next = step(next);
    guard += 1;
  } while (next.getTime() <= from.getTime() && guard < 800);
  return next.toISOString();
}

export function isSameDayAs(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

/* ------------------------------------------------------------------ */
/* Filtering + sorting                                                 */
/* ------------------------------------------------------------------ */

export interface TaskFilters {
  search: string;
  status: StatusFilter;
  priority: string;
  category: string;
  dueFrom: string;
  dueTo: string;
}

export function matchesFilters(
  task: Task,
  filters: TaskFilters,
  category: Category | undefined,
  now: Date = new Date()
): boolean {
  const { search, status, priority, category: cat, dueFrom, dueTo } = filters;

  if (status === 'active' && task.done) return false;
  if (status === 'done' && !task.done) return false;
  if (status === 'overdue' && !isOverdue(task, now)) return false;
  if (priority !== 'all' && task.priority !== priority) return false;
  if (cat !== 'all' && (task.categoryId ?? '') !== cat) return false;

  if (dueFrom || dueTo) {
    if (!task.dueAt) return false;
    const day = format(new Date(task.dueAt), 'yyyy-MM-dd');
    if (dueFrom && day < dueFrom) return false;
    if (dueTo && day > dueTo) return false;
  }

  if (search.trim()) {
    const needle = search.trim().toLowerCase();
    const haystack = [
      task.title,
      task.description,
      category?.name ?? '',
      ...task.subtasks.map((s) => s.title),
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(needle)) return false;
  }

  return true;
}

/** Active tasks first, then the chosen sort. Manual = drag order. */
export function sortTasks(tasks: Task[], sort: SortKey): Task[] {
  const byDue = (a: Task, b: Task) => {
    const at = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bt = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    return at - bt || a.order - b.order;
  };

  const comparator =
    sort === 'due'
      ? byDue
      : sort === 'priority'
        ? (a: Task, b: Task) =>
            PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank || byDue(a, b)
        : sort === 'created'
          ? (a: Task, b: Task) => b.createdAt.localeCompare(a.createdAt) || a.order - b.order
          : (a: Task, b: Task) => a.order - b.order || a.createdAt.localeCompare(b.createdAt);

  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return comparator(a, b);
  });
}

export function isFiltered(filters: TaskFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.category !== 'all' ||
    filters.dueFrom !== '' ||
    filters.dueTo !== ''
  );
}
