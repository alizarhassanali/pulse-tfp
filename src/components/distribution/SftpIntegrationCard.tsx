import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  History,
  ChevronDown,
  Calendar,
  FileText,
  Download,
  Info,
  Send,
  Link2,
  Settings2,
} from 'lucide-react';
import { SftpSyncHistoryModal, SftpSyncLog } from './SftpSyncHistoryModal';

interface Event {
  id: string;
  name: string;
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

interface SftpIntegrationCardProps {
  events: Event[];
  loading: boolean;
  syncLogs: SftpSyncLog[];
  profileTimezone?: string;
  // SFTP state
  sftpHost: string;
  setSftpHost: (v: string) => void;
  sftpPort: string;
  setSftpPort: (v: string) => void;
  sftpUsername: string;
  setSftpUsername: (v: string) => void;
  sftpPassword: string;
  setSftpPassword: (v: string) => void;
  sftpPath: string;
  setSftpPath: (v: string) => void;
  sftpEventMapping: string;
  setSftpEventMapping: (v: string) => void;
  sftpChannelRule: string;
  setSftpChannelRule: (v: string) => void;
  sftpScheduleDays: string[];
  setSftpScheduleDays: (v: string[] | ((prev: string[]) => string[])) => void;
  sftpScheduleTime: string;
  setSftpScheduleTime: (v: string) => void;
  sftpTimezone: string;
  setSftpTimezone: (v: string) => void;
  sftpFileFormat: string;
  setSftpFileFormat: (v: string) => void;
  sftpStatus: 'connected' | 'disconnected' | 'error';
  sftpLastSync: string | null;
  // Template state
  emailSubject: string;
  setEmailSubject: (v: string) => void;
  emailBody: string;
  setEmailBody: (v: string) => void;
  smsBody: string;
  setSmsBody: (v: string) => void;
  // Actions
  onTestConnection: () => void;
  onSave: () => void;
  onDownloadTemplate: () => void;
  savePending: boolean;
}

export function SftpIntegrationCard(props: SftpIntegrationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSyncHistory, setShowSyncHistory] = useState(false);
  const isConnected = props.sftpStatus === 'connected';

  const prevPending = useRef(props.savePending);
  useEffect(() => {
    if (prevPending.current && !props.savePending) {
      setIsOpen(false);
    }
    prevPending.current = props.savePending;
  }, [props.savePending]);

