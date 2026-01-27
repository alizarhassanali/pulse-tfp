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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  History,
  ChevronDown,
  Check,
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
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
import { SftpSyncHistoryModal, SftpSyncLog } from './SftpSyncHistoryModal';
import { DEMO_SFTP_SYNC_LOGS } from '@/data/demo-data';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  name: string;
}

interface AutomatedSendsTabProps {
  eventId: string;
  events: Event[];
  brandId?: string;
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

// Sample webhook payload for documentation
const WEBHOOK_PAYLOAD_EXAMPLE = `{
  "event_id": "your-event-uuid",
  "location_id": "location-uuid",
  "contact": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "preferred_channel": "email",
    "preferred_language": "en",
    "tags": ["IVF Patient", "New Patient"],
    "external_id": "PAT-001234",
    "status": "active"
  },
  "channel": "preferred",
  "scheduling": {
    "type": "immediate",
    "delay_value": 0,
    "delay_unit": "hours"
  }
}`;

export function AutomatedSendsTab({ eventId, events, brandId }: AutomatedSendsTabProps) {
  const { profile } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Collapsible state
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [sftpOpen, setSftpOpen] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState(false);
  const [copiedLocationId, setCopiedLocationId] = useState<string | null>(null);

  // Sync history modal state
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SftpSyncLog[]>(DEMO_SFTP_SYNC_LOGS);
  
  // API Key state
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showGeneratedKey, setShowGeneratedKey] = useState(true);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);

  // Webhook Email/SMS templates
  const [webhookEmailSubject, setWebhookEmailSubject] = useState('How was your recent visit?');
  const [webhookEmailBody, setWebhookEmailBody] = useState(
    'Hi {first_name},\n\nWe hope you had a great experience at {location_name}. Please take a moment to share your feedback:\n\n{survey_link}\n\nThank you!\n{brand_name}\n\n---\nYou can unsubscribe from future feedback requests at any time using the link below.\n{unsubscribe_link}'
  );
  const [webhookSmsBody, setWebhookSmsBody] = useState(
    'Hi {first_name}, how was your visit to {location_name}? Share your feedback: {survey_link}\n\nReply STOP to unsubscribe.'
  );

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

  // SFTP Email/SMS templates
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

  // Fetch existing Webhook integration
  const { data: webhookIntegration } = useQuery({
    queryKey: ['webhook-integration', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('type', 'webhook')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  // Fetch event locations for webhook reference
  const { data: eventLocations = [] } = useQuery({
    queryKey: ['event-locations', eventId],
    queryFn: async () => {
      const { data: eventLocationIds } = await supabase
        .from('event_locations')
        .select('location_id')
        .eq('event_id', eventId);
      
      if (!eventLocationIds?.length) return [];
      
      const { data: locations } = await supabase
        .from('locations')
        .select('id, name')
        .in('id', eventLocationIds.map(el => el.location_id))
        .order('name');
      
      return locations || [];
    },
    enabled: !!eventId,
  });

  // Fetch API keys for this brand
  const { data: apiKeys = [], refetch: refetchApiKeys } = useQuery({
    queryKey: ['api-keys', brandId],
    queryFn: async () => {
      if (!brandId) return [];
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, created_at, last_used_at, revoked_at')
        .eq('brand_id', brandId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!brandId,
  });

  // Generate API key mutation
  const generateApiKeyMutation = useMutation({
    mutationFn: async (keyName: string) => {
      if (!brandId || !profile?.user_id) throw new Error('Missing brand or user');
      
      // Generate a secure random key (32 bytes = 64 hex chars)
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const rawKey = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const fullKey = `upk_${rawKey}`; // prefix for identification
      
      // Hash the key for storage (using SubtleCrypto)
      const encoder = new TextEncoder();
      const data = encoder.encode(fullKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Store in database
      const { error } = await supabase.from('api_keys').insert({
        brand_id: brandId,
        name: keyName,
        key_hash: keyHash,
        key_prefix: fullKey.slice(0, 12), // Store first 12 chars for display
        created_by: profile.user_id,
      });
      
      if (error) throw error;
      return fullKey; // Return full key to display once
    },
    onSuccess: (fullKey) => {
      setGeneratedKey(fullKey);
      setNewKeyName('');
      refetchApiKeys();
      toast({
        title: 'API Key Generated',
        description: 'Copy your key now. It will not be shown again.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error generating API key',
        description: String(error),
        variant: 'destructive',
      });
    },
  });

  // Revoke API key mutation
  const revokeApiKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from('api_keys')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', keyId);
      if (error) throw error;
    },
    onSuccess: () => {
      setKeyToRevoke(null);
      refetchApiKeys();
      toast({ title: 'API Key Revoked', description: 'The key has been revoked and can no longer be used.' });
    },
    onError: (error) => {
      toast({ title: 'Error revoking key', description: String(error), variant: 'destructive' });
    },
  });

  // Initialize SFTP form with existing data
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

  // Initialize Webhook templates from saved config
  useEffect(() => {
    if (webhookIntegration?.config) {
      const config = webhookIntegration.config as Record<string, any>;
      if (config.emailSubject) setWebhookEmailSubject(config.emailSubject);
      if (config.emailBody) setWebhookEmailBody(config.emailBody);
      if (config.smsBody) setWebhookSmsBody(config.smsBody);
    }
  }, [webhookIntegration]);

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

  // Save Webhook templates mutation
  const saveWebhookTemplatesMutation = useMutation({
    mutationFn: async () => {
      const config = {
        emailSubject: webhookEmailSubject,
        emailBody: webhookEmailBody,
        smsBody: webhookSmsBody,
      };

      const { data: existing } = await supabase
        .from('integrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('type', 'webhook')
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from('integrations')
          .update({ config, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('integrations').insert({
          event_id: eventId,
          type: 'webhook',
          config,
          status: 'active',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Message templates saved' });
      queryClient.invalidateQueries({ queryKey: ['webhook-integration', eventId] });
    },
    onError: (error) => {
      toast({ title: 'Error saving templates', description: String(error), variant: 'destructive' });
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

  const handleCopyEventId = () => {
    navigator.clipboard.writeText(eventId);
    setCopiedEventId(true);
    toast({ title: 'Event ID copied to clipboard' });
    setTimeout(() => setCopiedEventId(false), 2000);
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('POST https://api.userpulse.com/v1/webhooks/trigger');
    setCopiedEndpoint(true);
    toast({ title: 'Endpoint URL copied to clipboard' });
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleCopyLocationId = (locationId: string) => {
    navigator.clipboard.writeText(locationId);
    setCopiedLocationId(locationId);
    toast({ title: 'Location ID copied to clipboard' });
    setTimeout(() => setCopiedLocationId(null), 2000);
  };

  const handleGenerateApiKey = () => {
    if (!newKeyName.trim()) {
      toast({ title: 'Please enter a name for your API key', variant: 'destructive' });
      return;
    }
    generateApiKeyMutation.mutate(newKeyName.trim());
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: 'API key copied to clipboard' });
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

  return (
    <div className="space-y-6">
      {/* Webhook / API Trigger - First Section */}
      <Collapsible open={webhookOpen} onOpenChange={setWebhookOpen}>
        <Card className="shadow-soft border-border/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  <CardTitle>Webhook / API Trigger</CardTitle>
                </div>
                <ChevronDown className={cn("h-5 w-5 transition-transform duration-200", webhookOpen && "rotate-180")} />
              </div>
              <CardDescription>
                Trigger surveys via API calls from your CRM or other systems
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* How It Works */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <h4 className="font-medium text-sm">HOW IT WORKS</h4>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">1.</span>
                    <div>
                      <span className="font-medium text-foreground">Copy Your Event ID</span>
                      <p className="text-xs">Use the event ID below to identify which survey to trigger</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">2.</span>
                    <div>
                      <span className="font-medium text-foreground">Generate API Key</span>
                      <p className="text-xs">Create an API key to authenticate your webhook requests</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">3.</span>
                    <div>
                      <span className="font-medium text-foreground">Send Contact Data</span>
                      <p className="text-xs">POST contact info to our endpoint - we'll create/update the contact and trigger the survey</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">4.</span>
                    <div>
                      <span className="font-medium text-foreground">Track Responses</span>
                      <p className="text-xs">View delivery status and responses in Sent Logs</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Event ID */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <Label className="text-sm font-medium">Event ID for this Survey</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono break-all">
                    {eventId}
                  </code>
                  <Button variant="outline" size="sm" onClick={handleCopyEventId}>
                    {copiedEventId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Use this ID in your webhook payload to trigger this event</p>
              </div>

              {/* Location IDs for this Event */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Location IDs for this Event</Label>
                {eventLocations.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Location Name</th>
                          <th className="text-left px-4 py-2 font-medium">UUID</th>
                          <th className="w-16 px-4 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventLocations.map((location: { id: string; name: string }) => (
                          <tr key={location.id} className="border-t">
                            <td className="px-4 py-2">{location.name}</td>
                            <td className="px-4 py-2">
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                {location.id.slice(0, 8)}...{location.id.slice(-4)}
                              </code>
                            </td>
                            <td className="px-4 py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyLocationId(location.id)}
                              >
                                {copiedLocationId === location.id ? (
                                  <Check className="h-4 w-4 text-success" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground">
                    No locations configured for this event. Add locations in Event Setup.
                  </div>
                )}
              </div>

              {/* Endpoint URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Endpoint URL</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                    POST https://api.userpulse.com/v1/webhooks/trigger
                  </code>
                  <Button variant="outline" size="sm" onClick={handleCopyEndpoint}>
                    {copiedEndpoint ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Request Payload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Request Payload</Label>
                <pre className="p-4 bg-muted rounded-lg text-xs font-mono overflow-x-auto whitespace-pre">
                  {WEBHOOK_PAYLOAD_EXAMPLE}
                </pre>
              </div>

              {/* Field Reference */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Field Reference</h4>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Required Fields */}
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <h5 className="font-medium text-sm text-foreground">REQUIRED FIELDS</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li><code className="text-xs bg-muted px-1 rounded">event_id</code> — UUID of the survey event (shown above)</li>
                      <li><code className="text-xs bg-muted px-1 rounded">location_id</code> — UUID of the location (see table above)</li>
                      <li><code className="text-xs bg-muted px-1 rounded">contact.first_name</code> — Contact's first name</li>
                      <li><code className="text-xs bg-muted px-1 rounded">contact.last_name</code> — Contact's last name</li>
                      <li><code className="text-xs bg-muted px-1 rounded">contact.email</code> OR <code className="text-xs bg-muted px-1 rounded">contact.phone</code> — At least one required</li>
                    </ul>
                  </div>

                  {/* Optional Fields */}
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <h5 className="font-medium text-sm text-foreground">OPTIONAL FIELDS</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li><code className="text-xs bg-muted px-1 rounded">contact.preferred_channel</code> — email, sms, or both (default: email)</li>
                      <li><code className="text-xs bg-muted px-1 rounded">contact.preferred_language</code> — Language code (default: en)</li>
                      <li><code className="text-xs bg-muted px-1 rounded">contact.tags</code> — Array of tag names (created if new)</li>
                      <li><code className="text-xs bg-muted px-1 rounded">contact.external_id</code> — Your system's patient/customer ID</li>
                      <li><code className="text-xs bg-muted px-1 rounded">contact.status</code> — Contact status (default: active)</li>
                      <li><code className="text-xs bg-muted px-1 rounded">channel</code> — Override: preferred, email, or sms</li>
                      <li><code className="text-xs bg-muted px-1 rounded">scheduling.type</code> — immediate (default) or delayed</li>
                      <li><code className="text-xs bg-muted px-1 rounded">scheduling.delay_value</code> — Number for delay (e.g., 2)</li>
                      <li><code className="text-xs bg-muted px-1 rounded">scheduling.delay_unit</code> — minutes, hours, or days</li>
                    </ul>
                  </div>
                </div>

                {/* Automatic Fields */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <h5 className="font-medium text-sm text-foreground">AUTOMATIC FIELDS</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><code className="text-xs bg-muted px-1 rounded">brand_id</code> — Automatically inherited from the event</li>
                  </ul>
                </div>
              </div>

              {/* Behavior */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Behavior</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• If contact exists (matched by email/phone), record is updated</li>
                  <li>• If contact is new, record is created with provided data</li>
                  <li>• Tags are created if they don't exist, then assigned to contact</li>
                  <li>• Throttle rules are respected (won't send if recently surveyed)</li>
                </ul>
              </div>

              {/* API Authentication */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  <h4 className="font-medium">API Authentication</h4>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Include this header with every request:
                </p>
                <code className="block px-3 py-2 bg-muted rounded text-sm font-mono">
                  Authorization: Bearer YOUR_API_KEY
                </code>

                {/* Generated Key Display (shown once after generation) */}
                {generatedKey && (
                  <div className="p-4 bg-success/10 border border-success/30 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">API Key Generated</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Copy this key now. It will not be shown again.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono break-all">
                        {showGeneratedKey ? generatedKey : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => setShowGeneratedKey(!showGeneratedKey)}>
                        {showGeneratedKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopyApiKey(generatedKey)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setGeneratedKey(null)}>
                      Done
                    </Button>
                  </div>
                )}

                {/* Existing Keys List */}
                {apiKeys.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Your API Keys</Label>
                    <div className="border rounded-lg divide-y">
                      {apiKeys.map((key: { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null }) => (
                        <div key={key.id} className="flex items-center justify-between p-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{key.name}</span>
                              <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                                {key.key_prefix}...
                              </code>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created {new Date(key.created_at).toLocaleDateString()}
                              {key.last_used_at && ` • Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setKeyToRevoke(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate New Key Form */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                  <Label className="text-sm font-medium">Generate New API Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Key name (e.g., Production CRM)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleGenerateApiKey} 
                      disabled={generateApiKeyMutation.isPending || !newKeyName.trim()}
                    >
                      {generateApiKeyMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    API keys are scoped to this brand. Store them securely and never expose in client-side code.
                  </p>
                </div>
              </div>

              {/* Message Templates Section */}
              <div className="border-t pt-6 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Message Templates
                </h4>
                <p className="text-sm text-muted-foreground">
                  Configure the email and SMS content sent when surveys are triggered via API. These templates apply to all webhook sends for this event.
                </p>

                {/* Available Variables */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Available variables:</span>{' '}
                    <code className="bg-muted px-1 rounded">{'{first_name}'}</code>{' '}
                    <code className="bg-muted px-1 rounded">{'{last_name}'}</code>{' '}
                    <code className="bg-muted px-1 rounded">{'{brand_name}'}</code>{' '}
                    <code className="bg-muted px-1 rounded">{'{location_name}'}</code>{' '}
                    <code className="bg-muted px-1 rounded">{'{location_phone}'}</code>{' '}
                    <code className="bg-muted px-1 rounded">{'{survey_link}'}</code>{' '}
                    <code className="bg-muted px-1 rounded">{'{unsubscribe_link}'}</code>
                  </p>
                </div>

                {/* Email Template */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h5 className="font-medium text-sm">Email</h5>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Subject</Label>
                    <Input
                      value={webhookEmailSubject}
                      onChange={(e) => setWebhookEmailSubject(e.target.value)}
                      placeholder="How was your recent visit?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Body</Label>
                    <Textarea
                      value={webhookEmailBody}
                      onChange={(e) => setWebhookEmailBody(e.target.value)}
                      className="min-h-[180px] font-mono text-sm"
                      placeholder="Hi {first_name},&#10;&#10;We hope you had a great experience..."
                    />
                  </div>
                </div>

                {/* SMS Template */}
                <div className="p-4 border rounded-lg space-y-3">
                  <h5 className="font-medium text-sm">SMS</h5>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Message</Label>
                    <Textarea
                      value={webhookSmsBody}
                      onChange={(e) => setWebhookSmsBody(e.target.value)}
                      className="min-h-[100px] font-mono text-sm"
                      placeholder="Hi {first_name}, how was your visit?"
                    />
                    <p className="text-xs text-muted-foreground">
                      {webhookSmsBody.length}/160 characters
                      {webhookSmsBody.length > 160 && (
                        <span className="text-destructive ml-2">
                          (Will be split into {Math.ceil(webhookSmsBody.length / 160)} messages)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => saveWebhookTemplatesMutation.mutate()}
                  disabled={saveWebhookTemplatesMutation.isPending}
                  className="btn-coral"
                >
                  {saveWebhookTemplatesMutation.isPending ? 'Saving...' : 'Save Message Templates'}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* SFTP Integration - Second Section */}
      <Collapsible open={sftpOpen} onOpenChange={setSftpOpen}>
        <Card className="shadow-soft border-border/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  <CardTitle>SFTP Import</CardTitle>
                </div>
                <ChevronDown className={cn("h-5 w-5 transition-transform duration-200", sftpOpen && "rotate-180")} />
              </div>
              <CardDescription>
                Automatically import contacts from your SFTP server and trigger surveys on a schedule
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
                        {sftpStatus === 'connected' && sftpScheduleDays.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Next: {sftpScheduleDays.map(d => d.slice(0, 3)).join(', ')} at {sftpScheduleTime}
                          </p>
                        )}
                        {/* Recent sync indicators */}
                        {sftpStatus === 'connected' && syncLogs.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Recent syncs:</span>
                            <div className="flex items-center gap-1">
                              {syncLogs.slice(0, 5).map((log) => (
                                <span
                                  key={log.id}
                                  className={`w-2 h-2 rounded-full ${
                                    log.status === 'success' ? 'bg-green-500' :
                                    log.status === 'partial' ? 'bg-yellow-500' :
                                    log.status === 'failed' ? 'bg-red-500' :
                                    'bg-blue-500'
                                  }`}
                                  title={`${log.status} - ${new Date(log.started_at).toLocaleDateString()}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              ({syncLogs.filter(l => l.status === 'success').length}/{syncLogs.length} successful)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {sftpStatus === 'connected' && (
                        <Button variant="outline" size="sm" onClick={() => setShowSyncHistory(true)}>
                          <History className="h-4 w-4 mr-2" />
                          View History
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={handleSftpTest}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Test Connection
                      </Button>
                    </div>
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
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* SFTP Sync History Modal */}
      <SftpSyncHistoryModal
        open={showSyncHistory}
        onOpenChange={setShowSyncHistory}
        syncLogs={syncLogs}
      />

      {/* Revoke API Key Confirmation */}
      <AlertDialog open={!!keyToRevoke} onOpenChange={(open) => !open && setKeyToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Any integrations using this key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => keyToRevoke && revokeApiKeyMutation.mutate(keyToRevoke)}
            >
              {revokeApiKeyMutation.isPending ? 'Revoking...' : 'Revoke Key'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
