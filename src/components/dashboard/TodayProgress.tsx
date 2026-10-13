import { cn } from '../../utils/cn';
import { Sticker } from '../Sticker';
import type { TodayProgress as TodayProgressData } from '../../utils/stats';

interface TodayProgressProps {
  progress: TodayProgressData;
  overdue: number;
}

/**
 * The dashboard centrepiece: one fat bordered bar showing how much of today's
 * list is finished, with a plain-language status line.
 */
export function TodayProgress({ progress, overdue }: TodayProgressProps) {
  const { total, done, pct } = progress;
  const allDone = total > 0 && done === total;

  const message =
    total === 0
      ? 'Nothing due today — add something or enjoy the calm.'
      : allDone
        ? 'Every task due today is done. Certified legend.'
        : overdue > 0
          ? `${total - done} left today — and ${overdue} overdue to clear.`
          : `${total - done} left to go today. Keep the streak alive.`;

  return (
    <section
      aria-label="Today's progress"
      className="rounded-md border bg-white p-4 shadow-brutal dark:bg-black dark:shadow-brutal-invert sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl uppercase leading-none sm:text-2xl">Today</h2>
        <Sticker color={allDone ? 'mint' : 'yellow'} rotate={-2}>
          {pct}% done
        </Sticker>
      </div>

      <p className="mt-3 font-heading text-3xl leading-none sm:text-4xl">
        {done}
        <span className="ml-2 font-mono text-sm font-bold uppercase tracking-wider opacity-70">
          of {total} tasks
        </span>
      </p>

      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${done} of ${total} tasks due today are done`}
        className="mt-3 h-10 w-full overflow-hidden rounded-md border-4 border-black bg-cream dark:border-white dark:bg-black sm:h-12"
      >
        <div
          className={cn(
            'h-full transition-[width] duration-300 ease-out',
            allDone ? 'bg-mint' : 'bg-blue'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 font-mono text-[11px] font-bold uppercase leading-snug tracking-wider">
        {message}
      </p>
    </section>
  );
}
