import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, X, Tag, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ContactTagsSelectProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function ContactTagsSelect({ 
  selectedTags, 
  onTagsChange, 
  placeholder = "Select tags...",
  className 
}: ContactTagsSelectProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tags = [] } = useQuery({
    queryKey: ['contact-tags-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('contact_tags')
        .insert({ name: name.trim() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags-list'] });
      queryClient.invalidateQueries({ queryKey: ['contact-tags'] });
      // Auto-select the newly created tag
      onTagsChange([...selectedTags, data.id]);
      setNewTagName('');
      setIsCreating(false);
      toast({ title: 'Tag created', description: `"${data.name}" has been created and selected.` });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to create tag', description: error.message, variant: 'destructive' });
    },
  });

  const handleSelect = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleRemove = (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onTagsChange(selectedTags.filter(id => id !== tagId));
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast({ title: 'Please enter a tag name', variant: 'destructive' });
      return;
    }
    // Check if tag already exists
    const exists = tags.some((tag: any) => tag.name.toLowerCase() === newTagName.trim().toLowerCase());
    if (exists) {
      toast({ title: 'Tag already exists', variant: 'destructive' });
      return;
    }
    createTagMutation.mutate(newTagName);
  };

  const selectedTagNames = tags.filter((tag: any) => selectedTags.includes(tag.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-10 h-auto", className)}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedTagNames.length > 0 ? (
              selectedTagNames.map((tag: any) => (
                <Badge key={tag.id} variant="secondary" className="mr-1 mb-1">
                  {tag.name}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={(e) => handleRemove(tag.id, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
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
          
          {/* Create new tag section */}
          <div className="border-t p-2">
            {isCreating ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New tag name..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                    if (e.key === 'Escape') {
                      setIsCreating(false);
                      setNewTagName('');
                    }
                  }}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button 
                  size="sm" 
                  className="h-8 px-2" 
                  onClick={handleCreateTag}
                  disabled={createTagMutation.isPending}
                >
                  {createTagMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 px-2" 
                  onClick={() => { setIsCreating(false); setNewTagName(''); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create new tag
              </Button>
            )}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
