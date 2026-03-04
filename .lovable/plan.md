

## Plan: Playbook Page with Left Navigation and Right Content

### Overview
Create a new dedicated `/playbook` page with a two-panel layout: left sidebar with section titles as a navigation menu, and right panel showing the corresponding content. The content will match what's already in `PlaybookContent.tsx` (Promoters, Passives, Detractors, Escalation Guidelines). The Help & Support menu's "Response Playbook" option will navigate to this page instead of opening a dialog.

---

### Changes

#### 1. Create `src/pages/Playbook.tsx`
New page component with a split layout:
- **Left panel** (~250px): A vertical nav listing section titles (Promoters 9-10, Passives 7-8, Detractors 0-6, Escalation Guidelines). Clicking a title scrolls to or displays that section on the right. Active section highlighted.
- **Right panel** (flex-1): Scrollable content area with all playbook sections rendered. Uses `ScrollArea` with section anchors. Includes the download button at the top.
- Uses `useRef` + `scrollIntoView` for navigation, or a simple state-based active section approach.
- Includes a `PageHeader` with title "Feedback Response Playbook" and download button.

#### 2. Add Route in `src/App.tsx`
Add route inside the `MainLayout`:
```tsx
<Route path="playbook" element={<Playbook />} />
```

#### 3. Update `src/components/layout/HelpSupportMenu.tsx`
Change the "Response Playbook" menu item to navigate to `/playbook` using `useNavigate()` instead of opening a dialog. Remove the dialog-related state and `PlaybookContent` import.

#### 4. Update `src/components/layout/Sidebar.tsx`
Add a "Playbook" nav item under the Help & Support area or as a standalone link, so users can also access it from the sidebar navigation directly (the Help & Support menu item will still work as well).

### Page Layout

```text
┌─────────────────────────────────────────────┐
│  PageHeader: Feedback Response Playbook     │
├──────────┬──────────────────────────────────┤
│ Sections │  Content                         │
│          │                                  │
│ ● Intro  │  [Active section content]        │
│ ○ 9-10   │                                  │
│ ○ 7-8    │  Templates, guidelines,          │
│ ○ 0-6    │  response examples...            │
│ ○ Escal. │                                  │
│          │                                  │
│ Download │                                  │
└──────────┴──────────────────────────────────┘
```

### Result
- Dedicated full page for the playbook with easy section navigation
- Accessible from Help & Support menu and sidebar
- Same content as the current `PlaybookContent.tsx`, reformatted for the two-panel layout
- Download link for the original DOCX file preserved

