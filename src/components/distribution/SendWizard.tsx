import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  MessageSquare,
  Send,
  Users,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  SlidersHorizontal,
  Check,
  AlertTriangle,
  Clock,
  Eye,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContactTagsSelect } from '@/components/contacts/ContactTagsSelect';

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_channel: string | null;
  brand_id?: string | null;
  location_id?: string | null;
  status?: string | null;
}

interface SendWizardProps {
  contacts: Contact[];
  eventId: string;
  eventName: string;
  eventStatus: string;
  eventBrandId?: string | null;
  throttleDays?: number;
  onClose?: () => void;
}

const STEPS = [
  { id: 'recipients', label: 'Recipients', fullLabel: 'Select Recipients', icon: Users },
  { id: 'compose', label: 'Compose', fullLabel: 'Compose Message', icon: Mail },
  { id: 'confirm', label: 'Review', fullLabel: 'Review & Send', icon: Send },
];

export function SendWizard({
  contacts,
  eventId,
  eventName,
  eventStatus,
  eventBrandId,
  throttleDays = 90,
  onClose,
}: SendWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Recipient selection
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  
  // Enhanced filters
  const [filterHasEmail, setFilterHasEmail] = useState<boolean | null>(null);
  const [filterHasPhone, setFilterHasPhone] = useState<boolean | null>(null);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSurveyHistory, setFilterSurveyHistory] = useState<string>('all');
  const [filterDaysSinceSurvey, setFilterDaysSinceSurvey] = useState<string>('all');

  // Fetch locations for filter dropdown
  const { data: locations = [] } = useQuery({
    queryKey: ['locations-for-filter', eventBrandId],
    queryFn: async () => {
      let query = supabase.from('locations').select('id, name');
      if (eventBrandId) {
        query = query.eq('brand_id', eventBrandId);
      }
      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch contact tag assignments
  const { data: tagAssignments = [] } = useQuery({
    queryKey: ['contact-tag-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_tag_assignments')
        .select('contact_id, tag_id');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch survey invitations to calculate last survey date per contact
  const { data: surveyInvitations = [] } = useQuery({
    queryKey: ['contact-survey-invitations-wizard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survey_invitations')
        .select('contact_id, sent_at')
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Build a map of contact ID to last survey date
  const contactLastSurveyMap = useMemo(() => {
    const map: Record<string, Date> = {};
    surveyInvitations.forEach((inv: any) => {
      if (inv.contact_id && inv.sent_at) {
        const sentDate = new Date(inv.sent_at);
        if (!map[inv.contact_id] || sentDate > map[inv.contact_id]) {
          map[inv.contact_id] = sentDate;
        }
      }
    });
    return map;
  }, [surveyInvitations]);

  // Channel settings
  const [respectPreferredChannel, setRespectPreferredChannel] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);

  // Message content
  const [emailSubject, setEmailSubject] = useState('How was your recent visit?');
  const [emailBody, setEmailBody] = useState(
    'Hi {first_name},\n\nWe hope you had a great experience. Please take a moment to share your feedback:\n\n{survey_link}\n\nThank you!'
  );
  const [smsBody, setSmsBody] = useState(
    'Hi {first_name}, how was your visit? Share your feedback: {survey_link}'
  );

  // Schedule
  const [sendSchedule, setSendSchedule] = useState<'now' | 'schedule'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  // Collapsible sections
  const [emailOpen, setEmailOpen] = useState(true);
  const [smsOpen, setSmsOpen] = useState(true);

  // Helper to get contact tags
  const getContactTags = (contactId: string) => {
    return tagAssignments
      .filter((ta: any) => ta.contact_id === contactId)
      .map((ta: any) => ta.tag_id);
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filterHasEmail !== null || 
           filterHasPhone !== null || 
           filterTags.length > 0 || 
           filterLocation !== 'all' || 
           filterStatus !== 'all' ||
           filterChannel !== 'all' ||
           filterSurveyHistory !== 'all' ||
           filterDaysSinceSurvey !== 'all';
  }, [filterHasEmail, filterHasPhone, filterTags, filterLocation, filterStatus, filterChannel, filterSurveyHistory, filterDaysSinceSurvey]);

  // Clear all filters
  const clearFilters = () => {
    setFilterHasEmail(null);
    setFilterHasPhone(null);
    setFilterTags([]);
    setFilterLocation('all');
    setFilterStatus('all');
    setFilterChannel('all');
    setFilterSurveyHistory('all');
    setFilterDaysSinceSurvey('all');
    setSearchQuery('');
  };

  // Filter contacts by brand and eligibility
  const filteredContacts = useMemo(() => {
    const now = new Date();
    return contacts.filter((c) => {
      // Must have email or phone
      if (!c.email && !c.phone) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        if (
          !fullName.includes(query) &&
          !c.email?.toLowerCase().includes(query) &&
          !c.phone?.includes(query)
        ) {
          return false;
        }
      }

      // Channel filter
      if (filterChannel !== 'all' && c.preferred_channel !== filterChannel) {
        return false;
      }

      // Has Email filter
      if (filterHasEmail === true && !c.email) return false;
      if (filterHasEmail === false && c.email) return false;

      // Has Phone filter
      if (filterHasPhone === true && !c.phone) return false;
      if (filterHasPhone === false && c.phone) return false;

      // Location filter
      if (filterLocation !== 'all' && c.location_id !== filterLocation) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        const contactStatus = c.status || 'active';
        if (contactStatus !== filterStatus) return false;
      }

      // Tags filter - contact must have at least one of the selected tags
      if (filterTags.length > 0) {
        const contactTags = getContactTags(c.id);
        const hasMatchingTag = filterTags.some(tagId => contactTags.includes(tagId));
        if (!hasMatchingTag) return false;
      }

      // Survey history filter
      const lastSurveyDate = contactLastSurveyMap[c.id];
      if (filterSurveyHistory === 'never' && lastSurveyDate) return false;
      if (filterSurveyHistory === 'surveyed' && !lastSurveyDate) return false;

      // Days since last survey filter
      if (filterDaysSinceSurvey !== 'all' && lastSurveyDate) {
        const daysSince = Math.floor((now.getTime() - lastSurveyDate.getTime()) / (1000 * 60 * 60 * 24));
        const threshold = parseInt(filterDaysSinceSurvey);
        if (daysSince < threshold) return false;
      }

      return true;
    });
  }, [contacts, searchQuery, filterChannel, filterHasEmail, filterHasPhone, filterLocation, filterStatus, filterTags, tagAssignments, filterSurveyHistory, filterDaysSinceSurvey, contactLastSurveyMap]);

  // Calculate channel breakdown
  const channelBreakdown = useMemo(() => {
    const selected = contacts.filter((c) => selectedContacts.includes(c.id));
    const emailCount = selected.filter((c) => c.email && (c.preferred_channel === 'email' || !c.preferred_channel)).length;
    const smsCount = selected.filter((c) => c.phone && c.preferred_channel === 'sms').length;
    const noChannel = selected.filter((c) => !c.email && !c.phone).length;
    return { emailCount, smsCount, noChannel, total: selected.length };
  }, [contacts, selectedContacts]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    }
  };

  const getChannelBadge = (contact: Contact) => {
    if (contact.preferred_channel === 'email') {
      return <Badge variant="secondary" className="text-xs"><Mail className="h-3 w-3 mr-1" />Email</Badge>;
    }
    if (contact.preferred_channel === 'sms') {
      return <Badge variant="secondary" className="text-xs"><MessageSquare className="h-3 w-3 mr-1" />SMS</Badge>;
    }
    if (contact.email) {
      return <Badge variant="outline" className="text-xs"><Mail className="h-3 w-3 mr-1" />Email (default)</Badge>;
    }
    if (contact.phone) {
      return <Badge variant="outline" className="text-xs"><MessageSquare className="h-3 w-3 mr-1" />SMS only</Badge>;
    }
    return <Badge variant="destructive" className="text-xs">No channel</Badge>;
  };

  const getEligibilityStatus = (contact: Contact) => {
    if (!contact.email && !contact.phone) {
      return { eligible: false, reason: 'No contact info' };
    }
    return { eligible: true, reason: null };
  };

  const handleNext = () => {
    if (currentStep === 0 && selectedContacts.length === 0) {
      toast({ title: 'Please select at least one recipient', variant: 'destructive' });
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSend = () => {
    const channels = [];
    if (sendEmail) channels.push('Email');
    if (sendSms) channels.push('SMS');
    const channelInfo = respectPreferredChannel
      ? 'via preferred channels'
      : `via ${channels.join(' & ')}`;

    toast({
      title: 'Messages queued',
      description: `${selectedContacts.length} messages will be sent ${sendSchedule === 'now' ? 'immediately' : `on ${scheduleDate} at ${scheduleTime}`} ${channelInfo}.`,
    });
    setSelectedContacts([]);
    setConfirmDialogOpen(false);
    setCurrentStep(0);
    onClose?.();
  };

  const previewMessage = (template: string, contact?: Contact) => {
    const firstName = contact?.first_name || 'John';
    const lastName = contact?.last_name || 'Doe';
    return template
      .replace(/{first_name}/g, firstName)
      .replace(/{last_name}/g, lastName)
      .replace(/{survey_link}/g, `https://survey.userpulse.io/s/${eventId.slice(0, 8)}`);
  };

  // Check if event is draft
  const isDraft = eventStatus === 'draft';

  return (
    <div className="space-y-6">
      {/* Draft Warning */}
      {isDraft && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="font-medium text-warning">Event is in Draft</p>
                <p className="text-sm text-muted-foreground">
                  Activate this event before sending surveys. Recipients won't be able to access a draft survey.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-full transition-colors',
                index === currentStep
                  ? 'bg-secondary text-secondary-foreground'
                  : index < currentStep
                  ? 'bg-secondary/20 text-secondary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
              <span className="font-medium text-sm hidden sm:inline">{step.fullLabel}</span>
              <span className="font-medium text-sm sm:hidden">{step.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <ChevronRight className="h-5 w-5 mx-1 sm:mx-2 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Recipients */}
      {currentStep === 0 && (
        <Card className="shadow-soft border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Recipients
            </CardTitle>
            <CardDescription>
              Choose who should receive the survey invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Primary Filter Row: Search + Filters Button */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {[
                          filterChannel !== 'all',
                          filterHasEmail !== null,
                          filterHasPhone !== null,
                          filterLocation !== 'all',
                          filterStatus !== 'all',
                          filterTags.length > 0,
                          filterSurveyHistory !== 'all',
                          filterDaysSinceSurvey !== 'all',
                        ].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Filters</h4>
                      {hasActiveFilters && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearFilters}
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>

                    {/* Contact Info Group */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact Info</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Select value={filterChannel} onValueChange={setFilterChannel}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Channel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Channels</SelectItem>
                            <SelectItem value="email">Email Preferred</SelectItem>
                            <SelectItem value="sms">SMS Preferred</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <Select 
                            value={filterHasEmail === null ? 'all' : filterHasEmail ? 'yes' : 'no'} 
                            onValueChange={(v) => setFilterHasEmail(v === 'all' ? null : v === 'yes')}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Email" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any Email</SelectItem>
                              <SelectItem value="yes">Has Email</SelectItem>
                              <SelectItem value="no">No Email</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select 
                            value={filterHasPhone === null ? 'all' : filterHasPhone ? 'yes' : 'no'} 
                            onValueChange={(v) => setFilterHasPhone(v === 'all' ? null : v === 'yes')}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Phone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any Phone</SelectItem>
                              <SelectItem value="yes">Has Phone</SelectItem>
                              <SelectItem value="no">No Phone</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Segmentation Group */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Segmentation</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Select value={filterLocation} onValueChange={setFilterLocation}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map((loc: any) => (
                              <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <ContactTagsSelect
                          selectedTags={filterTags}
                          onTagsChange={setFilterTags}
                          placeholder="Tags..."
                        />
                      </div>
                    </div>

                    {/* Survey History Group */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Survey History</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Select value={filterSurveyHistory} onValueChange={setFilterSurveyHistory}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Survey History" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Contacts</SelectItem>
                            <SelectItem value="never">Never Surveyed</SelectItem>
                            <SelectItem value="surveyed">Previously Surveyed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterDaysSinceSurvey} onValueChange={setFilterDaysSinceSurvey}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Last Survey" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any Time</SelectItem>
                            <SelectItem value="30">30+ days ago</SelectItem>
                            <SelectItem value="60">60+ days ago</SelectItem>
                            <SelectItem value="90">90+ days ago</SelectItem>
                            <SelectItem value="180">180+ days ago</SelectItem>
                            <SelectItem value="365">1+ year ago</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Summary Row */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground">{filteredContacts.length}</span> eligible
                <span className="mx-1">•</span>
                <span className="font-medium text-foreground">{selectedContacts.length}</span> selected
              </div>
              {hasActiveFilters && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground h-auto p-0"
                >
                  Clear filters
                </Button>
              )}
            </div>

            {/* Contact Table */}
            <div className="border rounded-lg max-h-[350px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedContacts.length === filteredContacts.length &&
                          filteredContacts.length > 0
                        }
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No eligible contacts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContacts.map((contact) => {
                      const status = getEligibilityStatus(contact);
                      return (
                        <TableRow key={contact.id} className={!status.eligible ? 'opacity-50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={(checked) =>
                                handleSelectContact(contact.id, checked as boolean)
                              }
                              disabled={!status.eligible}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            <div>{contact.email}</div>
                            <div>{contact.phone}</div>
                          </TableCell>
                          <TableCell>{getChannelBadge(contact)}</TableCell>
                          <TableCell>
                            {status.eligible ? (
                              <Badge variant="outline" className="text-success border-success">
                                Eligible
                              </Badge>
                            ) : (
                              <Badge variant="destructive">{status.reason}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedContacts(filteredContacts.map((c) => c.id))}
              >
                Select All Eligible
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedContacts([])}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Compose - Redesigned */}
      {currentStep === 1 && (
        <div className="space-y-4">
          {/* Channel Settings Header */}
          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Delivery Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedContacts.length} recipients selected
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{channelBreakdown.emailCount}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{channelBreakdown.smsCount}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Respect Preferred Channel</Label>
                    <p className="text-sm text-muted-foreground">
                      Send via each contact's preferred channel
                    </p>
                  </div>
                  <Switch checked={respectPreferredChannel} onCheckedChange={setRespectPreferredChannel} />
                </div>

                {!respectPreferredChannel && (
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={sendEmail} onCheckedChange={(c) => setSendEmail(c as boolean)} />
                      <Label className="flex items-center gap-1">
                        <Mail className="h-4 w-4" /> Email
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox checked={sendSms} onCheckedChange={(c) => setSendSms(c as boolean)} />
                      <Label className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" /> SMS
                      </Label>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Section - Collapsible */}
          <Collapsible open={emailOpen} onOpenChange={setEmailOpen}>
            <Card className="shadow-soft border-border/50">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Email Content</CardTitle>
                        <CardDescription>Customize your email message</CardDescription>
                      </div>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", emailOpen && "rotate-180")} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Editor */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Subject Line</Label>
                        <Input 
                          value={emailSubject} 
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Enter email subject..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Body</Label>
                        <Textarea
                          value={emailBody}
                          onChange={(e) => setEmailBody(e.target.value)}
                          className="min-h-[180px] font-mono text-sm"
                          placeholder="Enter your email message..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Available variables: <code className="bg-muted px-1 rounded">{'{first_name}'}</code> <code className="bg-muted px-1 rounded">{'{last_name}'}</code> <code className="bg-muted px-1 rounded">{'{survey_link}'}</code>
                        </p>
                      </div>
                    </div>
                    
                    {/* Live Preview */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Eye className="h-4 w-4" /> Live Preview
                      </Label>
                      <div className="p-4 bg-muted/30 rounded-lg border min-h-[220px]">
                        <div className="space-y-3">
                          <div className="pb-2 border-b">
                            <p className="text-xs text-muted-foreground">Subject:</p>
                            <p className="font-medium">{previewMessage(emailSubject)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Body:</p>
                            <p className="text-sm whitespace-pre-wrap">{previewMessage(emailBody)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* SMS Section - Collapsible */}
          <Collapsible open={smsOpen} onOpenChange={setSmsOpen}>
            <Card className="shadow-soft border-border/50">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">SMS Content</CardTitle>
                        <CardDescription>Keep it short - 160 character limit</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={smsBody.length > 160 ? 'destructive' : 'secondary'} className="font-mono">
                        {smsBody.length}/160
                      </Badge>
                      <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", smsOpen && "rotate-180")} />
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Editor */}
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        value={smsBody}
                        onChange={(e) => setSmsBody(e.target.value)}
                        className="min-h-[100px] font-mono text-sm"
                        maxLength={160}
                        placeholder="Enter your SMS message..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Variables: <code className="bg-muted px-1 rounded">{'{first_name}'}</code> <code className="bg-muted px-1 rounded">{'{survey_link}'}</code>
                      </p>
                    </div>
                    
                    {/* Live Preview */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Eye className="h-4 w-4" /> Live Preview
                      </Label>
                      <div className="p-4 bg-muted/30 rounded-lg border">
                        <div className="max-w-[280px] mx-auto">
                          <div className="bg-primary/10 rounded-2xl rounded-bl-md p-3">
                            <p className="text-sm">{previewMessage(smsBody)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Schedule - Compact */}
          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Schedule</h3>
                    <p className="text-sm text-muted-foreground">When should messages be sent?</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={sendSchedule} onValueChange={(v) => setSendSchedule(v as 'now' | 'schedule')}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Send Immediately</SelectItem>
                      <SelectItem value="schedule">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sendSchedule === 'schedule' && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Review & Confirm */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Review Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-2xl font-bold">{selectedContacts.length}</p>
                  <p className="text-sm text-muted-foreground">Recipients</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-2xl font-bold">{channelBreakdown.emailCount}</p>
                  <p className="text-sm text-muted-foreground">via Email</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-2xl font-bold">{channelBreakdown.smsCount}</p>
                  <p className="text-sm text-muted-foreground">via SMS</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg text-center">
                  <p className="text-2xl font-bold">{sendSchedule === 'now' ? 'Now' : scheduleDate}</p>
                  <p className="text-sm text-muted-foreground">Delivery</p>
                </div>
              </div>

              {/* Message Preview */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email Preview
                  </Label>
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <p className="font-medium">{previewMessage(emailSubject)}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {previewMessage(emailBody)}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> SMS Preview
                  </Label>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm">{previewMessage(smsBody)}</p>
                  </div>
                </div>
              </div>

              {/* Event Info */}
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Sending for event:</p>
                <p className="font-medium">{eventName}</p>
                <Badge variant={eventStatus === 'active' ? 'default' : 'secondary'} className="mt-1">
                  {eventStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="btn-coral"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={isDraft || selectedContacts.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Send to {selectedContacts.length} Recipients
          </Button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Send</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send survey invitations to {selectedContacts.length} recipient(s) for "{eventName}".
              <span className="block mt-2">
                {sendSchedule === 'now'
                  ? 'Messages will be sent immediately.'
                  : `Messages will be sent on ${scheduleDate} at ${scheduleTime}.`}
              </span>
              <span className="block mt-2">
                {respectPreferredChannel
                  ? "Messages will be sent via each contact's preferred channel."
                  : `All contacts will receive ${sendEmail && sendSms ? 'both Email and SMS' : sendEmail ? 'Email only' : 'SMS only'}.`}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} className="btn-coral">
              Confirm & Send
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
