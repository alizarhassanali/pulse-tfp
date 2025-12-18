import { Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
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
import { useFilterStore } from '@/stores/filterStore';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function TopNav() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const {
    selectedBrands,
    selectedLocations,
    selectedType,
    selectedEvent,
    setSelectedBrands,
    setSelectedLocations,
    setSelectedType,
    setSelectedEvent,
  } = useFilterStore();

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', selectedBrands],
    queryFn: async () => {
      let query = supabase.from('locations').select('*').order('name');
      if (selectedBrands.length > 0) {
        query = query.in('brand_id', selectedBrands);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events-filter', selectedBrands],
    queryFn: async () => {
      let query = supabase.from('events').select('*').eq('status', 'active').order('name');
      if (selectedBrands.length > 0) {
        query = query.in('brand_id', selectedBrands);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
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

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select
            value={selectedBrands[0] || 'all'}
            onValueChange={(value) => setSelectedBrands(value === 'all' ? [] : [value])}
          >
            <SelectTrigger className="w-[160px] bg-topbar-foreground/10 border-topbar-foreground/20 text-topbar-foreground">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedLocations[0] || 'all'}
            onValueChange={(value) => setSelectedLocations(value === 'all' ? [] : [value])}
          >
            <SelectTrigger className="w-[160px] bg-topbar-foreground/10 border-topbar-foreground/20 text-topbar-foreground">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[140px] bg-topbar-foreground/10 border-topbar-foreground/20 text-topbar-foreground">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="nps">NPS</SelectItem>
              <SelectItem value="csat">CSAT</SelectItem>
              <SelectItem value="ces">CES</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-[180px] bg-topbar-foreground/10 border-topbar-foreground/20 text-topbar-foreground">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <DropdownMenuContent align="end" className="w-56">
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
