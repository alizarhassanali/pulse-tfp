

# Plan: Create 7 Comprehensive Documentation Files

Create a `docs/` directory with 7 in-depth markdown files derived entirely from the existing codebase. Each file is self-contained with cross-references to related docs.

---

## Files to Create

### 1. `docs/claude.md` — AI Coding Instructions
Instructions for Claude Code to work effectively on this project:
- Product identity: OttoPulse (internal name UserPulse) — multi-brand patient experience platform for fertility clinics
- Tech stack: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Supabase (auth, DB, edge functions), Zustand, React Query, React Router v6
- Font: Graphik (loaded via CDN)
- Path alias: `@/` maps to `src/`
- **Never edit**: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `.env`
- Database changes via migration files only (`supabase/migrations/`)
- Demo data pattern: `src/data/demo-data.ts` provides fallback when DB is empty — always check for this pattern
- SMS character limit: 320 (not 160) across all distribution components
- RBAC: roles in `user_roles` table, permissions via `usePermissions()` hook, DB functions `has_role()`, `is_super_admin()`, `can_view_section()`, `can_edit_section()`
- State management: Zustand for auth/filters/permissions, React Query for server state, no Redux
- Form pattern: local `useState` + manual validation (no React Hook Form)
- Toast: `sonner` for success, `useToast` for errors
- Contact import uses upsert logic (dedup by email/phone within brand)
- Google Review Reminder channel option: "Survey Submitted Channel" (not "Both")
- Edge functions use Lovable AI gateway (`ai.gateway.lovable.dev`) with `LOVABLE_API_KEY`
- All 4 brands: Conceptia, Generation, Grace, Olive Fertility
- Integration types in DB: `sftp`, `webhook`, `cnpm` (Otto Onboard)

### 2. `docs/requirements.md` — Product Requirements Document
Comprehensive PRD covering every module:
- **NPS Surveys**: 5-step event creation wizard (Setup, Follow-up Questions, Consents, Thank You Page, Review & Save). Question types: free_response, scale, select_one, select_multiple. Metric question (0-10 NPS). Multi-language support (EN/ES/FR/DE/PT). Throttle days per contact. Score-based thank you pages with configurable buttons (Google Review, custom links). Google Review Reminder with configurable delay/channel.
- **Survey Distribution**: 3 methods — Send Now (manual select contacts), Share & QR (link/QR code), Automated (Webhook API, SFTP file import with scheduling/timezone, Otto Onboard/CNP triggers). Each method supports email/SMS templates with 320-char SMS limit.
- **NPS Dashboard**: NPS score, surveys sent, completed, response rate. Score distribution (promoter/passive/detractor). Delivery issues (bounced/throttled/unsubscribed). Trend charts (daily/weekly/monthly). Channel performance table. Critical feedback section.
- **Responses (Questions page)**: View all follow-up answers. Type-aware rendering (scale bars, multi-select pills, text). AI-powered feedback categorization via edge function. Manual category/tag assignment. Internal notes per response. CSV export with question type column.
- **Sent Logs**: Track invitation lifecycle (created → sent → delivered → opened → completed/bounced/failed). Filter by status, channel, event, brand, location.
- **Reviews**: Aggregate Google reviews (Facebook/Yelp/TripAdvisor planned). Respond to reviews inline. Sync mechanism. Rating distribution, response rate metrics. Location-level breakdown.
- **Contacts**: CSV import with upsert (dedup by email/phone within brand). Duplicate detection with auto-merge (oldest as primary). Tags system. Unsubscribe management. Import history with Added/Errors columns.
- **Communication**: Message templates (email/SMS per brand). Automation rules (trigger on score group, delay hours, throttle days, channel selection).
- **Settings**: Profile management. Brand/location configuration with GMB links and review channel config. User management with RBAC (super_admin, brand_admin, clinic_manager, staff, read_only). Custom roles with per-section permissions.
- **Resources**: Admin-managed playbook, guides, documents with brand-level access control.

