

## Review: Import History Modal

After reviewing `ImportHistoryModal.tsx`, I found two improvements needed for consistency with the recent import changes:

### Issues Found

1. **No brand context filtering** — The history query fetches ALL imports (`select('*')`) regardless of which brand is currently selected. If a user has a brand selected in the global filter, they should only see imports for that brand. The `contact_imports` table already has a `brand_id` column that gets populated during import.

2. **No brand name displayed** — When viewing import history (especially in "All Brands" mode), there's no indication of which brand each import was for. Adding a "Brand" column would provide useful context.

### Changes

**`src/components/contacts/ImportHistoryModal.tsx`**
- Accept `effectiveBrandId` as an optional prop
- Filter the query by `brand_id` when a brand is selected
- Add a "Brand" column to the table (join brands table or pass brand list as prop)
- Include `brand_id` in the query key so it refetches on brand change

**`src/pages/contacts/AllContacts.tsx`**
- Pass `effectiveBrandId` to `ImportHistoryModal`

### Files Modified
- `src/components/contacts/ImportHistoryModal.tsx`
- `src/pages/contacts/AllContacts.tsx`

