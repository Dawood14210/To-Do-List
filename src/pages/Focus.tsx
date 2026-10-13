import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Timer as TimerIcon,
  Volume2,
  X,
} from 'lucide-react';
import { useAppStore } from '../store';
import { useToast } from '../hooks/useToast';
import type { Task } from '../types';
import { cn } from '../utils/cn';
import { fireConfetti } from '../utils/confetti';
import { playChime } from '../utils/sound';
import { hapticSuccess } from '../utils/native';
import { PRIORITY_META } from '../utils/tasks';
import {
  formatClock,
  formatDuration,
  focusTotals,
  clampMinutes,
  minutesToMs,
  sessionsByTask,
  taskSessionStats,
} from '../utils/focus';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalInput, BrutalSelect } from '../components/BrutalInput';
import { BrutalSwitch } from '../components/BrutalSwitch';
import { Sticker } from '../components/Sticker';
import { ProgressBar } from '../components/tasks/ProgressBar';

type Phase = 'focus' | 'break';

interface Banner {
  kind: Phase;
  minutes: number;
  taskTitle?: string;
}

const PHASE_LABELS: Record<Phase, string> = { focus: 'Focus', break: 'Break' };

/**
 * Pomodoro timer (25/5 by default, configurable) that can be linked to a task.
 *
 * Timing is timestamp based: a running timer stores the absolute epoch time it
 * ends at and every render derives `remaining = endsAt - Date.now()`. The
 * interval only triggers re-renders, so throttled timers in a background tab
 * cannot make the clock drift or miss the end of a session.
 */
