-- Assign tags randomly to contacts
-- First get all tag IDs and assign them randomly
WITH all_tags AS (
  SELECT id, name FROM public.contact_tags
),
tag_assignments AS (
  -- Sarah Johnson: VIP, IVF Consult - Dec 2025, Returning Patient
  SELECT 'c0000001-0000-0000-0000-000000000001'::uuid as contact_id, id as tag_id FROM all_tags WHERE name IN ('VIP', 'IVF Consult - Dec 2025', 'Returning Patient')
  UNION ALL
  -- Michael Chen: New Patient, Insurance Verified
  SELECT 'c0000002-0000-0000-0000-000000000002'::uuid, id FROM all_tags WHERE name IN ('New Patient', 'Insurance Verified')
  UNION ALL
  -- Emily Rodriguez: INFC - Jun 2025, Self-Pay
  SELECT 'c0000003-0000-0000-0000-000000000003'::uuid, id FROM all_tags WHERE name IN ('INFC - Jun 2025', 'Self-Pay')
  UNION ALL
  -- David Kim: IVF Patient, IVF Consult - Jan 2026, VIP
  SELECT 'c0000004-0000-0000-0000-000000000004'::uuid, id FROM all_tags WHERE name IN ('IVF Patient', 'IVF Consult - Jan 2026', 'VIP')
  UNION ALL
  -- Jessica Williams: Returning Patient, INFC Patient
  SELECT 'c0000005-0000-0000-0000-000000000005'::uuid, id FROM all_tags WHERE name IN ('Returning Patient', 'INFC Patient')
  UNION ALL
  -- James Brown: New Patient, IUI Patient, Insurance Verified
  SELECT 'c0000006-0000-0000-0000-000000000006'::uuid, id FROM all_tags WHERE name IN ('New Patient', 'IUI Patient', 'Insurance Verified')
  UNION ALL
  -- Amanda Taylor: Egg Freezing, Self-Pay, VIP
  SELECT 'c0000007-0000-0000-0000-000000000007'::uuid, id FROM all_tags WHERE name IN ('Egg Freezing', 'Self-Pay', 'VIP')
  UNION ALL
  -- Robert Garcia: INFC - Jul 2025, Returning Patient
  SELECT 'c0000008-0000-0000-0000-000000000008'::uuid, id FROM all_tags WHERE name IN ('INFC - Jul 2025', 'Returning Patient')
  UNION ALL
  -- Lisa Martinez: Donor Program, Insurance Verified, IVF Consult - Dec 2025
  SELECT 'c0000009-0000-0000-0000-000000000009'::uuid, id FROM all_tags WHERE name IN ('Donor Program', 'Insurance Verified', 'IVF Consult - Dec 2025')
  UNION ALL
  -- Christopher Lee: New Patient
  SELECT 'c0000010-0000-0000-0000-000000000010'::uuid, id FROM all_tags WHERE name IN ('New Patient')
  UNION ALL
  -- Michelle Anderson: IVF Patient, Returning Patient, VIP, Self-Pay
  SELECT 'c0000011-0000-0000-0000-000000000011'::uuid, id FROM all_tags WHERE name IN ('IVF Patient', 'Returning Patient', 'VIP', 'Self-Pay')
  UNION ALL
  -- Daniel Thomas: INFC Patient, INFC - Jun 2025
  SELECT 'c0000012-0000-0000-0000-000000000012'::uuid, id FROM all_tags WHERE name IN ('INFC Patient', 'INFC - Jun 2025')
  UNION ALL
  -- Ashley Jackson: IUI Patient, New Patient, Insurance Verified
  SELECT 'c0000013-0000-0000-0000-000000000013'::uuid, id FROM all_tags WHERE name IN ('IUI Patient', 'New Patient', 'Insurance Verified')
  UNION ALL
  -- Matthew White: Egg Freezing, IVF Consult - Jan 2026
  SELECT 'c0000014-0000-0000-0000-000000000014'::uuid, id FROM all_tags WHERE name IN ('Egg Freezing', 'IVF Consult - Jan 2026')
  UNION ALL
  -- Jennifer Harris: Donor Program, VIP, Returning Patient
  SELECT 'c0000015-0000-0000-0000-000000000015'::uuid, id FROM all_tags WHERE name IN ('Donor Program', 'VIP', 'Returning Patient')
)
INSERT INTO public.contact_tag_assignments (contact_id, tag_id)
SELECT contact_id, tag_id FROM tag_assignments
ON CONFLICT DO NOTHING;