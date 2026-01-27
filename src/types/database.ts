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

export interface LocationGoogleReviewConfig {
  enabled: boolean;
  sync_frequency?: 'hourly' | 'every_4_hours' | 'every_8_hours' | 'daily' | 'weekly';
  notification_email?: string;
}

export interface Location {
  id: string;
  brand_id: string;
  name: string;
  address: string | null;
  timezone: string;
  gmb_link: string | null;
  google_place_id?: string | null;
  google_review_config?: LocationGoogleReviewConfig | null;
  phone?: string | null;
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
  preferred_language?: string;
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

// Review channel types
export type ReviewChannel = 'google' | 'facebook' | 'yelp' | 'tripadvisor';

export const REVIEW_CHANNELS = [
  { value: 'google', label: 'Google' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'yelp', label: 'Yelp' },
  { value: 'tripadvisor', label: 'TripAdvisor' },
] as const;

// Base config that all review channels share
export interface ReviewChannelBaseConfig {
  enabled: boolean;
  sync_frequency?: 'hourly' | 'every_4_hours' | 'every_8_hours' | 'daily' | 'weekly';
  notification_email?: string;
}

// Google-specific config
export interface GoogleReviewConfig extends ReviewChannelBaseConfig {
  place_id?: string;
}

// Facebook-specific config
export interface FacebookReviewConfig extends ReviewChannelBaseConfig {
  page_id?: string;
}

// Yelp-specific config
export interface YelpReviewConfig extends ReviewChannelBaseConfig {
  business_id?: string;
}

// TripAdvisor-specific config
export interface TripAdvisorReviewConfig extends ReviewChannelBaseConfig {
  location_id?: string;
}

// Union type for location's review channel configurations
export interface LocationReviewChannelsConfig {
  google?: GoogleReviewConfig;
  facebook?: FacebookReviewConfig;
  yelp?: YelpReviewConfig;
  tripadvisor?: TripAdvisorReviewConfig;
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
  channel: ReviewChannel;
  fetched_at: string | null;
  created_at: string;
  location?: Location;
  brand?: Brand;
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

// Language options for contacts
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' },
  { value: 'de', label: 'German' },
];

export const getLanguageLabel = (code: string): string => {
  return LANGUAGE_OPTIONS.find(l => l.value === code)?.label || code;
};
