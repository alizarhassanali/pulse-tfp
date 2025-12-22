import { useEffect, useState } from 'react';
import { GlobalFilters } from './GlobalFilters';
import { useFilterStore } from '@/stores/filterStore';
import { supabase } from '@/integrations/supabase/client';

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

export function TopNav() {
  const { selectedBrands } = useFilterStore();
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase.from('brands').select('id, name, logo_url');
      if (data) setBrands(data);
    };
    fetchBrands();
  }, []);

  // Determine which logo to show
  const selectedBrand = selectedBrands.length === 1 
    ? brands.find(b => b.id === selectedBrands[0]) 
    : null;

  return (
    <header className="h-16 bg-topbar text-topbar-foreground flex items-center justify-between px-4 border-b border-border z-50 sticky top-0">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3 shrink-0">
        {selectedBrand?.logo_url ? (
          <img 
            src={selectedBrand.logo_url} 
            alt={selectedBrand.name} 
            className="h-8 w-auto max-w-32 object-contain"
          />
        ) : (
          <>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">U</span>
            </div>
            <span className="font-semibold text-lg tracking-tight hidden sm:inline">UserPulse</span>
          </>
        )}
        {selectedBrand && !selectedBrand.logo_url && (
          <span className="font-semibold text-lg tracking-tight hidden sm:inline">{selectedBrand.name}</span>
        )}
      </div>

      {/* Global Filters */}
      <div className="flex-1 flex items-center justify-center px-4">
        <GlobalFilters />
      </div>

      {/* Empty right side for balance */}
      <div className="w-8 shrink-0" />
    </header>
  );
}
