import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, CalendarClock, CheckCheck, Flame, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { useToast } from '../hooks/useToast';
import type { Task, TaskView } from '../types';
import { cn } from '../utils/cn';
import { toISODate } from '../utils/dates';
import { fireConfetti } from '../utils/confetti';
import { buildDashboardStats } from '../utils/stats';
import { BrutalButton } from '../components/BrutalButton';
import { Sticker } from '../components/Sticker';
import { StatCard } from '../components/dashboard/StatCard';
import { TodayProgress } from '../components/dashboard/TodayProgress';
import { WeeklyChart } from '../components/dashboard/WeeklyChart';
import { UpcomingList } from '../components/dashboard/UpcomingList';
import { TaskFormModal } from '../components/tasks/TaskFormModal';

/**
 * Dashboard: four stat cards (due today, overdue, done this week, streak), a
 * fat progress bar for today, the weekly completion chart and the next five
 * upcoming tasks. Every card drills into the matching task view.
 */
export default function DashboardPage() {
  const tasks = useAppStore((state) => state.tasks);
  const categories = useAppStore((state) => state.categories);
  const habits = useAppStore((state) => state.habits);
  const setTaskDone = useAppStore((state) => state.setTaskDone);
  const setTaskView = useAppStore((state) => state.setTaskView);
  const toast = useToast();
  const navigate = useNavigate();

  const [editing, setEditing] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const stats = useMemo(() => buildDashboardStats(tasks, habits), [tasks, habits]);
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const todayKey = toISODate(new Date());

  /** Jump to the Tasks page with a specific slice of the list. */
  const openTasksWith = (patch: Partial<TaskView>) => {
    setTaskView({
      search: '',
      priority: 'all',
      category: 'all',
      dueFrom: '',
      dueTo: '',
      sort: 'due',
      selectMode: false,
      selected: [],
      ...patch,
    });
    navigate('/tasks');
  };

  const handleComplete = (task: Task) => {
    const spawnedId = setTaskDone(task.id, true);
    if (task.priority === 'high') fireConfetti();
    toast(
      spawnedId
        ? `“${task.title}” done — next occurrence scheduled`
        : `Completed “${task.title}”`,
      'success',
      { type: 'complete-tasks', taskIds: [task.id] }
    );
  };

  const streakHint =
    stats.streak === 0
      ? 'No streak yet — finish one today'
      : `Day${stats.streak === 1 ? '' : 's'} in a row with a win`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl uppercase leading-none sm:text-4xl">Dashboard</h1>
          <Sticker color="yellow" rotate={-3}>
            {format(new Date(), 'EEE d MMM')}
          </Sticker>
        </div>
        <BrutalButton
          variant="pink"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus aria-hidden="true" size={18} strokeWidth={3} />
          New task
        </BrutalButton>
      </div>

      {/* Overdue alarm */}
      {stats.overdue > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border-2 border-red bg-red p-3 text-white shadow-brutal-sm dark:shadow-brutal-sm-invert">
          <AlertTriangle aria-hidden="true" size={24} strokeWidth={3} className="shrink-0" />
          <p className="min-w-0 flex-1 font-mono text-[11px] font-bold uppercase leading-snug tracking-wider">
            {stats.overdue} {stats.overdue === 1 ? 'task is' : 'tasks are'} past due — clear the
            red before it grows.
          </p>
          <BrutalButton
            variant="white"
            size="sm"
            onClick={() => openTasksWith({ status: 'overdue' })}
            className="shrink-0"
          >
            Review overdue
          </BrutalButton>
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="grid max-w-full grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Due today"
          value={stats.today.total}
          hint={`${stats.today.done} done · ${stats.today.open} left`}
          icon={CalendarClock}
          accent="blue"
          onClick={() => openTasksWith({ status: 'all', dueFrom: todayKey, dueTo: todayKey })}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          hint={stats.overdue === 0 ? 'All caught up' : 'Past due — needs action'}
          icon={AlertTriangle}
          accent="red"
          danger={stats.overdue > 0}
          onClick={() => openTasksWith({ status: 'overdue' })}
        />
        <StatCard
          label="Done this week"
          value={stats.completedThisWeek}
          hint="Tasks + habit check-ins since Mon"
          icon={CheckCheck}
          accent="mint"
          onClick={() => openTasksWith({ status: 'done' })}
        />
        <StatCard
          label="Current streak"
          value={stats.streak}
          hint={streakHint}
          icon={Flame}
          accent="orange"
          onClick={() => navigate('/habits')}
        >
          <span aria-hidden="true" className="mt-1 flex w-full gap-1">
            {stats.streakDays.map((day) => (
              <span
                key={day.key}
                className={cn(
                  'h-3 flex-1 rounded-sm border-2',
                  day.count > 0
                    ? 'border-black bg-orange dark:border-white'
                    : 'border-dashed border-black/40 dark:border-white/40',
                  day.isToday && 'border-solid border-blue bg-blue/0 dark:border-blue'
                )}
              />
            ))}
          </span>
        </StatCard>
      </div>

      {/* Today's progress + weekly chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TodayProgress progress={stats.today} overdue={stats.overdue} />
        <WeeklyChart days={stats.week} total={stats.completedThisWeek} />
      </div>

      {/* Next five */}
      <UpcomingList
        tasks={stats.upcoming}
        categoryById={categoryById}
        onComplete={handleComplete}
        onEdit={(task) => {
          setEditing(task);
          setFormOpen(true);
        }}
      />

      <TaskFormModal
        open={formOpen}
        task={editing}
        onClose={() => setFormOpen(false)}
      />
    </div>
  );
}
