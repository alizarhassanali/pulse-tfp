export interface Brand {
  id: string;
  name: string;
  subdomain: string | null;
  logo_url: string | null;
  colors: {
    primary: string;
    topBar: string;
    button: string;
    text: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  brand_id: string;
  name: string;
  address: string | null;
  timezone: string;
  gmb_link: string | null;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}

export interface Contact {
  id: string;
  brand_id: string;
  location_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_channel: string;
  tags: string[];
  status: string;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
  brand?: Brand;
  location?: Location;
}

export interface Event {
  id: string;
  brand_id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  status: string;
  throttle_days: number;
  languages: string[];
  metric_question: string | null;
  intro_message: string | null;
  thank_you_config: Record<string, unknown>;
  consent_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  brand?: Brand;
  locations?: Location[];
}

export interface EventQuestion {
  id: string;
  event_id: string;
  order_num: number;
  type: 'free_response' | 'scale' | 'select_one' | 'select_multiple' | 'google_redirect';
  config: {
    question?: string;
    categories?: string[];
    min?: number;
    max?: number;
    minLabel?: string;
    maxLabel?: string;
    options?: string[];
    redirectUrl?: string;
  };
  show_for: ('promoters' | 'passives' | 'detractors')[];
  required: boolean;
  created_at: string;
}

export interface SurveyInvitation {
  id: string;
  event_id: string;
  contact_id: string;
  channel: 'email' | 'sms' | 'qr' | 'web' | 'link';
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'completed' | 'bounced' | 'failed';
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  completed_at: string | null;
  created_at: string;
  event?: Event;
  contact?: Contact;
}

export interface SurveyResponse {
  id: string;
  invitation_id: string | null;
  contact_id: string | null;
  event_id: string;
  nps_score: number | null;
  answers: Array<{
    questionId: string;
    question: string;
    answer: string | number | string[];
  }>;
  device_info: Record<string, unknown>;
  consent_given: boolean;
  completed_at: string;
  created_at: string;
  contact?: Contact;
  event?: Event;
}

export interface Integration {
  id: string;
  event_id: string;
  type: 'link' | 'qr_code' | 'email' | 'sms' | 'email_sms_preference' | 'sftp' | 'web_embed';
  config: Record<string, unknown>;
  status: string;
  last_used_at: string | null;
  sends_count: number;
  created_at: string;
  updated_at: string;
  event?: Event;
}

export interface Template {
  id: string;
  brand_id: string;
  type: 'email' | 'sms';
  name: string;
  subject: string | null;
  body: string;
  variables: string[];
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  brand_id: string;
  location_id: string | null;
  reviewer_name: string | null;
  rating: number;
  review_text: string | null;
  responded_at: string | null;
  response_text: string | null;
  source_url: string | null;
  external_id: string | null;
  created_at: string;
  location?: Location;
}

export type ScoreCategory = 'promoters' | 'passives' | 'detractors';

export const getScoreCategory = (score: number): ScoreCategory => {
  if (score >= 9) return 'promoters';
  if (score >= 7) return 'passives';
  return 'detractors';
};

export const getScoreBadgeClass = (score: number): string => {
  const category = getScoreCategory(score);
  switch (category) {
    case 'promoters':
      return 'badge-promoter';
    case 'passives':
      return 'badge-passive';
    case 'detractors':
      return 'badge-detractor';
  }
};
