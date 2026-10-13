import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CircleSlash, Palette, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';
import { useToast } from '../hooks/useToast';
import type { Category } from '../types';
import { cn } from '../utils/cn';
import { BrutalButton } from '../components/BrutalButton';
import { BrutalInput } from '../components/BrutalInput';
import { BrutalModal } from '../components/BrutalModal';
import { Sticker } from '../components/Sticker';
import { ColorPicker } from '../components/categories/ColorPicker';
import {
  DEFAULT_CATEGORY_COLOR,
  UNCATEGORIZED_LABEL,
  categoryColorLabel,
  displayCategoryName,
  findCategoryByName,
  nextCategoryColor,
} from '../utils/categories';

/**
 * Category management: create, rename, re-colour and delete. Deleting asks for
 * confirmation and moves the category's tasks to "Uncategorized".
 */
export default function CategoriesPage() {
  const categories = useAppStore((state) => state.categories);
  const tasks = useAppStore((state) => state.tasks);
  const addCategory = useAppStore((state) => state.addCategory);
  const updateCategory = useAppStore((state) => state.updateCategory);
  const deleteCategory = useAppStore((state) => state.deleteCategory);
  const toast = useToast();

  /* create */
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState(DEFAULT_CATEGORY_COLOR);

  /* rename / recolour */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(DEFAULT_CATEGORY_COLOR);

  /* delete confirmation */
  const [deleting, setDeleting] = useState<Category | null>(null);

  const { counts, uncategorized } = useMemo(() => {
    const map = new Map<string, number>();
    const known = new Set(categories.map((category) => category.id));
    let loose = 0;
    for (const task of tasks) {
      const id = task.categoryId;
      if (id && known.has(id)) map.set(id, (map.get(id) ?? 0) + 1);
      else loose += 1;
    }
    return { counts: map, uncategorized: loose };
  }, [tasks, categories]);

  const countFor = (id: string) => counts.get(id) ?? 0;

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const name = draftName.trim();
    if (!name) return;

    const existing = findCategoryByName(categories, name);
    if (existing) {
      toast(`“${existing.name}” already exists`, 'warning');
      return;
    }

    addCategory(name, draftColor);
    toast(`Created “${displayCategoryName(name)}”`, 'success');
    setDraftName('');
    // Offer the next colour in the palette for the next one.
    setDraftColor(nextCategoryColor(categories.length + 1));
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (category: Category, event: FormEvent) => {
    event.preventDefault();
    const name = editName.trim();
    if (!name) return;

    const clash = findCategoryByName(categories, name);
    if (clash && clash.id !== category.id) {
      toast(`“${clash.name}” already exists`, 'warning');
      return;
    }

    updateCategory(category.id, { name, color: editColor });
    setEditingId(null);
    toast(`Updated “${displayCategoryName(name)}”`, 'success');
  };

  const confirmDelete = () => {
    if (!deleting) return;

    const movedIds = deleteCategory(deleting.id);
    const noun = movedIds.length === 1 ? 'task' : 'tasks';
    toast(
      `Deleted “${deleting.name}” — ${movedIds.length} ${noun} moved to ${UNCATEGORIZED_LABEL}`,
      'warning',
      { type: 'delete-category', category: deleting, taskIds: movedIds }
    );
    setDeleting(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl uppercase leading-none sm:text-4xl">Categories</h1>
          <Sticker color="orange" rotate={-3}>
            {categories.length} defined
          </Sticker>
        </div>
        <p className="max-w-sm font-mono text-[10px] uppercase leading-snug tracking-wider opacity-70">
          Colour dots and chips across Tasks and Calendar update instantly.
        </p>
      </div>

      {/* Create */}
      <section
        aria-label="Create a category"
        className="rounded-md border bg-white p-4 shadow-brutal dark:bg-black dark:shadow-brutal-invert sm:p-5"
      >
        <h2 className="mb-3 flex items-center gap-2 text-xl uppercase leading-none">
          <span className="grid h-10 w-10 place-items-center rounded-md border bg-mint text-ink shadow-brutal-sm">
            <Plus aria-hidden="true" size={20} strokeWidth={3} />
          </span>
          New category
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <BrutalInput
            id="new-category-name"
            label="Name"
            placeholder="e.g. Study, Errands, Side project…"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            maxLength={40}
          />

          <ColorPicker
            label="Colour"
            value={draftColor}
            onChange={setDraftColor}
            previewName={draftName}
          />

          <div className="flex justify-end">
            <BrutalButton type="submit" variant="pink" disabled={!draftName.trim()}>
              <Plus aria-hidden="true" size={18} strokeWidth={3} />
              Create category
            </BrutalButton>
          </div>
        </form>
      </section>

      {/* Existing categories */}
      <section aria-label="Existing categories" className="space-y-3">
        <h2 className="text-xl uppercase leading-none">
          Your categories{' '}
          <span className="font-mono text-sm font-bold opacity-60">({categories.length})</span>
        </h2>

        {categories.length === 0 ? (
          <div className="rounded-md border border-dashed bg-white p-6 text-center dark:bg-black">
            <Palette aria-hidden="true" size={28} strokeWidth={2.5} className="mx-auto opacity-60" />
            <p className="mt-2 font-heading text-lg uppercase">No categories yet</p>
            <p className="mx-auto mt-1 max-w-sm font-body text-sm leading-relaxed opacity-70">
              Everything is currently {UNCATEGORIZED_LABEL}. Create one above to colour-code your
              tasks.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {categories.map((category) => {
              const count = countFor(category.id);
              const editing = editingId === category.id;

              return (
                <li
                  key={category.id}
                  className="rounded-md border bg-white p-3 shadow-brutal-sm dark:bg-black dark:shadow-brutal-sm-invert sm:p-4"
                >
                  {editing ? (
                    <form onSubmit={(event) => saveEdit(category, event)} className="space-y-4">
                      <BrutalInput
                        id={`edit-category-${category.id}`}
                        label="Rename"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        maxLength={40}
                        autoFocus
                      />

                      <ColorPicker
                        label="Colour"
                        value={editColor}
                        onChange={setEditColor}
                        previewName={editName}
                      />

                      <div className="flex flex-wrap justify-end gap-2">
                        <BrutalButton variant="white" onClick={cancelEdit}>
                          Cancel
                        </BrutalButton>
                        <BrutalButton type="submit" variant="mint" disabled={!editName.trim()}>
                          Save changes
                        </BrutalButton>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          'grid h-12 w-12 shrink-0 place-items-center rounded-md border border-black shadow-brutal-sm dark:border-white dark:shadow-brutal-sm-invert',
                          category.color
                        )}
                      >
                        <Tags aria-hidden="true" size={20} strokeWidth={3} className="text-ink" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-lg uppercase leading-tight">
                          {category.name}
                        </p>
                        <p className="font-mono text-[11px] font-bold uppercase tracking-wider opacity-70">
                          {count} {count === 1 ? 'task' : 'tasks'} ·{' '}
                          {categoryColorLabel(category.color)}
                        </p>
                        <p className="mt-1.5">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider',
                              category.color
                            )}
                          >
                            {category.name}
                          </span>
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <BrutalButton
                          size="icon"
                          variant="white"
                          aria-label={`Rename ${category.name}`}
                          title="Rename / recolour"
                          onClick={() => startEdit(category)}
                          className="!shadow-brutal-sm dark:!shadow-brutal-sm-invert"
                        >
                          <Pencil aria-hidden="true" size={18} strokeWidth={2.5} />
                        </BrutalButton>
                        <BrutalButton
                          size="icon"
                          variant="pink"
                          aria-label={`Delete ${category.name}`}
                          title="Delete"
                          onClick={() => setDeleting(category)}
                          className="!shadow-brutal-sm dark:!shadow-brutal-sm-invert"
                        >
                          <Trash2 aria-hidden="true" size={18} strokeWidth={2.5} />
                        </BrutalButton>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Uncategorized — the safe landing spot for orphaned tasks. */}
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-black bg-cream p-3 dark:border-white dark:bg-black sm:p-4">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-md border-2 border-dashed border-black dark:border-white"
          >
            <CircleSlash aria-hidden="true" size={20} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg uppercase leading-tight">{UNCATEGORIZED_LABEL}</p>
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider opacity-70">
              {uncategorized} {uncategorized === 1 ? 'task' : 'tasks'} · deleting a category moves
              its tasks here
            </p>
          </div>
        </div>
      </section>

      {/* Delete confirmation */}
      <BrutalModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete category"
        footer={
          <>
            <BrutalButton variant="white" onClick={() => setDeleting(null)}>
              Cancel
            </BrutalButton>
            <BrutalButton variant="pink" onClick={confirmDelete}>
              <Trash2 aria-hidden="true" size={18} strokeWidth={3} />
              Delete category
            </BrutalButton>
          </>
        }
      >
        {deleting ? (
          <div className="space-y-4">
            <p className="font-body text-base leading-relaxed">
              Delete{' '}
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider',
                  deleting.color
                )}
              >
                {deleting.name}
              </span>
              ?
            </p>

            <p className="rounded-md border bg-white p-3 font-body text-sm leading-relaxed dark:bg-black">
              {countFor(deleting.id) === 0
                ? `No tasks are using it right now. Nothing will be reassigned.`
                : `${countFor(deleting.id)} ${
                    countFor(deleting.id) === 1 ? 'task' : 'tasks'
                  } will be moved to ${UNCATEGORIZED_LABEL}. The tasks themselves are not deleted.`}
            </p>

            <p className="font-mono text-[10px] uppercase tracking-wider opacity-70">
              Changed your mind? Undo from the toast right after deleting.
            </p>
          </div>
        ) : null}
      </BrutalModal>
    </div>
  );
}
