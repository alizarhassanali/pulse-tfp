
-- CNP (Otto Onboard) trigger types table
CREATE TABLE public.cnp_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cnp_triggers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view accessible CNP triggers"
  ON public.cnp_triggers
  FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), brand_id));

CREATE POLICY "Super admins and brand admins can manage CNP triggers"
  ON public.cnp_triggers
  FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()) OR (has_role(auth.uid(), 'brand_admin') AND has_brand_access(auth.uid(), brand_id)));

-- Seed some default trigger types
INSERT INTO public.cnp_triggers (brand_id, name, description)
SELECT b.id, t.name, t.description
FROM public.brands b
CROSS JOIN (
  VALUES 
    ('New Patient Consult', 'Sent after first consultation'),
    ('Review Appointment', 'Sent after review consultation'),
    ('Follow-Up Visit', 'Sent after follow-up appointments'),
    ('Treatment Complete', 'Sent when treatment cycle is completed'),
    ('Post-Procedure', 'Sent after a medical procedure')
) AS t(name, description);
