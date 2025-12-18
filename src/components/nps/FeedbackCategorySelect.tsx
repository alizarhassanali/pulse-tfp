import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, X, Tag, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CategoryAssignment {
  category_id: string;
  source: string;
}

interface FeedbackCategorySelectProps {
  responseId: string;
  selectedCategories: string[];
  categoryAssignments?: CategoryAssignment[];
  onCategoriesChange?: (categories: string[]) => void;
  readOnly?: boolean;
  size?: 'sm' | 'default';
}

export function FeedbackCategorySelect({ 
  responseId,
  selectedCategories: initialCategories,
  categoryAssignments = [],
  onCategoriesChange,
  readOnly = false,
  size = 'default'
}: FeedbackCategorySelectProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);

  // Sync with prop changes
  useEffect(() => {
    setSelectedCategories(initialCategories);
  }, [initialCategories]);

  const { data: categories = [] } = useQuery({
    queryKey: ['feedback-categories-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_categories')
        .select('*')
        .eq('archived', false)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (newCategories: string[]) => {
      // Delete existing assignments
      await supabase
        .from('response_category_assignments')
        .delete()
        .eq('response_id', responseId);
      
      // Insert new assignments as manual
      if (newCategories.length > 0) {
        const { error } = await supabase
          .from('response_category_assignments')
          .insert(newCategories.map(categoryId => ({
            response_id: responseId,
            category_id: categoryId,
            source: 'manual',
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['response-categories', responseId] });
      queryClient.invalidateQueries({ queryKey: ['category-assignments'] });
      toast({ title: 'Categories updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating categories', description: error.message, variant: 'destructive' });
    },
  });

  const handleSelect = (categoryId: string) => {
    let newCategories: string[];
    if (selectedCategories.includes(categoryId)) {
      newCategories = selectedCategories.filter(id => id !== categoryId);
    } else {
      newCategories = [...selectedCategories, categoryId];
    }
    setSelectedCategories(newCategories);
    updateMutation.mutate(newCategories);
    onCategoriesChange?.(newCategories);
  };

  const handleRemove = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCategories = selectedCategories.filter(id => id !== categoryId);
    setSelectedCategories(newCategories);
    updateMutation.mutate(newCategories);
    onCategoriesChange?.(newCategories);
  };

  const selectedCategoryNames = categories.filter((cat: any) => selectedCategories.includes(cat.id));
  
  // Build a map of category ID to source
  const sourceMap = new Map(categoryAssignments.map(a => [a.category_id, a.source]));

  const CategoryBadge = ({ cat, showRemove = false }: { cat: any; showRemove?: boolean }) => {
    const source = sourceMap.get(cat.id);
    const isAI = source === 'ai';
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={showRemove ? "secondary" : "outline"} 
            className={cn("text-xs", isAI && "border-primary/50")}
          >
            {isAI && <Sparkles className="h-3 w-3 mr-1 text-primary" />}
            {cat.name}
            {showRemove && (
              <button
                className="ml-1 ring-offset-background rounded-full outline-none"
                onClick={(e) => handleRemove(cat.id, e)}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isAI ? 'AI-assigned category' : 'Manually assigned'}
        </TooltipContent>
      </Tooltip>
    );
  };

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1">
        {selectedCategoryNames.length > 0 ? (
          selectedCategoryNames.map((cat: any) => (
            <CategoryBadge key={cat.id} cat={cat} />
          ))
        ) : (
          <span className="text-muted-foreground text-xs">No categories</span>
        )}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between",
            size === 'sm' ? "h-8 text-xs px-2" : "min-h-10 h-auto"
          )}
          size={size}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedCategoryNames.length > 0 ? (
              selectedCategoryNames.map((cat: any) => (
                <CategoryBadge key={cat.id} cat={cat} showRemove />
              ))
            ) : (
              <span className="text-muted-foreground text-xs">Add categories</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              {categories.map((cat: any) => (
                <CommandItem
                  key={cat.id}
                  value={cat.name}
                  onSelect={() => handleSelect(cat.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCategories.includes(cat.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                  {cat.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
