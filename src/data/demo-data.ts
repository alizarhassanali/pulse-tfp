// Shared demo data for brands, locations, events, and contacts
// Using proper UUID format for database compatibility

export const DEMO_BRANDS = [
  { id: 'b1a2c3d4-e5f6-4789-abcd-111111111111', name: 'Conceptia Fertility' },
  { id: 'b1a2c3d4-e5f6-4789-abcd-222222222222', name: 'Generation Fertility' },
  { id: 'b1a2c3d4-e5f6-4789-abcd-333333333333', name: 'Grace Fertility' },
  { id: 'b1a2c3d4-e5f6-4789-abcd-444444444444', name: 'Olive Fertility' },
];

export const DEMO_LOCATIONS: Record<string, { id: string; name: string; gmb_link?: string }[]> = {
  'b1a2c3d4-e5f6-4789-abcd-222222222222': [
    { id: 'l1a2c3d4-e5f6-4789-abcd-111111111111', name: 'NewMarket', gmb_link: 'https://g.page/r/generation-newmarket/review' },
    { id: 'l1a2c3d4-e5f6-4789-abcd-222222222222', name: 'Vaughan', gmb_link: 'https://g.page/r/generation-vaughan/review' },
    { id: 'l1a2c3d4-e5f6-4789-abcd-333333333333', name: 'TorontoWest', gmb_link: 'https://g.page/r/generation-torontowest/review' },
    { id: 'l1a2c3d4-e5f6-4789-abcd-444444444444', name: 'Waterloo', gmb_link: 'https://g.page/r/generation-waterloo/review' },
  ],
  'b1a2c3d4-e5f6-4789-abcd-111111111111': [
    { id: 'l2a2c3d4-e5f6-4789-abcd-111111111111', name: 'Downtown', gmb_link: 'https://g.page/r/conceptia-downtown/review' },
    { id: 'l2a2c3d4-e5f6-4789-abcd-222222222222', name: 'Midtown', gmb_link: 'https://g.page/r/conceptia-midtown/review' },
  ],
  'b1a2c3d4-e5f6-4789-abcd-333333333333': [
    { id: 'l3a2c3d4-e5f6-4789-abcd-111111111111', name: 'Vancouver', gmb_link: 'https://g.page/r/grace-vancouver/review' },
    { id: 'l3a2c3d4-e5f6-4789-abcd-222222222222', name: 'Burnaby', gmb_link: 'https://g.page/r/grace-burnaby/review' },
  ],
  'b1a2c3d4-e5f6-4789-abcd-444444444444': [
    { id: 'l4a2c3d4-e5f6-4789-abcd-111111111111', name: 'Calgary', gmb_link: 'https://g.page/r/olive-calgary/review' },
    { id: 'l4a2c3d4-e5f6-4789-abcd-222222222222', name: 'Edmonton', gmb_link: 'https://g.page/r/olive-edmonton/review' },
  ],
};

