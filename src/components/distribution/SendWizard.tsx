import { useState, useMemo } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  MessageSquare,
  Send,
  Users,
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  Clock,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_channel: string | null;
  brand_id?: string | null;
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
  { id: 'recipients', label: 'Select Recipients', icon: Users },
  { id: 'compose', label: 'Compose Message', icon: Mail },
  { id: 'confirm', label: 'Review & Send', icon: Send },
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
  const [filterBrand, setFilterBrand] = useState<boolean>(true);

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

  // Filter contacts by brand and eligibility
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Must have email or phone
      if (!c.email && !c.phone) return false;

      // Filter by brand if enabled
      if (filterBrand && eventBrandId && c.brand_id && c.brand_id !== eventBrandId) {
        return false;
      }

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

      return true;
    });
  }, [contacts, searchQuery, filterChannel, filterBrand, eventBrandId]);

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
                'flex items-center gap-2 px-4 py-2 rounded-full transition-colors',
                index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStep
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
              <span className="font-medium hidden sm:inline">{step.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <ChevronRight className="h-5 w-5 mx-2 text-muted-foreground" />
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
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              {eventBrandId && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="filterBrand"
                    checked={filterBrand}
                    onCheckedChange={(c) => setFilterBrand(c as boolean)}
                  />
                  <Label htmlFor="filterBrand" className="text-sm">
                    Only matching brand
                  </Label>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">
                {filteredContacts.length} eligible contacts
              </Badge>
              <Badge variant={selectedContacts.length > 0 ? 'default' : 'outline'}>
                {selectedContacts.length} selected
              </Badge>
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

      {/* Step 2: Compose */}
      {currentStep === 1 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Channel Settings */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Channel Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Respect Preferred Channel</Label>
                  <p className="text-sm text-muted-foreground">
                    Send via each contact's preferred channel
                  </p>
                </div>
                <Switch checked={respectPreferredChannel} onCheckedChange={setRespectPreferredChannel} />
              </div>

              {!respectPreferredChannel && (
                <div className="flex items-center gap-6 p-4 border rounded-lg">
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

              {/* Channel Breakdown */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <p className="text-sm font-medium">Delivery Breakdown</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{channelBreakdown.emailCount} via Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{channelBreakdown.smsCount} via SMS</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Email Content */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email Body</Label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {'{first_name}'}, {'{last_name}'}, {'{survey_link}'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SMS Content */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  className="min-h-[80px] font-mono text-sm"
                  maxLength={160}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Variables: {'{first_name}'}, {'{survey_link}'}</span>
                  <span className={smsBody.length > 160 ? 'text-destructive' : ''}>
                    {smsBody.length}/160
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="shadow-soft border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={sendSchedule} onValueChange={(v) => setSendSchedule(v as 'now' | 'schedule')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Send Immediately</SelectItem>
                  <SelectItem value="schedule">Schedule for Later</SelectItem>
                </SelectContent>
              </Select>

              {sendSchedule === 'schedule' && (
                <div className="grid grid-cols-2 gap-4">
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
                  ? 'Messages will be sent via each contact\'s preferred channel.'
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
