import { Construction } from 'lucide-react';
import { BrutalCard } from './BrutalCard';
import { Sticker } from './Sticker';
import type { StickerColor } from './Sticker';

interface PagePlaceholderProps {
  title: string;
  description: string;
  /** Accent used for the "Coming soon" sticker. */
  color?: StickerColor;
}

/**
 * Shared empty state for pages that are not built yet: big heading,
 * tilted sticker, one bordered card.
 */
export function PagePlaceholder({ title, description, color = 'yellow' }: PagePlaceholderProps) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl uppercase leading-none sm:text-4xl">{title}</h1>
        <Sticker color={color} rotate={-3}>
          Coming soon
        </Sticker>
      </div>

      <BrutalCard color="white" padding="lg">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md border border-black bg-orange shadow-brutal-sm dark:border-white dark:shadow-brutal-sm-invert">
            <Construction aria-hidden="true" size={28} strokeWidth={2.5} className="text-ink" />
          </span>
          <div>
            <h2 className="mb-1 text-lg uppercase">Under construction</h2>
            <p className="font-body text-base leading-relaxed opacity-80">{description}</p>
          </div>
        </div>
      </BrutalCard>
    </div>
  );
}
