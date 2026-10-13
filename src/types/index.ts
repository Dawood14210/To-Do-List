import type { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind background class used when the route is active. */
  color: string;
  /** Exact-match routes (react-router `end` prop). */
  end?: boolean;
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export type Priority = 'low' | 'medium' | 'high';

export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  /** ISO datetime (due date + time) or null. */
  dueAt: string | null;
  priority: Priority;
  /** Reference into `categories`; null = uncategorised. */
  categoryId: string | null;
  subtasks: Subtask[];
  repeat: Repeat;
  done: boolean;
  /** Manual sort order for drag & drop (@dnd-kit). */
  order: number;
  /** ISO datetime. */
  createdAt: string;
  /** ISO datetime — set when completed, cleared when reopened. */
  completedAt: string | null;
  /** Id of the task this one was auto-spawned from (recurring). */
  spawnedFrom?: string;
}

export type NewTask = Partial<Omit<Task, 'id' | 'order' | 'createdAt' | 'completedAt' | 'spawnedFrom'>> & {
  title: string;
};

export interface Category {
  id: string;
  name: string;
  /** Tailwind background class, e.g. "bg-blue". */
  color: string;
}

/* ------------------------------------------------------------------ */
/* Task view (search / filters / sort / selection) — persisted         */
/* ------------------------------------------------------------------ */

export type StatusFilter = 'all' | 'active' | 'done' | 'overdue';
export type PriorityFilter = 'all' | Priority;
export type SortKey = 'manual' | 'due' | 'priority' | 'created';

export interface TaskView {
  search: string;
  status: StatusFilter;
  priority: PriorityFilter;
  /** Category id or 'all'. */
  category: string;
  /** yyyy-MM-dd range bounds on the due date, '' = open. */
  dueFrom: string;
  dueTo: string;
  sort: SortKey;
  selectMode: boolean;
  selected: string[];
}

/* ------------------------------------------------------------------ */
/* Habits                                                              */
/* ------------------------------------------------------------------ */

export interface Habit {
  id: string;
  name: string;
  /** Tailwind background class, e.g. "bg-mint". */
  color: string;
  /** ISO dates (yyyy-MM-dd) on which the habit was completed. */
  completedDates: string[];
  /** ISO datetime string. */
  createdAt: string;
}

export type NewHabit = Pick<Habit, 'name'> & Partial<Pick<Habit, 'color'>>;

/* ------------------------------------------------------------------ */
/* Notes                                                               */
/* ------------------------------------------------------------------ */

export interface Note {
  id: string;
  title: string;
  body: string;
  /** Tailwind background class, e.g. "bg-yellow". */
  color: string;
  pinned: boolean;
  /** ISO datetime string. */
  createdAt: string;
  /** ISO datetime string. */
  updatedAt: string;
}

export type NewNote = Pick<Note, 'title'> & Partial<Pick<Note, 'body' | 'color'>>;

/* ------------------------------------------------------------------ */
/* Focus                                                               */
/* ------------------------------------------------------------------ */

export interface FocusSession {
  id: string;
  minutes: number;
  /** Related task id, if any. */
  taskId: string | null;
  /** ISO datetime string. */
  completedAt: string;
}

/* ------------------------------------------------------------------ */
/* Settings + toasts                                                   */
/* ------------------------------------------------------------------ */

export type Theme = 'light' | 'dark';

export interface Settings {
  theme: Theme;
}

export type ToastType = 'info' | 'success' | 'warning' | 'error';

/** Serializable undo payload — survives JSON, replayed by the store. */
export type UndoPayload =
  | { type: 'delete-tasks'; tasks: Task[] }
  | { type: 'complete-tasks'; taskIds: string[] }
  /** Calendar reschedule: put `taskId` back on its previous due date. */
  | { type: 'move-task'; taskId: string; dueAt: string | null };

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  undo?: UndoPayload;
}
