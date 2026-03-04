

## Plan: Resource Management with Brand Access Control

### Overview
Create a system where admins can add/manage resources (playbooks, guides, docs) and control which brands can view each resource. The Resources hub page becomes a dynamic listing from the database, with an "Add Resource" workflow for admins.

### Database Changes

**New table: `resources`**
- `id` uuid PK
- `title` text NOT NULL
- `description` text
- `type` text (playbook, guide, document)
- `icon` text (lucide icon name)
- `content` text (rich text / markdown body)
- `file_url` text (optional downloadable file)
- `created_by` uuid
- `created_at`, `updated_at` timestamps
- `status` text default 'published' (draft/published)

**New table: `resource_brand_access`**
- `resource_id` uuid FK → resources
- `brand_id` uuid FK → brands
- Composite PK on (resource_id, brand_id)

**RLS Policies:**
- Super admins can manage all resources
- Users can view resources where their brand has access (via `resource_brand_access`) or resource has no brand restrictions (visible to all)
- Super admins can manage `resource_brand_access`

### Frontend Changes

**1. `src/pages/Resources.tsx`** — Rewrite to fetch resources from DB
- Query `resources` table joined with `resource_brand_access`
- Show "Add Resource" button for super admins / users with edit permission
- Each resource card links to `/resources/:id`
- Keep the existing playbook as a seeded/hardcoded entry that links to `/resources/playbook`

**2. New `src/components/resources/CreateResourceModal.tsx`**
- Dialog with form fields: title, description, type (select), content (textarea/markdown)
- Brand access multi-select: pick which brands can see this resource, or "All Brands"
- Optional file upload field
- Save to `resources` + `resource_brand_access` tables

**3. New `src/pages/ResourceDetail.tsx`** — Generic resource viewer
- Fetch resource by ID from DB
- Render content as formatted text with sections
- Breadcrumb navigation back to Resources hub
- Download button if `file_url` exists
- Edit/delete buttons for admins

**4. `src/App.tsx`** — Add route `/resources/:id` for dynamic resource pages
- Keep `/resources/playbook` as a special hardcoded route for the existing playbook

**5. `src/components/layout/Sidebar.tsx`** — Add "Resources" nav item linking to `/resources`

### Files Modified
- `src/pages/Resources.tsx` — dynamic listing from DB + add button
- `src/App.tsx` — new route for `/resources/:id`
- `src/components/layout/Sidebar.tsx` — add Resources nav item
- New: `src/components/resources/CreateResourceModal.tsx`
- New: `src/pages/ResourceDetail.tsx`
- DB migration: create `resources` and `resource_brand_access` tables with RLS

