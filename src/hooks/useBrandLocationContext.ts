import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { DEMO_BRANDS, DEMO_LOCATIONS } from '@/data/demo-data';

interface Brand {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  brand_id: string | null;
}

interface BrandLocationContextResult {
  // All brands user has access to
  accessibleBrands: Brand[];
  // All locations user has access to
  accessibleLocations: Location[];
  
  // Global filter selections
  selectedBrandIds: string[];
  selectedLocationIds: string[];
  
  // Computed "effective" selections
  effectiveBrandId: string | null;
  effectiveBrandIds: string[];
  effectiveLocationId: string | null;
  effectiveLocationIds: string[];
  
  // UI flags
  isBrandLocked: boolean;
  isLocationLocked: boolean;
  canSelectBrand: boolean;
  canSelectLocation: boolean;
  
  // Available options (filtered by access + global selection)
  availableBrands: Brand[];
  availableLocations: Location[];
  
  // Loading state
  isLoading: boolean;
  
  // Helper functions
  getLocationsForBrand: (brandId: string) => Location[];
  getBrandName: (brandId: string) => string;
  getLocationName: (locationId: string) => string;
}

export function useBrandLocationContext(): BrandLocationContextResult {
  const { selectedBrands: filterSelectedBrands, selectedLocations: filterSelectedLocations } = useFilterStore();

  // Fetch brands from DB
  const { data: dbBrands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('id, name').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch locations from DB
  const { data: dbLocations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['all-locations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('id, name, brand_id').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Use DB data if available, otherwise fall back to demo data
  const accessibleBrands = useMemo(() => {
    if (dbBrands.length > 0) return dbBrands;
    return DEMO_BRANDS.map(b => ({ id: b.id, name: b.name }));
  }, [dbBrands]);

  const accessibleLocations = useMemo(() => {
    if (dbLocations.length > 0) return dbLocations;
    // Flatten demo locations
    return Object.entries(DEMO_LOCATIONS).flatMap(([brandId, locs]) =>
      locs.map(l => ({ id: l.id, name: l.name, brand_id: brandId }))
    );
  }, [dbLocations]);

  // Determine if brand is locked (only one accessible OR one selected in global filter)
  const isBrandLocked = useMemo(() => {
    return accessibleBrands.length === 1 || filterSelectedBrands.length === 1;
  }, [accessibleBrands.length, filterSelectedBrands.length]);

  // Effective brand IDs based on global filter or all accessible
  const effectiveBrandIds = useMemo(() => {
    if (filterSelectedBrands.length > 0) {
      return filterSelectedBrands;
    }
    return accessibleBrands.map(b => b.id);
  }, [filterSelectedBrands, accessibleBrands]);

  // Single effective brand (only when locked)
  const effectiveBrandId = useMemo(() => {
    if (accessibleBrands.length === 1) {
      return accessibleBrands[0].id;
    }
    if (filterSelectedBrands.length === 1) {
      return filterSelectedBrands[0];
    }
    return null;
  }, [accessibleBrands, filterSelectedBrands]);

  // Available brands = accessible brands filtered by global selection
  const availableBrands = useMemo(() => {
    if (filterSelectedBrands.length === 0) {
      return accessibleBrands;
    }
    return accessibleBrands.filter(b => filterSelectedBrands.includes(b.id));
  }, [accessibleBrands, filterSelectedBrands]);

  // Available locations = filtered by effective brands and global location filter
  const availableLocations = useMemo(() => {
    let locs = accessibleLocations.filter(l => 
      l.brand_id && effectiveBrandIds.includes(l.brand_id)
    );
    
    // If global location filter is set, further filter
    if (filterSelectedLocations.length > 0) {
      locs = locs.filter(l => filterSelectedLocations.includes(l.id));
    }
    
    return locs;
  }, [accessibleLocations, effectiveBrandIds, filterSelectedLocations]);

  // Determine if location is locked
  const isLocationLocked = useMemo(() => {
    return availableLocations.length === 1;
  }, [availableLocations.length]);

  // Effective location IDs
  const effectiveLocationIds = useMemo(() => {
    if (filterSelectedLocations.length > 0) {
      return filterSelectedLocations.filter(id => 
        availableLocations.some(l => l.id === id)
      );
    }
    return availableLocations.map(l => l.id);
  }, [filterSelectedLocations, availableLocations]);

  // Single effective location (only when locked)
  const effectiveLocationId = useMemo(() => {
    if (availableLocations.length === 1) {
      return availableLocations[0].id;
    }
    if (filterSelectedLocations.length === 1) {
      const loc = availableLocations.find(l => l.id === filterSelectedLocations[0]);
      return loc ? loc.id : null;
    }
    return null;
  }, [availableLocations, filterSelectedLocations]);

  // Helper: get locations for a specific brand
  const getLocationsForBrand = (brandId: string): Location[] => {
    return accessibleLocations.filter(l => l.brand_id === brandId);
  };

  // Helper: get brand name by ID
  const getBrandName = (brandId: string): string => {
    const brand = accessibleBrands.find(b => b.id === brandId);
    return brand?.name || '';
  };

  // Helper: get location name by ID
  const getLocationName = (locationId: string): string => {
    const location = accessibleLocations.find(l => l.id === locationId);
    return location?.name || '';
  };

  return {
    accessibleBrands,
    accessibleLocations,
    selectedBrandIds: filterSelectedBrands,
    selectedLocationIds: filterSelectedLocations,
    effectiveBrandId,
    effectiveBrandIds,
    effectiveLocationId,
    effectiveLocationIds,
    isBrandLocked,
    isLocationLocked,
    canSelectBrand: !isBrandLocked,
    canSelectLocation: !isLocationLocked,
    availableBrands,
    availableLocations,
    isLoading: loadingBrands || loadingLocations,
    getLocationsForBrand,
    getBrandName,
    getLocationName,
  };
}
