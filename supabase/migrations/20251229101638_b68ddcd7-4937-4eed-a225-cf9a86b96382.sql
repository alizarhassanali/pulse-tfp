-- Create event-specific feedback tags table (if not exists from partial migration)
CREATE TABLE IF NOT EXISTS public.event_feedback_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, name)
);

-- Enable RLS if not already
ALTER TABLE public.event_feedback_tags ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view event tags for accessible events" ON public.event_feedback_tags;
DROP POLICY IF EXISTS "Users can manage event tags for accessible events" ON public.event_feedback_tags;

CREATE POLICY "Users can view event tags for accessible events"
ON public.event_feedback_tags
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_feedback_tags.event_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
  )
);

CREATE POLICY "Users can manage event tags for accessible events"
ON public.event_feedback_tags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_feedback_tags.event_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
  )
);

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_event_feedback_tags_updated_at ON public.event_feedback_tags;
CREATE TRIGGER update_event_feedback_tags_updated_at
BEFORE UPDATE ON public.event_feedback_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create new response_tag_assignments table for event-specific tags
CREATE TABLE public.response_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.event_feedback_tags(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual',
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(response_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.response_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for response_tag_assignments
CREATE POLICY "Users can view response tag assignments"
ON public.response_tag_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM survey_responses sr
    JOIN events e ON e.id = sr.event_id
    WHERE sr.id = response_tag_assignments.response_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
  )
);

CREATE POLICY "Users can manage response tag assignments"
ON public.response_tag_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM survey_responses sr
    JOIN events e ON e.id = sr.event_id
    WHERE sr.id = response_tag_assignments.response_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_response_tag_assignments_updated_at
BEFORE UPDATE ON public.response_tag_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();