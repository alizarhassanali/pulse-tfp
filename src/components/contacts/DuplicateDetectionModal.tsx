import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Mail, Phone, Calendar, GitMerge, Check, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_channel: string | null;
  preferred_language: string | null;
  status: string | null;
  brand_id: string | null;
  location_id: string | null;
  created_at: string | null;
  brand?: { name: string } | null;
  location?: { name: string } | null;
}

interface DuplicateGroup {
  key: string;
  contacts: Contact[];
}

interface DuplicateDetectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  contactTagMap: Record<string, string[]>;
}

export function DuplicateDetectionModal({
  open,
  onOpenChange,
  contacts,
  contactTagMap,
}: DuplicateDetectionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPrimary, setSelectedPrimary] = useState<Record<string, string>>({});
  const [confirmMerge, setConfirmMerge] = useState<DuplicateGroup | null>(null);

  const duplicates = useMemo(() => {
    const emailGroups: Record<string, Contact[]> = {};
    const phoneGroups: Record<string, Contact[]> = {};

    contacts.forEach((contact) => {
      if (contact.email) {
        const email = contact.email.toLowerCase().trim();
        if (!emailGroups[email]) emailGroups[email] = [];
        emailGroups[email].push(contact);
      }
      if (contact.phone) {
        const phone = contact.phone.replace(/\D/g, '');
        if (phone.length >= 10) {
          if (!phoneGroups[phone]) phoneGroups[phone] = [];
          phoneGroups[phone].push(contact);
        }
      }
    });

    const byEmail: DuplicateGroup[] = Object.entries(emailGroups)
      .filter(([, group]) => group.length > 1)
      .map(([key, contacts]) => ({ key, contacts }));

    const byPhone: DuplicateGroup[] = Object.entries(phoneGroups)
      .filter(([, group]) => group.length > 1)
      .map(([key, contacts]) => ({ key, contacts }));

    return { byEmail, byPhone };
  }, [contacts]);

  const mergeMutation = useMutation({
    mutationFn: async ({ primaryId, secondaryIds }: { primaryId: string; secondaryIds: string[] }) => {
      const primary = contacts.find(c => c.id === primaryId);
      const secondaries = contacts.filter(c => secondaryIds.includes(c.id));
      
      if (!primary) throw new Error('Primary contact not found');

      // Build merged data - fill nulls from secondaries
      const mergedData: Record<string, any> = {};
      const fieldsToMerge = ['first_name', 'last_name', 'email', 'phone', 'preferred_channel', 'preferred_language', 'brand_id', 'location_id'];
      
      fieldsToMerge.forEach(field => {
        if (!(primary as any)[field]) {
          for (const secondary of secondaries) {
            if ((secondary as any)[field]) {
              mergedData[field] = (secondary as any)[field];
              break;
            }
          }
        }
      });

      // Update primary contact with merged data if there's anything to merge
      if (Object.keys(mergedData).length > 0) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update(mergedData)
          .eq('id', primaryId);
        if (updateError) throw updateError;
      }

      // Transfer tag assignments from secondaries to primary
      for (const secondaryId of secondaryIds) {
        const secondaryTags = contactTagMap[secondaryId] || [];
        const primaryTags = contactTagMap[primaryId] || [];
        
        for (const tagId of secondaryTags) {
          if (!primaryTags.includes(tagId)) {
            await supabase
              .from('contact_tag_assignments')
              .insert({ contact_id: primaryId, tag_id: tagId })
              .select();
          }
        }
      }

      // Transfer survey invitations
      for (const secondaryId of secondaryIds) {
        await supabase
          .from('survey_invitations')
          .update({ contact_id: primaryId })
          .eq('contact_id', secondaryId);
      }

      // Transfer survey responses
      for (const secondaryId of secondaryIds) {
        await supabase
          .from('survey_responses')
          .update({ contact_id: primaryId })
          .eq('contact_id', secondaryId);
      }

      // Delete tag assignments for secondaries
      for (const secondaryId of secondaryIds) {
        await supabase
          .from('contact_tag_assignments')
          .delete()
          .eq('contact_id', secondaryId);
      }

      // Delete secondary contacts
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .in('id', secondaryIds);
      if (deleteError) throw deleteError;

      return { primaryId, deletedCount: secondaryIds.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-tag-assignments'] });
      toast({
        title: 'Contacts merged successfully',
        description: `Merged ${data.deletedCount + 1} contacts into one.`,
      });
      setConfirmMerge(null);
      // Clear selection for this group
      setSelectedPrimary(prev => {
        const updated = { ...prev };
        delete updated[confirmMerge?.key || ''];
        return updated;
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error merging contacts',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleMerge = (group: DuplicateGroup) => {
    const primaryId = selectedPrimary[group.key];
    if (!primaryId) {
      toast({
        title: 'Select primary contact',
        description: 'Please select which contact to keep as the primary.',
        variant: 'destructive',
      });
      return;
    }
    setConfirmMerge(group);
  };

  const confirmMergeAction = () => {
    if (!confirmMerge) return;
    const primaryId = selectedPrimary[confirmMerge.key];
    const secondaryIds = confirmMerge.contacts.filter(c => c.id !== primaryId).map(c => c.id);
    mergeMutation.mutate({ primaryId, secondaryIds });
  };

  const renderContactCard = (contact: Contact, groupKey: string, isSelected: boolean) => (
    <Card 
      key={contact.id} 
      className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
      onClick={() => setSelectedPrimary(prev => ({ ...prev, [groupKey]: contact.id }))}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <RadioGroupItem value={contact.id} id={contact.id} className="mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-tertiary-light text-secondary text-xs">
                  {contact.first_name?.[0]}{contact.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{contact.first_name} {contact.last_name}</p>
                <Badge variant={contact.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {contact.status}
                </Badge>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary ml-auto" />}
            </div>
            
            <div className="space-y-1 text-sm">
              {contact.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{contact.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Created: {contact.created_at ? format(parseISO(contact.created_at), 'MMM d, yyyy') : '-'}</span>
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              {contact.brand?.name && <span>{contact.brand.name}</span>}
              {contact.brand?.name && contact.location?.name && <span> • </span>}
              {contact.location?.name && <span>{contact.location.name}</span>}
            </div>

            {(contactTagMap[contact.id] || []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(contactTagMap[contact.id] || []).slice(0, 3).map((tagId) => (
                  <Badge key={tagId} variant="outline" className="text-xs">Tag</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDuplicateGroup = (group: DuplicateGroup, type: 'email' | 'phone') => (
    <div key={group.key} className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {type === 'email' ? <Mail className="h-4 w-4 text-muted-foreground" /> : <Phone className="h-4 w-4 text-muted-foreground" />}
          <span className="font-medium text-sm">{type === 'email' ? group.key : `+${group.key}`}</span>
          <Badge variant="secondary">{group.contacts.length} contacts</Badge>
        </div>
        <Button 
          size="sm" 
          onClick={() => handleMerge(group)}
          disabled={!selectedPrimary[group.key] || mergeMutation.isPending}
        >
          <GitMerge className="h-4 w-4 mr-2" />
          Merge
        </Button>
      </div>
      
      <RadioGroup 
        value={selectedPrimary[group.key] || ''} 
        onValueChange={(value) => setSelectedPrimary(prev => ({ ...prev, [group.key]: value }))}
      >
        <Label className="text-xs text-muted-foreground mb-2 block">Select the primary contact to keep:</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {group.contacts.map((contact) => 
            renderContactCard(contact, group.key, selectedPrimary[group.key] === contact.id)
          )}
        </div>
      </RadioGroup>
    </div>
  );

  const totalDuplicates = duplicates.byEmail.length + duplicates.byPhone.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Duplicate Detection
            </DialogTitle>
            <DialogDescription>
              {totalDuplicates > 0 
                ? `Found ${totalDuplicates} potential duplicate group${totalDuplicates !== 1 ? 's' : ''}. Select a primary contact and merge duplicates.`
                : 'No duplicate contacts found based on matching email or phone number.'}
            </DialogDescription>
          </DialogHeader>

          {totalDuplicates > 0 ? (
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="gap-2">
                  <Mail className="h-4 w-4" />
                  By Email ({duplicates.byEmail.length})
                </TabsTrigger>
                <TabsTrigger value="phone" className="gap-2">
                  <Phone className="h-4 w-4" />
                  By Phone ({duplicates.byPhone.length})
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[400px] mt-4">
                <TabsContent value="email" className="space-y-4 mt-0">
                  {duplicates.byEmail.length > 0 ? (
                    duplicates.byEmail.map((group) => renderDuplicateGroup(group, 'email'))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No duplicate emails found.
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="phone" className="space-y-4 mt-0">
                  {duplicates.byPhone.length > 0 ? (
                    duplicates.byPhone.map((group) => renderDuplicateGroup(group, 'phone'))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No duplicate phone numbers found.
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Check className="h-12 w-12 text-success mb-4" />
              <p className="text-lg font-medium">All clean!</p>
              <p className="text-muted-foreground">No duplicate contacts were found in your database.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmMerge} onOpenChange={(open) => !open && setConfirmMerge(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Merge</AlertDialogTitle>
            <AlertDialogDescription>
              This will merge {confirmMerge?.contacts.length} contacts into one. The following will happen:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All data from secondary contacts will fill in missing fields</li>
                <li>All tags will be transferred to the primary contact</li>
                <li>All survey invitations and responses will be transferred</li>
                <li>Secondary contacts will be permanently deleted</li>
              </ul>
              <p className="mt-3 font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmMergeAction}
              disabled={mergeMutation.isPending}
              className="btn-coral"
            >
              {mergeMutation.isPending ? 'Merging...' : 'Confirm Merge'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
