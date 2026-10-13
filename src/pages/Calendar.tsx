import { useMemo, useRef, useState } from 'react';
import type { TouchEvent } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { addDays, eachDayOfInterval, format, startOfDay } from 'date-fns';
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Columns3, LayoutGrid, List } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '../store';
import { useToast } from '../hooks/useToast';
import type { Category, Task } from '../types';
import { cn } from '../utils/cn';
import { fireConfetti } from '../utils/confetti';
import { isOverdue } from '../utils/tasks';
import {
  AGENDA_DAYS,
  CALENDAR_VIEWS,
  VIEW_LABELS,
  agendaRange,
  buildMonthGrid,
  buildWeek,
  categoryDotClass,
  dayFromDropId,
  dayKey,
  fromDayKey,
  groupTasksByDay,
  moveDueToDay,
  periodLabel,
  shiftAnchor,
  shortPeriodLabel,
  sortDayTasks,
} from '../utils/calendar';
import type { CalendarView } from '../utils/calendar';
import { BrutalButton } from '../components/BrutalButton';
import { Sticker } from '../components/Sticker';
import { MonthGrid } from '../components/calendar/MonthGrid';
import { WeekGrid, CategoryLegend } from '../components/calendar/WeekGrid';
import { AgendaView } from '../components/calendar/AgendaView';
import type { AgendaGroup } from '../components/calendar/AgendaView';
import { DayPanel } from '../components/calendar/DayPanel';
import { MoveToDateModal } from '../components/calendar/MoveToDateModal';
import { TaskFormModal } from '../components/tasks/TaskFormModal';

const VIEW_ICONS: Record<CalendarView, LucideIcon> = {
  month: LayoutGrid,
  week: Columns3,
  agenda: List,
};

/** How far a finger must travel horizontally to page the calendar. */
const SWIPE_THRESHOLD = 60;

