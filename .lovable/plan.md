

## Plan: Complete Webhook Integration - Location ID Required + API Key Workflow

### Overview
Update the webhook section to make `location_id` required, add a locations reference table showing UUIDs for easy copying, remove Use Cases, and implement an API key generation workflow.

---

### Changes to `src/components/distribution/AutomatedSendsTab.tsx`

#### 1. Update Props Interface (line 45-48)

Add `brandId` to props so we can fetch event-associated locations:

```typescript
interface AutomatedSendsTabProps {
  eventId: string;
  events: Event[];
  brandId?: string; // Add to fetch locations
}
```

#### 2. Add Event Locations Query (after line 234)

Fetch locations associated with this event:

```typescript
// Fetch event locations for webhook reference
const { data: eventLocations = [] } = useQuery({
  queryKey: ['event-locations', eventId],
  queryFn: async () => {
    const { data: eventLocationIds } = await supabase
      .from('event_locations')
      .select('location_id')
      .eq('event_id', eventId);
    
    if (!eventLocationIds?.length) return [];
    
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .in('id', eventLocationIds.map(el => el.location_id))
      .order('name');
    
    return locations || [];
  },
  enabled: !!eventId,
});
```

#### 3. Update Webhook Payload Example (lines 164-182)

Move `location_id` from optional to required:

```javascript
const WEBHOOK_PAYLOAD_EXAMPLE = `{
  "event_id": "your-event-uuid",
  "location_id": "location-uuid",
  "contact": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "preferred_channel": "email",
    "preferred_language": "en",
    "tags": ["IVF Patient", "New Patient"],
    "external_id": "PAT-001234",
    "status": "active"
  },
  "channel": "preferred",
  "scheduling": {
    "type": "immediate",
    "delay_value": 0,
    "delay_unit": "hours"
  }
}`;
```

#### 4. Add Locations Reference Section (after Event ID section, ~line 527)

```text
┌────────────────────────────────────────────────────────────────┐
│  LOCATION IDs FOR THIS EVENT                                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Location Name      │  UUID                    │ [Copy]  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Midtown Clinic     │  8dc010b2-7fef-...       │  [📋]   │  │
│  │  NewMarket Center   │  c43fa3cd-b33f-...       │  [📋]   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  (Shows empty state if no locations configured)                │
└────────────────────────────────────────────────────────────────┘
```

Implementation:
- Table with Location Name, UUID, Copy button
- Clickable copy for each location ID
- Empty state: "No locations configured for this event. Add locations in Event Setup."

#### 5. Update Field Reference (lines 550-580)

**Move to REQUIRED FIELDS:**
```
• location_id — UUID of the location (see table above)
```

**Add to OPTIONAL FIELDS:**
```
• contact.external_id — Your system's patient/customer ID
• contact.status — Contact status (default: active)
```

**Updated structure:**

```
REQUIRED FIELDS
- event_id: UUID of the survey event (shown above)
- location_id: UUID of the location (see locations table above)
- contact.first_name: Contact's first name
- contact.last_name: Contact's last name
- contact.email OR contact.phone: At least one required

OPTIONAL FIELDS
- contact.preferred_channel: email, sms, or both (default: email)
- contact.preferred_language: Language code (default: en)
- contact.tags: Array of tag names (created if new)
- contact.external_id: Your system's patient/customer ID
- contact.status: Contact status (default: active)
- channel: Override send channel (preferred, email, or sms)
- scheduling.type: immediate (default) or delayed
- scheduling.delay_value: Delay amount (e.g., 2)
- scheduling.delay_unit: minutes, hours, or days

AUTOMATIC FIELDS
- brand_id: Automatically inherited from the event
```

#### 6. Remove Use Cases Section (lines 594-603)

Delete the entire Use Cases badges section.

#### 7. Replace "Coming Soon" with API Key Workflow (lines 605-611)

```text
┌────────────────────────────────────────────────────────────────┐
│  API AUTHENTICATION                                            │
│                                                                │
│  Include this header with every request:                       │
│  [Authorization: Bearer YOUR_API_KEY]                          │
│                                                                │
│  [+ Generate New API Key]                                      │
│                                                                │
│  Security note: Store API keys securely. Never expose          │
│  them in client-side code or public repositories.              │
└────────────────────────────────────────────────────────────────┘
```

Clicking "Generate New API Key" shows toast: "API key generation is being configured. Contact your administrator for API access."

#### 8. Add State for Location Copy (after line 193)

```typescript
const [copiedLocationId, setCopiedLocationId] = useState<string | null>(null);

const handleCopyLocationId = (locationId: string) => {
  navigator.clipboard.writeText(locationId);
  setCopiedLocationId(locationId);
  toast({ title: 'Location ID copied to clipboard' });
  setTimeout(() => setCopiedLocationId(null), 2000);
};
```

---

### Update to `src/pages/nps/EventDetail.tsx`

Pass `brandId` prop to AutomatedSendsTab (line 355):

```typescript
<AutomatedSendsTab 
  eventId={eventId!} 
  events={events.map((e) => ({ id: e.id, name: e.name }))} 
  brandId={eventData?.brand_id}
/>
```

---

### Summary of Changes

| Change | Type | File |
|--------|------|------|
| Add `brandId` to props | Props | AutomatedSendsTab.tsx |
| Add event locations query | Query | AutomatedSendsTab.tsx |
| Move `location_id` to required in payload | Update | AutomatedSendsTab.tsx |
| Add `external_id` and `status` to payload | Update | AutomatedSendsTab.tsx |
| Add Locations Reference table with copy buttons | New UI | AutomatedSendsTab.tsx |
| Update Field Reference (location required) | Update | AutomatedSendsTab.tsx |
| Add `external_id`, `status` to optional fields | Update | AutomatedSendsTab.tsx |
| Remove Use Cases section | Delete | AutomatedSendsTab.tsx |
| Replace Coming Soon with API workflow | Update | AutomatedSendsTab.tsx |
| Add location copy handler + state | Add | AutomatedSendsTab.tsx |
| Pass brandId prop to AutomatedSendsTab | Update | EventDetail.tsx |

---

### Visual Result

After Event ID section, users will see:

```
┌─────────────────────────────────────────────────────────────┐
│ Location IDs for this Event                                 │
│                                                             │
│ Location Name          UUID                          Copy   │
│ ─────────────────────────────────────────────────────────── │
│ Midtown Clinic         8dc010b2-7fef-4118-b704...    [📋]   │
│ NewMarket Center       c43fa3cd-b33f-425e-a144...    [📋]   │
└─────────────────────────────────────────────────────────────┘
```

This makes it easy for users to:
1. See which locations are valid for this event
2. Copy the exact UUID needed for their webhook integration

