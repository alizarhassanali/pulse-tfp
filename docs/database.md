# Database Schema Reference — OttoPulse

> **Last updated:** 2026-03-30
> **Cross-references:** [architecture.md](./architecture.md) · [claude.md](./claude.md) · [requirements.md](./requirements.md)

---

## 1. Schema Overview

The database uses Supabase (PostgreSQL) with Row Level Security (RLS) on all tables. The schema follows a multi-tenant architecture where `brands` is the top-level entity. All data is scoped to brands via foreign keys or junction tables.

**Total tables:** 27
**Enums:** 3
**DB Functions:** 6

---

## 2. Entity Relationship Diagram (Simplified)

```
brands ──────────────────────────────────────────────┐
  │                                                   │
  ├── locations                                       │
  │     ├── contacts                                  │
  │     ├── event_locations ──── events               │
  │     └── reviews                                   │
  │                                                   │
  ├── events                                          │
  │     ├── event_questions                           │
  │     ├── event_feedback_tags                       │
  │     ├── event_locations                           │
  │     ├── integrations ──── sftp_sync_logs          │
  │     ├── survey_invitations ──── survey_responses  │
  │     └── automation_rules ──── automation_logs     │
  │                                                   │
  ├── templates                                       │
  ├── cnp_triggers                                    │
  ├── api_keys                                        │
  └── reviews                                         │
                                                      │
profiles ────── user_roles ──── custom_roles          │
                user_brand_access ────────────────────┘
                user_location_access
                user_section_permissions
```

---

## 3. Core Tables

### 3.1 `brands`
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | PK |
| `name` | text | No | — | Brand display name |
| `logo_url` | text | Yes | — | Logo image URL |
| `colors` | jsonb | Yes | `{"text":"#263F6A","button":"#FF887C","topBar":"#263F6A","primary":"#FF887C"}` | Brand color scheme |
| `subdomain` | text | Yes | — | For white-label URLs |
| `created_at` | timestamptz | Yes | `now()` | |
| `updated_at` | timestamptz | Yes | `now()` | |

### 3.2 `locations`
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | PK |
| `brand_id` | uuid | No | — | FK → brands |
| `name` | text | No | — | Location display name |
| `timezone` | text | Yes | `'America/New_York'` | |
| `gmb_link` | text | Yes | — | Google My Business review link |
| `google_place_id` | text | Yes | — | For Google Reviews API |
| `address_line1` | text | Yes | — | |
| `address_line2` | text | Yes | — | |
| `city` | text | Yes | — | |
| `state_province` | text | Yes | — | |
| `postal_code` | text | Yes | — | |
| `country` | text | Yes | `'Canada'` | |
| `phone` | text | Yes | — | |
| `review_channels_config` | jsonb | Yes | `{"google":{"enabled":false}}` | Per-channel review settings |

### 3.3 `contacts`
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | PK |
| `brand_id` | uuid | No | — | FK → brands |
| `location_id` | uuid | Yes | — | FK → locations |
| `first_name` | text | Yes | — | |
| `last_name` | text | Yes | — | |
| `email` | text | Yes | — | Used for dedup |
| `phone` | text | Yes | — | Used for dedup (secondary) |
| `preferred_channel` | text | Yes | `'email'` | email, sms, both |
| `preferred_language` | text | Yes | `'en'` | en, es, fr, de, pt |
| `status` | text | Yes | `'active'` | active, unsubscribed |
| `unsubscribed_at` | timestamptz | Yes | — | Set when unsubscribed |

---

## 4. Survey Engine Tables

### 4.1 `events`
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | PK |
| `brand_id` | uuid | No | — | FK → brands |
| `name` | text | No | — | Event display name |
| `type` | text | No | `'nps'` | Survey type |
| `status` | text | No | `'draft'` | draft, active |
| `metric_question` | text | Yes | — | NPS question text |
| `intro_message` | text | Yes | — | Shown before survey |
| `languages` | text[] | Yes | `ARRAY['en']` | Supported languages |
| `throttle_days` | integer | Yes | `90` | Min days between surveys for same contact |
| `config` | jsonb | No | `'{}'` | General config |
| `thank_you_config` | jsonb | Yes | `'{}'` | Score-based thank you pages (see §8.1) |
| `consent_config` | jsonb | Yes | `'{}'` | Consent settings |
| `translations` | jsonb | Yes | `'{}'` | Per-language content (see §8.2) |