### 3. `docs/ui_spec.md` — UI/Design Specification
- **Color System** (HSL CSS variables):
  - Primary: Coral `hsl(6,100%,74%)`
  - Secondary: Navy `hsl(218,46%,28%)` (also foreground)
  - Tertiary: Sky Blue `hsl(204,74%,78%)`
  - Sidebar: Sky blue theme `hsl(206,60%,97%)`
  - Success: `hsl(160,84%,39%)`, Warning: `hsl(38,92%,50%)`, Destructive: `hsl(0,72%,51%)`, Info: `hsl(204,74%,50%)`
  - Score badges: promoter (green), passive (amber), detractor (red) with light backgrounds
  - Status badges: sent (blue), delivered (teal), opened (violet), completed (emerald), bounced (amber), failed (rose)
  - Dark mode: fully defined with navy-based palette
- **Typography**: Graphik font family, `font-medium tracking-tight` for headings
- **Layout**: `MainLayout` = collapsible Sidebar + TopNav (global filters) + `<Outlet>`. Sidebar groups: NPS (Dashboard, Responses, Sent Logs, Events), Reviews, Contacts (All, Unsubscribed), Communication (Templates, Automations), Settings (Profile, Brands, Reviews, Users)
- **Component library**: All shadcn/ui primitives plus custom: `MetricCard`, `PageHeader`, `ScoreBadge`, `StatusBadge`, `ChannelBadge`, `BulkActionBar`, `EmptyState`, `LoadingSkeleton`, `SortableTableHead`, `ColumnVisibilityToggle`, `MultiSelect`
- **Shadows**: `shadow-soft` (hover), `shadow-medium` (active cards), `shadow-float` (modals)
- **Patterns**: Cards with `rounded-xl`, tables with sortable headers and skeleton rows, modals via Dialog, dropdowns via DropdownMenu, accordion cards for integration config (auto-collapse on save)

### 4. `docs/workflows.md` — User Workflows & Business Logic
Step-by-step flows for every major user path:
- **Create NPS Event**: Step 1 (select brand, locations, name, metric question, languages, throttle days) → Step 2 (add follow-up questions with type-specific config, feedback tags) → Step 3 (consent text, contact fields, location selection) → Step 4 (thank you messages per score group with action buttons, Google Review Reminder config) → Step 5 (review all settings, save as draft or publish)
- **Send Survey — Manual**: ManageEvents → click "Send" → EventDetail Send tab → sub-tab "Send Now" (select contacts, choose channel, pick template, send) or sub-tab "Share & QR" (copy link, download QR)
- **Automate Survey**: ManageEvents → click "Automate" → EventDetail Automate tab → configure Webhook (API key, email/SMS templates), SFTP (host/port/credentials, schedule/timezone, templates, CSV mapping), or Otto Onboard (CNP trigger, templates)
- **Contact Import**: Contacts page → Import CSV → parse rows → for each row: check existing by email/phone within brand → update if exists, insert if new → show toast with created/updated/error counts → log to contact_imports table
- **Duplicate Detection**: Contacts page → "Find Duplicates" → scan for matching email/phone → group duplicates → auto-select oldest as primary → merge individual or "Merge All"
- **Respond to Feedback**: Dashboard or Questions page → click response → view NPS score + answers (type-aware: scale bars, pills, text) → AI categorize or manual tag → add internal notes → close
- **Automation Rules**: Communication → Automation Rules → create rule (select event, trigger group [promoters/passives/detractors], feedback condition, channel, template, delay hours, throttle days) → activate/deactivate → view logs
- **User Management**: Settings → Users → invite user (email, name, role selection [built-in or custom], brand/location access) → edit user → suspend/reactivate

### 5. `docs/architecture.md` — Technical Architecture
- **Directory structure**: `src/pages/` (route pages), `src/components/` (feature + ui), `src/hooks/` (custom hooks), `src/stores/` (Zustand stores), `src/types/` (TypeScript types), `src/data/` (demo data), `src/integrations/` (Supabase client + auto-generated types), `supabase/functions/` (edge functions), `supabase/migrations/` (SQL migrations)
- **Routing**: React Router v6 with nested routes under `MainLayout`. `ProtectedRoute` wrapper checks auth state. Auth page at `/auth`.
- **State management**:
  - `authStore` (Zustand): user, session, profile, roles
  - `filterStore` (Zustand + persist): global brand/location/date/event filters, used by TopNav `GlobalFilters` component
  - `permissionStore` (Zustand): computed permission checks
  - Server state: React Query (`@tanstack/react-query`) for all Supabase data fetching
