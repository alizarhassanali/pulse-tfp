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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Mail, Phone, Calendar, GitMerge, Check, Users, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const [confirmMerge, setConfirmMerge] = useState<{ groups: DuplicateGroup[]; isBulk: boolean } | null>(null);

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

  // Auto-select oldest contact as primary for each group
  const getPrimaryId = (group: DuplicateGroup) => {
    if (selectedPrimary[group.key]) return selectedPrimary[group.key];
    const sorted = [...group.contacts].sort((a, b) => 
      new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );
    return sorted[0].id;
  };

  const mergeMutation = useMutation({
    mutationFn: async ({ groups }: { groups: DuplicateGroup[] }) => {
      let totalMerged = 0;
      for (const group of groups) {
        const primaryId = getPrimaryId(group);
        const secondaryIds = group.contacts.filter(c => c.id !== primaryId).map(c => c.id);
        const primary = contacts.find(c => c.id === primaryId);
        const secondaries = contacts.filter(c => secondaryIds.includes(c.id));
        
        if (!primary) continue;

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

        if (Object.keys(mergedData).length > 0) {
          const { error } = await supabase.from('contacts').update(mergedData).eq('id', primaryId);
          if (error) throw error;
        }

        for (const secondaryId of secondaryIds) {
          const secondaryTags = contactTagMap[secondaryId] || [];
          const primaryTags = contactTagMap[primaryId] || [];
          for (const tagId of secondaryTags) {
            if (!primaryTags.includes(tagId)) {
              await supabase.from('contact_tag_assignments').insert({ contact_id: primaryId, tag_id: tagId }).select();
            }
          }
        }

        for (const secondaryId of secondaryIds) {
          await supabase.from('survey_invitations').update({ contact_id: primaryId }).eq('contact_id', secondaryId);
          await supabase.from('survey_responses').update({ contact_id: primaryId }).eq('contact_id', secondaryId);
          await supabase.from('contact_tag_assignments').delete().eq('contact_id', secondaryId);
        }

        const { error } = await supabase.from('contacts').delete().in('id', secondaryIds);
        if (error) throw error;
        totalMerged += secondaryIds.length;
      }
      return { totalMerged, groupCount: groups.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-tag-assignments'] });
      toast({
        title: 'Contacts merged successfully',
        description: `Merged ${data.groupCount} group${data.groupCount !== 1 ? 's' : ''}, removed ${data.totalMerged} duplicate${data.totalMerged !== 1 ? 's' : ''}.`,
      });
      setConfirmMerge(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error merging contacts', description: error.message, variant: 'destructive' });
    },
  });

  const handleMerge = (group: DuplicateGroup) => {
    setConfirmMerge({ groups: [group], isBulk: false });
  };

  const handleMergeAll = (groups: DuplicateGroup[]) => {
    if (groups.length === 0) return;
    setConfirmMerge({ groups, isBulk: true });
  };

  const confirmMergeAction = () => {
    if (!confirmMerge) return;
    mergeMutation.mutate({ groups: confirmMerge.groups });
  };

  const getContactName = (c: Contact) => [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unnamed';

  const renderDuplicateGroup = (group: DuplicateGroup, type: 'email' | 'phone') => {
    const primaryId = getPrimaryId(group);
    const primary = group.contacts.find(c => c.id === primaryId)!;
    const others = group.contacts.filter(c => c.id !== primaryId);

    return (
      <div key={group.key} className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {type === 'email' ? <Mail className="h-4 w-4 text-muted-foreground" /> : <Phone className="h-4 w-4 text-muted-foreground" />}
            <span className="font-medium text-sm">{type === 'email' ? group.key : `+${group.key}`}</span>
            <Badge variant="secondary">{group.contacts.length} contacts</Badge>
          </div>
          <Button size="sm" onClick={() => handleMerge(group)} disabled={mergeMutation.isPending}>
            <GitMerge className="h-4 w-4 mr-2" />
            Merge
          </Button>
        </div>

        <div className="space-y-2">
          {group.contacts.map((contact) => {
            const isPrimary = contact.id === primaryId;
            return (
              <div key={contact.id} className={`flex items-center justify-between text-sm px-3 py-2 rounded ${isPrimary ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'}`}>
                <div className="flex items-center gap-3">
                  {isPrimary && <Badge variant="outline" className="text-xs">Primary</Badge>}
                  <span className="font-medium">{getContactName(contact)}</span>
                  {contact.email && <span className="text-muted-foreground">{contact.email}</span>}
                  {contact.phone && <span className="text-muted-foreground">{contact.phone}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {contact.created_at ? format(parseISO(contact.created_at), 'MMM d, yyyy') : '-'}
                  </span>
                  {!isPrimary && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedPrimary(prev => ({ ...prev, [group.key]: contact.id }))}>
                          Set as primary
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
                ? `Found ${totalDuplicates} potential duplicate group${totalDuplicates !== 1 ? 's' : ''}. The oldest contact is auto-selected as primary.`
                : 'No duplicate contacts found based on matching email or phone number.'}
            </DialogDescription>
          </DialogHeader>

          {totalDuplicates > 0 ? (
            <Tabs defaultValue="email" className="w-full">
              <div className="flex items-center justify-between mb-2">
                <TabsList className="grid w-auto grid-cols-2">
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Email ({duplicates.byEmail.length})
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="gap-2">
                    <Phone className="h-4 w-4" />
                    Phone ({duplicates.byPhone.length})
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <ScrollArea className="h-[400px]">
                <TabsContent value="email" className="space-y-4 mt-0">
                  {duplicates.byEmail.length > 0 && (
                    <div className="flex justify-end">
                      <Button size="sm" variant="default" onClick={() => handleMergeAll(duplicates.byEmail)} disabled={mergeMutation.isPending}>
                        <GitMerge className="h-4 w-4 mr-2" />
                        Merge All ({duplicates.byEmail.length})
                      </Button>
                    </div>
                  )}
                  {duplicates.byEmail.length > 0 ? (
                    duplicates.byEmail.map((group) => renderDuplicateGroup(group, 'email'))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No duplicate emails found.</div>
                  )}
                </TabsContent>
                
                <TabsContent value="phone" className="space-y-4 mt-0">
                  {duplicates.byPhone.length > 0 && (
                    <div className="flex justify-end">
                      <Button size="sm" variant="default" onClick={() => handleMergeAll(duplicates.byPhone)} disabled={mergeMutation.isPending}>
                        <GitMerge className="h-4 w-4 mr-2" />
                        Merge All ({duplicates.byPhone.length})
                      </Button>
                    </div>
                  )}
                  {duplicates.byPhone.length > 0 ? (
                    duplicates.byPhone.map((group) => renderDuplicateGroup(group, 'phone'))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No duplicate phone numbers found.</div>
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
            <AlertDialogTitle>Confirm {confirmMerge?.isBulk ? 'Bulk ' : ''}Merge</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMerge?.isBulk 
                ? `This will merge ${confirmMerge.groups.length} duplicate groups. For each group:`
                : `This will merge ${confirmMerge?.groups[0]?.contacts.length} contacts into one:`}
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Missing fields on the primary will be filled from duplicates</li>
                <li>All tags, invitations, and responses will be transferred</li>
                <li>Duplicate contacts will be permanently deleted</li>
              </ul>
              <p className="mt-3 font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMergeAction} disabled={mergeMutation.isPending} className="btn-coral">
              {mergeMutation.isPending ? 'Merging...' : confirmMerge?.isBulk ? `Merge All ${confirmMerge.groups.length} Groups` : 'Confirm Merge'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
