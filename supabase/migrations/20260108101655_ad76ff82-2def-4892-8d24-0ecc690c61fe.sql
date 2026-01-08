-- =============================================
-- PHASE 1: DATA INTEGRITY FIXES
-- =============================================

-- 1.1 Add NOT NULL constraints to core relationships
ALTER TABLE contacts ALTER COLUMN brand_id SET NOT NULL;
ALTER TABLE events ALTER COLUMN brand_id SET NOT NULL;
ALTER TABLE locations ALTER COLUMN brand_id SET NOT NULL;
ALTER TABLE survey_responses ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE event_questions ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE integrations ALTER COLUMN event_id SET NOT NULL;

-- 1.2 Drop existing triggers if they exist, then create
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at 
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at 
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at 
  BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at 
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_rules_updated_at ON automation_rules;
CREATE TRIGGER update_automation_rules_updated_at 
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at 
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_roles_updated_at ON custom_roles;
CREATE TRIGGER update_custom_roles_updated_at 
  BEFORE UPDATE ON custom_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_section_permissions_updated_at ON user_section_permissions;
CREATE TRIGGER update_user_section_permissions_updated_at 
  BEFORE UPDATE ON user_section_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_feedback_tags_updated_at ON event_feedback_tags;
CREATE TRIGGER update_event_feedback_tags_updated_at 
  BEFORE UPDATE ON event_feedback_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_categories_updated_at ON feedback_categories;
CREATE TRIGGER update_feedback_categories_updated_at 
  BEFORE UPDATE ON feedback_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- PHASE 2: PERFORMANCE INDEXES
-- =============================================

-- Contacts lookups
CREATE INDEX IF NOT EXISTS idx_contacts_brand_id ON contacts(brand_id);
CREATE INDEX IF NOT EXISTS idx_contacts_location_id ON contacts(location_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Survey responses (dashboard performance)
CREATE INDEX IF NOT EXISTS idx_survey_responses_event_id ON survey_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_contact_id ON survey_responses(contact_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completed_at ON survey_responses(completed_at);
CREATE INDEX IF NOT EXISTS idx_survey_responses_nps_score ON survey_responses(nps_score);

-- Survey invitations (sent logs)
CREATE INDEX IF NOT EXISTS idx_survey_invitations_event_id ON survey_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_survey_invitations_contact_id ON survey_invitations(contact_id);
CREATE INDEX IF NOT EXISTS idx_survey_invitations_status ON survey_invitations(status);
CREATE INDEX IF NOT EXISTS idx_survey_invitations_sent_at ON survey_invitations(sent_at);

-- Reviews page
CREATE INDEX IF NOT EXISTS idx_reviews_brand_id ON reviews(brand_id);
CREATE INDEX IF NOT EXISTS idx_reviews_location_id ON reviews(location_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_channel ON reviews(channel);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Automation monitoring
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_scheduled_at ON automation_logs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON automation_logs(automation_rule_id);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_brand_id ON events(brand_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- User access lookups
CREATE INDEX IF NOT EXISTS idx_user_brand_access_user_id ON user_brand_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brand_access_brand_id ON user_brand_access(brand_id);
CREATE INDEX IF NOT EXISTS idx_user_location_access_user_id ON user_location_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- =============================================
-- PHASE 3: SCHEMA CLEANUP
-- =============================================

-- Remove redundant JSONB tags column (normalized contact_tag_assignments is in use)
ALTER TABLE contacts DROP COLUMN IF EXISTS tags;

-- Remove duplicate google_review_config from brands (locations has review_channels_config)
ALTER TABLE brands DROP COLUMN IF EXISTS google_review_config;

-- Remove legacy google_review_config from locations (replaced by review_channels_config)
ALTER TABLE locations DROP COLUMN IF EXISTS google_review_config;