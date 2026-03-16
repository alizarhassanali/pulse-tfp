

## Plan: Two Changes

### 1. Rename "Both" to "Survey Submitted Channel" in Google Review Reminder

**File: `src/pages/nps/CreateEvent.tsx`** (line 1587)
- Change `<SelectItem value="both">Both (based on contact channel)</SelectItem>` to `<SelectItem value="both">Survey Submitted Channel</SelectItem>`
- Update the helper text below (line 1591) to clarify: "Sends via the same channel the survey was originally delivered through"

### 2. Update SMS character limit from 160 to 320 across all components

**Files to update** (replace all `160` references with `320`):
- `src/components/distribution/SendWizard.tsx` — lines 928, 932, 933, 950 (description, badge, maxLength)
- `src/components/distribution/SftpIntegrationCard.tsx` — lines 442, 444 (maxLength, counter)
- `src/components/distribution/OttoOnboardCard.tsx` — lines 346, 348 (counter, threshold)
- `src/components/distribution/WebhookIntegrationCard.tsx` — lines 439, 440, 442 (counter, threshold, split calc)

