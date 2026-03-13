

## Plan: Consolidate Event Detail into 2 Tabs

### Current State
3 tabs: **Send Now** | **Automated Sends** | **Share & QR**

### Target State
2 tabs:
- **Send Now** — Contains the SendWizard + ShareLinkTab (stacked vertically)
- **Automate** — Contains the AutomatedSendsTab (unchanged)

### Changes

**File: `src/pages/nps/EventDetail.tsx`**
1. Reduce `TabsList` from 3 tabs to 2: "Send Now" and "Automate"
2. In the `distribution` TabsContent, render both `<SendWizard />` and `<ShareLinkTab />` stacked with a separator between them
3. Remove the separate `share` TabsContent
4. Update the default tab logic — if coming from "Automate" button on Manage Events, land on `automated`; otherwise `distribution`
5. Update tab icons: Send for "Send Now", Server for "Automate"

