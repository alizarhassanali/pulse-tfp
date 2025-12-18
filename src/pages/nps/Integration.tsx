import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Settings2,
  Database,
  Code,
  Copy,
  Download,
  Plus,
  Edit,
  Trash2,
  Plug,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const integrationTypes = [
  {
    id: 'link',
    name: 'Direct Link',
    icon: Link,
    description: 'Generate a unique URL and QR code for your survey',
  },
  {
    id: 'qr_code',
    name: 'QR Code',
    icon: QrCode,
    description: 'Customizable QR code for print materials',
  },
  {
    id: 'email',
    name: 'Email',
    icon: Mail,
    description: 'Send surveys via email with customizable templates',
  },
  {
    id: 'sms',
    name: 'SMS',
    icon: MessageSquare,
    description: 'Send surveys via text message',
  },
  {
    id: 'email_sms_preference',
    name: 'Email/SMS Preference',
    icon: Settings2,
    description: 'Send based on contact preference',
  },
  {
    id: 'sftp',
    name: 'SFTP',
    icon: Database,
    description: 'Push or pull data via SFTP',
  },
  {
    id: 'web_embed',
    name: 'Web Embed',
    icon: Code,
    description: 'Embed survey on your website',
  },
];

export default function Integration() {
  const { toast } = useToast();
  const location = useLocation();
  const eventIdFromState = location.state?.eventId;
  const [selectedEvent, setSelectedEvent] = useState<string>(eventIdFromState || '');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ['events-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations', selectedEvent],
    queryFn: async () => {
      if (!selectedEvent) return [];
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('event_id', selectedEvent)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEvent,
  });

  const handleCopyLink = () => {
    const link = `https://survey.userpulse.io/s/${selectedEvent}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copied to clipboard' });
  };

  const renderIntegrationSetup = () => {
    if (!selectedType) return null;

    switch (selectedType) {
      case 'link':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Survey URL</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`https://survey.userpulse.io/s/${selectedEvent}`}
                  className="font-mono text-sm"
                />
                <Button variant="outline" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border rounded-lg p-8 flex items-center justify-center bg-white">
              <div className="h-48 w-48 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="h-24 w-24 text-muted-foreground" />
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
          </div>
        );

      case 'qr_code':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>QR Code Size</Label>
                <Select defaultValue="256">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">128px</SelectItem>
                    <SelectItem value="256">256px</SelectItem>
                    <SelectItem value="512">512px</SelectItem>
                    <SelectItem value="1024">1024px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Border Text</Label>
                <Input placeholder="Scan to rate your visit" />
              </div>
            </div>
            <div className="border rounded-lg p-8 flex items-center justify-center bg-white">
              <div className="h-64 w-64 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="h-32 w-32 text-muted-foreground" />
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
          </div>
        );

      case 'email':
        return (
          <div className="space-y-4">
            <Tabs defaultValue="recipients">
              <TabsList>
                <TabsTrigger value="recipients">1. Recipients</TabsTrigger>
                <TabsTrigger value="customize">2. Customize</TabsTrigger>
                <TabsTrigger value="schedule">3. Schedule</TabsTrigger>
              </TabsList>
              <TabsContent value="recipients" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Select Recipients</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose contact list or segment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contacts</SelectItem>
                      <SelectItem value="recent">Recent Patients (Last 7 days)</SelectItem>
                      <SelectItem value="custom">Custom Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Or Import CSV</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      Drop a CSV file here or click to upload
                    </p>
                    <Button variant="outline" className="mt-4">
                      Choose File
                    </Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="customize" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Email Template</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default NPS Template</SelectItem>
                      <SelectItem value="follow-up">Follow-up Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input defaultValue="How was your recent visit?" />
                </div>
                <div className="space-y-2">
                  <Label>Preview Text</Label>
                  <Input defaultValue="We'd love to hear your feedback" />
                </div>
              </TabsContent>
              <TabsContent value="schedule" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Send Time</Label>
                  <Select defaultValue="now">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Send Immediately</SelectItem>
                      <SelectItem value="schedule">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 'sms':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Message Template</Label>
              <Textarea
                defaultValue="Hi {first_name}, how was your visit? Rate us: {survey_link}"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                160 characters max. Variables: {'{first_name}'}, {'{last_name}'}, {'{survey_link}'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Recipients</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose contact list" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts with Phone</SelectItem>
                  <SelectItem value="recent">Recent Patients</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'web_embed':
        return (
          <div className="space-y-4">
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
    eventId: '${selectedEvent}',
    trigger: 'exit-intent'
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
  src="https://survey.userpulse.io/embed/${selectedEvent}"
  width="100%"
  height="400"
  frameborder="0"
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
      eventId="${selectedEvent}"
      trigger="exit-intent"
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
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Configuration for this integration type coming soon.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Integration"
        description="Connect and distribute your surveys through various channels"
      />

      {/* Event Selection */}
      <div className="flex items-center gap-4">
        <Label>Select Event:</Label>
        <Select value={selectedEvent} onValueChange={setSelectedEvent}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Choose an event" />
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

      {selectedEvent ? (
        <>
          {/* Integration Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {integrationTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedType === type.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedType(type.id);
                    setModalOpen(true);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{type.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{type.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Active Integrations Table */}
          <Card className="shadow-soft border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Active Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              {integrations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Configuration</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Sends</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {integrations.map((integration) => (
                      <TableRow key={integration.id}>
                        <TableCell className="font-medium capitalize">
                          {integration.type.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {JSON.stringify(integration.config).slice(0, 50)}...
                        </TableCell>
                        <TableCell className="text-sm">
                          {integration.last_used_at || 'Never'}
                        </TableCell>
                        <TableCell>{integration.sends_count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active integrations. Click on an integration type above to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          icon={<Plug className="h-8 w-8" />}
          title="Select an event"
          description="Choose an active event above to configure integrations."
        />
      )}

      {/* Integration Setup Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedType && (
                <>
                  {(() => {
                    const Icon = integrationTypes.find((t) => t.id === selectedType)?.icon || Link;
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                  {integrationTypes.find((t) => t.id === selectedType)?.name} Setup
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Configure your integration settings below
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">{renderIntegrationSetup()}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="btn-coral"
              onClick={() => {
                toast({ title: 'Integration saved!' });
                setModalOpen(false);
              }}
            >
              Save Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
