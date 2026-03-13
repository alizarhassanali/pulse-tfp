

## Plan: Reorganize Event Detail Tabs into Two Views

### What Changes
The current Event Detail page has 3 top-level tabs: "Send Now", "Automated Sends", "Share & QR". The user wants:

- **"Send" context** (tab `distribution`): Shows 2 sub-tabs — "Send Now" and "Share & QR"
- **"Automate" context** (tab `automated`): Shows the Automated Sends listing directly (no sub-tabs needed, just the AutomatedSendsTab content)

### Implementation

**File: `src/pages/nps/EventDetail.tsx`**
- Replace the 3-tab `TabsList` with a **2-tab** layout: "Send" and "Automate"
- Inside the "Send" `TabsContent`, nest a secondary `Tabs` component with two sub-tabs: "Send Now" (SendWizard) and "Share & QR" (ShareLinkTab)
- The "Automate" `TabsContent` renders `AutomatedSendsTab` directly as before
- Update `defaultTab` logic: `location.state?.tab` of `'distribution'` maps to the Send view, `'automated'` maps to Automate view

**File: `src/pages/nps/ManageEvents.tsx`**
- No changes needed — existing navigation with `{ state: { tab: 'distribution' } }` and `{ state: { tab: 'automated' } }` will continue to work with the new 2-tab structure

