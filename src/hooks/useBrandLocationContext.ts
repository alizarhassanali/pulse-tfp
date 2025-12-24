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

  // Available brands = accessible brands filtered by global selection
  const availableBrands = useMemo(() => {
    if (filterSelectedBrands.length === 0) {
      return accessibleBrands;
    }
    return accessibleBrands.filter(b => filterSelectedBrands.includes(b.id));
  }, [accessibleBrands, filterSelectedBrands]);

  // Determine if brand is locked - ONLY when there's truly 1 option after filtering
  const isBrandLocked = useMemo(() => {
    return availableBrands.length === 1;
  }, [availableBrands.length]);

  // Effective brand IDs based on global filter or all accessible
  const effectiveBrandIds = useMemo(() => {
    if (filterSelectedBrands.length > 0) {
      return filterSelectedBrands;
    }
    return accessibleBrands.map(b => b.id);
  }, [filterSelectedBrands, accessibleBrands]);

  // Single effective brand (when only 1 available after filtering)
  const effectiveBrandId = useMemo(() => {
    if (availableBrands.length === 1) {
      return availableBrands[0].id;
    }
    return null;
  }, [availableBrands]);

  // Available locations = filtered by available brands (after brand filter) and global location filter
  const availableLocations = useMemo(() => {
    const brandIds = availableBrands.map(b => b.id);
    let locs = accessibleLocations.filter(l => 
      l.brand_id && brandIds.includes(l.brand_id)
    );
    
    // If global location filter is set, further filter
    if (filterSelectedLocations.length > 0) {
      locs = locs.filter(l => filterSelectedLocations.includes(l.id));
    }
    
    return locs;
  }, [accessibleLocations, availableBrands, filterSelectedLocations]);

  // Determine if location is locked - ONLY when there's truly 1 option after filtering
  const isLocationLocked = useMemo(() => {
    return availableLocations.length === 1;
  }, [availableLocations.length]);

  // Effective location IDs (all available after filtering)
  const effectiveLocationIds = useMemo(() => {
    return availableLocations.map(l => l.id);
  }, [availableLocations]);

  // Single effective location (when only 1 available after filtering)
  const effectiveLocationId = useMemo(() => {
    if (availableLocations.length === 1) {
      return availableLocations[0].id;
    }
    return null;
  }, [availableLocations]);

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
