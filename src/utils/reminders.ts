import { format } from 'date-fns';
import type { Task } from '../types';
import { isNative } from './native';
import { useAppStore } from '../store';

/**
 * Local notifications: one reminder per task with a due date + time, fired by
 * Android's alarm manager so it still arrives when the app is closed.
 *
 * The store is the single source of truth. `installReminderSync()` watches it
 * and re-schedules whenever a task is added, edited, completed, deleted or
 * restored — plus once on every app resume.
 */

export const REMINDER_CHANNEL = 'task-reminders';

/** Only the next 30 days are scheduled (Android caps pending alarms anyway). */
export const REMINDER_HORIZON_DAYS = 30;

/** Small icon drawn in the status bar (see android res/drawable). */
export const REMINDER_SMALL_ICON = 'ic_stat_brutal';

/** What a reminder looks like in the status bar. */
export const REMINDER_ICON_COLOR = '#FFD84D';

const PROMPTED_KEY = 'brutaltodo:notifications-prompted';

export interface PlannedReminder {
  /** Android notification id (32-bit int, derived from the task id). */
  id: number;
  taskId: string;
  title: string;
  body: string;
  /** When it should fire. */
  at: Date;
}

/**
 * Stable 31-bit integer id for a task — Android notification ids are int32,
 * while task ids are strings like `task_mv70v36i_5t3bvgw`.
 */
export function notificationId(taskId: string): number {
  let hash = 2166136261; // FNV-1a
  for (let index = 0; index < taskId.length; index += 1) {
    hash ^= taskId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 1) % 2000000000 || 1;
}

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Body copy: when it's due, how urgent it is, and what it's about. */
export function reminderBody(task: Task): string {
  const parts: string[] = [];
  if (task.dueAt) parts.push(`Due ${format(new Date(task.dueAt), 'h:mm a')}`);
  if (task.priority === 'high') parts.push('High priority');
  if (task.description.trim()) parts.push(truncate(task.description, 80));
  return parts.join(' · ') || 'Due now';
}

/**
 * Upcoming reminders for a task list — pure, so it is easy to test.
 * Skips done tasks, tasks without a due time, anything already past and
 * anything further out than the horizon.
 */
export function planReminders(
  tasks: Task[],
  now: Date = new Date(),
  horizonDays: number = REMINDER_HORIZON_DAYS
): PlannedReminder[] {
  const horizon = now.getTime() + horizonDays * 24 * 60 * 60 * 1000;

  return tasks
    .filter((task) => !task.done && Boolean(task.dueAt))
    .map((task) => ({ task, at: new Date(task.dueAt as string) }))
    .filter(({ at }) => !Number.isNaN(at.getTime()) && at.getTime() > now.getTime() && at.getTime() <= horizon)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map(({ task, at }) => ({
      id: notificationId(task.id),
      taskId: task.id,
      title: truncate(task.title, 64),
      body: reminderBody(task),
      at,
    }));
}

export interface ReminderSyncResult {
  /** How many reminders the task list currently wants. */
  planned: number;
  scheduled: number;
  canceled: number;
  /** False when the platform is the web, the permission was refused, etc. */
  active: boolean;
  reason?: 'web' | 'permission' | 'error';
}

const IDLE_RESULT: ReminderSyncResult = { planned: 0, scheduled: 0, canceled: 0, active: false, reason: 'web' };

/**
 * Ask for the notification permission the first time a reminder is needed.
 * Asked once: if the user says no we never nag again automatically (they can
 * still re-enable it from Android settings).
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const { LocalNotifications } = await import('@capacitor/local-notifications');

  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return true;

  if (localStorage.getItem(PROMPTED_KEY) === '1') return false;
  localStorage.setItem(PROMPTED_KEY, '1');

  const asked = await LocalNotifications.requestPermissions();
  return asked.display === 'granted';
}

async function ensureChannel(): Promise<void> {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.createChannel({
    id: REMINDER_CHANNEL,
    name: 'Task reminders',
    description: 'Reminders for tasks with a due date and time',
    importance: 4, // high: heads-up banner, still silent by default
    visibility: 1, // public: show the task title on the lock screen
    vibration: true,
    lights: true,
    lightColor: REMINDER_ICON_COLOR,
  });
}

/**
 * Reconcile the OS alarm list with the store: cancel reminders for tasks that
 * moved, were completed or were deleted, and schedule the current ones.
 * Called on every task change and on app resume.
 */
export async function syncTaskReminders(
  tasks: Task[],
  now: Date = new Date()
): Promise<ReminderSyncResult> {
  if (!isNative()) return IDLE_RESULT;

  const planned = planReminders(tasks, now);

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    const pending = await LocalNotifications.getPending();
    const wantedIds = new Set(planned.map((reminder) => reminder.id));
    const stale = pending.notifications.filter((notification) => !wantedIds.has(notification.id));

    if (stale.length) {
      await LocalNotifications.cancel({
        notifications: stale.map((notification) => ({ id: notification.id })),
      });
    }

    if (!planned.length) {
      return { planned: 0, scheduled: 0, canceled: stale.length, active: true };
    }

    const granted = await ensureNotificationPermission();
    if (!granted) {
      return { planned: planned.length, scheduled: 0, canceled: stale.length, active: false, reason: 'permission' };
    }

    await ensureChannel();
    await LocalNotifications.schedule({
      notifications: planned.map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        body: reminder.body,
        largeBody: reminder.body,
        channelId: REMINDER_CHANNEL,
        smallIcon: REMINDER_SMALL_ICON,
        iconColor: REMINDER_ICON_COLOR,
        schedule: { at: reminder.at, allowWhileIdle: true },
        extra: { taskId: reminder.taskId },
      })),
    });

    return { planned: planned.length, scheduled: planned.length, canceled: stale.length, active: true };
  } catch {
    return { planned: planned.length, scheduled: 0, canceled: 0, active: false, reason: 'error' };
  }
}

/** Reminder-relevant fingerprint of the task list (cheap change detection). */
export function reminderSignature(tasks: Task[]): string {
  return tasks
    .map((task) => `${task.id}~${task.title}~${task.dueAt ?? ''}~${task.done ? 1 : 0}`)
    .join('|');
}

/**
 * Watch the store and keep the OS alarms in sync. Returns a cleanup function.
 * No-op on the web.
 */
export function installReminderSync(debounceMs = 400): () => void {
  if (!isNative()) return () => {};

  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastSignature = reminderSignature(useAppStore.getState().tasks);

  const run = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void syncTaskReminders(useAppStore.getState().tasks);
    }, debounceMs);
  };

  const unsubscribe = useAppStore.subscribe((state) => {
    const signature = reminderSignature(state.tasks);
    if (signature === lastSignature) return;
    lastSignature = signature;
    run();
  });

  // First run: schedule whatever is already due-soon.
  run();

  return () => {
    unsubscribe();
    if (timer) clearTimeout(timer);
  };
}

/** Reschedule on resume, so a long-closed app catches up. */
export async function resyncOnResume(): Promise<void> {
  if (!isNative()) return;
  await syncTaskReminders(useAppStore.getState().tasks);
}
