import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { BrutalButton } from './BrutalButton';
import { useAndroidBack } from '../hooks/useAndroidBack';
import { cn } from '../utils/cn';

interface BrutalModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  /** Optional action row rendered at the bottom of the modal. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Centered dialog: thick border, hard shadow, no blur (flat scrim),
 * ESC + backdrop dismissal, scroll lock and a focus grab on open.
 */
export function BrutalModal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: BrutalModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Android back closes the dialog before anything else happens.
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Flat scrim — no blur, no gradient. */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/60"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-md border bg-cream text-ink outline-none',
          'shadow-brutal dark:shadow-brutal-invert dark:bg-black dark:text-white',
          'animate-brutal-pop',
          className
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-black p-5 dark:border-white">
          <h2 className="pt-2 text-xl uppercase">{title}</h2>
          <BrutalButton
            variant="white"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0"
          >
            <X aria-hidden="true" size={22} strokeWidth={3} />
          </BrutalButton>
        </header>

        <div className="p-5">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap justify-end gap-3 border-t border-black p-5 dark:border-white">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
