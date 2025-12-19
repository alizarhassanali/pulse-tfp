import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ChannelBadge } from '@/components/ui/channel-badge';
import { Mail, Phone, Send, Building, MapPin, Tag } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DEMO_CONTACTS, getBrandName, getLocationName } from '@/data/demo-data';

interface ContactDetailsModalProps {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to check if an ID is a demo ID (non-UUID format)
const isDemoId = (id: string | null): boolean => {
  if (!id) return false;
  // Demo IDs are short strings like 'c1', 'c2', 'contact-1', etc.
  // Real UUIDs are 36 chars with specific format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return !uuidRegex.test(id);
};

// Get demo contact data for non-UUID IDs
const getDemoContactData = (contactId: string) => {
  // Try to find by exact match first
  let contact = DEMO_CONTACTS.find(c => c.id === contactId);
  
  // If not found, create synthetic demo data
  if (!contact) {
    return {
      id: contactId,
      first_name: 'Demo',
      last_name: 'Contact',
      email: 'demo@example.com',
      phone: '+1 (555) 000-0000',
      preferred_channel: 'email',
      brand: { name: 'Demo Brand' },
      location: { name: 'Demo Location' },
      status: 'active',
      created_at: new Date().toISOString(),
    };
  }
  
  return {
    ...contact,
    brand: { name: getBrandName(contact.brand_id) },
    location: { name: getLocationName(contact.location_id) },
    created_at: new Date().toISOString(),
  };
};

export function ContactDetailsModal({ contactId, open, onOpenChange }: ContactDetailsModalProps) {
  const isDemo = isDemoId(contactId);
  
  const { data: contact, isLoading: loadingContact } = useQuery({
    queryKey: ['contact-detail', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      
      // For demo IDs, return synthetic data
      if (isDemo) {
        return getDemoContactData(contactId);
      }
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*, brand:brands(name), location:locations(name)')
        .eq('id', contactId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!contactId && open,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['contact-tags', contactId],
    queryFn: async () => {
      if (!contactId || isDemo) return [];
      const { data, error } = await supabase
        .from('contact_tag_assignments')
        .select('tag:contact_tags(id, name)')
        .eq('contact_id', contactId);
      if (error) throw error;
      return data?.map((d: any) => d.tag) || [];
    },
    enabled: !!contactId && open && !isDemo,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['contact-submissions', contactId],
    queryFn: async () => {
      if (!contactId || isDemo) return [];
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*, event:events(name)')
        .eq('contact_id', contactId)
        .order('completed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId && open && !isDemo,
  });

  const { data: communications = [] } = useQuery({
    queryKey: ['contact-communications', contactId],
    queryFn: async () => {
      if (!contactId || isDemo) return [];
      const { data, error } = await supabase
        .from('survey_invitations')
        .select('*, event:events(name)')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId && open && !isDemo,
  });

  const getPreferredMethodDisplay = (channel: string | null) => {
    switch (channel) {
      case 'both': return 'SMS & Email';
      case 'sms': return 'SMS Only';
      case 'email': return 'Email Only';
      default: return channel || '-';
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {contact ? `${contact.first_name} ${contact.last_name}` : 'Contact Details'}
            {contact?.status === 'active' ? (
              <Badge className="bg-success">Active</Badge>
            ) : (
              <Badge variant="secondary">{contact?.status || 'Unknown'}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loadingContact ? (
          <div className="py-8 text-center text-muted-foreground">Loading contact...</div>
        ) : !contact ? (
          <div className="py-8 text-center text-muted-foreground">Contact not found</div>
        ) : (
          <Tabs defaultValue="info" className="mt-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6 pt-4">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </span>
                  <p className="font-medium">{contact.email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </span>
                  <p className="font-medium">{contact.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" /> Brand
                  </span>
                  <p className="font-medium">{contact.brand?.name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </span>
                  <p className="font-medium">{contact.location?.name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Preferred Method</span>
                  <p className="font-medium capitalize">{getPreferredMethodDisplay(contact.preferred_channel)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Created</span>
                  <p className="font-medium">
                    {contact.created_at ? format(parseISO(contact.created_at), 'MMM d, yyyy') : '-'}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <span className="text-muted-foreground text-sm flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Tags
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: any) => (
                      <Badge key={tag.id} variant="outline">{tag.name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button className="btn-coral mt-4">
                <Send className="h-4 w-4 mr-2" />
                Send Ad-hoc Survey
              </Button>
            </TabsContent>

            <TabsContent value="submissions" className="pt-4">
              {submissions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No submissions yet</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub: any) => (
                    <Card key={sub.id} className="border-border/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{sub.event?.name || 'Survey'}</span>
                          <div className="flex items-center gap-2">
                            {sub.nps_score !== null && <ScoreBadge score={sub.nps_score} />}
                            <span className="text-sm text-muted-foreground">
                              {sub.completed_at ? format(parseISO(sub.completed_at), 'MMM d, yyyy') : '-'}
                            </span>
                          </div>
                        </div>
                        {Array.isArray(sub.answers) && sub.answers.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {sub.answers.slice(0, 2).map((ans: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <p className="text-muted-foreground">{ans.question}</p>
                                <p>{typeof ans.answer === 'string' ? ans.answer : JSON.stringify(ans.answer)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="communications" className="pt-4">
              {communications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No communications yet</p>
              ) : (
                <div className="space-y-3">
                  {communications.map((comm: any) => (
                    <div key={comm.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{comm.event?.name || 'Survey Invitation'}</p>
                        <p className="text-sm text-muted-foreground">
                          {comm.created_at ? format(parseISO(comm.created_at), 'MMM d, yyyy HH:mm') : '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChannelBadge channel={comm.channel as any} />
                        <Badge variant={comm.status === 'completed' ? 'default' : 'secondary'} className={comm.status === 'completed' ? 'bg-success' : ''}>
                          {comm.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
