import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Save } from 'lucide-react';
import type { Note } from '../../types';
import { BrutalButton } from '../BrutalButton';
import { BrutalInput, BrutalTextarea } from '../BrutalInput';
import { BrutalModal } from '../BrutalModal';
import { ColorPicker } from '../categories/ColorPicker';

interface NoteFormModalProps {
  /** The note being edited — null keeps the dialog closed. */
  note: Note | null;
  onClose: () => void;
  onSave: (patch: { title: string; body: string; color: string }) => void;
}

/** Edit an existing sticky note: title, body and colour. */
export function NoteFormModal({ note, onClose, onSave }: NoteFormModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState('bg-yellow');

  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setBody(note.body);
    setColor(note.color);
  }, [note]);

  if (!note) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), body, color });
  };

  return (
    <BrutalModal open onClose={onClose} title="Edit note" className="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <BrutalInput
          id="note-title"
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={80}
          autoFocus
          required
        />

        <BrutalTextarea
          id="note-body"
          label="Note"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={6}
          placeholder="Write anything…"
        />

        <ColorPicker label="Paper colour" value={color} onChange={setColor} previewName={title} />

        <div className="flex justify-end gap-3 border-t border-black pt-4 dark:border-white">
          <BrutalButton variant="white" onClick={onClose}>
            Cancel
          </BrutalButton>
          <BrutalButton type="submit" variant="mint" disabled={!title.trim()}>
            <Save aria-hidden="true" size={18} strokeWidth={3} />
            Save note
          </BrutalButton>
        </div>
      </form>
    </BrutalModal>
  );
}
