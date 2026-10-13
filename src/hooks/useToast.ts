import { useCallback } from 'react';
import { useAppStore } from '../store';
import type { ToastType, UndoPayload } from '../types';

/**
 * Convenience wrapper around the store's toast actions.
 *
 *   const toast = useToast();
 *   toast('Saved!', 'success');
 *   toast('Deleted', 'warning', { type: 'delete-tasks', tasks: [task] });
 */
export function useToast() {
  const showToast = useAppStore((state) => state.showToast);

  return useCallback(
    (message: string, type: ToastType = 'info', undo?: UndoPayload) =>
      showToast(message, type, undo),
    [showToast]
  );
}
