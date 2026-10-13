# To-Do List — Neo-Brutalist Edition

A chunky, sticker-slapped to-do app built with **React + Vite + TypeScript + Tailwind CSS**.
Hard offset shadows, 3px black borders, zero blur, zero gradients.

## Libraries

| Library | Why |
| --- | --- |
| `zustand` (+ `persist`) | All app state in one store, persisted to `localStorage` |
| `date-fns` | Header date, calendar grids/ranges, habit date helpers |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Task reordering, plus dragging tasks onto calendar days |
| `lucide-react` | Big chunky nav/UI icons |
| `canvas-confetti` | Celebrations (welcome burst, theme toggle) |
| `react-router-dom` | Page routing |

## Design system (see `tailwind.config.js`)

- **Colors:** cream `#FFF4E0`, yellow `#FFD84D`, pink `#FF6B9D`, blue `#4D9CFF`, mint `#7CFFB2`, orange `#FF9F43`, ink `#000`
- **Borders:** 3px solid, black by default (`borderColor.DEFAULT`)
- **Shadows:** `shadow-brutal` = `5px 5px 0 #000`, `shadow-brutal-sm` = `3px 3px 0 #000` — zero blur
- **Fonts:** Archivo Black (headings), Space Grotesk (body), Space Mono (dates/labels)
- **Radius:** clamped to max 6px; no gradients, no blur, no soft shadows
- **Buttons:** lift `-2px` on hover, slam to `translate(4px, 4px)` + `shadow: 0` on active
- **Dark mode:** black background, neon accents, white borders/shadows — toggle in the header
- **Focus:** thick 3px visible outlines everywhere (`:focus-visible`)

## Components

`BrutalButton` · `BrutalCard` · `BrutalInput` · `BrutalModal` · `Sticker` · `Toast`
plus the shell: `Layout` / `Header` / `Sidebar` / `BottomNav`.

## Layout

- **Desktop:** left sidebar with chunky nav blocks
- **Mobile:** bottom tab bar with big icons (≥48px tap targets, scrollable on tiny screens)
- **Header:** app name in a yellow block with a thick border + today's date in mono

## Pages

Still placeholders: Dashboard · Focus · Habits · Notes · Settings

**Tasks** is fully built:

- **Quick-add with natural language** — `"Submit report tomorrow 5pm !high #study"`
  parses dates (today/tomorrow/weekdays/`next monday`), times (`5pm`, `17:30`, `noon`),
  `!priority` and `#category`, with a live parse preview
- **Full task model** — title, description, due date + time, priority stickers
  (Low/Med/High), category, subtasks with progress bar, repeat
  (none/daily/weekly/monthly), createdAt, completedAt
- Add / edit (modal) / delete / complete — bold checkmark, animated strike-through
- Drag-and-drop reordering (`@dnd-kit`), keyboard accessible, manual sort mode
- Search + filters (status, priority, category, due date range) + sort (manual, due,
  priority, created)
- Undo toasts after delete or complete (single and bulk)
- Bulk select mode: select all/none, bulk complete, bulk delete
- Red **OVERDUE** stamp on late tasks
- Completing a recurring task spawns the next occurrence (undo removes it)
- Confetti when a high-priority task is completed
- Funny empty state: CSS shapes + "NOTHING TO DO. SUSPICIOUS."
- Seeds 5 sample tasks + Study/Personal/Health categories on first load

**Calendar** is fully built:

- **Month · Week · Agenda views** — chunky bordered grid (padded to whole weeks,
  `date-fns` intervals), mini task labels on desktop, colour dots by category on
  mobile, plus a per-category legend
- **Today gets a thick brand-blue border** (day cell, week column and agenda day
  header) with a TODAY badge
- Tap a day to open the **day panel** — right side rail on desktop, bottom sheet on
  mobile — listing that day's tasks with an **add-task button pre-filled with the
  date**, prev/next day arrows and complete/edit actions
- **Drag a task onto another day to reschedule it** (`@dnd-kit` droppable day cells,
  drag handle in the panel); the drag overlay shows a tilted chip of the task
- **On touch devices: "Move to date"** — a chunky dialog with Today/Tomorrow/Next
  week presets or any date; the time of day is always kept
- **Overdue tasks are red with a warning label** — ⚠ chip, ⚠ badge on the day,
  full "⚠ OVERDUE" stamp in the panel and a dedicated overdue block in the agenda
- **Previous / next buttons + a Today button**, and **swipe left/right** to page
  months, weeks and 7-day agenda windows on touch devices
- Rescheduling is undoable from the toast (new `move-task` undo payload)

## Folders

```
src/
  components/  # design system + app shell + tasks/ + calendar/ widgets
  pages/       # route pages
  store/       # zustand persist store (localStorage)
  hooks/       # useTheme, useToast, useMediaQuery, useTasks
  utils/       # cn, dates, calendar, tasks, confetti, nav, id
  types/       # shared TypeScript types
```

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Accessibility

Skip link, labelled icon buttons, `aria-current` nav states, `aria-live` toast region,
modal with `role="dialog"` + ESC/backdrop close + scroll lock, and a 48px minimum
tap target on every interactive element.
