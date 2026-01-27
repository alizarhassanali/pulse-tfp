-- Create API keys table for webhook authentication
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users with brand access can view API keys (but not the hash)
CREATE POLICY "Users can view accessible API keys"
ON public.api_keys
FOR SELECT
USING (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), brand_id));

-- Policy: Super admins and brand admins can manage API keys
CREATE POLICY "Admins can manage API keys"
ON public.api_keys
FOR ALL
USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'brand_admin') AND has_brand_access(auth.uid(), brand_id)));

-- Create index for faster lookups
CREATE INDEX idx_api_keys_brand_id ON public.api_keys(brand_id);
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);

-- Add comment explaining the table
COMMENT ON TABLE public.api_keys IS 'Stores API keys for webhook authentication. key_hash stores SHA-256 hash, key_prefix stores first 8 chars for identification.';