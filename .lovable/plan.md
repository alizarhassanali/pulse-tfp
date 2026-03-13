

## Problem

Users can't discover the "Automated Sends" feature because it's buried inside the Event Detail page behind a tab. The current flow requires: Navigate to Events → Click "Send" on an event card → Land on "Send Now" tab → Switch to "Automated Sends" tab. That's 3-4 clicks with no visible hint that automation config lives there.

## Solution

Two changes to make automated sends discoverable:

### 1. Add "Automate" button to event cards on Manage Events page
Next to the existing "Edit" and "Send" buttons on each event card, add an "Automate" button (with a Server icon) that navigates directly to the event detail page with the `automated` tab pre-selected.

**File**: `src/pages/nps/ManageEvents.tsx`
- Add a third button in the card actions row: `<Button onClick={() => navigate(/nps/events/${event.id}, { state: { tab: 'automated' } })}>Automate</Button>`
- Change the 2-button layout to a 3-button row (reduce size to fit)

### 2. Add sidebar sub-item or contextual link for Automation
Add a tooltip or small label on the "Send" button in ManageEvents to indicate it includes automation options. Update the button label from "Send" to "Send / Automate" or add a dropdown split-button with both options.

**Recommended approach**: Convert the "Send" button into a split button with a dropdown:
- Primary click → goes to Send Now tab (current behavior)
- Dropdown arrow → shows "Send Now" and "Automate Sends" options

**File**: `src/pages/nps/ManageEvents.tsx`
- Replace the single Send button with a button group: primary "Send" + dropdown with "Send Now" and "Automate" options

### 3. Add a visual indicator on event cards showing automation status
Show a small badge or icon on the event card if any integrations (webhook/SFTP/Otto Onboard) are configured for that event, making it obvious automation exists as a feature.

**File**: `src/pages/nps/ManageEvents.tsx`
- Query integrations data alongside events
- Show a subtle "Automated" badge or Server icon on cards that have active integrations

### Files to modify
- `src/pages/nps/ManageEvents.tsx` — Add automate button/dropdown and integration status indicator to event cards

