# Product Success Metrics & Measurement — OttoPulse

> **Last updated:** 2026-03-30
> **Cross-references:** [requirements.md](./requirements.md) · [database.md](./database.md) · [workflows.md](./workflows.md)

---

## 1. North Star Metric

### Patient Feedback Loop Closure Rate
**Definition:** % of detractor responses (NPS 0-6) that receive a follow-up action within 48 hours.

**Why this metric:** It captures the core value proposition — not just collecting feedback, but acting on it to improve patient outcomes. It connects survey collection, AI categorization, internal notes, and automated follow-ups into a single measurable outcome.

**How to measure:**
- Detractor response: `survey_responses` WHERE `nps_score <= 6`
- Follow-up action within 48h = ANY of:
  - `submission_notes` created within 48h of `completed_at`
  - `automation_logs` with `status = 'sent'` linked to the response
  - `response_tag_assignments` or `response_category_assignments` created (indicating review)
- Formula: `(detractors with action within 48h) / (total detractors) × 100`

**Target:** >80%

**Data source:** Join `survey_responses` → `submission_notes` + `automation_logs` + `response_tag_assignments` by `response_id`

---

## 2. NPS Survey Metrics

### 2.1 Core Survey KPIs

| Metric | Definition | Data Source | Target |
|---|---|---|---|
| **Survey Response Rate** | completed / sent | `survey_invitations` (completed vs total) | >30% |
| **NPS Score** | % promoters − % detractors | `survey_responses.nps_score` | >50 |
| **Surveys Sent (volume)** | Total invitations created | `survey_invitations` count | Growing MoM |
| **Surveys Completed** | Invitations with `status = 'completed'` | `survey_invitations` | Growing MoM |
| **Time to Complete** | `completed_at - sent_at` | `survey_invitations` | <5 minutes |

### 2.2 Score Distribution

| Metric | Definition | Target |
|---|---|---|
| **Promoter %** | Score 9-10 / total responses | >60% |
| **Passive %** | Score 7-8 / total responses | <25% |
| **Detractor %** | Score 0-6 / total responses | <15% |
| **Score Trend** | Monthly NPS score change | Improving |

### 2.3 Channel Effectiveness

| Metric | Definition | Data Source |
|---|---|---|
| **Email Completion Rate** | Completed email invitations / sent email invitations | `survey_invitations` WHERE `channel = 'email'` |
| **SMS Completion Rate** | Completed SMS invitations / sent SMS invitations | `survey_invitations` WHERE `channel = 'sms'` |
| **QR/Link Completion Rate** | Responses without invitation / total link views | `survey_responses` WHERE `invitation_id IS NULL` |
| **Best Performing Channel** | Channel with highest completion rate | Compare above |

### 2.4 Survey Health

| Metric | Definition | Watch For |
|---|---|---|
| **Delivery Rate** | delivered / sent | <95% = email/SMS issues |
| **Open Rate** | opened / delivered | <50% = subject line/timing issues |
| **Bounce Rate** | bounced / sent | >5% = data quality issue |
| **Throttle Hit Rate** | Contacts blocked by throttle_days | High rate = throttle too aggressive |
| **Drop-off Rate** | Started but not completed / started | >30% = survey too long |
| **Multi-language Adoption** | Non-English responses / total responses | Track growth |

---

## 3. Distribution & Automation Metrics

### 3.1 Automation Adoption

| Metric | Definition | Target |
|---|---|---|
| **Automation Ratio** | Automated sends / total sends | >70% |
| **Active Integrations** | Count of integrations with `status = 'active'` | Growing |
| **Webhook API Usage** | API calls per day (via `api_keys.last_used_at`) | Active usage |
| **SFTP Sync Success Rate** | `sftp_sync_logs` with `status = 'completed'` / total | >95% |
| **Otto Onboard Trigger Rate** | CNP triggers with `status = 'active'` / total | >80% |

### 3.2 Automation Rule Performance

| Metric | Definition | Data Source |
|---|---|---|
| **Rules Created** | Total automation rules | `automation_rules` count |
| **Active Rules** | Rules with `status = 'active'` | `automation_rules` |
| **Trigger Rate** | `automation_logs` created / eligible responses | Compare response count to log count |
| **Send Success Rate** | Logs with `status = 'sent'` / total logs | `automation_logs` |
| **Skip Rate** | Logs with `status = 'skipped'` / total | Watch for high skip rates |
| **Top Skip Reasons** | Most common `skip_reason` values | Identify systemic issues |

### 3.3 Delivery Health

| Metric | Definition | Alert Threshold |
|---|---|---|
| **Bounce Rate** | `status = 'bounced'` / total sent | >5% |
| **Failure Rate** | `status = 'failed'` / total sent | >2% |
| **Send Latency** | Time from `created_at` to `sent_at` | >1 hour |
| **Delivery Latency** | Time from `sent_at` to `delivered_at` | >30 minutes |

---

## 4. Feedback & Response Management Metrics

