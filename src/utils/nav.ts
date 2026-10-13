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
