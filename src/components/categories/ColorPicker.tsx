import { Check } from 'lucide-react';
import { CATEGORY_COLORS } from '../../utils/categories';
import { cn } from '../../utils/cn';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** Fieldset legend text. */
  label?: string;
  /** When set, a live chip preview is rendered under the swatches. */
  previewName?: string;
}

/**
 * Chunky colour picker: six 48px swatches with thick borders, the selected one
 * lifting off the page with a hard shadow and a bold checkmark.
 */
export function ColorPicker({
  value,
  onChange,
  label = 'Colour',
  previewName,
}: ColorPickerProps) {
  return (
    <fieldset>
      <legend className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider">
        {label}
      </legend>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_COLORS.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              aria-label={`${option.label}${active ? ' (selected)' : ''}`}
              title={option.label}
              onClick={() => onChange(option.value)}
              className={cn(
                'grid h-12 w-12 place-items-center rounded-md text-ink transition-transform duration-100',
                option.value,
                active
                  ? '-translate-y-0.5 border-4 border-black shadow-brutal-sm dark:border-white dark:shadow-brutal-sm-invert'
                  : 'border-2 border-black opacity-70 hoverable:opacity-100 dark:border-white'
              )}
            >
              {active ? <Check aria-hidden="true" size={22} strokeWidth={4} /> : null}
            </button>
          );
        })}
      </div>

      {previewName !== undefined ? (
        <p className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">Preview</span>
          <span
            className={cn(
              'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider',
              value
            )}
          >
            {previewName.trim() || 'Category'}
          </span>
        </p>
      ) : null}
    </fieldset>
  );
}
