// Shared demo data for brands, locations, and events

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
