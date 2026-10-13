import {
  CalendarDays,
  Flame,
  LayoutDashboard,
  ListTodo,
  Settings,
  StickyNote,
  Tags,
  Timer,
} from 'lucide-react';
import type { NavItem } from '../types';

/** Single source of truth for sidebar + bottom tab bar. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-yellow', end: true },
  { to: '/tasks', label: 'Tasks', icon: ListTodo, color: 'bg-pink' },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, color: 'bg-blue' },
  { to: '/categories', label: 'Categories', icon: Tags, color: 'bg-orange' },
  { to: '/focus', label: 'Focus', icon: Timer, color: 'bg-orange' },
  { to: '/habits', label: 'Habits', icon: Flame, color: 'bg-mint' },
  { to: '/notes', label: 'Notes', icon: StickyNote, color: 'bg-cream' },
  { to: '/settings', label: 'Settings', icon: Settings, color: 'bg-yellow' },
];

/** Routes on the mobile tab bar (the fifth tab, "More", opens the sheet). */
const TAB_ROUTES = ['/', '/tasks', '/calendar', '/focus'];

/** Routes listed in the mobile "More" sheet. */
const MORE_ROUTES = ['/categories', '/habits', '/notes', '/settings'];

/** Mobile bottom tabs, in display order. */
export const MOBILE_TABS: NavItem[] = NAV_ITEMS.filter((item) => TAB_ROUTES.includes(item.to));

/** Items behind the mobile "More" bottom sheet, in display order. */
export const MORE_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => MORE_ROUTES.includes(item.to));