### 4.2 `event_locations` (junction)
| Column | Type | Notes |
|---|---|---|
| `event_id` | uuid | FK → events |
| `location_id` | uuid | FK → locations |

### 4.3 `event_questions`
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | PK |
| `event_id` | uuid | No | — | FK → events |
| `type` | text | No | — | free_response, scale, select_one, select_multiple |
| `config` | jsonb | No | `'{}'` | Type-specific config (see §8.3) |
| `order_num` | integer | No | `0` | Display order |
| `required` | boolean | Yes | `false` | |
| `show_for` | text[] | Yes | `['promoters','passives','detractors']` | Which score groups see this |

### 4.4 `event_feedback_tags`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `event_id` | uuid | FK → events |
| `name` | text | Tag display name |
| `archived` | boolean | Default `false` |

### 4.5 `survey_invitations`
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | PK |
| `event_id` | uuid | Yes | — | FK → events |
| `contact_id` | uuid | Yes | — | FK → contacts |
| `channel` | text | No | — | email, sms |
| `status` | text | Yes | `'pending'` | pending, sent, delivered, opened, completed, bounced, failed |
| `sent_at` | timestamptz | Yes | — | |
| `delivered_at` | timestamptz | Yes | — | |
| `opened_at` | timestamptz | Yes | — | |
| `completed_at` | timestamptz | Yes | — | |

### 4.6 `survey_responses`
| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | No | `gen_random_uuid()` | PK |
| `event_id` | uuid | No | — | FK → events |
| `contact_id` | uuid | Yes | — | FK → contacts |
| `invitation_id` | uuid | Yes | — | FK → survey_invitations |
| `nps_score` | integer | Yes | — | 0-10 |
| `answers` | jsonb | Yes | `'[]'` | Array of answer objects (see §8.4) |
| `consent_given` | boolean | Yes | `false` | |
| `device_info` | jsonb | Yes | `'{}'` | Browser/device metadata |
| `completed_at` | timestamptz | Yes | `now()` | |

---

## 5. Feedback & Categorization Tables

### 5.1 `response_tag_assignments`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `response_id` | uuid | FK → survey_responses |
| `tag_id` | uuid | FK → event_feedback_tags |
| `source` | text | `'ai'` or `'manual'` |
| `assigned_by` | uuid | User who assigned (null for AI) |

### 5.2 `feedback_categories`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | Category name |
| `archived` | boolean | Default `false` |

### 5.3 `response_category_assignments`
| Column | Type | Notes |
|---|---|---|
| `response_id` | uuid | FK → survey_responses |
| `category_id` | uuid | FK → feedback_categories |
| `source` | text | `'ai'` or `'manual'` |
| `assigned_by` | uuid | |

### 5.4 `submission_notes`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `response_id` | uuid | FK → survey_responses |
| `note_text` | text | Internal note content |
| `created_by` | uuid | User who wrote the note |

---

## 6. Integration & Automation Tables

### 6.1 `integrations`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `event_id` | uuid | FK → events |
| `type` | text | `webhook`, `sftp`, or `cnpm` |
| `config` | jsonb | Type-specific config (see §8.5) |
| `status` | text | `active`, `inactive` |
| `sends_count` | integer | Total sends through this integration |
| `last_used_at` | timestamptz | |

### 6.2 `sftp_sync_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `integration_id` | uuid | FK → integrations |
| `status` | text | `running`, `completed`, `failed` |
| `file_name` | text | Processed file name |
| `total_rows` | integer | |
| `success_count` | integer | |
| `error_count` | integer | |
| `skipped_count` | integer | |
| `errors` | jsonb | Array of per-row errors |
| `started_at` | timestamptz | |
| `completed_at` | timestamptz | |

### 6.3 `cnp_triggers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `brand_id` | uuid | FK → brands |
| `name` | text | Trigger name |
| `description` | text | |
| `status` | text | `active`, `inactive` |

### 6.4 `automation_rules`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | Rule name |
| `event_id` | uuid | FK → events |
| `brand_id` | uuid | FK → brands |
| `trigger_group` | text | promoters, passives, detractors, all |
| `feedback_condition` | text | with_feedback, without_feedback, either |
| `channel` | text | email, sms |
| `template_id` | uuid | FK → templates |
| `delay_hours` | integer | Hours to wait before sending |
| `throttle_days` | integer | Min days between sends to same contact |
| `status` | text | active, inactive |
| `created_by` | uuid | |

