import { useDraggable } from '@dnd-kit/core';
import { CalendarClock, Check, GripVertical, Pencil } from 'lucide-react';
import type { Category, Task } from '../../types';
import { cn } from '../../utils/cn';
import { PRIORITY_META, REPEAT_LABELS, isOverdue } from '../../utils/tasks';
import { Sticker } from '../Sticker';
import { shortTime } from '../../utils/calendar';

interface CalendarTaskRowProps {
  task: Task;
  category?: Category;
  /**
   * When set, the row gets a drag handle (panel rows can be dragged onto a
   * day cell). Agenda rows omit it — use "Move to date" instead.
   */
  dragId?: string;
  onToggleDone: (task: Task) => void;
  onEdit: (task: Task) => void;
  onMove: (task: Task) => void;
}

/**
 * Full-width task row used by the day side panel and the agenda view:
 * bold checkbox, title, overdue stamp, meta chips and Edit / Move to date.
 */
export function CalendarTaskRow({
  task,
  category,
  dragId,
  onToggleDone,
  onEdit,
  onMove,
}: CalendarTaskRowProps) {
  const overdue = isOverdue(task);
  const priority = PRIORITY_META[task.priority];
  const time = shortTime(task.dueAt);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId ?? `row:${task.id}`,
    data: { taskId: task.id },
    disabled: !dragId,
  });

  return (
    <li
      ref={setNodeRef}
      className={cn(
        'rounded-md border bg-white p-3 text-ink shadow-brutal-sm dark:bg-black dark:text-white dark:shadow-brutal-sm-invert',
        overdue ? 'border-red' : 'border-black dark:border-white',
        isDragging && 'opacity-40'
      )}
    >
      <div className="flex items-start gap-2">
        {dragId ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag ${task.title} onto another day`}
            title="Drag onto another day"
            className="hidden h-12 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border border-transparent hoverable:border-black hoverable:bg-cream active:cursor-grabbing sm:flex dark:hoverable:border-white dark:hoverable:bg-black"
          >
            <GripVertical aria-hidden="true" size={18} strokeWidth={2.5} className="opacity-50" />
          </button>
        ) : null}

        <button
          type="button"
          role="checkbox"
          aria-checked={task.done}
          aria-label={task.done ? `Mark ${task.title} as not done` : `Complete ${task.title}`}
          onClick={() => onToggleDone(task)}
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-md border transition-colors duration-100',
            task.done ? 'bg-mint' : 'bg-cream hoverable:bg-yellow dark:bg-black'
          )}
        >
          <Check
            aria-hidden="true"
            size={26}
            strokeWidth={4}
            className={cn('text-ink transition-transform duration-150', task.done ? 'scale-100' : 'scale-0')}
          />
        </button>

        <div className="min-w-0 flex-1 py-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h4
              className={cn(
                'min-w-0 break-words text-sm font-bold leading-snug',
                task.done && 'line-through decoration-[3px] opacity-60'
              )}
            >
              {task.title}
            </h4>

            {overdue ? (
              <span
                aria-label="Overdue"
                className="inline-flex md:-rotate-3 items-center gap-1 rounded-md border-2 border-red bg-red px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-brutal-sm"
              >
                ⚠ Overdue
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {time ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                  overdue
                    ? 'border-red bg-red text-white'
                    : 'border-black bg-cream text-ink dark:border-white dark:bg-black dark:text-white'
                )}
              >
                <CalendarClock aria-hidden="true" size={11} strokeWidth={3} />
                {time}
              </span>
            ) : (
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-50">
                No time
              </span>
            )}

            <Sticker color={priority.sticker} rotate={0} small>
              {priority.label}
            </Sticker>

            {category ? (
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                  category.color
                )}
              >
                {category.name}
              </span>
            ) : null}

            {task.repeat !== 'none' ? (
              <span className="inline-flex items-center rounded-md border border-black bg-orange px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink dark:border-white">
                {REPEAT_LABELS[task.repeat]}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 border-t border-dashed border-black/40 pt-2 dark:border-white/40">
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-md border-2 border-black bg-white px-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors duration-100 hoverable:bg-yellow active:translate-x-0.5 active:translate-y-0.5 dark:border-white dark:bg-black dark:hoverable:bg-yellow dark:hoverable:text-ink"
        >
          <Pencil aria-hidden="true" size={14} strokeWidth={3} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onMove(task)}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-md border-2 border-black bg-blue px-2 font-mono text-[11px] font-bold uppercase tracking-wider text-ink transition-colors duration-100 hoverable:bg-yellow active:translate-x-0.5 active:translate-y-0.5 dark:border-white"
        >
          <CalendarClock aria-hidden="true" size={14} strokeWidth={3} />
          Move to date
        </button>
      </div>
    </li>
  );
}
