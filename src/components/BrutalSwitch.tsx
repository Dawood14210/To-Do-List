import { cn } from '../utils/cn';

interface BrutalSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label, also used as the switch's accessible name. */
  label: string;
  hint?: string;
  disabled?: boolean;
}

/**
 * Chunky on/off switch: 48px tall, thick border, the knob slams to the other
 * side. Used for sound and dark mode.
 */
export function BrutalSwitch({ checked, onChange, label, hint, disabled }: BrutalSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-0">
        <span className="block font-mono text-xs font-bold uppercase tracking-wider">{label}</span>
        {hint ? (
          <span className="mt-1 block font-mono text-[10px] uppercase leading-snug tracking-wider opacity-70">
            {hint}
          </span>
        ) : null}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'flex h-12 w-20 shrink-0 items-center rounded-md border px-1 transition-colors duration-100',
          'shadow-brutal-sm dark:shadow-brutal-sm-invert disabled:opacity-50',
          checked ? 'justify-end bg-mint' : 'justify-start bg-cream dark:bg-black'
        )}
      >
        <span
          className={cn(
            'grid h-9 w-9 place-items-center rounded-sm border border-black bg-white font-mono text-[9px] font-bold uppercase text-ink',
            'dark:border-white dark:bg-black dark:text-white'
          )}
        >
          {checked ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}
