# UI/Design Specification — OttoPulse

> **Last updated:** 2026-03-30
> **Cross-references:** [claude.md](./claude.md) · [architecture.md](./architecture.md)

---

## 1. Color System

All colors defined as HSL CSS variables in `src/index.css`. Components must use semantic tokens — **never hardcode colors**.

### 1.1 Core Palette

| Token | Light Mode HSL | Usage |
|---|---|---|
| `--primary` | `6 100% 74%` | Coral — buttons, active states, CTAs |
| `--primary-foreground` | `0 0% 100%` | White text on primary |
| `--secondary` | `218 46% 28%` | Navy — headings, sidebar text |
| `--secondary-foreground` | `0 0% 100%` | White text on secondary |
| `--tertiary` | `204 74% 78%` | Sky blue — accents, highlights |
| `--tertiary-foreground` | `218 46% 28%` | Navy text on tertiary |
| `--tertiary-light` | `206 50% 96%` | Very light sky blue — backgrounds |
| `--background` | `0 0% 100%` | Page background |
| `--foreground` | `218 46% 28%` | Default text (navy) |
| `--muted` | `30 20% 96%` | Muted backgrounds |
| `--muted-foreground` | `218 25% 50%` | Secondary text |
| `--accent` | `30 30% 96%` | Soft cream accent |

### 1.2 Semantic Colors

| Token | HSL | Usage |
|---|---|---|
| `--success` | `160 84% 39%` | Success states, promoter scores |
| `--warning` | `38 92% 50%` | Warning states, passive scores |
| `--destructive` | `0 72% 51%` | Error states, detractor scores, delete actions |
| `--info` | `204 74% 50%` | Informational badges, links |

### 1.3 Sidebar Theme

| Token | HSL |
|---|---|
| `--sidebar` | `206 60% 97%` |
| `--sidebar-foreground` | `218 46% 28%` |
| `--sidebar-hover` | `206 45% 93%` |
| `--sidebar-active` | `206 50% 88%` |
| `--sidebar-active-foreground` | `218 46% 28%` |
| `--sidebar-border` | `206 35% 90%` |
| `--sidebar-section` | `218 25% 55%` |

### 1.4 Score Badge Colors (defined in `score-badge.tsx`)

| Score Group | Background | Text |
|---|---|---|
| Promoter (9-10) | `bg-emerald-50` | `text-emerald-700` |
| Passive (7-8) | `bg-amber-50` | `text-amber-700` |
| Detractor (0-6) | `bg-rose-50` | `text-rose-700` |

### 1.5 Status Badge Colors (defined in `status-badge.tsx`)

| Status | Color Scheme |
|---|---|
| Sent | Blue (`bg-blue-50 text-blue-700`) |
| Delivered | Teal (`bg-teal-50 text-teal-700`) |
| Opened | Violet (`bg-violet-50 text-violet-700`) |
| Completed | Emerald (`bg-emerald-50 text-emerald-700`) |
| Bounced | Amber (`bg-amber-50 text-amber-700`) |
| Failed | Rose (`bg-rose-50 text-rose-700`) |

### 1.6 Chart Colors

```css
--chart-1: 6 100% 74%;    /* Coral (primary) */
--chart-2: 218 46% 28%;   /* Navy (secondary) */
--chart-3: 204 74% 78%;   /* Sky blue (tertiary) */
--chart-4: 160 84% 39%;   /* Green (success) */
--chart-5: 38 92% 50%;    /* Amber (warning) */
```

### 1.7 Dark Mode

Full dark mode palette defined in `.dark` class. Key differences:
- Background: `218 50% 10%` (dark navy)
- Foreground: `210 20% 90%` (light gray)
- Cards: `218 45% 14%`
- Sidebar: `218 50% 12%`

---

## 2. Typography

### Font Family
- **Primary:** `'Graphik', sans-serif` (loaded from `fonts.cdnfonts.com`)
- Applied globally via `body { font-family: 'Graphik', sans-serif; }`

### Heading Patterns
- Page titles: `text-2xl font-semibold tracking-tight text-foreground`
- Section headings: `text-lg font-medium text-foreground`
- Card titles: `text-base font-medium`
- Labels: `text-sm font-medium text-muted-foreground`

### Body Text
- Default: `text-sm text-foreground`
- Secondary: `text-sm text-muted-foreground`
- Small/caption: `text-xs text-muted-foreground`

---

## 3. Layout Architecture

### 3.1 MainLayout (`src/components/layout/MainLayout.tsx`)
```
┌──────────────────────────────────────────────┐
│ TopNav (64px height, full width)             │
├────────┬─────────────────────────────────────┤
│        │                                     │
│ Sidebar│ Main Content Area                   │
│ (coll- │ (overflow-y-auto, p-8)              │
│ apsible│                                     │
│ ~240px)│ <Outlet /> renders page content     │
│        │                                     │
└────────┴─────────────────────────────────────┘
```

### 3.2 TopNav
- Fixed height: 64px (`h-16`)
- Contains: logo, global filter dropdowns (brand, location, date range, event)
- `GlobalFilters` component reads/writes to `filterStore`