export default function CalendarPage() {
  const tasks = useAppStore((state) => state.tasks);
  const categories = useAppStore((state) => state.categories);
  const setTaskDone = useAppStore((state) => state.setTaskDone);
  const updateTask = useAppStore((state) => state.updateTask);
  const toast = useToast();

  const [view, setView] = useState<CalendarView>('month');
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [formDate, setFormDate] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [moving, setMoving] = useState<Task | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const todayKey = useMemo(() => dayKey(new Date()), []);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  /* ------------------------- derived data ------------------------- */

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const tasksByDay = useMemo(() => groupTasksByDay(tasks), [tasks]);
  const overdueTasks = useMemo(
    () => sortDayTasks(tasks.filter((task) => isOverdue(task))),
    [tasks]
  );
  const monthDays = useMemo(() => buildMonthGrid(anchor), [anchor]);
  const weekDays = useMemo(() => buildWeek(anchor), [anchor]);

  /** Day keys currently rendered — used for the period counters + legend. */
  const visibleKeys = useMemo(() => {
    if (view === 'month') return monthDays.map(dayKey);
    if (view === 'week') return weekDays.map(dayKey);
    return eachDayOfInterval(agendaRange(anchor)).map(dayKey);
  }, [view, monthDays, weekDays, anchor]);

  const visibleTasks = useMemo(
    () => visibleKeys.flatMap((key) => tasksByDay.get(key) ?? []),
    [visibleKeys, tasksByDay]
  );

  const legendCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of visibleTasks) {
      if (!task.categoryId) continue;
      counts.set(task.categoryId, (counts.get(task.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [visibleTasks]);

  const agenda = useMemo(() => {
    const { start, end } = agendaRange(anchor);
    const startKey = dayKey(start);
    const endKey = dayKey(end);
    const groups: AgendaGroup[] = [];

    for (const [key, dayTasks] of tasksByDay) {
      if (key < startKey || key > endKey) continue;
      groups.push({ key, date: fromDayKey(key), tasks: dayTasks });
    }
    groups.sort((a, b) => a.key.localeCompare(b.key));

    return {
      groups,
      overdue: overdueTasks.filter(
        (task) => (task.dueAt ? dayKey(new Date(task.dueAt)) : '') < startKey
      ),
    };
  }, [anchor, tasksByDay, overdueTasks]);

  const panelTasks = selectedDay ? (tasksByDay.get(selectedDay) ?? []) : [];
  const activeTask = activeTaskId ? tasks.find((task) => task.id === activeTaskId) : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  /* ------------------------- actions ------------------------- */

  const shift = (direction: 1 | -1) =>
    setAnchor((current) => shiftAnchor(view, current, direction));

  const goToday = () => {
    setAnchor(startOfDay(new Date()));
    toast('Jumped to today', 'info');
  };

  const openNewTask = (key?: string) => {
    setEditing(null);
    setFormDate(key ?? selectedDay ?? null);
    setFormOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditing(task);
    setFormDate(null);
    setFormOpen(true);
  };

  const handleToggleDone = (task: Task) => {
    if (!task.done) {
      const spawnedId = setTaskDone(task.id, true);
      if (task.priority === 'high') fireConfetti();
      toast(
        spawnedId
          ? `“${task.title}” done — next occurrence scheduled`
          : `Completed “${task.title}”`,
        'success',
        { type: 'complete-tasks', taskIds: [task.id] }
      );
    } else {
      setTaskDone(task.id, false);
      toast(`Reopened “${task.title}”`, 'info');
    }
  };

  /** Reschedule a task onto another day, keeping its time of day. */
  const moveTaskToDay = (task: Task, key: string) => {
    if (task.dueAt && dayKey(new Date(task.dueAt)) === key) return;
    const previousDueAt = task.dueAt;
    updateTask(task.id, { dueAt: moveDueToDay(task.dueAt, key) });
    toast(
      `Moved “${task.title}” to ${format(fromDayKey(key), 'EEE d MMM')}`,
      'success',
      { type: 'move-task', taskId: task.id, dueAt: previousDueAt }
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    draggingRef.current = true;
    const taskId = (event.active.data.current as { taskId?: string } | undefined)?.taskId;
    setActiveTaskId(taskId ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);
    window.setTimeout(() => {
      draggingRef.current = false;
    }, 250);

    const taskId =
      (event.active.data.current as { taskId?: string } | undefined)?.taskId ??
      String(event.active.id).split(':')[1];
    const targetKey = dayFromDropId(event.over?.id);
    if (!taskId || !targetKey) return;

    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    moveTaskToDay(task, targetKey);
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
    window.setTimeout(() => {
      draggingRef.current = false;
    }, 250);
  };

  /* ------------------------- touch swipe ------------------------- */

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || draggingRef.current) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    shift(dx < 0 ? 1 : -1);
  };

  /* ------------------------- render ------------------------- */

  const periodUnit = view === 'month' ? 'month' : view === 'week' ? 'week' : `${AGENDA_DAYS} days`;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => {
            const task = tasks.find((t) => t.id === active.data.current?.taskId);
            return `Picked up ${task?.title ?? 'task'}. Drop it on a day to reschedule.`;
          },
          onDragOver: ({ active, over }) => {
            const task = tasks.find((t) => t.id === active.data.current?.taskId);
            const key = dayFromDropId(over?.id);
            return key
              ? `${task?.title ?? 'Task'} is over ${format(fromDayKey(key), 'EEEE d MMMM')}`
              : `${task?.title ?? 'Task'} is not over a day`;
          },
          onDragEnd: ({ active, over }) => {
            const task = tasks.find((t) => t.id === active.data.current?.taskId);
            const key = dayFromDropId(over?.id);
            return key
              ? `Moved ${task?.title ?? 'task'} to ${format(fromDayKey(key), 'EEEE d MMMM')}`
              : `${task?.title ?? 'Task'} was dropped`;
          },
          onDragCancel: ({ active }) => {
            const task = tasks.find((t) => t.id === active.data.current?.taskId);
            return `Rescheduling cancelled for ${task?.title ?? 'task'}`;
          },
        },
      }}
    >
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl uppercase leading-none sm:text-4xl">Calendar</h1>
            <Sticker color="blue" rotate={-3}>
              {visibleTasks.length} this {view === 'month' ? 'month' : view === 'week' ? 'week' : 'stretch'}
            </Sticker>
          </div>

          <div className="flex items-center gap-2">
            {overdueTasks.length > 0 ? (
              <button
                type="button"
                onClick={() => setView('agenda')}
                className="inline-flex min-h-12 -rotate-1 items-center gap-1.5 rounded-md border-2 border-red bg-red px-2.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white shadow-brutal-sm"
                title="Jump to the overdue list"
              >
                {overdueTasks.length} overdue
              </button>
            ) : null}
            <BrutalButton variant="mint" onClick={() => openNewTask()}>
              <CalendarPlus aria-hidden="true" size={18} strokeWidth={3} />
              New
            </BrutalButton>
          </div>
        </div>

        {/* View switcher + period navigation */}
        <section
          aria-label="Calendar controls"
          className="rounded-md border bg-white p-3 shadow-brutal dark:bg-black dark:shadow-brutal-invert"
        >
          <div role="tablist" aria-label="Calendar view" className="flex flex-wrap gap-2">
            {CALENDAR_VIEWS.map((option) => {
              const Icon = VIEW_ICONS[option];
              const active = view === option;
              return (
                <button
                  key={option}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => setView(option)}
                  className={cn(
                    'inline-flex min-h-12 items-center gap-2 rounded-md border px-3 font-mono text-xs font-bold uppercase tracking-wider transition-transform duration-100',
                    active
                      ? 'bg-blue text-ink shadow-brutal-sm -translate-y-0.5 dark:shadow-brutal-sm-invert'
                      : 'bg-cream text-ink opacity-70 hover:opacity-100 dark:bg-black dark:text-white'
                  )}
                >
                  <Icon aria-hidden="true" size={16} strokeWidth={3} />
                  {VIEW_LABELS[option]}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <BrutalButton
              variant="white"
              size="icon"
              onClick={() => shift(-1)}
              aria-label={`Previous ${periodUnit}`}
              title={`Previous ${periodUnit}`}
            >
              <ChevronLeft aria-hidden="true" size={22} strokeWidth={3} />
            </BrutalButton>

            <BrutalButton
              variant="yellow"
              onClick={goToday}
              aria-label="Go to today"
              className="shrink-0"
            >
              <CalendarDays aria-hidden="true" size={18} strokeWidth={3} />
              Today
            </BrutalButton>

            <span
              aria-live="polite"
              className="min-w-0 flex-1 truncate rounded-md border bg-cream px-2 py-2 text-center font-heading text-sm uppercase leading-tight sm:px-3 sm:text-base dark:bg-black"
            >
              <span className="hidden sm:inline">{periodLabel(view, anchor)}</span>
              <span className="sm:hidden">{shortPeriodLabel(view, anchor)}</span>
            </span>

            <BrutalButton
              variant="white"
              size="icon"
              onClick={() => shift(1)}
              aria-label={`Next ${periodUnit}`}
              title={`Next ${periodUnit}`}
            >
              <ChevronRight aria-hidden="true" size={22} strokeWidth={3} />
            </BrutalButton>
          </div>
        </section>

        {/* Grid — swipe left/right on touch devices to page. */}
        <section
          aria-label={`${VIEW_LABELS[view]} view`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="rounded-md border bg-white p-2 shadow-brutal dark:bg-black dark:shadow-brutal-invert sm:p-4"
        >
          {view === 'month' ? (
            <MonthGrid
              anchor={anchor}
              days={monthDays}
              tasksByDay={tasksByDay}
              categoryById={categoryById}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onOpenTask={openEditTask}
            />
          ) : null}

          {view === 'week' ? (
            <WeekGrid
              days={weekDays}
              tasksByDay={tasksByDay}
              categoryById={categoryById}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onOpenTask={openEditTask}
              onAddTask={(key) => openNewTask(key)}
            />
          ) : null}

          {view === 'agenda' ? (
            <AgendaView
              groups={agenda.groups}
              overdue={agenda.overdue}
              categoryById={categoryById}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onAddTask={(key) => openNewTask(key)}
              onToggleDone={handleToggleDone}
              onEdit={openEditTask}
              onMove={setMoving}
            />
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-black/40 pt-3 dark:border-white/40">
            <CategoryLegend categories={categories} counts={legendCounts} />
            <p className="font-mono text-[10px] uppercase tracking-wider opacity-60">
              Tap a day for its tasks · drag a card onto another day · swipe to change{' '}
              {view === 'agenda' ? 'the window' : 'the ' + view}
            </p>
          </div>
        </section>
      </div>

      {/* Day side panel / mobile bottom sheet */}
      <DayPanel
        dayKey={selectedDay}
        tasks={panelTasks}
        categoryById={categoryById}
        onClose={() => setSelectedDay(null)}
        onAddTask={(key) => openNewTask(key)}
        onShiftDay={(direction) => {
          const key = selectedDay
            ? dayKey(addDays(fromDayKey(selectedDay), direction))
            : todayKey;
          setSelectedDay(key);
        }}
        onToggleDone={handleToggleDone}
        onEdit={openEditTask}
        onMove={setMoving}
      />

      <DragOverlay dropAnimation={null}>
        <DragOverlayPreview
          task={activeTask}
          category={activeTask?.categoryId ? categoryById.get(activeTask.categoryId) : undefined}
        />
      </DragOverlay>

      {/* Pre-filled "new task" form from the calendar */}
      <TaskFormModal
        open={formOpen}
        task={editing}
        defaultDate={formDate}
        onClose={() => setFormOpen(false)}
      />

      <MoveToDateModal
        task={moving}
        onClose={() => setMoving(null)}
        onConfirm={(key) => {
          if (moving) moveTaskToDay(moving, key);
          setMoving(null);
        }}
      />
    </DndContext>
  );
}

/** Flat clone of a task chip shown under the cursor while dragging. */
function DragOverlayPreview({ task, category }: { task?: Task; category?: Category }) {
  if (!task) return null;
  const overdue = isOverdue(task);

  return (
    <div className="pointer-events-none w-56 -rotate-2">
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-sm border-2 px-2 py-1.5 text-xs font-bold shadow-brutal',
          overdue ? 'border-red bg-red text-white' : 'border-black bg-yellow text-ink'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'h-2.5 w-2.5 shrink-0 rounded-full border border-black',
            overdue ? 'bg-white' : categoryDotClass(category)
          )}
        />
        <span className="min-w-0 flex-1 truncate">{task.title}</span>
      </div>
    </div>
  );
}