export default function FocusPage() {
  const tasks = useAppStore((state) => state.tasks);
  const sessions = useAppStore((state) => state.focusSessions);
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const logFocusSession = useAppStore((state) => state.logFocusSession);
  const toast = useToast();

  const { focusMinutes, breakMinutes, soundOn } = settings;

  const [phase, setPhase] = useState<Phase>('focus');
  const [running, setRunning] = useState(false);
  /** Absolute epoch ms the current run ends at — null while paused/idle. */
  const [endsAt, setEndsAt] = useState<number | null>(null);
  /** Frozen remaining ms while paused; null = idle, so the phase length applies. */
  const [frozenMs, setFrozenMs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [taskId, setTaskId] = useState('');
  /** Minutes of the run in flight (frozen at start, used when logging). */
  const [runningMinutes, setRunningMinutes] = useState(focusMinutes);
  const [banner, setBanner] = useState<Banner | null>(null);
  const baseTitle = useRef(typeof document === 'undefined' ? '' : document.title);

  const phaseMinutes = phase === 'focus' ? focusMinutes : breakMinutes;
  const phaseMs = minutesToMs(phaseMinutes);
  const remaining = endsAt === null ? (frozenMs ?? phaseMs) : Math.max(0, endsAt - now);
  /** Nothing started or paused: the clock simply mirrors the phase length. */
  const idle = endsAt === null && frozenMs === null;
  const paused = endsAt === null && frozenMs !== null;
  const elapsedPct = phaseMs > 0 ? Math.min(100, Math.round(((phaseMs - remaining) / phaseMs) * 100)) : 0;
  const finished = running && endsAt !== null && now >= endsAt;

  const openTasks = useMemo(
    () =>
      tasks
        .filter((task) => !task.done)
        .sort((a, b) => {
          const at = a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
          const bt = b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
          return at - bt || a.order - b.order;
        }),
    [tasks]
  );
  const linkedTask: Task | undefined = openTasks.find((task) => task.id === taskId);
  const linkedStats = taskId ? taskSessionStats(sessions, taskId) : { count: 0, minutes: 0 };
  const totals = useMemo(() => focusTotals(sessions), [sessions]);
  const perTask = useMemo(() => sessionsByTask(sessions), [sessions]);

  const leaderboard = useMemo(
    () =>
      tasks
        .map((task) => ({ task, ...(perTask.get(task.id) ?? { count: 0, minutes: 0 }) }))
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count || b.minutes - a.minutes || a.task.order - b.task.order)
        .slice(0, 8),
    [tasks, perTask]
  );

  /* --------------------------- ticking --------------------------- */

  useEffect(() => {
    if (!running) return;

    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 250);

    // Background tabs throttle timers, so re-sync the instant we're visible
    // again — the clock itself is derived from timestamps either way.
    const resync = () => {
      if (document.visibilityState !== 'hidden') tick();
    };
    document.addEventListener('visibilitychange', resync);
    window.addEventListener('focus', resync);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', resync);
      window.removeEventListener('focus', resync);
    };
  }, [running]);

  /* ------------------------ completion -------------------------- */

  useEffect(() => {
    if (!finished) return;

    setRunning(false);
    setEndsAt(null);

    if (phase === 'focus') {
      logFocusSession(runningMinutes, taskId || null);
      if (soundOn) playChime('focus-end');
      void hapticSuccess(); // a whole session's worth of buzz, on the device
      fireConfetti();
      setBanner({ kind: 'focus', minutes: runningMinutes, taskTitle: linkedTask?.title });
      setPhase('break');
      setFrozenMs(null);
      toast(
        `Focus session logged — ${runningMinutes} min${linkedTask ? ` on “${linkedTask.title}”` : ''}`,
        'success'
      );
    } else {
      if (soundOn) playChime('break-end');
      setBanner({ kind: 'break', minutes: runningMinutes });
      setPhase('focus');
      setFrozenMs(null);
      toast('Break over — back to it', 'info');
    }
    // `now` intentionally omitted: this runs off the `finished` flag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  /* --------------------- countdown in the tab --------------------- */

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = running
      ? `${formatClock(remaining)} · ${PHASE_LABELS[phase]} — To-Do List`
      : baseTitle.current;
  }, [running, remaining, phase]);

  useEffect(() => {
    const base = baseTitle.current;
    return () => {
      document.title = base;
    };
  }, []);

  /* --------------------------- actions --------------------------- */

  const start = () => {
    setBanner(null);
    setRunningMinutes(clampMinutes(phaseMinutes));
    setEndsAt(Date.now() + Math.max(1000, remaining));
    setNow(Date.now());
    setRunning(true);
  };

  const pause = () => {
    if (endsAt !== null) setFrozenMs(Math.max(0, endsAt - Date.now()));
    setEndsAt(null);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setEndsAt(null);
    setBanner(null);
    setFrozenMs(null);
  };

  const switchPhase = (next: Phase) => {
    setRunning(false);
    setEndsAt(null);
    setBanner(null);
    setFrozenMs(null);
    setPhase(next);
  };

  const bannerAction = () => {
    if (!banner) return;
    setBanner(null);
    start();
  };

  /* --------------------------- render --------------------------- */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl uppercase leading-none sm:text-4xl">Focus</h1>
          <Sticker color="orange" rotate={-3}>
            {focusMinutes}/{breakMinutes} pomodoro
          </Sticker>
        </div>
        <div className="flex items-center gap-2">
          <Sticker color="mint" rotate={1} small>
            {totals.todayCount} today · {formatDuration(totals.todayMinutes)}
          </Sticker>
          <Sticker color="blue" rotate={-1} small>
            {formatDuration(totals.totalMinutes)} all time
          </Sticker>
        </div>
      </div>

      {/* Session-ended banner */}
      {banner ? (
        <div
          role="status"
          className={cn(
            'flex flex-wrap items-center gap-3 rounded-md border-4 border-black p-3 text-ink shadow-brutal animate-brutal-pop dark:border-white dark:shadow-brutal-invert sm:p-4',
            banner.kind === 'focus' ? 'bg-mint' : 'bg-yellow'
          )}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-black bg-white dark:border-white dark:bg-black dark:text-white">
            {banner.kind === 'focus' ? (
              <CheckCircle2 aria-hidden="true" size={24} strokeWidth={3} />
            ) : (
              <Sparkles aria-hidden="true" size={24} strokeWidth={3} />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg uppercase leading-tight sm:text-xl">
              {banner.kind === 'focus' ? 'Focus session complete!' : 'Break over!'}
            </p>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider">
              {banner.kind === 'focus'
                ? `${banner.minutes} min logged${banner.taskTitle ? ` on “${banner.taskTitle}”` : ''}`
                : `${banner.minutes} min break — ready for the next round`}
            </p>
          </div>

          <BrutalButton variant={banner.kind === 'focus' ? 'blue' : 'pink'} onClick={bannerAction}>
            {banner.kind === 'focus' ? 'Start break' : 'Start focus'}
          </BrutalButton>

          <button
            type="button"
            onClick={() => setBanner(null)}
            aria-label="Dismiss banner"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-transparent hoverable:border-black hoverable:bg-white/50 dark:hoverable:border-white"
          >
            <X aria-hidden="true" size={20} strokeWidth={3} />
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* Timer */}
        <section
          aria-label="Pomodoro timer"
          className="rounded-md border bg-white p-4 text-ink shadow-brutal dark:bg-black dark:text-white dark:shadow-brutal-invert sm:p-5"
        >
          {/* Phase tabs */}
          <div role="tablist" aria-label="Timer phase" className="flex flex-wrap gap-2">
            {(['focus', 'break'] as Phase[]).map((option) => {
              const active = phase === option;
              return (
                <button
                  key={option}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => switchPhase(option)}
                  className={cn(
                    'inline-flex min-h-12 items-center gap-2 rounded-md border px-3 font-mono text-xs font-bold uppercase tracking-wider transition-transform duration-100',
                    active
                      ? cn(
                          'text-ink shadow-brutal-sm dark:shadow-brutal-sm-invert -translate-y-0.5',
                          option === 'focus' ? 'bg-orange' : 'bg-mint'
                        )
                      : 'bg-cream text-ink opacity-70 hoverable:opacity-100 dark:bg-black dark:text-white'
                  )}
                >
                  <TimerIcon aria-hidden="true" size={16} strokeWidth={3} />
                  {PHASE_LABELS[option]} · {option === 'focus' ? focusMinutes : breakMinutes}m
                </button>
              );
            })}
          </div>

          {/* Big chunky clock */}
          <div className="mt-4 rounded-md border-4 border-black bg-ink p-5 text-center shadow-brutal dark:border-white dark:bg-white dark:shadow-brutal-invert sm:p-8">
            <p
              role="timer"
              aria-live="off"
              className="font-heading text-6xl leading-none tabular-nums text-yellow sm:text-8xl"
            >
              {formatClock(remaining)}
            </p>
            <p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white/80 dark:text-ink/70">
              {running
                ? `${PHASE_LABELS[phase]} running — ${elapsedPct}% done`
                : idle
                  ? `Ready · ${phaseMinutes} minute ${PHASE_LABELS[phase].toLowerCase()}`
                  : paused
                    ? `Paused at ${formatClock(remaining)}`
                    : 'Paused'}
            </p>
          </div>

          <ProgressBar
            value={elapsedPct}
            max={100}
            label={`${PHASE_LABELS[phase]} progress`}
            tone={phase === 'focus' ? 'orange' : 'mint'}
            className="mt-4"
          />

          {/* Controls */}
          <div className="mt-4 flex flex-wrap gap-2">
            <BrutalButton
              variant={running ? 'yellow' : 'mint'}
              size="lg"
              onClick={running ? pause : start}
              className="flex-1"
              aria-label={running ? 'Pause timer' : 'Start timer'}
            >
              {running ? (
                <Pause aria-hidden="true" size={22} strokeWidth={3} />
              ) : (
                <Play aria-hidden="true" size={22} strokeWidth={3} />
              )}
              {running ? 'Pause' : idle ? 'Start' : 'Resume'}
            </BrutalButton>

            <BrutalButton variant="white" size="lg" onClick={reset} aria-label="Reset timer">
              <RotateCcw aria-hidden="true" size={20} strokeWidth={3} />
              Reset
            </BrutalButton>
          </div>

          {/* Task link */}
          <div className="mt-4 border-t border-dashed border-black/40 pt-4 dark:border-white/40">
            <BrutalSelect
              id="focus-task"
              label="Link this session to a task"
              value={taskId}
              onChange={(event) => setTaskId(event.target.value)}
            >
              <option value="">No task — free focus</option>
              {openTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </BrutalSelect>

            {linkedTask ? (
              <p className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-black bg-cream px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink dark:border-white dark:bg-black dark:text-white">
                  <Flame aria-hidden="true" size={12} strokeWidth={3} />
                  {linkedStats.count} session{linkedStats.count === 1 ? '' : 's'} ·{' '}
                  {formatDuration(linkedStats.minutes)}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                    PRIORITY_META[linkedTask.priority].color
                  )}
                >
                  {PRIORITY_META[linkedTask.priority].label}
                </span>
                {linkedTask.categoryId ? null : (
                  <span className="font-mono text-[10px] uppercase tracking-wider opacity-60">
                    Uncategorised
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider opacity-60">
                Sessions are counted per task — pick one to build its total.
              </p>
            )}
          </div>
        </section>

        <div className="space-y-4">
          {/* Timer settings */}
          <section
            aria-label="Timer settings"
            className="space-y-4 rounded-md border bg-white p-4 text-ink shadow-brutal dark:bg-black dark:text-white dark:shadow-brutal-invert sm:p-5"
          >
            <h2 className="text-xl uppercase leading-none">Pomodoro lengths</h2>

            <div className="grid grid-cols-2 gap-3">
              <BrutalInput
                id="focus-minutes"
                type="number"
                min={1}
                max={180}
                label="Focus (minutes)"
                value={focusMinutes}
                onChange={(event) =>
                  updateSettings({ focusMinutes: clampMinutes(Number(event.target.value), focusMinutes) })
                }
                className="font-mono text-sm font-bold"
              />
              <BrutalInput
                id="break-minutes"
                type="number"
                min={1}
                max={180}
                label="Break (minutes)"
                value={breakMinutes}
                onChange={(event) =>
                  updateSettings({ breakMinutes: clampMinutes(Number(event.target.value), breakMinutes) })
                }
                className="font-mono text-sm font-bold"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[15, 25, 45].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateSettings({ focusMinutes: preset })}
                  aria-pressed={focusMinutes === preset}
                  className={cn(
                    'inline-flex min-h-12 items-center rounded-md border px-4 font-mono text-xs font-bold uppercase tracking-wider transition-transform duration-100',
                    focusMinutes === preset
                      ? 'bg-orange text-ink shadow-brutal-sm dark:shadow-brutal-sm-invert'
                      : 'bg-cream text-ink hoverable:bg-yellow dark:bg-black dark:text-white'
                  )}
                >
                  {preset} min
                </button>
              ))}
              <BrutalButton
                variant="white"
                onClick={() => updateSettings({ focusMinutes: 25, breakMinutes: 5 })}
              >
                Classic 25/5
              </BrutalButton>
            </div>

            <div className="border-t border-dashed border-black/40 pt-4 dark:border-white/40">
              <BrutalSwitch
                checked={soundOn}
                onChange={(checked) => updateSettings({ soundOn: checked })}
                label="Completion chime"
                hint="Square-wave beep when a session ends"
              />
            </div>

            <p className="flex items-start gap-2 font-mono text-[10px] uppercase leading-snug tracking-wider opacity-70">
              <Volume2 aria-hidden="true" size={14} strokeWidth={3} className="mt-0.5 shrink-0" />
              The countdown uses end timestamps, so it stays accurate even when this tab sleeps.
            </p>
          </section>

          {/* Sessions per task */}
          <section
            aria-label="Sessions per task"
            className="rounded-md border bg-white p-4 text-ink shadow-brutal dark:bg-black dark:text-white dark:shadow-brutal-invert sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl uppercase leading-none">Sessions per task</h2>
              <Sticker color="cream" rotate={-2} small>
                {totals.totalCount} logged
              </Sticker>
            </div>

            {leaderboard.length === 0 ? (
              <p className="mt-3 font-body text-sm leading-relaxed opacity-70">
                No sessions logged yet. Finish a focus round with a task selected and it will show
                up here.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {leaderboard.map((row) => (
                  <li
                    key={row.task.id}
                    className="flex items-center gap-2 rounded-md border bg-cream px-2 py-1.5 dark:bg-black"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-black bg-orange font-mono text-[11px] font-bold text-ink dark:border-white">
                      {row.count}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-body text-sm font-semibold">
                      {row.task.title}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {formatDuration(row.minutes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
