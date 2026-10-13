import { format, isToday } from 'date-fns';
import { AlertTriangle, CalendarPlus, PartyPopper } from 'lucide-react';
import type { Category, Task } from '../../types';
import { cn } from '../../utils/cn';
import { toISODate } from '../../utils/dates';
import { friendlyDayLabel } from '../../utils/calendar';
import { BrutalCard } from '../BrutalCard';
import { BrutalButton } from '../BrutalButton';
import { CalendarTaskRow } from './CalendarTaskRow';

export interface AgendaGroup {
  key: string;
  date: Date;
  tasks: Task[];
}

interface AgendaViewProps {
  groups: AgendaGroup[];
  overdue: Task[];
  categoryById: Map<string, Category>;
  selectedDay: string | null;
  onSelectDay: (key: string) => void;
  onAddTask: (key: string) => void;
  onToggleDone: (task: Task) => void;
  onEdit: (task: Task) => void;
  onMove: (task: Task) => void;
}

/**
 * Agenda: an overdue block up top, then one bordered card per day with tasks,
 * oldest first. No drop targets here — reschedule with "Move to date".
 */
export function AgendaView({
  groups,
  overdue,
  categoryById,
  selectedDay,
  onSelectDay,
  onAddTask,
  onToggleDone,
  onEdit,
  onMove,
}: AgendaViewProps) {
  if (groups.length === 0 && overdue.length === 0) {
    return (
      <BrutalCard color="white" padding="lg">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md border bg-mint shadow-brutal-sm dark:border-white dark:shadow-brutal-sm-invert">
            <PartyPopper aria-hidden="true" size={28} strokeWidth={2.5} className="text-ink" />
          </span>
          <div>
            <h2 className="mb-1 text-lg uppercase">Nothing scheduled</h2>
            <p className="max-w-md font-body text-base leading-relaxed opacity-80">
              Nothing on the agenda for this stretch — no due dates, no late work. Enjoy the
              silence, or plant something on the calendar.
            </p>
            <BrutalButton
              variant="yellow"
              className="mt-4"
              onClick={() => onAddTask(selectedDay ?? toISODate(new Date()))}
            >
              <CalendarPlus aria-hidden="true" size={18} strokeWidth={3} />
              Add a task
            </BrutalButton>
          </div>
        </div>
      </BrutalCard>
    );
  }

  return (
    <div className="space-y-4">
      {overdue.length > 0 ? (
        <section aria-label="Overdue tasks" className="space-y-2">
          <header className="flex flex-wrap items-center gap-2 rounded-md border-2 border-red bg-red px-3 py-2 text-white shadow-brutal-sm">
            <AlertTriangle aria-hidden="true" size={20} strokeWidth={3} />
            <h3 className="font-heading text-base uppercase leading-none">
              Overdue · {overdue.length}
            </h3>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
              Past due — move it or do it
            </span>
          </header>
          <ul className="space-y-2">
            {overdue.map((task) => (
              <CalendarTaskRow
                key={task.id}
                task={task}
                category={categoryById.get(task.categoryId ?? '')}
                onToggleDone={onToggleDone}
                onEdit={onEdit}
                onMove={onMove}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {groups.map((group) => {
        const isSelected = selectedDay === group.key;
        const isTodayGroup = isToday(group.date);
        const overdueCount = group.tasks.filter(
          (task) => !task.done && task.dueAt && new Date(task.dueAt).getTime() < Date.now()
        ).length;

        return (
          <section key={group.key} aria-label={format(group.date, 'EEEE d MMMM yyyy')}>
            <header
              className={cn(
                'mb-2 flex flex-wrap items-center gap-2 rounded-md border bg-cream px-3 py-2 dark:bg-black',
                isTodayGroup
                  ? 'border-4 border-blue dark:border-blue'
                  : 'border-black dark:border-white',
                isSelected && 'outline outline-4 outline-offset-2 outline-pink'
              )}
            >
              <h3
                className={cn(
                  'rounded-sm px-1 font-heading text-base uppercase leading-none',
                  isTodayGroup && 'bg-blue text-ink'
                )}
              >
                {friendlyDayLabel(group.date)}
              </h3>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider opacity-70">
                {format(group.date, 'd MMMM yyyy')}
              </span>
              <span className="ml-auto flex items-center gap-2">
                {overdueCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md border-2 border-red bg-red px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                    <AlertTriangle aria-hidden="true" size={11} strokeWidth={3} />
                    {overdueCount} overdue
                  </span>
                ) : null}
                <span className="grid h-7 min-w-7 place-items-center rounded-sm border-2 border-black bg-white px-1 font-mono text-[11px] font-bold dark:border-white dark:bg-black">
                  {group.tasks.length}
                </span>
              </span>
              <span className="flex w-full gap-2 sm:w-auto">
                <BrutalButton
                  size="sm"
                  variant="white"
                  onClick={() => onSelectDay(group.key)}
                  className="!min-h-12 flex-1"
                >
                  Open day
                </BrutalButton>
                <BrutalButton
                  size="sm"
                  variant="yellow"
                  onClick={() => onAddTask(group.key)}
                  className="!min-h-12 flex-1"
                >
                  <CalendarPlus aria-hidden="true" size={14} strokeWidth={3} />
                  Add
                </BrutalButton>
              </span>
            </header>

            <ul className="space-y-2">
              {group.tasks.map((task) => (
                <CalendarTaskRow
                  key={task.id}
                  task={task}
                  category={categoryById.get(task.categoryId ?? '')}
                  onToggleDone={onToggleDone}
                  onEdit={onEdit}
                  onMove={onMove}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
