

## Plan: Help & Support Menu with Playbook Viewer

### Overview
Replace the current single "Help & Support" link in the sidebar with a popover menu offering two options: **Chat Support** and **Playbook**. The Playbook option opens a dialog/drawer displaying the content of the uploaded OttoPulse Feedback Response Playbook. Since the DOCX failed to parse, we'll copy it to `public/` for download and also hardcode the playbook content into a dedicated component for in-app viewing.

### Changes

#### 1. Copy the DOCX file to `public/`
- Copy `user-uploads://OttoPulse_Feedback_Response_Playbook.docx` → `public/docs/OttoPulse_Feedback_Response_Playbook.docx`
- This allows users to download the original file if needed

#### 2. Create `src/components/layout/PlaybookContent.tsx`
- A component containing the playbook content rendered as formatted text/sections
- Displayed inside a full-height dialog/drawer
- Includes a "Download PDF" link to the DOCX in `/docs/`
- Content will be structured with collapsible sections for each scenario (Promoter, Passive, Detractor responses, escalation paths, etc.)

#### 3. Create `src/components/layout/HelpSupportMenu.tsx`
- A Popover component that replaces the current `<a href="#">` help link
- Two menu items:
  - **Chat Support** — opens `#` (placeholder, or could trigger an intercom-style action)
  - **Playbook** — opens a Dialog containing `PlaybookContent`
- Handles both collapsed and expanded sidebar states (uses Tooltip when collapsed, shows labels when expanded)

#### 4. Update `src/components/layout/Sidebar.tsx`
- Replace the Help Link section (lines 380-405) with the new `<HelpSupportMenu collapsed={collapsed} />` component
- Add `BookOpen` icon import from lucide-react for the Playbook option

### UI Behavior

**Expanded sidebar**: Clicking "Help & Support" opens a popover with two items:
- 💬 Chat Support
- 📖 Playbook (opens a full-screen dialog with playbook content + download link)

**Collapsed sidebar**: Same behavior via popover anchored to the icon, with tooltip on hover.

### Playbook Content Structure
Since the DOCX couldn't be parsed automatically, I'll need the user to confirm the content. However, I'll structure the component to display the playbook as a reference document with:
- Title and introduction
- Sections for each feedback category
- Response templates
- Download link for the original DOCX

