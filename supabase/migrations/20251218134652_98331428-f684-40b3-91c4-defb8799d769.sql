-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'brand_admin', 'clinic_manager', 'staff', 'read_only');

-- Create brands table
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  logo_url TEXT,
  colors JSONB DEFAULT '{"primary": "#FF887C", "topBar": "#263F6A", "button": "#FF887C", "text": "#263F6A"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  gmb_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'staff',
  UNIQUE (user_id, role)
);

-- Create user_brand_access table
CREATE TABLE public.user_brand_access (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, brand_id)
);

-- Create user_location_access table
CREATE TABLE public.user_location_access (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, location_id)
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'nps',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  throttle_days INTEGER DEFAULT 90,
  languages TEXT[] DEFAULT ARRAY['en'],
  metric_question TEXT,
  intro_message TEXT,
  thank_you_config JSONB DEFAULT '{}'::jsonb,
  consent_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_event_name UNIQUE (name)
);

-- Create event_questions table
CREATE TABLE public.event_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  order_num INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  show_for TEXT[] DEFAULT ARRAY['promoters', 'passives', 'detractors'],
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_locations table
CREATE TABLE public.event_locations (
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, location_id)
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  preferred_channel TEXT DEFAULT 'email',
  tags JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create survey_invitations table
CREATE TABLE public.survey_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES public.survey_invitations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  answers JSONB DEFAULT '[]'::jsonb,
  device_info JSONB DEFAULT '{}'::jsonb,
  consent_given BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  last_used_at TIMESTAMPTZ,
  sends_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  reviewer_name TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  responded_at TIMESTAMPTZ,
  response_text TEXT,
  source_url TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_brand_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_location_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create helper function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'
  )
$$;

-- Create helper function to check brand access
CREATE OR REPLACE FUNCTION public.has_brand_access(_user_id UUID, _brand_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    public.is_super_admin(_user_id) 
    OR EXISTS (
      SELECT 1
      FROM public.user_brand_access
      WHERE user_id = _user_id
        AND brand_id = _brand_id
    )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for brands
CREATE POLICY "Users can view accessible brands" ON public.brands
  FOR SELECT USING (
    public.is_super_admin(auth.uid()) 
    OR public.has_brand_access(auth.uid(), id)
  );

CREATE POLICY "Super admins can manage brands" ON public.brands
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for locations
CREATE POLICY "Users can view accessible locations" ON public.locations
  FOR SELECT USING (
    public.is_super_admin(auth.uid()) 
    OR public.has_brand_access(auth.uid(), brand_id)
  );

CREATE POLICY "Super admins can manage locations" ON public.locations
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for events
CREATE POLICY "Users can view accessible events" ON public.events
  FOR SELECT USING (
    public.is_super_admin(auth.uid()) 
    OR public.has_brand_access(auth.uid(), brand_id)
  );

CREATE POLICY "Users with brand access can manage events" ON public.events
  FOR ALL USING (
    public.is_super_admin(auth.uid()) 
    OR public.has_brand_access(auth.uid(), brand_id)
  );

-- RLS Policies for event_questions
CREATE POLICY "Users can view event questions" ON public.event_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND (public.is_super_admin(auth.uid()) OR public.has_brand_access(auth.uid(), e.brand_id))
    )
  );

CREATE POLICY "Users can manage event questions" ON public.event_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND (public.is_super_admin(auth.uid()) OR public.has_brand_access(auth.uid(), e.brand_id))
    )
  );

-- RLS Policies for contacts
CREATE POLICY "Users can view accessible contacts" ON public.contacts
  FOR SELECT USING (
    public.is_super_admin(auth.uid()) 
    OR public.has_brand_access(auth.uid(), brand_id)
  );

CREATE POLICY "Users can manage accessible contacts" ON public.contacts
  FOR ALL USING (
    public.is_super_admin(auth.uid()) 
    OR public.has_brand_access(auth.uid(), brand_id)
  );

-- RLS Policies for survey_invitations
CREATE POLICY "Users can view survey invitations" ON public.survey_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND (public.is_super_admin(auth.uid()) OR public.has_brand_access(auth.uid(), e.brand_id))
    )
  );

CREATE POLICY "Users can manage survey invitations" ON public.survey_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND (public.is_super_admin(auth.uid()) OR public.has_brand_access(auth.uid(), e.brand_id))
    )
  );

-- RLS Policies for survey_responses
CREATE POLICY "Users can view survey responses" ON public.survey_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND (public.is_super_admin(auth.uid()) OR public.has_brand_access(auth.uid(), e.brand_id))
    )
  );

CREATE POLICY "Users can manage survey responses" ON public.survey_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND (public.is_super_admin(auth.uid()) OR public.has_brand_access(auth.uid(), e.brand_id))
    )
  );

-- RLS Policies for integrations
CREATE POLICY "Users can view integrations" ON public.integrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND (public.is_super_admin(auth.uid()) OR public.has_brand_access(auth.uid(), e.brand_id))
    )
  );

CREATE POLICY "Users can manage integrations" ON public.integrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND (public.is_super_admin(auth.uid()) OR public.has_brand_access(auth.uid(), e.brand_id))
    )
  );

-- RLS Policies for templates
CREATE POLICY "Users can view accessible templates" ON public.templates
  FOR SELECT USING (
    public.is_super_admin(auth.uid()) 
    OR public.has_brand_access(auth.uid(), brand_id)
  );

CREATE POLICY "Users can manage accessible templates" ON public.templates
  FOR ALL USING (
    public.is_super_admin(auth.uid()) 
    OR public.has_brand_access(auth.uid(), brand_id)
  );

-- RLS Policies for reviews
CREATE POLICY "Users can view accessible reviews" ON public.reviews
  FOR SELECT USING (
    public.is_super_admin(auth.uid()) 
    OR public.has_brand_access(auth.uid(), brand_id)
  );

CREATE POLICY "Users can manage accessible reviews" ON public.reviews
  FOR ALL USING (
    public.is_super_admin(auth.uid()) 
    OR public.has_brand_access(auth.uid(), brand_id)
  );

-- RLS Policies for user_brand_access
CREATE POLICY "Users can view own brand access" ON public.user_brand_access
  FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage brand access" ON public.user_brand_access
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for user_location_access
CREATE POLICY "Users can view own location access" ON public.user_location_access
  FOR SELECT USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage location access" ON public.user_location_access
  FOR ALL USING (public.is_super_admin(auth.uid()));

-- RLS Policies for event_locations
CREATE POLICY "Users can view event locations" ON public.event_locations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND (public.is_super_admin(auth.uid()) OR public.has_brand_access(auth.uid(), e.brand_id))
    )
  );

CREATE POLICY "Users can manage event locations" ON public.event_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND (public.is_super_admin(auth.uid()) OR public.has_brand_access(auth.uid(), e.brand_id))
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1))
  );
  
  -- By default, give new users 'staff' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'staff');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.survey_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.survey_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;