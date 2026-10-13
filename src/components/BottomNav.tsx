import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import { MOBILE_TABS, MORE_ITEMS } from '../utils/nav';
import { cn } from '../utils/cn';
import { MoreSheet } from './MoreSheet';

/** Shared box for every tab: 56px min height, 4px border (visible on the active tab). */
const TAB_BASE =
  'flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-0.5 border-4 px-1 py-1 transition-colors';

/**
 * Mobile bottom tab bar: five equal-width tabs (Dashboard, Tasks, Calendar,
 * Focus, More). "More" opens a bottom sheet with the remaining pages. The
 * desktop sidebar is separate and unchanged.
 */
export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  const { pathname } = useLocation();

  const moreActive = MORE_ITEMS.some(
    ({ to }) => pathname === to || pathname.startsWith(`${to}/`)
  );

  return (
    <>
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-black bg-white dark:border-white dark:bg-black lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {MOBILE_TABS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="min-w-0">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    TAB_BASE,
                    isActive
                      ? 'border-black bg-yellow font-bold text-ink dark:border-white'
                      : 'border-transparent text-ink/60 hoverable:text-ink dark:text-white/60 dark:hoverable:text-white'
                  )
                }
              >
                <TabLabel icon={<Icon aria-hidden="true" size={24} strokeWidth={2.5} />} label={label} />
              </NavLink>
            </li>
          ))}

          <li className="min-w-0">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
              className={cn(
                TAB_BASE,
                moreActive || moreOpen
                  ? 'border-black bg-yellow font-bold text-ink dark:border-white'
                  : 'border-transparent text-ink/60 hoverable:text-ink dark:text-white/60 dark:hoverable:text-white'
              )}
            >
              <TabLabel
                icon={<MoreHorizontal aria-hidden="true" size={24} strokeWidth={2.5} />}
                label="More"
              />
            </button>
          </li>
        </ul>
      </nav>

      <MoreSheet open={moreOpen} onClose={closeMore} />
    </>
  );
}

function TabLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <>
      {icon}
      <span className="block max-w-full whitespace-nowrap font-mono text-[10px] font-bold uppercase leading-tight tracking-wide">
        {label}
      </span>
    </>
  );
}
