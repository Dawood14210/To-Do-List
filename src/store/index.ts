import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Category,
  FocusSession,
  Habit,
  NewHabit,
  NewNote,
  NewTask,
  Note,
  Settings,
  Subtask,
  Task,
  TaskView,
  Theme,
  ToastItem,
  ToastType,
  UndoPayload,
} from '../types';
import { createId } from '../utils/id';
import { nextDueDate } from '../utils/tasks';
import {
  displayCategoryName,
  findCategoryByName,
  nextCategoryColor,
} from '../utils/categories';

/* ------------------------------------------------------------------ */
/* Seed data — shown on first load                                     */
/* ------------------------------------------------------------------ */

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat_study', name: 'Study', color: 'bg-blue' },
  { id: 'cat_personal', name: 'Personal', color: 'bg-pink' },
  { id: 'cat_health', name: 'Health', color: 'bg-mint' },
];

/** Category colours live in utils/categories so the picker can share them. */

function buildSeedTasks(now: Date): Task[] {
  const at = (dayOffset: number, hour: number, minute = 0): string => {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  const iso = (hoursAgo: number): string => new Date(now.getTime() - hoursAgo * 3600_000).toISOString();

  const sub = (title: string, done = false): Subtask => ({ id: createId('sub'), title, done });

  return [
    {
      id: createId('task'),
      title: 'Submit research report',
      description: 'Final draft for Prof. Khan — export as PDF before uploading.',
      dueAt: at(-1, 17),
      priority: 'high',
      categoryId: 'cat_study',
      subtasks: [sub('Finish outline', true), sub('Write first draft', true), sub('Proofread', false)],
      repeat: 'none',
      done: false,
      order: 0,
      createdAt: iso(96),
      completedAt: null,
    },
    {
      id: createId('task'),
      title: 'Review lecture notes',
      description: 'Chapters 4–5 before Thursday seminar.',
      dueAt: at(0, 18),
      priority: 'medium',
      categoryId: 'cat_study',
      subtasks: [sub('Chapter 4 notes', false), sub('Chapter 5 notes', false)],
      repeat: 'none',
      done: false,
      order: 1,
      createdAt: iso(72),
      completedAt: null,
    },
    {
      id: createId('task'),
      title: 'Morning run 5k',
      description: 'Easy pace. Rest day if the knee complains.',
      dueAt: at(1, 6, 30),
      priority: 'low',
      categoryId: 'cat_health',
      subtasks: [],
      repeat: 'daily',
      done: false,
      order: 2,
      createdAt: iso(60),
      completedAt: null,
    },
    {
      id: createId('task'),
      title: 'Buy groceries',
      description: 'Milk, oats, coffee, lemons, and something fun.',
      dueAt: at(2, 17),
      priority: 'low',
      categoryId: 'cat_personal',
      subtasks: [],
      repeat: 'none',
      done: false,
      order: 3,
      createdAt: iso(30),
      completedAt: null,
    },
    {
      id: createId('task'),
      title: 'Meditate for 10 minutes',
      description: 'Box breathing, no phone.',
      dueAt: at(0, 8),
      priority: 'medium',
      categoryId: 'cat_health',
      subtasks: [],
      repeat: 'none',
      done: true,
      order: 4,
      createdAt: iso(26),
      completedAt: iso(4),
    },
  ];
}

export function buildDefaultTaskView(): TaskView {
  return {
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    dueFrom: '',
    dueTo: '',
    sort: 'manual',
    selectMode: false,
    selected: [],
  };
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

interface AppState {
  /* ---------------- persisted state ---------------- */
  settings: Settings;
  welcomed: boolean;
  tasks: Task[];
  categories: Category[];
  taskView: TaskView;
  habits: Habit[];
  notes: Note[];
  focusSessions: FocusSession[];
  toasts: ToastItem[];

  /* ---------------- settings ---------------- */
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  markWelcomed: () => void;

  /* ---------------- tasks ---------------- */
  addTask: (input: NewTask) => Task;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void;
  deleteTasks: (ids: string[]) => void;
  /**
   * Complete / reopen a task. Completing a recurring task spawns the next
   * occurrence and returns its id; reopening removes an untouched spawn.
   */
  setTaskDone: (id: string, done: boolean) => string | null;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  /** Drag & drop: move `draggedId` to `overId`'s position (manual order). */
  moveTask: (draggedId: string, overId: string) => void;
  /** Restore tasks from an undo payload (skips existing ids). */
  restoreTasks: (tasks: Task[]) => void;

  /* ---------------- categories ---------------- */
  /** Find-or-create by name (used by quick-add `#tags`). */
  ensureCategory: (name: string) => Category;
  /** Create a category; returns the existing one when the name is taken. */
  addCategory: (name: string, color?: string) => Category;
  updateCategory: (id: string, patch: Partial<Pick<Category, 'name' | 'color'>>) => void;
  /**
   * Delete a category and move its tasks to "Uncategorized".
   * Returns the ids of the tasks that were reassigned (for undo).
   */
  deleteCategory: (id: string) => string[];
  /** Undo a delete: put the category back and re-tag its tasks. */
  restoreCategory: (category: Category, taskIds: string[]) => void;

  /* ---------------- task view ---------------- */
  setTaskView: (patch: Partial<TaskView>) => void;
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  resetTaskView: () => void;

  /* ---------------- habits ---------------- */
  addHabit: (input: NewHabit) => Habit;
  toggleHabitDate: (id: string, isoDate: string) => void;
  deleteHabit: (id: string) => void;

  /* ---------------- notes ---------------- */
  addNote: (input: NewNote) => Note;
  updateNote: (id: string, patch: Partial<Omit<Note, 'id'>>) => void;
  toggleNotePin: (id: string) => void;
  deleteNote: (id: string) => void;

  /* ---------------- focus ---------------- */
  logFocusSession: (minutes: number, taskId?: string | null) => FocusSession;

  /* ---------------- toasts + undo ---------------- */
  showToast: (message: string, type?: ToastType, undo?: UndoPayload, durationMs?: number) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  applyUndo: (payload: UndoPayload) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      /* ------------- initial state (seeded on first load) ------------- */
      settings: { theme: 'light' },
      welcomed: false,
      tasks: buildSeedTasks(new Date()),
      categories: SEED_CATEGORIES,
      taskView: buildDefaultTaskView(),
      habits: [],
      notes: [],
      focusSessions: [],
      toasts: [],

      /* ------------- settings ------------- */
      setTheme: (theme) =>
        set((state) => ({ settings: { ...state.settings, theme } })),

      toggleTheme: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme: state.settings.theme === 'light' ? 'dark' : 'light',
          },
        })),

      markWelcomed: () => set({ welcomed: true }),

      /* ------------- tasks ------------- */
      addTask: (input) => {
        const now = new Date().toISOString();
        const task: Task = {
          id: createId('task'),
          title: input.title.trim(),
          description: input.description ?? '',
          dueAt: input.dueAt ?? null,
          priority: input.priority ?? 'medium',
          categoryId: input.categoryId ?? null,
          subtasks: input.subtasks ?? [],
          repeat: input.repeat ?? 'none',
          done: input.done ?? false,
          // New tasks land on top of the manual order.
          order: -1,
          createdAt: now,
          completedAt: input.done ? now : null,
        };
        set((state) => ({
          tasks: [task, ...state.tasks.map((t) => ({ ...t, order: t.order + 1 }))],
        }));
        return task;
      },

      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...patch, ...(patch.title !== undefined ? { title: patch.title.trim() } : {}) }
              : task
          ),
        })),

      deleteTasks: (ids) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => !ids.includes(task.id)),
          taskView: {
            ...state.taskView,
            selected: state.taskView.selected.filter((id) => !ids.includes(id)),
          },
        })),

      setTaskDone: (id, done) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === id);
        if (!task || task.done === done) return null;

        if (done) {
          const completedAt = new Date().toISOString();
          let spawnedId: string | null = null;
          let next = state.tasks.map((t) =>
            t.id === id ? { ...t, done: true, completedAt } : t
          );

          if (task.repeat !== 'none') {
            const child: Task = {
              id: createId('task'),
              title: task.title,
              description: task.description,
              dueAt: nextDueDate(task.dueAt, task.repeat),
              priority: task.priority,
              categoryId: task.categoryId,
              subtasks: task.subtasks.map((s) => ({ ...s, done: false })),
              repeat: task.repeat,
              done: false,
              order: task.order,
              createdAt: completedAt,
              completedAt: null,
              spawnedFrom: task.id,
            };
            spawnedId = child.id;
            // The parent keeps its slot; the occurrence right after it shifts
            // down, and the child ties with the parent (createdAt breaks it).
            next = [
              ...next.map((t) =>
                t.id !== id && t.order > task.order ? { ...t, order: t.order + 1 } : t
              ),
              child,
            ];
          }

          set({ tasks: next });
          return spawnedId;
        }

        // Reopen: drop the untouched auto-spawned occurrence, if any.
        const cleaned = state.tasks.filter(
          (t) => !(t.spawnedFrom === id && !t.done && t.id !== id)
        );
        set({
          tasks: cleaned.map((t) =>
            t.id === id ? { ...t, done: false, completedAt: null } : t
          ),
        });
        return null;
      },

      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((sub) =>
                    sub.id === subtaskId ? { ...sub, done: !sub.done } : sub
                  ),
                }
              : task
          ),
        })),

      moveTask: (draggedId, overId) =>
        set((state) => {
          if (draggedId === overId) return state;
          const ordered = [...state.tasks].sort((a, b) => a.order - b.order);
          const from = ordered.findIndex((t) => t.id === draggedId);
          const to = ordered.findIndex((t) => t.id === overId);
          if (from === -1 || to === -1) return state;

          const [moved] = ordered.splice(from, 1);
          ordered.splice(to, 0, moved);
          return {
            tasks: ordered.map((task, index) => ({ ...task, order: index })),
          };
        }),

      restoreTasks: (tasks) =>
        set((state) => {
          const existing = new Set(state.tasks.map((t) => t.id));
          const fresh = tasks.filter((t) => !existing.has(t.id));
          if (fresh.length === 0) return state;
          const base = state.tasks.map((t) => ({ ...t, order: t.order + fresh.length }));
          return { tasks: [...base, ...fresh.map((t, i) => ({ ...t, order: i }))] };
        }),

      /* ------------- categories ------------- */
      ensureCategory: (name) => get().addCategory(name),

      addCategory: (name, color) => {
        const trimmed = name.trim();
        const existing = findCategoryByName(get().categories, trimmed);
        if (existing) return existing;

        const categories = get().categories;
        const category: Category = {
          id: createId('cat'),
          name: displayCategoryName(trimmed),
          color: color ?? nextCategoryColor(categories.length),
        };
        set({ categories: [...categories, category] });
        return category;
      },

      updateCategory: (id, patch) =>
        set((state) => ({
          categories: state.categories.map((category) => {
            if (category.id !== id) return category;
            const name = patch.name !== undefined ? patch.name.trim() : category.name;
            return {
              ...category,
              ...patch,
              // Never store a blank name, and keep the house capitalisation.
              name: name ? displayCategoryName(name) : category.name,
            };
          }),
        })),

      deleteCategory: (id) => {
        const affected = get()
          .tasks.filter((task) => task.categoryId === id)
          .map((task) => task.id);

        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
          // Tasks fall back to "Uncategorized" (categoryId: null).
          tasks: state.tasks.map((task) =>
            task.categoryId === id ? { ...task, categoryId: null } : task
          ),
          // Don't leave the task filter pointing at a deleted category.
          taskView:
            state.taskView.category === id
              ? { ...state.taskView, category: 'all' }
              : state.taskView,
        }));

        return affected;
      },

      restoreCategory: (category, taskIds) =>
        set((state) => ({
          categories: state.categories.some((item) => item.id === category.id)
            ? state.categories
            : [...state.categories, category],
          tasks: state.tasks.map((task) =>
            taskIds.includes(task.id) ? { ...task, categoryId: category.id } : task
          ),
        })),

      /* ------------- task view ------------- */
      setTaskView: (patch) =>
        set((state) => ({ taskView: { ...state.taskView, ...patch } })),

      toggleSelected: (id) =>
        set((state) => ({
          taskView: {
            ...state.taskView,
            selected: state.taskView.selected.includes(id)
              ? state.taskView.selected.filter((x) => x !== id)
              : [...state.taskView.selected, id],
          },
        })),

      clearSelection: () =>
        set((state) => ({ taskView: { ...state.taskView, selected: [] } })),

      resetTaskView: () => set({ taskView: buildDefaultTaskView() }),

      /* ------------- habits ------------- */
      addHabit: (input) => {
        const habit: Habit = {
          id: createId('habit'),
          name: input.name.trim(),
          color: input.color ?? 'bg-mint',
          completedDates: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ habits: [...state.habits, habit] }));
        return habit;
      },

      toggleHabitDate: (id, isoDate) =>
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== id) return habit;
            const done = habit.completedDates.includes(isoDate);
            return {
              ...habit,
              completedDates: done
                ? habit.completedDates.filter((d) => d !== isoDate)
                : [...habit.completedDates, isoDate],
            };
          }),
        })),

      deleteHabit: (id) =>
        set((state) => ({ habits: state.habits.filter((habit) => habit.id !== id) })),

      /* ------------- notes ------------- */
      addNote: (input) => {
        const now = new Date().toISOString();
        const note: Note = {
          id: createId('note'),
          title: input.title.trim(),
          body: input.body ?? '',
          color: input.color ?? 'bg-yellow',
          pinned: false,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ notes: [note, ...state.notes] }));
        return note;
      },

      updateNote: (id, patch) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...patch, updatedAt: new Date().toISOString() }
              : note
          ),
        })),

      toggleNotePin: (id) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, pinned: !note.pinned } : note
          ),
        })),

      deleteNote: (id) =>
        set((state) => ({ notes: state.notes.filter((note) => note.id !== id) })),

      /* ------------- focus ------------- */
      logFocusSession: (minutes, taskId = null) => {
        const session: FocusSession = {
          id: createId('focus'),
          minutes,
          taskId,
          completedAt: new Date().toISOString(),
        };
        set((state) => ({ focusSessions: [...state.focusSessions, session] }));
        return session;
      },

      /* ------------- toasts + undo ------------- */
      showToast: (message, type = 'info', undo, durationMs = 4500) => {
        const toast: ToastItem = { id: createId('toast'), message, type, undo };
        set((state) => ({ toasts: [...state.toasts, toast] }));
        window.setTimeout(() => {
          get().dismissToast(toast.id);
        }, undo ? Math.max(durationMs, 7000) : durationMs);
      },

      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

      clearToasts: () => set({ toasts: [] }),

      applyUndo: (payload) => {
        if (payload.type === 'delete-tasks') {
          get().restoreTasks(payload.tasks);
        } else if (payload.type === 'delete-category') {
          get().restoreCategory(payload.category, payload.taskIds);
        } else if (payload.type === 'move-task') {
          get().updateTask(payload.taskId, { dueAt: payload.dueAt });
        } else {
          payload.taskIds.forEach((id) => get().setTaskDone(id, false));
        }
        get().clearToasts();
      },
    }),
    {
      name: 'brutal-todo-v1',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // v1 (flat task shape) → v2 (rich task model + categories + view).
      migrate: (persisted, version) => {
        const state = persisted as Partial<AppState> & { tasks?: unknown[] };
        if (version < 2) {
          const oldTasks = (state.tasks ?? []) as Array<Record<string, unknown>>;
          const tasks: Task[] = oldTasks.map((old, index) => ({
            id: String(old.id ?? createId('task')),
            title: String(old.title ?? 'Untitled'),
            description: String(old.notes ?? ''),
            dueAt:
              typeof old.dueDate === 'string' && old.dueDate
                ? new Date(`${old.dueDate}T17:00`).toISOString()
                : null,
            priority: (old.priority as Task['priority']) ?? 'medium',
            categoryId: null,
            subtasks: [],
            repeat: 'none',
            done: Boolean(old.done),
            order: typeof old.order === 'number' ? old.order : index,
            createdAt: String(old.createdAt ?? new Date().toISOString()),
            completedAt: old.done ? String(old.createdAt ?? new Date().toISOString()) : null,
          }));

          return {
            ...state,
            tasks: tasks.length > 0 ? tasks : buildSeedTasks(new Date()),
            categories: SEED_CATEGORIES,
            taskView: buildDefaultTaskView(),
            settings: state.settings ?? { theme: 'light' },
            welcomed: Boolean(state.welcomed),
            habits: state.habits ?? [],
            notes: state.notes ?? [],
            focusSessions: state.focusSessions ?? [],
            toasts: [],
          };
        }
        return state as AppState;
      },
      // Toasts are transient: hydrate everything, drop stale notifications.
      onRehydrateStorage: () => (state) => {
        state?.clearToasts();
      },
    }
  )
);
