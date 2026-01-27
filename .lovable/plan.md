

## Updated Plan: Collapsible Webhook & SFTP Sections with Complete Workflow

### Overview
Update the Automated Sends tab to make both SFTP and Webhook sections collapsible (collapsed by default), reorder to show Webhook first, and define a complete webhook workflow with all necessary fields.

---

### Changes to `src/components/distribution/AutomatedSendsTab.tsx`

#### 1. Add Imports (line 6)

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Copy, Check } from 'lucide-react';
```

#### 2. Add State Variables (after line 182)

```typescript
const [webhookOpen, setWebhookOpen] = useState(false);
const [sftpOpen, setSftpOpen] = useState(false);
const [copiedEndpoint, setCopiedEndpoint] = useState(false);
const [copiedEventId, setCopiedEventId] = useState(false);
```

#### 3. Reorder Sections: Webhook First, Then SFTP

Move Webhook section before SFTP section in the render.

#### 4. Complete Webhook Workflow Content

Replace "Coming Soon" with full workflow documentation:

```text
┌──────────────────────────────────────────────────────────────────────┐
│  [▼] Webhook / API Trigger                                           │
├──────────────────────────────────────────────────────────────────────┤
│  Trigger surveys via API calls from your CRM or other systems        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  HOW IT WORKS                                                  │  │
│  │                                                                │  │
│  │  1. Copy Your Event ID                                         │  │
│  │     Use the event ID below to identify which survey to trigger │  │
│  │                                                                │  │
│  │  2. Generate API Key                                           │  │
│  │     Create an API key to authenticate your webhook requests    │  │
│  │                                                                │  │
│  │  3. Send Contact Data                                          │  │
│  │     POST contact info to our endpoint - we'll create/update    │  │
│  │     the contact and trigger the survey                         │  │
│  │                                                                │  │
│  │  4. Track Responses                                            │  │
│  │     View delivery status and responses in Sent Logs            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Event ID for this Survey:                                     │  │
│  │  [abc123-def456-...] [Copy]                                    │  │
│  │  Use this ID in your webhook payload to trigger this event     │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Endpoint URL:                                                       │
│  [POST https://api.userpulse.com/v1/webhooks/trigger] [Copy]         │
│                                                                      │
│  Request Payload:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ {                                                              │  │
│  │   "event_id": "your-event-uuid",                               │  │
│  │   "contact": {                                                 │  │
│  │     "first_name": "John",                                      │  │
│  │     "last_name": "Doe",                                        │  │
│  │     "email": "john@example.com",                               │  │
│  │     "phone": "+1-555-123-4567",                                │  │
│  │     "preferred_channel": "email",  // email | sms | both       │  │
│  │     "preferred_language": "en",    // en | es | fr | etc.      │  │
│  │     "tags": ["IVF Patient", "New Patient"],                    │  │
│  │     "location_id": "optional-location-uuid"                    │  │
│  │   },                                                           │  │
│  │   "channel": "preferred",  // preferred | email | sms          │  │
│  │   "scheduling": {                                              │  │
│  │     "type": "immediate",   // immediate | delayed              │  │
│  │     "delay_value": 0,      // number (if delayed)              │  │
│  │     "delay_unit": "hours"  // minutes | hours | days           │  │
│  │   }                                                            │  │
│  │ }                                                              │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Field Reference:                                                    │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  REQUIRED FIELDS                                               │  │
│  │  • event_id: UUID of the survey event (shown above)            │  │
│  │  • contact.first_name: Contact's first name                    │  │
│  │  • contact.last_name: Contact's last name                      │  │
│  │  • contact.email OR contact.phone: At least one required       │  │
│  │                                                                │  │
│  │  OPTIONAL FIELDS                                               │  │
│  │  • contact.preferred_channel: email, sms, or both              │  │
│  │  • contact.preferred_language: Language code (default: en)     │  │
│  │  • contact.tags: Array of tag names (created if new)           │  │
│  │  • contact.location_id: UUID of location (for multi-location)  │  │
│  │  • channel: Override to force email/sms, or use "preferred"    │  │
│  │  • scheduling.type: "immediate" (default) or "delayed"         │  │
│  │  • scheduling.delay_value: Number for delay (e.g., 2)          │  │
│  │  • scheduling.delay_unit: "minutes", "hours", or "days"        │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Behavior:                                                           │
│  • If contact exists (matched by email/phone), record is updated     │
│  • If contact is new, record is created with provided data           │
│  • Tags are created if they don't exist, then assigned to contact    │
│  • Throttle rules are respected (won't send if recently surveyed)    │
│                                                                      │
│  Use Cases:                                                          │
│  • CRM integration (Salesforce, HubSpot, Zoho)                       │
│  • Post-appointment triggers from EMR systems                        │
│  • Checkout/purchase follow-ups                                      │
│  • Custom workflow automation (Zapier, Make, n8n)                    │
│                                                                      │
│  [Generate API Key]  (Coming Soon badge)                             │
└──────────────────────────────────────────────────────────────────────┘
```

#### 5. Make Both Sections Collapsible

Wrap both Webhook and SFTP in Collapsible components with:
- Collapsed by default (`useState(false)`)
- Chevron icon that rotates on open
- Smooth transition animation

---

### Key Additions Based on Your Feedback

| Addition | Rationale |
|----------|-----------|
| **Event ID display with copy button** | Users can easily copy the event UUID right from the page |
| **preferred_channel field** | Respects contact's preferred communication method |
| **preferred_language field** | Supports multi-language surveys |
| **tags array** | Tags are created/assigned when contact is upserted |
| **scheduling object** | Supports immediate or delayed sends (minutes/hours/days) |
| **channel override** | Can use contact preference or force a specific channel |
| **Field Reference table** | Clear documentation of required vs optional fields |
| **Behavior section** | Explains upsert logic, tag creation, and throttle rules |

---

### Summary of Changes

| Change | Type |
|--------|------|
| Import Collapsible + icons | Import |
| Add state for open/closed + copy states | State |
| Move Webhook before SFTP | Reorder |
| Add Event ID display with copy | New UI |
| Complete payload with all fields | New content |
| Field reference documentation | New content |
| Wrap both in Collapsible (closed default) | UI update |