export const DEMO_EVENTS = [
  { id: 'e1a2c3d4-e5f6-4789-abcd-111111111111', name: 'Post First Consult', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
  { id: 'e1a2c3d4-e5f6-4789-abcd-222222222222', name: 'Post Treatment Follow-up', brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333' },
  { id: 'e1a2c3d4-e5f6-4789-abcd-333333333333', name: 'Annual Check-In', brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111' },
];

// Demo contacts with all required fields including preferred_language
export const DEMO_CONTACTS = [
  // Original contacts
  { id: 'c1a2c3d4-e5f6-4789-abcd-111111111111', first_name: 'Jane', last_name: 'Doe', email: 'jane@clinic.com', phone: '+15551234567', preferred_channel: 'email', preferred_language: 'en', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222', location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111', status: 'active', last_score: 9, created_at: '2025-11-01T10:00:00Z', updated_at: '2025-12-15T14:30:00Z' },
  { id: 'c1a2c3d4-e5f6-4789-abcd-222222222222', first_name: 'John', last_name: 'Smith', email: null, phone: '+15557654321', preferred_channel: 'sms', preferred_language: 'es', brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333', location_id: 'l3a2c3d4-e5f6-4789-abcd-111111111111', status: 'unsubscribed', last_score: 6, created_at: '2025-10-15T09:00:00Z', updated_at: '2025-12-10T11:00:00Z' },
  { id: 'c1a2c3d4-e5f6-4789-abcd-333333333333', first_name: 'Emma', last_name: 'Johnson', email: 'emma@example.com', phone: '+15552345678', preferred_channel: 'both', preferred_language: 'en', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222', location_id: 'l1a2c3d4-e5f6-4789-abcd-222222222222', status: 'active', last_score: 10, created_at: '2025-09-20T08:00:00Z', updated_at: '2025-12-20T16:45:00Z' },
  { id: 'c1a2c3d4-e5f6-4789-abcd-444444444444', first_name: 'Michael', last_name: 'Chen', email: 'michael.chen@example.com', phone: '+15553456789', preferred_channel: 'email', preferred_language: 'zh', brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111', location_id: 'l2a2c3d4-e5f6-4789-abcd-111111111111', status: 'active', last_score: 8, created_at: '2025-08-10T12:00:00Z', updated_at: '2025-12-18T09:30:00Z' },
  { id: 'c1a2c3d4-e5f6-4789-abcd-555555555555', first_name: 'Sarah', last_name: 'Williams', email: 'sarah.w@example.com', phone: null, preferred_channel: 'email', preferred_language: 'fr', brand_id: 'b1a2c3d4-e5f6-4789-abcd-444444444444', location_id: 'l4a2c3d4-e5f6-4789-abcd-111111111111', status: 'active', last_score: 7, created_at: '2025-07-05T15:00:00Z', updated_at: '2025-12-22T10:15:00Z' },
  
  // Duplicate contacts for testing duplicate detection
  // Duplicate of Jane Doe - same email (jane@clinic.com)
  { id: 'c1a2c3d4-e5f6-4789-abcd-666666666666', first_name: 'Janet', last_name: 'Doe', email: 'jane@clinic.com', phone: '+15559876543', preferred_channel: 'sms', preferred_language: 'en', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222', location_id: 'l1a2c3d4-e5f6-4789-abcd-222222222222', status: 'active', last_score: null, created_at: '2025-12-01T10:00:00Z', updated_at: '2025-12-25T14:30:00Z' },
  
  // Duplicate of John Smith - same phone (+15557654321)
  { id: 'c1a2c3d4-e5f6-4789-abcd-777777777777', first_name: 'J.', last_name: 'Smith', email: 'jsmith@email.com', phone: '+15557654321', preferred_channel: 'email', preferred_language: 'en', brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333', location_id: 'l3a2c3d4-e5f6-4789-abcd-222222222222', status: 'active', last_score: 8, created_at: '2025-11-15T09:00:00Z', updated_at: '2025-12-20T11:00:00Z' },
  
  // Duplicate of Emma Johnson - same email (emma@example.com)
  { id: 'c1a2c3d4-e5f6-4789-abcd-888888888888', first_name: 'Emma', last_name: 'J.', email: 'emma@example.com', phone: '+15559999999', preferred_channel: 'email', preferred_language: 'es', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222', location_id: 'l1a2c3d4-e5f6-4789-abcd-333333333333', status: 'active', last_score: 7, created_at: '2025-10-05T08:00:00Z', updated_at: '2025-12-15T16:45:00Z' },
  
  // Duplicate of Michael Chen - same phone (+15553456789)
  { id: 'c1a2c3d4-e5f6-4789-abcd-999999999999', first_name: 'Mike', last_name: 'Chen', email: 'm.chen@example.com', phone: '+15553456789', preferred_channel: 'both', preferred_language: 'en', brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111', location_id: 'l2a2c3d4-e5f6-4789-abcd-222222222222', status: 'active', last_score: 9, created_at: '2025-09-01T12:00:00Z', updated_at: '2025-12-10T09:30:00Z' },
  
  // Additional duplicate of Sarah Williams - same email (sarah.w@example.com)
  { id: 'c1a2c3d4-e5f6-4789-abcd-aaaaaaaaaaaa', first_name: 'Sara', last_name: 'Williams', email: 'sarah.w@example.com', phone: '+15551112222', preferred_channel: 'sms', preferred_language: 'en', brand_id: 'b1a2c3d4-e5f6-4789-abcd-444444444444', location_id: 'l4a2c3d4-e5f6-4789-abcd-222222222222', status: 'active', last_score: 5, created_at: '2025-06-15T15:00:00Z', updated_at: '2025-12-18T10:15:00Z' },
];

// Demo sent logs with complete information
export const DEMO_SENT_LOGS = [
  {
    id: 's1a2c3d4-e5f6-4789-abcd-111111111111',
    created_at: '2025-12-22T09:30:00Z',
    sent_at: '2025-12-22T09:30:05Z',
    delivered_at: '2025-12-22T09:30:10Z',
    opened_at: '2025-12-22T10:15:00Z',
    completed_at: '2025-12-22T10:20:00Z',
    status: 'completed',
    channel: 'sms',
    contact: { id: 'c1a2c3d4-e5f6-4789-abcd-111111111111', first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com', phone: '+1 (555) 123-4567', preferred_channel: 'sms' },
    event: { name: 'Post First Consult', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    location: { name: 'NewMarket' },
    response: [{ nps_score: 9, completed_at: '2025-12-22T10:20:00Z' }],
  },
  {
    id: 's1a2c3d4-e5f6-4789-abcd-222222222222',
    created_at: '2025-12-21T14:00:00Z',
    sent_at: '2025-12-21T14:00:05Z',
    delivered_at: null,
    opened_at: null,
    completed_at: null,
    status: 'bounced',
    channel: 'email',
    contact: { id: 'c1a2c3d4-e5f6-4789-abcd-222222222222', first_name: 'Emma', last_name: 'Johnson', email: 'emma.johnson@example.com', phone: null, preferred_channel: 'email' },
    event: { name: 'Post Treatment Follow-up', brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333' },
    brand: { name: 'Grace Fertility' },
    location: { name: 'Vancouver' },
    response: [],
  },
  {
    id: 's1a2c3d4-e5f6-4789-abcd-333333333333',
    created_at: '2025-12-20T11:45:00Z',
    sent_at: '2025-12-20T11:45:05Z',
    delivered_at: null,
    opened_at: null,
    completed_at: null,
    status: 'throttled',
    channel: 'sms',
    contact: { id: 'c1a2c3d4-e5f6-4789-abcd-333333333333', first_name: 'Sarah', last_name: 'Lee', email: 'sarah.lee@example.com', phone: '+1 (555) 234-5678', preferred_channel: 'sms' },
    event: { name: 'Post First Consult', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    location: { name: 'Vaughan' },
    response: [],
  },
];

// Demo responses with multiple follow-up questions
export const DEMO_RESPONSES = [
  {
    id: 'r1a2c3d4-e5f6-4789-abcd-111111111111',
    nps_score: 6,
    completed_at: '2025-12-22T10:30:00Z',
    consent_given: true,
    brand: 'Generation Fertility',
    location: 'NewMarket',
    contact: {
      id: 'c1a2c3d4-e5f6-4789-abcd-111111111111',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
    },
    event: { name: 'Post First Consult', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    invitation: { channel: 'sms' },
    answers: [
      { question: 'What could we improve?', answer: 'The wait time was too long. I had to wait almost 45 minutes past my scheduled appointment.' },
      { question: 'How was the staff?', answer: 'The staff were friendly but seemed overwhelmed.' },
      { question: 'Would you visit again?', answer: 'Maybe, if scheduling improves.' },
    ],
  },
  {
    id: 'r1a2c3d4-e5f6-4789-abcd-222222222222',
    nps_score: 9,
    completed_at: '2025-12-21T14:15:00Z',
    consent_given: true,
    brand: 'Grace Fertility',
    location: 'Vancouver',
    contact: {
      id: 'c1a2c3d4-e5f6-4789-abcd-222222222222',
      first_name: 'Emma',
      last_name: 'Johnson',
      email: 'emma.johnson@example.com',
      phone: '+1 (555) 234-5678',
    },
    event: { name: 'Post Treatment Follow-up', brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333' },
    invitation: { channel: 'email' },
    answers: [
      { question: 'What did you like most?', answer: 'The personalized care and attention to detail. Dr. Chen was exceptional!' },
    ],
  },
  {
    id: 'r1a2c3d4-e5f6-4789-abcd-333333333333',
    nps_score: 3,
    completed_at: '2025-12-20T16:45:00Z',
    consent_given: false,
    brand: 'Conceptia Fertility',
    location: 'Downtown',
    contact: {
      id: 'c1a2c3d4-e5f6-4789-abcd-333333333333',
      first_name: 'Michael',
      last_name: 'Brown',
      email: 'michael.brown@example.com',
      phone: '+1 (555) 345-6789',
    },
    event: { name: 'Annual Check-In', brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111' },
    invitation: { channel: 'sms' },
    answers: [
      { question: 'What could we improve?', answer: 'Communication needs serious work. No one returned my calls for days.' },
      { question: 'Rate the facility cleanliness', answer: '3' },
    ],
  },
];

// Demo reviews per location
export const DEMO_REVIEWS = [
  {
    id: 'rev1-e5f6-4789-abcd-111111111111',
    reviewer_name: 'Alice L.',
    rating: 5,
    review_text: 'Amazing experience! The staff was incredibly friendly and professional. Dr. Smith took the time to explain everything clearly. Highly recommend this clinic to anyone looking for quality care.',
    created_at: '2025-12-21T10:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'NewMarket', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/1',
  },
  {
    id: 'rev2-e5f6-4789-abcd-222222222222',
    reviewer_name: 'Bob M.',
    rating: 2,
    review_text: 'Wait time was way too long. I had an appointment at 2pm but wasn\'t seen until 3:30pm. The actual care was fine but the scheduling needs improvement.',
    created_at: '2025-12-20T14:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'Vaughan', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/2',
  },
  {
    id: 'rev3-e5f6-4789-abcd-333333333333',
    reviewer_name: 'Carol P.',
    rating: 5,
    review_text: 'Best fertility clinic in the city! After trying for years, we finally have good news thanks to the team here.',
    created_at: '2025-12-19T09:00:00Z',
    responded_at: '2025-12-19T15:00:00Z',
    response_text: 'Thank you so much for sharing your wonderful news with us! We are thrilled to be part of your journey.',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'NewMarket', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/3',
  },
  {
    id: 'rev4-e5f6-4789-abcd-444444444444',
    reviewer_name: 'David R.',
    rating: 4,
    review_text: 'Good service overall. Modern facilities and knowledgeable doctors. Only giving 4 stars because parking was difficult.',
    created_at: '2025-12-18T11:00:00Z',
    responded_at: '2025-12-18T16:00:00Z',
    response_text: 'Thank you for your feedback! We appreciate your kind words and are working on improving parking options.',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333',
    location_id: 'l3a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'Vancouver', brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333' },
    brand: { name: 'Grace Fertility' },
    source_url: 'https://google.com/review/4',
  },
  {
    id: 'rev5-e5f6-4789-abcd-555555555555',
    reviewer_name: 'Emily S.',
    rating: 3,
    review_text: 'Average experience. Nothing special but nothing terrible either.',
    created_at: '2025-12-17T08:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-333333333333',
    location: { name: 'TorontoWest', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/5',
  },
  {
    id: 'rev6-e5f6-4789-abcd-666666666666',
    reviewer_name: 'Frank T.',
    rating: 5,
    review_text: 'Exceptional care from start to finish. The entire team was supportive and professional.',
    created_at: '2025-12-16T12:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-444444444444',
    location: { name: 'Waterloo', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/6',
  },
];

// Demo integrations for SFTP
export const DEMO_INTEGRATIONS = [
  {
    id: 'int-sftp-e5f6-4789-abcd-111111111111',
    event_id: 'e1a2c3d4-e5f6-4789-abcd-111111111111',
    type: 'sftp',
    status: 'active',
    config: {
      host: 'sftp.generationfertility.com',
      port: 22,
      username: 'survey_sync',
      remote_path: '/incoming/surveys/',
      schedule: 'Mon, Wed, Fri at 9:00 AM',
    },
    last_used_at: '2025-12-30T14:00:00Z',
    sends_count: 1250,
    created_at: '2025-11-15T10:00:00Z',
  },
];

// Demo events for manage events page
export const DEMO_MANAGE_EVENTS = [
  {
    id: 'e1a2c3d4-e5f6-4789-abcd-111111111111',
    name: 'post-first-consult',
    metric_question: 'How likely are you to recommend us to a friend or colleague?',
    status: 'active',
    created_at: '2025-12-15T10:00:00Z',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    brand: { name: 'Generation Fertility' },
    event_locations: [
      { location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111' },
      { location_id: 'l1a2c3d4-e5f6-4789-abcd-222222222222' },
      { location_id: 'l1a2c3d4-e5f6-4789-abcd-333333333333' },
      { location_id: 'l1a2c3d4-e5f6-4789-abcd-444444444444' },
    ],
    invitations: Array(3500).fill({ id: '1', completed_at: null }).map((_, i) => ({ 
      id: `inv-${i}`, 
      completed_at: i < 1050 ? '2025-12-01' : null 
    })),
    // Demo integrations
    integrations: [DEMO_INTEGRATIONS[0]],
  },
  {
    id: 'e1a2c3d4-e5f6-4789-abcd-222222222222',
    name: 'post-treatment-followup',
    metric_question: 'How satisfied are you with your treatment experience?',
    status: 'active',
    created_at: '2025-12-10T10:00:00Z',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333',
    brand: { name: 'Grace Fertility' },
    event_locations: [
      { location_id: 'l3a2c3d4-e5f6-4789-abcd-111111111111' },
      { location_id: 'l3a2c3d4-e5f6-4789-abcd-222222222222' },
    ],
    invitations: Array(1200).fill({}).map((_, i) => ({ 
      id: `inv-${i}`, 
      completed_at: i < 480 ? '2025-12-01' : null 
    })),
    integrations: [],
  },
  {
    id: 'e1a2c3d4-e5f6-4789-abcd-333333333333',
    name: 'annual-check-in',
    metric_question: 'How likely are you to recommend our services?',
    status: 'draft',
    created_at: '2025-12-05T10:00:00Z',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111',
    brand: { name: 'Conceptia Fertility' },
    event_locations: [
      { location_id: 'l2a2c3d4-e5f6-4789-abcd-111111111111' },
      { location_id: 'l2a2c3d4-e5f6-4789-abcd-222222222222' },
    ],
    invitations: [],
    integrations: [],
  },
];

// Helper to get available locations based on selected brands
export const getAvailableLocations = (selectedBrands: string[]) => {
  if (selectedBrands.length === 0) {
    return Object.values(DEMO_LOCATIONS).flat().map(l => ({ value: l.id, label: l.name }));
  }
  return selectedBrands
    .filter(b => DEMO_LOCATIONS[b])
    .flatMap(b => DEMO_LOCATIONS[b])
    .map(l => ({ value: l.id, label: l.name }));
};

// Helper to get all locations as flat array
export const getAllLocations = () => {
  return Object.entries(DEMO_LOCATIONS).flatMap(([brandId, locs]) => 
    locs.map(l => ({ ...l, brand_id: brandId }))
  );
};

// Helper to get brand name by ID
export const getBrandName = (brandId: string): string => {
  return DEMO_BRANDS.find(b => b.id === brandId)?.name || 'Unknown Brand';
};

// Helper to get location name by ID
export const getLocationName = (locationId: string): string => {
  for (const locs of Object.values(DEMO_LOCATIONS)) {
    const loc = locs.find(l => l.id === locationId);
    if (loc) return loc.name;
  }
  return 'Unknown Location';
};

// Helper to get location by ID
export const getLocationById = (locationId: string) => {
  for (const [brandId, locs] of Object.entries(DEMO_LOCATIONS)) {
    const loc = locs.find(l => l.id === locationId);
    if (loc) return { ...loc, brand_id: brandId };
  }
  return null;
};
