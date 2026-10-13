import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { addDays, addWeeks, format } from 'date-fns';
import { CornerDownLeft } from 'lucide-react';
import type { Task } from '../../types';
import { cn } from '../../utils/cn';
import { toISODate } from '../../utils/dates';
import { fromDayKey } from '../../utils/calendar';
import { BrutalButton } from '../BrutalButton';
import { BrutalInput } from '../BrutalInput';
import { BrutalModal } from '../BrutalModal';

interface MoveToDateModalProps {
  /** The task being rescheduled — null keeps the dialog closed. */
  task: Task | null;
  onClose: () => void;
  onConfirm: (dayKey: string) => void;
}

/**
 * Touch-friendly rescheduling: pick a preset or any date, the due time is kept.
 * Opened from the "Move to date" buttons in the day panel and the agenda.
 */
export function MoveToDateModal({ task, onClose, onConfirm }: MoveToDateModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!task) return;
    setValue(task.dueAt ? toISODate(new Date(task.dueAt)) : toISODate(new Date()));
  }, [task]);

  if (!task) return null;

  const now = new Date();
  const presets: Array<{ label: string; key: string }> = [
    { label: 'Today', key: toISODate(now) },
    { label: 'Tomorrow', key: toISODate(addDays(now, 1)) },
    { label: 'Next week', key: toISODate(addWeeks(now, 1)) },
  ];

  const timeNote = task.dueAt
    ? `Time kept at ${format(new Date(task.dueAt), 'h:mm a')}`
    : 'No due time yet — lands at 5:00 PM';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!value) return;
    onConfirm(value);
  };

  return (
    <BrutalModal open onClose={onClose} title="Move to date">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="font-body text-sm leading-relaxed opacity-80">
          Move <span className="font-bold">“{task.title}”</span> to another day.
        </p>

        <div className="rounded-md border bg-white p-3 dark:bg-black">
          <p className="font-mono text-xs font-bold uppercase tracking-wider">
            Currently:{' '}
            {task.dueAt
              ? format(new Date(task.dueAt), 'EEE d MMM yyyy · h:mm a')
              : 'no due date'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setValue(preset.key)}
              aria-pressed={value === preset.key}
              className={cn(
                'inline-flex min-h-12 items-center rounded-md border px-4 font-mono text-xs font-bold uppercase tracking-wider transition-transform duration-100',
                value === preset.key
                  ? 'bg-blue text-ink shadow-brutal-sm dark:shadow-brutal-sm-invert'
                  : 'bg-white text-ink hover:bg-yellow dark:bg-black dark:text-white'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <BrutalInput
          id="move-to-date"
          type="date"
          label="New due date"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="font-mono text-sm font-bold"
          required
        />

        <p className="font-mono text-[11px] uppercase tracking-wider opacity-70">
          {value
            ? `${format(fromDayKey(value), 'EEEE d MMMM yyyy')} · ${timeNote}`
            : 'Pick a date to continue'}
        </p>

        <div className="flex justify-end gap-3 border-t border-black pt-4 dark:border-white">
          <BrutalButton variant="white" onClick={onClose}>
            Cancel
          </BrutalButton>
          <BrutalButton type="submit" variant="mint" disabled={!value}>
            <CornerDownLeft aria-hidden="true" size={18} strokeWidth={3} />
            Move task
          </BrutalButton>
        </div>
      </form>
    </BrutalModal>
  );
}
