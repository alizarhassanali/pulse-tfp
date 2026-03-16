import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Code,
  Copy,
  Check,
  ChevronDown,
  Key,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  FileText,
  Zap,
  Shield,
  Send,
} from 'lucide-react';

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

interface WebhookIntegrationCardProps {
  eventId: string;
  eventLocations: Array<{ id: string; name: string }>;
  apiKeys: Array<{ id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null }>;
  // State
  webhookEmailSubject: string;
  setWebhookEmailSubject: (v: string) => void;
  webhookEmailBody: string;
  setWebhookEmailBody: (v: string) => void;
  webhookSmsBody: string;
  setWebhookSmsBody: (v: string) => void;
  newKeyName: string;
  setNewKeyName: (v: string) => void;
  generatedKey: string | null;
  setGeneratedKey: (v: string | null) => void;
  showGeneratedKey: boolean;
  setShowGeneratedKey: (v: boolean) => void;
  // Actions
  onCopyEventId: () => void;
  onCopyEndpoint: () => void;
  onCopyLocationId: (id: string) => void;
  onGenerateApiKey: () => void;
  onCopyApiKey: (key: string) => void;
  onRevokeKey: (keyId: string) => void;
  onSaveTemplates: () => void;
  copiedEventId: boolean;
  copiedEndpoint: boolean;
  copiedLocationId: string | null;
  generatePending: boolean;
  savePending: boolean;
}

