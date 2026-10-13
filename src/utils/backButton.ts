/**
 * Android hardware back button handling.
 *
 * Overlays (modals, sheets, panels) register a handler on an internal stack
 * while they are open. A back press unwinds the stack last-in-first-out before
 * the app ever navigates or exits, which is what Android users expect:
 *
 *   1. close the topmost modal / sheet / panel
 *   2. otherwise go back through the router history
 *   3. otherwise exit the app
 */

import { Capacitor } from '@capacitor/core';

type BackHandler = () => void;

interface BackEntry {
  id: number;
  handler: BackHandler;
}

const stack: BackEntry[] = [];
let nextId = 1;

/**
 * Register a back handler (newest wins). Returns an unregister function.
 * Safe to call on the web — handlers simply never fire.
 */
export function pushBackHandler(handler: BackHandler): () => void {
  const id = nextId++;
  stack.push({ id, handler });
  return () => popBackHandler(id);
}

/** Remove a handler by id (used by the unregister function). */
export function popBackHandler(id: number): void {
  const index = stack.findIndex((entry) => entry.id === id);
  if (index >= 0) stack.splice(index, 1);
}

/**
 * Run the topmost handler. Returns true when something consumed the press
 * (so the caller must NOT navigate or exit).
 */
export function handleBackPress(): boolean {
  const entry = stack[stack.length - 1];
  if (!entry) return false;
  entry.handler();
  return true;
}

/** How many overlays are currently listening (used by tests). */
export function backHandlerCount(): number {
  return stack.length;
}

/** Drop every handler (tests / hard resets). */
export function clearBackHandlers(): void {
  stack.length = 0;
}

export interface AndroidBackOptions {
  /** Called when there is nowhere left to go in-app (defaults to App.exitApp()). */
  exit?: () => void;
}

/**
 * Wire Capacitor's `backButton` event to the handler stack + router history.
 * Returns a cleanup function. No-op on the web.
 */
export function installAndroidBackButton(options: AndroidBackOptions = {}): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  let remove: (() => void) | undefined;
  let cancelled = false;

  import('@capacitor/app')
    .then(({ App }) =>
      App.addListener('backButton', ({ canGoBack }) => {
        // 1. overlays first
        if (handleBackPress()) return;
        // 2. then real router history
        if (canGoBack || hasAppHistory()) {
          window.history.back();
          return;
        }
        // 3. finally leave the app
        if (options.exit) options.exit();
        else void import('@capacitor/app').then(({ App }) => App.exitApp());
      })
    )
    .then((listener) => {
      if (cancelled) {
        void listener.remove();
        return;
      }
      remove = () => void listener.remove();
    })
    .catch(() => {
      /* the plugin is missing (web build) — nothing to install */
    });

  return () => {
    cancelled = true;
    remove?.();
  };
}

/** Browser history depth guard — react-router's history index, if present. */
function hasAppHistory(): boolean {
  const state = window.history.state as { idx?: number } | null;
  return typeof state?.idx === 'number' && state.idx > 0;
}
