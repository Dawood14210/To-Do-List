import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { NotebookPen, Pin, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { useToast } from '../hooks/useToast';
import type { Note } from '../types';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalInput, BrutalTextarea } from '../components/BrutalInput';
import { BrutalModal } from '../components/BrutalModal';
import { Sticker } from '../components/Sticker';
import { ColorPicker } from '../components/categories/ColorPicker';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteFormModal } from '../components/notes/NoteFormModal';

/**
 * Sticky notes in a CSS masonry layout (multi-column, `break-inside-avoid`).
 * Pinned notes float to the top; colour, pin state and text are all editable.
 */
export default function NotesPage() {
  const notes = useAppStore((state) => state.notes);
  const addNote = useAppStore((state) => state.addNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const toggleNotePin = useAppStore((state) => state.toggleNotePin);
  const deleteNote = useAppStore((state) => state.deleteNote);
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState('bg-yellow');
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);

  const sorted = useMemo(
    () =>
      [...notes].sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          b.updatedAt.localeCompare(a.updatedAt) ||
          b.createdAt.localeCompare(a.createdAt)
      ),
    [notes]
  );

  const pinnedCount = notes.filter((note) => note.pinned).length;

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    addNote({ title: title.trim(), body: body.trim(), color });
    toast(`Note “${title.trim()}” added`, 'success');
    setTitle('');
    setBody('');
    setColor('bg-yellow');
  };

  const handlePin = (note: Note) => {
    toggleNotePin(note.id);
    toast(note.pinned ? `Unpinned “${note.title}”` : `Pinned “${note.title}” to the top`, 'info');
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const snapshot = deleting;
    deleteNote(snapshot.id);
    toast(`Deleted “${snapshot.title}”`, 'warning', { type: 'delete-note', note: snapshot });
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl uppercase leading-none sm:text-4xl">Notes</h1>
          <Sticker color="cream" rotate={-3}>
            {notes.length} notes
          </Sticker>
        </div>
        <Sticker color="pink" rotate={2} small>
          <Pin aria-hidden="true" size={12} strokeWidth={3} />
          {pinnedCount} pinned
        </Sticker>
      </div>

      {/* Composer */}
      <section
        aria-label="Write a note"
        className="rounded-md border bg-white p-4 text-ink shadow-brutal dark:bg-black dark:text-white dark:shadow-brutal-invert sm:p-5"
      >
        <h2 className="mb-3 flex items-center gap-2 text-xl uppercase leading-none">
          <span className="grid h-10 w-10 place-items-center rounded-md border bg-yellow text-ink shadow-brutal-sm">
            <NotebookPen aria-hidden="true" size={20} strokeWidth={3} />
          </span>
          New note
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <BrutalInput
            id="new-note-title"
            label="Title"
            placeholder="Sprint ideas, shopping list, a good quote…"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
          />

          <BrutalTextarea
            id="new-note-body"
            label="Note"
            rows={3}
            placeholder="Anything worth keeping…"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />

          <ColorPicker label="Paper colour" value={color} onChange={setColor} previewName={title} />

          <div className="flex justify-end">
            <BrutalButton type="submit" variant="pink" disabled={!title.trim()}>
              <Plus aria-hidden="true" size={18} strokeWidth={3} />
              Stick it on the wall
            </BrutalButton>
          </div>
        </form>
      </section>

      {/* Masonry board */}
      {sorted.length === 0 ? (
        <div className="rounded-md border border-dashed bg-white p-8 text-center dark:bg-black">
          <p className="font-heading text-2xl uppercase">The wall is empty</p>
          <p className="mx-auto mt-2 max-w-sm font-body text-sm leading-relaxed opacity-70">
            Write your first note above — it lands here as a sticky card you can pin, recolour and
            edit.
          </p>
        </div>
      ) : (
        <section aria-label="Your notes">
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">{sorted.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onTogglePin={handlePin}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
            ))}
          </div>
        </section>
      )}

      {/* Edit modal */}
      <NoteFormModal
        note={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => {
          if (!editing) return;
          updateNote(editing.id, patch);
          toast(`Updated “${patch.title}”`, 'success');
          setEditing(null);
        }}
      />

      {/* Delete confirmation */}
      <BrutalModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete note"
        footer={
          <>
            <BrutalButton variant="white" onClick={() => setDeleting(null)}>
              Cancel
            </BrutalButton>
            <BrutalButton variant="pink" onClick={confirmDelete}>
              Delete note
            </BrutalButton>
          </>
        }
      >
        {deleting ? (
          <div className="space-y-3">
            <p className="font-body text-base leading-relaxed">
              Delete <span className="font-bold">“{deleting.title}”</span>?
            </p>
            <p className="rounded-md border bg-white p-3 font-body text-sm leading-relaxed dark:bg-black">
              The note is removed from the wall, but you can bring it back with the Undo button on
              the toast.
            </p>
          </div>
        ) : null}
      </BrutalModal>
    </div>
  );
}
