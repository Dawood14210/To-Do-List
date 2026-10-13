import { ArrowRight, CalendarClock, Check, ListTodo } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category, Task } from '../../types';
import { cn } from '../../utils/cn';
import { PRIORITY_META, dueMeta } from '../../utils/tasks';
import { isOverdue } from '../../utils/tasks';
import { UPCOMING_LIMIT } from '../../utils/stats';
import { Sticker } from '../Sticker';

const DUE_TONE_CLASSES: Record<string, string> = {
  overdue: 'border-red bg-red text-white',
  today: 'border-black bg-yellow text-ink dark:border-white',
  tomorrow: 'border-black bg-blue text-ink dark:border-white',
  other: 'border-black bg-cream text-ink dark:border-white dark:bg-black dark:text-white',
  none: '',
};

interface UpcomingListProps {
  tasks: Task[];
  categoryById: Map<string, Category>;
  onComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
}

/**
 * The next five unfinished tasks with a future due date, soonest first.
 * Complete them straight from here or open the editor.
 */
export function UpcomingList({ tasks, categoryById, onComplete, onEdit }: UpcomingListProps) {
  return (
    <section
      aria-label="Next up"
      className="rounded-md border bg-white shadow-brutal dark:bg-black dark:shadow-brutal-invert"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-black p-4 dark:border-white">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md border bg-yellow text-ink shadow-brutal-sm">
            <ListTodo aria-hidden="true" size={20} strokeWidth={2.5} />
          </span>
          <h2 className="text-xl uppercase leading-none sm:text-2xl">Next up</h2>
          <Sticker color="cream" rotate={-2} small>
            {tasks.length}/{UPCOMING_LIMIT}
          </Sticker>
        </div>
        <Link
          to="/tasks"
          className="inline-flex min-h-12 items-center gap-1.5 rounded-md border border-transparent px-2 font-mono text-[11px] font-bold uppercase tracking-wider hoverable:border-black hoverable:bg-cream dark:hoverable:border-white dark:hoverable:bg-black"
        >
          View all
          <ArrowRight aria-hidden="true" size={16} strokeWidth={3} />
        </Link>
      </header>

      {tasks.length === 0 ? (
        <div className="p-6 text-center">
          <p className="font-heading text-lg uppercase">Nothing coming up</p>
          <p className="mx-auto mt-1 max-w-sm font-body text-sm leading-relaxed opacity-70">
            No unfinished tasks with a future due date. Add one from the Tasks page and it will
            show up here.
          </p>
          <Link
            to="/tasks"
            className="mt-4 inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-black bg-mint px-5 font-heading text-sm uppercase tracking-wide text-ink shadow-brutal transition-transform duration-100 hoverable:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none dark:border-white dark:shadow-brutal-invert"
          >
            Go to Tasks
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-black/20 dark:divide-white/20">
          {tasks.map((task) => {
            const due = dueMeta(task);
            const priority = PRIORITY_META[task.priority];
            const category = task.categoryId ? categoryById.get(task.categoryId) : undefined;
            const overdue = isOverdue(task);

            return (
              <li key={task.id} className="flex items-center gap-2 p-3 sm:gap-3 sm:p-4">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.done}
                  aria-label={`Complete ${task.title}`}
                  onClick={() => onComplete(task)}
                  className={cn(
                    'grid h-12 w-12 shrink-0 place-items-center rounded-md border transition-colors duration-100',
                    task.done ? 'bg-mint' : 'bg-cream hoverable:bg-yellow dark:bg-black'
                  )}
                >
                  <Check
                    aria-hidden="true"
                    size={26}
                    strokeWidth={4}
                    className={cn(
                      'text-ink transition-transform duration-150',
                      task.done ? 'scale-100' : 'scale-0'
                    )}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  aria-label={`Edit ${task.title}`}
                  className="min-w-0 flex-1 rounded-md px-1 py-2 text-left hoverable:bg-cream dark:hoverable:bg-black"
                >
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0 truncate text-base font-bold leading-snug">
                      {task.title}
                    </span>
                    {overdue ? (
                      <span className="inline-flex -rotate-2 items-center rounded-md border-2 border-red bg-red px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                        ⚠ Overdue
                      </span>
                    ) : null}
                  </span>

                  <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                        DUE_TONE_CLASSES[due.tone]
                      )}
                    >
                      <CalendarClock aria-hidden="true" size={11} strokeWidth={3} />
                      {due.label}
                    </span>

                    <span
                      className={cn(
                        'inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                        priority.color
                      )}
                    >
                      {priority.label}
                    </span>

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
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
