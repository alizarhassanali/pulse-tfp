

## Plan: Add Email/SMS Template Configuration to Webhook (UI Only)

### Overview
Add email and SMS message template configuration to the Webhook/API Trigger section. Templates are configured and saved in the application UI, not passed in the webhook payload. When a webhook triggers a survey, the system uses the saved templates.

---

### Changes to `src/components/distribution/AutomatedSendsTab.tsx`

#### 1. Add Webhook Template State Variables (after line 222)

```typescript
// Webhook Email/SMS templates
const [webhookEmailSubject, setWebhookEmailSubject] = useState('How was your recent visit?');
const [webhookEmailBody, setWebhookEmailBody] = useState(
  'Hi {first_name},\n\nWe hope you had a great experience at {location_name}. Please take a moment to share your feedback:\n\n{survey_link}\n\nThank you!\n{brand_name}\n\n---\nYou can unsubscribe from future feedback requests at any time using the link below.\n{unsubscribe_link}'
);
const [webhookSmsBody, setWebhookSmsBody] = useState(
  'Hi {first_name}, how was your visit to {location_name}? Share your feedback: {survey_link}\n\nReply STOP to unsubscribe.'
);
```

#### 2. Add Query to Fetch Saved Webhook Configuration

```typescript
const { data: webhookIntegration } = useQuery({
  queryKey: ['webhook-integration', eventId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('type', 'webhook')
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  enabled: !!eventId,
});
```

#### 3. Add useEffect to Initialize Templates from Saved Config

```typescript
useEffect(() => {
  if (webhookIntegration?.config) {
    const config = webhookIntegration.config as Record<string, any>;
    if (config.emailSubject) setWebhookEmailSubject(config.emailSubject);
    if (config.emailBody) setWebhookEmailBody(config.emailBody);
    if (config.smsBody) setWebhookSmsBody(config.smsBody);
  }
}, [webhookIntegration]);
```

#### 4. Add Mutation to Save Webhook Templates

```typescript
const saveWebhookTemplatesMutation = useMutation({
  mutationFn: async () => {
    const config = {
      emailSubject: webhookEmailSubject,
      emailBody: webhookEmailBody,
      smsBody: webhookSmsBody,
    };
    
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('type', 'webhook')
      .maybeSingle();
    
    if (existing?.id) {
      const { error } = await supabase
        .from('integrations')
        .update({ config, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('integrations').insert({
        event_id: eventId,
        type: 'webhook',
        config,
        status: 'active',
      });
      if (error) throw error;
    }
  },
  onSuccess: () => {
    toast({ title: 'Message templates saved' });
    queryClient.invalidateQueries({ queryKey: ['webhook-integration', eventId] });
  },
  onError: (error) => {
    toast({ title: 'Error saving templates', description: String(error), variant: 'destructive' });
  },
});
```

#### 5. Add Message Templates UI Section (after API Authentication, before Field Reference)

```text
┌────────────────────────────────────────────────────────────────┐
│  MESSAGE TEMPLATES                                              │
│                                                                 │
│  Configure the email and SMS content sent when surveys are      │
│  triggered via API. These templates apply to all webhook sends. │
│                                                                 │
│  Available variables:                                           │
│  {first_name} {last_name} {brand_name} {location_name}          │
│  {survey_link} {unsubscribe_link}                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ EMAIL                                                    │    │
│  │ Subject: [How was your recent visit?              ]      │    │
│  │ Body:                                                    │    │
│  │ ┌─────────────────────────────────────────────────────┐  │    │
│  │ │ Hi {first_name},                                    │  │    │
│  │ │                                                     │  │    │
│  │ │ We hope you had a great experience at              │  │    │
│  │ │ {location_name}. Please take a moment to share     │  │    │
│  │ │ your feedback:                                     │  │    │
│  │ │                                                     │  │    │
│  │ │ {survey_link}                                      │  │    │
│  │ │                                                     │  │    │
│  │ │ Thank you!                                         │  │    │
│  │ │ {brand_name}                                       │  │    │
│  │ │                                                     │  │    │
│  │ │ ---                                                │  │    │
│  │ │ You can unsubscribe from future feedback requests  │  │    │
│  │ │ at any time using the link below.                  │  │    │
│  │ │ {unsubscribe_link}                                 │  │    │
│  │ └─────────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ SMS                                                      │    │
│  │ Message:                                                 │    │
│  │ ┌─────────────────────────────────────────────────────┐  │    │
│  │ │ Hi {first_name}, how was your visit to             │  │    │
│  │ │ {location_name}? Share your feedback: {survey_link}│  │    │
│  │ │                                                     │  │    │
│  │ │ Reply STOP to unsubscribe.                         │  │    │
│  │ └─────────────────────────────────────────────────────┘  │    │
│  │ Character count: 142/160                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [Save Message Templates]                                       │
└────────────────────────────────────────────────────────────────┘
```

#### 6. Keep Webhook Payload Simple (NO message object)

The payload example remains focused on contact data and scheduling only:

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

No `message` object in the payload - templates come from the UI configuration.

---

### Default Unsubscribe Lines (Built into Defaults)

**Email Default Footer:**
```text
---
You can unsubscribe from future feedback requests at any time using the link below.
{unsubscribe_link}
```

**SMS Default Footer:**
```text
Reply STOP to unsubscribe.
```

These are included in the default template values when the component initializes.

---

### Summary of Changes

| Change | Type | Description |
|--------|------|-------------|
| Add webhook template state | State | `webhookEmailSubject`, `webhookEmailBody`, `webhookSmsBody` |
| Add webhook integration query | Query | Fetch saved config from `integrations` table |
| Add useEffect for initialization | Effect | Load saved templates into state |
| Add save templates mutation | Mutation | Save templates to `integrations` table |
| Add Message Templates UI section | UI | Email subject/body, SMS body with character count |
| Add Save button | UI | Trigger save mutation |

---

### How It Works

1. **Setup**: User configures email subject, email body, and SMS message in the UI
2. **Save**: Templates are saved to `integrations` table with `type: 'webhook'`
3. **API Call**: External system sends webhook with contact data only (no message content)
4. **Send**: System uses saved templates, replaces variables, appends unsubscribe if needed
5. **Delivery**: Email/SMS sent using the configured templates

This keeps the webhook payload simple and gives users full control over message content through the UI.

