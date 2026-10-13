import { addDays, set, startOfDay } from 'date-fns';
import type { Priority } from '../types';

/**
 * Natural-language quick-add parser.
 *
 *   "Submit report tomorrow 5pm !high #study"
 *   → title "Submit report", due tomorrow 17:00, priority high, category Study
 *
 * Recognised tokens (anywhere, any order):
 *   dates   today · tomorrow · weekday names · "next <weekday>"
 *   times   5pm · 5:30pm · 17:30 · noon · midnight
 *   prio    !high !urgent !med !medium !low
 *   category #study (matched against existing categories, case-insensitive)
 */
export interface ParsedQuickAdd {
  title: string;
  dueAt: string | null;
  priority: Priority | null;
  /** Category name as the user typed it (minus the #). */
  categoryName: string | null;
  /** True when at least one token was recognised. */
  parsed: boolean;
}

const WEEKDAYS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const PRIORITY_WORDS: Record<string, Priority> = {
  high: 'high',
  hi: 'high',
  urgent: 'high',
  asap: 'high',
  med: 'medium',
  medium: 'medium',
  mid: 'medium',
  low: 'low',
  minor: 'low',
};

const TIME_RE = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i;
const MILITARY_TIME_RE = /^(\d{1,2}):(\d{2})$/;

/** Default time when only a date word is given: 5:00 PM. */
const DEFAULT_HOUR = 17;

function parseTimeToken(token: string): { hour: number; minute: number } | null {
  const lower = token.toLowerCase();

  if (lower === 'noon') return { hour: 12, minute: 0 };
  if (lower === 'midnight') return { hour: 0, minute: 0 };

  const twelve = TIME_RE.exec(token);
  if (twelve) {
    let hour = Number(twelve[1]);
    const minute = twelve[2] ? Number(twelve[2]) : 0;
    const meridiem = twelve[3].toLowerCase();
    if (hour < 1 || hour > 12 || minute > 59) return null;
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
    return { hour, minute };
  }

  const military = MILITARY_TIME_RE.exec(token);
  if (military) {
    const hour = Number(military[1]);
    const minute = Number(military[2]);
    if (hour > 23 || minute > 59) return null;
    // Bare "5:30" is read as afternoon — use a colon + 24h for mornings.
    return hour <= 12 ? { hour: hour === 12 ? 12 : hour + 12, minute } : { hour, minute };
  }

  return null;
}

export function parseQuickAdd(
  input: string,
  options: { categoryNames?: string[]; now?: Date } = {}
): ParsedQuickAdd {
  const now = options.now ?? new Date();
  const categoryNames = options.categoryNames ?? [];
  const tokens = input.split(/\s+/).filter(Boolean);

  const used = new Set<number>();
  let priority: Priority | null = null;
  let categoryName: string | null = null;
  let dayOffset: number | null = null;
  let time: { hour: number; minute: number } | null = null;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const lower = token.toLowerCase();

    // !priority
    if (lower.startsWith('!')) {
      const word = PRIORITY_WORDS[lower.slice(1)];
      if (word) {
        priority = word;
        used.add(index);
      }
      continue;
    }

    // #category
    if (token.startsWith('#') && token.length > 1) {
      const name = token.slice(1);
      const match = categoryNames.find((c) => c.toLowerCase() === name.toLowerCase());
      if (match) {
        categoryName = match;
        used.add(index);
      }
      // Unknown tags stay in the title (or become a new category on save).
      continue;
    }

    // "next <weekday>"
    if (lower === 'next' && index + 1 < tokens.length) {
      const dow = WEEKDAYS[tokens[index + 1].toLowerCase().replace(/,$/, '')];
      if (dow !== undefined) {
        const today = now.getDay();
        dayOffset = (dow - today + 7) % 7 || 7;
        used.add(index);
        used.add(index + 1);
        continue;
      }
    }

    // dates
    if (lower === 'today') {
      dayOffset = 0;
      used.add(index);
      continue;
    }
    if (lower === 'tomorrow') {
      dayOffset = 1;
      used.add(index);
      continue;
    }
    const dow = WEEKDAYS[lower.replace(/,$/, '')];
    if (dow !== undefined && dayOffset === null) {
      const today = now.getDay();
      dayOffset = (dow - today + 7) % 7;
      used.add(index);
      continue;
    }

    // times
    if (time === null) {
      const parsedTime = parseTimeToken(token);
      if (parsedTime) {
        time = parsedTime;
        used.add(index);
      }
    }
  }

  /* ---------------- assemble the due datetime ---------------- */
  let dueAt: string | null = null;

  if (dayOffset !== null || time !== null) {
    let day = startOfDay(now);

    if (dayOffset !== null) {
      day = addDays(day, dayOffset);
    } else if (time !== null) {
      // Time only: today if it is still ahead, otherwise tomorrow.
      const candidate = set(day, { hours: time.hour, minutes: time.minute, seconds: 0, milliseconds: 0 });
      if (candidate.getTime() <= now.getTime()) {
        day = addDays(day, 1);
      }
    }

    const hours = time ? time.hour : DEFAULT_HOUR;
    const minutes = time ? time.minute : 0;
    dueAt = set(day, { hours, minutes, seconds: 0, milliseconds: 0 }).toISOString();
  }

  /* ---------------- title = unconsumed tokens ---------------- */
  const title = tokens.filter((_, index) => !used.has(index)).join(' ').trim();

  return {
    title,
    dueAt,
    priority,
    categoryName,
    parsed: priority !== null || categoryName !== null || dueAt !== null,
  };
}
