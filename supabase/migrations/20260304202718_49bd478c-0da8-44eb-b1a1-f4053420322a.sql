
-- Create resources table
CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'document',
  icon text DEFAULT 'FileText',
  content text,
  file_url text,
  created_by uuid,
  status text NOT NULL DEFAULT 'published',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create resource_brand_access junction table
CREATE TABLE public.resource_brand_access (
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  PRIMARY KEY (resource_id, brand_id)
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_brand_access ENABLE ROW LEVEL SECURITY;

-- RLS for resources: super admins can manage all
CREATE POLICY "Super admins can manage resources"
  ON public.resources FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- RLS for resources: users can view resources their brand has access to, or resources with no brand restrictions
CREATE POLICY "Users can view accessible resources"
  ON public.resources FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR NOT EXISTS (
      SELECT 1 FROM public.resource_brand_access WHERE resource_id = resources.id
    )
    OR EXISTS (
      SELECT 1 FROM public.resource_brand_access rba
      WHERE rba.resource_id = resources.id
        AND public.has_brand_access(auth.uid(), rba.brand_id)
    )
  );

-- RLS for resource_brand_access: super admins can manage
CREATE POLICY "Super admins can manage resource brand access"
  ON public.resource_brand_access FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- RLS for resource_brand_access: users can view their brand's access
CREATE POLICY "Users can view resource brand access"
  ON public.resource_brand_access FOR SELECT
  TO authenticated
  USING (public.has_brand_access(auth.uid(), brand_id));

-- Add updated_at trigger
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
