-- 1. Create contact_tags table
CREATE TABLE public.contact_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on contact_tags
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_tags
CREATE POLICY "Authenticated users can view contact tags"
ON public.contact_tags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins can manage contact tags"
ON public.contact_tags FOR ALL
USING (is_super_admin(auth.uid()));

-- 2. Create contact_tag_assignments (many-to-many)
CREATE TABLE public.contact_tag_assignments (
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.contact_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (contact_id, tag_id)
);

-- Enable RLS on contact_tag_assignments
ALTER TABLE public.contact_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_tag_assignments
CREATE POLICY "Users can view contact tag assignments for accessible contacts"
ON public.contact_tag_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_tag_assignments.contact_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), c.brand_id))
  )
);

CREATE POLICY "Users can manage contact tag assignments for accessible contacts"
ON public.contact_tag_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_tag_assignments.contact_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), c.brand_id))
  )
);

-- 3. Create feedback_categories table
CREATE TABLE public.feedback_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on feedback_categories
ALTER TABLE public.feedback_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for feedback_categories
CREATE POLICY "Authenticated users can view active feedback categories"
ON public.feedback_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Super admins and brand admins can manage feedback categories"
ON public.feedback_categories FOR ALL
USING (
  is_super_admin(auth.uid()) OR has_role(auth.uid(), 'brand_admin')
);

-- 4. Create response_category_assignments (many-to-many)
CREATE TABLE public.response_category_assignments (
  response_id UUID NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.feedback_categories(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (response_id, category_id)
);

-- Enable RLS on response_category_assignments
ALTER TABLE public.response_category_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for response_category_assignments
CREATE POLICY "Users can view response category assignments"
ON public.response_category_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.survey_responses sr
    JOIN public.events e ON e.id = sr.event_id
    WHERE sr.id = response_category_assignments.response_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
  )
);

CREATE POLICY "Users can manage response category assignments"
ON public.response_category_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.survey_responses sr
    JOIN public.events e ON e.id = sr.event_id
    WHERE sr.id = response_category_assignments.response_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
  )
);

-- 5. Seed default contact tags
INSERT INTO public.contact_tags (name) VALUES
  ('IVF Patient'),
  ('INFC Patient'),
  ('IUI Patient'),
  ('Egg Freezing'),
  ('Donor Program');

-- 6. Seed default feedback categories
INSERT INTO public.feedback_categories (name) VALUES
  ('Financial Issue'),
  ('Wait Time'),
  ('Staff Experience'),
  ('Scheduling'),
  ('Communication'),
  ('Facility'),
  ('Other');

-- 7. Add trigger for feedback_categories updated_at
CREATE TRIGGER update_feedback_categories_updated_at
BEFORE UPDATE ON public.feedback_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();