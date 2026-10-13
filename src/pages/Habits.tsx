import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Flame, Plus, Sprout } from 'lucide-react';
import { useAppStore } from '../store';
import { useToast } from '../hooks/useToast';
import type { Habit } from '../types';
import { toISODate } from '../utils/dates';
import { bestStreak, habitStreaks, isCheckedOn, lastNDays } from '../utils/habits';
import { fireConfetti } from '../utils/confetti';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalInput } from '../components/BrutalInput';
import { BrutalModal } from '../components/BrutalModal';
import { Sticker } from '../components/Sticker';
import { ColorPicker } from '../components/categories/ColorPicker';
import { HabitCard } from '../components/habits/HabitCard';

/** Days shown in each habit's check grid (today is the right-most cell). */
const GRID_DAYS = 7;

/**
 * Daily habits: a 7-day check grid per habit, streak counters, and
 * add / edit / delete. Checking today fires confetti.
 */
export default function HabitsPage() {
  const habits = useAppStore((state) => state.habits);
  const addHabit = useAppStore((state) => state.addHabit);
  const updateHabit = useAppStore((state) => state.updateHabit);
  const toggleHabitDate = useAppStore((state) => state.toggleHabitDate);
  const deleteHabit = useAppStore((state) => state.deleteHabit);
  const toast = useToast();

  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState('bg-mint');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Habit | null>(null);

  const days = useMemo(() => lastNDays(GRID_DAYS), []);
  const todayKey = toISODate(new Date());

  const doneToday = habits.filter((habit) => isCheckedOn(habit, todayKey)).length;
  const topStreak = bestStreak(habits);
  const monthChecks = habits.reduce((sum, habit) => sum + habitStreaks(habit.completedDates).total, 0);

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) return;
    addHabit({ name, color: draftColor });
    toast(`Habit “${name}” added`, 'success');
    setDraftName('');
    setDraftColor(draftColor === 'bg-mint' ? 'bg-blue' : 'bg-mint');
  };

  const handleToggle = (habit: Habit, key: string) => {
    const checked = isCheckedOn(habit, key);
    toggleHabitDate(habit.id, key);
    if (!checked && key === todayKey) {
      if (habitStreaks([...habit.completedDates, key]).current >= 3) fireConfetti();
      toast(`“${habit.name}” checked off today`, 'success');
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const snapshot = deleting;
    deleteHabit(snapshot.id);
    toast(`Deleted “${snapshot.name}”`, 'warning', { type: 'delete-habit', habit: snapshot });
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl uppercase leading-none sm:text-4xl">Habits</h1>
          <Sticker color="mint" rotate={-3}>
            {habits.length} tracked
          </Sticker>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Sticker color="orange" rotate={1} small>
            <Flame aria-hidden="true" size={12} strokeWidth={3} />
            best streak {topStreak}
          </Sticker>
          <Sticker color="blue" rotate={-1} small>
            {doneToday}/{habits.length} today · {monthChecks} check-ins
          </Sticker>
        </div>
      </div>

      {/* Add a habit */}
      <section
        aria-label="Add a habit"
        className="rounded-md border bg-white p-4 text-ink shadow-brutal dark:bg-black dark:text-white dark:shadow-brutal-invert sm:p-5"
      >
        <h2 className="mb-3 flex items-center gap-2 text-xl uppercase leading-none">
          <span className="grid h-10 w-10 place-items-center rounded-md border bg-mint text-ink shadow-brutal-sm">
            <Plus aria-hidden="true" size={20} strokeWidth={3} />
          </span>
          New habit
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <BrutalInput
            id="new-habit-name"
            label="Name"
            placeholder="e.g. Drink 2L water, Walk 20 minutes…"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            maxLength={40}
          />

          <ColorPicker
            label="Colour"
            value={draftColor}
            onChange={setDraftColor}
            previewName={draftName}
          />

          <div className="flex justify-end">
            <BrutalButton type="submit" variant="pink" disabled={!draftName.trim()}>
              <Plus aria-hidden="true" size={18} strokeWidth={3} />
              Add habit
            </BrutalButton>
          </div>
        </form>
      </section>

      {/* Habit list */}
      {habits.length === 0 ? (
        <div className="rounded-md border border-dashed bg-white p-8 text-center dark:bg-black">
          <Sprout aria-hidden="true" size={32} strokeWidth={2.5} className="mx-auto opacity-60" />
          <p className="mt-3 font-heading text-xl uppercase">No habits yet</p>
          <p className="mx-auto mt-1 max-w-sm font-body text-sm leading-relaxed opacity-70">
            Add one above and start ticking off days. Streaks are counted for you.
          </p>
        </div>
      ) : (
        <section aria-label="Your habits" className="space-y-3">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              days={days}
              editing={editingId === habit.id}
              onStartEdit={() => setEditingId(habit.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(patch) => {
                updateHabit(habit.id, patch);
                setEditingId(null);
                toast(`Updated “${patch.name}”`, 'success');
              }}
              onToggleDate={(key) => handleToggle(habit, key)}
              onDelete={() => setDeleting(habit)}
            />
          ))}
        </section>
      )}

      {/* Delete confirmation */}
      <BrutalModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete habit"
        footer={
          <>
            <BrutalButton variant="white" onClick={() => setDeleting(null)}>
              Cancel
            </BrutalButton>
            <BrutalButton variant="pink" onClick={confirmDelete}>
              Delete habit
            </BrutalButton>
          </>
        }
      >
        {deleting ? (
          <div className="space-y-3">
            <p className="font-body text-base leading-relaxed">
              Delete <span className="font-bold">“{deleting.name}”</span>?
            </p>
            <p className="rounded-md border bg-white p-3 font-body text-sm leading-relaxed dark:bg-black">
              All {deleting.completedDates.length} check-ins and the streak history go with it.
              Changed your mind? Undo from the toast right after deleting.
            </p>
          </div>
        ) : null}
      </BrutalModal>
    </div>
  );
}
