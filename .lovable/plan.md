

## Plan: Remove Brand Subdomain & Add Location Contact Number

### Overview
Two changes are requested:
1. Remove the subdomain option from brand settings (currently on the Details tab of the brand form and displayed in the brands table)
2. Add a contact phone number field for each location that can be used as a `{location_phone}` variable in email/SMS templates

---

### Database Changes

#### Add `phone` Column to Locations Table

```sql
ALTER TABLE locations ADD COLUMN phone text;
```

This will store the contact phone number for each location.

---

### Changes to `src/pages/settings/Brands.tsx`

#### 1. Update Location Interface (line 32-42)

Add `phone` field to the Location interface:

```typescript
interface Location {
  id: string;
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone: string;  // NEW
  brand_id?: string;
}
```

#### 2. Remove Subdomain from FormState Interface (line 53-58)

Remove the `subdomain` field:

```typescript
interface FormState {
  name: string;
  colors: BrandColors;
  locations: Location[];
}
```

#### 3. Update Location Query Mapping (lines 91-101)

Add `phone` to the location mapping:

```typescript
.map(loc => ({
  id: loc.id,
  name: loc.name,
  address_line1: loc.address_line1 || '',
  address_line2: loc.address_line2 || '',
  city: loc.city || '',
  state_province: loc.state_province || '',
  postal_code: loc.postal_code || '',
  country: loc.country || 'Canada',
  phone: loc.phone || '',  // NEW
  brand_id: loc.brand_id || undefined,
}))
```

#### 4. Remove Subdomain from Save Mutation (lines 115-119)

Remove `subdomain` from brand payload:

```typescript
const brandPayload = {
  name: brand.name,
  colors: brand.colors as unknown as Json,
};
```

#### 5. Update Location Payload in Save Mutation (lines 145-153 and 174-182)

Add `phone` to location payloads:

```typescript
const locationPayload = {
  name: loc.name,
  address_line1: loc.address_line1 || null,
  address_line2: loc.address_line2 || null,
  city: loc.city || null,
  state_province: loc.state_province || null,
  postal_code: loc.postal_code || null,
  country: loc.country || 'Canada',
  phone: loc.phone || null,  // NEW
};
```

#### 6. Update handleEdit Function (lines 229-239)

Remove subdomain from form initialization:

```typescript
setForm({
  name: brand.name,
  colors: brand.colors || defaultColors,
  locations: brand.locations || [],
});
```

#### 7. Update addLocation Function (lines 245-261)

Add `phone` to new location defaults:

```typescript
setForm({
  ...form,
  locations: [...form.locations, { 
    id: newId, 
    name: '', 
    address_line1: '',
    address_line2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'Canada',
    phone: '',  // NEW
  }],
});
```

#### 8. Update openCreateModal Function (lines 286-291)

Remove subdomain from initial form state:

```typescript
setForm({ name: '', colors: defaultColors, locations: [] });
```

#### 9. Remove Subdomain Column from Table (lines 311-312, 344-346)

Remove the subdomain column header and cell from the brands table:

- Remove `<SortableTableHead sortKey="subdomain">Subdomain</SortableTableHead>`
- Remove the table cell displaying `{b.subdomain ? ... : '—'}`

#### 10. Remove Subdomain Input from Details Tab (lines 421-433)

Remove the entire subdomain input section from the Details tab in the dialog.

#### 11. Add Contact Phone Field to Location Form (after line 551)

Add a phone input field in the location collapsible content:

```tsx
<div className="space-y-1">
  <Label className="text-xs">Contact Phone</Label>
  <Input
    placeholder="+1-555-123-4567"
    value={loc.phone}
    onChange={e => updateLocation(idx, 'phone', e.target.value)}
    className="h-8"
  />
</div>
```

---

### Changes to `src/components/distribution/AutomatedSendsTab.tsx`

#### 1. Add `{location_phone}` to Available Variables (lines 990-1000)

Update the available variables display to include `{location_phone}`:

```tsx
<p className="text-xs text-muted-foreground">
  <span className="font-medium text-foreground">Available variables:</span>{' '}
  <code className="bg-muted px-1 rounded">{'{first_name}'}</code>{' '}
  <code className="bg-muted px-1 rounded">{'{last_name}'}</code>{' '}
  <code className="bg-muted px-1 rounded">{'{brand_name}'}</code>{' '}
  <code className="bg-muted px-1 rounded">{'{location_name}'}</code>{' '}
  <code className="bg-muted px-1 rounded">{'{location_phone}'}</code>{' '}  {/* NEW */}
  <code className="bg-muted px-1 rounded">{'{survey_link}'}</code>{' '}
  <code className="bg-muted px-1 rounded">{'{unsubscribe_link}'}</code>
</p>
```

---

### Changes to `src/types/database.ts`

#### Update Location Interface (lines 20-31)

Add `phone` field:

```typescript
export interface Location {
  id: string;
  brand_id: string;
  name: string;
  address: string | null;
  timezone: string;
  gmb_link: string | null;
  google_place_id?: string | null;
  google_review_config?: LocationGoogleReviewConfig | null;
  phone?: string | null;  // NEW
  created_at: string;
  updated_at: string;
  brand?: Brand;
}
```

---

### Summary of Changes

| File | Change |
|------|--------|
| Database Migration | Add `phone` column to `locations` table |
| `src/pages/settings/Brands.tsx` | Remove subdomain from brand form and table, add phone field to location form |
| `src/components/distribution/AutomatedSendsTab.tsx` | Add `{location_phone}` to available variables |
| `src/types/database.ts` | Add `phone` field to Location interface |

---

### Result

After implementation:
- The brand form will no longer show the subdomain input field
- The brands table will no longer display the subdomain column
- Each location will have a "Contact Phone" field in the location form
- The `{location_phone}` variable will be available for use in email and SMS templates for webhook/API triggered surveys

