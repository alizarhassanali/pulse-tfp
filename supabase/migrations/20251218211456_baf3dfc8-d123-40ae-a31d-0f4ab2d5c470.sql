-- Add source column to response_category_assignments
ALTER TABLE public.response_category_assignments 
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create submission_notes table for internal notes
CREATE TABLE public.submission_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on submission_notes
ALTER TABLE public.submission_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for submission_notes
CREATE POLICY "Users can view notes for accessible responses"
ON public.submission_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM survey_responses sr
    JOIN events e ON e.id = sr.event_id
    WHERE sr.id = submission_notes.response_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
  )
);

CREATE POLICY "Users with edit access can manage notes"
ON public.submission_notes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM survey_responses sr
    JOIN events e ON e.id = sr.event_id
    WHERE sr.id = submission_notes.response_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
  )
);

-- Create automation_rules table
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
  trigger_group text NOT NULL, -- 'promoter', 'passive', 'detractor'
  feedback_condition text NOT NULL DEFAULT 'either', -- 'with_feedback', 'without_feedback', 'either'
  channel text NOT NULL, -- 'email', 'sms'
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  delay_hours integer DEFAULT 0,
  throttle_days integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on automation_rules
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for automation_rules
CREATE POLICY "Users can view automation rules for accessible events"
ON public.automation_rules
FOR SELECT
USING (
  is_super_admin(auth.uid()) 
  OR has_brand_access(auth.uid(), brand_id)
  OR (event_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM events e WHERE e.id = automation_rules.event_id
    AND has_brand_access(auth.uid(), e.brand_id)
  ))
);

CREATE POLICY "Super admins and brand admins can manage automation rules"
ON public.automation_rules
FOR ALL
USING (
  is_super_admin(auth.uid()) OR has_role(auth.uid(), 'brand_admin'::app_role)
);

-- Create automation_logs table to track sends
CREATE TABLE public.automation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_rule_id uuid REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  response_id uuid REFERENCES public.survey_responses(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.templates(id) ON DELETE SET NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'skipped', 'failed'
  skip_reason text,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on automation_logs
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for automation_logs
CREATE POLICY "Users can view automation logs for accessible rules"
ON public.automation_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM automation_rules ar
    WHERE ar.id = automation_logs.automation_rule_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), ar.brand_id))
  )
);

CREATE POLICY "Super admins can manage automation logs"
ON public.automation_logs
FOR ALL
USING (is_super_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_submission_notes_updated_at
  BEFORE UPDATE ON public.submission_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_submission_notes_response_id ON public.submission_notes(response_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_event_id ON public.automation_rules(event_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON public.automation_logs(automation_rule_id);