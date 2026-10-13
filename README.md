# To-Do List — Neo-Brutalist Edition

A chunky, sticker-slapped to-do app built with **React + Vite + TypeScript + Tailwind CSS**.
Hard offset shadows, 3px black borders, zero blur, zero gradients.

## Libraries

| Library | Why |
| --- | --- |
| `zustand` (+ `persist`) | All app state in one store, persisted to `localStorage` |
| `date-fns` | Header date, calendar/habit date helpers |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Drag-and-drop task reordering (`reorderTasks` is ready) |
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

## Pages (placeholders for now)

Dashboard · Tasks · Calendar · Focus · Habits · Notes · Settings

## Folders

```
src/
  components/  # design system + app shell
  pages/       # route pages (placeholders)
  store/       # zustand persist store (localStorage)
  hooks/       # useTheme, useToast, useMediaQuery
  utils/       # cn, dates, confetti, nav, id
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
