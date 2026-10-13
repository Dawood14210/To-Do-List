import { useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CheckCheck, Trash2, X } from 'lucide-react';
import { useAppStore } from '../store';
import { useFilteredTasks } from '../hooks/useTasks';
import { useToast } from '../hooks/useToast';
import type { Task } from '../types';
import { fireConfetti } from '../utils/confetti';
import { hapticLight } from '../utils/native';
import { BrutalButton } from '../components/BrutalButton';
import { Sticker } from '../components/Sticker';
import { QuickAddBar } from '../components/tasks/QuickAddBar';
import { TaskToolbar } from '../components/tasks/TaskToolbar';
import { TaskItem } from '../components/tasks/TaskItem';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { EmptyTasks } from '../components/tasks/EmptyTasks';

export default function TasksPage() {
  const tasks = useAppStore((state) => state.tasks);
  const categories = useAppStore((state) => state.categories);
  const view = useAppStore((state) => state.taskView);
  const setTaskView = useAppStore((state) => state.setTaskView);
  const toggleSelected = useAppStore((state) => state.toggleSelected);
  const setTaskDone = useAppStore((state) => state.setTaskDone);
  const deleteTasks = useAppStore((state) => state.deleteTasks);
  const toggleSubtask = useAppStore((state) => state.toggleSubtask);
  const moveTask = useAppStore((state) => state.moveTask);
  const toast = useToast();

  const { visible, counts, filtered } = useFilteredTasks();
  const [editing, setEditing] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const manualSort = view.sort === 'manual' && !view.selectMode;
  const selectedTasks = tasks.filter((t) => view.selected.includes(t.id));

  /* ------------------------- actions ------------------------- */

  const handleToggleDone = (task: Task) => {
    if (!task.done) {
      void hapticLight(); // light tap feedback when a task is ticked off
      const spawnedId = setTaskDone(task.id, true);
      if (task.priority === 'high') fireConfetti();
      const message = spawnedId
        ? `“${task.title}” done — next occurrence scheduled`
        : `Completed “${task.title}”`;
      toast(message, 'success', { type: 'complete-tasks', taskIds: [task.id] });
    } else {
      setTaskDone(task.id, false);
      toast(`Reopened “${task.title}”`, 'info');
    }
  };

  const handleDelete = (task: Task) => {
    deleteTasks([task.id]);
    toast(`Deleted “${task.title}”`, 'warning', { type: 'delete-tasks', tasks: [task] });
  };

  const handleBulkComplete = () => {
    const ids = selectedTasks.filter((t) => !t.done).map((t) => t.id);
    if (ids.length === 0) {
      toast('Nothing selected is unfinished', 'info');
      return;
    }
    void hapticLight();
    ids.forEach((id) => setTaskDone(id, true));
    if (selectedTasks.some((t) => t.priority === 'high')) fireConfetti();
    setTaskView({ selected: [], selectMode: false });
    toast(`Completed ${ids.length} task${ids.length === 1 ? '' : 's'}`, 'success', {
      type: 'complete-tasks',
      taskIds: ids,
    });
  };

  const handleBulkDelete = () => {
    if (selectedTasks.length === 0) return;
    const snapshot = selectedTasks.map((t) => ({ ...t }));
    deleteTasks(snapshot.map((t) => t.id));
    setTaskView({ selected: [], selectMode: false });
    toast(
      `Deleted ${snapshot.length} task${snapshot.length === 1 ? '' : 's'}`,
      'warning',
      { type: 'delete-tasks', tasks: snapshot }
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveTask(String(active.id), String(over.id));
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setFormOpen(true);
  };

  /* ------------------------- render ------------------------- */

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl uppercase leading-none sm:text-4xl">Tasks</h1>
          <Sticker color="pink" rotate={-3}>
            {counts.shown}/{counts.total} shown
          </Sticker>
        </div>
        <div className="flex items-center gap-2">
          {counts.overdue > 0 ? (
            <span className="inline-flex -rotate-2 items-center rounded-md border-2 border-red bg-red px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white shadow-brutal-sm">
              {counts.overdue} overdue
            </span>
          ) : null}
          <Sticker color="mint" rotate={1}>
            {counts.done} done
          </Sticker>
        </div>
      </div>

      <QuickAddBar />
      <TaskToolbar onNewTask={openNew} />

      {/* Bulk actions */}
      {view.selectMode ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-yellow p-3 text-ink shadow-brutal-sm dark:border-white dark:shadow-brutal-sm-invert">
          <span className="mr-1 font-mono text-xs font-bold uppercase tracking-wider">
            {view.selected.length} selected
          </span>
          <BrutalButton
            size="sm"
            variant="white"
            onClick={() =>
              setTaskView({
                selected:
                  view.selected.length === visible.length
                    ? []
                    : visible.map((t) => t.id),
              })
            }
          >
            {view.selected.length === visible.length ? 'None' : 'All'}
          </BrutalButton>
          <BrutalButton size="sm" variant="mint" onClick={handleBulkComplete}>
            <CheckCheck aria-hidden="true" size={16} strokeWidth={3} />
            Complete
          </BrutalButton>
          <BrutalButton size="sm" variant="pink" onClick={handleBulkDelete}>
            <Trash2 aria-hidden="true" size={16} strokeWidth={3} />
            Delete
          </BrutalButton>
          <BrutalButton
            size="sm"
            variant="white"
            onClick={() => setTaskView({ selectMode: false, selected: [] })}
          >
            <X aria-hidden="true" size={16} strokeWidth={3} />
            Cancel
          </BrutalButton>
        </div>
      ) : null}

      {/* List / empty state */}
      {visible.length === 0 ? (
        <EmptyTasks
          filtered={filtered}
          onClearFilters={
            filtered
              ? () =>
                  setTaskView({
                    search: '',
                    status: 'all',
                    priority: 'all',
                    category: 'all',
                    dueFrom: '',
                    dueTo: '',
                  })
              : undefined
          }
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          accessibility={{
            announcements: {
              onDragStart: ({ active }) => {
                const task = tasks.find((t) => t.id === active.id);
                return `Picked up task ${task?.title ?? active.id}`;
              },
              onDragOver: ({ active, over }) => {
                const task = tasks.find((t) => t.id === active.id);
                const overTask = tasks.find((t) => t.id === over?.id);
                return overTask
                  ? `Task ${task?.title ?? active.id} is over ${overTask.title}`
                  : `Task ${task?.title ?? active.id} is no longer over a target`;
              },
              onDragEnd: ({ active, over }) => {
                const task = tasks.find((t) => t.id === active.id);
                const overTask = tasks.find((t) => t.id === over?.id);
                return overTask
                  ? `Task ${task?.title ?? active.id} dropped into ${overTask.title}`
                  : `Task ${task?.title ?? active.id} dropped`;
              },
              onDragCancel: ({ active }) => {
                const task = tasks.find((t) => t.id === active.id);
                return `Dragging cancelled. Task ${task?.title ?? active.id} was dropped`;
              },
            },
          }}
        >
          <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-3">
              {visible.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  category={task.categoryId ? categoryById.get(task.categoryId) : undefined}
                  selectMode={view.selectMode}
                  selected={view.selected.includes(task.id)}
                  draggable={manualSort}
                  onToggleDone={handleToggleDone}
                  onToggleSelect={toggleSelected}
                  onToggleSubtask={toggleSubtask}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Sort hint */}
      {visible.length > 0 && view.sort !== 'manual' ? (
        <p className="text-center font-mono text-[11px] uppercase tracking-wider opacity-50">
          Sorted by {view.sort === 'due' ? 'due date' : view.sort} — switch to manual sort to
          drag tasks around
        </p>
      ) : null}

      <TaskFormModal open={formOpen} task={editing} onClose={() => setFormOpen(false)} />
    </div>
  );
}
