import { useDraggable } from '@dnd-kit/core';
import { AlertTriangle, Check } from 'lucide-react';
import type { Category, Task } from '../../types';
import { cn } from '../../utils/cn';
import { isOverdue } from '../../utils/tasks';
import { categoryDotClass, shortTime } from '../../utils/calendar';

interface CalendarTaskChipProps {
  task: Task;
  category?: Category;
  /**
   * Unique drag id for @dnd-kit. The same task can be on screen twice
   * (grid + side panel), so the id carries its origin: "grid:task_x".
   */
  dragId: string;
  /** 'cell' = compact month-grid label, 'row' = roomier week column card. */
  size?: 'cell' | 'row';
  /** Show the due time (week view + panel rows). */
  showTime?: boolean;
  onOpen: (task: Task) => void;
}

/**
 * Chunky draggable task card. Turns red with a warning label when the task is
 * overdue, greys out (strike-through) when it is done, and carries its
 * category colour as a dot.
 */
export function CalendarTaskChip({
  task,
  category,
  dragId,
  size = 'cell',
  showTime = false,
  onOpen,
}: CalendarTaskChipProps) {
  const overdue = isOverdue(task);
  const time = showTime ? shortTime(task.dueAt) : '';

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: { taskId: task.id },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`${task.title}${overdue ? ' — overdue' : ''}${
        time ? `, due ${time}` : ''
      }. Drag onto another day to reschedule.`}
      onClick={() => onOpen(task)}
      className={cn(
        'group pointer-events-auto flex w-full cursor-grab touch-manipulation items-center gap-1.5 rounded-sm border-2 text-left leading-tight active:cursor-grabbing',
        'shadow-brutal-sm dark:shadow-brutal-sm-invert',
        size === 'cell' ? 'px-1.5 py-1 text-[11px] font-bold' : 'px-2 py-1.5 text-xs font-bold',
        overdue
          ? 'border-red bg-red text-white'
          : task.done
            ? 'border-black bg-cream text-ink opacity-70 dark:border-white dark:bg-black dark:text-white'
            : 'border-black bg-white text-ink hover:bg-yellow dark:border-white dark:bg-black dark:text-white dark:hover:bg-black',
        isDragging && 'opacity-40'
      )}
    >
      {overdue ? (
        <AlertTriangle aria-hidden="true" size={11} strokeWidth={3} className="shrink-0" />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'h-2.5 w-2.5 shrink-0 rounded-full border border-black dark:border-white',
            task.done ? 'bg-mint' : categoryDotClass(category)
          )}
        />
      )}

      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          task.done && 'line-through decoration-[2px] decoration-current'
        )}
      >
        {task.title}
      </span>

      {time ? (
        <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wide opacity-70">
          {time}
        </span>
      ) : null}

      {task.done ? (
        <Check aria-hidden="true" size={12} strokeWidth={4} className="shrink-0" />
      ) : null}
    </button>
  );
}
