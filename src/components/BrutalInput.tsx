import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

const FIELD_CLASSES =
  'w-full min-h-12 rounded-md border bg-white text-ink shadow-brutal-sm dark:bg-black dark:text-white dark:shadow-brutal-sm-invert ' +
  'px-4 py-3 font-body text-base placeholder:text-ink/40 dark:placeholder:text-white/40';

interface FieldShellProps {
  label?: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}

function FieldShell({ label, hint, htmlFor, children }: FieldShellProps) {
  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={htmlFor}
          className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider"
        >
          {label}
        </label>
      ) : null}
      {children}
      {hint ? (
        <p className="mt-2 font-mono text-xs uppercase tracking-wide opacity-70">{hint}</p>
      ) : null}
    </div>
  );
}

interface BrutalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

/** Text input with optional system label + 3px border + hard small shadow. */
export const BrutalInput = forwardRef<HTMLInputElement, BrutalInputProps>(
  function BrutalInput({ label, hint, id, className, ...rest }, ref) {
    return (
      <FieldShell label={label} hint={hint} htmlFor={id}>
        <input
          ref={ref}
          id={id}
          className={cn(FIELD_CLASSES, className)}
          {...rest}
        />
      </FieldShell>
    );
  }
);

interface BrutalTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

/** Multiline sibling of BrutalInput. */
export const BrutalTextarea = forwardRef<HTMLTextAreaElement, BrutalTextareaProps>(
  function BrutalTextarea({ label, hint, id, className, rows = 4, ...rest }, ref) {
    return (
      <FieldShell label={label} hint={hint} htmlFor={id}>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={cn(FIELD_CLASSES, 'resize-y leading-relaxed', className)}
          {...rest}
        />
      </FieldShell>
    );
  }
);
