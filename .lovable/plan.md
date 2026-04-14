

## Plan: Generate Professional OttoPulse PRD as DOCX

Create a polished, stakeholder-ready Product Requirements Document in Word format, pulling all content from the existing `docs/requirements.md`, `docs/success.md`, and `docs/workflows.md` files.

### Document Structure

1. **Cover Page** — OttoPulse PRD, version, date, confidentiality notice
2. **Table of Contents**
3. **Product Overview** — vision, target users, brands served
4. **NPS Surveys Module** — 5-step wizard, question types, multi-language, answer storage
5. **Survey Distribution** — Manual, QR, Webhook, SFTP, Otto Onboard, SMS constraints
6. **NPS Dashboard** — metrics, visualizations, filters
7. **Responses & Feedback** — type-aware rendering, AI categorization, export
8. **Sent Logs** — invitation lifecycle tracking
9. **Reviews Module** — current and planned capabilities, channel config
10. **Contacts Module** — management, CSV upsert, duplicate detection, tags, unsubscribe
11. **Communication** — templates, automation rules
12. **Settings** — profile, brands/locations, users, custom roles (RBAC matrix table)
13. **Resources Module** — content library
14. **Success Metrics** — North Star, module KPIs, targets, reporting cadence
15. **Appendix** — key workflows summary, RBAC permission matrix

### Styling
- US Letter, 1-inch margins
- Arial font throughout
- Navy blue headings (#2B4570) matching the app's secondary color
- Professional tables with light blue header rows
- Bullet lists using proper Word numbering (no unicode)

### Implementation
- Use `docx-js` (npm) to generate the DOCX programmatically
- Write script to `/tmp/generate_prd.js`, output to `/mnt/documents/OttoPulse_PRD.docx`
- Validate with the docx skill's validation script
- Convert to images for QA review

### Technical Detail
Single Node.js script using the `docx` package. All content derived from the existing markdown docs — no invented requirements. Tables formatted with `WidthType.DXA` for cross-platform compatibility.