- **Auth flow**: `AuthProvider` → `supabase.auth.onAuthStateChange` → fetch profile + roles → populate stores → `ProtectedRoute` gates access
- **RBAC implementation**: 5 built-in roles + custom roles. `usePermissions()` hook fetches from `user_roles` table, checks for custom role permissions via `custom_roles.permissions` JSONB, falls back to `DEFAULT_PERMISSIONS` map. Sidebar filters nav items by `canViewSection()`. DB functions (`has_role`, `can_view_section`, `can_edit_section`) used in RLS policies.
- **Data access pattern**: `useBrandLocationContext()` hook provides brand/location-aware data scoping. All list pages filter by `selectedBrands`/`selectedLocations` from `filterStore`.
- **Edge functions**: `categorize-feedback` — AI-powered feedback tagging using Lovable AI gateway (Gemini 2.5 Flash). Accepts responseId, eventId, feedbackText, score. Returns matched tag names from event-specific tag list.
- **Integration types**: `integrations` table with `type` field: `webhook` (API-based sends), `sftp` (file-based import with sync logs in `sftp_sync_logs`), `cnpm` (Otto Onboard/CNP triggers via `cnp_triggers` table)

### 6. `docs/database.md` — Database Schema Reference
Complete schema from `types.ts` (25 tables):

| Table | Key Columns | Relationships |
|---|---|---|
| `brands` | id, name, logo_url, colors, subdomain | — |
| `locations` | id, name, brand_id, gmb_link, google_place_id, address fields, review_channels_config | → brands |
| `contacts` | id, first_name, last_name, email, phone, preferred_channel, preferred_language, brand_id, location_id, status | → brands, locations |
| `contact_tags` | id, name | — |
| `contact_tag_assignments` | contact_id, tag_id | → contacts, contact_tags |
| `contact_imports` | id, file_name, brand_id, total_rows, success_count, error_count, errors, status | → brands |
| `events` | id, name, brand_id, status, type, config (JSONB), metric_question, intro_message, languages[], throttle_days, thank_you_config (JSONB), consent_config (JSONB), translations (JSONB) | → brands |
| `event_locations` | event_id, location_id | → events, locations |
| `event_questions` | id, event_id, type, config (JSONB), order_num, required, show_for[] | → events |
| `event_feedback_tags` | id, event_id, name, archived | → events |
| `survey_invitations` | id, event_id, contact_id, channel, status, sent_at, delivered_at, opened_at, completed_at | → events, contacts |
| `survey_responses` | id, event_id, contact_id, invitation_id, nps_score, answers (JSONB), consent_given, device_info (JSONB), completed_at | → events, contacts, survey_invitations |
| `response_tag_assignments` | id, response_id, tag_id, source (ai/manual), assigned_by | → survey_responses, event_feedback_tags |
| `response_category_assignments` | response_id, category_id, source, assigned_by | → survey_responses, feedback_categories |
| `feedback_categories` | id, name, archived | — |
| `submission_notes` | id, response_id, note_text, created_by | → survey_responses |
| `integrations` | id, event_id, type, config (JSONB), status, sends_count, last_used_at | → events |
| `sftp_sync_logs` | id, integration_id, status, file_name, total_rows, success_count, error_count, skipped_count, errors | → integrations |
| `cnp_triggers` | id, brand_id, name, description, status | → brands |
| `templates` | id, name, type, brand_id, subject, body, variables (JSONB), usage_count | → brands |
| `automation_rules` | id, name, event_id, brand_id, trigger_group, feedback_condition, channel, template_id, delay_hours, throttle_days, status | → events, brands, templates |
| `automation_logs` | id, automation_rule_id, response_id, contact_id, template_id, channel, status, scheduled_at, sent_at, skip_reason | → automation_rules, survey_responses, contacts, templates |
| `reviews` | id, brand_id, location_id, reviewer_name, rating, review_text, response_text, channel, source_url, external_id, responded_at, fetched_at | → brands, locations |
| `api_keys` | id, brand_id, name, key_hash, key_prefix, created_by, expires_at, revoked_at, last_used_at | → brands |
| `resources` | id, title, description, content, type, status, file_url, icon, created_by | — |
| `resource_brand_access` | resource_id, brand_id | → resources, brands |
| `profiles` | id, user_id, email, name, phone, timezone, avatar_url, status | — |
| `user_roles` | id, user_id, role (enum), custom_role_id | → custom_roles |
| `custom_roles` | id, name, description, permissions (JSONB) | — |
| `user_brand_access` | user_id, brand_id | → brands |
| `user_location_access` | user_id, location_id | → locations |
| `user_section_permissions` | id, user_id, section (enum), permission (enum) | — |

