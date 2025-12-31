-- Create contact_imports table to track import history
CREATE TABLE public.contact_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  brand_id UUID REFERENCES public.brands(id)
);

-- Enable RLS
ALTER TABLE public.contact_imports ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all import records
CREATE POLICY "Super admins can manage contact imports"
ON public.contact_imports
FOR ALL
USING (is_super_admin(auth.uid()));

-- Users can view imports they created or for brands they have access to
CREATE POLICY "Users can view accessible contact imports"
ON public.contact_imports
FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR created_by = auth.uid()
  OR (brand_id IS NOT NULL AND has_brand_access(auth.uid(), brand_id))
);

-- Users can insert their own import records
CREATE POLICY "Users can create own import records"
ON public.contact_imports
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users can update their own import records
CREATE POLICY "Users can update own import records"
ON public.contact_imports
FOR UPDATE
USING (auth.uid() = created_by);