### 6.5 `automation_logs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `automation_rule_id` | uuid | FK → automation_rules |
| `response_id` | uuid | FK → survey_responses |
| `contact_id` | uuid | FK → contacts |
| `template_id` | uuid | FK → templates |
| `channel` | text | |
| `status` | text | pending, sent, failed, skipped |
| `scheduled_at` | timestamptz | |
| `sent_at` | timestamptz | |
| `skip_reason` | text | e.g., "throttled", "unsubscribed" |

---

## 7. User & Access Control Tables

### 7.1 `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | References auth.users (not FK) |
| `email` | text | |
| `name` | text | |
| `phone` | text | |
| `timezone` | text | Default `'America/New_York'` |
| `avatar_url` | text | |
| `status` | text | `active`, `suspended` |

### 7.2 `user_roles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | References auth.users |
| `role` | app_role (enum) | Built-in role |
| `custom_role_id` | uuid | FK → custom_roles (nullable) |

### 7.3 `custom_roles`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `description` | text | |
| `permissions` | jsonb | `{ section: permission_level }` map |

### 7.4 `user_brand_access` (junction)
| Column | Type |
|---|---|
| `user_id` | uuid |
| `brand_id` | uuid |

### 7.5 `user_location_access` (junction)
| Column | Type |
|---|---|
| `user_id` | uuid |
| `location_id` | uuid |

### 7.6 `user_section_permissions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | |
| `section` | app_section (enum) | |
| `permission` | permission_level (enum) | Default `'no_access'` |

---

## 8. JSONB Structures

### 8.1 `events.thank_you_config`
```json
{
  "promoters": {
    "heading": "Thank you!",
    "body": "We appreciate your feedback.",
    "buttons": [
      {
        "id": "uuid",
        "label": "Leave a Google Review",
        "type": "google_review",
        "url": "https://g.page/r/..."
      }
    ]
  },
  "passives": { ... },
  "detractors": { ... },
  "reviewReminder": {
    "enabled": true,
    "delayHours": 24,
    "channel": "both",
    "templateId": "uuid"
  }
}
```

### 8.2 `events.translations`
```json
{
  "es": {
    "metricQuestion": "En una escala del 0 al 10...",
    "introMessage": "Nos gustaría conocer su opinión...",
    "questions": {
      "question-uuid": {
        "text": "¿Cómo fue su experiencia?",
        "options": ["Excelente", "Buena", "Regular"]
      }
    },
    "thankYou": {
      "promoters": { "heading": "¡Gracias!", "body": "..." },
      ...
    }
  },
  "fr": { ... }
}
```

### 8.3 `event_questions.config`
```json
// free_response
{ "question": "Tell us more about your experience", "placeholder": "Type here..." }

// scale
{ "question": "Rate your experience", "min": 1, "max": 5, "minLabel": "Poor", "maxLabel": "Excellent" }

// select_one
{ "question": "Primary reason for visit?", "options": ["IVF", "IUI", "Consultation", "Follow-up"] }

// select_multiple
{ "question": "Which services did you use?", "options": ["IVF", "IUI", "Egg Freezing", "Consultation"] }
```

### 8.4 `survey_responses.answers`
```json
[
  { "question": "How was your experience?", "answer": "Great staff", "type": "free_response" },
  { "question": "Rate cleanliness", "answer": 4, "type": "scale" },
  { "question": "Which services?", "answer": ["IVF", "Consultation"], "type": "select_multiple" },
  { "question": "Primary reason?", "answer": "Recommendation", "type": "select_one" }
]
```

**Note:** Legacy data may omit `type` field. Type inference:
- `Array.isArray(answer)` → `select_multiple`
- `typeof answer === 'number'` → `scale`
- String matching `^\d+$` with value ≤ 10 → `scale`
- Default → `free_response`

