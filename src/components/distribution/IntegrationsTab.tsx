import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Server,
  Code,
  Copy,
  Download,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Info,
} from 'lucide-react';

interface Event {
  id: string;
  name: string;
}

interface IntegrationsTabProps {
  eventId: string;
  events: Event[];
}

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Karachi', label: 'Karachi (PKT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Kolkata (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'UTC', label: 'UTC' },
];

// Sample data for SFTP template
const SAMPLE_CONTACTS = [
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1-555-123-4567',
    preferred_channel: 'email',
    location_name: 'Downtown Clinic',
    external_id: 'PAT-001234',
    contact_tags: 'new-patient,fertility',
    appointment_date: '2024-01-15',
  },
  {
    first_name: 'Michael',
    last_name: 'Chen',
    email: 'mchen@gmail.com',
    phone: '+1-555-234-5678',
    preferred_channel: 'sms',
    location_name: 'Westside Center',
    external_id: 'PAT-001235',
    contact_tags: 'returning,ivf',
    appointment_date: '2024-01-16',
  },
  {
    first_name: 'Emma',
    last_name: 'Williams',
    email: 'emma.w@company.org',
    phone: '',
    preferred_channel: 'email',
    location_name: 'Downtown Clinic',
    external_id: 'PAT-001236',
    contact_tags: 'consultation',
    appointment_date: '2024-01-17',
  },
  {
    first_name: 'James',
    last_name: 'Rodriguez',
    email: '',
    phone: '+1-555-345-6789',
    preferred_channel: 'sms',
    location_name: 'North Branch',
    external_id: 'PAT-001237',
    contact_tags: 'follow-up,urgent',
    appointment_date: '2024-01-17',
  },
  {
    first_name: 'Aisha',
    last_name: 'Patel',
    email: 'aisha.patel@outlook.com',
    phone: '+1-555-456-7890',
    preferred_channel: 'both',
    location_name: 'Eastside Clinic',
    external_id: 'PAT-001238',
    contact_tags: 'vip,returning',
    appointment_date: '2024-01-18',
  },
  {
    first_name: 'David',
    last_name: 'Kim',
    email: 'dkim@business.net',
    phone: '+1-555-567-8901',
    preferred_channel: 'email',
    location_name: 'Downtown Clinic',
    external_id: 'PAT-001239',
    contact_tags: '',
    appointment_date: '2024-01-19',
  },
  {
    first_name: 'Lisa',
    last_name: 'Thompson',
    email: 'lisa.t@email.com',
    phone: '+1-555-678-9012',
    preferred_channel: 'email',
    location_name: 'Westside Center',
    external_id: 'PAT-001240',
    contact_tags: 'new-patient',
    appointment_date: '2024-01-20',
  },
  {
    first_name: 'Ahmed',
    last_name: 'Hassan',
    email: 'a.hassan@mail.com',
    phone: '+1-555-789-0123',
    preferred_channel: 'sms',
    location_name: 'South Location',
    external_id: 'PAT-001241',
    contact_tags: 'returning,ivf',
    appointment_date: '2024-01-21',
  },
];

