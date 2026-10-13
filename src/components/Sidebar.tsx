import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../utils/nav';
import { Sticker } from './Sticker';
import { cn } from '../utils/cn';

/**
 * Desktop-only left sidebar. Big chunky nav blocks, active route gets the
 * route's accent color + hard offset shadow.
 */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-black bg-white dark:border-white dark:bg-black lg:flex">
      <nav aria-label="Main" className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, color, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-h-12 items-center gap-3 rounded-md border border-transparent px-3',
                'font-heading text-sm uppercase tracking-wide transition-transform duration-100',
                'hoverable:-translate-y-0.5',
                isActive &&
                  cn(
                    color,
                    'border-black text-ink shadow-brutal-sm dark:border-white dark:shadow-brutal-sm-invert',
                    'active:translate-x-1 active:translate-y-1 active:shadow-none'
                  ),
                !isActive && 'text-ink hoverable:bg-cream dark:text-white dark:hoverable:bg-black'
              )
            }
          >
            <Icon aria-hidden="true" size={24} strokeWidth={2.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-2 border-t border-black p-4 dark:border-white">
        <Sticker color="mint" rotate={-3} small>
          Neo-Brutal
        </Sticker>
        <Sticker color="pink" rotate={2} small>
          v0.1.0
        </Sticker>
      </div>
    </aside>
  );
}
