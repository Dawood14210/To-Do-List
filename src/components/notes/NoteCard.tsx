import { formatDistanceToNowStrict } from 'date-fns';
import { Pencil, Pin, PinOff, Trash2 } from 'lucide-react';
import type { Note } from '../../types';
import { cn } from '../../utils/cn';
import { BrutalButton } from '../BrutalButton';
import { Sticker } from '../Sticker';

interface NoteCardProps {
  note: Note;
  onTogglePin: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

/**
 * One sticky note: coloured card, thick border, hard shadow. Pinned notes get
 * a tilt, a heavier shadow and a PINNED sticker. Sits in a CSS masonry column.
 */
export function NoteCard({ note, onTogglePin, onEdit, onDelete }: NoteCardProps) {
  const updated = formatDistanceToNowStrict(new Date(note.updatedAt), { addSuffix: true });

  return (
    <article
      className={cn(
        'mb-4 break-inside-avoid rounded-md border text-ink',
        'transition-transform duration-100',
        note.color,
        note.pinned
          ? '-rotate-1 border-4 shadow-brutal'
          : 'rotate-0 border-black shadow-brutal-sm dark:border-white dark:shadow-brutal-sm-invert'
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-black/30 p-3 dark:border-white/30">
        <h3 className="min-w-0 flex-1 break-words pt-1 text-lg uppercase leading-tight">
          {note.title}
        </h3>

        <button
          type="button"
          onClick={() => onTogglePin(note)}
          aria-pressed={note.pinned}
          aria-label={note.pinned ? `Unpin ${note.title}` : `Pin ${note.title}`}
          title={note.pinned ? 'Unpin' : 'Pin to the top'}
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-md border transition-colors duration-100',
            note.pinned
              ? 'border-black bg-ink text-white dark:border-white'
              : 'border-transparent hover:border-black hover:bg-white/50 dark:hover:border-white'
          )}
        >
          {note.pinned ? (
            <PinOff aria-hidden="true" size={18} strokeWidth={2.5} />
          ) : (
            <Pin aria-hidden="true" size={18} strokeWidth={2.5} />
          )}
        </button>
      </header>

      {note.pinned ? (
        <p className="px-3 pt-2">
          <Sticker color="ink" rotate={-2} small>
            Pinned
          </Sticker>
        </p>
      ) : null}

      {note.body ? (
        <p className="whitespace-pre-wrap break-words p-3 font-body text-sm leading-relaxed">
          {note.body}
        </p>
      ) : (
        <p className="p-3 font-mono text-[11px] uppercase tracking-wider opacity-50">
          No details — just a title
        </p>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-black/30 p-2 pl-3 dark:border-white/30">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider opacity-70">
          Updated {updated}
        </span>

        <span className="flex gap-2">
          <BrutalButton
            size="icon"
            variant="white"
            aria-label={`Edit ${note.title}`}
            title="Edit note"
            onClick={() => onEdit(note)}
            className="!shadow-brutal-sm dark:!shadow-brutal-sm-invert"
          >
            <Pencil aria-hidden="true" size={18} strokeWidth={2.5} />
          </BrutalButton>
          <BrutalButton
            size="icon"
            variant="pink"
            aria-label={`Delete ${note.title}`}
            title="Delete note"
            onClick={() => onDelete(note)}
            className="!shadow-brutal-sm dark:!shadow-brutal-sm-invert"
          >
            <Trash2 aria-hidden="true" size={18} strokeWidth={2.5} />
          </BrutalButton>
        </span>
      </footer>
    </article>
  );
}
