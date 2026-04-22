

## Plan: Extend Translations to Steps 2, 3, 4 with AI Auto-Translate

Currently only Step 1 (Event Heading, Intro, Metric Question) and Step 4 thank-you messages support multi-language. This plan extends translations to **all** user-facing text across the wizard, with **AI auto-translation** that users can override.

### What Becomes Translatable

**Step 2 — Follow-up Questions**
- Section Title
- Section Introduction
- Each question's Question Text
- Scale Left Label / Right Label (for `scale` type)
- Each option label (for `select_one` / `select_multiple`)

**Step 3 — Consents & Personal Info**
- Consent Text
- Consent Helper Text

**Step 4 — Thank You Page**
- Thank-you messages (already partially supported — finalize)
- Each thank-you button's Label
- Google Review Reminder: Email Subject, Email Body, SMS Body

### Translation Data Model

Extend the per-language `translations` object stored in `events.translations` (JSONB) to include all translatable fields:

```
translations: {
  en: {
    eventHeading, introMessage, metricQuestion,
    questionsTitle, questionsIntro,
    questions: { [questionId]: { question, leftLabel, rightLabel, options: string[] } },
    consentText, consentHelperText,
    thankYouConfig: {
      promoters: { message, buttons: { [buttonId]: { label } } },
      passives:  { ... },
      detractors:{ ... },
    },
    googleReviewReminder: { emailSubject, emailBody, smsBody },
  },
  es: { ... },  // same shape
  fr: { ... },
}
```

Default-language values stay the source of truth for the underlying form fields. Other-language values live only in `translations`.

### Auto-Translate (Default On, User Editable)

- New Edge Function **`translate-event-content`** using Lovable AI Gateway (`google/gemini-2.5-flash`). Input: `sourceLang`, `targetLang`, `fields: Record<string, string>`. Output: `Record<string, string>` of translated values.
- **Triggers**:
  1. When user adds a new language to the event → auto-translate all default-language content into that language.
  2. When user edits a default-language field (debounced 1.5s) → re-translate only fields that have NOT been manually edited in other languages (tracked via a `manualOverrides: { [lang]: Set<fieldKey> }` map kept in component state, persisted in `translations[lang].__overrides` on save).
  3. Manual **"Re-translate this field"** icon button next to each translated field for on-demand refresh.
- When the user types in a non-default language input, that field is marked as a manual override and excluded from future auto-translate runs (prevents wiping their edits).
- A subtle "Auto-translated" badge appears on fields that haven't been overridden; switches to "Edited" once the user changes them.

### UI Changes

**Reusable language selector** — extract the existing language pill row from Step 4 into a small `<TranslationLanguageBar />` shown at the top of Steps 2, 3, and 4 whenever `languages.length > 1`. Hidden when only one language is selected (no UI noise).

**Per-field rendering pattern** — each translatable input reads from `translations[editingLanguage]` when editing a non-default language, and from the main form field when editing the default language (keeps current source-of-truth logic).

**Step 2 questions** — each question card gets a small "Translate" indicator. Translatable fields (question text, scale labels, options) read/write from `translations[editingLanguage].questions[questionId]`. Question type, "Show for" groups, and Required toggle are NOT translated (they're structural).

**Step 3 consent card** — Consent Text + Helper Text become translation-aware textareas.

**Step 4** — finalize the existing partial thank-you-message translation, plus add per-button label translation and full Google Review Reminder content translation (subject, body, SMS).

### Save / Load

- `createEventMutation` already serializes `formData.translations` to `events.translations`. The expanded shape fits the existing JSONB column — no migration needed.
- Edit-mode loader (`loadEventData`) already reads `translations`. It will hydrate the new fields if present; otherwise `createDefaultTranslation()` provides empty defaults and the next auto-translate call fills them in.

### Files to Modify

| File | Change |
|---|---|
| `src/pages/nps/CreateEvent.tsx` | Expand `LanguageContent` interface; add `manualOverrides` tracking; wire translatable inputs in Steps 2, 3, 4; add language bar to Steps 2 & 3; add re-translate button per field; call edge function on language add / debounced edit |
| `src/components/events/TranslationLanguageBar.tsx` *(new)* | Extracted reusable language selector pills |
| `src/hooks/useAutoTranslate.ts` *(new)* | Hook wrapping the edge function call with debounce + override-aware payload building |
| `supabase/functions/translate-event-content/index.ts` *(new)* | Edge function: takes source/target lang + fields map, calls Lovable AI Gateway, returns translations |
| `supabase/config.toml` | Register new function with `verify_jwt = false` |

### Technical Details

- Edge function uses `LOVABLE_API_KEY` (already configured) with model `google/gemini-2.5-flash`. Prompt instructs the model to translate while preserving placeholders like `{first_name}`, `{brand_name}`, `{google_review_link}`, `[Brand]`.
- Translation requests are batched per-language (one call per target language carries all fields) to minimize latency and cost.
- Loading state per language shown as a small spinner on the language pill while translation is in flight.
- Failure path: toast error, leave fields empty for user to fill manually.
- Override tracking is stored as `translations[lang].__overrides: string[]` in the JSONB so it survives reloads.