export function WebhookIntegrationCard(props: WebhookIntegrationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeKeyCount = props.apiKeys.length;
  const isConfigured = activeKeyCount > 0;

  const prevPending = useRef(props.savePending);
  useEffect(() => {
    if (prevPending.current && !props.savePending) {
      setIsOpen(false);
    }
    prevPending.current = props.savePending;
  }, [props.savePending]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "shadow-soft transition-all duration-200",
        isConfigured ? "border-l-4 border-l-success border-border/50" : "border-l-4 border-l-muted border-border/50"
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center",
                  isConfigured ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                )}>
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Webhook / API Trigger</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Trigger surveys via API calls from your CRM or other systems
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isConfigured ? "default" : "outline"} className={cn(
                  "text-xs",
                  isConfigured && "bg-success/10 text-success border-success/30"
                )}>
                  {isConfigured ? `${activeKeyCount} key${activeKeyCount !== 1 ? 's' : ''} active` : 'Not configured'}
                </Badge>
                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <Tabs defaultValue="setup" className="w-full">
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="setup" className="gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  Setup
                </TabsTrigger>
                <TabsTrigger value="authentication" className="gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  Authentication
                  {activeKeyCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs px-1.5">{activeKeyCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="templates" className="gap-2">
                  <Send className="h-3.5 w-3.5" />
                  Templates
                </TabsTrigger>
              </TabsList>

              {/* Setup Tab */}
              <TabsContent value="setup" className="space-y-6 mt-0">
                {/* How It Works - Horizontal Stepper */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { step: 1, title: 'Copy Event ID', desc: 'Identify which survey to trigger' },
                    { step: 2, title: 'Generate API Key', desc: 'Authenticate your requests' },
                    { step: 3, title: 'Send Contact Data', desc: 'POST to our endpoint' },
                    { step: 4, title: 'Track Responses', desc: 'View in Sent Logs' },
                  ].map((item) => (
                    <div key={item.step} className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/30">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold mb-2">
                        {item.step}
                      </div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Event ID */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                  <Label className="text-sm font-medium">Event ID for this Survey</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono break-all">
                      {props.eventId}
                    </code>
                    <Button variant="outline" size="sm" onClick={props.onCopyEventId}>
                      {props.copiedEventId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Use this ID in your webhook payload to trigger this event</p>
                </div>

                {/* Location IDs */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Location IDs for this Event</Label>
                  {props.eventLocations.length > 0 ? (
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
                          {props.eventLocations.map((location) => (
                            <tr key={location.id} className="border-t">
                              <td className="px-4 py-2">{location.name}</td>
                              <td className="px-4 py-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                  {location.id.slice(0, 8)}...{location.id.slice(-4)}
                                </code>
                              </td>
                              <td className="px-4 py-2">
                                <Button variant="ghost" size="sm" onClick={() => props.onCopyLocationId(location.id)}>
                                  {props.copiedLocationId === location.id ? (
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
                    <Button variant="outline" size="sm" onClick={props.onCopyEndpoint}>
                      {props.copiedEndpoint ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                      <h5 className="font-medium text-xs uppercase tracking-wide text-foreground">Required Fields</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li><code className="text-xs bg-muted px-1 rounded">event_id</code> — UUID of the survey event</li>
                        <li><code className="text-xs bg-muted px-1 rounded">location_id</code> — UUID of the location</li>
                        <li><code className="text-xs bg-muted px-1 rounded">contact.first_name</code> — First name</li>
                        <li><code className="text-xs bg-muted px-1 rounded">contact.last_name</code> — Last name</li>
                        <li><code className="text-xs bg-muted px-1 rounded">contact.email</code> OR <code className="text-xs bg-muted px-1 rounded">contact.phone</code></li>
                      </ul>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                      <h5 className="font-medium text-xs uppercase tracking-wide text-foreground">Optional Fields</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li><code className="text-xs bg-muted px-1 rounded">contact.preferred_channel</code> — email, sms, both</li>
                        <li><code className="text-xs bg-muted px-1 rounded">contact.preferred_language</code> — Language code</li>
                        <li><code className="text-xs bg-muted px-1 rounded">contact.tags</code> — Array of tag names</li>
                        <li><code className="text-xs bg-muted px-1 rounded">contact.external_id</code> — Your system ID</li>
                        <li><code className="text-xs bg-muted px-1 rounded">scheduling.type</code> — immediate or delayed</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <h5 className="font-medium text-xs uppercase tracking-wide text-foreground">Behavior</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Contacts are upserted: existing contacts (matched by email/phone) are updated, new ones are created</li>
                      <li>• Brand context is automatically inherited from the event</li>
                      <li>• Tags are created on-the-fly if they don't already exist</li>
                      <li>• Event throttle rules are respected (duplicates within throttle window are skipped)</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Authentication Tab */}
              <TabsContent value="authentication" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-medium">API Keys</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Include your API key in the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization: Bearer {'<your-key>'}</code> header.
                  </p>

                  {/* Generated Key Banner */}
                  {props.generatedKey && (
                    <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-warning" />
                        <p className="font-medium text-sm text-warning">New API Key Generated</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Copy this key now. It will not be shown again.
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono break-all">
                          {props.showGeneratedKey ? props.generatedKey : '••••••••••••••••••••••••••••••••'}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => props.setShowGeneratedKey(!props.showGeneratedKey)}>
                          {props.showGeneratedKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => props.onCopyApiKey(props.generatedKey!)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => props.setGeneratedKey(null)}>
                        Done
                      </Button>
                    </div>
                  )}

                  {/* Existing Keys List */}
                  {props.apiKeys.length > 0 ? (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Your API Keys</Label>
                      <div className="border rounded-lg divide-y">
                        {props.apiKeys.map((key) => (
                          <div key={key.id} className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors">
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
                              onClick={() => props.onRevokeKey(key.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg border-dashed">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                        <Key className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium">No API keys yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Generate a key below to start sending webhook requests</p>
                    </div>
                  )}

                  {/* Generate New Key Form */}
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <Label className="text-sm font-medium">Generate New API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Key name (e.g., Production CRM)"
                        value={props.newKeyName}
                        onChange={(e) => props.setNewKeyName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={props.onGenerateApiKey}
                        disabled={props.generatePending || !props.newKeyName.trim()}
                      >
                        {props.generatePending ? (
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
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Configure the email and SMS content sent when surveys are triggered via API.
                  </p>

                  {/* Available Variables */}
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Available variables:</span>{' '}
                      {['{first_name}', '{last_name}', '{brand_name}', '{location_name}', '{location_phone}', '{survey_link}', '{unsubscribe_link}'].map(v => (
                        <code key={v} className="bg-muted px-1 rounded mr-1">{v}</code>
                      ))}
                    </p>
                  </div>

                  {/* Email Template */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <h5 className="font-medium text-sm">Email</h5>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Subject</Label>
                      <Input
                        value={props.webhookEmailSubject}
                        onChange={(e) => props.setWebhookEmailSubject(e.target.value)}
                        placeholder="How was your recent visit?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Body</Label>
                      <Textarea
                        value={props.webhookEmailBody}
                        onChange={(e) => props.setWebhookEmailBody(e.target.value)}
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
                        value={props.webhookSmsBody}
                        onChange={(e) => props.setWebhookSmsBody(e.target.value)}
                        className="min-h-[100px] font-mono text-sm"
                        placeholder="Hi {first_name}, how was your visit?"
                      />
                      <p className="text-xs text-muted-foreground">
                        {props.webhookSmsBody.length}/320 characters
                        {props.webhookSmsBody.length > 320 && (
                          <span className="text-destructive ml-2">
                            (Will be split into {Math.ceil(props.webhookSmsBody.length / 320)} messages)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={props.onSaveTemplates}
                    disabled={props.savePending}
                    className="btn-coral"
                  >
                    {props.savePending ? 'Saving...' : 'Save Message Templates'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
