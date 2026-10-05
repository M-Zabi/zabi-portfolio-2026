# Fashionova — Design Contract

This is the source of truth for how the app looks and behaves. Tokens live in
`src/app/globals.css`; this file explains what they mean and when to reach for
them. If a screen disagrees with this document, the screen is wrong.

The look is **enterprise software, tuned for tablet first**: white app-shell
surfaces floating on a neutral canvas, hairline borders, one orange accent,
dense data, almost no shadow.

---

## 1. Foundations

### Colour

Everything is authored in `oklch` so light and dark stay perceptually matched.
Never hardcode a hex in a component — use the semantic token.

| Token | Light | Role |
|---|---|---|
| `--background` | `oklch(0.97 0 0)` | The **canvas**. Every page sits on this. |
| `--card` / `--popover` | `oklch(1 0 0)` | **Surfaces**. Pure white, always bordered. |
| `--foreground` | `oklch(0.16 0 0)` | Body text |
| `--muted-foreground` | `oklch(0.52 0 0)` | Labels, table headers, secondary text |
| `--primary` | `oklch(0.68 0.19 41)` | **The orange accent** |
| `--border` / `--input` | `oklch(0.918 0 0)` | Hairlines |
| `--ring` | accent | Focus rings — never anything else |
| `--success` / `--warning` / `--info` / `--destructive` | — | Status semantics only |

**The canvas/surface contrast is the entire look.** A white card on a white page
reads as nothing. Never put a `surface` on a `--card` background; nest with
spacing and hairlines instead.

**The accent is scarce.** Orange is allowed on exactly: primary buttons, the
active tab underline, the active sidebar item, chart series 1, selected
checkboxes/radios, and focus rings. Everywhere else is neutral. If a screen has
more than one orange thing competing for attention, one of them is wrong.

### Type

The stack is `BrownStd, Instrument Sans, ui-sans-serif`. BrownStd is licensed and
not in the repo — drop the two `.woff2` files into `public/fonts/` and it takes
over automatically (see `src/lib/fonts.ts`). Until then everything renders in
Instrument Sans with no build error.

| Role | Spec | Helper |
|---|---|---|
| Page title | 20 / 600 / `-0.01em` | `.page-title` |
| Section title | 15 / 600 | `.section-title` |
| Body | 14 / 400 | `text-sm` |
| Table header | **11 / 500 / uppercase / `0.06em` / muted** | `.table-head` |
| KPI value | 28 / 600 / `-0.02em` / tabular | `.kpi-value` |
| Caption, meta | 12 / 400 / muted | `text-xs text-muted-foreground` |

All numerals in tables, money and KPIs use `tabular-nums` — apply `.tabular` or
`data-numeric` so columns align down the page.

### Radii, borders, elevation

- `--radius: 0.625rem`. Surfaces `rounded-xl`, buttons/inputs `rounded-md`
  (`0.5rem`), badges `rounded-sm` (`0.375rem`), the bulk bar `rounded-full`.
- **One hairline border, no shadow.** Elevation is reserved for things that
  genuinely float above the page: popovers, dropdowns, dialogs, the bulk-action
  bar, and the mobile sheet. Everything else earns its edge from `border`.

### Density

| Token | Value | Use |
|---|---|---|
| `--spacing-row` | 56px | Data-table row, desktop |
| `--spacing-row-touch` | 64px | Data-table row, touch |
| `--spacing-cell` | 16px | Table cell padding |
| `--spacing-nav-item` | 36px | Sidebar item height |
| `--spacing-tap` | 44px | Minimum touch target |

Page gutters: 16px mobile, 24px tablet, 32px desktop. Vertical rhythm between
sections is 24px; inside a surface it is 16px.

---

## 2. Components

### Layout shells

Two shells, both `SidebarProvider`-free on the consumer side:

- **Admin** — grouped `collapsible="icon"` sidebar + topbar with breadcrumbs.
  The server layout reads the `sidebar_state` cookie for `defaultOpen`, so a
  collapsed rail survives a hard refresh with no flash.
- **Shop / account** — sticky header, cart drawer, footer; account pages get a
  secondary nav rail that collapses to a horizontal scroller on mobile.

Page body is always `mx-auto w-full max-w-[1400px]` with the gutters above.

### Sidebar

- Items are 36px, `rounded-md`, icon + label, 8px gap.
- Active item: `bg-sidebar-accent` + orange left marker + `font-medium`. Not a
  filled orange pill — that is too loud at this density.
