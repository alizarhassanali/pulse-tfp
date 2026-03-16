

## 4 Issues to Fix

### 1. CSV Import: Upsert Instead of Always Inserting

**Problem**: Re-uploading the same contact CSV creates duplicates instead of updating existing contacts.

**Fix** in `src/pages/contacts/AllContacts.tsx` `handleImport()` (around line 444):
- Before inserting, check if a contact with the same email OR phone already exists in the same brand.
- If found, **update** the existing contact's fields instead of inserting a new row.
- Logic: query `contacts` table filtered by `brand_id` + matching `email` (or `phone` if no email). If match found, use `.update()` on that id; otherwise `.insert()`.
- Track separate counters: `created`, `updated`, `skipped` — and surface them in the toast and import record.
- Update the `contact_imports` table to reflect the new counts (add `updated_count` later, or encode in the existing success_count with a note).

### 2. Rethink Duplicate Detection Workflow

**Problem**: The current modal is complex — user must pick a "primary" contact via radio buttons and click merge per group. This is confusing.

**New workflow**:
- Remove the radio-button "pick primary" pattern.
- Instead, show each duplicate group as a simple list with a summary: "2 contacts share email john@example.com".
- Auto-select the **oldest** contact (earliest `created_at`) as primary by default, with a small "Change primary" link if needed.
- Add a **"Merge All"** button at the top to merge all detected duplicate groups in one action (using the auto-selected primaries).
- Keep individual "Merge" per group for selective merging.
- Simplify the contact cards — show only name, email, phone, created date (remove avatar, tags, brand/location detail from the card).

**Files**: `src/components/contacts/DuplicateDetectionModal.tsx`

### 3. Import History "Result" Column — Make It Clearer

**Problem**: The "Result" column shows `5 / 10 (3 errors)` which is ambiguous — is 5 the success or total?

**Fix** in `src/components/contacts/ImportHistoryModal.tsx`:
- Replace the single "Result" column with two clear columns: **"Added"** and **"Errors"**.
- "Added" shows the green success count (e.g., `5 added`). Once upsert is implemented, show `3 added, 2 updated`.
- "Errors" shows error count with a red badge, or a check mark if zero.
- This replaces the confusing `success / total (N errors)` format.

### 4. Collapse Accordion on Save (SFTP, Webhook, Otto Onboard)

**Problem**: After saving configuration in any integration card, the accordion stays open.

**Fix**: Each card manages its own `isOpen` state. The parent (`AutomatedSendsTab`) calls `onSave` which triggers a mutation. On success, we need to collapse.

**Approach**: Add an `onSaveSuccess` callback prop to each card, or have the parent pass a ref/signal. Simpler: convert `onSave` to return a promise, or add a new prop `collapsed` controlled by parent.

**Simplest fix**: In `AutomatedSendsTab.tsx`, change the `onSave` callbacks to also trigger collapse by passing a callback. Since the cards own `isOpen` state internally, the cleanest approach is to add an `onSaveComplete` prop to each card and call `setIsOpen(false)` inside the card when save succeeds.

- `SftpIntegrationCard`: Add `onSaveComplete?: () => void` prop. In the component, wrap `onSave` to also call `setIsOpen(false)` after.
- Same for `OttoOnboardCard` and `WebhookIntegrationCard`.
- In `AutomatedSendsTab`, the mutation `onSuccess` callbacks already exist — pass a `onSaveComplete` callback from parent that the card uses, OR simpler: let the card detect save completion via `savePending` going from `true` to `false` with a `useEffect`.

**Cleanest**: Use a `useEffect` in each card watching `savePending` transition from `true` → `false` to auto-collapse:
```typescript
const prevPending = useRef(props.savePending);
useEffect(() => {
  if (prevPending.current && !props.savePending) {
    setIsOpen(false);
  }
  prevPending.current = props.savePending;
}, [props.savePending]);
```

### Files to Modify
| File | Change |
|---|---|
| `src/pages/contacts/AllContacts.tsx` | Upsert logic in `handleImport()` |
| `src/components/contacts/DuplicateDetectionModal.tsx` | Simplified workflow with auto-primary and merge-all |
| `src/components/contacts/ImportHistoryModal.tsx` | Split "Result" into "Added" and "Errors" columns |
| `src/components/distribution/SftpIntegrationCard.tsx` | Collapse on save via `useEffect` |
| `src/components/distribution/OttoOnboardCard.tsx` | Collapse on save via `useEffect` |
| `src/components/distribution/WebhookIntegrationCard.tsx` | Collapse on save via `useEffect` |

