import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ChannelBadge } from '@/components/ui/channel-badge';
import { Mail, Phone, Send, Building, MapPin, Tag, AlertCircle, Pencil, Globe, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DEMO_CONTACTS, DEMO_BRANDS, getAllLocations } from '@/data/demo-data';
import { getLanguageLabel } from '@/types/database';

interface ContactDetailsModalProps {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

// UUID validation helper
const isValidUUID = (str: string | null): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Check if this is a demo contact ID
const isDemoContactId = (id: string | null): boolean => {
  if (!id) return false;
  return DEMO_CONTACTS.some(c => c.id === id);
};

// Get demo contact by ID
const getDemoContact = (id: string) => {
  const demoContact = DEMO_CONTACTS.find(c => c.id === id);
  if (!demoContact) return null;
  
  const brand = DEMO_BRANDS.find(b => b.id === demoContact.brand_id);
  const allLocations = getAllLocations();
  const location = allLocations.find(l => l.id === demoContact.location_id);
  
  return {
    ...demoContact,
    brand: brand ? { name: brand.name } : null,
    location: location ? { name: location.name } : null,
  };
};

export function ContactDetailsModal({ contactId, open, onOpenChange, onEdit }: ContactDetailsModalProps) {
  // Check if this is a demo contact
  const isDemo = isDemoContactId(contactId);
  const demoContact = isDemo && contactId ? getDemoContact(contactId) : null;
  
  // Fetch from real contacts table only if not a demo contact
  const { data: dbContact, isLoading: loadingContact, error: contactError } = useQuery({
    queryKey: ['contact-detail', contactId],
    queryFn: async () => {
      if (!contactId || isDemo) {
        return null;
      }
      
      if (import.meta.env.DEV) {
        console.log('[ContactDetailsModal] Fetching contact with ID:', contactId);
      }
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*, brand:brands(name), location:locations(name)')
        .eq('id', contactId)
        .maybeSingle();
      
      if (error) {
        console.error('[ContactDetailsModal] Supabase error:', error);
        throw error;
      }
      
      if (import.meta.env.DEV) {
        console.log('[ContactDetailsModal] Fetched contact:', data);
      }
      
      return data;
    },
    enabled: !!contactId && open && !isDemo,
  });

  // Use demo contact if available, otherwise use database contact
  const contact = demoContact || dbContact;

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

  // Handle missing contact ID
  if (!contactId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Missing Contact ID
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <p>No contact ID was provided. Please try again.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Handle invalid UUID format
  if (!isValidUUID(contactId)) {
    if (import.meta.env.DEV) {
      console.error('[ContactDetailsModal] Invalid contact ID format (not a UUID):', contactId);
    }
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Invalid Contact ID
            </DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <p>The contact ID format is invalid.</p>
            {import.meta.env.DEV && (
              <p className="text-sm mt-2 font-mono text-destructive">ID: {contactId}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              {contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Contact' : 'Contact Details'}
              {contact?.status === 'active' ? (
                <Badge className="bg-success">Active</Badge>
              ) : contact?.status ? (
                <Badge variant="secondary">{contact.status}</Badge>
              ) : null}
            </DialogTitle>
            {contact && onEdit && !isDemo && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {loadingContact && !isDemo ? (
          <div className="py-8 text-center text-muted-foreground">Loading contact...</div>
        ) : contactError && !isDemo ? (
          <div className="py-8 text-center text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load contact details</p>
            <p className="text-sm text-muted-foreground mt-1">{(contactError as Error).message}</p>
          </div>
        ) : !contact ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-warning" />
            <p>Contact not found</p>
            <p className="text-sm mt-1">ID: {contactId}</p>
          </div>
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
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Language
                  </span>
                  <p className="font-medium">{getLanguageLabel(contact.preferred_language || 'en')}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Created
                  </span>
                  <p className="font-medium">
                    {contact.created_at ? format(parseISO(contact.created_at), 'MMM d, yyyy') : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Updated
                  </span>
                  <p className="font-medium">
                    {contact.updated_at ? format(parseISO(contact.updated_at), 'MMM d, yyyy') : '-'}
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
