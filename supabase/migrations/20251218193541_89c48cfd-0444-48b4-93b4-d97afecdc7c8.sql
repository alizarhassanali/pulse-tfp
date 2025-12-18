-- Create enum for permission levels
CREATE TYPE public.permission_level AS ENUM ('no_access', 'view', 'edit', 'respond');

-- Create enum for sections
CREATE TYPE public.app_section AS ENUM (
  'dashboard',
  'questions',
  'sent_logs',
  'manage_events',
  'integration',
  'reviews',
  'contacts',
  'templates',
  'brands',
  'users'
);

-- Create user_section_permissions table
CREATE TABLE public.user_section_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section app_section NOT NULL,
  permission permission_level NOT NULL DEFAULT 'no_access',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, section)
);

-- Enable RLS
ALTER TABLE public.user_section_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can manage all permissions
CREATE POLICY "Super admins can manage all permissions"
ON public.user_section_permissions
FOR ALL
USING (is_super_admin(auth.uid()));

-- Policy: Users can view their own permissions
CREATE POLICY "Users can view own permissions"
ON public.user_section_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_section_permissions_updated_at
BEFORE UPDATE ON public.user_section_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get user permissions
CREATE OR REPLACE FUNCTION public.get_user_section_permission(_user_id UUID, _section app_section)
RETURNS permission_level
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT permission FROM public.user_section_permissions WHERE user_id = _user_id AND section = _section),
    'no_access'::permission_level
  )
$$;

-- Create function to check if user has at least view access
CREATE OR REPLACE FUNCTION public.can_view_section(_user_id UUID, _section app_section)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_super_admin(_user_id) 
    OR EXISTS (
      SELECT 1 FROM public.user_section_permissions 
      WHERE user_id = _user_id 
        AND section = _section 
        AND permission IN ('view', 'edit', 'respond')
    )
$$;

-- Create function to check if user has edit access
CREATE OR REPLACE FUNCTION public.can_edit_section(_user_id UUID, _section app_section)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_super_admin(_user_id) 
    OR EXISTS (
      SELECT 1 FROM public.user_section_permissions 
      WHERE user_id = _user_id 
        AND section = _section 
        AND permission IN ('edit', 'respond')
    )
$$;

-- Add status column to profiles for user suspension
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';