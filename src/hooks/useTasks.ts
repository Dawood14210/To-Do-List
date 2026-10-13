import { useMemo } from 'react';
import { useAppStore } from '../store';
import { isFiltered, matchesFilters, sortTasks, type TaskFilters } from '../utils/tasks';
import type { Task } from '../types';

export interface TaskCounts {
  total: number;
  done: number;
  overdue: number;
  shown: number;
}

export interface FilteredTasks {
  visible: Task[];
  counts: TaskCounts;
  filtered: boolean;
}

/**
 * Applies the persisted task view (search, filters, sort) to the task list.
 */
export function useFilteredTasks(): FilteredTasks {
  const tasks = useAppStore((state) => state.tasks);
  const categories = useAppStore((state) => state.categories);
  const view = useAppStore((state) => state.taskView);

  return useMemo(() => {
    const categoryById = new Map(categories.map((c) => [c.id, c]));
    const now = new Date();

    const filters: TaskFilters = {
      search: view.search,
      status: view.status,
      priority: view.priority,
      category: view.category,
      dueFrom: view.dueFrom,
      dueTo: view.dueTo,
    };

    const matching = tasks.filter((task) =>
      matchesFilters(task, filters, categoryById.get(task.categoryId ?? ''), now)
    );
    const visible = sortTasks(matching, view.sort);

    let overdue = 0;
    for (const task of tasks) {
      if (!task.done && task.dueAt && new Date(task.dueAt).getTime() < now.getTime()) overdue += 1;
    }

    return {
      visible,
      counts: {
        total: tasks.length,
        done: tasks.filter((t) => t.done).length,
        overdue,
        shown: visible.length,
      },
      filtered: isFiltered(filters),
    };
  }, [tasks, categories, view]);
}
