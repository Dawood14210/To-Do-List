import { useDroppable } from '@dnd-kit/core';
import { AlertTriangle, Plus } from 'lucide-react';
import { format, isToday } from 'date-fns';
import type { Category, Task } from '../../types';
import { cn } from '../../utils/cn';
import { isOverdue } from '../../utils/tasks';
import { categoryDotClass, dayKey, dropId } from '../../utils/calendar';
import { CalendarTaskChip } from './CalendarTaskChip';

interface WeekGridProps {
  days: Date[];
  tasksByDay: Map<string, Task[]>;
  categoryById: Map<string, Category>;
  selectedDay: string | null;
  onSelectDay: (key: string) => void;
  onOpenTask: (task: Task) => void;
  onAddTask: (key: string) => void;
}

/**
 * Seven chunky day columns. Each column is a drop target (drag a task card
 * onto another day to reschedule) and taps through to the day panel.
 */
export function WeekGrid({
  days,
  tasksByDay,
  categoryById,
  selectedDay,
  onSelectDay,
  onOpenTask,
  onAddTask,
}: WeekGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:gap-2">
      {days.map((day) => {
        const key = dayKey(day);
        return (
          <WeekDayColumn
            key={key}
            day={day}
            tasks={tasksByDay.get(key) ?? []}
            selected={selectedDay === key}
            categoryById={categoryById}
            onSelect={() => onSelectDay(key)}
            onOpenTask={onOpenTask}
            onAddTask={() => onAddTask(key)}
          />
        );
      })}
    </div>
  );
}

interface WeekDayColumnProps {
  day: Date;
  tasks: Task[];
  selected: boolean;
  categoryById: Map<string, Category>;
  onSelect: () => void;
  onOpenTask: (task: Task) => void;
  onAddTask: () => void;
}

function WeekDayColumn({
  day,
  tasks,
  selected,
  categoryById,
  onSelect,
  onOpenTask,
  onAddTask,
}: WeekDayColumnProps) {
  const key = dayKey(day);
  const today = isToday(day);
  const { setNodeRef, isOver } = useDroppable({ id: dropId(key), data: { day: key } });
  const overdueCount = tasks.filter((task) => isOverdue(task)).length;

  return (
    <section
      ref={setNodeRef}
      aria-label={`${format(day, 'EEEE d MMMM')} — ${tasks.length} task${
        tasks.length === 1 ? '' : 's'
      }`}
      className={cn(
        'flex min-h-[140px] flex-col rounded-md border bg-white text-ink transition-colors duration-100 dark:bg-black dark:text-white lg:min-h-[360px]',
        'shadow-brutal-sm dark:shadow-brutal-sm-invert',
        today ? 'border-4 border-blue dark:border-blue' : 'border-black dark:border-white',
        isOver && 'bg-mint',
        selected && 'outline outline-4 outline-offset-2 outline-pink'
      )}
    >
      {/* Column header = tap target for the day panel */}
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-t-sm px-2 py-2 text-left transition-colors duration-100',
          today ? 'bg-blue' : 'bg-cream hover:bg-yellow dark:bg-black dark:hover:bg-yellow/20'
        )}
      >
        <span className="flex items-baseline gap-2">
          <span className="font-heading text-sm uppercase leading-none">
            {format(day, 'EEE')}
          </span>
          <span className="font-mono text-xs font-bold uppercase">{format(day, 'd MMM')}</span>
        </span>
        <span className="flex items-center gap-1">
          {overdueCount > 0 ? (
            <AlertTriangle aria-hidden="true" size={14} strokeWidth={3} className="text-red" />
          ) : null}
          <span className="grid h-6 min-w-6 place-items-center rounded-sm border-2 border-black bg-white px-1 font-mono text-[11px] font-bold dark:border-white dark:bg-black">
            {tasks.length}
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-2">
        {today ? (
          <span className="self-start rounded-sm border-2 border-black bg-blue px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
            Today
          </span>
        ) : null}

        {tasks.map((task) => (
          <CalendarTaskChip
            key={task.id}
            task={task}
            category={categoryById.get(task.categoryId ?? '')}
            dragId={`grid:${task.id}`}
            size="row"
            showTime
            onOpen={onOpenTask}
          />
        ))}

        {tasks.length === 0 ? (
          <p className="pointer-events-none px-1 py-2 font-mono text-[10px] uppercase tracking-wider opacity-50">
            Free
          </p>
        ) : null}

        <div className="mt-auto pt-1">
          <button
            type="button"
            onClick={onAddTask}
            aria-label={`Add a task on ${format(day, 'EEEE d MMMM')}`}
            className="flex min-h-12 w-full items-center justify-center gap-1 rounded-md border-2 border-dashed border-black font-mono text-[11px] font-bold uppercase tracking-wider transition-colors duration-100 hover:bg-yellow dark:border-white dark:hover:bg-yellow dark:hover:text-ink"
          >
            <Plus aria-hidden="true" size={14} strokeWidth={3} />
            Add
          </button>
        </div>
      </div>
    </section>
  );
}

/** Tiny legend under the grid: one dot per category with tasks. */
export function CategoryLegend({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Map<string, number>;
}) {
  const used = categories.filter((category) => (counts.get(category.id) ?? 0) > 0);
  if (used.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {used.map((category) => (
        <li key={category.id} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn('h-3 w-3 rounded-full border border-black dark:border-white', categoryDotClass(category))}
          />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
            {category.name}
          </span>
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="h-3 w-3 rounded-full border border-black bg-red dark:border-white"
        />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Overdue</span>
      </li>
    </ul>
  );
}
