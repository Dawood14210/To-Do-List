import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';

export type BrutalCardColor =
  | 'white'
  | 'cream'
  | 'yellow'
  | 'pink'
  | 'blue'
  | 'mint'
  | 'orange';

const COLOR_CLASSES: Record<BrutalCardColor, string> = {
  white: 'bg-white text-ink dark:bg-black dark:text-white',
  cream: 'bg-cream text-ink dark:bg-black dark:text-white',
  yellow: 'bg-yellow text-ink',
  pink: 'bg-pink text-ink',
  blue: 'bg-blue text-ink',
  mint: 'bg-mint text-ink',
  orange: 'bg-orange text-ink',
};

export type BrutalCardPadding = 'none' | 'sm' | 'md' | 'lg';

const PADDING_CLASSES: Record<BrutalCardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

interface BrutalCardProps extends HTMLAttributes<HTMLDivElement> {
  color?: BrutalCardColor;
  padding?: BrutalCardPadding;
  as?: 'div' | 'article' | 'section';
  children?: ReactNode;
}

/**
 * 3px bordered surface with a hard 5px offset shadow, zero blur.
 */
export const BrutalCard = forwardRef<HTMLDivElement, BrutalCardProps>(
  function BrutalCard(
    { color = 'white', padding = 'md', as: Tag = 'div', className, children, ...rest },
    ref
  ) {
    return (
      <Tag
        ref={ref}
        className={cn(
          'rounded-md border shadow-brutal dark:shadow-brutal-invert',
          COLOR_CLASSES[color],
          PADDING_CLASSES[padding],
          className
        )}
        {...rest}
      >
        {children}
      </Tag>
    );
  }
);
