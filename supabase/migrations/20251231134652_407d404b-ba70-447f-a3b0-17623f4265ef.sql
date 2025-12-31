-- Add channel column to reviews table to support multi-channel reviews (Google, Facebook, etc.)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'google';

-- Add fetched_at to track when the review was pulled from the source
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ;

-- Add review_channels_config to locations for per-location channel configuration
-- Structure: { google: { enabled: true, place_id: "xxx", connected_at: "2024-12-01" }, facebook: { enabled: false } }
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS review_channels_config JSONB DEFAULT '{"google": {"enabled": false}}'::jsonb;

-- Create index for channel filtering
CREATE INDEX IF NOT EXISTS idx_reviews_channel ON public.reviews(channel);