- Groups get an 11px uppercase muted label, hidden in icon mode.
- Icon mode keeps tooltips on every item. Collapsing is a `SidebarTrigger` in
  the topbar, mirrored by `Cmd/Ctrl+B`.

### Buttons

`default` is orange with white text. `outline` is white with a hairline —
that is the workhorse for toolbars. `ghost` for icon-only actions. `destructive`
only for genuinely destructive confirmations, never for "cancel".

Heights: `sm` 32, `default` 36, `lg` 40; icon buttons are square at the same
height and get `min-h-[--spacing-tap]` on touch. Every button that fires a
mutation shows an `isPending` state with a spinning `Loader2Icon` and keeps its
label — never collapse to a bare spinner, the width jump is worse than the wait.

### Inputs and form fields

Inputs are 36px, `rounded-md`, hairline border, white fill, orange ring on
focus. Labels sit above at 13/500. Descriptions are 12px muted below the
control; errors replace the description in `--destructive` and set
`aria-invalid`.

Forms are declarative — never hand-wire `FormField` in a page. Use the field
primitives in `src/components/form/`, each of which takes `control` and `name`:

`TextField`, `TextareaField`, `SelectField`, `ComboboxField`, `MultiSelectField`,
`NumberField`, `PriceField`, `SwitchField`, `CheckboxGroupField`,
`RadioCardsField`, `DateField`, `ImageUploadField`, `TagsField`.

Zod schemas live in `src/lib/validators/` and are shared verbatim by the client
form and the tRPC procedure, so validation cannot drift between them.

### Tables

Built on TanStack Table with server-side sort/filter/paginate through tRPC.
State is synced to the URL, so any filtered view is a shareable link.

- Header row: `.table-head`, sticky, hairline underneath.
- Rows: 56px desktop / 64px touch, hairline between, hover tint only under
  `@media (hover: hover)`.
- First column is the checkbox when the table supports bulk actions; last column
  is a right-aligned `MoreHorizontalIcon` row menu.
- Money and counts are right-aligned and tabular. Dates are `MMM d, yyyy`;
  anything under 24h old renders as relative time.
- Toolbar: global search on the left, faceted filters beside it, view options
  and column visibility on the right.
- **Mobile renders `DataTableCardList`** — the same row model, a different
  renderer. Do not shrink the table; a 4-column table at 375px is unreadable.
- Loading is `DataTableSkeleton` with the real column widths — never a spinner.
- Empty state is designed: icon, one line of explanation, and the primary action
  that would create the first row. A filtered-empty state instead offers "clear
  filters".

### Bulk-action bar

Selecting rows springs in a dark `rounded-full` pill, bottom-centred, with the
selection count, the actions, and a dismiss. It is the one place with a real
shadow. On mobile it becomes a full-width bottom sheet with 44px targets.
Motion: `y: 16 -> 0`, `opacity 0 -> 1`, spring, ~220ms.

### Tabs, dropdowns, sheets, drawers, dialogs

- Tabs are underlined, not filled: 2px orange underline on the active tab,
  muted label otherwise. They scroll horizontally on mobile rather than wrap.
- Dropdowns and popovers: white, hairline, `rounded-lg`, small shadow, 4px
  padding, 32px items.
- `Sheet` is the mobile sidebar and any right-hand detail panel. `Drawer` (vaul)
  is the mobile filter surface and the cart on small screens.
- Dialogs are for decisions, not for forms longer than ~4 fields — anything
  bigger becomes a page or a sheet.

### Badges

Outlined pill, 11px uppercase, semantic border and text, **no fill**. A filled
badge at this density looks like a button.

| Domain | Mapping |
|---|---|
| Order | `PENDING` muted · `PAID` info · `FULFILLED` success · `CANCELLED`/`REFUNDED` destructive |
| Product | `DRAFT` muted · `ACTIVE` success · `ARCHIVED` muted |
| Review | `PENDING` warning · `APPROVED` success · `REJECTED` destructive |
| Invoice | `DRAFT` muted · `ISSUED` info · `PAID` success · `OVERDUE` destructive |
| Stock | in stock success · low warning · out destructive |

### Charts

All charts wrap the shadcn `ChartContainer` and live in
`src/components/charts/`: `AreaTrendChart`, `BarBreakdownChart`,
`DonutSplitChart`, `Sparkline`.

- Series 1 is always the accent; series 2–5 step away in hue and chroma so a
  five-series chart still reads in greyscale.
