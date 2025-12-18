import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/ui/empty-state';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Link2,
  QrCode,
  Mail,
  MessageSquare,
  Code,
  Copy,
  Download,
  Send,
  Clock,
  Users,
  Server,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  Search,
  FileText,
  Calendar,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { DEMO_CONTACTS, DEMO_EVENTS, DEMO_LOCATIONS, DEMO_BRANDS } from '@/data/demo-data';

export default function Integration() {
  const { toast } = useToast();
  const location = useLocation();
  const eventIdFromState = location.state?.eventId;
  const { selectedEvent: globalEvent, selectedBrands, selectedLocations } = useFilterStore();
  
  // Use global event if available, otherwise use state from navigation
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedIntegrationLocation, setSelectedIntegrationLocation] = useState<string>('');
  const [activeTab, setActiveTab] = useState('direct-access');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('How was your recent visit?');
  const [emailBody, setEmailBody] = useState('Hi {first_name},\n\nWe hope you had a great experience at our clinic. Please take a moment to share your feedback:\n\n{survey_link}\n\nThank you!');
  const [smsBody, setSmsBody] = useState('Hi {first_name}, how was your visit? Share your feedback: {survey_link}');
  const [sendSchedule, setSendSchedule] = useState('now');
  const [buttonColor, setButtonColor] = useState('#FF887C');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Messaging channel selection
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [respectPreferredChannel, setRespectPreferredChannel] = useState(true);
  
  // Recipient filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterScoreType, setFilterScoreType] = useState<string>('all');
  
  // SFTP State
  const [sftpHost, setSftpHost] = useState('');
  const [sftpPort, setSftpPort] = useState('22');
  const [sftpUsername, setSftpUsername] = useState('');
  const [sftpPath, setSftpPath] = useState('/uploads');
  const [sftpEventMapping, setSftpEventMapping] = useState('');
  const [sftpChannelRule, setSftpChannelRule] = useState('preferred');
  const [sftpLastSync, setSftpLastSync] = useState<string | null>(null);
  const [sftpStatus, setSftpStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [sftpScheduleDays, setSftpScheduleDays] = useState<string[]>(['monday', 'wednesday', 'friday']);
  const [sftpScheduleTime, setSftpScheduleTime] = useState('09:00');
  const [sftpFileFormat, setSftpFileFormat] = useState('csv');

  // Initialize selected event from global filter or navigation state
  useEffect(() => {
    if (eventIdFromState) {
      setSelectedEvent(eventIdFromState);
    } else if (globalEvent && globalEvent !== 'all') {
      setSelectedEvent(globalEvent);
    }
  }, [eventIdFromState, globalEvent]);

  const { data: events = [] } = useQuery({
    queryKey: ['events-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['active', 'draft'])
        .order('name');
      if (error) throw error;
      return data?.length ? data : DEMO_EVENTS.map(e => ({ ...e, status: 'active', type: 'nps', config: {} }));
    },
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-send'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return data?.length ? data : DEMO_CONTACTS;
    },
  });

  // Get locations for the selected event's brand
  const eventLocations = useMemo(() => {
    const selectedEventData = events.find(e => e.id === selectedEvent);
    if (!selectedEventData?.brand_id) return [];
    return DEMO_LOCATIONS[selectedEventData.brand_id] || [];
  }, [selectedEvent, events]);

  const selectedEventData = events.find(e => e.id === selectedEvent);
  
  // Generate location-aware survey URL
  const surveyUrl = useMemo(() => {
    if (!selectedEvent) return '';
    let url = `https://survey.userpulse.io/s/${selectedEvent.slice(0, 8)}`;
    if (selectedIntegrationLocation) {
      url += `?loc=${selectedIntegrationLocation.slice(0, 8)}`;
    }
    return url;
  }, [selectedEvent, selectedIntegrationLocation]);

  const handleCopyLink = () => {
    if (!surveyUrl) {
      toast({ title: 'Please select an event first', variant: 'destructive' });
      return;
    }
    navigator.clipboard.writeText(surveyUrl);
    toast({ title: 'Link copied to clipboard' });
  };

  const handleDownloadQR = (format: 'png' | 'svg') => {
    toast({ title: `QR Code downloaded as ${format.toUpperCase()}` });
  };

  const handleSelectAll = (checked: boolean, contactList: { id: string }[]) => {
    if (checked) {
      setSelectedContacts(contactList.map((c) => c.id));
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

  const handleSendConfirm = () => {
    if (selectedContacts.length === 0) {
      toast({ title: 'Please select recipients', variant: 'destructive' });
      return;
    }
    setConfirmDialogOpen(true);
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
      description: `${selectedContacts.length} messages will be sent ${sendSchedule === 'now' ? 'immediately' : 'as scheduled'} ${channelInfo}.`,
    });
    setSelectedContacts([]);
    setConfirmDialogOpen(false);
  };

  const handleSftpTest = () => {
    toast({ title: 'Testing SFTP connection...', description: 'Please wait...' });
    setTimeout(() => {
      setSftpStatus('connected');
      setSftpLastSync(new Date().toISOString());
      toast({ title: 'SFTP Connected', description: 'Connection successful!' });
    }, 1500);
  };

  const handleSftpSave = () => {
    toast({ title: 'SFTP Configuration Saved', description: 'Integration settings have been saved.' });
  };

  const handleDownloadSampleTemplate = () => {
    const headers = ['first_name', 'last_name', 'email', 'phone', 'preferred_channel', 'brand_id', 'location_id', 'external_id', 'event_name'];
    const sampleRow = ['John', 'Doe', 'john@example.com', '+1234567890', 'email', 'brand-uuid', 'location-uuid', 'ext-123', 'post-visit-nps'];
    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sftp-contact-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Sample template downloaded' });
  };

  // Filter contacts for messaging
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Must have email or phone
      if (!c.email && !c.phone) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        if (!fullName.includes(query) && 
            !c.email?.toLowerCase().includes(query) && 
            !c.phone?.includes(query)) {
          return false;
        }
      }
      
      // Channel filter
      if (filterChannel !== 'all' && c.preferred_channel !== filterChannel) {
        return false;
      }
      
      return true;
    });
  }, [contacts, searchQuery, filterChannel]);

  const getChannelBadge = (channel: string | null) => {
    switch (channel) {
      case 'email':
        return <Badge variant="secondary" className="text-xs"><Mail className="h-3 w-3 mr-1" />Email</Badge>;
      case 'sms':
        return <Badge variant="secondary" className="text-xs"><MessageSquare className="h-3 w-3 mr-1" />SMS</Badge>;
      case 'both':
        return <Badge variant="secondary" className="text-xs">Both</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Not Set</Badge>;
    }
  };

  // Show empty state if no event selected
  if (!selectedEvent) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Integration"
          description="Distribute your surveys through various channels"
        />
        
        <Card className="shadow-soft border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">Select Event:</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="max-w-[400px]">
                  <SelectValue placeholder="Choose an event to configure" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} ({event.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <EmptyState
          icon={<Info className="h-8 w-8" />}
          title="Select an Event to Continue"
          description="Choose an event from the dropdown above or from the global filters to configure its distribution channels."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Integration"
        description="Distribute your surveys through various channels"
      />

      {/* Event Selection */}
      <Card className="shadow-soft border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">Select Event:</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="max-w-[400px]">
                <SelectValue placeholder="Choose an event to configure" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} ({event.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEventData && (
              <Badge variant={selectedEventData.status === 'active' ? 'default' : 'secondary'}>
                {selectedEventData.status}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Channel Tabs - Merged Link + QR into Direct Access */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="direct-access" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Direct Access
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Messaging
          </TabsTrigger>
          <TabsTrigger value="embed" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Web Embed
          </TabsTrigger>
          <TabsTrigger value="sftp" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            SFTP
          </TabsTrigger>
        </TabsList>

        {/* Direct Access Tab (Merged Link + QR) */}
        <TabsContent value="direct-access" className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Direct Survey Link & QR Code
              </CardTitle>
              <CardDescription>Share via link or QR code for in-clinic distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Location Selector */}
              {eventLocations.length > 1 && (
                <div className="space-y-2">
                  <Label>Select Location (for location-specific URL)</Label>
                  <Select 
                    value={selectedIntegrationLocation || 'all'} 
                    onValueChange={(val) => setSelectedIntegrationLocation(val === 'all' ? '' : val)}
                  >
                    <SelectTrigger className="max-w-[300px]">
                      <SelectValue placeholder="All Locations (generic URL)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {eventLocations.map((loc: any) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecting a location embeds it in the URL for accurate tracking
                  </p>
                </div>
              )}

              {/* URL Section */}
              <div className="space-y-2">
                <Label>Survey URL</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={surveyUrl}
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-8 flex items-center justify-center bg-muted/30">
                    <div className="h-48 w-48 bg-background rounded-lg border flex items-center justify-center">
                      <QrCode className="h-32 w-32 text-foreground" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => handleDownloadQR('png')}>
                      <Download className="h-4 w-4 mr-2" />
                      PNG
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => handleDownloadQR('svg')}>
                      <Download className="h-4 w-4 mr-2" />
                      SVG
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>QR Code Size</Label>
                    <Select defaultValue="256">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="128">128px (Small)</SelectItem>
                        <SelectItem value="256">256px (Medium)</SelectItem>
                        <SelectItem value="512">512px (Large)</SelectItem>
                        <SelectItem value="1024">1024px (Print)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Border Text (optional)</Label>
                    <Input placeholder="Scan to rate your visit" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messaging Tab (Email + SMS unified) */}
        <TabsContent value="messaging" className="space-y-4">
          {/* Channel Selection */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <MessageSquare className="h-5 w-5" />
                Messaging Settings
              </CardTitle>
              <CardDescription>
                Send surveys via Email and/or SMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Respect Preferred Channel</Label>
                  <p className="text-sm text-muted-foreground">
                    Send via each contact's preferred channel. If not set, use selected channels below.
                  </p>
                </div>
                <Switch 
                  checked={respectPreferredChannel} 
                  onCheckedChange={setRespectPreferredChannel} 
                />
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
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recipients with Filters */}
            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Recipients
                </CardTitle>
                <CardDescription>
                  {selectedContacts.length} of {filteredContacts.length} contacts selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search & Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name, email, phone..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterChannel} onValueChange={setFilterChannel}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterScoreType} onValueChange={setFilterScoreType}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Score Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="promoters">Promoters</SelectItem>
                        <SelectItem value="passives">Passives</SelectItem>
                        <SelectItem value="detractors">Detractors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean, filteredContacts)}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Channel</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow key={contact.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedContacts.includes(contact.id)}
                              onCheckedChange={(checked) =>
                                handleSelectContact(contact.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            <div>{contact.email}</div>
                            <div>{contact.phone}</div>
                          </TableCell>
                          <TableCell>
                            {getChannelBadge(contact.preferred_channel)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Message Content */}
            <div className="space-y-4">
              <Card className="shadow-soft border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
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
                      className="min-h-[100px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{first_name}'}, {'{last_name}'}, {'{survey_link}'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-soft border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
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

              <Card className="shadow-soft border-border/50">
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Schedule</Label>
                    <Select value={sendSchedule} onValueChange={setSendSchedule}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="now">Send Immediately</SelectItem>
                        <SelectItem value="schedule">Schedule for Later</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {sendSchedule === 'schedule' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input type="time" />
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full btn-coral"
                    onClick={handleSendConfirm}
                    disabled={selectedContacts.length === 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedContacts.length} Recipients
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Web Embed Tab */}
        <TabsContent value="embed" className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Web Embed Options</CardTitle>
              <CardDescription>Embed the survey on your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Button Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={buttonColor}
                      onChange={(e) => setButtonColor(e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={buttonColor}
                      onChange={(e) => setButtonColor(e.target.value)}
                      placeholder="#FF887C"
                    />
                  </div>
                </div>
              </div>

              <Tabs defaultValue="javascript">
                <TabsList>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="iframe">iFrame</TabsTrigger>
                  <TabsTrigger value="react">React</TabsTrigger>
                </TabsList>
                <TabsContent value="javascript" className="pt-4">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`<script src="https://cdn.userpulse.io/widget.js"></script>
<script>
  UserPulse.init({
    eventId: '${selectedEvent || 'your-event-id'}',
    trigger: 'button',
    buttonColor: '${buttonColor}'
  });
</script>`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`<script src="https://cdn.userpulse.io/widget.js"></script>`);
                        toast({ title: 'Code copied' });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="iframe" className="pt-4">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`<iframe 
  src="${surveyUrl}"
  width="100%"
  height="500"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>`}
                    </pre>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="react" className="pt-4">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`import { UserPulseWidget } from '@userpulse/react';

function App() {
  return (
    <UserPulseWidget 
      eventId="${selectedEvent || 'your-event-id'}"
      buttonColor="${buttonColor}"
    />
  );
}`}
                    </pre>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SFTP Integration Tab */}
        <TabsContent value="sftp" className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                SFTP Integration
              </CardTitle>
              <CardDescription>
                Connect to an SFTP server to automatically ingest contact data and trigger surveys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {sftpStatus === 'connected' ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : sftpStatus === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {sftpStatus === 'connected' ? 'Connected' : sftpStatus === 'error' ? 'Connection Error' : 'Not Connected'}
                    </p>
                    {sftpLastSync && (
                      <p className="text-sm text-muted-foreground">
                        Last sync: {new Date(sftpLastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleSftpTest}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
              </div>

              {/* SFTP Credentials */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>SFTP Host</Label>
                  <Input 
                    value={sftpHost} 
                    onChange={(e) => setSftpHost(e.target.value)}
                    placeholder="sftp.yourserver.com" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input 
                    value={sftpPort} 
                    onChange={(e) => setSftpPort(e.target.value)}
                    placeholder="22" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input 
                    value={sftpUsername} 
                    onChange={(e) => setSftpUsername(e.target.value)}
                    placeholder="sftp_user" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password / Key</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Remote Path</Label>
                  <Input 
                    value={sftpPath} 
                    onChange={(e) => setSftpPath(e.target.value)}
                    placeholder="/uploads/contacts" 
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Sync Schedule
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <Badge 
                          key={day} 
                          variant={sftpScheduleDays.includes(day) ? 'default' : 'outline'}
                          className="cursor-pointer capitalize"
                          onClick={() => {
                            setSftpScheduleDays(prev => 
                              prev.includes(day) 
                                ? prev.filter(d => d !== day)
                                : [...prev, day]
                            );
                          }}
                        >
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Time (Timezone: EST)</Label>
                    <Input 
                      type="time" 
                      value={sftpScheduleTime}
                      onChange={(e) => setSftpScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* File Format & Template */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  File Format
                </h4>
                <div className="flex items-center gap-4">
                  <Select value={sftpFileFormat} onValueChange={setSftpFileFormat}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleDownloadSampleTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample Template
                  </Button>
                </div>
              </div>

              {/* Event & Channel Mapping */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Event & Channel Mapping</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trigger Event</Label>
                    <Select value={sftpEventMapping} onValueChange={setSftpEventMapping}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event to trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Channel Rule</Label>
                    <Select value={sftpChannelRule} onValueChange={setSftpChannelRule}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preferred">Use Preferred Channel</SelectItem>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="sms">SMS Only</SelectItem>
                        <SelectItem value="both">Both Email & SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Email & SMS Templates */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium">Message Templates</h4>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Email Subject</Label>
                    <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                    <Label className="mt-3">Email Body</Label>
                    <Textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="min-h-[100px] font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SMS Message</Label>
                    <Textarea
                      value={smsBody}
                      onChange={(e) => setSmsBody(e.target.value)}
                      className="min-h-[80px] font-mono text-sm"
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">{smsBody.length}/160 characters</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleSftpTest}>
                  Test Connection
                </Button>
                <Button className="btn-coral" onClick={handleSftpSave}>
                  Save SFTP Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Send</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send survey invitations to {selectedContacts.length} recipient(s).
              {respectPreferredChannel ? (
                <span className="block mt-2">
                  Messages will be sent via each contact's preferred channel. 
                  Contacts without a preference will receive {sendEmail && sendSms ? 'both Email and SMS' : sendEmail ? 'Email' : 'SMS'}.
                </span>
              ) : (
                <span className="block mt-2">
                  All selected contacts will receive {sendEmail && sendSms ? 'both Email and SMS' : sendEmail ? 'Email only' : 'SMS only'}.
                </span>
              )}
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