### 4.1 AI Categorization

| Metric | Definition | Target |
|---|---|---|
| **AI Categorization Rate** | Responses with AI-assigned tags / total responses | >80% |
| **AI Accuracy (proxy)** | Manual override rate = manual reassignments / AI assignments | <15% overrides |
| **Tags per Response** | Average AI-assigned tags per response | 1-3 |
| **Categorization Latency** | Edge function response time | <3 seconds |

**Data source:** `response_tag_assignments` WHERE `source = 'ai'` vs `source = 'manual'`

### 4.2 Response Engagement

| Metric | Definition | Target |
|---|---|---|
| **Internal Notes Rate** | Detractor responses with ≥1 note / total detractors | >50% |
| **Avg Notes per Detractor** | Total notes on detractors / detractor count | >1.5 |
| **Time to First Note** | `submission_notes.created_at - survey_responses.completed_at` for first note | <24 hours |
| **Category Assignment Rate** | Responses with ≥1 category / total responses | >70% |

### 4.3 Feedback Insights

| Metric | How to Derive | Value |
|---|---|---|
| **Top Pain Points** | Most frequent feedback tags among detractors | Prioritize improvements |
| **Tag Trend** | Tag frequency over time | Spot emerging issues |
| **Score by Category** | Average NPS grouped by assigned category | Identify worst areas |
| **Positive Themes** | Most frequent tags among promoters | Reinforce strengths |

---

## 5. Reviews Metrics

### 5.1 Google Review KPIs

| Metric | Definition | Target |
|---|---|---|
| **Review Reminder Conversion** | Reviews posted within 7 days of reminder / reminders sent | >15% |
| **Average Star Rating** | Mean of `reviews.rating` | >4.2 |
| **Rating Trend** | Monthly average rating change | Improving |
| **Review Volume** | New reviews per month | Growing |
| **Review Response Rate** | Reviews with `response_text IS NOT NULL` / total | >90% |
| **Review Response Time** | `responded_at - created_at` | <48 hours |

### 5.2 Rating Distribution

| Metric | Definition | Watch For |
|---|---|---|
| **5-Star %** | 5-star reviews / total | >50% |
| **1-Star %** | 1-star reviews / total | <5% |
| **Distribution Shift** | Rating distribution before vs after NPS program | Positive shift |

### 5.3 Location-Level Analysis

| Metric | Scope | Purpose |
|---|---|---|
| **Rating by Location** | Average rating per location | Identify underperformers |
| **Response Rate by Location** | Per-location review response rate | Ensure consistency |
| **Volume by Location** | Reviews per location per month | Spot inactive locations |

---

## 6. Contacts Metrics

### 6.1 Database Health

| Metric | Definition | Target |
|---|---|---|
| **Contact Growth Rate** | New contacts per month | Positive growth |
| **Data Completeness** | % of contacts with both email AND phone | >70% |
| **Language Distribution** | Contacts per `preferred_language` | Matches patient demographics |
| **Channel Preference** | Contacts per `preferred_channel` | Informs distribution strategy |

### 6.2 Import Quality

| Metric | Definition | Target |
|---|---|---|
| **Import Success Rate** | `success_count / total_rows` per import | >95% |
| **Upsert Ratio** | Updated contacts / total successful imports | Indicates data freshness |
| **Import Error Rate** | `error_count / total_rows` per import | <5% |
| **Common Import Errors** | Most frequent error types from `errors` JSONB | Fix data quality issues |

### 6.3 Engagement Health

| Metric | Definition | Alert Threshold |
|---|---|---|
| **Unsubscribe Rate** | New unsubscribes per month / total active contacts | >2% per month |
| **Duplicate Rate** | Duplicates found / total contacts | >5% |
| **Merge Rate** | Duplicates merged / duplicates found | >80% (healthy cleanup) |
| **Stale Contact Rate** | Contacts not surveyed in 6+ months | >30% |

---

## 7. Admin Platform Engagement

### 7.1 User Activity (requires analytics implementation)

| Metric | Definition | Target |
|---|---|---|
| **DAU / WAU / MAU** | Active admin users per day/week/month | Growing or stable |
| **Feature Adoption** | % of users who have used each feature at least once | >50% for core features |
| **Session Duration** | Average time per admin session | 5-15 minutes |
| **Pages per Session** | Average pages visited per session | 3-5 |

### 7.2 Feature Usage by Role

| Role | Expected Primary Pages | Watch For |
|---|---|---|
| `super_admin` | Dashboard, Users, Brands, Events | Low engagement = unclear value |
| `brand_admin` | Dashboard, Events, Templates, Contacts | Not using automation = missed efficiency |
| `clinic_manager` | Dashboard, Reviews, Responses | Not viewing dashboard = data not actionable |
| `staff` | Dashboard, Sent Logs | Low visits = unclear purpose |

### 7.3 Automation Feature Adoption

