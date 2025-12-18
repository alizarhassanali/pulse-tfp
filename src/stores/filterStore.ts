import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  selectedBrands: string[];
  selectedLocations: string[];
  selectedType: string;
  selectedEvent: string;
  dateRange: { from: string; to: string };
  setSelectedBrands: (brands: string[]) => void;
  setSelectedLocations: (locations: string[]) => void;
  setSelectedType: (type: string) => void;
  setSelectedEvent: (event: string) => void;
  setDateRange: (range: { from: string; to: string }) => void;
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

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      selectedBrands: [],
      selectedLocations: [],
      selectedType: 'all',
      selectedEvent: 'all',
      dateRange: getDefaultDateRange(),
      setSelectedBrands: (brands) => set({ selectedBrands: brands }),
      setSelectedLocations: (locations) => set({ selectedLocations: locations }),
      setSelectedType: (type) => set({ selectedType: type }),
      setSelectedEvent: (event) => set({ selectedEvent: event }),
      setDateRange: (range) => set({ dateRange: range }),
      clearFilters: () => set({
        selectedBrands: [],
        selectedLocations: [],
        selectedType: 'all',
        selectedEvent: 'all',
        dateRange: getDefaultDateRange(),
      }),
    }),
    {
      name: 'userpulse-filters',
    }
  )
);
