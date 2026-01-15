-- Add structured address columns
ALTER TABLE locations ADD COLUMN address_line1 text;
ALTER TABLE locations ADD COLUMN address_line2 text;
ALTER TABLE locations ADD COLUMN city text;
ALTER TABLE locations ADD COLUMN state_province text;
ALTER TABLE locations ADD COLUMN postal_code text;
ALTER TABLE locations ADD COLUMN country text DEFAULT 'Canada';

-- Migrate existing address data to address_line1
UPDATE locations SET address_line1 = address WHERE address IS NOT NULL;

-- Drop the legacy address column
ALTER TABLE locations DROP COLUMN address;