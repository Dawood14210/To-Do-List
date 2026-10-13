import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export type StatAccent = 'blue' | 'red' | 'mint' | 'orange' | 'yellow' | 'pink';

const ACCENT_CLASSES: Record<StatAccent, string> = {
  blue: 'bg-blue text-ink',
  red: 'bg-red text-white',
  mint: 'bg-mint text-ink',
  orange: 'bg-orange text-ink',
  yellow: 'bg-yellow text-ink',
  pink: 'bg-pink text-ink',
};

interface StatCardProps {
  label: string;
  value: number | string;
  /** Small mono line under the number. */
  hint: string;
  icon: LucideIcon;
  accent: StatAccent;
  /** Paint the number red (overdue). */
  danger?: boolean;
  onClick?: () => void;
  /** Optional extra row (e.g. the streak strip). */
  children?: ReactNode;
}

/**
 * One chunky dashboard stat: bordered card, coloured icon block, big heading
 * number. Whole card is a 48px+ tap target that drills into the detail view.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
  danger,
  onClick,
  children,
}: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: ${value}. ${hint}`}
      className={cn(
        'flex w-full flex-col items-start gap-2 rounded-md border bg-white p-3 text-left text-ink sm:p-4',
        'shadow-brutal transition-transform duration-100 dark:bg-black dark:text-white dark:shadow-brutal-invert',
        'hoverable:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none',
        danger && 'border-red'
      )}
    >
      <span
        className={cn(
          'grid h-11 w-11 place-items-center rounded-md border shadow-brutal-sm dark:shadow-brutal-sm-invert',
          ACCENT_CLASSES[accent]
        )}
      >
        <Icon aria-hidden="true" size={22} strokeWidth={2.5} />
      </span>

      <span className="font-mono text-[11px] font-bold uppercase tracking-wider">{label}</span>

      <span
        className={cn(
          'font-heading text-4xl leading-none tabular-nums',
          danger && 'text-red'
        )}
      >
        {value}
      </span>

      <span className="font-mono text-[10px] uppercase leading-snug tracking-wider opacity-70">
        {hint}
      </span>

      {children}
    </button>
  );
}
