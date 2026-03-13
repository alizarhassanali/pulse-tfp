import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { SftpSyncLog } from './SftpSyncHistoryModal';
import { DEMO_SFTP_SYNC_LOGS } from '@/data/demo-data';
import { WebhookIntegrationCard } from './WebhookIntegrationCard';
import { SftpIntegrationCard } from './SftpIntegrationCard';
import { OttoOnboardCard } from './OttoOnboardCard';
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

interface Event {
  id: string;
  name: string;
}

interface AutomatedSendsTabProps {
  eventId: string;
  events: Event[];
  brandId?: string;
}

// Sample data for SFTP template
const SAMPLE_CONTACTS = [
  { first_name: 'Sarah', last_name: 'Johnson', email: 'sarah.johnson@example.com', phone: '+1-555-123-4567', preferred_channel: 'email', location_name: 'Downtown Clinic', external_id: 'PAT-001234', contact_tags: 'new-patient,fertility', appointment_date: '2024-01-15' },
  { first_name: 'Michael', last_name: 'Chen', email: 'mchen@gmail.com', phone: '+1-555-234-5678', preferred_channel: 'sms', location_name: 'Westside Center', external_id: 'PAT-001235', contact_tags: 'returning,ivf', appointment_date: '2024-01-16' },
  { first_name: 'Emma', last_name: 'Williams', email: 'emma.w@company.org', phone: '', preferred_channel: 'email', location_name: 'Downtown Clinic', external_id: 'PAT-001236', contact_tags: 'consultation', appointment_date: '2024-01-17' },
  { first_name: 'James', last_name: 'Rodriguez', email: '', phone: '+1-555-345-6789', preferred_channel: 'sms', location_name: 'North Branch', external_id: 'PAT-001237', contact_tags: 'follow-up,urgent', appointment_date: '2024-01-17' },
  { first_name: 'Aisha', last_name: 'Patel', email: 'aisha.patel@outlook.com', phone: '+1-555-456-7890', preferred_channel: 'both', location_name: 'Eastside Clinic', external_id: 'PAT-001238', contact_tags: 'vip,returning', appointment_date: '2024-01-18' },
  { first_name: 'David', last_name: 'Kim', email: 'dkim@business.net', phone: '+1-555-567-8901', preferred_channel: 'email', location_name: 'Downtown Clinic', external_id: 'PAT-001239', contact_tags: '', appointment_date: '2024-01-19' },
  { first_name: 'Lisa', last_name: 'Thompson', email: 'lisa.t@email.com', phone: '+1-555-678-9012', preferred_channel: 'email', location_name: 'Westside Center', external_id: 'PAT-001240', contact_tags: 'new-patient', appointment_date: '2024-01-20' },
  { first_name: 'Ahmed', last_name: 'Hassan', email: 'a.hassan@mail.com', phone: '+1-555-789-0123', preferred_channel: 'sms', location_name: 'South Location', external_id: 'PAT-001241', contact_tags: 'returning,ivf', appointment_date: '2024-01-21' },
];

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

