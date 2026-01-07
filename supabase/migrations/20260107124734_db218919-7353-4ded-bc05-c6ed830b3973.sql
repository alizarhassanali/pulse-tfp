-- Add translations JSONB column to events table for multi-language support
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN public.events.translations IS 'Per-language translations: { "en": { "intro_message": "...", "metric_question": "...", "thank_you_config": {...} }, "es": {...} }';