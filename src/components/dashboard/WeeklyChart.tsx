import { cn } from '../../utils/cn';
import { Sticker } from '../Sticker';
import { weeklyPeak } from '../../utils/stats';
import type { DayActivity } from '../../utils/stats';

interface WeeklyChartProps {
  days: DayActivity[];
  total: number;
}

/** Tallest a bar ever gets (px). Everything else is scaled against the peak. */
const MAX_BAR_PX = 112;
const STUB_BAR_PX = 8;

/**
 * Weekly bar chart of completed tasks — deliberately built from plain divs
 * with thick borders: no chart library, no SVG, no gradients.
 */
export function WeeklyChart({ days, total }: WeeklyChartProps) {
  const peak = weeklyPeak(days);

  return (
    <section
      aria-label="Completed this week"
      className="rounded-md border bg-white p-4 shadow-brutal dark:bg-black dark:shadow-brutal-invert sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl uppercase leading-none sm:text-2xl">This week</h2>
        <Sticker color="blue" rotate={1}>
          {total} completed
        </Sticker>
      </div>

      <ul
        aria-label="Completions per day, Monday to Sunday"
        className="mt-4 flex h-44 items-stretch"
      >
        {days.map((day) => {
          const height =
            day.count === 0
              ? STUB_BAR_PX
              : Math.max(14, Math.round((day.count / peak) * MAX_BAR_PX));

          return (
            <li key={day.key} className="flex min-w-0 flex-1 flex-col px-0.5 sm:px-1">
              {/* Bar area — the dashed bottom border is the chart's baseline. */}
              <div className="flex flex-1 flex-col items-center justify-end border-b-4 border-dashed border-black/30 dark:border-white/30">
                <span
                  className={cn(
                    'font-mono text-[11px] font-bold tabular-nums',
                    day.count === 0 && 'opacity-40'
                  )}
                >
                  {day.count}
                </span>
                <div
                  aria-hidden="true"
                  style={{ height: `${height}px` }}
                  className={cn(
                    'w-full max-w-12 rounded-sm shadow-brutal-sm dark:shadow-brutal-sm-invert',
                    day.isToday ? 'border-4 border-blue bg-yellow' : 'border-2 border-black bg-blue dark:border-white'
                  )}
                />
              </div>

              <span
                className={cn(
                  'mt-1 truncate rounded-sm px-1 py-0.5 text-center font-mono text-[10px] font-bold uppercase tracking-wider',
                  day.isToday ? 'bg-blue text-ink' : 'opacity-70'
                )}
              >
                {day.isToday ? 'Today' : day.label}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 font-mono text-[10px] uppercase leading-snug tracking-wider opacity-70">
        {total === 0
          ? 'Nothing finished yet this week — break the ice.'
          : 'Finished tasks + habit check-ins, per day.'}
      </p>
    </section>
  );
}