  const scheduleLabel = props.sftpScheduleDays.length > 0
    ? `${props.sftpScheduleDays.map(d => d.slice(0, 3)).join(', ')} at ${props.sftpScheduleTime}`
    : 'No schedule';

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className={cn(
          "shadow-soft transition-all duration-200",
          isConnected ? "border-l-4 border-l-success border-border/50" : "border-l-4 border-l-muted border-border/50"
        )}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center",
                    isConnected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  )}>
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">SFTP Import</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Automatically import contacts from your SFTP server on a schedule
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {isConnected && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 mr-2">
                              {props.syncLogs.slice(0, 5).map((log) => (
                                <span
                                  key={log.id}
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    log.status === 'success' && 'bg-success',
                                    log.status === 'partial' && 'bg-warning',
                                    log.status === 'failed' && 'bg-destructive',
                                    log.status === 'running' && 'bg-info',
                                  )}
                                />
                              ))}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="text-xs">
                              Last 5 syncs: {props.syncLogs.filter(l => l.status === 'success').length} successful
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Badge variant={isConnected ? "default" : "outline"} className={cn(
                      "text-xs",
                      isConnected && "bg-success/10 text-success border-success/30"
                    )}>
                      {isConnected ? 'Connected' : props.sftpStatus === 'error' ? 'Error' : 'Disconnected'}
                    </Badge>
                  </div>
                  <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                </div>
              </div>
              {isConnected && !isOpen && (
                <p className="text-xs text-muted-foreground ml-12 mt-1">
                  Schedule: {scheduleLabel}
                </p>
              )}
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {props.loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Tabs defaultValue="connection" className="w-full">
                  <TabsList className="w-full justify-start mb-6">
                    <TabsTrigger value="connection" className="gap-2">
                      <Link2 className="h-3.5 w-3.5" />
                      Connection
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="gap-2">
                      <Settings2 className="h-3.5 w-3.5" />
                      Schedule & Mapping
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-2">
                      <Send className="h-3.5 w-3.5" />
                      Templates
                    </TabsTrigger>
                  </TabsList>

                  {/* Connection Tab */}
                  <TabsContent value="connection" className="space-y-6 mt-0">
                    {/* Connection Status Banner */}
                    <div className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      isConnected ? "bg-success/5 border border-success/20" : 
                      props.sftpStatus === 'error' ? "bg-destructive/5 border border-destructive/20" :
                      "bg-muted/30"
                    )}>
                      <div className="flex items-center gap-3">
                        {isConnected ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : props.sftpStatus === 'error' ? (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {isConnected ? 'Connected' : props.sftpStatus === 'error' ? 'Connection Error' : 'Not Connected'}
                          </p>
                          {props.sftpLastSync && (
                            <p className="text-xs text-muted-foreground">Last sync: {new Date(props.sftpLastSync).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isConnected && (
                          <Button variant="outline" size="sm" onClick={() => setShowSyncHistory(true)}>
                            <History className="h-4 w-4 mr-2" />
                            View History
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={props.onTestConnection}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Test Connection
                        </Button>
                      </div>
                    </div>

                    {/* SFTP Credentials */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>SFTP Host</Label>
                        <Input value={props.sftpHost} onChange={(e) => props.setSftpHost(e.target.value)} placeholder="sftp.yourserver.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Port</Label>
                        <Input value={props.sftpPort} onChange={(e) => props.setSftpPort(e.target.value)} placeholder="22" />
                      </div>
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input value={props.sftpUsername} onChange={(e) => props.setSftpUsername(e.target.value)} placeholder="sftp_user" />
                      </div>
                      <div className="space-y-2">
                        <Label>Password / Key</Label>
                        <Input
                          type="password"
                          value={props.sftpPassword}
                          onChange={(e) => props.setSftpPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Remote Path</Label>
                        <Input value={props.sftpPath} onChange={(e) => props.setSftpPath(e.target.value)} placeholder="/uploads/contacts" />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Schedule & Mapping Tab */}
                  <TabsContent value="schedule" className="space-y-6 mt-0">
                    {/* Schedule */}
                    <div className="space-y-4">
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
                                variant={props.sftpScheduleDays.includes(day) ? 'default' : 'outline'}
                                className="cursor-pointer capitalize"
                                onClick={() => {
                                  props.setSftpScheduleDays((prev: string[]) =>
                                    prev.includes(day) ? prev.filter((d: string) => d !== day) : [...prev, day]
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
                          <Input type="time" value={props.sftpScheduleTime} onChange={(e) => props.setSftpScheduleTime(e.target.value)} />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Timezone</Label>
                          <Select value={props.sftpTimezone} onValueChange={props.setSftpTimezone}>
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
                            IANA: {props.sftpTimezone}
                            {props.profileTimezone === props.sftpTimezone && ' (from your profile)'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Event & Channel Mapping */}
                    <div className="border-t pt-6 space-y-4">
                      <h4 className="font-medium">Event & Channel Mapping</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Trigger Event</Label>
                          <Select value={props.sftpEventMapping} onValueChange={props.setSftpEventMapping}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select event to trigger" />
                            </SelectTrigger>
                            <SelectContent>
                              {props.events.map((event) => (
                                <SelectItem key={event.id} value={event.id}>
                                  {event.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Channel Rule</Label>
                          <Select value={props.sftpChannelRule} onValueChange={props.setSftpChannelRule}>
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

                    {/* File Format */}
                    <div className="border-t pt-6 space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        File Format & Template
                      </h4>

                      <div className="p-4 bg-muted/30 rounded-lg flex gap-3">
                        <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Required fields:</strong> first_name, last_name, and either email OR phone</p>
                          <p><strong>Optional fields:</strong> preferred_channel, location_name, external_id, contact_tags, appointment_date</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Select value={props.sftpFileFormat} onValueChange={props.setSftpFileFormat}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                            <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={props.onDownloadTemplate}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Sample Template
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Templates Tab */}
                  <TabsContent value="templates" className="space-y-6 mt-0">
                    <p className="text-sm text-muted-foreground">
                      Configure the email and SMS content sent when contacts are imported via SFTP.
                    </p>

                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Available variables:</span>{' '}
                        {['{first_name}', '{last_name}', '{location_name}', '{brand_name}', '{survey_link}'].map(v => (
                          <code key={v} className="bg-muted px-1 rounded mr-1">{v}</code>
                        ))}
                      </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="p-4 border rounded-lg space-y-3">
                        <h5 className="font-medium text-sm">Email</h5>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Subject</Label>
                          <Input value={props.emailSubject} onChange={(e) => props.setEmailSubject(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Body</Label>
                          <Textarea
                            value={props.emailBody}
                            onChange={(e) => props.setEmailBody(e.target.value)}
                            className="min-h-[140px] font-mono text-sm"
                          />
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg space-y-3">
                        <h5 className="font-medium text-sm">SMS</h5>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Message</Label>
                          <Textarea
                            value={props.smsBody}
                            onChange={(e) => props.setSmsBody(e.target.value)}
                            className="min-h-[100px] font-mono text-sm"
                            maxLength={320}
                          />
                          <p className="text-xs text-muted-foreground">{props.smsBody.length}/320 characters</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Save Button - always visible */}
                  <div className="flex justify-end gap-2 pt-6 border-t mt-6">
                    <Button variant="outline" onClick={props.onTestConnection}>
                      Test Connection
                    </Button>
                    <Button className="btn-coral" onClick={props.onSave} disabled={props.savePending}>
                      {props.savePending ? 'Saving...' : 'Save SFTP Configuration'}
                    </Button>
                  </div>
                </Tabs>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Sync History Modal */}
      <SftpSyncHistoryModal
        open={showSyncHistory}
        onOpenChange={setShowSyncHistory}
        syncLogs={props.syncLogs}
      />
    </>
  );
}
