import { useEffect } from 'react';
import { pushBackHandler } from '../utils/backButton';

/**
 * While `active` is true the Android back button closes this overlay instead
 * of navigating or exiting. Overlays stack last-in-first-out, so the most
 * recently opened modal is always the one that closes.
 */
export function useAndroidBack(active: boolean, onBack: () => void): void {
  useEffect(() => {
    if (!active) return undefined;
    return pushBackHandler(onBack);
  }, [active, onBack]);
}
