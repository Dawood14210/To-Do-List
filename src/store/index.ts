import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  FocusSession,
  Habit,
  NewHabit,
  NewNote,
  NewTask,
  Note,
  Settings,
  Task,
  Theme,
  ToastItem,
  ToastType,
} from '../types';
import { createId } from '../utils/id';

/**
 * The single app store. Everything (settings, tasks, habits, notes, focus
 * sessions, even the toast queue) lives here and is persisted to
 * localStorage via zustand/middleware `persist`.
 */
interface AppState {
  /* ---------------- persisted state ---------------- */
  settings: Settings;
  welcomed: boolean;
  tasks: Task[];
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
  toggleTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (id: string) => void;
  /** Reorder for @dnd-kit — pass ids in their new visual order. */
  reorderTasks: (orderedIds: string[]) => void;

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

  /* ---------------- toasts ---------------- */
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      /* ------------- initial state ------------- */
      settings: { theme: 'light' },
      welcomed: false,
      tasks: [],
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
        const task: Task = {
          id: createId('task'),
          title: input.title.trim(),
          notes: input.notes ?? '',
          done: false,
          priority: input.priority ?? 'medium',
          dueDate: input.dueDate ?? null,
          tags: input.tags ?? [],
          order: get().tasks.length,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        return task;
      },

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, done: !task.done } : task
          ),
        })),

      updateTask: (id, patch) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...patch } : task
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),

      reorderTasks: (orderedIds) =>
        set((state) => ({
          tasks: state.tasks.map((task) => {
            const index = orderedIds.indexOf(task.id);
            return index === -1 ? task : { ...task, order: index };
          }),
        })),

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

      /* ------------- toasts ------------- */
      showToast: (message, type = 'info') => {
        const toast: ToastItem = { id: createId('toast'), message, type };
        set((state) => ({ toasts: [...state.toasts, toast] }));
        window.setTimeout(() => {
          get().dismissToast(toast.id);
        }, 4500);
      },

      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

      clearToasts: () => set({ toasts: [] }),
    }),
    {
      name: 'brutal-todo-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Toasts are transient UI state: hydrate everything, but drop any
      // toast left over from a previous session.
      onRehydrateStorage: () => (state) => {
        state?.clearToasts();
      },
    }
  )
);
