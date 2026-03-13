

## Plan: Improve Automated Sends Tab UI

### Current Issues
The tab is a 1,377-line monolithic component with two large collapsible cards that feel dense and flat. Key problems:
- Both sections are collapsed by default — users see two plain cards with no visual status indicators
- The SFTP and Webhook sections mix configuration, documentation, and templates into one long scroll
- No visual hierarchy or step-based guidance
- Connection status is buried inside the collapsible

### UI Improvements

#### 1. Add Status Indicators to Collapsed Card Headers
Show connection state (active/inactive badge) and key stats directly on the collapsed header so users get at-a-glance info without expanding:
- **Webhook card header**: Show active API key count badge and "configured" / "not configured" status
- **SFTP card header**: Show connection status badge (Connected/Disconnected) and next sync schedule

#### 2. Reorganize Webhook Section with Internal Tabs
Replace the single long scroll with a clean 3-tab layout inside the Webhook card:
- **Setup** — Event ID, Location IDs, Endpoint URL, Payload example, Field Reference, Behavior
- **Authentication** — API key management (generate, list, revoke)
- **Templates** — Email and SMS message templates with save button

#### 3. Reorganize SFTP Section with Internal Tabs
Same pattern for SFTP:
- **Connection** — SFTP credentials, connection status, test button
- **Schedule & Mapping** — Sync schedule (days, time, timezone), event mapping, channel rule, file format, download template
- **Templates** — Email/SMS message templates with save button

#### 4. Visual Polish
- Add subtle colored left-border accents to the cards (green when active, gray when inactive)
- Use step numbers/icons in the "How It Works" section as a horizontal stepper instead of a vertical list
- Add empty state illustrations when no API keys exist
- Improve the sync health dots with tooltips showing date and status on hover

### Files Modified
- `src/components/distribution/AutomatedSendsTab.tsx` — Restructure into sub-tabs, add header status indicators, visual polish

### Technical Notes
- Uses existing `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` components already in the project
- No new dependencies needed
- No database or backend changes

