import { useCallback } from 'react';
import { useAppStore } from '../store';
import type { ToastType } from '../types';

/**
 * Convenience wrapper around the store's toast actions.
 *
 *   const toast = useToast();
 *   toast('Saved!', 'success');
 */
export function useToast() {
  const showToast = useAppStore((state) => state.showToast);

  return useCallback(
    (message: string, type: ToastType = 'info') => showToast(message, type),
    [showToast]
  );
}
