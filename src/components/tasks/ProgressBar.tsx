import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

/** Chunky bordered progress bar — used for subtask completion. */
export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const complete = max > 0 && value === max;

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`${value} of ${max} subtasks done`}
    >
      <div className="h-4 flex-1 overflow-hidden rounded-sm border border-black bg-cream dark:border-white dark:bg-black">
        <div
          className={cn(
            'h-full transition-[width] duration-150 ease-out',
            complete ? 'bg-yellow' : 'bg-mint'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[11px] font-bold uppercase tabular-nums">
        {value}/{max}
      </span>
    </div>
  );
}
