import { useDroppable } from '@dnd-kit/core';
import { AlertTriangle } from 'lucide-react';
import { format, isSameMonth, isToday, isWeekend } from 'date-fns';
import type { Category, Task } from '../../types';
import { cn } from '../../utils/cn';
import { isOverdue } from '../../utils/tasks';
import { WEEKDAY_LABELS, categoryDotClass, dayKey, dropId } from '../../utils/calendar';
import { CalendarTaskChip } from './CalendarTaskChip';

/** Mini labels shown in a desktop cell before the "+N more" chip. */
const MAX_CHIPS = 2;
/** Colour dots shown in a mobile cell before "+N". */
const MAX_DOTS = 4;

interface MonthGridProps {
  anchor: Date;
  days: Date[];
  tasksByDay: Map<string, Task[]>;
  categoryById: Map<string, Category>;
  selectedDay: string | null;
  onSelectDay: (key: string) => void;
  onOpenTask: (task: Task) => void;
}

/**
 * Chunky month grid: one bordered block per day, thick blue border on today,
 * a colour dot (mobile) or mini label (desktop) per task.
 */
export function MonthGrid({
  anchor,
  days,
  tasksByDay,
  categoryById,
  selectedDay,
  onSelectDay,
  onOpenTask,
}: MonthGridProps) {
  return (
    <div className="space-y-2">
      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAY_LABELS.map((label, index) => (
          <span
            key={label}
            className={cn(
              'rounded-md border py-1.5 text-center font-mono text-[10px] font-bold uppercase tracking-wider sm:text-xs',
              index >= 5 ? 'bg-pink text-ink' : 'bg-blue text-ink'
            )}
          >
            <span className="sm:hidden">{label.charAt(0)}</span>
            <span className="hidden sm:inline">{label}</span>
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const key = dayKey(day);
          const tasks = tasksByDay.get(key) ?? [];
          return (
            <MonthDayCell
              key={key}
              day={day}
              tasks={tasks}
              inMonth={isSameMonth(day, anchor)}
              selected={selectedDay === key}
              categoryById={categoryById}
              onSelect={onSelectDay}
              onOpenTask={onOpenTask}
            />
          );
        })}
      </div>
    </div>
  );
}

interface MonthDayCellProps {
  day: Date;
  tasks: Task[];
  inMonth: boolean;
  selected: boolean;
  categoryById: Map<string, Category>;
  onSelect: (key: string) => void;
  onOpenTask: (task: Task) => void;
}

function MonthDayCell({
  day,
  tasks,
  inMonth,
  selected,
  categoryById,
  onSelect,
  onOpenTask,
}: MonthDayCellProps) {
  const key = dayKey(day);
  const today = isToday(day);
  const weekend = isWeekend(day);
  const { setNodeRef, isOver } = useDroppable({ id: dropId(key), data: { day: key } });

  const overdueCount = tasks.filter((task) => isOverdue(task)).length;
  const chips = tasks.slice(0, MAX_CHIPS);
  const hidden = tasks.length - chips.length;
  const dots = tasks.slice(0, MAX_DOTS);
  const dotOverflow = tasks.length - dots.length;
  const summary = `${format(day, 'EEEE d MMMM yyyy')} — ${tasks.length} task${
    tasks.length === 1 ? '' : 's'
  }${overdueCount > 0 ? `, ${overdueCount} overdue` : ''}`;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative flex min-h-[76px] flex-col gap-1 rounded-md border bg-white p-1.5 text-ink transition-colors duration-100 dark:bg-black dark:text-white sm:min-h-[120px] sm:p-2',
        'shadow-brutal-sm dark:shadow-brutal-sm-invert',
        today ? 'border-4 border-blue dark:border-blue' : 'border-black dark:border-white',
        !today && weekend && inMonth && 'bg-cream dark:bg-black',
        isOver && 'bg-mint',
        selected && 'outline outline-4 outline-offset-2 outline-pink'
      )}
    >
      {/* Whole-cell tap target — sits under the task chips. */}
      <button
        type="button"
        onClick={() => onSelect(key)}
        aria-label={`Open ${summary}`}
        aria-pressed={selected}
        className={cn(
          'absolute inset-0 z-0 rounded-md transition-colors duration-100',
          'hoverable:bg-yellow/40 dark:hoverable:bg-yellow/20',
          isOver && 'bg-transparent hoverable:bg-transparent'
        )}
      />

      <div
        className={cn(
          'pointer-events-none relative z-10 flex items-start justify-between gap-1',
          !inMonth && 'opacity-40'
        )}
      >
        <span
          className={cn(
            'grid h-6 min-w-6 place-items-center rounded-sm border-2 px-1 font-mono text-[11px] font-bold sm:h-7 sm:min-w-7 sm:text-sm',
            today
              ? 'border-black bg-blue text-ink dark:border-white'
              : 'border-black bg-white dark:border-white dark:bg-black'
          )}
        >
          {format(day, 'd')}
        </span>

        <span className="flex items-center gap-0.5">
          {overdueCount > 0 ? (
            <AlertTriangle
              aria-hidden="true"
              size={14}
              strokeWidth={3}
              className="text-red"
              data-testid="cell-overdue-warning"
            />
          ) : null}
        </span>
      </div>

      {/* Mobile: colour dots by category */}
      <div
        className={cn(
          'pointer-events-none relative z-10 flex flex-wrap items-center gap-1 sm:hidden',
          !inMonth && 'opacity-40'
        )}
      >
        {dots.map((task) => (
          <span
            key={task.id}
            aria-hidden="true"
            className={cn(
              'h-2.5 w-2.5 rounded-full border border-black dark:border-white',
              isOverdue(task) ? 'bg-red' : categoryDotClass(categoryById.get(task.categoryId ?? ''))
            )}
          />
        ))}
        {dotOverflow > 0 ? (
          <span className="font-mono text-[10px] font-bold opacity-70">+{dotOverflow}</span>
        ) : null}
      </div>

      {/* Desktop: mini labels (draggable). Wrapper ignores pointer events so the
          empty space still opens the day panel. */}
      <div
        className={cn(
          'pointer-events-none relative z-10 hidden min-w-0 flex-col gap-1 sm:flex',
          !inMonth && 'opacity-40'
        )}
      >
        {chips.map((task) => (
          <CalendarTaskChip
            key={task.id}
            task={task}
            category={categoryById.get(task.categoryId ?? '')}
            dragId={`grid:${task.id}`}
            onOpen={onOpenTask}
          />
        ))}
        {hidden > 0 ? (
          <span className="pointer-events-none pl-1 font-mono text-[10px] font-bold uppercase tracking-wider opacity-70">
            +{hidden} more
          </span>
        ) : null}
      </div>
    </div>
  );
}