| Metric | Definition | Target |
|---|---|---|
| **Automation Rule Creation Rate** | New rules per month | Growing |
| **Active Rule %** | Active rules / total rules | >70% |
| **Template Utilization** | Templates with `usage_count > 0` / total | >50% |
| **Integration Setup Rate** | Events with ≥1 integration / total active events | >40% |

---

## 8. Operational Health

### 8.1 System Reliability

| Metric | Source | Alert Threshold |
|---|---|---|
| **Edge Function Error Rate** | Supabase function logs | >1% |
| **AI Gateway Latency** | `categorize-feedback` response time | >5 seconds |
| **Database Query Performance** | Supabase analytics | Slow queries >500ms |
| **Auth Success Rate** | Login success / attempts | <95% |

### 8.2 Data Pipeline Health

| Metric | Source | Alert Threshold |
|---|---|---|
| **SFTP Sync Failures** | `sftp_sync_logs` with `status = 'failed'` | Any failure |
| **Import Processing Time** | Time from upload to completion | >30 seconds for 1000 rows |
| **Webhook Response Time** | API response latency | >2 seconds |

---

## 9. How to Measure (Implementation Guidance)

### 9.1 Already Available in the App

| What | Where | Tables |
|---|---|---|
| NPS score, response rate, sent/completed | `Dashboard.tsx` | `survey_invitations`, `survey_responses` |
| Score distribution (P/P/D) | `Dashboard.tsx` | `survey_responses.nps_score` |
| Delivery issues (bounce/throttle/unsub) | `Dashboard.tsx` | `survey_invitations.status` |
| Channel performance | `Dashboard.tsx` | `survey_invitations.channel` |
| Review metrics (avg rating, response rate) | `Reviews.tsx` | `reviews` |
| Import history (added/errors) | `ImportHistoryModal.tsx` | `contact_imports` |

### 9.2 Derivable from Existing Data

| What | Query Approach |
|---|---|
| Feedback loop closure rate | Join `survey_responses` → `submission_notes` + `automation_logs` within 48h |
| AI categorization accuracy | Compare `response_tag_assignments` `source = 'ai'` vs later `source = 'manual'` changes |
| Automation efficiency | `automation_logs` grouped by `status` and `skip_reason` |
| Contact data quality | Aggregate contacts by completeness (email + phone presence) |
| Time to first action | Min(`submission_notes.created_at`) - `survey_responses.completed_at` per detractor |

### 9.3 Requires Implementation

| What | Recommendation |
|---|---|
| Admin user analytics (DAU/MAU) | Add Mixpanel or Amplitude event tracking |
| Feature adoption tracking | Track page views and key actions per user |
| Survey drop-off analysis | Track partial survey completions (requires frontend event logging) |
| Review reminder conversion | Cross-reference `thank_you_config.reviewReminder` sends with new `reviews` appearing |
| SFTP sync alerting | Add email/Slack notifications on `sftp_sync_logs.status = 'failed'` |

---

## 10. Feature Success Checklist

When evaluating whether a new feature is successful, ask these questions:

| Question | How to Measure |
|---|---|
| Does it increase response rate? | Compare response rate before/after feature launch |
| Does it reduce time-to-action on detractor feedback? | Measure "time to first note" trend |
| Does it shift manual work to automation? | Track automation ratio over time |
| Does it improve data quality? | Track duplicate rate, import error rate, contact completeness |
| Does it increase admin user engagement? | Track feature usage and session metrics |
| Does it improve patient sentiment? | Track NPS score trend and review rating trend |
| Does it reduce operational overhead? | Track manual send volume and SFTP failure rate |

---

## 11. Reporting Cadence

| Report | Frequency | Audience | Key Metrics |
|---|---|---|---|
| **Executive Dashboard** | Monthly | Leadership | NPS score, response rate, review rating, feedback closure rate |
| **Operations Report** | Weekly | Brand admins | Delivery health, automation performance, import quality |
| **Location Scorecard** | Monthly | Clinic managers | Per-location NPS, review ratings, response rates |
| **Data Quality Report** | Monthly | Super admins | Contact completeness, duplicates, unsubscribe rate |
| **Feature Adoption** | Quarterly | Product team | Feature usage by role, automation adoption, new feature impact |

---

## 12. Benchmarks & Targets Summary

| Category | Metric | Target | Red Flag |
|---|---|---|---|
| **Core** | Feedback Loop Closure | >80% | <50% |
| **NPS** | Response Rate | >30% | <15% |
| **NPS** | NPS Score | >50 | <20 |
| **Automation** | Automation Ratio | >70% | <30% |
| **Reviews** | Response Rate | >90% | <50% |
| **Reviews** | Avg Rating | >4.2 | <3.5 |
| **Contacts** | Data Completeness | >70% | <40% |
| **Contacts** | Import Success Rate | >95% | <80% |
| **AI** | Override Rate (accuracy proxy) | <15% | >30% |
| **Ops** | Edge Function Error Rate | <1% | >5% |
