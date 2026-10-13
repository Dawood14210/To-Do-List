import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

export type StickerColor =
  | 'yellow'
  | 'pink'
  | 'blue'
  | 'mint'
  | 'orange'
  | 'cream'
  | 'white'
  | 'ink';

const COLOR_CLASSES: Record<StickerColor, string> = {
  yellow: 'bg-yellow text-ink',
  pink: 'bg-pink text-ink',
  blue: 'bg-blue text-ink',
  mint: 'bg-mint text-ink',
  orange: 'bg-orange text-ink',
  cream: 'bg-cream text-ink',
  white: 'bg-white text-ink dark:bg-black dark:text-white',
  ink: 'bg-ink text-white dark:bg-white dark:text-ink',
};

interface StickerProps extends HTMLAttributes<HTMLSpanElement> {
  color?: StickerColor;
  /** Slight playful rotation, in degrees. 0 = straight. Only applied from 768px up. */
  rotate?: number;
  /** Soften to the small shadow (default is the 3px hard shadow). */
  small?: boolean;
  children?: ReactNode;
}

/**
 * A chunky label chip: mono type, thick border, hard offset shadow,
 * optionally tilted like a sticker slapped on a notebook.
 */
export function Sticker({
  color = 'yellow',
  rotate = -2,
  small = false,
  className,
  style,
  children,
  ...rest
}: StickerProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2.5 py-1',
        'font-mono text-[11px] font-bold uppercase tracking-wider',
        small ? 'shadow-brutal-sm dark:shadow-brutal-sm-invert' : 'shadow-brutal dark:shadow-brutal-invert',
        'sticker-tilt',
        COLOR_CLASSES[color],
        className
      )}
      style={{
        '--tilt': `${rotate}deg`,
        ...style,
      } as CSSProperties}
      {...rest}
    >
      {children}
    </span>
  );
}
