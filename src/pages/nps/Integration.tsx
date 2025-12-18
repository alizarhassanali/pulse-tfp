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
  Link,
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
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { DEMO_CONTACTS, DEMO_EVENTS } from '@/data/demo-data';

export default function Integration() {
  const { toast } = useToast();
  const location = useLocation();
  const eventIdFromState = location.state?.eventId;
  const { selectedEvent: globalEvent } = useFilterStore();
  
  // Use global event if available, otherwise use state from navigation
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [activeTab, setActiveTab] = useState('link');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('How was your recent visit?');
  const [emailBody, setEmailBody] = useState('Hi {first_name},\n\nWe hope you had a great experience at our clinic. Please take a moment to share your feedback:\n\n{survey_link}\n\nThank you!');
  const [smsBody, setSmsBody] = useState('Hi {first_name}, how was your visit? Share your feedback: {survey_link}');
  const [sendSchedule, setSendSchedule] = useState('now');
  const [buttonColor, setButtonColor] = useState('#FF887C');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [respectPreferredChannel, setRespectPreferredChannel] = useState(true);
  
  // SFTP State
  const [sftpHost, setSftpHost] = useState('');
  const [sftpPort, setSftpPort] = useState('22');
  const [sftpUsername, setSftpUsername] = useState('');
  const [sftpPath, setSftpPath] = useState('/uploads');
  const [sftpEventMapping, setSftpEventMapping] = useState('');
  const [sftpChannelRule, setSftpChannelRule] = useState('preferred');
  const [sftpLastSync, setSftpLastSync] = useState<string | null>(null);
  const [sftpStatus, setSftpStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

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

  const selectedEventData = events.find(e => e.id === selectedEvent);
  
  const surveyUrl = selectedEvent
    ? `https://survey.userpulse.io/s/${selectedEvent.slice(0, 8)}`
    : '';

  const handleCopyLink = () => {
    if (!surveyUrl) {
      toast({ title: 'Please select an event first', variant: 'destructive' });
      return;
    }
    navigator.clipboard.writeText(surveyUrl);
    toast({ title: 'Link copied to clipboard' });
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
    setConfirmDialogOpen(true);
  };

  const handleSend = () => {
    const channelInfo = respectPreferredChannel 
      ? 'via preferred channels (Email/SMS)' 
      : activeTab === 'messaging' ? 'via Email & SMS' : '';
    
    toast({
      title: 'Messages queued',
      description: `${selectedContacts.length} messages will be sent ${sendSchedule === 'now' ? 'immediately' : 'as scheduled'} ${channelInfo}.`,
    });
    setSelectedContacts([]);
    setConfirmDialogOpen(false);
  };

  const handleSftpTest = () => {
    toast({ title: 'Testing SFTP connection...', description: 'Please wait...' });
    // Simulate SFTP test
    setTimeout(() => {
      setSftpStatus('connected');
      setSftpLastSync(new Date().toISOString());
      toast({ title: 'SFTP Connected', description: 'Connection successful!' });
    }, 1500);
  };

  const handleSftpSave = () => {
    toast({ title: 'SFTP Configuration Saved', description: 'Integration settings have been saved.' });
  };

  // For messaging tab, show all contacts with their preferred channels
  const messagingContacts = useMemo(() => {
    return contacts.filter((c) => c.email || c.phone);
  }, [contacts]);

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

      {/* Channel Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="link" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Link
          </TabsTrigger>
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Code
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

        {/* Link Tab */}
        <TabsContent value="link" className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>Direct Survey Link</CardTitle>
              <CardDescription>Share this unique URL to collect responses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="border rounded-lg p-8 flex items-center justify-center bg-muted/30">
                <div className="h-48 w-48 bg-background rounded-lg border flex items-center justify-center">
                  <QrCode className="h-32 w-32 text-foreground" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download SVG
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* QR Code Tab */}
        <TabsContent value="qr" className="space-y-4">
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle>QR Code Generator</CardTitle>
              <CardDescription>Create customizable QR codes for print materials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Border Text</Label>
                  <Input placeholder="Scan to rate your visit" />
                </div>
              </div>

              <div className="border rounded-lg p-12 flex items-center justify-center bg-muted/30">
                <div className="h-64 w-64 bg-background rounded-lg border-2 flex items-center justify-center">
                  <QrCode className="h-48 w-48 text-foreground" />
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  PNG
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  SVG
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unified Messaging Tab (Email + SMS) */}
        <TabsContent value="messaging" className="space-y-4">
          {/* Channel Settings */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <MessageSquare className="h-5 w-5" />
                Messaging Settings
              </CardTitle>
              <CardDescription>
                Send surveys via Email and SMS based on contact preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Respect Preferred Channel</Label>
                  <p className="text-sm text-muted-foreground">
                    Send via each contact's preferred channel. If not set, send via both Email and SMS.
                  </p>
                </div>
                <Switch 
                  checked={respectPreferredChannel} 
                  onCheckedChange={setRespectPreferredChannel} 
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recipients */}
            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Recipients
                </CardTitle>
                <CardDescription>
                  {selectedContacts.length} of {messagingContacts.length} contacts selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedContacts.length === messagingContacts.length && messagingContacts.length > 0}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean, messagingContacts)}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Channel</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messagingContacts.map((contact) => (
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
                  Contacts without a preference will receive both Email and SMS.
                </span>
              ) : (
                <span className="block mt-2">
                  All selected contacts will receive both Email and SMS.
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
