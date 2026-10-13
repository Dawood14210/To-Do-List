import { cn } from '../../utils/cn';

export type ProgressTone = 'mint' | 'orange' | 'blue' | 'yellow';

const TONE_CLASSES: Record<ProgressTone, string> = {
  mint: 'bg-mint',
  orange: 'bg-orange',
  blue: 'bg-blue',
  yellow: 'bg-yellow',
};

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  /** Accessible name. Defaults to the subtask wording used in task rows. */
  label?: string;
  /** Colour of the fill until the bar is complete. */
  tone?: ProgressTone;
  /** Render the "3/5" counter on the right (on by default). */
  showCount?: boolean;
}

/** Chunky bordered progress bar — subtasks on the Tasks page, timer on Focus. */
export function ProgressBar({
  value,
  max,
  className,
  label,
  tone = 'mint',
  showCount = true,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const complete = max > 0 && value >= max;

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label ?? `${value} of ${max} subtasks done`}
    >
      <div className="h-4 flex-1 overflow-hidden rounded-sm border border-black bg-cream dark:border-white dark:bg-black">
        <div
          className={cn(
            'h-full transition-[width] duration-150 ease-out',
            complete ? 'bg-yellow' : TONE_CLASSES[tone]
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showCount ? (
        <span className="font-mono text-[11px] font-bold uppercase tabular-nums">
          {value}/{max}
        </span>
      ) : null}
    </div>
  );
}
