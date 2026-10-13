# To-Do List — Neo-Brutalist Edition

A chunky, sticker-slapped to-do app built with **React + Vite + TypeScript + Tailwind CSS**.
Hard offset shadows, 3px black borders, zero blur, zero gradients.

## Libraries

| Library | Why |
| --- | --- |
| `zustand` (+ `persist`) | All app state in one store, persisted to `localStorage` |
| `date-fns` | Header date, calendar grids/ranges, dashboard stats, habit date helpers |
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

Everything in the sidebar is built — Tasks, Calendar, Dashboard, Categories,
Focus, Habits, Notes and Settings.

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

**Dashboard** (home) is fully built:

- Four chunky stat cards — **due today**, **overdue**, **done this week** and the
  **current streak** (with a 7-day strip) — each card drills into the matching
  Tasks / Habits view
- **Big progress bar** for today's completion: fat 4px-bordered bar, `%` sticker
  and a plain-language status line
- **Weekly bar chart of completed tasks, built from plain divs with thick
  borders** — no chart library, no SVG, no gradients; Monday→Sunday with today
  highlighted in blue
- **Next up** — the 5 soonest unfinished tasks, complete or edit them in place
- Red overdue alarm banner whenever something is past due

**Categories** (own page in the sidebar) is fully built:

- Create, **rename** and **delete** categories with a chunky six-swatch
  **colour picker** (48px swatches, live chip preview, bold checkmark)
- Deleting asks for confirmation and **reassigns that category's tasks to
  "Uncategorized"** — the tasks themselves are never deleted, and the move is
  undoable from the toast (`delete-category` undo payload)
- Colour dots and chips update instantly across Tasks, Calendar and Dashboard
- Duplicate names are refused; names are trimmed and capitalised

**Focus** is fully built — a Pomodoro timer that survives background tabs:

- **Timestamp-based timer** — remaining time is always `endsAt − Date.now()`, never a
  count of `setInterval` ticks, so switching tabs, locking the phone or throttling the
  timer can't make it drift; a jump forward still settles on the correct value
- **Big chunky `mm:ss` clock** in a thick-bordered block with a striped progress bar
- **Start / Pause / Resume / Reset** — pausing freezes the exact remainder, resuming
  continues from it, reset snaps back to the full phase
- **Configurable lengths** — focus and break minutes write straight to settings
  (clamped 1–180) with 15/25/45-minute presets and a "Classic 25/5" reset
- **Focus and Break tabs** — sessions roll Focus → Break on completion and Break →
  Focus after the break; breaks are not counted as focus sessions
- **Linked to a task** — pick a task from the dropdown and the finished session is
  logged against it; the banner names the task you worked on
- **Sound + banner when a session ends** — a short generated WebAudio arpeggio (no
  audio files) plus a colour-coded banner with "Start break" / "Back to focus"
  buttons, and confetti for finished focus sessions; the chime can be muted
- **Completed sessions counted per task** — a leaderboard of total minutes, session
  count and share of tracked focus
- The **tab title shows the live countdown** (`24:12 · Focus — To-Do List`) while
  running and is restored when you leave the page
- Screen readers get a labelled `role="timer"` region; the log survives a reload

**Habits** is fully built:

- **Daily habits with a 7-day check grid** — tap a day cell (48px, `role="checkbox"`
  with a full date label) to check in or out; today is ringed in blue
- **Streak counter** — current streak in days, plus the best-ever run and a
  `n/7 this week · N total` summary; a streak survives until you miss a whole day
- **Add / edit / delete** — a composer with a colour picker, inline editing of name
  and colour, and a delete confirmation with an **undo** toast
- **Seeds 2 sample habits** ("Drink 2L water" with a live 3-day streak, "Read 20 pages")

**Notes** is fully built:

- **Sticky-note cards in six colours** — the composer picks the paper colour, and the
  cards keep the tilted, taped-down sticky look
- **Pin, edit and delete** — pinned notes float to the top with a Pinned sticker,
  a modal edits title/body/colour, and deleting asks for confirmation and offers
  **undo**
- **Masonry-style layout** — CSS multi-column flow (1 → 2 → 3 columns) with
  `break-inside-avoid` cards so notes tile instead of forming rows
- Notes are ordered pinned first, then most recently updated

**Settings** is fully built:

- **Dark mode** — Light/Dark toggles wired to the same theme hook as the header
  button; the choice is persisted with everything else
- **Export all data as JSON** — downloads a dated
  `to-do-list-backup-YYYY-MM-DD.json` envelope containing tasks, categories, habits,
  notes, focus sessions and settings
- **Import JSON** — accepts the backup envelope or a raw state dump, validates it,
  reports what it restored, and refuses bad JSON, empty files and unrelated JSON with
  plain-language errors (existing data untouched)
- **Reset data with confirmation** — a modal spells out exactly what will be lost
  ("1 notes and 3 focus sessions…"), then restores the seeded samples and keeps your
  current theme
- **Your data panel** — live counts and an estimated size for every collection

## Folders

```
src/
  components/  # design system + app shell + tasks/ calendar/ dashboard/ categories/
               # habits/ notes/
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
