import { Bell, ChevronDown, LogOut, Plus, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MultiSelect } from '@/components/ui/multi-select';
import { useFilterStore } from '@/stores/filterStore';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useEffect } from 'react';

// Demo data for brands and locations
const DEMO_BRANDS = [
  { id: 'conceptia', name: 'Conceptia Fertility' },
  { id: 'generation', name: 'Generation Fertility' },
  { id: 'grace', name: 'Grace Fertility' },
  { id: 'olive', name: 'Olive Fertility' },
];

const DEMO_LOCATIONS: Record<string, { id: string; name: string }[]> = {
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

const DEMO_EVENTS = [
  { id: 'post-first-consult', name: 'Post First Consult' },
  { id: 'post-treatment-followup', name: 'Post Treatment Follow-up' },
  { id: 'annual-checkup', name: 'Annual Checkup' },
];

export function TopNav() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const {
    selectedBrands,
    selectedLocations,
    selectedEvent,
    setSelectedBrands,
    setSelectedLocations,
    setSelectedEvent,
  } = useFilterStore();

  const { data: dbBrands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: dbLocations = [] } = useQuery({
    queryKey: ['locations', selectedBrands],
    queryFn: async () => {
      let query = supabase.from('locations').select('*').order('name');
      if (selectedBrands.length > 0 && !selectedBrands.includes('generation') && !selectedBrands.includes('conceptia')) {
        query = query.in('brand_id', selectedBrands);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: dbEvents = [] } = useQuery({
    queryKey: ['events-filter', selectedBrands],
    queryFn: async () => {
      let query = supabase.from('events').select('*').eq('status', 'active').order('name');
      if (selectedBrands.length > 0 && !selectedBrands.includes('generation') && !selectedBrands.includes('conceptia')) {
        query = query.in('brand_id', selectedBrands);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Combine DB data with demo data
  const brands = dbBrands.length > 0 
    ? dbBrands.map(b => ({ value: b.id, label: b.name }))
    : DEMO_BRANDS.map(b => ({ value: b.id, label: b.name }));

  // Get locations based on selected brands
  const getAvailableLocations = () => {
    if (selectedBrands.length === 0) {
      // Show all locations
      const allDemoLocations = Object.values(DEMO_LOCATIONS).flat();
      if (dbLocations.length > 0) {
        return dbLocations.map(l => ({ value: l.id, label: l.name }));
      }
      return allDemoLocations.map(l => ({ value: l.id, label: l.name }));
    }
    
    // Filter by selected brands (demo data)
    const demoLocs = selectedBrands
      .filter(b => DEMO_LOCATIONS[b])
      .flatMap(b => DEMO_LOCATIONS[b])
      .map(l => ({ value: l.id, label: l.name }));
    
    if (demoLocs.length > 0) return demoLocs;
    
    // Fall back to DB locations
    return dbLocations.map(l => ({ value: l.id, label: l.name }));
  };

  const locations = getAvailableLocations();

  const events = dbEvents.length > 0
    ? dbEvents.map(e => ({ value: e.id, label: e.name }))
    : DEMO_EVENTS.map(e => ({ value: e.id, label: e.name }));

  // Set default demo selections
  useEffect(() => {
    if (selectedBrands.length === 0 && dbBrands.length === 0) {
      setSelectedBrands(['generation']);
      setSelectedLocations(['newmarket', 'vaughan']);
      setSelectedEvent('post-first-consult');
    }
  }, []);

  // Clear locations when brands change (if locations don't belong to selected brands)
  useEffect(() => {
    if (selectedBrands.length > 0) {
      const availableLocs = getAvailableLocations().map(l => l.value);
      const validLocations = selectedLocations.filter(l => availableLocs.includes(l));
      if (validLocations.length !== selectedLocations.length) {
        setSelectedLocations(validLocations);
      }
    }
  }, [selectedBrands]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleEventChange = (value: string) => {
    if (value === 'create-new') {
      navigate('/nps/events/create');
    } else {
      setSelectedEvent(value);
    }
  };

  const initials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : profile?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="h-16 bg-topbar text-topbar-foreground flex items-center justify-between px-6 shadow-md z-50">
      {/* Logo & Brand */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">U</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">UserPulse</span>
        </div>

        {/* Filters - 3 dropdowns */}
        <div className="flex items-center gap-3">
          {/* Brand Multi-Select */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-topbar-foreground/60 mb-0.5 ml-1">Brand</span>
            <MultiSelect
              options={brands}
              selected={selectedBrands}
              onChange={setSelectedBrands}
              placeholder="All Brands"
              className="w-[180px]"
              emptyText="No brands found"
            />
          </div>

          {/* Location Multi-Select */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-topbar-foreground/60 mb-0.5 ml-1">Location</span>
            <MultiSelect
              options={locations}
              selected={selectedLocations}
              onChange={setSelectedLocations}
              placeholder="All Locations"
              className="w-[180px]"
              emptyText="No locations found"
            />
          </div>

          {/* Event Single-Select */}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-topbar-foreground/60 mb-0.5 ml-1">Event</span>
            <Select value={selectedEvent} onValueChange={handleEventChange}>
              <SelectTrigger className="w-[200px] bg-topbar-foreground/10 border-topbar-foreground/20 text-topbar-foreground">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.value} value={event.value}>
                    {event.label}
                  </SelectItem>
                ))}
                <SelectItem value="create-new" className="text-primary">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-topbar-foreground hover:bg-topbar-foreground/10 relative"
        >
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-[10px]">
            3
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-topbar-foreground hover:bg-topbar-foreground/10"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{profile?.name || 'User'}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {profile?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
