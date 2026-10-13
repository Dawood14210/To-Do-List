import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

export type BrutalButtonVariant =
  | 'yellow'
  | 'pink'
  | 'blue'
  | 'mint'
  | 'orange'
  | 'cream'
  | 'white'
  | 'ink';

export type BrutalButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BrutalButtonVariant;
  size?: BrutalButtonSize;
  fullWidth?: boolean;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<BrutalButtonVariant, string> = {
  yellow: 'bg-yellow text-ink',
  pink: 'bg-pink text-ink',
  blue: 'bg-blue text-ink',
  mint: 'bg-mint text-ink',
  orange: 'bg-orange text-ink',
  cream: 'bg-cream text-ink',
  white: 'bg-white text-ink dark:bg-black dark:text-white',
  ink: 'bg-ink text-white dark:bg-white dark:text-ink',
};

const SIZE_CLASSES: Record<BrutalButtonSize, string> = {
  sm: 'min-h-12 px-3 text-xs gap-1.5',
  md: 'min-h-12 px-5 text-sm gap-2',
  lg: 'min-h-14 px-7 text-base gap-2.5',
  icon: 'min-h-12 w-12 p-0',
};

/**
 * The core action component of the design system:
 * 3px border, hard offset shadow, lifts on hover (-2px) and slams down on
 * active (4px 4px, shadow 0). Minimum 48px tap target in every size.
 */
export const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  function BrutalButton(
    {
      variant = 'yellow',
      size = 'md',
      fullWidth,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex select-none items-center justify-center rounded-md border font-heading uppercase tracking-wide',
          'shadow-brutal dark:shadow-brutal-invert',
          'transition-transform duration-100 ease-out',
          'hover:-translate-x-0.5 hover:-translate-y-0.5',
          'active:translate-x-1 active:translate-y-1 active:shadow-none',
          'disabled:pointer-events-none disabled:opacity-50',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
