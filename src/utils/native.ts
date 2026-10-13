import { Capacitor } from '@capacitor/core';
import type { Theme } from '../types';

/**
 * Thin wrapper around the Capacitor runtime.
 *
 * Every plugin is imported dynamically and every call is wrapped in a
 * try/catch, so the exact same bundle runs unchanged in a browser (where the
 * helpers quietly do nothing) and inside the Android app.
 */

/** True when running inside the native shell (Android/iOS), false on the web. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** 'android' | 'ios' | 'web'. */
export function nativePlatform(): string {
  return Capacitor.getPlatform();
}

/** Status bar background for each theme — the app's yellow block, or black. */
export const STATUS_BAR_COLORS: Record<Theme, string> = {
  light: '#FFD84D',
  dark: '#000000',
};

/* ------------------------------------------------------------------ */
/* Haptics                                                             */
/* ------------------------------------------------------------------ */

/** Light tap — used when a task is ticked off. No-op on the web. */
export async function hapticLight(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* haptics are a nicety — never break the app over them */
  }
}

/** Medium thump — used for destructive or chunky actions. */
export async function hapticMedium(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* ignore */
  }
}

/** Success notification feedback — used when a session finishes. */
export async function hapticSuccess(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Status bar                                                          */
/* ------------------------------------------------------------------ */

/**
 * Paint the Android status bar in the current theme: the brand yellow with
 * dark icons in light mode, black with light icons in dark mode.
 */
export async function applyStatusBarTheme(theme: Theme): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    // `Style.Dark` = light text (for dark backgrounds).
    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: STATUS_BAR_COLORS[theme] });
  } catch {
    /* best effort — an older device may not support every call */
  }
}

/** Also tell the browser/WebView chrome about the theme colour. */
export function applyThemeColorMeta(theme: Theme): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', STATUS_BAR_COLORS[theme]);
}
