

## Plan: Redesign Playbook Page with Visual Polish

### What changes

Rewrite `src/pages/Playbook.tsx` with these design improvements:

**Left Navigation**
- Add section number indicators as small colored circles/dots
- Group sections visually (e.g., "Foundation" for 1-4, "Response Paths" for 5-6, "Governance" for 7-12) with subtle group labels
- Add a progress indicator showing how far the user has scrolled
- Slightly wider nav (~280px) with better spacing

**Right Content**
- Add a hero/banner area at the top with a gradient background (using brand colors), playbook title, subtitle, and download button
- Use card-based layouts instead of flat sections -- each section wrapped in a subtle card with rounded corners and soft shadow
- Response Library (section 6): Use a tabbed interface (Tabs component) to switch between NPS and Google paths instead of one long list
- Response items: Add a "copy" button on hover so users can quickly copy response text
- Operational Guardrails (section 7): Style DO/DON'T as green-tinted and red-tinted cards with icons instead of plain emoji
- SLA section: Display as 3 metric cards in a row instead of a bullet list
- Tables: Add alternating row colors for better readability
- Add subtle dividers or spacing between major section groups

**General**
- Better typography hierarchy: section titles with a left accent border
- Smoother scroll behavior with a scroll-to-top button
- Add lucide icons next to section titles for visual variety (e.g., Users for Roles, BookOpen for Purpose, Shield for Legal, etc.)

### Files modified
- `src/pages/Playbook.tsx` -- full redesign of layout and styling

