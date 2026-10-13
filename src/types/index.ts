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

export interface Task {
  id: string;
  title: string;
  notes: string;
  done: boolean;
  priority: Priority;
  /** ISO date string (yyyy-MM-dd) or null. */
  dueDate: string | null;
  tags: string[];
  /** Sort order for drag & drop (@dnd-kit). */
  order: number;
  /** ISO datetime string. */
  createdAt: string;
}

export type NewTask = Pick<Task, 'title'> &
  Partial<Pick<Task, 'notes' | 'priority' | 'dueDate' | 'tags'>>;

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

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}
