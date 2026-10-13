import { useNavigate } from 'react-router-dom';
import { CheckSquare, ListFilter, Plus, Search, Square, Tags, X } from 'lucide-react';
import { useAppStore } from '../../store';
import type { PriorityFilter, SortKey, StatusFilter } from '../../types';
import { BrutalButton } from '../BrutalButton';
import { BrutalInput, BrutalSelect } from '../BrutalInput';

interface TaskToolbarProps {
  onNewTask: () => void;
}

/**
 * Search + status/priority/category/date-range filters + sort,
 * plus select-mode and new-task controls.
 */
export function TaskToolbar({ onNewTask }: TaskToolbarProps) {
  const navigate = useNavigate();
  const view = useAppStore((state) => state.taskView);
  const setTaskView = useAppStore((state) => state.setTaskView);
  const categories = useAppStore((state) => state.categories);

  const filtersActive =
    view.search !== '' ||
    view.status !== 'all' ||
    view.priority !== 'all' ||
    view.category !== 'all' ||
    view.dueFrom !== '' ||
    view.dueTo !== '';

  return (
    <section aria-label="Search and filter tasks" className="space-y-3">
      {/* Row 1 — search + primary actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            size={18}
            strokeWidth={3}
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 opacity-60"
          />
          <BrutalInput
            type="search"
            aria-label="Search tasks"
            placeholder="Search title, notes, subtasks…"
            value={view.search}
            onChange={(event) => setTaskView({ search: event.target.value })}
            className="!pl-10"
          />
        </div>

        <div className="flex gap-2">
          <BrutalButton
            variant={view.selectMode ? 'yellow' : 'white'}
            onClick={() =>
              setTaskView({ selectMode: !view.selectMode, selected: [] })
            }
            aria-pressed={view.selectMode}
          >
            {view.selectMode ? (
              <X aria-hidden="true" size={18} strokeWidth={3} />
            ) : (
              <CheckSquare aria-hidden="true" size={18} strokeWidth={3} />
            )}
            {view.selectMode ? 'Done' : 'Select'}
          </BrutalButton>
          <BrutalButton
            variant="white"
            size="icon"
            aria-label="Manage categories"
            title="Manage categories"
            onClick={() => navigate('/categories')}
          >
            <Tags aria-hidden="true" size={20} strokeWidth={2.5} />
          </BrutalButton>
          <BrutalButton variant="pink" onClick={onNewTask}>
            <Plus aria-hidden="true" size={18} strokeWidth={3} />
            New
          </BrutalButton>
        </div>
      </div>

      {/* Row 2 — filters + sort */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <BrutalSelect
          aria-label="Filter by status"
          value={view.status}
          onChange={(event) => setTaskView({ status: event.target.value as StatusFilter })}
        >
          <option value="all">Status: all</option>
          <option value="active">Active</option>
          <option value="done">Done</option>
          <option value="overdue">Overdue</option>
        </BrutalSelect>

        <BrutalSelect
          aria-label="Filter by priority"
          value={view.priority}
          onChange={(event) => setTaskView({ priority: event.target.value as PriorityFilter })}
        >
          <option value="all">Priority: all</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </BrutalSelect>

        <BrutalSelect
          aria-label="Filter by category"
          value={view.category}
          onChange={(event) => setTaskView({ category: event.target.value })}
        >
          <option value="all">Category: all</option>
          <option value="">Uncategorized</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </BrutalSelect>

        <BrutalInput
          type="date"
          aria-label="Due from"
          title="Due from"
          value={view.dueFrom}
          onChange={(event) => setTaskView({ dueFrom: event.target.value })}
          className="font-mono text-xs font-bold"
        />
        <BrutalInput
          type="date"
          aria-label="Due to"
          title="Due to"
          value={view.dueTo}
          onChange={(event) => setTaskView({ dueTo: event.target.value })}
          className="font-mono text-xs font-bold"
        />

        <BrutalSelect
          aria-label="Sort tasks"
          value={view.sort}
          onChange={(event) => setTaskView({ sort: event.target.value as SortKey })}
        >
          <option value="manual">Sort: manual</option>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
          <option value="created">Created</option>
        </BrutalSelect>
      </div>

      {filtersActive ? (
        <div className="flex items-center gap-2">
          <ListFilter aria-hidden="true" size={14} strokeWidth={3} className="opacity-60" />
          <span className="font-mono text-[11px] uppercase tracking-wider opacity-60">
            Filters on
          </span>
          <BrutalButton
            size="sm"
            variant="white"
            onClick={() =>
              setTaskView({
                search: '',
                status: 'all',
                priority: 'all',
                category: 'all',
                dueFrom: '',
                dueTo: '',
              })
            }
          >
            <Square aria-hidden="true" size={12} strokeWidth={3} />
            Clear
          </BrutalButton>
        </div>
      ) : null}
    </section>
  );
}
