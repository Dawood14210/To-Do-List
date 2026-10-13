import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../hooks/useTheme';
import { formatFullDate, formatShortDate } from '../utils/dates';
import { BrutalButton } from './BrutalButton';

interface HeaderProps {
  /** Optional enhanced toggle (confetti + toast) supplied by App. */
  onToggleTheme?: () => void;
}

/**
 * Sticky top bar: app name in a yellow block with a thick border,
 * today's date in mono, and the light/dark toggle.
 */
export function Header({ onToggleTheme }: HeaderProps) {
  const { isDark, theme, toggleTheme } = useTheme();
  const today = new Date();
  const handleToggleTheme = onToggleTheme ?? toggleTheme;

  return (
    <header className="sticky top-0 z-40 border-b border-black bg-cream dark:border-white dark:bg-black">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
        {/* App name in a yellow block */}
        <Link
          to="/"
          aria-label="To-Do List — go to dashboard"
          className="rounded-md border border-black bg-yellow px-3 py-1.5 text-ink shadow-brutal-sm transition-transform duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none dark:border-white dark:shadow-brutal-sm-invert sm:px-4 sm:py-2"
        >
          <span className="font-heading text-base uppercase leading-none tracking-tight sm:text-xl">
            To-Do List
          </span>
        </Link>

        {/* Today's date in mono */}
        <time
          dateTime={format(today, 'yyyy-MM-dd')}
          className="hidden font-mono text-sm font-bold uppercase tracking-wide sm:block"
        >
          <span className="hidden md:inline">{formatFullDate(today)}</span>
          <span className="md:hidden">{formatShortDate(today)}</span>
        </time>

        <BrutalButton
          variant="white"
          size="icon"
          onClick={handleToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? (
            <Sun aria-hidden="true" size={22} strokeWidth={2.5} />
          ) : (
            <Moon aria-hidden="true" size={22} strokeWidth={2.5} />
          )}
        </BrutalButton>
      </div>

      {/* Date strip for tiny screens (keeps the main row compact) */}
      <time
        dateTime={format(today, 'yyyy-MM-dd')}
        className="block border-t border-black px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest dark:border-white sm:hidden"
      >
        {formatFullDate(today)} · {theme === 'dark' ? 'Dark' : 'Light'}
      </time>
    </header>
  );
}
