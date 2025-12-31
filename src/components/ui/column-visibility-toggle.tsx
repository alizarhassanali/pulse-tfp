import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Columns3 } from 'lucide-react';

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible: boolean;
}

interface ColumnVisibilityToggleProps {
  columns: ColumnDef[];
  storageKey?: string;
  onChange?: (visibleColumns: string[]) => void;
}

export function useColumnVisibility(columns: ColumnDef[], storageKey?: string) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Invalid stored value, use defaults
        }
      }
    }
    return columns.filter(c => c.defaultVisible).map(c => c.key);
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, storageKey]);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const isVisible = (key: string) => visibleColumns.includes(key);

  const resetToDefaults = () => {
    setVisibleColumns(columns.filter(c => c.defaultVisible).map(c => c.key));
  };

  return { visibleColumns, toggleColumn, isVisible, resetToDefaults, setVisibleColumns };
}

export function ColumnVisibilityToggle({ 
  columns, 
  storageKey,
  onChange 
}: ColumnVisibilityToggleProps) {
  const { visibleColumns, toggleColumn, isVisible, resetToDefaults } = useColumnVisibility(columns, storageKey);

  useEffect(() => {
    onChange?.(visibleColumns);
  }, [visibleColumns, onChange]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns3 className="h-4 w-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Show Columns</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={resetToDefaults}
            >
              Reset
            </Button>
          </div>
          <div className="space-y-2">
            {columns.map((column) => (
              <div key={column.key} className="flex items-center gap-2">
                <Checkbox
                  id={`col-${column.key}`}
                  checked={isVisible(column.key)}
                  onCheckedChange={() => toggleColumn(column.key)}
                />
                <Label 
                  htmlFor={`col-${column.key}`} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
