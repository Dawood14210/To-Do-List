import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CalendarPlus, ChevronLeft, ChevronRight, Sprout, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Category, Task } from '../../types';
import { cn } from '../../utils/cn';
import { BrutalButton } from '../BrutalButton';
import { fromDayKey } from '../../utils/calendar';
import { isOverdue } from '../../utils/tasks';
import { CalendarTaskRow } from './CalendarTaskRow';

interface DayPanelProps {
  /** "yyyy-MM-dd" of the day on screen, or null when the panel is closed. */
  dayKey: string | null;
  tasks: Task[];
  categoryById: Map<string, Category>;
  onClose: () => void;
  onAddTask: (dayKey: string) => void;
  onShiftDay: (direction: 1 | -1) => void;
  onToggleDone: (task: Task) => void;
  onEdit: (task: Task) => void;
  onMove: (task: Task) => void;
}

/**
 * Side panel on desktop, bottom sheet on mobile: the day's tasks with a
 * pre-filled add button, complete / edit / move actions and drag handles.
 */
export function DayPanel({
  dayKey,
  tasks,
  categoryById,
  onClose,
  onAddTask,
  onShiftDay,
  onToggleDone,
  onEdit,
  onMove,
}: DayPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dayKey) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    // Bottom sheet on mobile → lock the page behind it. On desktop the panel
    // is a side rail, so the grid underneath stays scrollable.
    const isBottomSheet = !window.matchMedia('(min-width: 640px)').matches;
    if (isBottomSheet) document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dayKey, onClose]);

  const date = useMemo(() => (dayKey ? fromDayKey(dayKey) : null), [dayKey]);

  if (!dayKey || !date) return null;

  const doneCount = tasks.filter((task) => task.done).length;
  const overdueCount = tasks.filter((task) => isOverdue(task)).length;
  const heading = format(date, 'EEEE');
  const subheading = format(date, 'd MMMM yyyy');

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      {/* Flat scrim — no blur, no gradient (matches BrutalModal). */}
      <button
        type="button"
        aria-label="Close day panel"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/60"
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Tasks for ${heading} ${subheading}`}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-md border border-black bg-cream text-ink outline-none',
          'shadow-brutal dark:border-white dark:bg-black dark:text-white dark:shadow-brutal-invert',
          'animate-brutal-pop',
          'sm:max-h-none sm:w-[26rem] sm:max-w-full sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l-4 sm:animate-brutal-slide'
        )}
      >
        <header className="shrink-0 border-b border-black bg-blue p-4 text-ink dark:border-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest">
                {subheading}
              </p>
              <h2 className="truncate text-2xl uppercase leading-tight">{heading}</h2>
            </div>
            <BrutalButton
              variant="white"
              size="icon"
              onClick={onClose}
              aria-label="Close day panel"
              className="shrink-0"
            >
              <X aria-hidden="true" size={22} strokeWidth={3} />
            </BrutalButton>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border-2 border-black bg-white px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider dark:border-white dark:bg-black dark:text-white">
              {tasks.length} task{tasks.length === 1 ? '' : 's'}
            </span>
            <span className="rounded-md border-2 border-black bg-mint px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-ink dark:border-white">
              {doneCount} done
            </span>
            {overdueCount > 0 ? (
              <span className="rounded-md border-2 border-black bg-red px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white dark:border-white">
                {overdueCount} overdue
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <BrutalButton
              variant="white"
              size="icon"
              onClick={() => onShiftDay(-1)}
              aria-label="Previous day"
            >
              <ChevronLeft aria-hidden="true" size={20} strokeWidth={3} />
            </BrutalButton>
            <BrutalButton
              variant="pink"
              size="sm"
              onClick={() => onAddTask(dayKey)}
              className="flex-1"
            >
              <CalendarPlus aria-hidden="true" size={18} strokeWidth={3} />
              Add task on {format(date, 'd MMM')}
            </BrutalButton>
            <BrutalButton
              variant="white"
              size="icon"
              onClick={() => onShiftDay(1)}
              aria-label="Next day"
            >
              <ChevronRight aria-hidden="true" size={20} strokeWidth={3} />
            </BrutalButton>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-black p-6 text-center dark:border-white">
              <Sprout aria-hidden="true" size={32} strokeWidth={2.5} className="opacity-70" />
              <p className="font-heading text-base uppercase">Nothing on this day</p>
              <p className="font-body text-sm opacity-70">
                A rare blank square. Add a task — the date is already filled in.
              </p>
              <BrutalButton variant="pink" onClick={() => onAddTask(dayKey)}>
                <CalendarPlus aria-hidden="true" size={18} strokeWidth={3} />
                Add task
              </BrutalButton>
            </div>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <CalendarTaskRow
                  key={task.id}
                  task={task}
                  category={categoryById.get(task.categoryId ?? '')}
                  dragId={`panel:${task.id}`}
                  onToggleDone={onToggleDone}
                  onEdit={onEdit}
                  onMove={onMove}
                />
              ))}
            </ul>
          )}
        </div>

        <p className="shrink-0 border-t border-black px-4 py-3 font-mono text-[10px] uppercase tracking-wider opacity-70 dark:border-white">
          Drag a card onto another day to reschedule · or use “Move to date”
        </p>
      </aside>
    </div>,
    document.body
  );
}
