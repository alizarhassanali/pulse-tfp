import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Plus, Edit2, Save, X, StickyNote } from 'lucide-react';

interface InternalNotesSectionProps {
  responseId: string;
  readOnly?: boolean;
}

interface Note {
  id: string;
  note_text: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function InternalNotesSection({ responseId, readOnly = false }: InternalNotesSectionProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['submission-notes', responseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submission_notes')
        .select('*')
        .eq('response_id', responseId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Note[];
    },
    enabled: !!responseId,
  });

  const addMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from('submission_notes')
        .insert({
          response_id: responseId,
          note_text: text,
          created_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission-notes', responseId] });
      setIsAdding(false);
      setNoteText('');
      toast({ title: 'Note added' });
    },
    onError: (error: any) => {
      toast({ title: 'Error adding note', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { error } = await supabase
        .from('submission_notes')
        .update({ note_text: text })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission-notes', responseId] });
      setEditingId(null);
      setNoteText('');
      toast({ title: 'Note updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating note', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    if (!noteText.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, text: noteText });
    } else {
      addMutation.mutate(noteText);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setNoteText(note.note_text);
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNoteText('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Internal Notes
        </h4>
        {!readOnly && !isAdding && !editingId && (
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter internal note..."
            className="min-h-[80px]"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={!noteText.trim() || addMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No internal notes yet</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="border rounded-lg p-3 bg-muted/20">
              {editingId === note.id ? null : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                    {!readOnly && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleEdit(note)}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(parseISO(note.created_at), 'MMM d, yyyy h:mm a')}
                    {note.updated_at !== note.created_at && ' (edited)'}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
