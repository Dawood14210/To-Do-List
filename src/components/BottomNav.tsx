import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../utils/nav';
import { cn } from '../utils/cn';

/**
 * Mobile bottom tab bar: big chunky icons, 64px tall rows (≥48px tap
 * targets), horizontally scrollable on very narrow screens.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-black bg-white dark:border-white dark:bg-black lg:hidden"
    >
      <ul className="no-scrollbar flex overflow-x-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon, color, end }) => (
          <li key={to} className="min-w-[50px] flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-2 transition-colors',
                  isActive
                    ? cn(color, 'text-ink font-bold dark:text-ink')
                    : 'text-ink/60 hover:text-ink dark:text-white/60 dark:hover:text-white'
                )
              }
            >
              <Icon aria-hidden="true" size={24} strokeWidth={2.5} />
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
                {label}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