### 8.5 `integrations.config` (by type)
```json
// type: "webhook"
{
  "api_key_id": "uuid",
  "email_template_id": "uuid",
  "sms_template_id": "uuid"
}

// type: "sftp"
{
  "host": "sftp.example.com",
  "port": 22,
  "username": "user",
  "password": "***",
  "path": "/uploads/contacts.csv",
  "schedule": "daily",
  "timezone": "America/Toronto",
  "email_template_id": "uuid",
  "sms_template_id": "uuid",
  "csv_mapping": {
    "first_name": "First Name",
    "last_name": "Last Name",
    "email": "Email",
    "phone": "Phone"
  }
}

// type: "cnpm" (Otto Onboard)
{
  "trigger_id": "uuid",
  "email_template_id": "uuid",
  "sms_template_id": "uuid"
}
```

---

## 9. Enums

### `app_role`
```sql
'super_admin' | 'brand_admin' | 'clinic_manager' | 'staff' | 'read_only'
```

### `app_section`
```sql
'dashboard' | 'questions' | 'sent_logs' | 'manage_events' | 'integration'
| 'reviews' | 'contacts' | 'templates' | 'brands' | 'users'
```

### `permission_level`
```sql
'no_access' | 'view' | 'edit' | 'respond'
```

---

## 10. Database Functions

| Function | Signature | Returns | Purpose |
|---|---|---|---|
| `has_role` | `(_user_id uuid, _role app_role)` | boolean | Check if user has specific role |
| `is_super_admin` | `(_user_id uuid)` | boolean | Check if user is super admin |
| `has_brand_access` | `(_user_id uuid, _brand_id uuid)` | boolean | Check brand-level access |
| `can_view_section` | `(_section app_section, _user_id uuid)` | boolean | Check view permission |
| `can_edit_section` | `(_section app_section, _user_id uuid)` | boolean | Check edit permission |
| `get_user_section_permission` | `(_section app_section, _user_id uuid)` | permission_level | Get exact permission level |

All functions are `SECURITY DEFINER` with `search_path = public` to avoid RLS recursion.

---

## 11. RLS Policy Patterns

### Pattern 1: Brand-Scoped Access
```sql
-- Most tables (contacts, events, templates, reviews, etc.)
USING (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), brand_id))
```

### Pattern 2: Event-Scoped Access (via join)
```sql
-- Tables linked to events (questions, invitations, responses, integrations)
USING (EXISTS (
  SELECT 1 FROM events e
  WHERE e.id = table.event_id
  AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
))
```

### Pattern 3: Response-Scoped Access (via double join)
```sql
-- Tables linked to responses (tags, categories, notes)
USING (EXISTS (
  SELECT 1 FROM survey_responses sr
  JOIN events e ON e.id = sr.event_id
  WHERE sr.id = table.response_id
  AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
))
```

### Pattern 4: Self-Access
```sql
-- profiles, user_roles
USING (auth.uid() = user_id)
```

---

## 12. Other Tables

### `templates`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | |
| `type` | text | email, sms |
| `brand_id` | uuid | FK → brands |
| `subject` | text | Email subject line |
| `body` | text | Template body with variables |
| `variables` | jsonb | List of available variables |
| `usage_count` | integer | Default 0 |

### `reviews`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `brand_id` | uuid | FK → brands |
| `location_id` | uuid | FK → locations |
| `reviewer_name` | text | |
| `rating` | integer | 1-5 stars |
| `review_text` | text | |
| `response_text` | text | Admin's response |
| `channel` | text | google, facebook, yelp, tripadvisor |
| `source_url` | text | Link to original review |
| `external_id` | text | Platform-specific ID |
| `responded_at` | timestamptz | |
| `fetched_at` | timestamptz | |

### `api_keys`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `brand_id` | uuid | FK → brands |
| `name` | text | Key display name |
| `key_hash` | text | Hashed API key |
| `key_prefix` | text | First chars for identification |
| `created_by` | uuid | |
| `expires_at` | timestamptz | |
| `revoked_at` | timestamptz | |
| `last_used_at` | timestamptz | |

### `contact_imports`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `brand_id` | uuid | FK → brands |
| `file_name` | text | Uploaded CSV name |
| `total_rows` | integer | |
| `success_count` | integer | Created + updated |
| `error_count` | integer | |
| `errors` | jsonb | Array of row-level errors |
| `status` | text | pending, completed, failed |
| `created_by` | uuid | |

### `resources` + `resource_brand_access`
Resources with optional brand-level access control via junction table. Resources without any brand access entries are visible to all authenticated users.
