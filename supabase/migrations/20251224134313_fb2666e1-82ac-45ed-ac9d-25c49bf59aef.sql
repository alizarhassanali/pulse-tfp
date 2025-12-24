-- Create custom_roles table for user-defined roles with specific permissions
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on custom_roles
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Super admins can manage custom roles
CREATE POLICY "Super admins can manage custom roles"
ON public.custom_roles
FOR ALL
USING (is_super_admin(auth.uid()));

-- All authenticated users can view custom roles
CREATE POLICY "Authenticated users can view custom roles"
ON public.custom_roles
FOR SELECT
USING (true);

-- Add custom_role_id to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN custom_role_id uuid REFERENCES public.custom_roles(id) ON DELETE SET NULL;

-- Create trigger for updated_at on custom_roles
CREATE TRIGGER update_custom_roles_updated_at
BEFORE UPDATE ON public.custom_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();