# Product Requirements Document — OttoPulse

> **Last updated:** 2026-03-30
> **Cross-references:** [workflows.md](./workflows.md) · [database.md](./database.md) · [success.md](./success.md)

---

## 1. Product Overview

OttoPulse is a multi-brand patient experience management platform for fertility clinic networks. It enables organizations to:
- Create and distribute NPS surveys across multiple brands and locations
- Collect, categorize, and act on patient feedback
- Manage Google Reviews and other review platforms
- Maintain a centralized contact database with deduplication
- Automate follow-up communications based on survey responses

**Target users:** Clinic administrators, brand managers, clinic managers, and staff across 4 fertility brands (Conceptia, Generation, Grace, Olive Fertility).

---

## 2. NPS Surveys Module

### 2.1 Event Creation (5-Step Wizard)

**Step 1 — Setup:**
- Select brand (from accessible brands)
- Select locations (multi-select from brand's locations)
- Event name
- Metric question text (default: "On a scale of 0-10, how likely are you to recommend us?")
- Intro message (displayed before survey)
- Languages (multi-select: EN, ES, FR, DE, PT)
- Throttle days (default: 90 — prevents re-surveying same contact within N days)

**Step 2 — Follow-up Questions:**
- Add unlimited follow-up questions, each with:
  - **Type:** `free_response` (open text), `scale` (1-5 or 1-10), `select_one` (radio), `select_multiple` (checkbox)
  - **Configuration per type:**
    - `free_response`: question text, placeholder
    - `scale`: question text, min/max values, min/max labels
    - `select_one` / `select_multiple`: question text, options list
  - **Required:** toggle
  - **Show for:** which score groups see this question (promoters, passives, detractors)
- Feedback tags: create event-specific tags for categorization (e.g., "Staff Friendliness", "Wait Times", "Communication")

**Step 3 — Consents:**
- Consent text (customizable)
- Optional contact fields to collect
- Location selection for response attribution

**Step 4 — Thank You Page:**
- Score-based thank you messages (separate for promoters, passives, detractors)
- Each score group can have:
  - Custom heading and body text
  - Action buttons: Google Review link, custom URL, Facebook, Yelp
- **Google Review Reminder:** optional delayed reminder
  - Configurable delay (hours after survey completion)
  - Channel: Email, SMS, or "Survey Submitted Channel" (sends via the channel the patient used to complete the survey)
  - Template selection for the reminder message

**Step 5 — Review & Publish:**
- Summary of all settings
- Save as Draft or Publish (set status to `active`)

### 2.2 Question Types — Answer Storage

All answers stored in `survey_responses.answers` as JSONB array:
```json
[
  { "question": "How was your experience?", "answer": "Great staff", "type": "free_response" },
  { "question": "Rate cleanliness", "answer": 4, "type": "scale" },
  { "question": "Which services?", "answer": ["IVF", "Consultation"], "type": "select_multiple" },
  { "question": "Primary reason?", "answer": "Recommendation", "type": "select_one" }
]
```

Type inference when `type` field is missing (legacy data):
- `Array.isArray(answer)` → `select_multiple`
- `typeof answer === 'number'` → `scale`
- String matching `^\d+$` with value ≤ 10 → `scale`
- Default → `free_response`

### 2.3 Multi-Language Support

- Supported languages: English (en), Spanish (es), French (fr), German (de), Portuguese (pt)
- Translations stored in `events.translations` JSONB keyed by language code
- Each translation includes: metric question, intro message, question texts, thank you messages, consent text
- Survey UI auto-selects language based on contact's `preferred_language`

---

## 3. Survey Distribution

### 3.1 Send Now (Manual)
- Select contacts from the contact list (filtered by brand/location)
- Choose channel: Email or SMS
- Select message template
- Send immediately
- Creates `survey_invitations` records with status tracking

### 3.2 Share & QR
- Generate shareable survey link
- Download QR code for print materials
- Link includes event ID for attribution

### 3.3 Automated Distribution

**Webhook API:**
- Generate API key per brand
- Configure email and SMS templates
- External systems POST contact data to trigger survey sends
- API key management: create, revoke, view prefix/last-used

**SFTP File Import:**
- Configure connection: host, port, username, password, remote path
- Schedule: frequency (hourly, daily, weekly), timezone
- CSV column mapping (first_name, last_name, email, phone, etc.)
- Email and SMS template selection
- Sync history tracked in `sftp_sync_logs` with per-row success/error/skip counts

**Otto Onboard (CNP Triggers):**
- Link to CNP triggers defined per brand (`cnp_triggers` table)
- Configure email and SMS templates per trigger
- Triggers fire automatically when patients complete onboarding steps

### 3.4 SMS Constraints
- **Character limit: 320** across all components
- Character counter shown in real-time
- Warning displayed when approaching limit

---

## 4. NPS Dashboard

### 4.1 Metrics
- **NPS Score:** calculated as `% Promoters - % Detractors` (range: -100 to +100)
- **Surveys Sent / Completed / Response Rate**
- **Score Distribution:** promoter (9-10), passive (7-8), detractor (0-6) with counts and percentages
- **Delivery Issues:** bounced, throttled, unsubscribed counts

### 4.2 Visualizations
- Trend charts: NPS score over time (daily/weekly/monthly granularity)
- Score distribution donut/bar chart
- Channel performance table (email vs SMS completion rates)
- Critical feedback section: latest detractor responses requiring attention

### 4.3 Filters
- Global filters from TopNav: brand, location, date range (7/30/60/90 days or custom), event
- All dashboard data respects these filters

---

## 5. Responses (Questions Page)

### 5.1 Response List
- All follow-up question answers displayed with type-aware rendering:
  - **Scale:** horizontal bar with numeric value
  - **Select Multiple:** colored pills/badges
  - **Select One:** text with icon
  - **Free Response:** quoted text block
- NPS score badge (promoter green / passive amber / detractor red)
- Contact info, event name, submission date

### 5.2 Response Detail Modal
- Full NPS score display
- All answers with type-aware rendering
- **AI Categorization:** one-click to send feedback to `categorize-feedback` edge function
- **Manual Tag Assignment:** dropdown to assign/remove event-specific tags
- **Category Assignment:** assign feedback categories (separate from tags)
- **Internal Notes:** add/view notes per response (stored in `submission_notes`)

### 5.3 CSV Export
- Export all filtered responses
- Columns: contact name, email, phone, NPS score, each question answer, question type, tags, categories, submission date
- Question type column helps downstream analysis distinguish answer formats

---

## 6. Sent Logs

- Track full invitation lifecycle: `created → sent → delivered → opened → completed`
- Additional statuses: `bounced`, `failed`, `throttled`
- Columns: contact, event, channel, status, timestamps
- Filters: status, channel, event, brand, location, date range
- Sortable table with column visibility toggles

---

## 7. Reviews Module

### 7.1 Current Capabilities
- Aggregate Google Reviews per location
- Display: reviewer name, rating (1-5 stars), review text, date
- Respond to reviews inline (saves to `reviews.response_text`)
- Metrics: average rating, total reviews, response rate, 7-day trend

### 7.2 Planned Capabilities
- Facebook, Yelp, TripAdvisor review aggregation
- Per-location review channel configuration in `locations.review_channels_config`
- Automated review response suggestions

### 7.3 Review Channel Configuration
- Configured per location in Settings → Brands → Location detail
- Google: requires `google_place_id` and `gmb_link`
- Each channel: enabled/disabled toggle, platform-specific URLs

---

## 8. Contacts Module

### 8.1 Contact Management
- Contact list with: name, email, phone, brand, location, preferred channel, language, status, tags
- Add/edit contacts manually
- Contact detail modal with full history

### 8.2 CSV Import with Upsert
- Upload CSV file
- Auto-detect columns: first_name, last_name, email, phone, preferred_channel, preferred_language
- **Deduplication:** check for existing contact by email (primary) or phone (secondary) within same brand
- **Upsert behavior:** update existing records, insert new ones
- Toast shows: "X added, Y updated, Z errors"
- Import history: "Added" and "Errors" columns (not a combined "Result")

### 8.3 Duplicate Detection
- Scan for contacts sharing email or phone within same brand
- Auto-select oldest contact (earliest `created_at`) as primary
- "Set as primary" dropdown for manual override
- "Merge" per group or "Merge All" for bulk resolution
- Merge consolidates data from secondary contacts into primary, then deletes secondaries

### 8.4 Tags System
- Global tag list (`contact_tags` table)
- Assign/remove tags per contact via `contact_tag_assignments`
- Filter contacts by tag

### 8.5 Unsubscribe Management
- Separate "Unsubscribed" page listing contacts with `unsubscribed_at` set
- Unsubscribe records `unsubscribed_at` timestamp
- Unsubscribed contacts excluded from survey sends

---

## 9. Communication Module

### 9.1 Templates
- Email and SMS templates per brand
- Template fields: name, type (email/sms), subject (email only), body, variables
- Variable system: `{{first_name}}`, `{{last_name}}`, `{{brand_name}}`, `{{survey_link}}`, etc.
- Usage count tracked per template

### 9.2 Automation Rules
- Create rules that trigger based on survey responses:
  - **Trigger group:** promoters, passives, detractors, or all
  - **Feedback condition:** with feedback, without feedback, either
  - **Channel:** email or SMS
  - **Template:** select from brand's templates
  - **Delay hours:** wait N hours after response before sending
  - **Throttle days:** don't re-trigger for same contact within N days
- Activate/deactivate rules
- View automation logs with status and skip reasons

---

## 10. Settings Module

### 10.1 Profile
- Edit name, email, phone, timezone
- Avatar upload

### 10.2 Brands & Locations
- View/manage brands (super_admin only)
- Per brand: name, logo, subdomain, color scheme
- Per location: name, address, phone, timezone, GMB link, Google Place ID
- Review channel configuration per location

### 10.3 User Management
- Invite users: email, name, role assignment (built-in or custom)
- Brand and location access assignment
- Edit user roles and access
- Suspend/reactivate users
- Role statistics cards on Users page

### 10.4 Custom Roles
- Create custom roles with per-section permissions
- 10 sections: dashboard, questions, sent_logs, manage_events, integration, reviews, contacts, templates, brands, users
- 4 permission levels: no_access, view, edit, respond
- Edit/delete custom roles

---

## 11. Resources Module

- Admin-managed content library: playbook, guides, documents
- Resource types: `document`, `guide`, `playbook`
- Brand-level access control via `resource_brand_access` junction table
- Rich text content or file URL
- Status: published/draft