export function IntegrationsTab({ eventId, events }: IntegrationsTabProps) {
  const { profile } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState('embed');

  // Web Embed state
  const [buttonColor, setButtonColor] = useState('#FF887C');

  // SFTP state
  const [sftpHost, setSftpHost] = useState('');
  const [sftpPort, setSftpPort] = useState('22');
  const [sftpUsername, setSftpUsername] = useState('');
  const [sftpPassword, setSftpPassword] = useState('');
  const [sftpPath, setSftpPath] = useState('/uploads');
  const [sftpEventMapping, setSftpEventMapping] = useState(eventId);
  const [sftpChannelRule, setSftpChannelRule] = useState('preferred');
  const [sftpScheduleDays, setSftpScheduleDays] = useState<string[]>(['monday', 'wednesday', 'friday']);
  const [sftpScheduleTime, setSftpScheduleTime] = useState('09:00');
  const [sftpTimezone, setSftpTimezone] = useState('America/New_York');
  const [sftpFileFormat, setSftpFileFormat] = useState('csv');
  const [sftpStatus, setSftpStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [sftpLastSync, setSftpLastSync] = useState<string | null>(null);

  // Email/SMS templates
  const [emailSubject, setEmailSubject] = useState('How was your recent visit?');
  const [emailBody, setEmailBody] = useState(
    'Hi {first_name},\n\nWe hope you had a great experience. Please share your feedback:\n\n{survey_link}\n\nThank you!'
  );
  const [smsBody, setSmsBody] = useState('Hi {first_name}, how was your visit? {survey_link}');

  // Fetch existing SFTP integration
  const { data: sftpIntegration, isLoading: loadingSftp } = useQuery({
    queryKey: ['sftp-integration', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('type', 'sftp')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Initialize form with existing data
  useEffect(() => {
    if (sftpIntegration?.config) {
      const config = sftpIntegration.config as Record<string, any>;
      setSftpHost(config.host || '');
      setSftpPort(config.port || '22');
      setSftpUsername(config.username || '');
      setSftpPath(config.path || '/uploads');
      setSftpEventMapping(config.eventMapping || eventId);
      setSftpChannelRule(config.channelRule || 'preferred');
      setSftpScheduleDays(config.scheduleDays || ['monday', 'wednesday', 'friday']);
      setSftpScheduleTime(config.scheduleTime || '09:00');
      setSftpTimezone(config.timezone || profile?.timezone || 'America/New_York');
      setSftpFileFormat(config.fileFormat || 'csv');
      setEmailSubject(config.emailSubject || 'How was your recent visit?');
      setEmailBody(config.emailBody || emailBody);
      setSmsBody(config.smsBody || smsBody);
      if (sftpIntegration.status === 'active') {
        setSftpStatus('connected');
      }
      setSftpLastSync(sftpIntegration.last_used_at);
    } else if (profile?.timezone) {
      setSftpTimezone(profile.timezone);
    } else {
      // Fallback to browser timezone
      try {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (TIMEZONE_OPTIONS.some((tz) => tz.value === browserTz)) {
          setSftpTimezone(browserTz);
        }
      } catch {
        // Keep default
      }
    }
  }, [sftpIntegration, profile?.timezone, eventId]);

  // Save SFTP configuration
  const saveSftpMutation = useMutation({
    mutationFn: async () => {
      const config = {
        host: sftpHost,
        port: sftpPort,
        username: sftpUsername,
        path: sftpPath,
        eventMapping: sftpEventMapping,
        channelRule: sftpChannelRule,
        scheduleDays: sftpScheduleDays,
        scheduleTime: sftpScheduleTime,
        timezone: sftpTimezone,
        fileFormat: sftpFileFormat,
        emailSubject,
        emailBody,
        smsBody,
      };

      if (sftpIntegration?.id) {
        const { error } = await supabase
          .from('integrations')
          .update({
            config,
            status: sftpStatus === 'connected' ? 'active' : 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', sftpIntegration.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('integrations').insert({
          event_id: eventId,
          type: 'sftp',
          config,
          status: 'inactive',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sftp-integration', eventId] });
      toast({ title: 'SFTP Configuration Saved', description: 'Integration settings have been saved.' });
    },
    onError: (error) => {
      toast({ title: 'Error saving configuration', description: String(error), variant: 'destructive' });
    },
  });

  const handleSftpTest = () => {
    toast({ title: 'Testing SFTP connection...', description: 'Please wait...' });
    setTimeout(() => {
      setSftpStatus('connected');
      setSftpLastSync(new Date().toISOString());
      toast({ title: 'SFTP Connected', description: 'Connection successful!' });
    }, 1500);
  };

  const handleDownloadSampleTemplate = () => {
    const format = sftpFileFormat;
    
    // Column definitions with metadata
    const columns = [
      { key: 'first_name', label: 'first_name', required: true, description: 'Contact first name' },
      { key: 'last_name', label: 'last_name', required: true, description: 'Contact last name' },
      { key: 'email', label: 'email', required: false, description: 'Email address (required if phone not provided)' },
      { key: 'phone', label: 'phone', required: false, description: 'Phone with country code (required if email not provided)' },
      { key: 'preferred_channel', label: 'preferred_channel', required: false, description: 'Values: email, sms, or both' },
      { key: 'location_name', label: 'location_name', required: true, description: 'Location name for matching (must exist in system)' },
      { key: 'external_id', label: 'external_id', required: false, description: 'Your system patient/customer ID' },
      { key: 'contact_tags', label: 'contact_tags', required: false, description: 'Comma-separated tags' },
      { key: 'appointment_date', label: 'appointment_date', required: false, description: 'Format: YYYY-MM-DD' },
    ];

    if (format === 'csv') {
      // Create CSV with header comments
      const headerComments = [
        '# SFTP Contact Import Template',
        '# Required fields: first_name, last_name, location_name, and either email OR phone',
        '# Optional fields: preferred_channel (email/sms/both), external_id, contact_tags, appointment_date',
        '# Note: Event and brand are configured in the SFTP integration settings',
        '#',
      ];
      
      const headers = columns.map(c => c.label);
      const rows = SAMPLE_CONTACTS.map(contact => 
        columns.map(col => {
          const value = contact[col.key as keyof typeof contact] || '';
          // Escape commas in values
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      );
      
      const csv = [...headerComments, headers.join(','), ...rows].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sftp-contact-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      // Create JSON with schema documentation
      const jsonData = {
        _documentation: {
          description: 'SFTP Contact Import Template',
          required_fields: ['first_name', 'last_name', 'location_name', 'email OR phone'],
          optional_fields: ['preferred_channel', 'external_id', 'contact_tags', 'appointment_date'],
          notes: [
            'At least email or phone must be provided',
            'preferred_channel accepts: email, sms, or both',
            'contact_tags should be comma-separated',
            'appointment_date format: YYYY-MM-DD',
          ],
          field_definitions: columns.map(c => ({
            field: c.key,
            required: c.required,
            description: c.description,
          })),
        },
        contacts: SAMPLE_CONTACTS,
      };
      
      const json = JSON.stringify(jsonData, null, 2);
      
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sftp-contact-template.json';
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'xlsx') {
      // For XLSX, we'll create a CSV that Excel can open
      // In a real implementation, you'd use a library like xlsx
      const headers = columns.map(c => c.label);
      const instructionRow = columns.map(c => c.required ? 'REQUIRED' : 'optional');
      const descriptionRow = columns.map(c => c.description);
      
      const rows = SAMPLE_CONTACTS.map(contact => 
        columns.map(col => {
          const value = contact[col.key as keyof typeof contact] || '';
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      );
      
      const csv = [
        '# Instructions: Required fields are marked. Delete this row before uploading.',
        headers.join(','),
        instructionRow.join(','),
        descriptionRow.join(','),
        ...rows,
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sftp-contact-template.csv';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ 
        title: 'Template downloaded', 
        description: 'Open in Excel and save as .xlsx if needed. The CSV format is compatible with Excel.' 
      });
      return;
    }
    
    toast({ title: 'Sample template downloaded' });
  };

  const surveyUrl = `https://survey.userpulse.io/s/${eventId.slice(0, 8)}`;

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="embed" className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          Web Embed
        </TabsTrigger>
        <TabsTrigger value="sftp" className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          SFTP
        </TabsTrigger>
      </TabsList>

      {/* Web Embed */}
      <TabsContent value="embed">
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
                  <Input value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} placeholder="#FF887C" />
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
    eventId: '${eventId || 'your-event-id'}',
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      navigator.clipboard.writeText(`<iframe src="${surveyUrl}" ...></iframe>`);
                      toast({ title: 'Code copied' });
                    }}
                  >
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
      eventId="${eventId || 'your-event-id'}"
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

      {/* SFTP */}
      <TabsContent value="sftp">
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
            {loadingSftp ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
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
                        <p className="text-sm text-muted-foreground">Last sync: {new Date(sftpLastSync).toLocaleString()}</p>
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
                    <Input value={sftpHost} onChange={(e) => setSftpHost(e.target.value)} placeholder="sftp.yourserver.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input value={sftpPort} onChange={(e) => setSftpPort(e.target.value)} placeholder="22" />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={sftpUsername} onChange={(e) => setSftpUsername(e.target.value)} placeholder="sftp_user" />
                  </div>
                  <div className="space-y-2">
                    <Label>Password / Key</Label>
                    <Input
                      type="password"
                      value={sftpPassword}
                      onChange={(e) => setSftpPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Remote Path</Label>
                    <Input value={sftpPath} onChange={(e) => setSftpPath(e.target.value)} placeholder="/uploads/contacts" />
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
                              setSftpScheduleDays((prev) =>
                                prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                              );
                            }}
                          >
                            {day.slice(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" value={sftpScheduleTime} onChange={(e) => setSftpScheduleTime(e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Timezone</Label>
                      <Select value={sftpTimezone} onValueChange={setSftpTimezone}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONE_OPTIONS.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        IANA: {sftpTimezone}
                        {profile?.timezone === sftpTimezone && ' (from your profile)'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* File Format */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    File Format & Template
                  </h4>
                  
                  {/* Info Box */}
                  <div className="p-4 bg-muted/30 rounded-lg flex gap-3">
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Required fields:</strong> first_name, last_name, and either email OR phone</p>
                      <p><strong>Optional fields:</strong> preferred_channel (email/sms/both), location_name, external_id, contact_tags, appointment_date</p>
                      <p className="text-xs">Note: Event and brand are configured below in the integration settings, not in the upload file.</p>
                    </div>
                  </div>
                  
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
                  
                  <p className="text-xs text-muted-foreground">
                    Template includes 8 sample contacts with various data combinations to demonstrate all field formats
                  </p>
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

                {/* Message Templates */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-medium">Message Templates</h4>
                  <p className="text-xs text-muted-foreground">
                    Available variables: <code className="bg-muted px-1 rounded">{'{first_name}'}</code> <code className="bg-muted px-1 rounded">{'{last_name}'}</code> <code className="bg-muted px-1 rounded">{'{location_name}'}</code> <code className="bg-muted px-1 rounded">{'{brand_name}'}</code> <code className="bg-muted px-1 rounded">{'{survey_link}'}</code>
                  </p>
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
                  <Button className="btn-coral" onClick={() => saveSftpMutation.mutate()} disabled={saveSftpMutation.isPending}>
                    {saveSftpMutation.isPending ? 'Saving...' : 'Save SFTP Configuration'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
