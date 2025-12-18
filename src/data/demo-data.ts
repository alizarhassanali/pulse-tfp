// Shared demo data for brands, locations, events, and contacts

export const DEMO_BRANDS = [
  { id: 'conceptia', name: 'Conceptia Fertility' },
  { id: 'generation', name: 'Generation Fertility' },
  { id: 'grace', name: 'Grace Fertility' },
  { id: 'olive', name: 'Olive Fertility' },
];

export const DEMO_LOCATIONS: Record<string, { id: string; name: string }[]> = {
  generation: [
    { id: 'newmarket', name: 'NewMarket' },
    { id: 'vaughan', name: 'Vaughan' },
    { id: 'torontowest', name: 'TorontoWest' },
    { id: 'waterloo', name: 'Waterloo' },
  ],
  conceptia: [
    { id: 'downtown', name: 'Downtown' },
    { id: 'midtown', name: 'Midtown' },
  ],
  grace: [
    { id: 'vancouver', name: 'Vancouver' },
    { id: 'burnaby', name: 'Burnaby' },
  ],
  olive: [
    { id: 'calgary', name: 'Calgary' },
    { id: 'edmonton', name: 'Edmonton' },
  ],
};

export const DEMO_EVENTS = [
  { id: 'post-first-consult', name: 'Post First Consult' },
  { id: 'post-treatment-followup', name: 'Post Treatment Follow-up' },
  { id: 'annual-checkup', name: 'Annual Check-In' },
];

// Demo contacts with all required fields
export const DEMO_CONTACTS = [
  { id: 'c1', first_name: 'Jane', last_name: 'Doe', email: 'jane@clinic.com', phone: '+15551234567', preferred_channel: 'email', brand_id: 'generation', location_id: 'newmarket', status: 'active', last_score: 9 },
  { id: 'c2', first_name: 'John', last_name: 'Smith', email: null, phone: '+15557654321', preferred_channel: 'sms', brand_id: 'grace', location_id: 'vancouver', status: 'unsubscribed', last_score: 6 },
  { id: 'c3', first_name: 'Emma', last_name: 'Johnson', email: 'emma@example.com', phone: '+15552345678', preferred_channel: 'both', brand_id: 'generation', location_id: 'vaughan', status: 'active', last_score: 10 },
  { id: 'c4', first_name: 'Michael', last_name: 'Chen', email: 'michael.chen@example.com', phone: '+15553456789', preferred_channel: 'email', brand_id: 'conceptia', location_id: 'downtown', status: 'active', last_score: 8 },
  { id: 'c5', first_name: 'Sarah', last_name: 'Williams', email: 'sarah.w@example.com', phone: null, preferred_channel: 'email', brand_id: 'olive', location_id: 'calgary', status: 'active', last_score: 7 },
];

// Demo sent logs with complete information
export const DEMO_SENT_LOGS = [
  {
    id: 'demo-1',
    created_at: '2025-12-22T09:30:00Z',
    sent_at: '2025-12-22T09:30:05Z',
    delivered_at: '2025-12-22T09:30:10Z',
    opened_at: '2025-12-22T10:15:00Z',
    completed_at: '2025-12-22T10:20:00Z',
    status: 'completed',
    channel: 'sms',
    contact: { id: 'c1', first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com', phone: '+1 (555) 123-4567', preferred_channel: 'sms' },
    event: { name: 'Post First Consult', brand_id: 'generation' },
    brand: { name: 'Generation Fertility' },
    location: { name: 'NewMarket' },
    response: [{ nps_score: 9, completed_at: '2025-12-22T10:20:00Z' }],
  },
  {
    id: 'demo-2',
    created_at: '2025-12-21T14:00:00Z',
    sent_at: '2025-12-21T14:00:05Z',
    delivered_at: null,
    opened_at: null,
    completed_at: null,
    status: 'bounced',
    channel: 'email',
    contact: { id: 'c2', first_name: 'Emma', last_name: 'Johnson', email: 'emma.johnson@example.com', phone: null, preferred_channel: 'email' },
    event: { name: 'Post Treatment Follow-up', brand_id: 'grace' },
    brand: { name: 'Grace Fertility' },
    location: { name: 'Vancouver' },
    response: [],
  },
  {
    id: 'demo-3',
    created_at: '2025-12-20T11:45:00Z',
    sent_at: '2025-12-20T11:45:05Z',
    delivered_at: null,
    opened_at: null,
    completed_at: null,
    status: 'throttled',
    channel: 'sms',
    contact: { id: 'c3', first_name: 'Sarah', last_name: 'Lee', email: 'sarah.lee@example.com', phone: '+1 (555) 234-5678', preferred_channel: 'sms' },
    event: { name: 'Post First Consult', brand_id: 'generation' },
    brand: { name: 'Generation Fertility' },
    location: { name: 'Vaughan' },
    response: [],
  },
];

// Demo responses with multiple follow-up questions
export const DEMO_RESPONSES = [
  {
    id: 'resp-1',
    nps_score: 6,
    completed_at: '2025-12-22T10:30:00Z',
    consent_given: true,
    contact: {
      id: 'c1',
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 123-4567',
    },
    event: { name: 'Post First Consult', brand_id: 'generation' },
    invitation: { channel: 'sms' },
    answers: [
      { question: 'What could we improve?', answer: 'The wait time was too long. I had to wait almost 45 minutes past my scheduled appointment.' },
      { question: 'How was the staff?', answer: 'The staff were friendly but seemed overwhelmed.' },
      { question: 'Would you visit again?', answer: 'Maybe, if scheduling improves.' },
    ],
  },
  {
    id: 'resp-2',
    nps_score: 9,
    completed_at: '2025-12-21T14:15:00Z',
    consent_given: true,
    contact: {
      id: 'c2',
      first_name: 'Emma',
      last_name: 'Johnson',
      email: 'emma.johnson@example.com',
      phone: '+1 (555) 234-5678',
    },
    event: { name: 'Post Treatment Follow-up', brand_id: 'grace' },
    invitation: { channel: 'email' },
    answers: [
      { question: 'What did you like most?', answer: 'The personalized care and attention to detail. Dr. Chen was exceptional!' },
    ],
  },
  {
    id: 'resp-3',
    nps_score: 3,
    completed_at: '2025-12-20T16:45:00Z',
    consent_given: false,
    contact: {
      id: 'c3',
      first_name: 'Michael',
      last_name: 'Brown',
      email: 'michael.brown@example.com',
      phone: '+1 (555) 345-6789',
    },
    event: { name: 'Annual Check-In', brand_id: 'conceptia' },
    invitation: { channel: 'sms' },
    answers: [
      { question: 'What could we improve?', answer: 'Communication needs serious work. No one returned my calls for days.' },
      { question: 'Rate the facility cleanliness', answer: '3' },
    ],
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
