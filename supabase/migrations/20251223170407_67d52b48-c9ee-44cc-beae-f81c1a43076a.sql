-- Insert additional sample tags
INSERT INTO public.contact_tags (id, name) VALUES
  (gen_random_uuid(), 'IVF Consult - Dec 2025'),
  (gen_random_uuid(), 'IVF Consult - Jan 2026'),
  (gen_random_uuid(), 'INFC - Jun 2025'),
  (gen_random_uuid(), 'INFC - Jul 2025'),
  (gen_random_uuid(), 'Returning Patient'),
  (gen_random_uuid(), 'New Patient'),
  (gen_random_uuid(), 'VIP'),
  (gen_random_uuid(), 'Insurance Verified'),
  (gen_random_uuid(), 'Self-Pay')
ON CONFLICT DO NOTHING;

-- Insert sample contacts
INSERT INTO public.contacts (id, first_name, last_name, email, phone, brand_id, location_id, preferred_channel, status) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Sarah', 'Johnson', 'sarah.johnson@email.com', '+1-555-0101', '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'email', 'active'),
  ('c0000002-0000-0000-0000-000000000002', 'Michael', 'Chen', 'michael.chen@email.com', '+1-555-0102', '11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sms', 'active'),
  ('c0000003-0000-0000-0000-000000000003', 'Emily', 'Rodriguez', 'emily.rodriguez@email.com', '+1-555-0103', '22222222-2222-2222-2222-222222222222', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'both', 'active'),
  ('c0000004-0000-0000-0000-000000000004', 'David', 'Kim', 'david.kim@email.com', '+1-555-0104', '22222222-2222-2222-2222-222222222222', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'email', 'active'),
  ('c0000005-0000-0000-0000-000000000005', 'Jessica', 'Williams', 'jessica.w@email.com', '+1-555-0105', '33333333-3333-3333-3333-333333333333', 'ccccccc1-cccc-cccc-cccc-cccccccccccc', 'sms', 'active'),
  ('c0000006-0000-0000-0000-000000000006', 'James', 'Brown', 'jbrown@email.com', '+1-555-0106', '33333333-3333-3333-3333-333333333333', 'ccccccc2-cccc-cccc-cccc-cccccccccccc', 'both', 'active'),
  ('c0000007-0000-0000-0000-000000000007', 'Amanda', 'Taylor', 'amanda.taylor@email.com', '+1-555-0107', '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'email', 'active'),
  ('c0000008-0000-0000-0000-000000000008', 'Robert', 'Garcia', 'rgarcia@email.com', '+1-555-0108', '11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sms', 'active'),
  ('c0000009-0000-0000-0000-000000000009', 'Lisa', 'Martinez', 'lisa.m@email.com', '+1-555-0109', '22222222-2222-2222-2222-222222222222', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'both', 'active'),
  ('c0000010-0000-0000-0000-000000000010', 'Christopher', 'Lee', 'chris.lee@email.com', '+1-555-0110', '22222222-2222-2222-2222-222222222222', 'bbbbbbb2-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'email', 'active'),
  ('c0000011-0000-0000-0000-000000000011', 'Michelle', 'Anderson', 'michelle.a@email.com', '+1-555-0111', '33333333-3333-3333-3333-333333333333', 'ccccccc1-cccc-cccc-cccc-cccccccccccc', 'email', 'active'),
  ('c0000012-0000-0000-0000-000000000012', 'Daniel', 'Thomas', 'dthomas@email.com', '+1-555-0112', '33333333-3333-3333-3333-333333333333', 'ccccccc2-cccc-cccc-cccc-cccccccccccc', 'sms', 'inactive'),
  ('c0000013-0000-0000-0000-000000000013', 'Ashley', 'Jackson', 'ashley.j@email.com', '+1-555-0113', '11111111-1111-1111-1111-111111111111', 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'both', 'active'),
  ('c0000014-0000-0000-0000-000000000014', 'Matthew', 'White', 'matt.white@email.com', '+1-555-0114', '11111111-1111-1111-1111-111111111111', 'aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'email', 'active'),
  ('c0000015-0000-0000-0000-000000000015', 'Jennifer', 'Harris', 'jen.harris@email.com', '+1-555-0115', '22222222-2222-2222-2222-222222222222', 'bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sms', 'active');