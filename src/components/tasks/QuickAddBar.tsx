import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CornerDownLeft, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useAppStore } from '../../store';
import { parseQuickAdd } from '../../utils/parseTask';
import { PRIORITY_META } from '../../utils/tasks';
import { BrutalButton } from '../BrutalButton';
import { Sticker } from '../Sticker';

/**
 * Natural-language quick-add:
 *   "Submit report tomorrow 5pm !high #study"
 * Shows live parse chips before you hit Enter.
 */
export function QuickAddBar() {
  const [value, setValue] = useState('');
  const categories = useAppStore((state) => state.categories);
  const addTask = useAppStore((state) => state.addTask);
  const ensureCategory = useAppStore((state) => state.ensureCategory);

  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);
  const parsed = useMemo(
    () => parseQuickAdd(value, { categoryNames }),
    [value, categoryNames]
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!parsed.title.trim()) return;

    let categoryId: string | null = null;
    if (parsed.categoryName) {
      categoryId = ensureCategory(parsed.categoryName).id;
    }

    addTask({
      title: parsed.title,
      dueAt: parsed.dueAt,
      priority: parsed.priority ?? 'medium',
      categoryId,
    });
    setValue('');
  };

  const dueLabel = parsed.dueAt
    ? format(new Date(parsed.dueAt), 'EEE d MMM · h:mm a').toUpperCase()
    : '';

  return (
    <section
      aria-label="Quick add task"
      className="rounded-md border bg-white p-4 shadow-brutal dark:bg-black dark:shadow-brutal-invert"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="quick-add" className="sr-only">
            Quick add task
          </label>
          <input
            id="quick-add"
            type="text"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder='Try: "Submit report tomorrow 5pm !high #study"'
            autoComplete="off"
            className="min-h-12 w-full rounded-md border bg-cream px-4 py-3 font-body text-base text-ink placeholder:text-ink/40 dark:bg-black dark:text-white dark:placeholder:text-white/40"
          />
          <CornerDownLeft
            aria-hidden="true"
            size={16}
            strokeWidth={3}
            className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 opacity-40 sm:block"
          />
        </div>

        <BrutalButton type="submit" variant="pink" size="lg" className="sm:w-auto">
          + Add
        </BrutalButton>
      </form>

      {/* Live parse preview */}
      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-2">
        {value.trim() === '' ? (
          <p className="font-mono text-[11px] uppercase tracking-wider opacity-50">
            Dates, times, !priority and #category are read automatically
          </p>
        ) : parsed.parsed ? (
          <>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider opacity-60">
              Reads as:
            </span>
            {dueLabel ? (
              <Sticker color="yellow" rotate={0} small>
                {dueLabel}
              </Sticker>
            ) : null}
            {parsed.priority ? (
              <Sticker color={PRIORITY_META[parsed.priority].sticker} rotate={0} small>
                {PRIORITY_META[parsed.priority].label}
              </Sticker>
            ) : null}
            {parsed.categoryName ? (
              <Sticker color="blue" rotate={0} small>
                #{parsed.categoryName}
              </Sticker>
            ) : null}
            {!parsed.title ? (
              <span className="font-mono text-[11px] font-bold uppercase text-ink dark:text-white">
                <Sparkles aria-hidden="true" size={12} className="mr-1 inline" />
                Needs a title
              </span>
            ) : null}
          </>
        ) : (
          <p className="font-mono text-[11px] uppercase tracking-wider opacity-50">
            No date detected — will save as a plain task
          </p>
        )}
      </div>
    </section>
  );
}
