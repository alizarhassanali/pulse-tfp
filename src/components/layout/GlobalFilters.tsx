import { useState } from 'react';
import { useFilterStore, DatePreset } from '@/stores/filterStore';
import { DEMO_EVENTS, getAvailableLocations } from '@/data/demo-data';
import { useBrandLocationContext } from '@/hooks/useBrandLocationContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, MapPin, Zap, Calendar as CalendarIcon, ChevronsUpDown, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface FilterMultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  allLabel: string;
  icon: React.ReactNode;
}

function FilterMultiSelect({ options, selected, onChange, placeholder, allLabel, icon }: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelectAll = () => {
    onChange([]);
  };

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const displayText = selected.length === 0 
    ? allLabel 
    : selected.length === 1 
      ? options.find(o => o.value === selected[0])?.label || allLabel
      : `${selected.length} Selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="h-9 px-3 justify-between text-topbar-foreground hover:bg-topbar-foreground/10 min-w-[140px] border-0"
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium truncate max-w-[100px]">{displayText}</span>
          </div>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 bg-popover border border-border shadow-lg z-[100]" align="start">
        <Command>
          <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} className="h-9" />
          <CommandList>
            <CommandEmpty>No {placeholder.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={handleSelectAll}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <Checkbox 
                    checked={selected.length === 0} 
                    className="pointer-events-none"
                  />
                  <span className="font-medium">{allLabel}</span>
                </div>
              </CommandItem>
              <CommandSeparator />
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Checkbox 
                      checked={selected.includes(option.value)} 
                      className="pointer-events-none"
                    />
                    <span>{option.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function GlobalFilters() {
  const { 
    selectedBrands, 
    selectedLocations, 
    selectedEvent, 
    dateRange,
    datePreset,
    setSelectedBrands,
    setSelectedLocations,
    setSelectedEvent,
    setDateRangeWithPreset,
  } = useFilterStore();

  const {
    accessibleBrands,
    availableLocations,
    isBrandLocked,
    isLocationLocked,
    effectiveBrandId,
    effectiveLocationId,
    getBrandName,
    getLocationName,
  } = useBrandLocationContext();

  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const brands = accessibleBrands.map(b => ({ value: b.id, label: b.name }));
  const locations = availableLocations.map(l => ({ value: l.id, label: l.name }));
  const events = DEMO_EVENTS.map(e => ({ value: e.id, label: e.name }));

  const handleBrandsChange = (newBrands: string[]) => {
    setSelectedBrands(newBrands);
    // Clear invalid locations when brands change
    if (newBrands.length > 0) {
      const availableLocs = getAvailableLocations(newBrands).map(l => l.value);
      const validLocations = selectedLocations.filter(l => availableLocs.includes(l));
      if (validLocations.length !== selectedLocations.length) {
        setSelectedLocations(validLocations);
      }
    }
  };

  const handleDatePresetChange = (value: string) => {
    if (value === 'custom') {
      setCustomDateOpen(true);
    } else {
      setDateRangeWithPreset(value as DatePreset);
    }
  };

  const handleCustomDateApply = () => {
    if (customFrom && customTo) {
      setDateRangeWithPreset('custom', {
        from: format(customFrom, 'yyyy-MM-dd'),
        to: format(customTo, 'yyyy-MM-dd'),
      });
      setCustomDateOpen(false);
    }
  };

  const getDateRangeLabel = () => {
    if (datePreset === 'custom') {
      return `${format(new Date(dateRange.from), 'MMM d')} - ${format(new Date(dateRange.to), 'MMM d')}`;
    }
    switch (datePreset) {
      case '7': return 'Last 7 days';
      case '30': return 'Last 30 days';
      case '60': return 'Last 60 days';
      case '90': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  // Locked brand display (when only 1 brand accessible)
  const lockedBrandName = effectiveBrandId ? getBrandName(effectiveBrandId) : null;
  const lockedLocationName = effectiveLocationId ? getLocationName(effectiveLocationId) : null;

  return (
    <div className="flex items-center gap-2">
      {/* Date Range - Prominent */}
      <Popover open={customDateOpen} onOpenChange={setCustomDateOpen}>
        <PopoverTrigger asChild>
          <div>
            <Select value={datePreset} onValueChange={handleDatePresetChange}>
              <SelectTrigger className="h-10 min-w-[170px] bg-primary/10 border border-primary/30 text-topbar-foreground hover:bg-primary/20 focus:ring-1 focus:ring-primary/50 focus:ring-offset-0 rounded-lg font-medium">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{getDateRangeLabel()}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 bg-popover border border-border shadow-lg z-[100]" align="start">
          <div className="space-y-4">
            <p className="text-sm font-medium">Select custom date range</p>
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">From</p>
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  className={cn("p-3 pointer-events-auto rounded-md border")}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">To</p>
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  className={cn("p-3 pointer-events-auto rounded-md border")}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setCustomDateOpen(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleCustomDateApply}
                disabled={!customFrom || !customTo}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Divider */}
      <div className="h-6 w-px bg-topbar-foreground/20 mx-1" />

      {/* Brand Filter - Show locked indicator or multi-select */}
      {isBrandLocked && lockedBrandName ? (
        <div className="flex items-center gap-2 h-9 px-3 text-topbar-foreground">
          <Building2 className="h-4 w-4 opacity-70" />
          <span className="text-sm font-medium">{lockedBrandName}</span>
          <Lock className="h-3 w-3 opacity-50" />
        </div>
      ) : (
        <FilterMultiSelect
          options={brands}
          selected={selectedBrands}
          onChange={handleBrandsChange}
          placeholder="Brand"
          allLabel="All Brands"
          icon={<Building2 className="h-4 w-4 opacity-70" />}
        />
      )}

      {/* Location Filter - Show locked indicator or multi-select */}
      {isLocationLocked && lockedLocationName ? (
        <div className="flex items-center gap-2 h-9 px-3 text-topbar-foreground">
          <MapPin className="h-4 w-4 opacity-70" />
          <span className="text-sm font-medium">{lockedLocationName}</span>
          <Lock className="h-3 w-3 opacity-50" />
        </div>
      ) : (
        <FilterMultiSelect
          options={locations}
          selected={selectedLocations}
          onChange={setSelectedLocations}
          placeholder="Location"
          allLabel="All Locations"
          icon={<MapPin className="h-4 w-4 opacity-70" />}
        />
      )}

      {/* Event Filter (Single Select) */}
      <Select value={selectedEvent} onValueChange={setSelectedEvent}>
        <SelectTrigger className="h-9 min-w-[140px] bg-transparent border-0 text-topbar-foreground hover:bg-topbar-foreground/10 focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 opacity-70" />
            <SelectValue placeholder="All Events" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
          <SelectItem value="all">All Events</SelectItem>
          {events.map((event) => (
            <SelectItem key={event.value} value={event.value}>
              {event.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

    </div>
  );
}
