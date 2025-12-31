-- Add google_review_config column to locations table for per-location Google Reviews integration
ALTER TABLE locations ADD COLUMN google_review_config jsonb DEFAULT '{}'::jsonb;