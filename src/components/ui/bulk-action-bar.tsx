import * as React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  selectedCount: number;
  itemLabel?: string;
  onClearSelection: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  itemLabel = 'item',
  onClearSelection,
  children,
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const pluralLabel = selectedCount === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 bg-primary/5 rounded-lg border border-primary/20 animate-fade-in',
        className
      )}
    >
      <span className="text-sm font-medium text-foreground">
        {selectedCount} {pluralLabel} selected
      </span>
      <div className="flex items-center gap-2">
        {children}
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={onClearSelection}
        className="ml-auto text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4 mr-1" />
        Clear Selection
      </Button>
    </div>
  );
}
