import { useState } from 'react';
import type { FormEvent } from 'react';
import { Check, Flame, Pencil, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import type { Habit } from '../../types';
import { cn } from '../../utils/cn';
import { toISODate } from '../../utils/dates';
import { checkedCount, dayNumber, habitStreaks, isCheckedOn, weekdayInitial } from '../../utils/habits';
import { BrutalButton } from '../BrutalButton';
import { BrutalInput } from '../BrutalInput';
import { ColorPicker } from '../categories/ColorPicker';

interface HabitCardProps {
  habit: Habit;
  /** The seven days shown in the grid (oldest → today). */
  days: Date[];
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (patch: { name: string; color: string }) => void;
  onToggleDate: (isoDate: string) => void;
  onDelete: () => void;
}

/**
 * One habit: name + colour swatch, streak/total chips and the 7-day check
 * grid. Editing happens inline (name + colour picker) so no modal is needed.
 */
export function HabitCard({
  habit,
  days,
  editing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onToggleDate,
  onDelete,
}: HabitCardProps) {
  const [name, setName] = useState(habit.name);
  const [color, setColor] = useState(habit.color);

  const streaks = habitStreaks(habit.completedDates);
  const weekCount = checkedCount(habit, days);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, color });
  };

  return (
    <article
      className={cn(
        'rounded-md border bg-white p-3 text-ink shadow-brutal-sm dark:bg-black dark:text-white dark:shadow-brutal-sm-invert sm:p-4',
        streaks.current > 0 ? 'border-black dark:border-white' : 'border-dashed border-black/60 dark:border-white/60'
      )}
    >
      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <BrutalInput
            id={`habit-name-${habit.id}`}
            label={`Edit “${habit.name}”`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            autoFocus
          />
          <ColorPicker label="Colour" value={color} onChange={setColor} previewName={name} />
          <div className="flex flex-wrap justify-end gap-2">
            <BrutalButton variant="white" onClick={onCancelEdit}>
              Cancel
            </BrutalButton>
            <BrutalButton type="submit" variant="mint" disabled={!name.trim()}>
              Save habit
            </BrutalButton>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden="true"
              className={cn(
                'grid h-12 w-12 shrink-0 place-items-center rounded-md border border-black shadow-brutal-sm dark:border-white dark:shadow-brutal-sm-invert',
                habit.color
              )}
            >
              <Flame aria-hidden="true" size={22} strokeWidth={2.5} className="text-ink" />
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg uppercase leading-tight">{habit.name}</h3>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                    streaks.current > 0
                      ? 'border-black bg-orange text-ink dark:border-white'
                      : 'border-dashed border-black/60 opacity-70 dark:border-white/60'
                  )}
                >
                  <Flame aria-hidden="true" size={11} strokeWidth={3} />
                  {streaks.current} day{streaks.current === 1 ? '' : 's'} streak
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-black bg-cream px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink dark:border-white dark:bg-black dark:text-white">
                  <Trophy aria-hidden="true" size={11} strokeWidth={3} />
                  Best {streaks.best}
                </span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-70">
                  {weekCount}/7 this week · {streaks.total} total
                </span>
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <BrutalButton
                size="icon"
                variant="white"
                aria-label={`Edit ${habit.name}`}
                title="Edit habit"
                onClick={onStartEdit}
                className="!shadow-brutal-sm dark:!shadow-brutal-sm-invert"
              >
                <Pencil aria-hidden="true" size={18} strokeWidth={2.5} />
              </BrutalButton>
              <BrutalButton
                size="icon"
                variant="pink"
                aria-label={`Delete ${habit.name}`}
                title="Delete habit"
                onClick={onDelete}
                className="!shadow-brutal-sm dark:!shadow-brutal-sm-invert"
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  ×
                </span>
              </BrutalButton>
            </div>
          </div>

          {/* 7-day check grid */}
          <ul aria-label={`${habit.name} check-ins`} className="mt-3 grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const key = toISODate(day);
              const checked = isCheckedOn(habit, key);
              const today = key === toISODate(new Date());

              return (
                <li key={key}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`${checked ? 'Uncheck' : 'Check'} ${habit.name} on ${format(day, 'EEEE d MMMM')}`}
                    onClick={() => onToggleDate(key)}
                    className={cn(
                      'flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-md border transition-colors duration-100',
                      checked ? habit.color : 'bg-cream hover:bg-yellow dark:bg-black',
                      today
                        ? 'border-4 border-blue dark:border-blue'
                        : 'border-black dark:border-white'
                    )}
                  >
                    <span className="font-mono text-[9px] font-bold uppercase leading-none tracking-wider opacity-70">
                      {weekdayInitial(day)}
                    </span>
                    <Check
                      aria-hidden="true"
                      size={16}
                      strokeWidth={4}
                      className={cn(
                        'text-ink transition-transform duration-100',
                        checked ? 'scale-100' : 'scale-0'
                      )}
                    />
                    <span className="font-mono text-[9px] font-bold leading-none opacity-70">
                      {dayNumber(day)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </article>
  );
}
