-- Add Google Review configuration to brands
ALTER TABLE brands ADD COLUMN IF NOT EXISTS google_review_config jsonb DEFAULT '{}';

-- Add Google Place ID to locations for location-specific Google integration
ALTER TABLE locations ADD COLUMN IF NOT EXISTS google_place_id text;