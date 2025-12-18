import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DatePreset = '7' | '30' | '60' | '90' | 'custom';

interface FilterState {
  selectedBrands: string[];
  selectedLocations: string[];
  selectedType: string;
  selectedEvent: string;
  dateRange: { from: string; to: string };
  datePreset: DatePreset;
  setSelectedBrands: (brands: string[]) => void;
  setSelectedLocations: (locations: string[]) => void;
  setSelectedType: (type: string) => void;
  setSelectedEvent: (event: string) => void;
  setDateRange: (range: { from: string; to: string }) => void;
  setDatePreset: (preset: DatePreset) => void;
  setDateRangeWithPreset: (preset: DatePreset, customRange?: { from: string; to: string }) => void;
  clearFilters: () => void;
}

const getDefaultDateRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
};

const calculateDateRange = (preset: DatePreset): { from: string; to: string } => {
  const to = new Date();
  const from = new Date();
  
  switch (preset) {
    case '7':
      from.setDate(from.getDate() - 7);
      break;
    case '30':
      from.setDate(from.getDate() - 30);
      break;
    case '60':
      from.setDate(from.getDate() - 60);
      break;
    case '90':
      from.setDate(from.getDate() - 90);
      break;
    default:
      from.setDate(from.getDate() - 30);
  }
  
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      selectedBrands: [],
      selectedLocations: [],
      selectedType: 'all',
      selectedEvent: 'all',
      dateRange: getDefaultDateRange(),
      datePreset: '30',
      setSelectedBrands: (brands) => set({ selectedBrands: brands }),
      setSelectedLocations: (locations) => set({ selectedLocations: locations }),
      setSelectedType: (type) => set({ selectedType: type }),
      setSelectedEvent: (event) => set({ selectedEvent: event }),
      setDateRange: (range) => set({ dateRange: range }),
      setDatePreset: (preset) => set({ datePreset: preset }),
      setDateRangeWithPreset: (preset, customRange) => {
        if (preset === 'custom' && customRange) {
          set({ datePreset: preset, dateRange: customRange });
        } else if (preset !== 'custom') {
          set({ datePreset: preset, dateRange: calculateDateRange(preset) });
        } else {
          set({ datePreset: preset });
        }
      },
      clearFilters: () => set({
        selectedBrands: [],
        selectedLocations: [],
        selectedType: 'all',
        selectedEvent: 'all',
        dateRange: getDefaultDateRange(),
        datePreset: '30',
      }),
    }),
    {
      name: 'userpulse-filters',
    }
  )
);
