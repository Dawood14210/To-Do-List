import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAppStore } from '../store';
import type { ToastType } from '../types';
import { cn } from '../utils/cn';
import { BrutalButton } from './BrutalButton';

const TYPE_CLASSES: Record<ToastType, string> = {
  info: 'bg-blue text-ink',
  success: 'bg-mint text-ink',
  warning: 'bg-orange text-ink',
  error: 'bg-pink text-ink',
};

const TYPE_ICONS: Record<ToastType, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
};

/**
 * Toast stack driven by the persisted store. Supports an optional UNDO
 * action (delete / complete) — render once near the root (Layout does).
 */
export function Toast() {
  const toasts = useAppStore((state) => state.toasts);
  const dismissToast = useAppStore((state) => state.dismissToast);
  const applyUndo = useAppStore((state) => state.applyUndo);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-stretch gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px]"
    >
      {toasts.map((toast) => {
        const Icon = TYPE_ICONS[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex min-h-12 items-center gap-3 rounded-md border px-3 py-2',
              'shadow-brutal dark:shadow-brutal-invert animate-brutal-slide',
              TYPE_CLASSES[toast.type]
            )}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={2.5} className="shrink-0" />
            <p className="min-w-0 flex-1 font-body text-sm font-semibold leading-snug">
              {toast.message}
            </p>

            {toast.undo ? (
              <BrutalButton
                variant="white"
                size="sm"
                className="shrink-0 font-mono"
                onClick={() => applyUndo(toast.undo!)}
              >
                Undo
              </BrutalButton>
            ) : null}

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="-mr-1 grid h-12 w-12 shrink-0 place-items-center rounded-md transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-1"
            >
              <X aria-hidden="true" size={20} strokeWidth={3} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
