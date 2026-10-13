import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { MORE_ITEMS } from '../utils/nav';
import { cn } from '../utils/cn';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { BrutalButton } from './BrutalButton';

interface MoreSheetProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Neo-brutalist bottom sheet opened from the "More" tab. A 2x2 grid of big
 * coloured tiles, one per secondary page. Tapping a tile navigates and closes
 * the sheet. Registered with the Android back stack, so back closes it first.
 */
export function MoreSheet({ open, onClose }: MoreSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Android back closes the sheet before navigating or exiting.
  useAndroidBack(open, onClose);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Flat scrim: no blur, no gradient. */}
      <button
        type="button"
        aria-label="Close more pages"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/60"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="More pages"
        tabIndex={-1}
        className={cn(
          'animate-brutal-pop relative w-full max-w-full rounded-t-md border-x border-t-4 border-black bg-cream text-ink outline-none',
          'pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-brutal',
          'dark:border-white dark:bg-black dark:text-white dark:shadow-brutal-invert'
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-black p-4 dark:border-white">
          <h2 className="text-xl uppercase leading-none">More</h2>
          <BrutalButton variant="white" size="icon" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" size={22} strokeWidth={3} />
          </BrutalButton>
        </header>

        <nav aria-label="More pages" className="grid grid-cols-2 gap-3 p-4">
          {MORE_ITEMS.map(({ to, label, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={cn(
                'flex min-h-28 flex-col items-start justify-between gap-3 rounded-md border border-black p-4',
                'font-heading text-base uppercase leading-none text-ink shadow-brutal transition-transform duration-100',
                'hoverable:-translate-x-0.5 hoverable:-translate-y-0.5',
                'active:translate-x-1 active:translate-y-1 active:shadow-none',
                'dark:border-white dark:shadow-brutal-invert',
                color
              )}
            >
              <Icon aria-hidden="true" size={32} strokeWidth={2.5} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>,
    document.body
  );
}