### 3.3 Sidebar
- Collapsible (icon-only mode when collapsed)
- Sky-blue themed background
- Navigation groups:
  - **NPS:** Dashboard, Responses, Sent Logs, Events
  - **Reviews:** Reviews
  - **Contacts:** All Contacts, Unsubscribed
  - **Communication:** Templates, Automations
  - **Settings:** Profile, Brands, Review Settings, Users
- Items filtered by `usePermissions().canViewSection()`
- User avatar + logout at bottom
- Help & Support menu

---

## 4. Component Library

### 4.1 shadcn/ui Primitives (all available)
Button, Card, Dialog, DropdownMenu, Select, Tabs, Table, Input, Textarea, Checkbox, RadioGroup, Switch, Badge, Tooltip, Popover, Accordion, Alert, AlertDialog, Avatar, Calendar, Command, Separator, Skeleton, Slider, Toast, Toggle, ScrollArea, Sheet, Progress

### 4.2 Custom Components

| Component | File | Purpose |
|---|---|---|
| `PageHeader` | `ui/page-header.tsx` | Page title + description + action buttons |
| `MetricCard` | `ui/metric-card.tsx` | KPI display with icon, value, trend |
| `ScoreBadge` | `ui/score-badge.tsx` | NPS score with color coding |
| `StatusBadge` | `ui/status-badge.tsx` | Invitation status with color |
| `ChannelBadge` | `ui/channel-badge.tsx` | Email/SMS channel indicator |
| `BulkActionBar` | `ui/bulk-action-bar.tsx` | Sticky bar for multi-select actions |
| `EmptyState` | `ui/empty-state.tsx` | Empty list placeholder with icon + CTA |
| `LoadingSkeleton` | `ui/loading-skeleton.tsx` | Shimmer loading placeholders |
| `SortableTableHead` | `ui/sortable-table-head.tsx` | Table header with sort arrows |
| `ColumnVisibilityToggle` | `ui/column-visibility-toggle.tsx` | Show/hide table columns |
| `MultiSelect` | `ui/multi-select.tsx` | Multi-select dropdown with checkboxes |

---

## 5. Shadows & Elevation

Defined in `tailwind.config.ts`:

| Token | Value | Usage |
|---|---|---|
| `shadow-soft` | `0 2px 8px -2px rgba(0,0,0,0.08)` | Default card shadow, hover states |
| `shadow-medium` | `0 4px 16px -4px rgba(0,0,0,0.12)` | Active/elevated cards |
| `shadow-float` | `0 8px 30px -8px rgba(0,0,0,0.15)` | Modals, popovers, floating elements |

---

## 6. UI Patterns

### 6.1 Cards
- Base: `rounded-xl border bg-card shadow-soft`
- Hover: `hover:shadow-medium transition-shadow`
- Interactive cards have `cursor-pointer`

### 6.2 Tables
- `SortableTableHead` for clickable sort headers with directional arrows
- Skeleton rows during loading via `LoadingSkeleton`
- `ColumnVisibilityToggle` dropdown for showing/hiding columns
- Zebra striping: not used — clean white rows with border-b

### 6.3 Modals
- shadcn `Dialog` component
- Max width varies: `sm:max-w-md` (simple), `sm:max-w-lg` (forms), `sm:max-w-2xl` (complex)
- Scroll inside `DialogContent` for long content

### 6.4 Accordion Cards (Integration Config)
- Used in: `SftpIntegrationCard`, `WebhookIntegrationCard`, `OttoOnboardCard`
- Collapsible card with configuration form inside
- **Auto-collapse on save:** uses `useEffect` watching `savePending` transition from `true` → `false`
- Pattern:
```typescript
const prevPending = useRef(props.savePending);
useEffect(() => {
  if (prevPending.current && !props.savePending) {
    setIsOpen(false);
  }
  prevPending.current = props.savePending;
}, [props.savePending]);
```

### 6.5 Page Header Pattern
```tsx
<PageHeader
  title="Dashboard"
  description="Overview of your NPS performance"
  actions={<Button>Export</Button>}
/>
```

### 6.6 Empty States
```tsx
<EmptyState
  icon={Inbox}
  title="No responses yet"
  description="Responses will appear here once patients complete surveys"
  action={<Button>Send Survey</Button>}
/>
```

---

## 7. Animation

- Minimal animations for professional feel
- `transition-shadow` on card hovers
- `animate-pulse-soft` for loading states (custom keyframe)
- No `framer-motion` — pure CSS transitions
- Collapsible sidebar uses CSS transition on width

---

## 8. Responsive Behavior

- Sidebar collapses to icon-only on smaller screens
- Tables use horizontal scroll on mobile
- Cards stack vertically on mobile
- Global filters collapse into a dropdown on small screens
- Mobile breakpoint: `use-mobile.tsx` hook (768px threshold)

---

## 9. Form Patterns

### Input Fields
- shadcn `Input` with `Label` above
- Error text below in `text-destructive text-sm`
- No inline validation — validate on submit

### Select Dropdowns
- shadcn `Select` for single selection
- Custom `MultiSelect` for multi-selection with checkboxes
- `Command` (cmdk) for searchable dropdowns

### Toggle/Switch
- shadcn `Switch` for boolean settings
- `Checkbox` for multi-select in forms
- `RadioGroup` for single-select options
