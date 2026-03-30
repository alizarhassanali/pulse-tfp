# User Workflows & Business Logic — OttoPulse

> **Last updated:** 2026-03-30
> **Cross-references:** [requirements.md](./requirements.md) · [database.md](./database.md) · [architecture.md](./architecture.md)

---

## 1. Authentication Flow

1. User navigates to `/auth`
2. Login form: email + password → `supabase.auth.signInWithPassword()`
3. Signup form: email + password → `supabase.auth.signUp()` (email verification required)
4. On auth state change → `AuthProvider` fetches:
   - `profiles` table → user profile (name, avatar, timezone)
   - `user_roles` table → role(s) for the user
5. Stores populated: `authStore.user`, `authStore.profile`, `authStore.roles`
6. `ProtectedRoute` checks `authStore.user` — redirects to `/auth` if null
7. After login → redirect to `/nps/dashboard`

---

## 2. Create NPS Event (5-Step Wizard)

**Route:** `/nps/events/create` or `/nps/events/:id/edit`
**Component:** `src/pages/nps/CreateEvent.tsx`

### Step 1 — Setup
1. Select brand from dropdown (filtered by user's `user_brand_access`)
2. Select locations (multi-select, filtered by selected brand)
3. Enter event name
4. Customize metric question (default: "On a scale of 0-10, how likely are you to recommend us?")
5. Optional: intro message
6. Select languages (multi-select: EN, ES, FR, DE, PT)
7. Set throttle days (default: 90)

### Step 2 — Follow-up Questions
1. Click "Add Question" → select type (free_response, scale, select_one, select_multiple)
2. Configure question based on type:
   - **Free response:** question text + placeholder
   - **Scale:** question text + min/max values + min/max labels
   - **Select one/multiple:** question text + options (add/remove)
3. Set "Show for" groups (promoters, passives, detractors)
4. Toggle required
5. Drag to reorder (order_num)
6. Add feedback tags for this event (used for categorization)

### Step 3 — Consents
1. Customize consent text
2. Select which contact fields to collect
3. Configure location selection behavior

### Step 4 — Thank You Page
1. For each score group (promoters, passives, detractors):
   - Set heading and body text
   - Add action buttons (Google Review link, custom URL, Facebook, Yelp)
2. Configure Google Review Reminder:
   - Enable/disable
   - Delay (hours after completion)
   - Channel: Email, SMS, or "Survey Submitted Channel"
   - Select reminder template

### Step 5 — Review & Save
1. Review all settings in a summary view
2. Save as Draft (`status: 'draft'`) or Publish (`status: 'active'`)
3. On save → creates/updates:
   - `events` table (main record)
   - `event_locations` junction (brand locations)
   - `event_questions` (follow-up questions with configs)
   - `event_feedback_tags` (categorization tags)

---

## 3. Send Survey — Manual

**Route:** `/nps/events/:id` → "Send" tab → "Send Now" sub-tab

1. From Manage Events page, click "Send" button on an event row
2. Navigate to `EventDetail` with `location.state.tab = 'distribution'`
3. EventDetail opens with "Send" tab active, showing 2 sub-tabs:
   - **Send Now** (default)
   - **Share & QR**
4. In Send Now (SendWizard):
   - Select contacts (filtered by event's brand/locations)
   - Choose channel: Email or SMS
   - Select template from brand's templates
   - Preview message with variable substitution
   - Click "Send" → creates `survey_invitations` with `status: 'pending'`
5. Toast confirms: "X surveys sent successfully"

---

## 4. Share & QR

**Route:** `/nps/events/:id` → "Send" tab → "Share & QR" sub-tab

1. View generated survey link (includes event ID)
2. Copy link to clipboard
3. Download QR code as image
4. QR code encodes the survey link for print materials

---

## 5. Automate Survey

**Route:** `/nps/events/:id` → "Automate" tab

1. From Manage Events page, click "Automate" button on an event row
2. Navigate to `EventDetail` with `location.state.tab = 'automated'`
3. Three integration cards displayed:

### 5.1 Webhook API
1. Expand accordion card
2. View/generate API key for the brand
3. Configure email template (select from brand templates)
4. Configure SMS template
5. Save → creates/updates `integrations` record with `type: 'webhook'`
6. **Accordion auto-collapses on successful save**

### 5.2 SFTP File Import
1. Expand accordion card
2. Enter connection details: host, port, username, password, remote file path
3. Set schedule: frequency (hourly/daily/weekly), timezone
4. Map CSV columns to contact fields
5. Configure email and SMS templates
6. Save → creates/updates `integrations` record with `type: 'sftp'`
7. View sync history via "View History" button → `SftpSyncHistoryModal`
8. **Accordion auto-collapses on successful save**

### 5.3 Otto Onboard (CNP Triggers)
1. Expand accordion card
2. Select or create CNP trigger for the brand
3. Configure email and SMS templates
4. Save → creates/updates `integrations` record with `type: 'cnpm'`
5. **Accordion auto-collapses on successful save**

---

## 6. Contact Import (CSV)

**Route:** `/contacts` → Import button

1. Click "Import Contacts" button
2. Select CSV file
3. System parses CSV rows with expected columns: `first_name`, `last_name`, `email`, `phone`, `preferred_channel`, `preferred_language`
4. For each parsed row:
   - If `email` exists → query `contacts` where `email = row.email AND brand_id = selectedBrand`
   - Else if `phone` exists → query `contacts` where `phone = row.phone AND brand_id = selectedBrand`
   - **Match found → UPDATE** existing contact with new data
   - **No match → INSERT** new contact
5. Track counters: `created`, `updated`, `errored`
6. Log import to `contact_imports` table with:
   - `file_name`, `total_rows`, `success_count` (created + updated), `error_count`
   - `errors` JSONB array with row-level error details
7. Toast: "Import complete: X added, Y updated, Z errors"
8. Import history visible in `ImportHistoryModal` with separate "Added" and "Errors" columns

---

## 7. Duplicate Detection & Merge

**Route:** `/contacts` → "Find Duplicates" button

1. Click "Find Duplicates"
2. System scans contacts for matching email or phone within same brand
3. Groups displayed in `DuplicateDetectionModal`:
   - Each group shows contacts sharing same email/phone
   - Summary: "2 contacts share email john@example.com"
4. **Auto-primary selection:** oldest contact (earliest `created_at`) is automatically set as primary
5. Optional: click "Set as primary" dropdown to change primary
6. **Individual merge:** click "Merge" on a specific group
7. **Bulk merge:** click "Merge All" button at top to resolve all groups
8. Merge action:
   - Consolidates data from secondary contacts into primary
   - Preserves primary's ID and oldest creation date
   - Deletes secondary contact records
   - Updates any references (tags, invitations, responses)

---

## 8. Respond to Patient Feedback

**Route:** `/nps/questions` → click response row

1. View responses table with NPS score badges and answer previews
2. Click a response → opens `ResponseDetailModal`
3. In modal:
   - View NPS score (large badge)
   - View all follow-up answers with type-aware rendering:
     - **Scale:** horizontal bar chart
     - **Multi-select:** colored pills
     - **Single-select:** text with indicator
     - **Free text:** quoted block
   - **AI Categorize:** click button → calls `categorize-feedback` edge function
     - AI reads feedback text + event-specific tags
     - Auto-assigns matching tags with `source: 'ai'`
   - **Manual Tags:** dropdown to manually add/remove tags
   - **Categories:** assign from global feedback categories
   - **Internal Notes:** add notes (visible only to team, not patients)
4. Changes saved to: `response_tag_assignments`, `response_category_assignments`, `submission_notes`

---

## 9. Automation Rules

**Route:** `/settings/automations`

### Create Rule
1. Click "Create Rule"
2. Configure:
   - **Name:** descriptive name
   - **Event:** select which event triggers this rule
   - **Trigger group:** promoters, passives, detractors, or all
   - **Feedback condition:** with feedback, without feedback, either
   - **Channel:** email or SMS
   - **Template:** select from brand's templates
   - **Delay hours:** wait N hours after response before sending
   - **Throttle days:** don't re-trigger for same contact within N days
3. Save → creates `automation_rules` record with `status: 'active'`

### Rule Execution (Backend Logic)
1. Patient submits survey response
2. System checks active automation rules for that event
3. Filters by trigger group (promoter/passive/detractor based on score)
4. Checks feedback condition (has feedback text or not)
5. Checks throttle (last send to this contact within throttle_days)
6. If all conditions met → creates `automation_logs` entry with `status: 'pending'`, `scheduled_at: now + delay_hours`
7. At scheduled time → sends message via configured channel/template
8. Updates log: `status: 'sent'`, `sent_at: now`
9. If skipped → logs `skip_reason` (e.g., "throttled", "no template", "unsubscribed")

---

## 10. User Management

**Route:** `/settings/users`

### Invite User
1. Click "Invite User"
2. `InviteUserWizard` opens (multi-step):
   - **Step 1:** email, name, role selection (built-in or custom)
   - **Step 2:** brand access (multi-select) and location access (per-brand)
3. Submit → `supabase.auth.signUp()` with temporary password
4. Creates records in: `profiles`, `user_roles`, `user_brand_access`, `user_location_access`

### Edit User
1. Click edit icon on user row
2. Same wizard opens pre-populated with user's current data
3. Can change: role, brand access, location access
4. Save → updates `user_roles`, `user_brand_access`, `user_location_access`

### Suspend/Reactivate
1. Click suspend on user row → confirmation dialog
2. Updates `profiles.status` to `'suspended'` or `'active'`
3. Suspended users can still log in but see restricted access

---

## 11. Review Management

**Route:** `/reviews`

1. View all reviews filtered by brand/location/date from global filters
2. Each review shows: reviewer name, star rating, review text, date, response status
3. Click "Respond" → inline text area to write response
4. Save response → updates `reviews.response_text` and `reviews.responded_at`
5. Metrics at top: average rating, total reviews, response rate, trends

---

## 12. Navigation State Management

### Manage Events → Event Detail Tab Selection
- Clicking "Send" in ManageEvents navigates with `{ state: { tab: 'distribution' } }`
- Clicking "Automate" navigates with `{ state: { tab: 'automated' } }`
- EventDetail uses `useEffect` to sync `activeTab` when `location.state.tab` changes:
```typescript
useEffect(() => {
  if (location.state?.tab) {
    setActiveTab(location.state.tab);
  }
}, [location.state?.tab]);
```
This ensures correct tab opens even when EventDetail is already mounted.