export function AutomatedSendsTab({ eventId, events, brandId }: AutomatedSendsTabProps) {
  const { profile } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Clipboard state
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState(false);
  const [copiedLocationId, setCopiedLocationId] = useState<string | null>(null);

  // Sync history
  const [syncLogs] = useState<SftpSyncLog[]>(DEMO_SFTP_SYNC_LOGS);

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

  // Otto Onboard (CNP) state
  const [cnpEnabled, setCnpEnabled] = useState(false);
  const [cnpSelectedTriggers, setCnpSelectedTriggers] = useState<string[]>([]);
  const [cnpSelectedLocations, setCnpSelectedLocations] = useState<string[]>([]);
  const [cnpEventType, setCnpEventType] = useState('both');
  const [cnpEmailSubject, setCnpEmailSubject] = useState("We'd appreciate your feedback");
  const [cnpEmailBody, setCnpEmailBody] = useState(
    'Hi {first_name},\n\nThank you for visiting {brand_name}.\n\nYour perspective matters to us. If you have a minute, we\'d appreciate you sharing feedback on your recent visit.\n\n{survey_link}\n\n{location_name}\n\nYou can unsubscribe from future feedback requests at any time using the link below.\n{unsubscribe_link}'
  );
  const [cnpSmsBody, setCnpSmsBody] = useState(
    'Hi {first_name}, Thank you for your recent visit to {brand_name}. If you have a moment, we\'d appreciate hearing your thoughts: {survey_link} Reply STOP to unsubscribe.'
  );

  // ─── Queries ───────────────────────────────────────────

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

  // Fetch existing CNP integration
  const { data: cnpIntegration } = useQuery({
    queryKey: ['cnp-integration', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('event_id', eventId)
        .eq('type', 'cnp')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

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

  // ─── Mutations ─────────────────────────────────────────

  const generateApiKeyMutation = useMutation({
    mutationFn: async (keyName: string) => {
      if (!brandId || !profile?.user_id) throw new Error('Missing brand or user');
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const rawKey = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const fullKey = `upk_${rawKey}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(fullKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const { error } = await supabase.from('api_keys').insert({
        brand_id: brandId,
        name: keyName,
        key_hash: keyHash,
        key_prefix: fullKey.slice(0, 12),
        created_by: profile.user_id,
      });
      if (error) throw error;
      return fullKey;
    },
    onSuccess: (fullKey) => {
      setGeneratedKey(fullKey);
      setNewKeyName('');
      refetchApiKeys();
      toast({ title: 'API Key Generated', description: 'Copy your key now. It will not be shown again.' });
    },
    onError: (error) => {
      toast({ title: 'Error generating API key', description: String(error), variant: 'destructive' });
    },
  });

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

  const saveSftpMutation = useMutation({
    mutationFn: async () => {
      const config = {
        host: sftpHost, port: sftpPort, username: sftpUsername, path: sftpPath,
        eventMapping: sftpEventMapping, channelRule: sftpChannelRule,
        scheduleDays: sftpScheduleDays, scheduleTime: sftpScheduleTime,
        timezone: sftpTimezone, fileFormat: sftpFileFormat,
        emailSubject, emailBody, smsBody,
      };
      if (sftpIntegration?.id) {
        const { error } = await supabase
          .from('integrations')
          .update({ config, status: sftpStatus === 'connected' ? 'active' : 'inactive', updated_at: new Date().toISOString() })
          .eq('id', sftpIntegration.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('integrations').insert({
          event_id: eventId, type: 'sftp', config, status: 'inactive',
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

  const saveWebhookTemplatesMutation = useMutation({
    mutationFn: async () => {
      const config = { emailSubject: webhookEmailSubject, emailBody: webhookEmailBody, smsBody: webhookSmsBody };
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
          event_id: eventId, type: 'webhook', config, status: 'active',
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

  // Save CNP configuration mutation
  const saveCnpMutation = useMutation({
    mutationFn: async () => {
      const config = {
        enabled: cnpEnabled,
        selectedTriggers: cnpSelectedTriggers,
        selectedLocations: cnpSelectedLocations,
        eventType: cnpEventType,
        emailSubject: cnpEmailSubject,
        emailBody: cnpEmailBody,
        smsBody: cnpSmsBody,
      };
      if (cnpIntegration?.id) {
        const { error } = await supabase
          .from('integrations')
          .update({ config, status: cnpEnabled ? 'active' : 'inactive', updated_at: new Date().toISOString() })
          .eq('id', cnpIntegration.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('integrations').insert({
          event_id: eventId, type: 'cnp', config, status: cnpEnabled ? 'active' : 'inactive',
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cnp-integration', eventId] });
      toast({ title: 'Otto Onboard Configuration Saved' });
    },
    onError: (error) => {
      toast({ title: 'Error saving configuration', description: String(error), variant: 'destructive' });
    },
  });

  // ─── Effects ───────────────────────────────────────────

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
      if (sftpIntegration.status === 'active') setSftpStatus('connected');
      setSftpLastSync(sftpIntegration.last_used_at);
    } else if (profile?.timezone) {
      setSftpTimezone(profile.timezone);
    } else {
      try {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (TIMEZONE_OPTIONS.some((tz) => tz.value === browserTz)) setSftpTimezone(browserTz);
      } catch { /* keep default */ }
    }
  }, [sftpIntegration, profile?.timezone, eventId]);

  useEffect(() => {
    if (webhookIntegration?.config) {
      const config = webhookIntegration.config as Record<string, any>;
      if (config.emailSubject) setWebhookEmailSubject(config.emailSubject);
      if (config.emailBody) setWebhookEmailBody(config.emailBody);
      if (config.smsBody) setWebhookSmsBody(config.smsBody);
    }
  }, [webhookIntegration]);

  // Initialize CNP form from saved config
  useEffect(() => {
    if (cnpIntegration?.config) {
      const config = cnpIntegration.config as Record<string, any>;
      setCnpEnabled(config.enabled ?? false);
      setCnpSelectedTriggers(config.selectedTriggers || []);
      setCnpSelectedLocations(config.selectedLocations || []);
      setCnpEventType(config.eventType || 'both');
      if (config.emailSubject) setCnpEmailSubject(config.emailSubject);
      if (config.emailBody) setCnpEmailBody(config.emailBody);
      if (config.smsBody) setCnpSmsBody(config.smsBody);
    }
  }, [cnpIntegration]);

  // ─── Handlers ──────────────────────────────────────────

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
    const columns = [
      { key: 'first_name', label: 'first_name', required: true, description: 'Contact first name' },
      { key: 'last_name', label: 'last_name', required: true, description: 'Contact last name' },
      { key: 'email', label: 'email', required: false, description: 'Email address (required if phone not provided)' },
      { key: 'phone', label: 'phone', required: false, description: 'Phone with country code (required if email not provided)' },
      { key: 'preferred_channel', label: 'preferred_channel', required: false, description: 'Values: email, sms, or both' },
      { key: 'location_name', label: 'location_name', required: true, description: 'Location name for matching' },
      { key: 'external_id', label: 'external_id', required: false, description: 'Your system patient/customer ID' },
      { key: 'contact_tags', label: 'contact_tags', required: false, description: 'Comma-separated tags' },
      { key: 'appointment_date', label: 'appointment_date', required: false, description: 'Format: YYYY-MM-DD' },
    ];

    if (format === 'csv' || format === 'xlsx') {
      const headers = columns.map(c => c.label);
      const rows = SAMPLE_CONTACTS.map(contact =>
        columns.map(col => {
          const value = contact[col.key as keyof typeof contact] || '';
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      );
      const csv = (format === 'xlsx'
        ? ['# Instructions: Required fields are marked. Delete this row before uploading.', headers.join(','), columns.map(c => c.required ? 'REQUIRED' : 'optional').join(','), columns.map(c => c.description).join(','), ...rows]
        : ['# SFTP Contact Import Template', '# Required fields: first_name, last_name, location_name, and either email OR phone', '#', headers.join(','), ...rows]
      ).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sftp-contact-template.csv';
      a.click();
      URL.revokeObjectURL(url);
      if (format === 'xlsx') {
        toast({ title: 'Template downloaded', description: 'Open in Excel and save as .xlsx if needed.' });
        return;
      }
    } else if (format === 'json') {
      const jsonData = {
        _documentation: {
          description: 'SFTP Contact Import Template',
          required_fields: ['first_name', 'last_name', 'location_name', 'email OR phone'],
          field_definitions: columns.map(c => ({ field: c.key, required: c.required, description: c.description })),
        },
        contacts: SAMPLE_CONTACTS,
      };
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sftp-contact-template.json';
      a.click();
      URL.revokeObjectURL(url);
    }
    toast({ title: 'Sample template downloaded' });
  };

  // ─── Render ────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <WebhookIntegrationCard
        eventId={eventId}
        eventLocations={eventLocations}
        apiKeys={apiKeys}
        webhookEmailSubject={webhookEmailSubject}
        setWebhookEmailSubject={setWebhookEmailSubject}
        webhookEmailBody={webhookEmailBody}
        setWebhookEmailBody={setWebhookEmailBody}
        webhookSmsBody={webhookSmsBody}
        setWebhookSmsBody={setWebhookSmsBody}
        newKeyName={newKeyName}
        setNewKeyName={setNewKeyName}
        generatedKey={generatedKey}
        setGeneratedKey={setGeneratedKey}
        showGeneratedKey={showGeneratedKey}
        setShowGeneratedKey={setShowGeneratedKey}
        onCopyEventId={handleCopyEventId}
        onCopyEndpoint={handleCopyEndpoint}
        onCopyLocationId={handleCopyLocationId}
        onGenerateApiKey={handleGenerateApiKey}
        onCopyApiKey={handleCopyApiKey}
        onRevokeKey={(keyId) => setKeyToRevoke(keyId)}
        onSaveTemplates={() => saveWebhookTemplatesMutation.mutate()}
        copiedEventId={copiedEventId}
        copiedEndpoint={copiedEndpoint}
        copiedLocationId={copiedLocationId}
        generatePending={generateApiKeyMutation.isPending}
        savePending={saveWebhookTemplatesMutation.isPending}
      />

      <SftpIntegrationCard
        events={events}
        loading={loadingSftp}
        syncLogs={syncLogs}
        profileTimezone={profile?.timezone || undefined}
        sftpHost={sftpHost}
        setSftpHost={setSftpHost}
        sftpPort={sftpPort}
        setSftpPort={setSftpPort}
        sftpUsername={sftpUsername}
        setSftpUsername={setSftpUsername}
        sftpPassword={sftpPassword}
        setSftpPassword={setSftpPassword}
        sftpPath={sftpPath}
        setSftpPath={setSftpPath}
        sftpEventMapping={sftpEventMapping}
        setSftpEventMapping={setSftpEventMapping}
        sftpChannelRule={sftpChannelRule}
        setSftpChannelRule={setSftpChannelRule}
        sftpScheduleDays={sftpScheduleDays}
        setSftpScheduleDays={setSftpScheduleDays}
        sftpScheduleTime={sftpScheduleTime}
        setSftpScheduleTime={setSftpScheduleTime}
        sftpTimezone={sftpTimezone}
        setSftpTimezone={setSftpTimezone}
        sftpFileFormat={sftpFileFormat}
        setSftpFileFormat={setSftpFileFormat}
        sftpStatus={sftpStatus}
        sftpLastSync={sftpLastSync}
        emailSubject={emailSubject}
        setEmailSubject={setEmailSubject}
        emailBody={emailBody}
        setEmailBody={setEmailBody}
        smsBody={smsBody}
        setSmsBody={setSmsBody}
        onTestConnection={handleSftpTest}
        onSave={() => saveSftpMutation.mutate()}
        onDownloadTemplate={handleDownloadSampleTemplate}
        savePending={saveSftpMutation.isPending}
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
