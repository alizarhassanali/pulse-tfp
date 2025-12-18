import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  emptyText?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  className,
  emptyText = 'No options found.',
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== value));
  };

  const selectedLabels = selected
    .map((s) => options.find((o) => o.value === s)?.label)
    .filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'justify-between bg-topbar-foreground/10 border-topbar-foreground/20 text-topbar-foreground hover:bg-topbar-foreground/20 hover:text-topbar-foreground',
            className
          )}
        >
          <div className="flex flex-wrap gap-1 max-w-[140px] overflow-hidden">
            {selected.length === 0 ? (
              <span className="text-topbar-foreground/70">{placeholder}</span>
            ) : selected.length <= 2 ? (
              selectedLabels.map((label, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs px-1.5 py-0 bg-topbar-foreground/20 text-topbar-foreground hover:bg-topbar-foreground/30"
                >
                  {label}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={(e) => handleRemove(selected[i], e)}
                  />
                </Badge>
              ))
            ) : (
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0 bg-topbar-foreground/20 text-topbar-foreground"
              >
                {selected.length} selected
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 bg-popover z-50" align="start">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selected.includes(option.value) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
