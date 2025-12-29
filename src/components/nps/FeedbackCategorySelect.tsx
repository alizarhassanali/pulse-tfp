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

interface TagAssignment {
  tag_id: string;
  source: string;
}

interface FeedbackCategorySelectProps {
  responseId: string;
  eventId: string;
  selectedTags: string[];
  tagAssignments?: TagAssignment[];
  onTagsChange?: (tags: string[]) => void;
  readOnly?: boolean;
  size?: 'sm' | 'default';
}

export function FeedbackCategorySelect({ 
  responseId,
  eventId,
  selectedTags: initialTags,
  tagAssignments = [],
  onTagsChange,
  readOnly = false,
  size = 'default'
}: FeedbackCategorySelectProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  // Sync with prop changes
  useEffect(() => {
    setSelectedTags(initialTags);
  }, [initialTags]);

  // Fetch event-specific feedback tags
  const { data: tags = [] } = useQuery({
    queryKey: ['event-feedback-tags', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_feedback_tags')
        .select('*')
        .eq('event_id', eventId)
        .eq('archived', false)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!eventId,
  });

  const updateMutation = useMutation({
    mutationFn: async (newTags: string[]) => {
      // Delete existing assignments for this response
      await supabase
        .from('response_tag_assignments')
        .delete()
        .eq('response_id', responseId);
      
      // Insert new assignments as manual
      if (newTags.length > 0) {
        const { error } = await supabase
          .from('response_tag_assignments')
          .insert(newTags.map(tagId => ({
            response_id: responseId,
            tag_id: tagId,
            source: 'manual',
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['response-tags', responseId] });
      queryClient.invalidateQueries({ queryKey: ['tag-assignments'] });
      toast({ title: 'Tags updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating tags', description: error.message, variant: 'destructive' });
    },
  });

  const handleSelect = (tagId: string) => {
    let newTags: string[];
    if (selectedTags.includes(tagId)) {
      newTags = selectedTags.filter(id => id !== tagId);
    } else {
      newTags = [...selectedTags, tagId];
    }
    setSelectedTags(newTags);
    updateMutation.mutate(newTags);
    onTagsChange?.(newTags);
  };

  const handleRemove = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTags = selectedTags.filter(id => id !== tagId);
    setSelectedTags(newTags);
    updateMutation.mutate(newTags);
    onTagsChange?.(newTags);
  };

  const selectedTagObjects = tags.filter((tag: any) => selectedTags.includes(tag.id));
  
  // Build a map of tag ID to source
  const sourceMap = new Map(tagAssignments.map(a => [a.tag_id, a.source]));

  const TagBadge = ({ tag, showRemove = false }: { tag: any; showRemove?: boolean }) => {
    const source = sourceMap.get(tag.id);
    const isAI = source === 'ai';
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={showRemove ? "secondary" : "outline"} 
            className={cn("text-xs", isAI && "border-primary/50")}
          >
            {isAI && <Sparkles className="h-3 w-3 mr-1 text-primary" />}
            {tag.name}
            {showRemove && (
              <button
                className="ml-1 ring-offset-background rounded-full outline-none"
                onClick={(e) => handleRemove(tag.id, e)}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isAI ? 'AI-assigned tag' : 'Manually assigned'}
        </TooltipContent>
      </Tooltip>
    );
  };

  // If no eventId or no tags configured for this event
  if (!eventId || tags.length === 0) {
    return (
      <div className="flex flex-wrap gap-1">
        <span className="text-muted-foreground text-xs">No tags configured for this event</span>
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1">
        {selectedTagObjects.length > 0 ? (
          selectedTagObjects.map((tag: any) => (
            <TagBadge key={tag.id} tag={tag} />
          ))
        ) : (
          <span className="text-muted-foreground text-xs">No tags</span>
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
            {selectedTagObjects.length > 0 ? (
              selectedTagObjects.map((tag: any) => (
                <TagBadge key={tag.id} tag={tag} showRemove />
              ))
            ) : (
              <span className="text-muted-foreground text-xs">Add tags</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search tags..." />
          <CommandList>
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {tags.map((tag: any) => (
                <CommandItem
                  key={tag.id}
                  value={tag.name}
                  onSelect={() => handleSelect(tag.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedTags.includes(tag.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                  {tag.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
