

## Current State: How Follow-up Question Types Render

### The Problem

All answer types are stored in `survey_responses.answers` as JSONB: `{ question: string, answer: string | number | string[] }`. But the **question type is not stored alongside the answer**, so the UI has no way to know if an answer was from a scale, checkbox, radio, or text question.

### Current Rendering (3 places)

| Location | How it renders |
|---|---|
| **Questions page** (card list) | `typeof answer.answer === 'string' ? answer.answer : JSON.stringify(answer.answer)` — arrays show as raw JSON like `["Wait time","Communication"]` |
| **ResponseDetailModal** | Same logic — wraps in quotes regardless of type |
| **Export (CSV)** | Same — `JSON.stringify` for non-strings, no type-aware formatting |

### What Each Type Should Look Like

| Question Type | Stored As | Current Display | Ideal Display |
|---|---|---|---|
| **Open text** (`free_response`) | `"string"` | `"The wait was long"` | `"The wait was long"` — works fine |
| **Scale** (`scale`) | `number` or `"7"` | `"7"` or `7` | `7 / 10` with a visual bar or badge |
| **Single select** (`select_one`) | `"option"` | `"Very Satisfied"` | Pill/badge: `Very Satisfied` |
| **Multi select** (`select_multiple`) | `["a","b"]` | `["a","b"]` (raw JSON) | Comma-separated pills: `Wait time` `Communication` |

### Plan to Fix

**1. Store question type in answers array** (no migration needed)
- When survey responses are submitted, include `type` in each answer object: `{ questionId, question, answer, type }` 
- This is a change in the survey submission flow (likely the public-facing survey page, not in scope of admin app)
- For existing data, infer type from the answer value at render time

**2. Type-aware rendering component** — new `AnswerDisplay` component
- File: `src/components/nps/AnswerDisplay.tsx`
- Accepts `answer: string | number | string[]` and optional `type` hint
- Infers type if not provided: array → multi-select pills, number → scale badge, string → quoted text
- Used in Questions page cards, ResponseDetailModal, and ContactDetailsModal submissions tab

**3. Type-aware export formatting**
- File: `src/pages/nps/Questions.tsx` (export handler)
- Arrays → `"Option A, Option B"` (joined with comma) instead of JSON
- Numbers → plain number string
- Add a `Question Type` column to export headers

**4. Update demo data with varied answer types**
- File: `src/data/demo-data.ts`
- Add demo responses with scale (`7`), single-select (`"Very Satisfied"`), and multi-select (`["Wait time", "Staff"]`) answers

### Files to Modify
- `src/components/nps/AnswerDisplay.tsx` — **new** type-aware answer renderer
- `src/pages/nps/Questions.tsx` — use AnswerDisplay in cards + fix export formatting
- `src/components/nps/ResponseDetailModal.tsx` — use AnswerDisplay
- `src/data/demo-data.ts` — add varied answer type examples

### Technical Detail
Type inference logic when `type` field is missing:
```typescript
function inferAnswerType(answer: unknown): 'text' | 'scale' | 'single' | 'multi' {
  if (Array.isArray(answer)) return 'multi';
  if (typeof answer === 'number') return 'scale';
  if (typeof answer === 'string' && /^\d+$/.test(answer) && Number(answer) <= 10) return 'scale';
  return 'text'; // covers both free_response and select_one (both are strings)
}
```

