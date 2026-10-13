import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { FormEvent } from 'react';
import type { Priority, Repeat, Subtask, Task } from '../../types';
import { useAppStore } from '../../store';
import { PRIORITY_META } from '../../utils/tasks';
import { createId } from '../../utils/id';
import { BrutalButton } from '../BrutalButton';
import { BrutalInput, BrutalSelect, BrutalTextarea } from '../BrutalInput';
import { BrutalModal } from '../BrutalModal';
import { cn } from '../../utils/cn';

interface TaskFormModalProps {
  open: boolean;
  /** Null = create mode. */
  task: Task | null;
  onClose: () => void;
}

interface FormState {
  title: string;
  description: string;
  date: string;
  time: string;
  priority: Priority;
  categoryId: string;
  repeat: Repeat;
  subtasks: Subtask[];
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const REPEATS: Array<{ value: Repeat; label: string }> = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function toFormState(task: Task | null): FormState {
  if (!task) {
    return {
      title: '',
      description: '',
      date: '',
      time: '',
      priority: 'medium',
      categoryId: '',
      repeat: 'none',
      subtasks: [],
    };
  }
  const due = task.dueAt ? new Date(task.dueAt) : null;
  return {
    title: task.title,
    description: task.description,
    date: due ? format(due, 'yyyy-MM-dd') : '',
    time: due ? format(due, 'HH:mm') : '',
    priority: task.priority,
    categoryId: task.categoryId ?? '',
    repeat: task.repeat,
    subtasks: task.subtasks.map((s) => ({ ...s })),
  };
}

/** Add/edit every task field: title, description, due date+time,
 *  priority stickers, category, subtasks and repeat. */
export function TaskFormModal({ open, task, onClose }: TaskFormModalProps) {
  const categories = useAppStore((state) => state.categories);
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);

  const [form, setForm] = useState<FormState>(() => toFormState(task));
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (open) {
      setForm(toFormState(task));
      setNewSubtask('');
    }
  }, [open, task]);

  const patch = (updates: Partial<FormState>) => setForm((f) => ({ ...f, ...updates }));

  const addSubtask = () => {
    const title = newSubtask.trim();
    if (!title) return;
    patch({ subtasks: [...form.subtasks, { id: createId('sub'), title, done: false }] });
    setNewSubtask('');
  };

  const buildDueAt = (): string | null => {
    if (!form.date) return null;
    const [year, month, day] = form.date.split('-').map(Number);
    const [hour, minute] = (form.time || '17:00').split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;

    const payload = {
      title,
      description: form.description.trim(),
      dueAt: buildDueAt(),
      priority: form.priority,
      categoryId: form.categoryId || null,
      repeat: form.repeat,
      subtasks: form.subtasks,
    };

    if (task) {
      updateTask(task.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  return (
    <BrutalModal
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <BrutalInput
          id="task-title"
          label="Title"
          value={form.title}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="What needs doing?"
          required
          autoFocus
        />

        <BrutalTextarea
          id="task-description"
          label="Description"
          value={form.description}
          onChange={(event) => patch({ description: event.target.value })}
          placeholder="Optional details…"
          rows={3}
        />

        {/* Due date + time */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BrutalInput
            id="task-date"
            type="date"
            label="Due date"
            value={form.date}
            onChange={(event) => patch({ date: event.target.value })}
            className="font-mono text-sm font-bold"
          />
          <BrutalInput
            id="task-time"
            type="time"
            label="Due time"
            value={form.time}
            onChange={(event) => patch({ time: event.target.value })}
            className="font-mono text-sm font-bold"
          />
        </div>

        {/* Priority stickers */}
        <fieldset>
          <legend className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider">
            Priority
          </legend>
          <div className="flex flex-wrap gap-3">
            {PRIORITIES.map((value) => {
              const meta = PRIORITY_META[value];
              const active = form.priority === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => patch({ priority: value })}
                  className={cn(
                    'inline-flex min-h-12 items-center rounded-md border px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-transform duration-100',
                    meta.color,
                    active
                      ? 'shadow-brutal-sm dark:shadow-brutal-sm-invert -translate-y-0.5'
                      : 'opacity-60 hover:opacity-100'
                  )}
                >
                  {meta.long}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BrutalSelect
            id="task-category"
            label="Category"
            value={form.categoryId}
            onChange={(event) => patch({ categoryId: event.target.value })}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </BrutalSelect>

          <BrutalSelect
            id="task-repeat"
            label="Repeat"
            value={form.repeat}
            onChange={(event) => patch({ repeat: event.target.value as Repeat })}
          >
            {REPEATS.map((repeat) => (
              <option key={repeat.value} value={repeat.value}>
                {repeat.label}
              </option>
            ))}
          </BrutalSelect>
        </div>

        {/* Subtasks */}
        <fieldset>
          <legend className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider">
            Subtasks
          </legend>
          {form.subtasks.length > 0 ? (
            <ul className="mb-2 space-y-2">
              {form.subtasks.map((sub) => (
                <li
                  key={sub.id}
                  className="flex items-center gap-2 rounded-md border bg-cream px-2 dark:bg-black"
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={sub.done}
                    aria-label={`Toggle ${sub.title}`}
                    onClick={() =>
                      patch({
                        subtasks: form.subtasks.map((s) =>
                          s.id === sub.id ? { ...s, done: !s.done } : s
                        ),
                      })
                    }
                    className={cn(
                      'grid h-6 w-6 shrink-0 place-items-center rounded-sm border-2 border-black dark:border-white',
                      sub.done && 'bg-mint'
                    )}
                  >
                    {sub.done ? (
                      <span className="font-mono text-[10px] font-bold leading-none text-ink">✓</span>
                    ) : null}
                  </button>
                  <span
                    className={cn(
                      'min-h-12 flex-1 truncate py-3 text-sm',
                      sub.done && 'line-through opacity-50'
                    )}
                  >
                    {sub.title}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove subtask ${sub.title}`}
                    onClick={() =>
                      patch({ subtasks: form.subtasks.filter((s) => s.id !== sub.id) })
                    }
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-md hover:bg-pink"
                  >
                    <Trash2 aria-hidden="true" size={16} strokeWidth={2.5} />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex gap-2">
            <BrutalInput
              value={newSubtask}
              onChange={(event) => setNewSubtask(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addSubtask();
                }
              }}
              placeholder="Add a subtask…"
              aria-label="New subtask"
            />
            <BrutalButton variant="blue" onClick={addSubtask} className="shrink-0">
              <Plus aria-hidden="true" size={18} strokeWidth={3} />
              Add
            </BrutalButton>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-black pt-4 dark:border-white">
          <BrutalButton variant="white" onClick={onClose}>
            Cancel
          </BrutalButton>
          <BrutalButton type="submit" variant="mint" disabled={!form.title.trim()}>
            {task ? 'Save changes' : 'Create task'}
          </BrutalButton>
        </div>
      </form>
    </BrutalModal>
  );
}
