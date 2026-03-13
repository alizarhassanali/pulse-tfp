

## Plan: Add Phone & Email Validation During CSV Import

### Problem
1. Phone numbers in CSV files opened in Excel get corrupted to scientific notation (e.g., `1.23457E+12`). These invalid values are imported silently.
2. If preferred method is SMS (or Both), phone should be required and valid. If preferred method is Email (or Both), email should be required and valid.

### Changes in `src/pages/contacts/AllContacts.tsx`

**Add phone number validation** (after line ~362, before the brand resolution):
- Reject phones that match scientific notation patterns (e.g., `E+`, `e+`)
- Reject phones that contain non-phone characters (only allow digits, `+`, `-`, spaces, parentheses, dots)
- Reject phones shorter than 7 digits (after stripping non-digit chars)

**Add cross-validation between preferred channel and contact info** (after line ~398, after preferred_channel is determined):
- If `preferred_channel` is `sms` or `both` and phone is missing/invalid → skip row with error: "Phone is required when preferred method includes SMS"
- If `preferred_channel` is `email` or `both` and email is missing/invalid → skip row with error: "Email is required when preferred method includes Email"

**Update import instructions** in the modal UI to mention:
- Phone format tip: "Ensure phone numbers are stored as text in your spreadsheet to avoid scientific notation (e.g., format the column as Text before entering numbers)"

### Files Modified
- `src/pages/contacts/AllContacts.tsx`

