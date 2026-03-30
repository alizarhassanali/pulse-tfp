# Claude Code Instructions — OttoPulse

> **Last updated:** 2026-03-30
> **Cross-references:** [architecture.md](./architecture.md) · [database.md](./database.md) · [ui_spec.md](./ui_spec.md)

---

## Product Identity

**OttoPulse** (internal codename: UserPulse) is a multi-brand patient experience and NPS management platform built for fertility clinic networks. It enables survey distribution, response collection, review management, and contact management across multiple brands and locations.

**Brands served:** Conceptia Fertility, Generation Fertility, Grace Fertility, Olive Fertility

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 (SPA, no SSR) |
| Build tool | Vite 5 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + shadcn/ui |
| Backend | Supabase (Auth, Postgres DB, Edge Functions, Storage) |
| State (client) | Zustand 5 (auth, filters, permissions) |
| State (server) | React Query (`@tanstack/react-query` v5) |
| Routing | React Router v6 (nested routes) |
| Font | Graphik (loaded via `fonts.cdnfonts.com`) |
| Charts | Recharts |
| Toasts | Sonner + shadcn Toaster |

---

## Critical Rules

### Files You Must NEVER Edit
These are auto-generated and managed by the platform:
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `.env`

### Database Changes
- ALL schema changes MUST go through migration files in `supabase/migrations/`
- Never write raw DDL in application code
- The `types.ts` file auto-regenerates after migrations

### Path Alias
- `@/` maps to `src/` (configured in `tsconfig.app.json` and `vite.config.ts`)
- Always import as `@/components/...`, `@/hooks/...`, `@/stores/...`, etc.

---

## Key Conventions

### SMS Character Limit
- **320 characters** (not 160) across ALL distribution components
- Files affected: `SendWizard.tsx`, `SftpIntegrationCard.tsx`, `OttoOnboardCard.tsx`, `WebhookIntegrationCard.tsx`

### Google Review Reminder
- Channel dropdown options: Email, SMS, **"Survey Submitted Channel"** (not "Both")
- This sends via the same channel the patient used to complete the survey

### Form Pattern
- Local `useState` + manual validation — **not** React Hook Form
- Despite `react-hook-form` being installed, the codebase uses manual state management

### Toast Pattern
- `sonner` (imported as `toast` from `sonner`) for success messages
- `useToast` (shadcn) for error messages and complex toasts

### Demo Data Fallback
- `src/data/demo-data.ts` provides fallback data when the database is empty
- Pattern: fetch from Supabase first, fall back to `DEMO_BRANDS`, `DEMO_LOCATIONS`, `DEMO_EVENTS`, `DEMO_CONTACTS`
- Always check for this pattern when modifying data-fetching logic

---

## RBAC System

### Built-in Roles
| Role | Description |
|---|---|
| `super_admin` | Full access to all brands, locations, and settings |
| `brand_admin` | Manage assigned brands and respond to reviews |
| `clinic_manager` | View data and respond to reviews for assigned locations |
| `staff` | View-only access to assigned brands/locations |
| `read_only` | View-only access, no actions allowed |

### Custom Roles
- Stored in `custom_roles` table with `permissions` JSONB column
- Per-section permission levels: `no_access`, `view`, `edit`, `respond`

### Client-side Permission Check
```typescript
import { usePermissions } from '@/hooks/usePermissions';

const { canViewSection, canEditSection, canRespondSection, isSuperAdmin } = usePermissions();
if (canViewSection('dashboard')) { /* show dashboard */ }
```

### Database Functions (used in RLS policies)
- `has_role(_user_id, _role)` → boolean
- `is_super_admin(_user_id)` → boolean
- `has_brand_access(_user_id, _brand_id)` → boolean
- `can_view_section(_section, _user_id)` → boolean
- `can_edit_section(_section, _user_id)` → boolean

---

## State Management

### Zustand Stores
| Store | File | Purpose |
|---|---|---|
| `authStore` | `src/stores/authStore.ts` | User session, profile, roles |
| `filterStore` | `src/stores/filterStore.ts` | Global brand/location/date/event filters (persisted to localStorage) |
| `permissionStore` | `src/stores/permissionStore.ts` | Computed permission checks |

### Server State
- All Supabase data fetching uses React Query
- Queries are scoped by brand/location via `useBrandLocationContext()` hook

---

## Edge Functions

### `categorize-feedback`
- **Purpose:** AI-powered feedback tag assignment
- **AI Provider:** Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`)
- **Model:** `google/gemini-2.5-flash`
- **Auth:** `LOVABLE_API_KEY` environment variable (auto-provided)
- **Input:** `{ responseId, eventId, feedbackText, score }`
- **Output:** `{ success, tags: string[], tagIds: string[] }`
- Fetches event-specific tags from `event_feedback_tags`, asks AI to categorize, writes to `response_tag_assignments` with `source: 'ai'`

---

## Integration Types

Stored in `integrations` table with `type` field:

| Type | Description | Config Shape |
|---|---|---|
| `webhook` | API-based survey sends | `{ api_key, email_template_id, sms_template_id }` |
| `sftp` | File-based contact import with scheduling | `{ host, port, username, password, path, schedule, timezone, email_template_id, sms_template_id, csv_mapping }` |
| `cnpm` | Otto Onboard / CNP triggers | `{ trigger_id, email_template_id, sms_template_id }` |

---

## Contact Import Logic

### Upsert Pattern
When importing contacts via CSV:
1. Parse each row for `first_name`, `last_name`, `email`, `phone`, `preferred_channel`, `preferred_language`
2. Check if contact exists in same brand by `email` (primary) or `phone` (secondary)
3. If match found → **update** existing record
4. If no match → **insert** new record
5. Track separate counters: `created`, `updated`, `errored`
6. Log to `contact_imports` table

### Duplicate Detection
- Scan contacts for matching email or phone within same brand
- Auto-select oldest contact (earliest `created_at`) as primary
- "Merge All" button for bulk resolution
- Individual "Merge" per group for selective merging

---

## Component Organization

```
src/
├── components/
│   ├── ui/           # shadcn/ui primitives + custom UI components
│   ├── layout/       # MainLayout, Sidebar, TopNav, GlobalFilters
│   ├── nps/          # NPS response/detail components
│   ├── contacts/     # Contact management modals
│   ├── distribution/ # Send wizard, integration cards
│   ├── events/       # Event creation sub-components
│   ├── users/        # User/role management
│   └── resources/    # Resource management
├── pages/            # Route-level page components
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
├── types/            # TypeScript type definitions
├── data/             # Demo/fallback data
└── integrations/     # Supabase client (auto-generated)
```

---

## Testing & Debugging Tips

- Check console for Supabase query errors — most data issues are RLS policy violations
- Verify `user_roles` and `user_brand_access` records exist for the logged-in user
- Demo data uses UUIDs like `b1a2c3d4-e5f6-4789-abcd-*` — these don't exist in the real DB
- The `filterStore` persists to localStorage under key `userpulse-filters` — clear it to reset filters
- Edge function errors surface in the Supabase function logs
