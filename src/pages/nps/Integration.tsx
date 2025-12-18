import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  Calendar,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

// Demo contacts
const demoContacts = [
  { id: '1', first_name: 'Jane', last_name: 'Doe', email: 'jane@clinic.com', phone: '+15555551234', preferred_channel: 'email' },
  { id: '2', first_name: 'John', last_name: 'Smith', email: 'john@clinic.com', phone: '+15555551235', preferred_channel: 'sms' },
  { id: '3', first_name: 'Emma', last_name: 'Johnson', email: 'emma@clinic.com', phone: '+15555551236', preferred_channel: 'email' },
  { id: '4', first_name: 'Michael', last_name: 'Brown', email: 'michael@clinic.com', phone: '+15555551237', preferred_channel: 'both' },
];

export default function Integration() {
  const { toast } = useToast();
  const location = useLocation();
  const eventIdFromState = location.state?.eventId;
  const [selectedEvent, setSelectedEvent] = useState<string>(eventIdFromState || '');
  const [activeTab, setActiveTab] = useState('link');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('How was your recent visit?');
  const [emailBody, setEmailBody] = useState('Hi {first_name},\n\nWe hope you had a great experience at our clinic. Please take a moment to share your feedback:\n\n{survey_link}\n\nThank you!');
  const [smsBody, setSmsBody] = useState('Hi {first_name}, how was your visit? Share your feedback: {survey_link}');
  const [sendSchedule, setSendSchedule] = useState('now');
  const [buttonColor, setButtonColor] = useState('#FF887C');

  const { data: events = [] } = useQuery({
    queryKey: ['events-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['active', 'draft'])
        .order('name');
      if (error) throw error;
      return data;
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
      return data?.length ? data : demoContacts;
    },
  });

  const surveyUrl = selectedEvent
    ? `https://survey.userpulse.io/s/${selectedEvent.slice(0, 8)}`
    : 'https://survey.userpulse.io/s/first-consult-nps';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(surveyUrl);
    toast({ title: 'Link copied to clipboard' });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map((c) => c.id));
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

  const handleSend = () => {
    toast({
      title: `${activeTab === 'email' ? 'Emails' : 'SMS'} queued`,
      description: `${selectedContacts.length} messages will be sent ${sendSchedule === 'now' ? 'immediately' : 'as scheduled'}.`,
    });
    setSelectedContacts([]);
  };

  const emailContacts = contacts.filter((c) => c.email && (c.preferred_channel === 'email' || c.preferred_channel === 'both'));
  const smsContacts = contacts.filter((c) => c.phone && (c.preferred_channel === 'sms' || c.preferred_channel === 'both'));

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
                {events.length === 0 && (
                  <SelectItem value="demo" disabled>
                    No events available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="embed" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Web Embed
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

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Recipients
                </CardTitle>
                <CardDescription>
                  {selectedContacts.length} of {emailContacts.length} contacts selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedContacts.length === emailContacts.length && emailContacts.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailContacts.map((contact) => (
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
                          <TableCell className="text-muted-foreground">{contact.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle>Email Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email Body</Label>
                  <Textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables: {'{first_name}'}, {'{last_name}'}, {'{survey_link}'}
                  </p>
                </div>

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

                {/* SFTP Section */}
                <details className="border-t pt-4 mt-4">
                  <summary className="cursor-pointer text-sm font-medium">Advanced: SFTP Upload</summary>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Schedule</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Time of Day</Label>
                      <Input type="time" defaultValue="09:00" />
                    </div>
                  </div>
                </details>

                <Button
                  className="w-full btn-coral"
                  onClick={handleSend}
                  disabled={selectedContacts.length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedContacts.length} Recipients
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Recipients
                </CardTitle>
                <CardDescription>
                  {selectedContacts.length} of {smsContacts.length} contacts selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedContacts.length === smsContacts.length && smsContacts.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {smsContacts.map((contact) => (
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
                          <TableCell className="text-muted-foreground">{contact.phone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle>SMS Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    value={smsBody}
                    onChange={(e) => setSmsBody(e.target.value)}
                    className="min-h-[100px] font-mono text-sm"
                    maxLength={160}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Variables: {'{first_name}'}, {'{survey_link}'}</span>
                    <span className={smsBody.length > 160 ? 'text-destructive' : ''}>
                      {smsBody.length}/160 characters ({Math.ceil(smsBody.length / 160)} segment{smsBody.length > 160 ? 's' : ''})
                    </span>
                  </div>
                </div>

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

                {/* SFTP Section */}
                <details className="border-t pt-4 mt-4">
                  <summary className="cursor-pointer text-sm font-medium">Advanced: SFTP Upload</summary>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Schedule</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </details>

                <Button
                  className="w-full btn-coral"
                  onClick={handleSend}
                  disabled={selectedContacts.length === 0}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedContacts.length} Recipients
                </Button>
              </CardContent>
            </Card>
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
      </Tabs>
    </div>
  );
}
