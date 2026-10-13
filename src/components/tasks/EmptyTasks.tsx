import { SearchX } from 'lucide-react';
import { BrutalButton } from '../BrutalButton';

interface EmptyTasksProps {
  /** True when filters/search are hiding everything. */
  filtered: boolean;
  onClearFilters?: () => void;
}

/**
 * Funny empty state: pure CSS shapes + a suspicious pair of eyes.
 * "NOTHING TO DO. SUSPICIOUS."
 */
export function EmptyTasks({ filtered, onClearFilters }: EmptyTasksProps) {
  return (
    <section
      aria-label="Empty task list"
      className="relative overflow-hidden rounded-md border bg-white px-6 py-14 text-center shadow-brutal dark:bg-black dark:shadow-brutal-invert"
    >
      {/* CSS shapes — no images, no gradients, just borders */}
      <div aria-hidden="true">
        <span className="absolute -left-6 -top-6 h-24 w-24 rotate-12 rounded-md border bg-yellow" />
        <span className="absolute -right-8 top-10 h-20 w-20 rounded-full border bg-pink" />
        <span className="absolute bottom-6 left-8 h-14 w-14 -rotate-6 rounded-md border bg-blue" />
        <span className="absolute bottom-4 right-14 h-10 w-10 rotate-45 border bg-mint" />

        {/* Shifty eyes */}
        <span className="absolute left-1/2 top-5 flex -translate-x-16 gap-2">
          <span className="relative block h-12 w-12 rounded-full border bg-white dark:bg-cream">
            <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
          </span>
          <span className="relative block h-12 w-12 rounded-full border bg-white dark:bg-cream">
            <span className="absolute right-1/4 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ink" />
          </span>
        </span>
      </div>

      <div className="relative mx-auto max-w-md pt-16">
        <h2 className="mb-3 text-2xl leading-tight sm:text-3xl">
          {filtered ? (
            <>
              NOTHING TO SEE.
              <br />
              SUSPICIOUS.
            </>
          ) : (
            <>
              NOTHING TO DO.
              <br />
              SUSPICIOUS.
            </>
          )}
        </h2>
        <p className="mb-6 font-mono text-xs uppercase leading-relaxed tracking-wider opacity-70">
          {filtered
            ? 'Your filters are hiding everything. Even the suspicious nothing.'
            : 'Either you finished everything, or the tasks are up to something. Add one and keep an eye on them.'}
        </p>

        {filtered && onClearFilters ? (
          <BrutalButton variant="blue" onClick={onClearFilters}>
            <SearchX aria-hidden="true" size={18} strokeWidth={3} />
            Reset filters
          </BrutalButton>
        ) : (
          <span aria-hidden="true" className="font-mono text-2xl font-bold tracking-[0.4em]">
            ···
          </span>
        )}
      </div>
    </section>
  );
}
