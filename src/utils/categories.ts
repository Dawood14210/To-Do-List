import type { Category } from '../types';

/* ------------------------------------------------------------------ */
/* Colour palette                                                      */
/* ------------------------------------------------------------------ */

export interface CategoryColorOption {
  /** Tailwind background class stored on the category. */
  value: string;
  /** Human name for the swatch (used in aria-labels + hints). */
  label: string;
}

/**
 * The only colours a category may use — all six design-system accents.
 * Kept in one place so the store, the picker and legends agree.
 */
export const CATEGORY_COLORS: CategoryColorOption[] = [
  { value: 'bg-blue', label: 'Blue' },
  { value: 'bg-pink', label: 'Pink' },
  { value: 'bg-mint', label: 'Mint' },
  { value: 'bg-orange', label: 'Orange' },
  { value: 'bg-yellow', label: 'Yellow' },
  { value: 'bg-cream', label: 'Cream' },
];

export const CATEGORY_PALETTE = CATEGORY_COLORS.map((option) => option.value);

export const DEFAULT_CATEGORY_COLOR = 'bg-blue';

/** "bg-blue" → "Blue" (falls back to the raw value for unknown colours). */
export function categoryColorLabel(color: string): string {
  return CATEGORY_COLORS.find((option) => option.value === color)?.label ?? color;
}

/** Colour used when nothing better is known: cycle through the palette. */
export function nextCategoryColor(count: number): string {
  return CATEGORY_PALETTE[count % CATEGORY_PALETTE.length];
}

/* ------------------------------------------------------------------ */
/* Names                                                               */
/* ------------------------------------------------------------------ */

/** "study" → "Study"; blank input becomes "Untitled". */
export function displayCategoryName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Untitled';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Case-insensitive lookup by name (used to avoid duplicates). */
export function findCategoryByName(
  categories: Category[],
  name: string
): Category | undefined {
  const needle = name.trim().toLowerCase();
  return categories.find((category) => category.name.toLowerCase() === needle);
}

/** The label the rest of the app uses for tasks with no category. */
export const UNCATEGORIZED_LABEL = 'Uncategorized';
