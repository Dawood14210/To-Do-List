import { CalendarClock, Check, GripVertical, Pencil, Repeat, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Category, Task } from '../../types';
import { PRIORITY_META, REPEAT_LABELS, dueMeta } from '../../utils/tasks';
import { cn } from '../../utils/cn';
import { BrutalButton } from '../BrutalButton';
import { Sticker } from '../Sticker';
import { ProgressBar } from './ProgressBar';

interface TaskItemProps {
  task: Task;
  category?: Category;
  selectMode: boolean;
  selected: boolean;
  draggable: boolean;
  onToggleDone: (task: Task) => void;
  onToggleSelect: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const DUE_TONE_CLASSES: Record<string, string> = {
  overdue: 'border-red bg-red text-white',
  today: 'border-black bg-yellow text-ink dark:border-white',
  tomorrow: 'border-black bg-blue text-ink dark:border-white',
  other: 'border-black bg-cream text-ink dark:border-white dark:bg-black dark:text-white',
  none: '',
};

/**
 * One task row: chunky checkbox with bold check + animated strike-through,
 * priority sticker, category/due/repeat chips, subtask progress, OVERDUE
 * stamp, drag handle and edit/delete actions.
 */
export function TaskItem({
  task,
  category,
  selectMode,
  selected,
  draggable,
  onToggleDone,
  onToggleSelect,
  onToggleSubtask,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const due = dueMeta(task);
  const priority = PRIORITY_META[task.priority];
  const subDone = task.subtasks.filter((s) => s.done).length;
  const overdue = due.tone === 'overdue';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !draggable,
    transition: { duration: 150, easing: 'ease-out' },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative rounded-md border bg-white text-ink shadow-brutal-sm dark:bg-black dark:text-white dark:shadow-brutal-sm-invert',
        isDragging && 'z-20 rotate-[1.5deg] shadow-brutal dark:shadow-brutal-invert',
        task.done && 'opacity-80'
      )}
    >
      <div className="flex items-start gap-2 p-3 sm:gap-3 sm:p-4">
        {/* Drag handle (manual sort only) */}
        {draggable ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${task.title}`}
            className="hidden h-12 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border border-transparent hoverable:border-black hoverable:bg-cream active:cursor-grabbing sm:flex dark:hoverable:border-white dark:hoverable:bg-black"
          >
            <GripVertical aria-hidden="true" size={20} strokeWidth={2.5} className="opacity-50" />
          </button>
        ) : null}

        {selectMode ? (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={`Select ${task.title}`}
            onClick={() => onToggleSelect(task.id)}
            className={cn(
              'grid h-12 w-12 shrink-0 place-items-center rounded-md border transition-colors duration-100',
              selected ? 'bg-yellow' : 'bg-cream dark:bg-black'
            )}
          >
            <span
              className={cn(
                'block h-6 w-6 scale-0 rounded-sm border-2 border-black bg-black transition-transform duration-100 dark:border-white dark:bg-white',
                selected && 'scale-100'
              )}
            />
          </button>
        ) : (
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
              size={30}
              strokeWidth={4}
              className={cn(
                'text-ink transition-transform duration-150',
                task.done ? 'scale-100' : 'scale-0'
              )}
            />
          </button>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
            <h3
              className={cn(
                'relative min-w-0 break-words text-base font-bold leading-snug',
                'line-through decoration-[3px] transition-[text-decoration-color] duration-150',
                task.done
                  ? 'decoration-current opacity-60'
                  : 'decoration-transparent opacity-100'
              )}
            >
              {task.title}
            </h3>

            {overdue ? (
              <span
                aria-label="Overdue"
                className="inline-flex -rotate-6 items-center rounded-md border-2 border-red bg-red px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-brutal-sm animate-brutal-pop"
              >
                Overdue
              </span>
            ) : null}
          </div>

          {task.description ? (
            <p className="mt-1 break-words text-sm leading-relaxed opacity-70">
              {task.description}
            </p>
          ) : null}

          {/* Chips */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Sticker color={priority.sticker} rotate={0} small>
              {priority.label}
            </Sticker>

            {category ? (
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider',
                  category.color
                )}
              >
                {category.name}
              </span>
            ) : null}

            {task.dueAt ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider',
                  DUE_TONE_CLASSES[due.tone]
                )}
              >
                <CalendarClock aria-hidden="true" size={12} strokeWidth={3} />
                {due.label}
              </span>
            ) : null}

            {task.repeat !== 'none' ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-black bg-orange px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink dark:border-white">
                <Repeat aria-hidden="true" size={12} strokeWidth={3} />
                {REPEAT_LABELS[task.repeat]}
              </span>
            ) : null}

            {task.done && task.completedAt ? (
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider opacity-50">
                Done
              </span>
            ) : null}
          </div>

          {/* Subtasks */}
          {task.subtasks.length > 0 ? (
            <div className="mt-3">
              <ProgressBar value={subDone} max={task.subtasks.length} />
              <ul className="mt-1">
                {task.subtasks.map((sub) => (
                  <li key={sub.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={sub.done}
                      aria-label={`${sub.done ? 'Uncheck' : 'Check'} subtask ${sub.title}`}
                      onClick={() => onToggleSubtask(task.id, sub.id)}
                      className="flex min-h-12 w-full items-center gap-2 rounded-md px-1 text-left hoverable:bg-cream dark:hoverable:bg-black"
                    >
                      <span
                        className={cn(
                          'grid h-5 w-5 shrink-0 place-items-center rounded-sm border-2 border-black transition-colors duration-100 dark:border-white',
                          sub.done && 'bg-mint'
                        )}
                      >
                        {sub.done ? (
                          <Check aria-hidden="true" size={14} strokeWidth={4} className="text-ink" />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          'text-sm line-through decoration-[3px] transition-[text-decoration-color] duration-150',
                          sub.done ? 'decoration-current opacity-50' : 'decoration-transparent'
                        )}
                      >
                        {sub.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {!selectMode ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <BrutalButton
              size="icon"
              variant="white"
              aria-label={`Edit ${task.title}`}
              title="Edit"
              onClick={() => onEdit(task)}
              className="!shadow-brutal-sm dark:!shadow-brutal-sm-invert"
            >
              <Pencil aria-hidden="true" size={18} strokeWidth={2.5} />
            </BrutalButton>
            <BrutalButton
              size="icon"
              variant="pink"
              aria-label={`Delete ${task.title}`}
              title="Delete"
              onClick={() => onDelete(task)}
              className="!shadow-brutal-sm dark:!shadow-brutal-sm-invert"
            >
              <Trash2 aria-hidden="true" size={18} strokeWidth={2.5} />
            </BrutalButton>
          </div>
        ) : null}
      </div>
    </li>
  );
}