**Enums**: `app_role` (super_admin, brand_admin, clinic_manager, staff, read_only), `app_section` (10 sections), `permission_level` (no_access, view, edit, respond)

**DB Functions**: `has_role(_user_id, _role)`, `is_super_admin(_user_id)`, `has_brand_access(_user_id, _brand_id)`, `can_view_section(_user_id, _section)`, `can_edit_section(_user_id, _section)`, `get_user_section_permission(_user_id, _section)`

**JSONB structures documented**: `events.config`, `events.thank_you_config` (per score group with buttons array), `events.consent_config`, `events.translations` (per-language content), `survey_responses.answers` (array of `{question, answer, type?}`), `integrations.config` (varies by type: SFTP has host/port/credentials/schedule, webhook has api_key/templates, cnpm has trigger mappings)

### 7. `docs/success.md` — Product Success Metrics & Measurement (NEW)
Comprehensive PM-oriented success measurement guide:

**North Star Metric**: Patient feedback loop closure rate (% of detractor responses that receive a follow-up action within 48 hours)

**Module-level KPIs**:

**NPS Surveys**:
- Survey response rate (completed / sent) — target >30%
- NPS score trend over time (monthly)
- Average time to complete survey
- Channel effectiveness (email vs SMS vs QR completion rates)
- Survey drop-off rate by step
- Throttle hit rate (contacts blocked by throttle days)
- Multi-language adoption rate

**Distribution & Automation**:
- Automated send volume vs manual send volume (target: >70% automated)
- SFTP sync success rate and error rate
- Webhook API adoption (# active API keys, calls/day)
- Otto Onboard trigger activation rate
- Delivery success rate by channel (bounced, failed, throttled)
- Time from patient visit to survey send (latency)

**Feedback & Response Management**:
- AI categorization accuracy (manual override rate as proxy)
- Average internal notes per detractor response
- Time to first action on detractor feedback
- Feedback category distribution (identify top pain points)
- Follow-up automation trigger rate

**Reviews**:
- Google Review Reminder conversion rate (reminder sent → review posted)
- Average star rating trend (monthly, per location)
- Review response rate and response time
- Rating distribution shift after NPS program launch

**Contacts**:
- Contact database growth rate
- Import success rate (rows imported / total rows)
- Duplicate detection merge rate
- Unsubscribe rate over time
- Contact data completeness (% with both email + phone)

**User Engagement (Admin Platform)**:
- DAU/WAU/MAU of admin users
- Feature adoption by role (which pages do clinic_managers vs brand_admins visit)
- Time spent on dashboard vs action pages
- Automation rule creation and activation rate

**Operational Health**:
- System uptime and edge function error rates
- CSV import processing time
- AI categorization latency (edge function response time)
- SFTP sync frequency and reliability

**How to Measure** (implementation guidance):
- Dashboard metrics already computed in `src/pages/nps/Dashboard.tsx`: NPS score, response rate, surveys sent/completed, delivery issues, channel performance
- Review metrics in `src/pages/Reviews.tsx`: avg rating, total reviews, response rate, 7-day trends
- Track via `survey_invitations` table: lifecycle timestamps (created → sent → delivered → opened → completed) enable funnel analysis
- `automation_logs` table: captures all automated actions with status and skip reasons
- `sftp_sync_logs`: sync health monitoring
- `contact_imports`: import quality tracking
- Export any page's data via CSV for external analysis
- Consider adding analytics events (e.g., Mixpanel/Amplitude) for admin user behavior tracking — not yet implemented

**Feature Success Checklist** (for evaluating new features):
- Does it increase response rate?
- Does it reduce time-to-action on detractor feedback?
- Does it shift manual work to automation?
- Does it improve data quality (fewer duplicates, more complete contacts)?
- Does it increase admin user engagement with the platform?

---

## Implementation
- Create all 7 files in `docs/` directory
- Each file includes a header with last-updated date and cross-references
- Content derived 100% from codebase inspection — no assumptions
- Total: ~7 files, substantial depth for each