- Grid is horizontal-only hairlines. No axis lines, no ticks, no legend when
  there is a single series.
- Area charts get a gradient fill from 18% to 0% of the series colour.
- They animate on mount **and on data change** (~500ms, `--ease-out-quint`), and
  not at all under `prefers-reduced-motion`.
- Tooltips are cursor-following, hairline-bordered, tabular numerals.

### KPI strip

Label (11px uppercase muted) / value (`.kpi-value`) + delta chip / inline
sparkline, cells divided by vertical hairlines inside one surface. Delta chips
are 11px with an arrow — success when up, destructive when down, muted at zero.
Direction is never colour-only; the arrow carries the meaning too.

### Empty, loading, error

- **Loading:** every route has a `loading.tsx` with a purpose-built skeleton
  matching the real layout — table, card grid, chart, or form. No spinners on
  initial paint.
- **Empty:** icon, headline, one sentence, primary action.
- **Error:** every list surface has an `error.tsx` with a plain explanation and
  a retry that calls `reset()`.

---

## 3. Motion

`motion` (motion.dev) via `motion/react`. Motion explains a change of state; it
never decorates.

| Move | Spec |
|---|---|
| Enter / exit | 180ms, `--ease-out-quint` |
| Layout shift | 220ms spring |
| Bulk bar, sheets | spring, `--ease-spring`, ~220ms |
| Chart draw | 500ms, `--ease-out-quint` |
| Hover | 120ms, gated behind `@media (hover: hover)` |

Nothing animates longer than 500ms. Everything collapses to ~0 under
`prefers-reduced-motion` — enforced globally at the bottom of `globals.css`.

---

## 4. Responsive contract

Tablet first. Breakpoints are Tailwind defaults; `sm` = 640, `md` = 768,
`lg` = 1024.

| Surface | Desktop | Tablet (md) | Mobile (sm) |
|---|---|---|---|
| Sidebar | `collapsible="icon"` | icon rail | `Sheet` via `SidebarTrigger` |
| Data table | full table | fewer columns | **card list** |
| Filter toolbar | inline | inline | bottom `Drawer` |
| KPI strip | 4-up | 2-up | horizontal snap-scroll (`.snap-rail`) |
| Bulk bar | pill | pill | full-width bottom sheet |
| Detail pages | 2-col | stacked | stacked |
| Product grid | 4-up | 3-up | 2-up |

Rules that do not bend:

- Touch targets ≥ 44px (`--spacing-tap`).
- `hover:` effects are gated behind `@media (hover: hover)`.
- Nothing scrolls horizontally except deliberate rails (`.snap-rail`) and table
  containers.
- Test at **375 / 768 / 1280**.

---

## 5. Accessibility

- Focus is always visible and always the accent ring. Never `outline: none`.
- Status is never colour-alone — badges carry text, deltas carry arrows.
- Every icon-only control has an `aria-label`.
- Dialogs, sheets and drawers trap focus and restore it on close.
- Body text meets 4.5:1 in both themes; muted text is checked against the
  surface it sits on, not the canvas.

---

## 6. Icons — the feather substitution table

The app uses **`react-feather`**, not `lucide-react`. shadcn's CLI has no
`feather` mapping, so generated components arrive importing `lucide-react`;
`npm run fix:icons` rewrites them to `@/components/icons`, and an ESLint
`no-restricted-imports` rule stops lucide creeping back in.

Feather is a smaller set. These are the deliberate substitutions:

| shadcn expects | Feather substitute | Note |
|---|---|---|
| `PanelLeft` | `Sidebar` | Same silhouette |
| `GripVertical` | `MoreVertical` | Drag affordance |
| `Loader2` | `Loader` | Wrapper adds `animate-spin` |
| `Dot` | `Circle` | Wrapper adds `fill-current` |
| `ChevronsUpDown` | *hand-drawn* | Feather has `ChevronsUp`/`ChevronsDown` but not the combined form; drawn at feather's 24-grid / 2px-stroke spec |

Everything else maps 1:1. **Always import icons from `@/components/icons`** — if
a name is missing, add the mapping there rather than importing feather directly,
so substitutions stay in one place. `fix:icons` fails loudly on an unmapped name
rather than emitting a broken component.

---

## 7. Adding a shadcn component

```bash
npx shadcn@latest add <name>
npm run fix:icons     # rewrites lucide imports to the feather barrel
npm run lint
```

`components.json` records `"iconLibrary": "feather"` as intent; the CLI ignores
the value, which is exactly why the codemod exists.
