-- Add preferred_language column to contacts table
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';