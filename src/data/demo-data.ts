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

// Demo reviews per location - with channel support and historical data for trends
export const DEMO_REVIEWS = [
  // Current period reviews (this week)
  {
    id: 'rev1-e5f6-4789-abcd-111111111111',
    reviewer_name: 'Alice L.',
    rating: 5,
    review_text: 'Amazing experience! The staff was incredibly friendly and professional. Dr. Smith took the time to explain everything clearly. Highly recommend this clinic to anyone looking for quality care.',
    created_at: '2025-12-30T10:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'NewMarket', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/1',
    channel: 'google',
    fetched_at: '2025-12-30T10:05:00Z',
  },
  {
    id: 'rev2-e5f6-4789-abcd-222222222222',
    reviewer_name: 'Bob M.',
    rating: 2,
    review_text: 'Wait time was way too long. I had an appointment at 2pm but wasn\'t seen until 3:30pm. The actual care was fine but the scheduling needs improvement.',
    created_at: '2025-12-29T14:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'Vaughan', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/2',
    channel: 'google',
    fetched_at: '2025-12-29T14:05:00Z',
  },
  {
    id: 'rev3-e5f6-4789-abcd-333333333333',
    reviewer_name: 'Carol P.',
    rating: 5,
    review_text: 'Best fertility clinic in the city! After trying for years, we finally have good news thanks to the team here.',
    created_at: '2025-12-28T09:00:00Z',
    responded_at: '2025-12-28T15:00:00Z',
    response_text: 'Thank you so much for sharing your wonderful news with us! We are thrilled to be part of your journey.',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'NewMarket', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/3',
    channel: 'google',
    fetched_at: '2025-12-28T09:05:00Z',
  },
  {
    id: 'rev4-e5f6-4789-abcd-444444444444',
    reviewer_name: 'David R.',
    rating: 4,
    review_text: 'Good service overall. Modern facilities and knowledgeable doctors. Only giving 4 stars because parking was difficult.',
    created_at: '2025-12-27T11:00:00Z',
    responded_at: '2025-12-27T16:00:00Z',
    response_text: 'Thank you for your feedback! We appreciate your kind words and are working on improving parking options.',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333',
    location_id: 'l3a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'Vancouver', brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333' },
    brand: { name: 'Grace Fertility' },
    source_url: 'https://google.com/review/4',
    channel: 'google',
    fetched_at: '2025-12-27T11:05:00Z',
  },
  {
    id: 'rev5-e5f6-4789-abcd-555555555555',
    reviewer_name: 'Emily S.',
    rating: 3,
    review_text: 'Average experience. Nothing special but nothing terrible either.',
    created_at: '2025-12-26T08:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-333333333333',
    location: { name: 'TorontoWest', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/5',
    channel: 'google',
    fetched_at: '2025-12-26T08:05:00Z',
  },
  {
    id: 'rev6-e5f6-4789-abcd-666666666666',
    reviewer_name: 'Frank T.',
    rating: 5,
    review_text: 'Exceptional care from start to finish. The entire team was supportive and professional.',
    created_at: '2025-12-25T12:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-444444444444',
    location: { name: 'Waterloo', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/6',
    channel: 'google',
    fetched_at: '2025-12-25T12:05:00Z',
  },
  {
    id: 'rev7-e5f6-4789-abcd-777777777777',
    reviewer_name: 'Grace H.',
    rating: 5,
    review_text: 'Dr. Johnson is incredible! Very knowledgeable and compassionate. Made a stressful process much easier.',
    created_at: '2025-12-24T15:30:00Z',
    responded_at: '2025-12-24T17:00:00Z',
    response_text: 'Thank you Grace! We\'re so glad Dr. Johnson could help make your experience positive.',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111',
    location_id: 'l2a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'Downtown', brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111' },
    brand: { name: 'Conceptia Fertility' },
    source_url: 'https://google.com/review/7',
    channel: 'google',
    fetched_at: '2025-12-24T15:35:00Z',
  },
  {
    id: 'rev8-e5f6-4789-abcd-888888888888',
    reviewer_name: 'Henry K.',
    rating: 4,
    review_text: 'Good clinic with nice facilities. Staff are friendly but sometimes hard to reach by phone.',
    created_at: '2025-12-23T10:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111',
    location_id: 'l2a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'Midtown', brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111' },
    brand: { name: 'Conceptia Fertility' },
    source_url: 'https://google.com/review/8',
    channel: 'google',
    fetched_at: '2025-12-23T10:05:00Z',
  },
  // Previous period reviews (last week - for trend calculation)
  {
    id: 'rev9-e5f6-4789-abcd-999999999999',
    reviewer_name: 'Irene L.',
    rating: 4,
    review_text: 'Very professional staff and clean environment. Would recommend.',
    created_at: '2025-12-20T09:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'NewMarket', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/9',
    channel: 'google',
    fetched_at: '2025-12-20T09:05:00Z',
  },
  {
    id: 'rev10-e5f6-4789-abcd-aaaaaaaaaaaa',
    reviewer_name: 'Jack W.',
    rating: 3,
    review_text: 'Decent experience but nothing extraordinary.',
    created_at: '2025-12-19T14:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'Vaughan', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/10',
    channel: 'google',
    fetched_at: '2025-12-19T14:05:00Z',
  },
  {
    id: 'rev11-e5f6-4789-abcd-bbbbbbbbbbbb',
    reviewer_name: 'Karen M.',
    rating: 5,
    review_text: 'Wonderful experience! The nurses are so caring and attentive.',
    created_at: '2025-12-18T11:00:00Z',
    responded_at: '2025-12-18T15:00:00Z',
    response_text: 'Thank you Karen! Our nursing team will be thrilled to hear this.',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333',
    location_id: 'l3a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'Vancouver', brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333' },
    brand: { name: 'Grace Fertility' },
    source_url: 'https://google.com/review/11',
    channel: 'google',
    fetched_at: '2025-12-18T11:05:00Z',
  },
  {
    id: 'rev12-e5f6-4789-abcd-cccccccccccc',
    reviewer_name: 'Liam O.',
    rating: 1,
    review_text: 'Very disappointed. Long wait, poor communication, and felt rushed during the consultation.',
    created_at: '2025-12-17T16:00:00Z',
    responded_at: '2025-12-18T10:00:00Z',
    response_text: 'We sincerely apologize for your experience. Please contact us directly so we can address your concerns.',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-333333333333',
    location: { name: 'TorontoWest', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/12',
    channel: 'google',
    fetched_at: '2025-12-17T16:05:00Z',
  },
  // Older reviews (for integration growth metrics)
  {
    id: 'rev13-e5f6-4789-abcd-dddddddddddd',
    reviewer_name: 'Maria N.',
    rating: 5,
    review_text: 'Excellent fertility clinic. Dr. Chen is amazing!',
    created_at: '2025-12-10T09:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'NewMarket', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/13',
    channel: 'google',
    fetched_at: '2025-12-10T09:05:00Z',
  },
  {
    id: 'rev14-e5f6-4789-abcd-eeeeeeeeeeee',
    reviewer_name: 'Nathan P.',
    rating: 4,
    review_text: 'Great experience overall. Minor hiccup with billing but resolved quickly.',
    created_at: '2025-12-05T13:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'Vaughan', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/14',
    channel: 'google',
    fetched_at: '2025-12-05T13:05:00Z',
  },
  {
    id: 'rev15-e5f6-4789-abcd-ffffffffffff',
    reviewer_name: 'Olivia Q.',
    rating: 5,
    review_text: 'Could not be happier with the care we received. Thank you!',
    created_at: '2025-11-28T10:00:00Z',
    responded_at: '2025-11-28T14:00:00Z',
    response_text: 'We\'re so happy to hear this Olivia! Thank you for choosing us.',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111',
    location_id: 'l2a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'Downtown', brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111' },
    brand: { name: 'Conceptia Fertility' },
    source_url: 'https://google.com/review/15',
    channel: 'google',
    fetched_at: '2025-11-28T10:05:00Z',
  },
  {
    id: 'rev16-e5f6-4789-abcd-101010101010',
    reviewer_name: 'Peter R.',
    rating: 4,
    review_text: 'Professional staff and comfortable waiting area. Good experience.',
    created_at: '2025-11-20T11:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333',
    location_id: 'l3a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'Burnaby', brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333' },
    brand: { name: 'Grace Fertility' },
    source_url: 'https://google.com/review/16',
    channel: 'google',
    fetched_at: '2025-11-20T11:05:00Z',
  },
  {
    id: 'rev17-e5f6-4789-abcd-111111111112',
    reviewer_name: 'Quinn S.',
    rating: 5,
    review_text: 'The best fertility clinic in Calgary! Highly recommend Dr. Patel.',
    created_at: '2025-11-15T09:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-444444444444',
    location_id: 'l4a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'Calgary', brand_id: 'b1a2c3d4-e5f6-4789-abcd-444444444444' },
    brand: { name: 'Olive Fertility' },
    source_url: 'https://google.com/review/17',
    channel: 'google',
    fetched_at: '2025-11-15T09:05:00Z',
  },
  {
    id: 'rev18-e5f6-4789-abcd-121212121212',
    reviewer_name: 'Rachel T.',
    rating: 2,
    review_text: 'Not impressed. Communication could be much better.',
    created_at: '2025-11-10T14:00:00Z',
    responded_at: '2025-11-11T10:00:00Z',
    response_text: 'We apologize Rachel. We\'ve taken your feedback to improve our communication processes.',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-444444444444',
    location_id: 'l4a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'Edmonton', brand_id: 'b1a2c3d4-e5f6-4789-abcd-444444444444' },
    brand: { name: 'Olive Fertility' },
    source_url: 'https://google.com/review/18',
    channel: 'google',
    fetched_at: '2025-11-10T14:05:00Z',
  },
  {
    id: 'rev19-e5f6-4789-abcd-131313131313',
    reviewer_name: 'Sam U.',
    rating: 4,
    review_text: 'Solid clinic with good results. Minor scheduling issues but overall positive.',
    created_at: '2025-11-05T10:00:00Z',
    responded_at: null,
    response_text: null,
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-444444444444',
    location: { name: 'Waterloo', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/19',
    channel: 'google',
    fetched_at: '2025-11-05T10:05:00Z',
  },
  {
    id: 'rev20-e5f6-4789-abcd-141414141414',
    reviewer_name: 'Tina V.',
    rating: 5,
    review_text: 'Life-changing experience. Forever grateful to the entire team!',
    created_at: '2025-11-01T12:00:00Z',
    responded_at: '2025-11-01T15:00:00Z',
    response_text: 'Thank you Tina! Messages like yours are why we do what we do.',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'NewMarket', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/20',
    channel: 'google',
    fetched_at: '2025-11-01T12:05:00Z',
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

// Demo SFTP sync logs for sync history feature
export const DEMO_SFTP_SYNC_LOGS = [
  {
    id: 'sync-e5f6-4789-abcd-111111111111',
    integration_id: 'int-sftp-e5f6-4789-abcd-111111111111',
    started_at: '2025-12-30T14:00:00Z',
    completed_at: '2025-12-30T14:02:15Z',
    status: 'success' as const,
    total_rows: 125,
    success_count: 125,
    error_count: 0,
    skipped_count: 0,
    file_name: 'contacts_20251230.csv',
    errors: [],
  },
  {
    id: 'sync-e5f6-4789-abcd-222222222222',
    integration_id: 'int-sftp-e5f6-4789-abcd-111111111111',
    started_at: '2025-12-27T14:00:00Z',
    completed_at: '2025-12-27T14:03:45Z',
    status: 'partial' as const,
    total_rows: 105,
    success_count: 98,
    error_count: 7,
    skipped_count: 0,
    file_name: 'daily_sync.csv',
    errors: [
      { row: 12, error: 'Invalid email format', value: 'not-an-email' },
      { row: 23, error: 'Missing required field: location_name', value: '' },
      { row: 45, error: 'Phone number format invalid', value: '555-1234' },
      { row: 67, error: 'Duplicate email found in batch', value: 'duplicate@example.com' },
      { row: 78, error: 'Location not found', value: 'Unknown Location' },
      { row: 89, error: 'Invalid preferred_channel value', value: 'fax' },
      { row: 101, error: 'Email domain not allowed', value: 'test@invalid.local' },
    ],
  },
  {
    id: 'sync-e5f6-4789-abcd-333333333333',
    integration_id: 'int-sftp-e5f6-4789-abcd-111111111111',
    started_at: '2025-12-25T14:00:00Z',
    completed_at: '2025-12-25T14:00:05Z',
    status: 'failed' as const,
    total_rows: 0,
    success_count: 0,
    error_count: 0,
    skipped_count: 0,
    file_name: null,
    errors: [{ error: 'Connection refused - server sftp.generationfertility.com:22 unreachable' }],
  },
  {
    id: 'sync-e5f6-4789-abcd-444444444444',
    integration_id: 'int-sftp-e5f6-4789-abcd-111111111111',
    started_at: '2025-12-23T14:00:00Z',
    completed_at: '2025-12-23T14:01:30Z',
    status: 'success' as const,
    total_rows: 89,
    success_count: 89,
    error_count: 0,
    skipped_count: 0,
    file_name: 'contacts_20251223.csv',
    errors: [],
  },
  {
    id: 'sync-e5f6-4789-abcd-555555555555',
    integration_id: 'int-sftp-e5f6-4789-abcd-111111111111',
    started_at: '2025-12-20T14:00:00Z',
    completed_at: '2025-12-20T14:02:00Z',
    status: 'success' as const,
    total_rows: 156,
    success_count: 156,
    error_count: 0,
    skipped_count: 0,
    file_name: 'contacts_20251220.csv',
    errors: [],
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
