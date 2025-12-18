import { useState, useEffect } from 'react';
import { useFilterStore } from '@/stores/filterStore';
import { DEMO_BRANDS, DEMO_EVENTS, getAvailableLocations } from '@/data/demo-data';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, MapPin, Zap, Calendar, ChevronsUpDown } from 'lucide-react';
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
    setSelectedBrands,
    setSelectedLocations,
    setSelectedEvent,
    setDateRange,
  } = useFilterStore();

  const brands = DEMO_BRANDS.map(b => ({ value: b.id, label: b.name }));
  const locations = getAvailableLocations(selectedBrands);
  const events = DEMO_EVENTS.map(e => ({ value: e.id, label: e.name }));

  // Clear invalid locations when brands change
  useEffect(() => {
    if (selectedBrands.length > 0) {
      const availableLocs = locations.map(l => l.value);
      const validLocations = selectedLocations.filter(l => availableLocs.includes(l));
      if (validLocations.length !== selectedLocations.length) {
        setSelectedLocations(validLocations);
      }
    }
  }, [selectedBrands]);

  const handleDateRangeChange = (value: string) => {
    const to = new Date();
    let from = new Date();
    
    switch (value) {
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
    
    setDateRange({
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    });
  };

  // Calculate current date range value for display
  const getCurrentDateRangeValue = () => {
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return '7';
    if (diffDays <= 30) return '30';
    if (diffDays <= 60) return '60';
    return '90';
  };

  return (
    <div className="flex items-center gap-1">
      {/* Brand Filter */}
      <FilterMultiSelect
        options={brands}
        selected={selectedBrands}
        onChange={setSelectedBrands}
        placeholder="Brand"
        allLabel="All Brands"
        icon={<Building2 className="h-4 w-4 opacity-70" />}
      />

      {/* Location Filter */}
      <FilterMultiSelect
        options={locations}
        selected={selectedLocations}
        onChange={setSelectedLocations}
        placeholder="Location"
        allLabel="All Locations"
        icon={<MapPin className="h-4 w-4 opacity-70" />}
      />

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

      {/* Divider */}
      <div className="h-6 w-px bg-topbar-foreground/20 mx-2" />

      {/* Date Range */}
      <Select value={getCurrentDateRangeValue()} onValueChange={handleDateRangeChange}>
        <SelectTrigger className="h-9 min-w-[130px] bg-transparent border-0 text-topbar-foreground hover:bg-topbar-foreground/10 focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 opacity-70" />
            <SelectValue placeholder="Select range" />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="60">Last 60 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
