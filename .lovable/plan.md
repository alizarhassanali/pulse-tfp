

## Plan: Google Review Reminder Configuration in Event Setup

### Overview
Add a new section to Step 4 (Thank You Page) of the event creation wizard that lets admins configure an automatic follow-up reminder when a respondent does NOT click the Google Review button. The config is stored in the event's existing `config` JSONB column — no new tables needed.

### Data Model
Store the reminder settings in the event's `config` JSONB field under a `google_review_reminder` key:

```text
config.google_review_reminder = {
  enabled: boolean,
  delay_hours: number,          // e.g. 24, 48, 72
  channel: 'email' | 'sms' | 'both',
  email_subject: string,
  email_body: string,
  sms_body: string
}
```

No database migration needed — the `config` column is already JSONB and flexible.

### Frontend Changes

**`src/pages/nps/CreateEvent.tsx`**

1. **Extend `EventFormData`** — add a `googleReviewReminder` field:
   - `enabled: boolean`
   - `delayHours: number` (default 24)
   - `channel: 'email' | 'sms' | 'both'`
   - `emailSubject: string`
   - `emailBody: string`
   - `smsBody: string`

2. **Add UI section in `renderStep4()`** — after the three score-group cards, add a "Google Review Reminder" card that only appears when any score group has a `google_review` button configured. The card contains:
   - Enable/disable toggle
   - Delay selector (e.g. 1 hour, 2 hours, 4 hours, 12 hours, 24 hours, 48 hours, 72 hours)
   - Channel select (Email / SMS / Both) — based on the channel the respondent was contacted through
   - Collapsible Email section: subject + body textarea with variables ({first_name}, {brand_name}, {location_name}, {google_review_link})
   - Collapsible SMS section: body textarea with same variables
   - Helper text explaining: "This reminder is sent only if the respondent did NOT click the Google Review button on the thank you page."

3. **Save logic** — serialize `googleReviewReminder` into `config.google_review_reminder` when saving the event.

4. **Edit mode** — load `google_review_reminder` from the event's config when editing.

5. **Review step (Step 5)** — show a summary of the reminder config if enabled.

### Files Modified
- `src/pages/nps/CreateEvent.tsx` — form data type, default values, Step 4 UI, save/load logic, Step 5 review summary

