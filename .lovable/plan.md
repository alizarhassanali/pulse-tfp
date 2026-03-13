

## Plan: Improve CSV Import Name Field Handling

### Problem
The CSV template only has a `full_name` column, but the database stores `first_name` and `last_name` separately. The parsing logic already splits `full_name` on spaces, but this is fragile (e.g., "Mary Jane Watson" would become first="Mary", last="Jane Watson"). Additionally, the template doesn't support separate `first_name`/`last_name` columns even though the code already handles them as a fallback.

### Changes in `src/pages/contacts/AllContacts.tsx`

1. **Update CSV template** to use `first_name` and `last_name` as separate columns instead of `full_name`:
   - Headers: `first_name, last_name, email, phone, brand, location, preferred_sms, preferred_email, preferred_language, tags`
   - Example row: `John, Doe, john@example.com, ...`

2. **Update the import instructions** (Step 2 in the modal) to list `first_name (required)` and `last_name` instead of `full_name (required)`.

3. **Keep backward compatibility** in the parsing logic — the existing code already handles both `full_name` and `first_name`/`last_name`, so users with old CSVs using `full_name` will still work fine.

### Files Modified
- `src/pages/contacts/AllContacts.tsx` — template download, import instructions text

